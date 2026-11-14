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
);

set request.jwt.claim.role = 'service_role';

do $$
declare
  first_job record;
  second_job record;
  reclaimed_job record;
  completed boolean;
  rejected boolean;
  stored_valid public.dakar_admin_staged_datasets%rowtype;
  stored_invalid public.dakar_admin_staged_datasets%rowtype;
  valid_report jsonb;
  invalid_report jsonb;
  bad_report jsonb;
  audit_state public.dakar_admin_audit_chain_state%rowtype;
  latest_audit public.dakar_admin_audit_events%rowtype;
  appended_audit public.dakar_admin_audit_events%rowtype;
begin
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

  select * into second_job from public.claim_dakar_gtfs_validation(900);
  if not found or second_job.dataset_id is distinct from 'worker-invalid-test' or second_job.dataset_id = first_job.dataset_id then
    raise exception 'Sequential claims did not reserve distinct staged datasets';
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
      bad_report, 'dakar-gtfs-validator-v2'
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'A structurally valid report with errors was accepted';
  end if;

  completed := public.complete_dakar_gtfs_validation(
    first_job.dataset_id, first_job.lease_token, repeat('e', 64),
    valid_report, 'dakar-gtfs-validator-v2'
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
    valid_report, 'dakar-gtfs-validator-v2'
  );
  if completed is true then
    raise exception 'A stale worker finalized a reclaimed validation job';
  end if;

  completed := public.complete_dakar_gtfs_validation(
    reclaimed_job.dataset_id, reclaimed_job.lease_token, reclaimed_job.archive_sha256,
    valid_report, 'dakar-gtfs-validator-v2'
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
    invalid_report, 'dakar-gtfs-validator-v2'
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

  if (select count(*) from public.dakar_admin_audit_events
      where action = 'GTFS_SERVER_VALIDATION_COMPLETED') <> 2 then
    raise exception 'Server validation audit events were not recorded atomically';
  end if;

  if not (
    select relrowsecurity
      from pg_class
     where oid = 'public.dakar_admin_audit_chain_state'::regclass
  ) then
    raise exception 'Audit chain state must have RLS enabled';
  end if;
  if has_table_privilege('anon', 'public.dakar_admin_audit_chain_state', 'SELECT')
     or has_table_privilege('authenticated', 'public.dakar_admin_audit_chain_state', 'SELECT')
     or has_table_privilege('service_role', 'public.dakar_admin_audit_chain_state', 'SELECT') then
    raise exception 'Audit chain state must not be directly readable by application roles';
  end if;
  if has_function_privilege('anon', 'public.dakar_admin_sha256(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.dakar_admin_sha256(text)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.dakar_admin_sha256(text)', 'EXECUTE') then
    raise exception 'Audit SHA-256 helper permissions are incorrect';
  end if;

  if exists (
    with ordered as (
      select chain_sequence,
             previous_hash,
             lag(event_hash) over (order by chain_sequence) as prior_event_hash
        from public.dakar_admin_audit_events
    )
    select 1
      from ordered
     where previous_hash is distinct from coalesce(prior_event_hash, repeat('0', 64))
  ) then
    raise exception 'Audit hash-chain links are not continuous';
  end if;

  if not exists (
    select 1
      from public.dakar_admin_audit_events
     where action = 'LEGACY_AUDIT_BACKFILL_TEST'
       and chain_sequence = 1
       and previous_hash = repeat('0', 64)
       and event_hash ~ '^[a-f0-9]{64}$'
  ) then
    raise exception 'A pre-existing legacy audit event was not backfilled into the hash chain';
  end if;

  if exists (
    select 1
      from public.dakar_admin_audit_events as event
     where event.event_hash is distinct from public.dakar_admin_sha256(
       jsonb_build_object(
         'chain_sequence', event.chain_sequence,
         'id', event.id,
         'actor_id', event.actor_id,
         'action', event.action,
         'target_type', event.target_type,
         'target_id', event.target_id,
         'details', event.details,
         'created_at', event.created_at,
         'previous_hash', event.previous_hash
       )::text
     )
  ) then
    raise exception 'An audit event hash does not match its immutable payload';
  end if;

  select * into latest_audit
    from public.dakar_admin_audit_events
   order by chain_sequence desc
   limit 1;
  select * into audit_state
    from public.dakar_admin_audit_chain_state
   where singleton = true;
  if audit_state.last_chain_sequence is distinct from latest_audit.chain_sequence
     or audit_state.last_event_hash is distinct from latest_audit.event_hash then
    raise exception 'Audit chain head does not match the latest event';
  end if;

  -- Caller-supplied chain values are ignored and recomputed by the BEFORE INSERT trigger.
  insert into public.dakar_admin_audit_events (
    actor_id, action, target_type, target_id, details,
    chain_sequence, previous_hash, event_hash
  ) values (
    null, 'AUDIT_CHAIN_OVERRIDE_TEST', 'test', 'synthetic',
    jsonb_build_object('fixture', true),
    999, repeat('f', 64), repeat('f', 64)
  )
  returning * into appended_audit;
  if appended_audit.chain_sequence <> latest_audit.chain_sequence + 1
     or appended_audit.previous_hash is distinct from latest_audit.event_hash
     or appended_audit.event_hash = repeat('f', 64) then
    raise exception 'Audit chain accepted caller-supplied sequence or hashes';
  end if;

  rejected := false;
  begin
    update public.dakar_admin_audit_events
       set details = '{}'::jsonb
     where id = appended_audit.id;
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Audit event update was not rejected';
  end if;

  rejected := false;
  begin
    delete from public.dakar_admin_audit_events
     where id = appended_audit.id;
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Audit event deletion was not rejected';
  end if;

  rejected := false;
  begin
    execute 'truncate table public.dakar_admin_audit_events';
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Audit event truncation was not rejected';
  end if;
end;
$$;

  ) then
    raise exception 'A pre-existing legacy audit event was not backfilled into the hash chain';
  end if;

  if exists (
    select 1
      from public.dakar_admin_audit_events as event
     where event.event_hash is distinct from public.dakar_admin_sha256(
       jsonb_build_object(
         'chain_sequence', event.chain_sequence,
         'id', event.id,
         'actor_id', event.actor_id,
         'action', event.action,
         'target_type', event.target_type,
         'target_id', event.target_id,
         'details', event.details,
         'created_at', event.created_at,
         'previous_hash', event.previous_hash
       )::text
     )
  ) then
    raise exception 'An audit event hash does not match its immutable payload';
  end if;

  select * into latest_audit
    from public.dakar_admin_audit_events
   order by chain_sequence desc
   limit 1;
  select * into audit_state
    from public.dakar_admin_audit_chain_state
   where singleton = true;
  if audit_state.last_chain_sequence is distinct from latest_audit.chain_sequence
     or audit_state.last_event_hash is distinct from latest_audit.event_hash then
    raise exception 'Audit chain head does not match the latest event';
  end if;

  -- Caller-supplied chain values are ignored and recomputed by the BEFORE INSERT trigger.
  insert into public.dakar_admin_audit_events (
    actor_id, action, target_type, target_id, details,
    chain_sequence, previous_hash, event_hash
  ) values (
    null, 'AUDIT_CHAIN_OVERRIDE_TEST', 'test', 'synthetic',
    jsonb_build_object('fixture', true),
    999, repeat('f', 64), repeat('f', 64)
  )
  returning * into appended_audit;
  if appended_audit.chain_sequence <> latest_audit.chain_sequence + 1
     or appended_audit.previous_hash is distinct from latest_audit.event_hash
     or appended_audit.event_hash = repeat('f', 64) then
    raise exception 'Audit chain accepted caller-supplied sequence or hashes';
  end if;

  rejected := false;
  begin
    update public.dakar_admin_audit_events
       set details = '{}'::jsonb
     where id = appended_audit.id;
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Audit event update was not rejected';
  end if;

  rejected := false;
  begin
    delete from public.dakar_admin_audit_events
     where id = appended_audit.id;
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Audit event deletion was not rejected';
  end if;

  rejected := false;
  begin
    execute 'truncate table public.dakar_admin_audit_events';
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'Audit event truncation was not rejected';
  end if;
end;
$$;
