-- Synthetic PostgreSQL-only tests for retryable GTFS worker failure handling.
-- No live Supabase project, Storage bucket or transport data is touched.

insert into public.dakar_admin_staged_datasets (
  dataset_id, dataset_version, operator, source, source_type, date_source,
  verified_at, valid_from, valid_until, confidence, service_status, validity_status,
  archive_bucket, archive_object_path, manifest_object_path, archive_sha256,
  archive_bytes, manifest_sha256, record_count, validation_report,
  integrity_status, review_status, publication_status, imported_at
) values (
  'worker-retry-test', 'synthetic-v1', 'Synthetic test only', 'CI fixture',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT', 'dakar-gtfs-staging',
  'worker-retry-test/' || repeat('e', 64) || '/feed.zip',
  'worker-retry-test/' || repeat('e', 64) || '/manifest.json',
  repeat('e', 64), 128, repeat('f', 64), '{}'::jsonb, '{}'::jsonb,
  'PENDING_SERVER_CHECK', 'PENDING_REVIEW', 'NOT_PUBLISHED', now()
);

insert into auth.users (id, email, email_confirmed_at)
values ('00000000-0000-4000-8000-000000000118', 'gtfs-worker-retry-ci@example.invalid', now())
on conflict (id) do nothing;

set request.jwt.claim.role = 'authenticated';
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000118';
set request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000118","role":"authenticated","app_metadata":{"dakar_gtfs_worker":true}}';

do $$
declare
  claimed record;
  released boolean;
  stale_release boolean;
  rejected boolean;
  stored public.dakar_admin_staged_datasets%rowtype;
begin
  if has_function_privilege('anon', 'public.fail_dakar_gtfs_validation(text, uuid, text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.fail_dakar_gtfs_validation(text, uuid, text)', 'EXECUTE')
     or has_function_privilege('service_role', 'public.fail_dakar_gtfs_validation(text, uuid, text)', 'EXECUTE') then
    raise exception 'GTFS worker failure RPC permissions are not restricted to the dedicated Auth identity';
  end if;

  if has_column_privilege('service_role', 'public.dakar_admin_staged_datasets', 'validation_last_error_code', 'INSERT')
     or has_column_privilege('service_role', 'public.dakar_admin_staged_datasets', 'validation_last_error_code', 'UPDATE')
     or has_column_privilege('service_role', 'public.dakar_admin_staged_datasets', 'validation_last_error_at', 'INSERT')
     or has_column_privilege('service_role', 'public.dakar_admin_staged_datasets', 'validation_last_error_at', 'UPDATE') then
    raise exception 'Intake service_role can directly forge worker failure metadata';
  end if;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);
  rejected := false;
  begin
    perform public.fail_dakar_gtfs_validation(
      'worker-retry-test',
      gen_random_uuid(),
      'ARCHIVE_DOWNLOAD_FAILED'
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'An authenticated user without the server worker claim recorded a GTFS failure';
  end if;

  perform set_config('request.jwt.claim.role', 'service_role', true);
  rejected := false;
  begin
    perform public.fail_dakar_gtfs_validation(
      'worker-retry-test',
      gen_random_uuid(),
      'ARCHIVE_DOWNLOAD_FAILED'
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'The intake service_role credential recorded a GTFS worker failure';
  end if;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000118', true);
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000118","role":"authenticated","app_metadata":{"dakar_gtfs_worker":true}}', true);
  select * into claimed from public.claim_dakar_gtfs_validation(900);
  if not found or claimed.dataset_id is distinct from 'worker-retry-test' then
    raise exception 'The synthetic retry fixture was not claimed';
  end if;

  rejected := false;
  begin
    perform public.fail_dakar_gtfs_validation(
      claimed.dataset_id,
      claimed.lease_token,
      'invalid error text'
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Unbounded worker error text was accepted';
  end if;

  released := public.fail_dakar_gtfs_validation(
    claimed.dataset_id,
    claimed.lease_token,
    'ARCHIVE_DOWNLOAD_FAILED'
  );
  if released is not true then
    raise exception 'The current worker lease was not released';
  end if;

  select * into stored
    from public.dakar_admin_staged_datasets
   where dataset_id = 'worker-retry-test';

  if stored.integrity_status <> 'PENDING_SERVER_CHECK'
     or stored.validation_lease_token is not null
     or stored.validation_lease_until is not null
     or stored.validation_last_error_code <> 'ARCHIVE_DOWNLOAD_FAILED'
     or stored.validation_last_error_at is null
     or stored.review_status <> 'PENDING_REVIEW'
     or stored.publication_status <> 'NOT_PUBLISHED'
     or stored.validation_completed_at is not null then
    raise exception 'A retryable failure changed the quarantine or review/publication state';
  end if;

  stale_release := public.fail_dakar_gtfs_validation(
    claimed.dataset_id,
    claimed.lease_token,
    'ARCHIVE_DOWNLOAD_FAILED'
  );
  if stale_release is true then
    raise exception 'A stale worker lease released a newer or completed claim';
  end if;

  if not exists (
    select 1
      from public.dakar_admin_audit_events
     where action = 'GTFS_SERVER_VALIDATION_RETRY_QUEUED'
       and target_type = 'staged_dataset'
       and target_id = 'worker-retry-test'
       and details->>'archive_sha256' = repeat('e', 64)
       and details->>'error_code' = 'ARCHIVE_DOWNLOAD_FAILED'
       and actor_id = '00000000-0000-4000-8000-000000000118'::uuid
  ) then
    raise exception 'The retryable worker failure was not recorded with its dedicated Auth actor in the audit chain';
  end if;
end;
$$;

reset role;
