insert into public.dakar_admin_staged_datasets (
  dataset_id, dataset_version, operator, source, source_type, date_source,
  verified_at, valid_from, valid_until, confidence, service_status, validity_status,
  archive_bucket, archive_object_path, manifest_object_path, archive_sha256,
  archive_bytes, manifest_sha256, record_count, validation_report,
  integrity_status, review_status, publication_status, imported_at
) values
(
  'worker-valid-test', 'synthetic-v1', 'Synthetic test only', 'CI fixture',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT', 'dakar-gtfs-staging',
  'worker-valid-test/' || repeat('a', 64) || '/feed.zip',
  'worker-valid-test/' || repeat('a', 64) || '/manifest.json',
  repeat('a', 64), 128, repeat('b', 64), '{}'::jsonb, '{}'::jsonb,
  'PENDING_SERVER_CHECK', 'PENDING_REVIEW', 'NOT_PUBLISHED', now() - interval '2 minutes'
),
(
  'worker-invalid-test', 'synthetic-v1', 'Synthetic test only', 'CI fixture',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT', 'dakar-gtfs-staging',
  'worker-invalid-test/' || repeat('c', 64) || '/feed.zip',
  'worker-invalid-test/' || repeat('c', 64) || '/manifest.json',
  repeat('c', 64), 64, repeat('d', 64), '{}'::jsonb, '{}'::jsonb,
  'PENDING_SERVER_CHECK', 'PENDING_REVIEW', 'NOT_PUBLISHED', now() - interval '1 minute'
),
(
  'worker-failed-test', 'synthetic-v1', 'Synthetic test only', 'CI fixture',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT', 'dakar-gtfs-staging',
  'worker-failed-test/' || repeat('e', 64) || '/feed.zip',
  'worker-failed-test/' || repeat('e', 64) || '/manifest.json',
  repeat('e', 64), 96, repeat('f', 64), '{}'::jsonb, '{}'::jsonb,
  'PENDING_SERVER_CHECK', 'PENDING_REVIEW', 'NOT_PUBLISHED', now() - interval '30 seconds'
);

set request.jwt.claim.role = 'service_role';

do $$
declare
  first_job record;
  second_job record;
  reclaimed_job record;
  failed_job record;
  no_job record;
  completed boolean;
  rejected boolean;
  stored_valid public.dakar_admin_staged_datasets%rowtype;
  stored_invalid public.dakar_admin_staged_datasets%rowtype;
  valid_report jsonb;
  invalid_report jsonb;
  bad_report jsonb;
