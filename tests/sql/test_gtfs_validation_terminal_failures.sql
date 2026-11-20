-- Synthetic PostgreSQL tests for terminal GTFS content failures versus transient retries.
-- No live Supabase project, Storage bucket contents or transport data are touched.

insert into auth.users (id, email, email_confirmed_at)
values ('00000000-0000-4000-8000-000000000120', 'gtfs-worker-terminal-ci@example.invalid', now())
on conflict (id) do nothing;

insert into public.dakar_admin_staged_datasets (
  dataset_id, dataset_version, operator, source, source_type, date_source,
  verified_at, valid_from, valid_until, confidence, service_status, validity_status,
  archive_bucket, archive_object_path, manifest_object_path, archive_sha256,
  archive_bytes, manifest_sha256, record_count, validation_report,
  integrity_status, review_status, publication_status, imported_at
) values
(
  'synthetic-terminal-failure', 'synthetic-v1', 'Synthetic test only', 'CI fixture',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT', 'dakar-gtfs-staging',
  'synthetic-terminal-failure/' || repeat('a', 64) || '/feed.zip',
  'synthetic-terminal-failure/' || repeat('a', 64) || '/manifest.json',
  repeat('a', 64), 128, repeat('b', 64), '{}'::jsonb, '{}'::jsonb,
  'PENDING_SERVER_CHECK', 'PENDING_REVIEW', 'NOT_PUBLISHED', '1900-01-01T00:00:00Z'
),
(
  'synthetic-transient-failure', 'synthetic-v1', 'Synthetic test only', 'CI fixture',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT', 'dakar-gtfs-staging',
  'synthetic-transient-failure/' || repeat('c', 64) || '/feed.zip',
  'synthetic-transient-failure/' || repeat('c', 64) || '/manifest.json',
  repeat('c', 64), 128, repeat('d', 64), '{}'::jsonb, '{}'::jsonb,
  'PENDING_SERVER_CHECK', 'PENDING_REVIEW', 'NOT_PUBLISHED', '1901-01-01T00:00:00Z'
);

set request.jwt.claim.role = 'authenticated';
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000120';
set request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000120","role":"authenticated","app_metadata":{"dakar_gtfs_worker":true}}';

do $terminal_failure_test$
declare
  claimed record;
  released boolean;
begin
  select * into claimed from public.claim_dakar_gtfs_validation(900);
  if not found or claimed.dataset_id is distinct from 'synthetic-terminal-failure' then
    raise exception 'The synthetic terminal-failure dataset was not claimed first';
  end if;

  released := public.fail_dakar_gtfs_validation(
    claimed.dataset_id,
    claimed.lease_token,
    'ARCHIVE_SHA256_MISMATCH'
  );
  if released is not true then
    raise exception 'The trusted worker could not record a terminal archive hash mismatch';
  end if;
end;
$terminal_failure_test$;

do $terminal_failure_assert$
declare
  stored public.dakar_admin_staged_datasets%rowtype;
begin
  select * into stored from public.dakar_admin_staged_datasets
   where dataset_id = 'synthetic-terminal-failure';
  if stored.integrity_status <> 'INVALID'
     or stored.validation_lease_token is not null
     or stored.validation_lease_until is not null
     or stored.validation_last_error_code <> 'ARCHIVE_SHA256_MISMATCH'
     or stored.validation_last_error_at is null
     or stored.validation_completed_at is null
     or stored.validation_report <> '{}'::jsonb
     or stored.review_status <> 'PENDING_REVIEW'
     or stored.publication_status <> 'NOT_PUBLISHED' then
    raise exception 'A terminal integrity failure did not remain invalid and quarantined';
  end if;
  if not exists (
    select 1 from public.dakar_admin_audit_events
     where action = 'GTFS_SERVER_VALIDATION_REJECTED'
       and target_type = 'staged_dataset'
       and target_id = 'synthetic-terminal-failure'
       and details->>'error_code' = 'ARCHIVE_SHA256_MISMATCH'
       and details->>'integrity_status' = 'INVALID'
       and actor_id = '00000000-0000-4000-8000-000000000120'::uuid
  ) then
    raise exception 'The terminal integrity failure was not recorded in the audit chain';
  end if;
end;
$terminal_failure_assert$;

do $transient_failure_test$
declare
  claimed record;
  released boolean;
begin
  select * into claimed from public.claim_dakar_gtfs_validation(900);
  if not found or claimed.dataset_id is distinct from 'synthetic-transient-failure' then
    raise exception 'The synthetic transient-failure dataset was not claimed after the terminal row';
  end if;

  released := public.fail_dakar_gtfs_validation(
    claimed.dataset_id,
    claimed.lease_token,
    'ARCHIVE_DOWNLOAD_FAILED'
  );
  if released is not true then
    raise exception 'The trusted worker could not release a transient download failure';
  end if;
end;
$transient_failure_test$;

do $transient_failure_assert$
declare
  stored public.dakar_admin_staged_datasets%rowtype;
begin
  select * into stored from public.dakar_admin_staged_datasets
   where dataset_id = 'synthetic-transient-failure';
  if stored.integrity_status <> 'PENDING_SERVER_CHECK'
     or stored.validation_lease_token is not null
     or stored.validation_lease_until is not null
     or stored.validation_last_error_code <> 'ARCHIVE_DOWNLOAD_FAILED'
     or stored.validation_last_error_at is null
     or stored.validation_completed_at is not null
     or stored.review_status <> 'PENDING_REVIEW'
     or stored.publication_status <> 'NOT_PUBLISHED' then
    raise exception 'A transient worker failure did not return to private quarantine';
  end if;
  if not exists (
    select 1 from public.dakar_admin_audit_events
     where action = 'GTFS_SERVER_VALIDATION_RETRY_QUEUED'
       and target_type = 'staged_dataset'
       and target_id = 'synthetic-transient-failure'
       and details->>'error_code' = 'ARCHIVE_DOWNLOAD_FAILED'
       and details->>'integrity_status' = 'PENDING_SERVER_CHECK'
       and actor_id = '00000000-0000-4000-8000-000000000120'::uuid
  ) then
    raise exception 'The transient failure was not recorded in the audit chain';
  end if;
end;
$transient_failure_assert$;

reset role;
delete from public.dakar_admin_staged_datasets
 where dataset_id in ('synthetic-terminal-failure', 'synthetic-transient-failure');
