-- Bind the trusted worker to both staged objects and record failed attempts explicitly.
-- This migration touches only Dakar Bus administrative staging metadata.

alter table public.dakar_admin_staged_datasets
  drop constraint if exists dakar_admin_staged_datasets_integrity_status_check;

alter table public.dakar_admin_staged_datasets
  add constraint dakar_admin_staged_datasets_integrity_status_check
  check (integrity_status in ('PENDING_SERVER_CHECK','VALIDATING','OK','INVALID','VALIDATION_FAILED'));

alter table public.dakar_admin_staged_datasets
  add column if not exists validation_failure_code text,
  add column if not exists validation_failed_at timestamptz;

alter table public.dakar_admin_staged_datasets
  add constraint dakar_admin_staged_datasets_validation_failure_state_check
  check (
    (
      integrity_status = 'VALIDATION_FAILED'
      and validation_failure_code ~ '^[A-Z0-9_]{1,80}$'
      and validation_failed_at is not null
    )
    or (
      integrity_status <> 'VALIDATION_FAILED'
      and validation_failure_code is null
      and validation_failed_at is null
    )
  );

-- The archive and manifest are one immutable staging unit. Only server-validation,
-- review, and publication state may change after the intake insert.
create or replace function public.dakar_admin_guard_staged_dataset_metadata()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if row(
    new.dataset_id,
    new.dataset_version,
    new.operator,
    new.source,
    new.source_type,
    new.source_url,
    new.date_source,
    new.verified_at,
    new.valid_from,
    new.valid_until,
    new.confidence,
    new.service_status,
    new.validity_status,
    new.archive_bucket,
    new.archive_object_path,
    new.manifest_object_path,
    new.archive_sha256,
    new.archive_bytes,
    new.manifest_sha256,
    new.imported_by,
    new.imported_at,
    new.created_at
  ) is distinct from row(
    old.dataset_id,
    old.dataset_version,
    old.operator,
    old.source,
    old.source_type,
    old.source_url,
    old.date_source,
    old.verified_at,
    old.valid_from,
    old.valid_until,
    old.confidence,
    old.service_status,
    old.validity_status,
    old.archive_bucket,
    old.archive_object_path,
    old.manifest_object_path,
    old.archive_sha256,
    old.archive_bytes,
    old.manifest_sha256,
    old.imported_by,
    old.imported_at,
    old.created_at
  ) then
    raise exception 'Dakar Bus staged source metadata and object references are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists dakar_admin_staged_dataset_metadata_immutable
  on public.dakar_admin_staged_datasets;
create trigger dakar_admin_staged_dataset_metadata_immutable
  before update on public.dakar_admin_staged_datasets
  for each row execute function public.dakar_admin_guard_staged_dataset_metadata();

-- The worker must receive the manifest's canonical path and stored digest together
-- with the archive claim. Drop/recreate because PostgreSQL cannot change a table
-- function's return type through CREATE OR REPLACE.
drop function if exists public.claim_dakar_gtfs_validation(integer);

create function public.claim_dakar_gtfs_validation(p_lease_seconds integer default 900)
returns table (
  dataset_id text,
  archive_bucket text,
  archive_object_path text,
  archive_sha256 text,
  archive_bytes bigint,
  manifest_object_path text,
  manifest_sha256 text,
  lease_token uuid
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
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
      and staged.manifest_sha256 ~ '^[a-f0-9]{64}$'
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
            staged.archive_sha256, staged.archive_bytes, staged.manifest_object_path,
            staged.manifest_sha256, staged.validation_lease_token;
end;
$$;

create or replace function public.fail_dakar_gtfs_validation(
  p_dataset_id text,
  p_lease_token uuid,
  p_failure_code text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  expected_sha text;
  attempt_count integer;
  failed_at timestamptz := now();
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  if p_failure_code is null or p_failure_code !~ '^[A-Z0-9_]{1,80}$' then
    raise exception 'invalid validation failure code';
  end if;

  select staged.archive_sha256, staged.validation_attempts
    into expected_sha, attempt_count
    from public.dakar_admin_staged_datasets as staged
   where staged.dataset_id = p_dataset_id
     and staged.integrity_status = 'VALIDATING'
     and staged.validation_lease_token = p_lease_token
     and staged.validation_lease_until > failed_at
   for update;

  if not found then
    return false;
  end if;

  update public.dakar_admin_staged_datasets
     set integrity_status = 'VALIDATION_FAILED',
         validation_failure_code = p_failure_code,
         validation_failed_at = failed_at,
         validation_report = jsonb_build_object(
           'status', 'VALIDATION_FAILED',
           'failure_code', p_failure_code,
           'failed_at', failed_at
         ),
         validation_lease_token = null,
         validation_lease_until = null
   where dataset_id = p_dataset_id
     and integrity_status = 'VALIDATING'
     and validation_lease_token = p_lease_token
     and validation_lease_until > failed_at;

  if not found then
    return false;
  end if;

  insert into public.dakar_admin_audit_events (
    actor_id, action, target_type, target_id, details
  ) values (
    null,
    'GTFS_SERVER_VALIDATION_FAILED',
    'staged_dataset',
    p_dataset_id,
    jsonb_build_object(
      'archive_sha256', expected_sha,
      'failure_code', p_failure_code,
      'validation_attempts', attempt_count
    )
  );

  return true;
end;
$$;

revoke all on function public.claim_dakar_gtfs_validation(integer) from public, anon, authenticated;
revoke all on function public.fail_dakar_gtfs_validation(text, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_dakar_gtfs_validation(integer) to service_role;
grant execute on function public.fail_dakar_gtfs_validation(text, uuid, text) to service_role;

comment on function public.claim_dakar_gtfs_validation(integer) is
  'Atomically claims one canonical private GTFS archive and its hash-bound manifest; service_role only.';
comment on function public.fail_dakar_gtfs_validation(text, uuid, text) is
  'Moves a current leased validation attempt to explicit quarantine; never approves review or publication.';
