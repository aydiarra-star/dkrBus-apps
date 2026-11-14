-- Verifies the service-role privilege boundary in isolated PostgreSQL CI only.
-- No live Supabase project, Storage bucket or transport data is touched.

do $$
declare
  protected_column text;
begin
  if not has_table_privilege('service_role', 'public.dakar_admin_staged_datasets', 'SELECT')
     or has_table_privilege('service_role', 'public.dakar_admin_staged_datasets', 'INSERT')
     or has_table_privilege('service_role', 'public.dakar_admin_staged_datasets', 'UPDATE')
     or has_table_privilege('service_role', 'public.dakar_admin_staged_datasets', 'DELETE')
     or has_table_privilege('service_role', 'public.dakar_admin_staged_datasets', 'TRUNCATE') then
    raise exception 'Staged dataset table privileges are broader than intended';
  end if;

  if not has_column_privilege('service_role', 'public.dakar_admin_staged_datasets', 'dataset_id', 'INSERT')
     or not has_column_privilege('service_role', 'public.dakar_admin_staged_datasets', 'archive_sha256', 'INSERT')
     or not has_column_privilege('service_role', 'public.dakar_admin_staged_datasets', 'imported_by', 'INSERT') then
    raise exception 'The intake service role is missing a required safe insert column';
  end if;

  foreach protected_column in array array[
    'record_count',
    'validation_report',
    'integrity_status',
    'review_status',
    'publication_status',
    'validation_attempts',
    'validation_lease_token',
    'validation_lease_until',
    'validator_version',
    'validation_completed_at'
  ] loop
    if has_column_privilege(
      'service_role',
      'public.dakar_admin_staged_datasets',
      protected_column,
      'INSERT'
    ) then
      raise exception 'service_role can insert protected column %', protected_column;
    end if;
  end loop;

  if has_table_privilege('service_role', 'public.dakar_admin_actors', 'INSERT')
     or has_table_privilege('service_role', 'public.dakar_admin_actors', 'UPDATE')
     or has_table_privilege('service_role', 'public.dakar_admin_actors', 'DELETE')
     or not has_table_privilege('service_role', 'public.dakar_admin_actors', 'SELECT') then
    raise exception 'Actor registry privileges are not read-only';
  end if;

  if has_table_privilege('service_role', 'public.dakar_admin_audit_events', 'SELECT')
     or has_table_privilege('service_role', 'public.dakar_admin_audit_events', 'INSERT')
     or has_table_privilege('service_role', 'public.dakar_admin_audit_events', 'UPDATE')
     or has_table_privilege('service_role', 'public.dakar_admin_audit_events', 'DELETE') then
    raise exception 'Audit ledger is directly accessible to service_role';
  end if;

  if not has_function_privilege('service_role', 'public.claim_dakar_gtfs_validation(integer)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.complete_dakar_gtfs_validation(text, uuid, text, jsonb, text)', 'EXECUTE') then
    raise exception 'Trusted worker RPC permissions were accidentally removed';
  end if;
end;
$$;

-- Supabase service_role bypasses RLS in production; mirror that property in this isolated test.
alter role service_role bypassrls;
set role service_role;
set request.jwt.claim.role = 'service_role';

insert into public.dakar_admin_staged_datasets (
  dataset_id, dataset_version, operator, source, source_type, date_source,
  verified_at, valid_from, valid_until, confidence, service_status, validity_status,
  archive_bucket, archive_object_path, manifest_object_path, archive_sha256,
  archive_bytes, manifest_sha256, imported_by
) values (
  'privilege-boundary-test',
  'synthetic-v1',
  'Synthetic test only',
  'CI fixture',
  'UNKNOWN',
  'CI',
  now(),
  now() - interval '1 day',
  now() + interval '1 day',
  0.5,
  'UNKNOWN',
  'CURRENT',
  'dakar-gtfs-staging',
  'privilege-boundary-test/' || repeat('a', 64) || '/feed.zip',
  'privilege-boundary-test/' || repeat('a', 64) || '/manifest.json',
  repeat('a', 64),
  128,
  repeat('b', 64),
  null
);

