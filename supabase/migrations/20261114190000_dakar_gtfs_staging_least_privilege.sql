-- Restrict the service-role intake credential to staging reads and safe inserts.
-- Validation, review, publication and audit writes remain behind SECURITY DEFINER RPCs.
begin;

alter table public.dakar_admin_staged_datasets
  alter column validation_report set default
    '{"status":"PENDING_SERVER_VALIDATION","note":"The upload checksum was verified. Full GTFS structure and cross-reference validation has not run."}'::jsonb;

revoke all on table public.dakar_admin_staged_datasets from service_role;
grant select on table public.dakar_admin_staged_datasets to service_role;
grant insert (
  dataset_id,
  dataset_version,
  operator,
  source,
  source_type,
  source_url,
  date_source,
  verified_at,
  valid_from,
  valid_until,
  confidence,
  service_status,
  validity_status,
  archive_bucket,
  archive_object_path,
  manifest_object_path,
  archive_sha256,
  archive_bytes,
  manifest_sha256,
  imported_by
) on table public.dakar_admin_staged_datasets to service_role;

-- The two Edge Functions only need to read the active actor record.
revoke all on table public.dakar_admin_actors from service_role;
grant select on table public.dakar_admin_actors to service_role;

-- Audit rows are appended only by the trusted validation RPC and its trigger.
revoke all on table public.dakar_admin_audit_events from service_role;

comment on table public.dakar_admin_staged_datasets is
  'Private GTFS quarantine. service_role may read and insert intake metadata only; validation, review and publication fields are writable only through trusted database functions.';

comment on table public.dakar_admin_actors is
  'Private administrative role registry. service_role has read-only access; role assignment is not exposed through application credentials.';

comment on table public.dakar_admin_audit_events is
  'Append-only administrative audit chain. Application service_role cannot directly read or write the ledger; trusted SECURITY DEFINER functions append events.';

commit;
