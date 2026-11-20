-- Isolated PostgreSQL tests for atomic signed-upload cleanup claims.
-- Every session below is a synthetic CI fixture; no Storage object is created.
do $cleanup_claim_schema_test$
begin
  if not exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'dakar_admin_gtfs_upload_sessions'
       and column_name = 'cleanup_lease_until'
  ) then
    raise exception 'The signed-upload cleanup lease column is missing';
  end if;

  if has_function_privilege('anon', 'public.claim_dakar_gtfs_upload_session_cleanup(uuid, integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.claim_dakar_gtfs_upload_session_cleanup(uuid, integer)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.claim_dakar_gtfs_upload_session_cleanup(uuid, integer)', 'EXECUTE') then
    raise exception 'The cleanup claim RPC is not restricted to the intake service role';
  end if;
end;
$cleanup_claim_schema_test$;

alter role service_role bypassrls;
set role service_role;
set request.jwt.claim.role = 'service_role';

delete from public.dakar_admin_gtfs_upload_sessions
 where dataset_id in (
   'synthetic-cleanup-active',
   'synthetic-cleanup-finalize-guard',
   'synthetic-cleanup-expired'
 );

insert into public.dakar_admin_gtfs_upload_sessions (
  dataset_id, dataset_version, operator, source, source_type, date_source,
  verified_at, valid_from, valid_until, confidence, service_status, validity_status,
  archive_object_path, manifest_object_path, archive_sha256, archive_bytes,
  manifest_sha256, manifest_text, expires_at, created_at
) values
(
  'synthetic-cleanup-active', 'synthetic-v1', 'Synthetic', 'CI', 'UNKNOWN', 'CI',
  now(), now() - interval '1 day', now() + interval '1 day', 0.5, 'UNKNOWN', 'CURRENT',
  'synthetic-cleanup-active/' || repeat('a',64) || '/feed.zip',
  'synthetic-cleanup-active/' || repeat('a',64) || '/manifest.json',
  repeat('a',64), 128, repeat('b',64), '{"schema_version":"1.0"}',
  now() + interval '1 day', now() - interval '1 day'
),
(
  'synthetic-cleanup-finalize-guard', 'synthetic-v1', 'Synthetic', 'CI', 'UNKNOWN', 'CI',
  now(), now() - interval '1 day', now() + interval '1 day', 0.5, 'UNKNOWN', 'CURRENT',
  'synthetic-cleanup-finalize-guard/' || repeat('c',64) || '/feed.zip',
  'synthetic-cleanup-finalize-guard/' || repeat('c',64) || '/manifest.json',
  repeat('c',64), 128, repeat('d',64), '{"schema_version":"1.0"}',
  now() + interval '1 minute', now() - interval '26 hours 15 minutes'
),
(
  'synthetic-cleanup-expired', 'synthetic-v1', 'Synthetic', 'CI', 'UNKNOWN', 'CI',
  now(), now() - interval '1 day', now() + interval '1 day', 0.5, 'UNKNOWN', 'CURRENT',
  'synthetic-cleanup-expired/' || repeat('e',64) || '/feed.zip',
  'synthetic-cleanup-expired/' || repeat('e',64) || '/manifest.json',
  repeat('e',64), 128, repeat('f',64), '{"schema_version":"1.0"}',
  now() - interval '1 minute', now() - interval '30 hours'
);

do $cleanup_claim_state_test$
declare
  claimed boolean;
  protected_until timestamptz;
begin
  claimed := public.claim_dakar_gtfs_upload_session_cleanup(
    (select upload_id from public.dakar_admin_gtfs_upload_sessions where dataset_id = 'synthetic-cleanup-active'),
    600
  );
  if claimed then
    raise exception 'A non-expired session was claimed for cleanup';
  end if;

  select public.protect_dakar_gtfs_upload_session_for_finalize(
    (select upload_id from public.dakar_admin_gtfs_upload_sessions where dataset_id = 'synthetic-cleanup-finalize-guard'),
    600
  ) into protected_until;
  if protected_until is null or protected_until < now() + interval '9 minutes' then
    raise exception 'The finalizer did not extend the still-live session';
  end if;
  claimed := public.claim_dakar_gtfs_upload_session_cleanup(
    (select upload_id from public.dakar_admin_gtfs_upload_sessions where dataset_id = 'synthetic-cleanup-finalize-guard'),
    600
  );
  if claimed then
    raise exception 'Cleanup claimed a session after finalization extended its expiry';
  end if;

  claimed := public.claim_dakar_gtfs_upload_session_cleanup(
    (select upload_id from public.dakar_admin_gtfs_upload_sessions where dataset_id = 'synthetic-cleanup-expired'),
    600
  );
  if not claimed then
    raise exception 'An expired session was not atomically claimed for cleanup';
  end if;

  select public.protect_dakar_gtfs_upload_session_for_finalize(
    (select upload_id from public.dakar_admin_gtfs_upload_sessions where dataset_id = 'synthetic-cleanup-expired'),
    600
  ) into protected_until;
  if protected_until is not null then
    raise exception 'Finalization revived a session after cleanup claimed it';
  end if;

  claimed := public.claim_dakar_gtfs_upload_session_cleanup(
    (select upload_id from public.dakar_admin_gtfs_upload_sessions where dataset_id = 'synthetic-cleanup-expired'),
    600
  );
  if claimed then
    raise exception 'A second cleanup worker stole a live cleanup lease';
  end if;

  update public.dakar_admin_gtfs_upload_sessions
     set cleanup_lease_until = now() - interval '1 second'
   where dataset_id = 'synthetic-cleanup-expired'
     and state = 'CLEANUP_PENDING';

  claimed := public.claim_dakar_gtfs_upload_session_cleanup(
    (select upload_id from public.dakar_admin_gtfs_upload_sessions where dataset_id = 'synthetic-cleanup-expired'),
    600
  );
  if not claimed then
    raise exception 'An interrupted cleanup lease could not be reclaimed after expiry';
  end if;

  if not exists (
    select 1 from public.dakar_admin_gtfs_upload_sessions
     where dataset_id = 'synthetic-cleanup-expired'
       and state = 'CLEANUP_PENDING'
       and cleanup_lease_until > now()
  ) then
    raise exception 'The reclaimed cleanup lease was not stored';
  end if;
end;
$cleanup_claim_state_test$;

reset role;
delete from public.dakar_admin_gtfs_upload_sessions
 where dataset_id in (
   'synthetic-cleanup-active',
   'synthetic-cleanup-finalize-guard',
   'synthetic-cleanup-expired'
 );
