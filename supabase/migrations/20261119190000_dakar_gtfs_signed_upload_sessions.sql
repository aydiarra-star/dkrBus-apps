-- Track short-lived signed upload grants separately from the server-validation queue.
-- A dataset enters dakar_admin_staged_datasets only after the server confirms the
-- uploaded object's actual Storage size and writes the canonical manifest object.
begin;

update storage.buckets
   set public = false,
       file_size_limit = 104857600,
       allowed_mime_types = array['application/zip', 'application/json']
 where id = 'dakar-gtfs-staging';

do $bucket_guard$
begin
  if not exists (select 1 from storage.buckets where id = 'dakar-gtfs-staging') then
    raise exception 'The private dakar-gtfs-staging bucket must exist before signed uploads are enabled';
  end if;
end;
$bucket_guard$;

create table if not exists public.dakar_admin_gtfs_upload_sessions (
  upload_id uuid primary key default gen_random_uuid(),
  dataset_id text not null unique
    check (dataset_id ~ '^[a-z0-9][a-z0-9-]{0,119}$'),
  dataset_version text not null,
  operator text not null,
  source text not null,
  source_type text not null
    check (source_type in ('OFFICIAL','GTFS','VERIFIED','COMMUNITY','UNKNOWN')),
  source_url text,
  date_source text not null,
  verified_at timestamptz not null,
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  service_status text not null
    check (service_status in ('ACTIVE','PLANNED','SUSPENDED','UNKNOWN')),
  validity_status text not null
    check (validity_status in ('NOT_YET_VALID','CURRENT','STALE')),
  archive_object_path text not null unique,
  manifest_object_path text not null unique,
  archive_sha256 text not null check (archive_sha256 ~ '^[a-f0-9]{64}$'),
  archive_bytes bigint not null check (archive_bytes between 1 and 104857600),
  manifest_sha256 text not null check (manifest_sha256 ~ '^[a-f0-9]{64}$'),
  manifest_text text not null
    check (octet_length(manifest_text) between 2 and 1048576)
    check (jsonb_typeof(manifest_text::jsonb) = 'object'),
  imported_by uuid references auth.users(id) on delete restrict,
  state text not null default 'UPLOAD_PENDING'
    check (state in ('UPLOAD_PENDING','FINALIZED','FAILED')),
  expires_at timestamptz not null,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  check (valid_until > valid_from),
  check (archive_object_path = dataset_id || '/' || archive_sha256 || '/feed.zip'),
  check (manifest_object_path = dataset_id || '/' || archive_sha256 || '/manifest.json'),
  check ((state = 'FINALIZED') = (finalized_at is not null)),
  check (expires_at >= created_at + interval '26 hours 15 minutes')
);

create index if not exists dakar_admin_gtfs_upload_sessions_expiry_idx
  on public.dakar_admin_gtfs_upload_sessions (expires_at)
  where state in ('UPLOAD_PENDING','FAILED');

-- Atomically reserve a short finalization window before the Edge Function reads
-- Storage metadata or writes the canonical manifest. The database clock and
-- expires_at predicate serialize this with cleanup's expired-session selection.
create or replace function public.protect_dakar_gtfs_upload_session_for_finalize(
  p_upload_id uuid,
  p_guard_seconds integer default 600
)
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  protected_until timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Dakar Bus intake service role required';
  end if;
  if p_guard_seconds is null or p_guard_seconds < 60 or p_guard_seconds > 3600 then
    raise exception 'finalization guard duration out of range';
  end if;

  update public.dakar_admin_gtfs_upload_sessions
     set expires_at = greatest(expires_at, now() + make_interval(secs => p_guard_seconds))
   where upload_id = p_upload_id
     and state = 'UPLOAD_PENDING'
     and expires_at > now()
   returning expires_at into protected_until;

  return protected_until;
end;
$$;

revoke all on function public.protect_dakar_gtfs_upload_session_for_finalize(uuid, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.protect_dakar_gtfs_upload_session_for_finalize(uuid, integer)
  to service_role;

comment on function public.protect_dakar_gtfs_upload_session_for_finalize(uuid, integer) is
  'Intake service_role only. Atomically extends a still-live upload session while finalization runs, preventing expired-session cleanup from racing Storage/DB registration.';

alter table public.dakar_admin_gtfs_upload_sessions enable row level security;
revoke all on table public.dakar_admin_gtfs_upload_sessions from public, anon, authenticated, service_role;
grant select, insert, update, delete
  on table public.dakar_admin_gtfs_upload_sessions to service_role;

comment on table public.dakar_admin_gtfs_upload_sessions is
  'Private, short-lived signed-upload grants. Only the Dakar Bus intake service_role may manage sessions; no application or worker identity has direct access. Sessions are not validation attestations and never enter the worker queue until finalization creates a quarantined staged dataset.';

comment on column public.dakar_admin_gtfs_upload_sessions.manifest_text is
  'Exact UTF-8 JSON text whose SHA-256 is recorded; retained byte-for-byte so the private manifest object can be reproduced and verified by the dedicated worker.';

commit;
