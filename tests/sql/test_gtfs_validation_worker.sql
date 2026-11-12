insert into public.dakar_admin_staged_datasets (
  dataset_id, dataset_version, operator, source, source_type, date_source,
  verified_at, valid_from, valid_until, confidence, service_status, validity_status,
  archive_bucket, archive_object_path, manifest_object_path, archive_sha256,
  archive_bytes, manifest_sha256, record_count, validation_report,
  integrity_status, review_status, publication_status
) values (
  'worker-smoke-test', 'synthetic-v1', 'Synthetic test only', 'CI fixture',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT', 'dakar-gtfs-staging',
  'worker-smoke-test/hash/feed.zip', 'worker-smoke-test/hash/manifest.json',
  repeat('a', 64), 128, repeat('b', 64), '{}'::jsonb, '{}'::jsonb,
  'PENDING_SERVER_CHECK', 'PENDING_REVIEW', 'NOT_PUBLISHED'
);

set request.jwt.claim.role = 'service_role';

do $$
declare
  claimed record;
  completed boolean;
  stored public.dakar_admin_staged_datasets%rowtype;
  report jsonb := jsonb_build_object(
    'dataset', jsonb_build_object('sha256', repeat('a', 64)),
    'structure_valid', true,
    'production_ready', false,
    'counts', jsonb_build_object('errors', 0, 'warnings', 0),
    'tables', jsonb_build_object('stops.txt', 2),
    'issues', jsonb_build_array()
  );
begin
  select * into claimed
  from public.claim_dakar_gtfs_validation(900);

  if claimed.dataset_id <> 'worker-smoke-test' then
    raise exception 'Worker did not claim the expected staged dataset';
  end if;

  completed := public.complete_dakar_gtfs_validation(
    claimed.dataset_id,
    claimed.lease_token,
    claimed.archive_sha256,
    report,
    'ci-smoke-test'
  );

  if completed is not true then
    raise exception 'Worker could not finalize a hash-bound validation report';
  end if;

  select * into stored
  from public.dakar_admin_staged_datasets
  where dataset_id = 'worker-smoke-test';

  if stored.integrity_status <> 'OK'
     or stored.review_status <> 'PENDING_REVIEW'
     or stored.publication_status <> 'NOT_PUBLISHED'
     or stored.record_count <> '{"stops.txt": 2}'::jsonb
     or stored.validation_lease_token is not null then
    raise exception 'Validation completion changed an unsafe status or failed to store its report';
  end if;
end;
$$;
