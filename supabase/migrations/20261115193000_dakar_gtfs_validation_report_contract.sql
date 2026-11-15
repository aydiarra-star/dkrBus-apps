-- Enforce the same bounded validator-report contract at the database boundary.
-- This migration changes only the private GTFS staging validation RPC.
begin;

create or replace function public.complete_dakar_gtfs_validation(
  p_dataset_id text,
  p_lease_token uuid,
  p_archive_sha256 text,
  p_report jsonb,
  p_validator_version text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  is_valid boolean;
  expected_sha text;
  expected_bytes bigint;
  error_count numeric;
  warning_count numeric;
  issue_error_count numeric;
  issue_warning_count numeric;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;

  if jsonb_typeof(p_report) is distinct from 'object'
     or p_report->>'schema_version' is distinct from '1.0'
     or jsonb_typeof(p_report->'dataset') is distinct from 'object'
     or p_report->'dataset'->>'filename' is distinct from 'feed.zip'
     or jsonb_typeof(p_report->'dataset'->'archive_bytes') is distinct from 'number'
     or jsonb_typeof(p_report->'structure_valid') is distinct from 'boolean'
     or p_report->>'production_ready' is distinct from 'false'
     or jsonb_typeof(p_report->'counts') is distinct from 'object'
     or jsonb_typeof(p_report->'counts'->'errors') is distinct from 'number'
     or jsonb_typeof(p_report->'counts'->'warnings') is distinct from 'number'
     or coalesce(p_report->'counts'->>'errors', '') !~ '^(0|[1-9][0-9]*)$'
     or coalesce(p_report->'counts'->>'warnings', '') !~ '^(0|[1-9][0-9]*)$'
     or jsonb_typeof(p_report->'tables') is distinct from 'object'
     or jsonb_typeof(p_report->'issues') is distinct from 'array'
     or jsonb_array_length(p_report->'issues') > 200
     or jsonb_typeof(p_report->'limits') is distinct from 'object'
     or p_report->'limits' is distinct from jsonb_build_object(
       'max_archive_bytes', 104857600,
       'max_entries', 1000,
       'max_member_bytes', 209715200,
       'max_total_uncompressed_bytes', 524288000,
       'max_rows_per_table', 2000000,
       'max_issue_details', 200
     )
     or coalesce(p_report->>'validated_at', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$'
     or length(coalesce(p_report->>'scope', '')) not between 1 and 1000
     or p_validator_version is distinct from 'dakar-gtfs-validator-v2' then
    raise exception 'invalid trusted validation report';
  end if;

  begin
    perform (p_report->>'validated_at')::timestamptz;
  exception when others then
    raise exception 'invalid trusted validation timestamp';
  end;

  if exists (
    select 1
    from jsonb_each(p_report->'tables') as entry(table_name, row_count)
    where entry.table_name not in (
      'agency.txt', 'stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt',
      'calendar.txt', 'calendar_dates.txt', 'frequencies.txt', 'shapes.txt',
      'transfers.txt', 'feed_info.txt'
    )
       or jsonb_typeof(entry.row_count) is distinct from 'number'
       or entry.row_count::text !~ '^(0|[1-9][0-9]*)$'
  ) then
    raise exception 'invalid trusted validation table counts';
  end if;

  if exists (
    select 1
    from jsonb_each(p_report->'tables') as entry(table_name, row_count)
    where entry.row_count::text::numeric > 2000000
  ) then
    raise exception 'trusted validation table count exceeds the configured row limit';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_report->'issues') as item(value)
    where jsonb_typeof(item.value) is distinct from 'object'
       or coalesce(item.value->>'severity', '') not in ('ERROR', 'WARNING')
       or length(coalesce(item.value->>'code', '')) not between 1 and 100
       or length(coalesce(item.value->>'message', '')) not between 1 and 500
       or (
         item.value ? 'table'
         and length(coalesce(item.value->>'table', '')) not between 1 and 100
       )
       or (
         item.value ? 'row'
         and (
           jsonb_typeof(item.value->'row') is distinct from 'number'
           or coalesce(item.value->>'row', '') !~ '^[1-9][0-9]*$'
         )
       )
  ) then
    raise exception 'invalid trusted validation issue details';
  end if;

  select
    count(*) filter (where item.value->>'severity' = 'ERROR'),
    count(*) filter (where item.value->>'severity' = 'WARNING')
    into issue_error_count, issue_warning_count
    from jsonb_array_elements(p_report->'issues') as item(value);

  error_count := (p_report->'counts'->>'errors')::numeric;
  warning_count := (p_report->'counts'->>'warnings')::numeric;
  is_valid := (p_report->>'structure_valid')::boolean;
  if is_valid is distinct from (error_count = 0)
     or error_count < issue_error_count
     or warning_count < issue_warning_count then
    raise exception 'validation status or issue counts do not match the report';
  end if;

  select staged.archive_sha256, staged.archive_bytes
    into expected_sha, expected_bytes
    from public.dakar_admin_staged_datasets as staged
   where staged.dataset_id = p_dataset_id
     and staged.integrity_status = 'VALIDATING'
     and staged.validation_lease_token = p_lease_token
     and staged.validation_lease_until > now()
   for update;

  if not found then
    return false;
  end if;
  if p_archive_sha256 is distinct from expected_sha
     or p_report->'dataset'->>'sha256' is distinct from expected_sha
     or p_report->'dataset'->>'archive_bytes' is distinct from expected_bytes::text then
    return false;
  end if;

  update public.dakar_admin_staged_datasets
     set integrity_status = case when is_valid then 'OK' else 'INVALID' end,
         validation_report = p_report,
         record_count = p_report->'tables',
         validator_version = p_validator_version,
         validation_completed_at = now(),
         validation_lease_token = null,
         validation_lease_until = null
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
    'GTFS_SERVER_VALIDATION_COMPLETED',
    'staged_dataset',
    p_dataset_id,
    jsonb_build_object(
      'archive_sha256', expected_sha,
      'integrity_status', case when is_valid then 'OK' else 'INVALID' end,
      'validator_version', p_validator_version,
      'errors', error_count,
      'warnings', warning_count
    )
  );

  return true;
end;
$$;

revoke all on function public.complete_dakar_gtfs_validation(text, uuid, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.complete_dakar_gtfs_validation(text, uuid, text, jsonb, text) to service_role;

comment on function public.complete_dakar_gtfs_validation(text, uuid, text, jsonb, text) is
  'Stores only a hash-, size-, version- and resource-bound GTFS validator report; review and publication remain separate.';

commit;
