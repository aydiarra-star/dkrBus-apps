-- Isolated PostgreSQL regression tests for private signed-upload sessions.
-- All rows and Storage metadata in this file are synthetic CI fixtures.
do $upload_session_schema_test$
begin
  if coalesce((select public from storage.buckets where id = 'dakar-gtfs-staging'), true) then
    raise exception 'The GTFS staging bucket must remain private';
  end if;
  if (select file_size_limit from storage.buckets where id = 'dakar-gtfs-staging') <> 104857600 then
    raise exception 'The GTFS staging bucket must enforce the 100 MiB archive limit';
  end if;
  if not (select allowed_mime_types @> array['application/zip','application/json']
            from storage.buckets where id = 'dakar-gtfs-staging') then
    raise exception 'The private GTFS bucket MIME allowlist is incomplete';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.dakar_admin_gtfs_upload_sessions'::regclass) then
    raise exception 'RLS is not enabled on signed-upload sessions';
  end if;
  if has_table_privilege('anon', 'public.dakar_admin_gtfs_upload_sessions', 'SELECT')
     or has_table_privilege('anon', 'public.dakar_admin_gtfs_upload_sessions', 'INSERT')
     or has_table_privilege('authenticated', 'public.dakar_admin_gtfs_upload_sessions', 'SELECT')
     or has_table_privilege('authenticated', 'public.dakar_admin_gtfs_upload_sessions', 'INSERT') then
    raise exception 'Application roles can access private signed-upload sessions';
  end if;
  if not has_table_privilege('service_role', 'public.dakar_admin_gtfs_upload_sessions', 'SELECT')
     or not has_table_privilege('service_role', 'public.dakar_admin_gtfs_upload_sessions', 'INSERT')
     or not has_table_privilege('service_role', 'public.dakar_admin_gtfs_upload_sessions', 'UPDATE')
     or not has_table_privilege('service_role', 'public.dakar_admin_gtfs_upload_sessions', 'DELETE')
     or has_table_privilege('service_role', 'public.dakar_admin_gtfs_upload_sessions', 'TRUNCATE') then
    raise exception 'The intake service role does not have the intended bounded session privileges';
  end if;
end;
$upload_session_schema_test$;

alter role service_role bypassrls;
set role service_role;
set request.jwt.claim.role = 'service_role';

insert into public.dakar_admin_gtfs_upload_sessions (
  dataset_id, dataset_version, operator, source, source_type, date_source,
  verified_at, valid_from, valid_until, confidence, service_status, validity_status,
  archive_object_path, manifest_object_path, archive_sha256, archive_bytes,
  manifest_sha256, manifest_text, imported_by, expires_at
) values (
  'synthetic-upload-session',
  'synthetic-v1',
  'Synthetic test operator',
  'CI fixture only',
  'UNKNOWN',
  'CI',
  now(),
  now() - interval '1 day',
  now() + interval '1 day',
  0.5,
  'UNKNOWN',
  'CURRENT',
  'synthetic-upload-session/' || repeat('a', 64) || '/feed.zip',
  'synthetic-upload-session/' || repeat('a', 64) || '/manifest.json',
  repeat('a', 64),
  128,
  repeat('b', 64),
  '{"schema_version":"1.0","dataset_id":"synthetic-upload-session"}',
  null,
  now() + interval '26 hours 25 minutes'
);

do $upload_session_constraint_test$
declare
  rejected boolean;
begin
  if not exists (
    select 1 from public.dakar_admin_gtfs_upload_sessions
     where dataset_id = 'synthetic-upload-session'
       and state = 'UPLOAD_PENDING'
       and archive_bytes = 128
       and archive_object_path = dataset_id || '/' || archive_sha256 || '/feed.zip'
       and manifest_object_path = dataset_id || '/' || archive_sha256 || '/manifest.json'
  ) then
    raise exception 'A canonical synthetic upload session was not stored in pending state';
  end if;

  rejected := false;
  begin
    insert into public.dakar_admin_gtfs_upload_sessions (
      dataset_id, dataset_version, operator, source, source_type, date_source,
      verified_at, valid_from, valid_until, confidence, service_status, validity_status,
      archive_object_path, manifest_object_path, archive_sha256, archive_bytes,
      manifest_sha256, manifest_text, expires_at
    ) values (
      'synthetic-too-short',
      'synthetic-v1', 'Synthetic', 'CI', 'UNKNOWN', 'CI',
      now(), now() - interval '1 day', now() + interval '1 day', 0.5, 'UNKNOWN', 'CURRENT',
      'synthetic-too-short/' || repeat('9', 64) || '/feed.zip',
      'synthetic-too-short/' || repeat('9', 64) || '/manifest.json',
      repeat('9', 64), 128, repeat('8', 64), '{"schema_version":"1.0"}',
      now() + interval '26 hours 14 minutes'
    );
  exception when check_violation then
    rejected := true;
  end;
  if not rejected then
    raise exception 'A session expiring before the full TUS cleanup window was accepted';
  end if;

  rejected := false;
  begin
    insert into public.dakar_admin_gtfs_upload_sessions (
      dataset_id, dataset_version, operator, source, source_type, date_source,
      verified_at, valid_from, valid_until, confidence, service_status, validity_status,
      archive_object_path, manifest_object_path, archive_sha256, archive_bytes,
      manifest_sha256, manifest_text, expires_at
    ) values (
      'synthetic-too-large',
      'synthetic-v1', 'Synthetic', 'CI', 'UNKNOWN', 'CI',
      now(), now() - interval '1 day', now() + interval '1 day', 0.5, 'UNKNOWN', 'CURRENT',
      'synthetic-too-large/' || repeat('c', 64) || '/feed.zip',
      'synthetic-too-large/' || repeat('c', 64) || '/manifest.json',
      repeat('c', 64), 104857601, repeat('d', 64), '{"schema_version":"1.0"}',
      now() + interval '26 hours 25 minutes'
    );
  exception when check_violation then
    rejected := true;
  end;
  if not rejected then
    raise exception 'An upload session above the 100 MiB bucket limit was accepted';
  end if;

  rejected := false;
  begin
    insert into public.dakar_admin_gtfs_upload_sessions (
      dataset_id, dataset_version, operator, source, source_type, date_source,
      verified_at, valid_from, valid_until, confidence, service_status, validity_status,
      archive_object_path, manifest_object_path, archive_sha256, archive_bytes,
      manifest_sha256, manifest_text, expires_at
    ) values (
      '../escape',
      'synthetic-v1', 'Synthetic', 'CI', 'UNKNOWN', 'CI',
      now(), now() - interval '1 day', now() + interval '1 day', 0.5, 'UNKNOWN', 'CURRENT',
      '../escape/' || repeat('e', 64) || '/feed.zip',
      '../escape/' || repeat('e', 64) || '/manifest.json',
      repeat('e', 64), 128, repeat('f', 64), '{"schema_version":"1.0"}',
      now() + interval '26 hours 25 minutes'
    );
  exception when check_violation then
    rejected := true;
  end;
  if not rejected then
    raise exception 'A path-traversal dataset identifier was accepted';
  end if;
end;
$upload_session_constraint_test$;

reset role;
delete from public.dakar_admin_gtfs_upload_sessions
 where dataset_id = 'synthetic-upload-session';