begin
  if not exists (
    select 1 from public.dakar_admin_actors
    where user_id = '11111111-1111-4111-8111-111111111111'
      and role = 'reviewer' and active = true
  ) then
    raise exception 'The confirmed synthetic reviewer was not registered';
  end if;

  if not (
    select relrowsecurity from pg_class
    where oid = 'public.dakar_admin_actors'::regclass
  ) or not (
    select relrowsecurity from pg_class
    where oid = 'public.dakar_admin_audit_events'::regclass
  ) or not (
    select relrowsecurity from pg_class
    where oid = 'public.dakar_admin_staged_datasets'::regclass
  ) or not (
    select relrowsecurity from pg_class
    where oid = 'storage.objects'::regclass
  ) then
    raise exception 'RLS is not enabled on every administrative or storage table';
  end if;

  if has_table_privilege('anon', 'public.dakar_admin_actors', 'SELECT')
     or has_table_privilege('authenticated', 'public.dakar_admin_actors', 'SELECT')
     or has_table_privilege('anon', 'public.dakar_admin_audit_events', 'SELECT')
     or has_table_privilege('authenticated', 'public.dakar_admin_audit_events', 'SELECT')
     or has_table_privilege('anon', 'public.dakar_admin_staged_datasets', 'SELECT')
     or has_table_privilege('authenticated', 'public.dakar_admin_staged_datasets', 'SELECT')
     or not has_table_privilege('service_role', 'public.dakar_admin_staged_datasets', 'SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'Administrative table grants are not service-role-only';
  end if;

  if not exists (
    select 1 from storage.buckets
    where id = 'dakar-gtfs-staging'
      and public = false
      and file_size_limit = 524288000
      and allowed_mime_types @> array['application/zip','application/json']
  ) then
    raise exception 'Private GTFS staging bucket configuration is incorrect';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'dakar_gtfs_staging_service_role_only'
      and cmd = 'ALL'
      and roles = array['service_role']::name[]
  ) then
    raise exception 'Private staging Storage policy is missing or too broad';
  end if;

  if has_function_privilege('anon', 'public.claim_dakar_gtfs_validation(integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.claim_dakar_gtfs_validation(integer)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.claim_dakar_gtfs_validation(integer)', 'EXECUTE') then
    raise exception 'Worker claim permissions are not restricted to service_role';
  end if;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  rejected := false;
  begin
    perform * from public.claim_dakar_gtfs_validation(900);
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'An authenticated role claimed a GTFS validation job';
  end if;
  perform set_config('request.jwt.claim.role', 'service_role', true);

  rejected := false;
  begin
    perform * from public.claim_dakar_gtfs_validation(30);
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'An out-of-range lease duration was accepted';
  end if;

  rejected := false;
  begin
    perform * from public.claim_dakar_gtfs_validation(null);
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'A NULL lease duration was accepted';
  end if;

  select * into first_job from public.claim_dakar_gtfs_validation(900);
  if not found or first_job.dataset_id is distinct from 'worker-valid-test' then
    raise exception 'Worker did not claim the oldest staged dataset';
  end if;
  if first_job.manifest_object_path is distinct from
       'worker-valid-test/' || repeat('a', 64) || '/manifest.json'
     or first_job.manifest_sha256 is distinct from repeat('b', 64) then
    raise exception 'Worker claim did not bind the manifest path and digest';
  end if;

  select * into second_job from public.claim_dakar_gtfs_validation(900);
  if not found or second_job.dataset_id is distinct from 'worker-invalid-test' or second_job.dataset_id = first_job.dataset_id then
    raise exception 'Sequential claims did not reserve distinct staged datasets';
  end if;
  if second_job.manifest_object_path is distinct from
       'worker-invalid-test/' || repeat('c', 64) || '/manifest.json'
     or second_job.manifest_sha256 is distinct from repeat('d', 64) then
    raise exception 'Second worker claim did not bind the manifest path and digest';
  end if;

  valid_report := jsonb_build_object(
    'schema_version', '1.0',
    'dataset', jsonb_build_object('filename', 'feed.zip', 'archive_bytes', 128, 'sha256', repeat('a', 64)),
    'validated_at', '2026-11-13T18:00:00+00:00',
    'structure_valid', true,
    'production_ready', false,
    'scope', 'GTFS Static structure only; never production approval.',
    'counts', jsonb_build_object('errors', 0, 'warnings', 0),
    'tables', jsonb_build_object('stops.txt', 2),
    'issues', '[]'::jsonb,
    'limits', jsonb_build_object(
      'max_archive_bytes', 104857600,
      'max_entries', 1000,
      'max_member_bytes', 209715200,
      'max_total_uncompressed_bytes', 524288000,
      'max_rows_per_table', 2000000,
      'max_issue_details', 200
    )
  );

  bad_report := jsonb_set(valid_report, '{counts,errors}', '1'::jsonb, true);
  rejected := false;
  begin
    perform public.complete_dakar_gtfs_validation(
      first_job.dataset_id, first_job.lease_token, first_job.archive_sha256,
      bad_report, 'dakar-gtfs-validator-v1'
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'A structurally valid report with errors was accepted';
  end if;

  completed := public.complete_dakar_gtfs_validation(
    first_job.dataset_id, first_job.lease_token, repeat('e', 64),
    valid_report, 'dakar-gtfs-validator-v1'
  );
  if completed is true then
    raise exception 'A report with a mismatched archive hash was accepted';
  end if;

  update public.dakar_admin_staged_datasets
     set validation_lease_until = now() - interval '1 second'
   where dataset_id = first_job.dataset_id;
  select * into reclaimed_job from public.claim_dakar_gtfs_validation(900);
  if not found or reclaimed_job.dataset_id is distinct from first_job.dataset_id
     or reclaimed_job.lease_token = first_job.lease_token then
    raise exception 'Expired validation lease was not safely reclaimed';
  end if;

  completed := public.complete_dakar_gtfs_validation(
    first_job.dataset_id, first_job.lease_token, first_job.archive_sha256,
    valid_report, 'dakar-gtfs-validator-v1'
  );
  if completed is true then
    raise exception 'A stale worker finalized a reclaimed validation job';
  end if;

  completed := public.complete_dakar_gtfs_validation(
    reclaimed_job.dataset_id, reclaimed_job.lease_token, reclaimed_job.archive_sha256,
    valid_report, 'dakar-gtfs-validator-v1'
  );
  if completed is not true then
    raise exception 'A valid hash- and size-bound report was not finalized';
  end if;

  invalid_report := jsonb_build_object(
    'schema_version', '1.0',
    'dataset', jsonb_build_object('filename', 'feed.zip', 'archive_bytes', 64, 'sha256', repeat('c', 64)),
    'validated_at', '2026-11-13T18:00:00+00:00',
    'structure_valid', false,
    'production_ready', false,
    'scope', 'GTFS Static structure only; never production approval.',
    'counts', jsonb_build_object('errors', 1, 'warnings', 0),
    'tables', jsonb_build_object('stops.txt', 0),
    'issues', jsonb_build_array(jsonb_build_object(
      'severity', 'ERROR', 'code', 'MISSING_REQUIRED_TABLE', 'message', 'Synthetic invalid fixture'
    )),
    'limits', jsonb_build_object(
      'max_archive_bytes', 104857600,
      'max_entries', 1000,
      'max_member_bytes', 209715200,
      'max_total_uncompressed_bytes', 524288000,
      'max_rows_per_table', 2000000,
      'max_issue_details', 200
    )
  );
  completed := public.complete_dakar_gtfs_validation(
    second_job.dataset_id, second_job.lease_token, second_job.archive_sha256,
    invalid_report, 'dakar-gtfs-validator-v1'
  );
  if completed is not true then
    raise exception 'A structurally invalid report was not stored as INVALID';
  end if;

  select * into stored_valid
  from public.dakar_admin_staged_datasets
  where dataset_id = 'worker-valid-test';
  select * into stored_invalid
  from public.dakar_admin_staged_datasets
  where dataset_id = 'worker-invalid-test';

  if stored_valid.integrity_status <> 'OK'
     or stored_invalid.integrity_status <> 'INVALID'
     or stored_valid.review_status <> 'PENDING_REVIEW'
     or stored_invalid.review_status <> 'PENDING_REVIEW'
     or stored_valid.publication_status <> 'NOT_PUBLISHED'
     or stored_invalid.publication_status <> 'NOT_PUBLISHED'
     or stored_valid.record_count <> '{"stops.txt": 2}'::jsonb
     or stored_valid.validation_lease_token is not null
     or stored_invalid.validation_lease_token is not null then
    raise exception 'Validation finalization changed review/publication state or failed to store the report';
  end if;

  select * into failed_job from public.claim_dakar_gtfs_validation(900);
  if not found or failed_job.dataset_id is distinct from 'worker-failed-test' then
    raise exception 'Worker did not claim the synthetic failure fixture';
  end if;

  if has_function_privilege('anon', 'public.fail_dakar_gtfs_validation(text,uuid,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.fail_dakar_gtfs_validation(text,uuid,text)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.fail_dakar_gtfs_validation(text,uuid,text)', 'EXECUTE') then
    raise exception 'Worker failure RPC permissions are not restricted to service_role';
  end if;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  rejected := false;
  begin
    perform public.fail_dakar_gtfs_validation(failed_job.dataset_id, failed_job.lease_token, 'ARCHIVE_DOWNLOAD_FAILED');
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'An authenticated role recorded a validation failure';
  end if;
  perform set_config('request.jwt.claim.role', 'service_role', true);

  rejected := false;
  begin
    perform public.fail_dakar_gtfs_validation(failed_job.dataset_id, failed_job.lease_token, 'invalid code');
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'An unsafe failure code was accepted';
  end if;

  completed := public.fail_dakar_gtfs_validation(
    failed_job.dataset_id, failed_job.lease_token, 'MANIFEST_SHA256_MISMATCH'
  );
  if completed is not true then
    raise exception 'A current worker failure was not recorded';
  end if;

  select * into stored_valid
  from public.dakar_admin_staged_datasets
  where dataset_id = 'worker-failed-test';
  if stored_valid.integrity_status <> 'VALIDATION_FAILED'
     or stored_valid.validation_failure_code <> 'MANIFEST_SHA256_MISMATCH'
     or stored_valid.validation_failed_at is null
     or stored_valid.validation_lease_token is not null
     or stored_valid.validation_report->>'status' <> 'VALIDATION_FAILED'
     or stored_valid.review_status <> 'PENDING_REVIEW'
     or stored_valid.publication_status <> 'NOT_PUBLISHED' then
    raise exception 'Failed validation did not remain explicitly quarantined';
  end if;

  select * into no_job from public.claim_dakar_gtfs_validation(900);
  if found then
    raise exception 'A failed quarantined dataset was automatically reclaimed';
  end if;

  rejected := false;
  begin
    update public.dakar_admin_staged_datasets
       set archive_sha256 = repeat('f', 64)
     where dataset_id = 'worker-failed-test';
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Staged archive metadata was mutable after intake';
  end if;

  rejected := false;
  begin
    update public.dakar_admin_audit_events
       set details = details || jsonb_build_object('tampered', true)
     where action = 'GTFS_SERVER_VALIDATION_FAILED';
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'The server validation audit trail was mutable';
  end if;

  if (select count(*) from public.dakar_admin_audit_events
      where action = 'GTFS_SERVER_VALIDATION_COMPLETED') <> 2
     or (select count(*) from public.dakar_admin_audit_events
      where action = 'GTFS_SERVER_VALIDATION_FAILED') <> 1 then
    raise exception 'Server validation audit events were not recorded atomically';
  end if;
end;
$$;
