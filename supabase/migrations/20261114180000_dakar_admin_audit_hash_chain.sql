-- Cryptographic, append-only chain for Dakar Bus administrative audit events.
-- This migration touches only administration audit metadata, never transport tables.

create schema if not exists extensions;

do $$
declare
  extension_schema text;
begin
  select n.nspname
    into extension_schema
    from pg_extension as e
    join pg_namespace as n on n.oid = e.extnamespace
   where e.extname = 'pgcrypto';

  if extension_schema is null then
    execute 'create extension pgcrypto with schema extensions';
    select n.nspname
      into extension_schema
      from pg_extension as e
      join pg_namespace as n on n.oid = e.extnamespace
     where e.extname = 'pgcrypto';
  end if;

  if extension_schema is null then
    raise exception 'pgcrypto extension is required for the Dakar Bus audit chain';
  end if;

  execute format(
    $function_ddl$
      create or replace function public.dakar_admin_sha256(p_payload text)
      returns text
      language sql
      immutable
      strict
      security definer
      set search_path = pg_catalog, %I
      as $function$
        select encode(digest(convert_to(p_payload, 'UTF8'), 'sha256'), 'hex')
      $function$
    $function_ddl$,
    extension_schema
  );
end;
$$;

create table if not exists public.dakar_admin_audit_chain_state (
  singleton boolean primary key default true check (singleton is true),
  last_chain_sequence bigint not null default 0 check (last_chain_sequence >= 0),
  last_event_hash text not null default repeat('0', 64)
    check (last_event_hash ~ '^[a-f0-9]{64}$'),
  updated_at timestamptz not null default now()
);

alter table public.dakar_admin_audit_chain_state enable row level security;
revoke all on table public.dakar_admin_audit_chain_state from public, anon, authenticated, service_role;

insert into public.dakar_admin_audit_chain_state (
  singleton, last_chain_sequence, last_event_hash
) values (
  true, 0, repeat('0', 64)
)
on conflict (singleton) do nothing;

alter table public.dakar_admin_audit_events
  add column if not exists chain_sequence bigint;

-- Existing audit rows are re-hashed in stable ID order before append-only
-- protection is restored. The new chain sequence, not the identity ID, is
-- the authoritative serialization order for concurrent future inserts.
drop trigger if exists dakar_admin_audit_events_no_update on public.dakar_admin_audit_events;

do $$
declare
  audit_row record;
  next_sequence bigint := 0;
  v_previous_hash text := repeat('0', 64);
  current_hash text;
  payload text;
begin
  for audit_row in
    select id, actor_id, action, target_type, target_id, details, created_at
      from public.dakar_admin_audit_events
     order by id
  loop
    next_sequence := next_sequence + 1;
    payload := jsonb_build_object(
      'chain_sequence', next_sequence,
      'id', audit_row.id,
      'actor_id', audit_row.actor_id,
      'action', audit_row.action,
      'target_type', audit_row.target_type,
      'target_id', audit_row.target_id,
      'details', audit_row.details,
      'created_at', audit_row.created_at,
      'previous_hash', v_previous_hash
    )::text;
    current_hash := public.dakar_admin_sha256(payload);

    update public.dakar_admin_audit_events
       set chain_sequence = next_sequence,
           previous_hash = v_previous_hash,
           event_hash = current_hash
     where id = audit_row.id;

    v_previous_hash := current_hash;
  end loop;

  update public.dakar_admin_audit_chain_state
     set last_chain_sequence = next_sequence,
         last_event_hash = v_previous_hash,
         updated_at = now()
   where singleton = true;
end;
$$;

alter table public.dakar_admin_audit_events
  alter column chain_sequence set not null,
  alter column previous_hash set not null,
  alter column event_hash set not null;

alter table public.dakar_admin_audit_events
  drop constraint if exists dakar_admin_audit_events_chain_sequence_check,
  drop constraint if exists dakar_admin_audit_events_previous_hash_check,
  drop constraint if exists dakar_admin_audit_events_event_hash_check;

alter table public.dakar_admin_audit_events
  add constraint dakar_admin_audit_events_chain_sequence_check
    check (chain_sequence > 0),
  add constraint dakar_admin_audit_events_previous_hash_check
    check (previous_hash ~ '^[a-f0-9]{64}$'),
  add constraint dakar_admin_audit_events_event_hash_check
    check (event_hash ~ '^[a-f0-9]{64}$');

create unique index if not exists dakar_admin_audit_events_chain_sequence_uidx
  on public.dakar_admin_audit_events (chain_sequence);

create or replace function public.dakar_admin_hash_audit_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  chain_state public.dakar_admin_audit_chain_state%rowtype;
  payload text;
begin
  select *
    into chain_state
    from public.dakar_admin_audit_chain_state
   where singleton = true
   for update;

  if not found then
    raise exception 'Dakar Bus audit chain state is missing';
  end if;

  new.chain_sequence := chain_state.last_chain_sequence + 1;
  new.previous_hash := chain_state.last_event_hash;
  payload := jsonb_build_object(
    'chain_sequence', new.chain_sequence,
    'id', new.id,
    'actor_id', new.actor_id,
    'action', new.action,
    'target_type', new.target_type,
    'target_id', new.target_id,
    'details', new.details,
    'created_at', new.created_at,
    'previous_hash', new.previous_hash
  )::text;
  new.event_hash := public.dakar_admin_sha256(payload);

  update public.dakar_admin_audit_chain_state
     set last_chain_sequence = new.chain_sequence,
         last_event_hash = new.event_hash,
         updated_at = now()
   where singleton = true;

  return new;
end;
$$;

revoke all on function public.dakar_admin_sha256(text) from public, anon, authenticated;
grant execute on function public.dakar_admin_sha256(text) to service_role;
revoke all on function public.dakar_admin_hash_audit_event() from public, anon, authenticated, service_role;

drop trigger if exists dakar_admin_audit_events_hash_chain on public.dakar_admin_audit_events;
create trigger dakar_admin_audit_events_hash_chain
  before insert on public.dakar_admin_audit_events
  for each row execute function public.dakar_admin_hash_audit_event();

-- Restore the append-only guard removed for the one-time backfill.
drop trigger if exists dakar_admin_audit_events_no_update on public.dakar_admin_audit_events;
create trigger dakar_admin_audit_events_no_update
  before update or delete on public.dakar_admin_audit_events
  for each row execute function public.dakar_admin_reject_audit_mutation();

comment on table public.dakar_admin_audit_chain_state is
  'Private singleton state for serializing the append-only Dakar Bus audit hash chain; no application role can read or mutate it directly.';
comment on function public.dakar_admin_hash_audit_event() is
  'Computes the next SHA-256 audit-chain link under a row lock; clients cannot supply their own chain sequence or hashes.';
comment on function public.dakar_admin_sha256(text) is
  'SHA-256 helper bound to the installed pgcrypto schema.';
