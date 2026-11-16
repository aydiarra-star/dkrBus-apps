-- Separate the trusted GTFS validator from the intake Edge Function credential.
-- A dedicated Supabase Auth user must carry app_metadata.dakar_gtfs_worker=true.
-- No user, secret, live database, or staged dataset is created by this migration.
begin;

create or replace function public.dakar_gtfs_worker_authorized()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select coalesce(auth.role(), '') = 'authenticated'
     and auth.uid() is not null
     and coalesce(auth.jwt() -> 'app_metadata' ->> 'dakar_gtfs_worker', 'false') = 'true';
$$;

-- This helper reveals only whether the current signed JWT has the server-managed
-- worker claim. It contains no secret and is used by RLS policies for all roles.
revoke all on function public.dakar_gtfs_worker_authorized() from public;
grant execute on function public.dakar_gtfs_worker_authorized() to public;

create or replace function public.claim_dakar_gtfs_validation(p_lease_seconds integer default 900)
returns table (
  dataset_id text,
  archive_bucket text,
  archive_object_path text,
  archive_sha256 text,
  archive_bytes bigint,
  lease_token uuid
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.dakar_gtfs_worker_authorized() then
    raise exception 'service role required';
  end if;
  if p_lease_seconds is null or p_lease_seconds < 60 or p_lease_seconds > 3600 then
    raise exception 'lease duration out of range';
  end if;

  return query
  with candidate as (
    select staged.dataset_id
    from public.dakar_admin_staged_datasets as staged
    where (
        staged.integrity_status = 'PENDING_SERVER_CHECK'
        or (
          staged.integrity_status = 'VALIDATING'
          and (staged.validation_lease_until is null or staged.validation_lease_until < now())
        )
      )
      and staged.archive_bucket = 'dakar-gtfs-staging'
      and staged.archive_sha256 ~ '^[a-f0-9]{64}$'
      and staged.archive_bytes between 1 and 104857600
      and staged.archive_object_path = staged.dataset_id || '/' || staged.archive_sha256 || '/feed.zip'
      and staged.manifest_object_path = staged.dataset_id || '/' || staged.archive_sha256 || '/manifest.json'
    order by staged.imported_at asc, staged.dataset_id asc
    for update skip locked
    limit 1
  )
  update public.dakar_admin_staged_datasets as staged
  set integrity_status = 'VALIDATING',
      validation_attempts = staged.validation_attempts + 1,
      validation_lease_token = gen_random_uuid(),
      validation_lease_until = now() + make_interval(secs => p_lease_seconds)
  from candidate
  where staged.dataset_id = candidate.dataset_id
  returning staged.dataset_id, staged.archive_bucket, staged.archive_object_path,
            staged.archive_sha256, staged.archive_bytes, staged.validation_lease_token;
end;
$$;

create or replace function public.complete_dakar_gtfs_validation(
  p_dataset_id text,
  p_lease_token uuid,
  p_archive_sha256 text,
  p_report jsonb,
  p_validator_version text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  is_valid boolean;
  expected_sha text;
  expected_bytes bigint;
  error_count numeric;
  warning_count numeric;
begin
  if not public.dakar_gtfs_worker_authorized() then
    raise exception 'service role required';
  end if;

  if jsonb_typeof(p_report) is distinct from 'object'
     or p_report->>'schema_version' is distinct from '1.0'
     or jsonb_typeof(p_report->'dataset') is distinct from 'object'
     or p_report->'dataset'->>'filename' is distinct from 'feed.zip'
     or jsonb_typeof(p_report->'dataset'->'archive_bytes') is distinct from 'number'
     or jsonb_typeof(p_report->'structure_valid') is distinct from 'boolean'
     or p_report->>'production_ready' is distinct from 'false'
     or jsonb_typeof(p_report->'counts') is distinct from 'object'
     or jsonb_typeof(p_report->'counts'->'errors') is distinct from 'number'
     or jsonb_typeof(p_report->'counts'->'warnings') is distinct from 'number'
     or coalesce(p_report->'counts'->>'errors', '') !~ '^(0|[1-9][0-9]*)$'
     or coalesce(p_report->'counts'->>'warnings', '') !~ '^(0|[1-9][0-9]*)$'
     or jsonb_typeof(p_report->'tables') is distinct from 'object'
     or jsonb_typeof(p_report->'issues') is distinct from 'array'
     or jsonb_typeof(p_report->'limits') is distinct from 'object'
     or (p_report->'limits' @> '{
       "max_archive_bytes":104857600,
       "max_entries":1000,
       "max_member_bytes":209715200,
       "max_total_uncompressed_bytes":524288000,
       "max_rows_per_table":2000000,
       "max_issue_details":200
     }'::jsonb) is not true
     or coalesce(p_report->>'validated_at', '') = ''
     or coalesce(p_report->>'scope', '') = ''
     or p_validator_version is null
     or length(btrim(p_validator_version)) = 0 then
    raise exception 'invalid trusted validation report';
  end if;

  if exists (
    select 1
    from jsonb_each(p_report->'tables') as entry(table_name, row_count)
    where jsonb_typeof(entry.row_count) is distinct from 'number'
       or entry.row_count::text !~ '^(0|[1-9][0-9]*)$'
  ) then
    raise exception 'invalid trusted validation table counts';
  end if;

  error_count := (p_report->'counts'->>'errors')::numeric;
  warning_count := (p_report->'counts'->>'warnings')::numeric;
  is_valid := (p_report->>'structure_valid')::boolean;
  if is_valid is distinct from (error_count = 0) then
    raise exception 'validation status does not match error count';
  end if;

  select staged.archive_sha256, staged.archive_bytes
    into expected_sha, expected_bytes
    from public.dakar_admin_staged_datasets as staged
   where staged.dataset_id = p_dataset_id
     and staged.integrity_status = 'VALIDATING'
     and staged.validation_lease_token = p_lease_token
     and staged.validation_lease_until > now()
   for update;

  if not found then
    return false;
  end if;
  if p_archive_sha256 is distinct from expected_sha
     or p_report->'dataset'->>'sha256' is distinct from expected_sha
     or p_report->'dataset'->>'archive_bytes' is distinct from expected_bytes::text then
    return false;
  end if;

  update public.dakar_admin_staged_datasets
     set integrity_status = case when is_valid then 'OK' else 'INVALID' end,
         validation_report = p_report,
         record_count = p_report->'tables',
         validator_version = p_validator_version,
         validation_completed_at = now(),
         validation_lease_token = null,
         validation_lease_until = null
   where dataset_id = p_dataset_id
     and integrity_status = 'VALIDATING'
     and validation_lease_token = p_lease_token
     and validation_lease_until > now();

  if not found then
    return false;
  end if;

  insert into public.dakar_admin_audit_events (
    actor_id, action, target_type, target_id, details
  ) values (
    auth.uid(),
    'GTFS_SERVER_VALIDATION_COMPLETED',
    'staged_dataset',
    p_dataset_id,
    jsonb_build_object(
      'archive_sha256', expected_sha,
      'integrity_status', case when is_valid then 'OK' else 'INVALID' end,
      'validator_version', p_validator_version,
      'errors', error_count,
      'warnings', warning_count
    )
  );

  return true;
end;
$$;

create or replace function public.fail_dakar_gtfs_validation(
  p_dataset_id text,
  p_lease_token uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  expected_sha text;
  attempt_count integer;
begin
  if not public.dakar_gtfs_worker_authorized() then
    raise exception 'service role required';
  end if;
  if p_error_code is null or p_error_code !~ '^[A-Z0-9_]{1,80}$' then
    raise exception 'invalid worker error code';
  end if;

  select staged.archive_sha256, staged.validation_attempts
    into expected_sha, attempt_count
    from public.dakar_admin_staged_datasets as staged
   where staged.dataset_id = p_dataset_id
     and staged.integrity_status = 'VALIDATING'
     and staged.validation_lease_token = p_lease_token
     and staged.validation_lease_until > now()
   for update;

  if not found then
    return false;
  end if;

  update public.dakar_admin_staged_datasets
     set integrity_status = 'PENDING_SERVER_CHECK',
         validation_lease_token = null,
         validation_lease_until = null,
         validation_last_error_code = p_error_code,
         validation_last_error_at = now()
   where dataset_id = p_dataset_id
     and integrity_status = 'VALIDATING'
     and validation_lease_token = p_lease_token
     and validation_lease_until > now();

  if not found then
    return false;
  end if;

  insert into public.dakar_admin_audit_events (
    actor_id, action, target_type, target_id, details
  ) values (
    auth.uid(),
    'GTFS_SERVER_VALIDATION_RETRY_QUEUED',
    'staged_dataset',
    p_dataset_id,
    jsonb_build_object(
      'archive_sha256', expected_sha,
      'error_code', p_error_code,
      'validation_attempts', attempt_count
    )
  );

  return true;
end;
$$;

-- The intake Edge Function's service_role credential must not be able to claim,
-- complete, or release worker leases. Only a confirmed Auth worker identity with
-- the server-managed app_metadata claim may call these RPCs.
revoke all on function public.claim_dakar_gtfs_validation(integer) from public, anon, authenticated, service_role;
revoke all on function public.complete_dakar_gtfs_validation(text, uuid, text, jsonb, text) from public, anon, authenticated, service_role;
revoke all on function public.fail_dakar_gtfs_validation(text, uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.claim_dakar_gtfs_validation(integer) to authenticated;
grant execute on function public.complete_dakar_gtfs_validation(text, uuid, text, jsonb, text) to authenticated;
grant execute on function public.fail_dakar_gtfs_validation(text, uuid, text) to authenticated;

-- Preserve the private bucket for ordinary application roles while allowing the
-- dedicated worker to read only this bucket. Even broad permissive policies must
-- not grant the worker access to other buckets or write access to this one.
alter table storage.objects enable row level security;

drop policy if exists dakar_gtfs_staging_deny_non_bypass_roles on storage.objects;
create policy dakar_gtfs_staging_deny_non_bypass_roles
on storage.objects
as restrictive
for all
to public
using (
  bucket_id <> 'dakar-gtfs-staging'
  or public.dakar_gtfs_worker_authorized()
)
with check (
  bucket_id <> 'dakar-gtfs-staging'
  or public.dakar_gtfs_worker_authorized()
);

drop policy if exists dakar_gtfs_worker_scope on storage.objects;
create policy dakar_gtfs_worker_scope
on storage.objects
as restrictive
for all
to authenticated
using (
  not public.dakar_gtfs_worker_authorized()
  or bucket_id = 'dakar-gtfs-staging'
)
with check (
  not public.dakar_gtfs_worker_authorized()
  or bucket_id = 'dakar-gtfs-staging'
);

drop policy if exists dakar_gtfs_staging_worker_read on storage.objects;
create policy dakar_gtfs_staging_worker_read
on storage.objects
as permissive
for select
to authenticated
using (
  bucket_id = 'dakar-gtfs-staging'
  and public.dakar_gtfs_worker_authorized()
);

drop policy if exists dakar_gtfs_staging_worker_no_insert on storage.objects;
create policy dakar_gtfs_staging_worker_no_insert
on storage.objects
as restrictive
for insert
to authenticated
with check (bucket_id <> 'dakar-gtfs-staging');

drop policy if exists dakar_gtfs_staging_worker_no_update on storage.objects;
create policy dakar_gtfs_staging_worker_no_update
on storage.objects
as restrictive
for update
to authenticated
using (bucket_id <> 'dakar-gtfs-staging')
with check (bucket_id <> 'dakar-gtfs-staging');

drop policy if exists dakar_gtfs_staging_worker_no_delete on storage.objects;
create policy dakar_gtfs_staging_worker_no_delete
on storage.objects
as restrictive
for delete
to authenticated
using (bucket_id <> 'dakar-gtfs-staging');

comment on function public.dakar_gtfs_worker_authorized() is
  'True only for a signed authenticated Supabase user whose server-managed app_metadata contains dakar_gtfs_worker=true.';

comment on function public.claim_dakar_gtfs_validation(integer) is
  'Atomically claims one canonical private Dakar Bus GTFS archive; dedicated Auth worker identity only.';

comment on function public.complete_dakar_gtfs_validation(text, uuid, text, jsonb, text) is
  'Stores a strict hash- and size-bound validator report and audit event; dedicated Auth worker identity only; never approves review or publication.';

comment on function public.fail_dakar_gtfs_validation(text, uuid, text) is
  'Requeues only the current valid worker lease and records a bounded operational error; dedicated Auth worker identity only.';

commit;
