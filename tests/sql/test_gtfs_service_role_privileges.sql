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

do $$
declare
  rejected boolean;
  forged_id text := 'privilege-forged-test';
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
