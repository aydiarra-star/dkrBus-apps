-- Distinguish permanent content-integrity failures from retryable worker outages.
-- A malformed or hash-mismatched object is rejected by the trusted worker and
-- remains quarantined; transient network/runtime failures continue to be retried.
begin;

create or replace function public.fail_dakar_gtfs_validation(
  p_dataset_id text,
  p_lease_token uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  expected_sha text;
  attempt_count integer;
  terminal_failure boolean;
begin
  if not public.dakar_gtfs_worker_authorized() then
    raise exception 'dedicated GTFS worker identity required';
  end if;
  if p_error_code is null or p_error_code !~ '^[A-Z0-9_]{1,80}$' then
    raise exception 'invalid worker error code';
  end if;

  terminal_failure := p_error_code = any (array[
    'ARCHIVE_SIZE_MISMATCH',
    'ARCHIVE_SHA256_INVALID',
    'ARCHIVE_SHA256_MISMATCH',
    'ARCHIVE_NOT_ZIP',
    'ARCHIVE_TOO_LARGE',
    'MANIFEST_SIZE_INVALID',
    'MANIFEST_TOO_LARGE',
    'MANIFEST_SHA256_INVALID',
    'MANIFEST_SHA256_MISMATCH',
    'MANIFEST_CONTENT_INVALID',
    'MANIFEST_SCHEMA_INVALID',
    'MANIFEST_DATASET_MISMATCH',
    'MANIFEST_GOVERNANCE_STATE_INVALID',
    'MANIFEST_ARCHIVE_METADATA_INVALID',
    'MANIFEST_ARCHIVE_MISMATCH',
    'CLAIM_ARCHIVE_SIZE_INVALID',
    'CLAIM_BUCKET_INVALID',
    'CLAIM_DATASET_ID_INVALID',
    'CLAIM_LEASE_TOKEN_INVALID',
    'CLAIM_MANIFEST_PATH_INVALID',
    'CLAIM_MANIFEST_SHA256_INVALID',
    'CLAIM_METADATA_INCOMPLETE',
    'CLAIM_OBJECT_PATH_INVALID',
    'CLAIM_SHA256_INVALID',
    'UNSAFE_ARCHIVE_OBJECT_REFERENCE'
  ]::text[]);

  select staged.archive_sha256, staged.validation_attempts
    into expected_sha, attempt_count
    from public.dakar_admin_staged_datasets as staged
   where staged.dataset_id = p_dataset_id
     and staged.integrity_status = 'VALIDATING'
     and staged.validation_lease_token = p_lease_token
     and staged.validation_lease_until > now()
   for update;

  if not found then
    return false;
  end if;

  update public.dakar_admin_staged_datasets
     set integrity_status = case
           when terminal_failure then 'INVALID'
           else 'PENDING_SERVER_CHECK'
         end,
         validation_lease_token = null,
         validation_lease_until = null,
         validation_last_error_code = p_error_code,
         validation_last_error_at = now(),
         validation_completed_at = case when terminal_failure then now() else null end
   where dataset_id = p_dataset_id
     and integrity_status = 'VALIDATING'
     and validation_lease_token = p_lease_token
     and validation_lease_until > now();

  if not found then
    return false;
  end if;

  insert into public.dakar_admin_audit_events (
    actor_id, action, target_type, target_id, details
  ) values (
    auth.uid(),
    case when terminal_failure
      then 'GTFS_SERVER_VALIDATION_REJECTED'
      else 'GTFS_SERVER_VALIDATION_RETRY_QUEUED'
    end,
    'staged_dataset',
    p_dataset_id,
    jsonb_build_object(
      'archive_sha256', expected_sha,
      'error_code', p_error_code,
      'validation_attempts', attempt_count,
      'integrity_status', case when terminal_failure then 'INVALID' else 'PENDING_SERVER_CHECK' end
    )
  );

  return true;
end;
$$;

revoke all on function public.fail_dakar_gtfs_validation(text, uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.fail_dakar_gtfs_validation(text, uuid, text) to authenticated;

comment on function public.fail_dakar_gtfs_validation(text, uuid, text) is
  'Dedicated GTFS worker only. Permanent archive/manifest integrity failures become INVALID in quarantine; transient worker/network failures return to PENDING_SERVER_CHECK. Neither outcome approves or publishes a dataset.';

commit;
