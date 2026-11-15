-- Synthetic PostgreSQL-only tests for the strict GTFS validator report contract.
-- No live Supabase project, Storage bucket or transport data is touched.

insert into public.dakar_admin_staged_datasets (
  dataset_id, dataset_version, operator, source, source_type, date_source,
  verified_at, valid_from, valid_until, confidence, service_status, validity_status,
  archive_bucket, archive_object_path, manifest_object_path, archive_sha256,
  archive_bytes, manifest_sha256, record_count, validation_report,
  integrity_status, review_status, publication_status, imported_at
) values (
  'report-contract-test', 'synthetic-v1', 'Synthetic test only', 'CI fixture',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT', 'dakar-gtfs-staging',
  'report-contract-test/' || repeat('a', 64) || '/feed.zip',
  'report-contract-test/' || repeat('a', 64) || '/manifest.json',
  repeat('a', 64), 128, repeat('b', 64), '{}'::jsonb, '{}'::jsonb,
  'PENDING_SERVER_CHECK', 'PENDING_REVIEW', 'NOT_PUBLISHED', now()
);

set request.jwt.claim.role = 'service_role';

do $$
declare
  claimed record;
  valid_report jsonb;
  bad_report jsonb;
  rejected boolean;
  completed boolean;
  stored public.dakar_admin_staged_datasets%rowtype;
begin
  select * into claimed from public.claim_dakar_gtfs_validation(900);
  if not found or claimed.dataset_id is distinct from 'report-contract-test' then
    raise exception 'The synthetic report-contract fixture was not claimed';
  end if;

  valid_report := jsonb_build_object(
    'schema_version', '1.0',
    'dataset', jsonb_build_object(
      'filename', 'feed.zip',
      'archive_bytes', 128,
      'sha256', repeat('a', 64)
    ),
    'validated_at', '2026-11-15T18:00:00+00:00',
    'structure_valid', true,
    'production_ready', false,
    'scope', 'Supported GTFS Static structure only; no production approval.',
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

  rejected := false;
  begin
    perform public.complete_dakar_gtfs_validation(
      claimed.dataset_id, claimed.lease_token, claimed.archive_sha256,
      valid_report, 'dakar-gtfs-validator-v1'
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'An unapproved validator version was accepted';
  end if;

  bad_report := valid_report || jsonb_build_object(
    'limits', valid_report->'limits' || jsonb_build_object('unexpected', true)
  );
  rejected := false;
  begin
    perform public.complete_dakar_gtfs_validation(
      claimed.dataset_id, claimed.lease_token, claimed.archive_sha256,
      bad_report, 'dakar-gtfs-validator-v2'
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'A report with additional resource-limit keys was accepted';
  end if;

  bad_report := jsonb_set(valid_report, '{tables,stops.txt}', '2000001'::jsonb, true);
  rejected := false;
  begin
    perform public.complete_dakar_gtfs_validation(
      claimed.dataset_id, claimed.lease_token, claimed.archive_sha256,
      bad_report, 'dakar-gtfs-validator-v2'
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'A table count above the configured row limit was accepted';
  end if;

  bad_report := jsonb_set(
    valid_report,
    '{issues}',
    jsonb_build_array(jsonb_build_object(
      'severity', 'ERROR',
      'code', repeat('x', 101),
      'message', 'synthetic'
    )),
    true
  );
  rejected := false;
  begin
    perform public.complete_dakar_gtfs_validation(
      claimed.dataset_id, claimed.lease_token, claimed.archive_sha256,
      bad_report, 'dakar-gtfs-validator-v2'
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'An oversized issue code was accepted';
  end if;

  bad_report := jsonb_set(valid_report, '{validated_at}', '"2026-11-15T18:00:00"'::jsonb, true);
  rejected := false;
  begin
    perform public.complete_dakar_gtfs_validation(
      claimed.dataset_id, claimed.lease_token, claimed.archive_sha256,
      bad_report, 'dakar-gtfs-validator-v2'
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'A timezone-naive validation timestamp was accepted';
  end if;

  completed := public.complete_dakar_gtfs_validation(
    claimed.dataset_id, claimed.lease_token, claimed.archive_sha256,
    valid_report, 'dakar-gtfs-validator-v2'
  );
  if completed is not true then
    raise exception 'A valid strict validator report was not accepted';
  end if;

  select * into stored
    from public.dakar_admin_staged_datasets
   where dataset_id = 'report-contract-test';
  if stored.integrity_status <> 'OK'
     or stored.review_status <> 'PENDING_REVIEW'
     or stored.publication_status <> 'NOT_PUBLISHED'
     or stored.validation_lease_token is not null
     or stored.validation_lease_until is not null
     or stored.validator_version <> 'dakar-gtfs-validator-v2' then
    raise exception 'Strict report finalization changed review/publication state';
  end if;
end;
$$;

reset role;
