-- Resumable trusted validation queue for private GTFS staging.
-- This migration changes only Dakar Bus administration/staging metadata.
alter table public.dakar_admin_staged_datasets
  drop constraint if exists dakar_admin_staged_datasets_integrity_status_check;

alter table public.dakar_admin_staged_datasets
  add constraint dakar_admin_staged_datasets_integrity_status_check
  check (integrity_status in ('PENDING_SERVER_CHECK','VALIDATING','OK','INVALID'));

alter table public.dakar_admin_staged_datasets
  add column if not exists validation_attempts integer not null default 0 check (validation_attempts >= 0),
  add column if not exists validation_lease_token uuid,
  add column if not exists validation_lease_until timestamptz,
  add column if not exists validator_version text,
  add column if not exists validation_completed_at timestamptz;

create index if not exists dakar_admin_staged_datasets_validation_queue_idx
  on public.dakar_admin_staged_datasets (imported_at)
  where integrity_status = 'PENDING_SERVER_CHECK';

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
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  if p_lease_seconds < 60 or p_lease_seconds > 3600 then
    raise exception 'lease duration out of range';
  end if;

  return query
  with candidate as (
    select staged.dataset_id
    from public.dakar_admin_staged_datasets as staged
    where staged.integrity_status = 'PENDING_SERVER_CHECK'
       or (staged.integrity_status = 'VALIDATING' and staged.validation_lease_until < now())
    order by staged.imported_at asc
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
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  if jsonb_typeof(p_report) <> 'object'
     or jsonb_typeof(p_report->'structure_valid') <> 'boolean'
     or jsonb_typeof(p_report->'counts') <> 'object'
     or jsonb_typeof(p_report->'tables') <> 'object'
     or p_validator_version is null
     or length(btrim(p_validator_version)) = 0 then
    raise exception 'invalid trusted validation report';
  end if;

  select staged.archive_sha256
    into expected_sha
    from public.dakar_admin_staged_datasets as staged
   where staged.dataset_id = p_dataset_id
     and staged.integrity_status = 'VALIDATING'
     and staged.validation_lease_token = p_lease_token
     and staged.validation_lease_until > now()
   for update;

  if expected_sha is null
     or p_archive_sha256 is distinct from expected_sha
     or jsonb_typeof(p_report->'dataset') is distinct from 'object'
     or (p_report->'dataset'->>'sha256') is distinct from expected_sha then
    return false;
  end if;

  is_valid := (p_report->>'structure_valid')::boolean;

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
     and validation_lease_token = p_lease_token;

  return found;
end;
$$;

revoke all on function public.claim_dakar_gtfs_validation(integer) from public, anon, authenticated;
revoke all on function public.complete_dakar_gtfs_validation(text, uuid, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.claim_dakar_gtfs_validation(integer) to service_role;
grant execute on function public.complete_dakar_gtfs_validation(text, uuid, text, jsonb, text) to service_role;

comment on function public.claim_dakar_gtfs_validation(integer) is
  'Atomically claims one private staged GTFS archive for a trusted worker; service_role only.';
comment on function public.complete_dakar_gtfs_validation(text, uuid, text, jsonb, text) is
  'Stores a hash-bound validator report; never approves review or publication.';
