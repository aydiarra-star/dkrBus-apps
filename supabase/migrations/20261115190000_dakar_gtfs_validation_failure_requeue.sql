-- Record retryable private GTFS worker failures without declaring the feed invalid.
-- This migration changes only the administrative staging table and its trusted RPCs.
begin;

alter table public.dakar_admin_staged_datasets
  add column if not exists validation_last_error_code text,
  add column if not exists validation_last_error_at timestamptz;

alter table public.dakar_admin_staged_datasets
  drop constraint if exists dakar_admin_staged_datasets_validation_last_error_check;

alter table public.dakar_admin_staged_datasets
  add constraint dakar_admin_staged_datasets_validation_last_error_check
  check (
    (
      validation_last_error_code is null
      and validation_last_error_at is null
    )
    or (
      validation_last_error_code is not null
      and validation_last_error_code ~ '^[A-Z0-9_]{1,80}$'
      and validation_last_error_at is not null
    )
  );

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
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  if p_error_code is null or p_error_code !~ '^[A-Z0-9_]{1,80}$' then
    raise exception 'invalid worker error code';
  end if;

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
     set integrity_status = 'PENDING_SERVER_CHECK',
         validation_lease_token = null,
         validation_lease_until = null,
         validation_last_error_code = p_error_code,
         validation_last_error_at = now()
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
    null,
    'GTFS_SERVER_VALIDATION_RETRY_QUEUED',
    'staged_dataset',
    p_dataset_id,
    jsonb_build_object(
      'archive_sha256', expected_sha,
      'error_code', p_error_code,
      'validation_attempts', attempt_count
    )
  );

  return true;
end;
$$;

revoke all on function public.fail_dakar_gtfs_validation(text, uuid, text) from public, anon, authenticated;
grant execute on function public.fail_dakar_gtfs_validation(text, uuid, text) to service_role;

comment on function public.fail_dakar_gtfs_validation(text, uuid, text) is
  'Records a bounded operational worker error, releases only the current valid lease, and returns the dataset to private server-validation quarantine. It never marks a feed structurally valid or invalid.';

comment on column public.dakar_admin_staged_datasets.validation_last_error_code is
  'Last bounded operational error code from the trusted GTFS worker; not a structural validation result.';

comment on column public.dakar_admin_staged_datasets.validation_last_error_at is
  'Server timestamp for the last retryable GTFS worker failure.';

commit;
