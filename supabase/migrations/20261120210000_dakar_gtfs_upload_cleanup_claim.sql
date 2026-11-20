-- Serialize expired-session cleanup against upload finalization.
-- A cleanup worker must reserve the row before inspecting references or deleting
-- private Storage objects. The finalizer's existing expiry guard and this claim
-- both update the same row, so only one side can win the expiry boundary.
begin;

alter table public.dakar_admin_gtfs_upload_sessions
  add column if not exists cleanup_lease_until timestamptz;

alter table public.dakar_admin_gtfs_upload_sessions
  drop constraint if exists dakar_admin_gtfs_upload_sessions_state_check;

alter table public.dakar_admin_gtfs_upload_sessions
  add constraint dakar_admin_gtfs_upload_sessions_state_check
  check (state in ('UPLOAD_PENDING','FINALIZED','FAILED','CLEANUP_PENDING'));

alter table public.dakar_admin_gtfs_upload_sessions
  drop constraint if exists dakar_admin_gtfs_upload_sessions_cleanup_lease_check;

alter table public.dakar_admin_gtfs_upload_sessions
  add constraint dakar_admin_gtfs_upload_sessions_cleanup_lease_check
  check ((state = 'CLEANUP_PENDING') = (cleanup_lease_until is not null));

create or replace function public.claim_dakar_gtfs_upload_session_cleanup(
  p_upload_id uuid,
  p_lease_seconds integer default 600
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  claimed_upload_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Dakar Bus intake service role required';
  end if;
  if p_lease_seconds is null or p_lease_seconds < 60 or p_lease_seconds > 3600 then
    raise exception 'cleanup lease duration out of range';
  end if;

  update public.dakar_admin_gtfs_upload_sessions
     set state = 'CLEANUP_PENDING',
         cleanup_lease_until = now() + make_interval(secs => p_lease_seconds)
   where upload_id = p_upload_id
     and expires_at <= now()
     and (
       state in ('UPLOAD_PENDING','FAILED')
       or (state = 'CLEANUP_PENDING' and cleanup_lease_until <= now())
     )
   returning upload_id into claimed_upload_id;

  return claimed_upload_id is not null;
end;
$$;

revoke all on function public.claim_dakar_gtfs_upload_session_cleanup(uuid, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.claim_dakar_gtfs_upload_session_cleanup(uuid, integer)
  to service_role;

comment on function public.claim_dakar_gtfs_upload_session_cleanup(uuid, integer) is
  'Intake service_role only. Atomically claims an expired signed-upload session for cleanup. The CLEANUP_PENDING state prevents finalization from extending or registering the session while private Storage references are checked and removed. An expiring cleanup lease permits safe retry after interruption.';

commit;
