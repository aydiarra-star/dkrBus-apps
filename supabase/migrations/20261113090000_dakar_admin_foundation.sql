-- Dakar Bus administration foundation.
-- This migration is intentionally isolated from all mobility/traffic tables.
create table if not exists public.dakar_admin_actors (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null check (role in ('reviewer', 'publisher')),
  display_name text not null check (length(btrim(display_name)) between 1 and 80),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dakar_admin_actors_role_active_idx
  on public.dakar_admin_actors (role, active);

alter table public.dakar_admin_actors enable row level security;
revoke all on table public.dakar_admin_actors from anon, authenticated;
grant all on table public.dakar_admin_actors to service_role;

create table if not exists public.dakar_admin_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete restrict,
  action text not null check (length(btrim(action)) between 1 and 80),
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object'),
  previous_hash text,
  event_hash text,
  created_at timestamptz not null default now()
);

create index if not exists dakar_admin_audit_events_created_at_idx
  on public.dakar_admin_audit_events (created_at desc);
create index if not exists dakar_admin_audit_events_actor_idx
  on public.dakar_admin_audit_events (actor_id, created_at desc);

alter table public.dakar_admin_audit_events enable row level security;
revoke all on table public.dakar_admin_audit_events from anon, authenticated;
grant all on table public.dakar_admin_audit_events to service_role;

-- Keep the audit trail append-only, including for accidental privileged writes.
create or replace function public.dakar_admin_reject_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  raise exception 'Dakar Bus audit events are append-only';
end;
$$;

revoke all on function public.dakar_admin_reject_audit_mutation() from public, anon, authenticated;

drop trigger if exists dakar_admin_audit_events_no_update on public.dakar_admin_audit_events;
create trigger dakar_admin_audit_events_no_update
  before update or delete on public.dakar_admin_audit_events
  for each row execute function public.dakar_admin_reject_audit_mutation();

-- The first confirmed Dakar Bus Auth identity is registered as reviewer.
-- No publisher is created here; that requires a separate named person.
insert into public.dakar_admin_actors (user_id, role, display_name)
select id, 'reviewer', 'DTech'
from auth.users
where lower(email) = lower('diztech.contact@gmail.com')
  and email_confirmed_at is not null
on conflict (user_id) do nothing;