do $
declare
  rejected boolean;
  forged_id text := 'privilege-forged-test';
  claimed_job record;
  validation_report jsonb;
  completed boolean;
begin
  if not exists (
    select 1
      from public.dakar_admin_staged_datasets
     where dataset_id = 'privilege-boundary-test'
       and integrity_status = 'PENDING_SERVER_CHECK'
       and review_status = 'PENDING_REVIEW'
       and publication_status = 'NOT_PUBLISHED'
       and validation_report->>'status' = 'PENDING_SERVER_VALIDATION'
       and record_count = '{}'::jsonb
       and validation_lease_token is null
       and validation_lease_until is null
  ) then
    raise exception 'Safe intake insert did not receive quarantine defaults';
  end if;

  -- The trusted RPC remains callable by service_role and owns the protected update.
  select * into claimed_job
    from public.claim_dakar_gtfs_validation(900);
  if not found or claimed_job.dataset_id is distinct from 'privilege-boundary-test' then
    raise exception 'service_role could not claim the synthetic validation job through the trusted RPC';
  end if;

  validation_report := jsonb_build_object(
    'schema_version', '1.0',
    'dataset', jsonb_build_object(
      'filename', 'feed.zip',
      'archive_bytes', 128,
      'sha256', repeat('a', 64)
    ),
    'validated_at', '2026-11-14T19:00:00+00:00',
    'structure_valid', false,
    'production_ready', false,
    'scope', 'Synthetic privilege test only; never production approval.',
    'counts', jsonb_build_object('errors', 1, 'warnings', 0),
    'tables', '{}'::jsonb,
    'issues', jsonb_build_array(jsonb_build_object(
      'severity', 'ERROR',
      'code', 'SYNTHETIC_INVALID_FIXTURE',
      'message', 'Synthetic test report'
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
    claimed_job.dataset_id,
    claimed_job.lease_token,
    claimed_job.archive_sha256,
    validation_report,
    'dakar-gtfs-validator-v2'
  );
  if completed is not true or not exists (
    select 1
      from public.dakar_admin_staged_datasets
     where dataset_id = 'privilege-boundary-test'
       and integrity_status = 'INVALID'
       and review_status = 'PENDING_REVIEW'
       and publication_status = 'NOT_PUBLISHED'
       and validation_lease_token is null
  ) then
    raise exception 'Trusted worker RPC did not finalize while direct table updates were restricted';
  end if;

  rejected := false;
  begin
    update public.dakar_admin_staged_datasets
       set integrity_status = 'OK'
     where dataset_id = 'privilege-boundary-test';
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Direct service_role UPDATE changed a validation status';
  end if;

  rejected := false;
  begin
    insert into public.dakar_admin_staged_datasets (
      dataset_id, dataset_version, operator, source, source_type, date_source,
      verified_at, valid_from, valid_until, confidence, service_status, validity_status,
      archive_bucket, archive_object_path, manifest_object_path, archive_sha256,
      archive_bytes, manifest_sha256, integrity_status
    ) values (
      forged_id, 'synthetic-v1', 'Synthetic test only', 'CI fixture', 'UNKNOWN', 'CI',
      now(), now() - interval '1 day', now() + interval '1 day', 0.5, 'UNKNOWN', 'CURRENT',
      'dakar-gtfs-staging',
      forged_id || '/' || repeat('c', 64) || '/feed.zip',
      forged_id || '/' || repeat('c', 64) || '/manifest.json',
      repeat('c', 64), 128, repeat('d', 64), 'OK'
    );
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Direct service_role INSERT forged an integrity status';
  end if;

  rejected := false;
  begin
    update public.dakar_admin_actors set active = false;
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then
    raise exception 'service_role changed an administrative actor';
  end if;

  rejected := false;
  begin
    insert into public.dakar_admin_audit_events (action, details)
    values ('FORGED_AUDIT_TEST', jsonb_build_object('fixture', true));
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then
    raise exception 'service_role appended directly to the audit ledger';
  end if;
end;
$$;

reset role;
