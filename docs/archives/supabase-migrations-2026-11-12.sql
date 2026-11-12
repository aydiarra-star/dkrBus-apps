-- Dakar Bus Supabase migration archive
-- Exported from supabase_migrations.schema_migrations on 2026-11-12.
-- Audit archive only: historical migrations are already applied to the linked project.
-- Do not replay blindly against the existing project.
-- Public publishable-key literals are redacted; server-side secrets are not exported.

-- ============================================================================
-- 20261112061808 dakar_bus_persistent_mobility_memory_v1
-- ============================================================================

-- Dakar Bus / Phase 1: additive persistent mobility memory.
-- No existing transport data is overwritten. All tables start empty.
create extension if not exists postgis with schema extensions;

-- Restrict the automatic RLS event-trigger helper to the database owner.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Public schema tables are not directly exposed to client roles.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, public;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.mobility_networks (
 id uuid primary key default gen_random_uuid(),
 code text not null unique, name text not null, mode text not null,
 operator_name text, status text not null default 'candidate'
 check(status in ('candidate','verified','published','inactive','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.mobility_sources (
 id uuid primary key default gen_random_uuid(), name text not null,
 source_type text not null check(source_type in ('operator','authority','government','press','community','field_observation','other')),
 url text, rights_note text, reliability_level text not null default 'unassessed'
 check(reliability_level in ('unassessed','primary','corroborating','community')),
 created_at timestamptz not null default now()
);
create table public.mobility_dataset_versions (
 id uuid primary key default gen_random_uuid(), version_label text not null unique,
 status text not null default 'candidate'
 check(status in ('candidate','verified','published','rejected','superseded')),
 source_snapshot_date date, published_at timestamptz, notes text,
 created_at timestamptz not null default now()
);
create table public.mobility_lines (
 id uuid primary key default gen_random_uuid(),
 network_id uuid not null references public.mobility_networks(id),
 code text not null, public_name text,
 status text not null default 'candidate'
 check(status in ('candidate','verified','published','inactive','archived')),
 dataset_version_id uuid references public.mobility_dataset_versions(id),
 source_id uuid references public.mobility_sources(id),
 valid_from date, valid_until date, created_at timestamptz not null default now(),
 unique(network_id,code,dataset_version_id)
);
create table public.mobility_stops (
 id uuid primary key default gen_random_uuid(), canonical_name text not null,
 aliases jsonb not null default '[]'::jsonb,
 location extensions.geography(Point,4326),
 status text not null default 'candidate'
 check(status in ('candidate','verified','published','inactive','archived')),
 source_id uuid references public.mobility_sources(id), created_at timestamptz not null default now()
);
create table public.mobility_directions (
 id uuid primary key default gen_random_uuid(),
 line_id uuid not null references public.mobility_lines(id),
 direction_code text not null, origin_label text, destination_label text,
 status text not null default 'candidate'
 check(status in ('candidate','verified','published','inactive','archived')),
 source_id uuid references public.mobility_sources(id),
 dataset_version_id uuid references public.mobility_dataset_versions(id),
 unique(line_id,direction_code,dataset_version_id)
);
create table public.mobility_line_stops (
 id uuid primary key default gen_random_uuid(),
 direction_id uuid not null references public.mobility_directions(id),
 stop_id uuid not null references public.mobility_stops(id),
 stop_sequence integer not null check(stop_sequence > 0),
 source_id uuid references public.mobility_sources(id),
 verified_at timestamptz, unique(direction_id,stop_sequence)
);
create table public.mobility_service_calendars (
 id uuid primary key default gen_random_uuid(), network_id uuid not null references public.mobility_networks(id),
 service_code text not null, monday boolean not null default false,
 tuesday boolean not null default false, wednesday boolean not null default false,
 thursday boolean not null default false, friday boolean not null default false,
 saturday boolean not null default false, sunday boolean not null default false,
 start_date date not null, end_date date not null, source_id uuid references public.mobility_sources(id),
 dataset_version_id uuid references public.mobility_dataset_versions(id),
 check(end_date >= start_date), unique(network_id,service_code,start_date,dataset_version_id)
);
create table public.mobility_calendar_exceptions (
 id uuid primary key default gen_random_uuid(),
 calendar_id uuid not null references public.mobility_service_calendars(id),
 exception_date date not null, exception_type text not null check(exception_type in ('service_added','service_removed')),
 note text, source_id uuid references public.mobility_sources(id),
 unique(calendar_id,exception_date)
);
create table public.mobility_trips (
 id uuid primary key default gen_random_uuid(),
 direction_id uuid not null references public.mobility_directions(id),
 calendar_id uuid references public.mobility_service_calendars(id),
 trip_code text, headsign text, departure_time time, arrival_time time,
 service_kind text not null default 'candidate'
 check(service_kind in ('published','estimated','observed','candidate')),
 status text not null default 'candidate'
 check(status in ('candidate','verified','published','rejected','expired')),
 source_id uuid references public.mobility_sources(id),
 dataset_version_id uuid references public.mobility_dataset_versions(id)
);
create table public.mobility_stop_times (
 id uuid primary key default gen_random_uuid(),
 trip_id uuid not null references public.mobility_trips(id),
 stop_id uuid not null references public.mobility_stops(id),
 stop_sequence integer not null check(stop_sequence > 0),
 arrival_time time, departure_time time,
 pickup_allowed boolean not null default true, dropoff_allowed boolean not null default true,
 unique(trip_id,stop_sequence)
);
create table public.mobility_service_patterns (
 id uuid primary key default gen_random_uuid(),
 direction_id uuid not null references public.mobility_directions(id),
 pattern_type text not null check(pattern_type in ('published_timetable','published_frequency','estimated_frequency','observed')),
 service_start time, service_end time, headway_minutes numeric check(headway_minutes > 0),
 days_of_week smallint[] not null default '{}',
 source_id uuid references public.mobility_sources(id),
 status text not null default 'candidate' check(status in ('candidate','verified','published','expired')),
 valid_from date, valid_until date, dataset_version_id uuid references public.mobility_dataset_versions(id)
);
create table public.mobility_transfers (
 id uuid primary key default gen_random_uuid(),
 from_stop_id uuid not null references public.mobility_stops(id),
 to_stop_id uuid not null references public.mobility_stops(id),
 walking_distance_m integer check(walking_distance_m >= 0),
 walking_duration_seconds integer check(walking_duration_seconds >= 0),
 accessibility_status text not null default 'unknown'
 check(accessibility_status in ('unknown','accessible','limited','not_accessible')),
 status text not null default 'candidate'
 check(status in ('candidate','verified','published','rejected','expired')),
 source_id uuid references public.mobility_sources(id), valid_from date, valid_until date,
 check(from_stop_id <> to_stop_id)
);
create table public.mobility_shapes (
 id uuid primary key default gen_random_uuid(),
 direction_id uuid not null references public.mobility_directions(id),
 geometry extensions.geography(LineString,4326),
 status text not null default 'candidate'
 check(status in ('candidate','verified','published','rejected','expired')),
 source_id uuid references public.mobility_sources(id),
 dataset_version_id uuid references public.mobility_dataset_versions(id),
 observed_at timestamptz, created_at timestamptz not null default now()
);
create table public.mobility_network_statistics (
 id uuid primary key default gen_random_uuid(),
 network_id uuid not null references public.mobility_networks(id),
 metric_code text not null, metric_value numeric not null check(metric_value >= 0),
 unit text not null, source_id uuid not null references public.mobility_sources(id),
 observed_at timestamptz not null, valid_from date, valid_until date,
 dataset_version_id uuid references public.mobility_dataset_versions(id), notes text
);
create table public.mobility_data_assertions (
 id uuid primary key default gen_random_uuid(), subject_type text not null,
 subject_id uuid, predicate text not null, value_json jsonb not null,
 source_id uuid not null references public.mobility_sources(id),
 status text not null default 'candidate'
 check(status in ('candidate','verified','published','rejected','expired')),
 observed_at timestamptz not null default now(), valid_from timestamptz, valid_until timestamptz,
 verified_by text, dataset_version_id uuid references public.mobility_dataset_versions(id),
 created_at timestamptz not null default now()
);
create table public.traffic_sources (
 id uuid primary key default gen_random_uuid(), name text not null, source_type text not null,
 url text, status text not null default 'not_configured'
 check(status in ('live','partial','stale','unavailable','not_configured')),
 polling_interval_seconds integer check(polling_interval_seconds > 0),
 created_at timestamptz not null default now()
);
create table public.traffic_observations (
 id uuid primary key default gen_random_uuid(),
 traffic_source_id uuid not null references public.traffic_sources(id),
 observed_at timestamptz not null, collected_at timestamptz not null default now(),
 coverage_status text not null default 'partial'
 check(coverage_status in ('live','partial','stale','unavailable')),
 payload jsonb not null default '{}'::jsonb, content_hash text
);
create table public.traffic_incidents (
 id uuid primary key default gen_random_uuid(),
 title text not null, description text, incident_type text not null,
 severity text not null default 'unknown' check(severity in ('low','moderate','high','critical','unknown')),
 status text not null default 'unverified'
 check(status in ('unverified','reported','confirmed','resolved','expired')),
 location extensions.geography(Point,4326), area_label text,
 source_id uuid references public.mobility_sources(id),
 traffic_source_id uuid references public.traffic_sources(id),
 observed_at timestamptz not null, confirmed_at timestamptz, expires_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.traffic_incident_impacts (
 id uuid primary key default gen_random_uuid(),
 incident_id uuid not null references public.traffic_incidents(id),
 network_id uuid references public.mobility_networks(id),
 line_id uuid references public.mobility_lines(id),
 impact_type text not null, description text
);
create table public.mobility_change_events (
 id bigint generated always as identity primary key,
 entity_type text not null, entity_id uuid, action text not null,
 before_data jsonb, after_data jsonb, actor text,
 reason text, created_at timestamptz not null default now()
);

-- Personal memory is isolated from the public network catalogue.
create table private.conversations (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table private.conversation_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references private.conversations(id) on delete cascade,
 role text not null check(role in ('user','assistant','tool')),
 content text not null, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table private.journey_contexts (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references private.conversations(id) on delete cascade,
 origin_label text, destination_label text, journey_payload jsonb not null,
 calculated_at timestamptz not null default now(), expires_at timestamptz
);
create table private.user_preferences (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 preferences jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);

-- Defense in depth: RLS on every table, no client policies yet.
do $$
declare t record;
begin
 for t in select schemaname, tablename from pg_tables
   where schemaname in ('public','private')
   and (schemaname='private' or tablename like 'mobility_%' or tablename like 'traffic_%')
 loop
   execute format('alter table %I.%I enable row level security',t.schemaname,t.tablename);
 end loop;
end $$;

create index mobility_stops_location_gix on public.mobility_stops using gist(location);
create index mobility_lines_network_code_idx on public.mobility_lines(network_id,code);
create index mobility_line_stops_order_idx on public.mobility_line_stops(direction_id,stop_sequence);
create index mobility_stop_times_trip_order_idx on public.mobility_stop_times(trip_id,stop_sequence);
create index mobility_trips_direction_idx on public.mobility_trips(direction_id,status);
create index mobility_transfers_from_idx on public.mobility_transfers(from_stop_id);
create index mobility_shapes_geometry_gix on public.mobility_shapes using gist(geometry);
create index mobility_assertions_subject_idx on public.mobility_data_assertions(subject_type,subject_id,predicate);
create index mobility_statistics_network_metric_idx on public.mobility_network_statistics(network_id,metric_code,observed_at desc);
create index traffic_incidents_fresh_idx on public.traffic_incidents(status,expires_at,observed_at desc);
create index traffic_incidents_location_gix on public.traffic_incidents using gist(location);
create index traffic_observations_source_time_idx on public.traffic_observations(traffic_source_id,observed_at desc);
create index conversation_messages_order_idx on private.conversation_messages(conversation_id,created_at);
create index journey_contexts_conversation_time_idx on private.journey_contexts(conversation_id,calculated_at desc);
;

-- ============================================================================
-- 20261112061931 dakar_bus_catalogue_staging_v1
-- ============================================================================

create table public.mobility_catalog_imports (
 id uuid primary key default gen_random_uuid(),
 source_path text not null, source_blob_sha text not null,
 repository_commit text not null, record_count integer not null check(record_count>=0),
 imported_at timestamptz not null default now(),
 status text not null default 'candidate' check(status in ('candidate','verified','published','rejected'))
);
create table public.mobility_catalog_records (
 id uuid primary key default gen_random_uuid(),
 import_id uuid not null references public.mobility_catalog_imports(id),
 network_code text not null check(network_code in ('ter','brt','ddd','aftu','tata')),
 line_code text not null,
 origin_label text, destination_label text,
 source_url text, detail_source_url text,
 source_consulted_at date, source_published_at date,
 raw_record jsonb not null,
 status text not null default 'candidate'
   check(status in ('candidate','verified','published','rejected','superseded')),
 imported_at timestamptz not null default now(),
 unique(import_id,line_code)
);
alter table public.mobility_catalog_imports enable row level security;
alter table public.mobility_catalog_records enable row level security;
create index mobility_catalog_network_line_idx on public.mobility_catalog_records(network_code,line_code);
create index mobility_catalog_status_idx on public.mobility_catalog_records(status,network_code);
;

-- ============================================================================
-- 20261112061954 catalogue_records_network_scoped_identity
-- ============================================================================
alter table public.mobility_catalog_records drop constraint mobility_catalog_records_import_id_line_code_key; alter table public.mobility_catalog_records add constraint mobility_catalog_records_import_network_line_key unique(import_id,network_code,line_code);
;

-- ============================================================================
-- 20261112062046 preserve_existing_reference_snapshots_v1
-- ============================================================================

create table public.mobility_reference_snapshots (
 id uuid primary key default gen_random_uuid(),
 source_path text not null,
 source_blob_sha text not null,
 repository_commit text not null,
 source_content text not null,
 network_scope text[] not null default '{}',
 notes text,
 imported_at timestamptz not null default now(),
 unique(source_path,source_blob_sha)
);
alter table public.mobility_reference_snapshots enable row level security;
create index mobility_reference_snapshots_scope_idx on public.mobility_reference_snapshots using gin(network_scope);
;

-- ============================================================================
-- 20261112062205 ter_brt_reference_stop_identity_v1
-- ============================================================================

alter table public.mobility_stops add column external_ref text;
alter table public.mobility_stops add column reference_metadata jsonb not null default '{}'::jsonb;
create unique index mobility_stops_source_external_ref_uidx
 on public.mobility_stops(source_id,external_ref)
 where external_ref is not null;
;

-- ============================================================================
-- 20261112062324 traffic_sources_and_community_reports_v1
-- ============================================================================

alter table public.traffic_sources add column metadata jsonb not null default '{}'::jsonb;
create table public.traffic_user_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_user_id uuid references auth.users(id) on delete set null,
 report_session_hash text,
 incident_type text not null,
 description text not null,
 location extensions.geography(Point,4326),
 area_label text,
 observed_at timestamptz not null,
 submitted_at timestamptz not null default now(),
 moderation_status text not null default 'pending'
 check(moderation_status in ('pending','reviewed','corroborated','rejected','expired')),
 linked_incident_id uuid references public.traffic_incidents(id),
 metadata jsonb not null default '{}'::jsonb,
 check(reporter_user_id is not null or report_session_hash is not null)
);
alter table public.traffic_user_reports enable row level security;
create index traffic_user_reports_submitted_idx on public.traffic_user_reports(moderation_status,submitted_at desc);
create index traffic_user_reports_location_gix on public.traffic_user_reports using gist(location);
;

-- ============================================================================
-- 20261112062338 index_mobility_foreign_keys_v1
-- ============================================================================

do $$
declare
 fk record;
 idx_name text;
 cols text;
begin
 for fk in
  select con.oid,con.conrelid,con.conkey,ns.nspname as schema_name,c.relname as table_name,
         con.conname
  from pg_constraint con
  join pg_class c on c.oid=con.conrelid
  join pg_namespace ns on ns.oid=c.relnamespace
  where con.contype='f' and ns.nspname in ('public','private')
 loop
  if not exists (
   select 1 from pg_index i
   where i.indrelid=fk.conrelid and i.indisvalid and i.indisready
    and (
     select array_agg(k.attnum::smallint order by k.ord)
     from unnest(i.indkey) with ordinality k(attnum,ord)
     where k.ord <= cardinality(fk.conkey)
    ) = fk.conkey
  ) then
   select string_agg(format('%I',a.attname),', ' order by u.ord)
    into cols
   from unnest(fk.conkey) with ordinality u(attnum,ord)
   join pg_attribute a on a.attrelid=fk.conrelid and a.attnum=u.attnum;
   idx_name := left('fkidx_'||fk.schema_name||'_'||fk.table_name||'_'||replace(cols,', ','_'),63);
   execute format('create index if not exists %I on %I.%I (%s)',idx_name,fk.schema_name,fk.table_name,cols);
  end if;
 end loop;
end $$;
;

-- ============================================================================
-- 20261112062558 candidate_route_waypoint_sequences_v1
-- ============================================================================

create table public.mobility_candidate_waypoints (
 id uuid primary key default gen_random_uuid(),
 direction_id uuid not null references public.mobility_directions(id) on delete cascade,
 stop_sequence integer not null check(stop_sequence > 0),
 label text not null,
 source_id uuid not null references public.mobility_sources(id),
 source_url text,
 detail_source_url text,
 metadata jsonb not null default '{}'::jsonb,
 status text not null default 'candidate'
 check(status in ('candidate','verified','published','rejected','superseded')),
 created_at timestamptz not null default now(),
 unique(direction_id,stop_sequence)
);
alter table public.mobility_candidate_waypoints enable row level security;
create index mobility_candidate_waypoints_order_idx on public.mobility_candidate_waypoints(direction_id,stop_sequence);
;

-- ============================================================================
-- 20261112062738 scheduled_traffic_incident_expiry_v1
-- ============================================================================

create extension if not exists pg_cron;

create or replace function private.expire_stale_traffic_incidents()
returns integer
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  expired_count integer;
begin
  update public.traffic_incidents
     set status = 'expired'
   where status in ('unverified','reported','confirmed')
     and expires_at is not null
     and expires_at <= now();
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

revoke execute on function private.expire_stale_traffic_incidents() from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1 from cron.job where jobname = 'dakar-bus-expire-stale-traffic-incidents'
  ) then
    perform cron.schedule(
      'dakar-bus-expire-stale-traffic-incidents',
      '*/5 * * * *',
      'select private.expire_stale_traffic_incidents();'
    );
  end if;
end;
$$;

revoke all on schema cron from public, anon, authenticated;
revoke all on all tables in schema cron from public, anon, authenticated;
revoke execute on all functions in schema cron from public, anon, authenticated;
;

-- ============================================================================
-- 20261112062741 candidate_waypoint_source_index_v1
-- ============================================================================
create index if not exists mobility_candidate_waypoints_source_idx on public.mobility_candidate_waypoints(source_id);
;

-- ============================================================================
-- 20261112062813 traffic_source_registry_metadata_v1
-- ============================================================================

alter table public.traffic_sources add column if not exists last_checked_at timestamptz;
alter table public.traffic_sources add column if not exists integration_method text;
alter table public.traffic_sources add column if not exists requires_credentials boolean;
;

-- ============================================================================
-- 20261112062843 traffic_press_feed_deduplication_v1
-- ============================================================================

alter table public.traffic_incidents add column if not exists source_external_id text;
alter table public.traffic_incidents add column if not exists source_url text;
alter table public.traffic_incidents add column if not exists source_published_at timestamptz;
alter table public.traffic_incidents add constraint traffic_incidents_source_external_unique unique(traffic_source_id,source_external_id);
;

-- ============================================================================
-- 20261112062855 index_candidate_waypoint_source_fk_v1
-- ============================================================================
create index if not exists mobility_candidate_waypoints_source_id_idx on public.mobility_candidate_waypoints(source_id);
;

-- ============================================================================
-- 20261112062857 aps_rss_ingestion_support_v1
-- ============================================================================

create extension if not exists pg_net;
alter table public.traffic_incidents add column if not exists metadata jsonb not null default '{}'::jsonb;
revoke all on schema net from public, anon, authenticated;
revoke execute on all functions in schema net from public, anon, authenticated;
;

-- ============================================================================
-- 20261112062928 schedule_aps_traffic_rss_ingestion_v1
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from cron.job where jobname='dakar-bus-aps-rss-ingest'
  ) then
    perform cron.schedule(
      'dakar-bus-aps-rss-ingest',
      '*/15 * * * *',
      $job$
        select net.http_post(
          url := 'https://mdmuxzaewqzqutkqdylo.supabase.co/functions/v1/dakar-bus-traffic-ingest',
          headers := '{"Content-Type":"application/json","apikey":"[REDACTED_PUBLISHABLE_KEY]"}'::jsonb,
          body := '{}'::jsonb,
          timeout_milliseconds := 20000
        );
      $job$
    );
  end if;
end;
$$;
;

-- ============================================================================
-- 20261112063026 grant_backend_service_role_access_v1
-- ============================================================================

grant usage on schema public, private to service_role;
grant all privileges on all tables in schema public, private to service_role;
grant all privileges on all sequences in schema public, private to service_role;
grant execute on all functions in schema public, private to service_role;

alter default privileges for role postgres in schema public
  grant all privileges on tables to service_role;
alter default privileges for role postgres in schema private
  grant all privileges on tables to service_role;
alter default privileges for role postgres in schema public
  grant all privileges on sequences to service_role;
alter default privileges for role postgres in schema private
  grant all privileges on sequences to service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to service_role;
alter default privileges for role postgres in schema private
  grant execute on functions to service_role;
;

-- ============================================================================
-- 20261112063236 complete_knowledge_graph_metadata_v1
-- ============================================================================

alter table public.mobility_directions add column if not exists direction_method text;
alter table public.mobility_directions add column if not exists direction_notes text;
alter table public.mobility_service_patterns add column if not exists notes text;
alter table public.mobility_transfers add column if not exists transfer_type text;
alter table public.mobility_transfers add column if not exists label text;
alter table public.mobility_transfers add column if not exists notes text;
;

-- ============================================================================
-- 20261112063415 remove_redundant_candidate_waypoint_source_index_v1
-- ============================================================================
drop index if exists public.mobility_candidate_waypoints_source_id_idx;
;

-- ============================================================================
-- 20261112063500 service_pattern_ranges_and_wait_estimates_v1
-- ============================================================================

alter table public.mobility_service_patterns add column if not exists period_label text;
alter table public.mobility_service_patterns add column if not exists headway_min_minutes numeric;
alter table public.mobility_service_patterns add column if not exists headway_max_minutes numeric;
alter table public.mobility_service_patterns add column if not exists expected_wait_minutes numeric;
alter table public.mobility_service_patterns add column if not exists service_start_earliest time;
alter table public.mobility_service_patterns add column if not exists service_start_latest time;
alter table public.mobility_service_patterns add column if not exists service_end_earliest time;
alter table public.mobility_service_patterns add column if not exists service_end_latest time;
alter table public.mobility_service_patterns add constraint mobility_service_patterns_headway_range_check
 check (
  (headway_min_minutes is null or headway_min_minutes > 0)
  and (headway_max_minutes is null or headway_max_minutes > 0)
  and (headway_min_minutes is null or headway_max_minutes is null or headway_max_minutes >= headway_min_minutes)
  and (expected_wait_minutes is null or expected_wait_minutes >= 0)
 );
;

-- ============================================================================
-- 20261112063609 traffic_incident_rejection_status_v1
-- ============================================================================

alter table public.traffic_incidents drop constraint traffic_incidents_status_check;
alter table public.traffic_incidents add constraint traffic_incidents_status_check
check(status in ('unverified','reported','confirmed','resolved','expired','rejected'));
;

-- ============================================================================
-- 20261112063659 schedule_dakar_bus_rss_traffic_ingestion_v1
-- ============================================================================

create or replace function private.run_dakar_bus_rss_ingestion()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, net
as $function$
declare
  request_headers jsonb := jsonb_build_object(
    'apikey', '[REDACTED_PUBLISHABLE_KEY]',
    'Authorization', 'Bearer [REDACTED_PUBLISHABLE_KEY]',
    'Content-Type', 'application/json'
  );
begin
  perform net.http_post(
    url := 'https://mdmuxzaewqzqutkqdylo.supabase.co/functions/v1/dakar-bus-traffic-ingest',
    headers := request_headers,
    body := '{}'::jsonb
  );
  perform net.http_post(
    url := 'https://mdmuxzaewqzqutkqdylo.supabase.co/functions/v1/dakar-bus-traffic-ingest-senenews',
    headers := request_headers,
    body := '{}'::jsonb
  );
end;
$function$;

revoke all on function private.run_dakar_bus_rss_ingestion() from public, anon, authenticated;

select cron.schedule(
  'dakar-bus-traffic-ingest',
  '*/15 * * * *',
  'select private.run_dakar_bus_rss_ingestion();'
);
;

-- ============================================================================
-- 20261112063751 schedule_local_news_traffic_monitors_v1
-- ============================================================================

do $$
begin
  if not exists(select 1 from cron.job where jobname='dakar-bus-senenews-rss-ingest') then
    perform cron.schedule(
      'dakar-bus-senenews-rss-ingest',
      '*/15 * * * *',
      $job$
        select net.http_post(
          url := 'https://mdmuxzaewqzqutkqdylo.supabase.co/functions/v1/dakar-bus-traffic-ingest-senenews',
          headers := '{"Content-Type":"application/json","apikey":"[REDACTED_PUBLISHABLE_KEY]"}'::jsonb,
          body := '{}'::jsonb,
          timeout_milliseconds := 20000
        );
      $job$
    );
  end if;
  if not exists(select 1 from cron.job where jobname='dakar-bus-dakaractu-rss-ingest') then
    perform cron.schedule(
      'dakar-bus-dakaractu-rss-ingest',
      '*/15 * * * *',
      $job$
        select net.http_post(
          url := 'https://mdmuxzaewqzqutkqdylo.supabase.co/functions/v1/dakar-bus-traffic-ingest-dakaractu',
          headers := '{"Content-Type":"application/json","apikey":"[REDACTED_PUBLISHABLE_KEY]"}'::jsonb,
          body := '{}'::jsonb,
          timeout_milliseconds := 20000
        );
      $job$
    );
  end if;
end;
$$;
;

-- ============================================================================
-- 20261112063759 traffic_source_freshness_monitor_v1
-- ============================================================================

create or replace function private.mark_stale_traffic_sources()
returns integer
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  stale_count integer;
begin
  update public.traffic_sources
     set status='stale',
         metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
           'stale_marked_at',now(),
           'stale_reason','No successful poll in the last 45 minutes'
         )
   where status in ('live','partial')
     and last_checked_at is not null
     and last_checked_at < now() - interval '45 minutes';
  get diagnostics stale_count = row_count;
  return stale_count;
end;
$$;
revoke execute on function private.mark_stale_traffic_sources() from public,anon,authenticated;

do $$
begin
  if not exists(select 1 from cron.job where jobname='dakar-bus-mark-stale-traffic-sources') then
    perform cron.schedule(
      'dakar-bus-mark-stale-traffic-sources',
      '*/15 * * * *',
      'select private.mark_stale_traffic_sources();'
    );
  end if;
end;
$$;
;

-- ============================================================================
-- 20261112063926 lock_down_pg_net_schema_v1
-- ============================================================================

revoke all on schema net from public, anon, authenticated;
revoke all on all tables in schema net from public, anon, authenticated;
revoke all on all sequences in schema net from public, anon, authenticated;
revoke execute on all functions in schema net from public, anon, authenticated;

grant usage on schema net to postgres, supabase_admin;
grant all privileges on all tables in schema net to postgres, supabase_admin;
grant all privileges on all sequences in schema net to postgres, supabase_admin;
grant execute on all functions in schema net to postgres, supabase_admin;
;

-- ============================================================================
-- 20261112064358 remove_unused_rss_cron_wrapper_v1
-- ============================================================================
drop function if exists private.run_dakar_bus_rss_ingestion();
;

-- ============================================================================
-- 20261112064515 add_brt_b2_validated_weekday_reference_v1
-- ============================================================================

insert into public.mobility_dataset_versions(version_label,status,source_snapshot_date,notes)
select 'user-validated-reference-2026-11-12','verified','2026-11-12',
 'Références horaires TER/BRT communiquées par le propriétaire et signalées comme vérifiées sur les affichages en station ; ajout non destructif.'
where not exists(select 1 from public.mobility_dataset_versions where version_label='user-validated-reference-2026-11-12');

with v as (
 select id from public.mobility_dataset_versions where version_label='user-validated-reference-2026-11-12'
), s as (
 select id from public.mobility_sources where name='Dakar Bus · référence validée par utilisateurs'
), l as (
 insert into public.mobility_lines(network_id,code,public_name,status,dataset_version_id,source_id)
 select n.id,'B2','BRT B2','candidate',v.id,s.id
 from public.mobility_networks n cross join v cross join s
 where n.code='brt'
 on conflict(network_id,code,dataset_version_id) do nothing
 returning id,dataset_version_id,network_id
), line_row as (
 select l.id,l.dataset_version_id from l
 union all
 select x.id,x.dataset_version_id from public.mobility_lines x
 join public.mobility_networks n on n.id=x.network_id
 where n.code='brt' and x.code='B2' and x.dataset_version_id=(select id from v)
), d as (
 insert into public.mobility_directions(line_id,direction_code,origin_label,destination_label,status,source_id,dataset_version_id,direction_method,direction_notes)
 select l.id,'schedule_reference_only',null,null,'candidate',s.id,l.dataset_version_id,'unknown',
 'Fréquence de référence confirmée pour lundi-samedi ; itinéraire, terminus et séquence des 23 stations propres à B2 non documentés ici.'
 from line_row l cross join s
 on conflict(line_id,direction_code,dataset_version_id) do nothing
 returning id
)
insert into public.mobility_service_patterns(direction_id,pattern_type,service_start,service_end,headway_minutes,days_of_week,source_id,status,notes)
select d.id,'published_frequency','06:00','21:00',6,array[1,2,3,4,5,6]::smallint[],s.id,'verified',
 'BRT B2 lundi-samedi, 06:00–21:00, intervalle de référence 6 minutes. Fréquence dominicale non connue ; ne pas la déduire de B1.'
from d cross join s
where not exists(select 1 from public.mobility_service_patterns p where p.direction_id=d.id and p.service_start='06:00' and p.service_end='21:00' and p.headway_minutes=6);
;

-- ============================================================================
-- 20261112064717 complete_ddd_502_503_loop_sequences_v1
-- ============================================================================

insert into public.mobility_sources(name,source_type,url,reliability_level,rights_note)
select 'Dakar Dem Dikk · info voyageurs','operator','https://demdikk.sn/info-voyageurs/','primary',
 'Page officielle consultée le 2026-11-12 ; liste les variantes TER feeder 502A/502B/503A/503B/504A/504B.'
where not exists(select 1 from public.mobility_sources where url='https://demdikk.sn/info-voyageurs/');

with route_rows as (
 select * from jsonb_to_recordset($routes$[{"line":"502","kind":"published_circuit","stops":["Gare Colobane","Maison du parti","Hampathé Ba","UCAD","Lycée de Lafosse","Police 4e","Rond-point Sham","Gare Colobane"],"note":"La page Info voyageurs distingue 502A (Colobane–UCAD) et 502B (Colobane–Abass Ndao), tandis que la page itinéraire conserve une boucle générique 502. Ne pas attribuer cette boucle à A ou B sans correspondance opérateur explicite."},{"line":"503","kind":"published_circuit","stops":["Gare de Colobane","Rond-point Bel Air","Air","Môle 8","Cité Isra","Zone industrielle","Service des mines","Gare de Colobane"],"note":"La page Info voyageurs distingue 503A (Colobane–Môle 8) et 503B (Colobane–Hydrocarbure), tandis que la page itinéraire conserve une boucle générique 503. Ne pas attribuer cette boucle à A ou B sans correspondance opérateur explicite."}]$routes$::jsonb)
 as x(line text,kind text,stops jsonb,note text)
), src as (
 select id from public.mobility_sources where url='https://demdikk.sn/reseau-urbain-dakar/' limit 1
), info_src as (
 select id from public.mobility_sources where url='https://demdikk.sn/info-voyageurs/' limit 1
), directions as (
 update public.mobility_directions d
 set direction_code='published_circuit_candidate',
     direction_method='source_documented',
     direction_notes='Boucle générique transcrite depuis la page officielle des itinéraires DDD. '||r.note,
     source_id=src.id
 from public.mobility_lines l
 join public.mobility_networks n on n.id=l.network_id and n.code='ddd'
 join route_rows r on r.line=l.code
 cross join src
 where d.line_id=l.id and l.dataset_version_id='40cbdf2e-0a4a-4ff9-ba24-7048e064ed96'
   and d.direction_code='outbound_candidate'
 returning d.id,d.line_id,r.line,r.stops,r.note
), archived_duplicates as (
 update public.mobility_directions d
 set status='archived',direction_method='unknown',
     direction_notes='Ancienne direction de préparation redondante ; remplacée par la séquence boucle issue de la page officielle.'
 from public.mobility_lines l
 join public.mobility_networks n on n.id=l.network_id and n.code='ddd'
 where d.line_id=l.id and l.code in ('502','503')
   and l.dataset_version_id='40cbdf2e-0a4a-4ff9-ba24-7048e064ed96'
   and d.direction_code='source_forward'
 returning d.id
), return_unknown as (
 update public.mobility_directions d
 set direction_method='unknown',
     direction_notes='Circuit fermé Colobane–Colobane ; l’inversion technique n’est pas un sens retour distinct.'
 from public.mobility_lines l
 join public.mobility_networks n on n.id=l.network_id and n.code='ddd'
 where d.line_id=l.id and l.code in ('502','503')
   and l.dataset_version_id='40cbdf2e-0a4a-4ff9-ba24-7048e064ed96'
   and d.direction_code='return_reverse_candidate'
 returning d.id
), catalog_update as (
 update public.mobility_catalog_records c
 set raw_record=c.raw_record || jsonb_build_object('published_route_kind','published_circuit','published_stops',r.stops,'published_route_note',r.note),
     detail_source_url='https://demdikk.sn/reseau-urbain-dakar/'
 from route_rows r
 where c.network_code='ddd' and c.line_code=r.line and c.status='candidate'
 returning c.line_code
), stops_insert as (
 insert into public.mobility_stops(canonical_name,aliases,status,source_id)
 select distinct stop_name,'[]'::jsonb,'candidate',src.id
 from route_rows r
 cross join lateral jsonb_array_elements_text(r.stops) stop_name
 cross join src
 where not exists(select 1 from public.mobility_stops s where s.canonical_name=stop_name.value and s.status='candidate')
 returning id
), links_insert as (
 insert into public.mobility_line_stops(direction_id,stop_id,stop_sequence,source_id)
 select d.id,s.id,w.ordinality::integer,src.id
 from route_rows r
 join public.mobility_lines l on l.code=r.line and l.dataset_version_id='40cbdf2e-0a4a-4ff9-ba24-7048e064ed96'
 join public.mobility_networks n on n.id=l.network_id and n.code='ddd'
 join public.mobility_directions d on d.line_id=l.id and d.direction_code='published_circuit_candidate'
 cross join lateral jsonb_array_elements_text(r.stops) with ordinality w(value,ordinality)
 join public.mobility_stops s on s.canonical_name=w.value and s.status='candidate'
 cross join src
 on conflict(direction_id,stop_sequence) do nothing
 returning id
)
select (select count(*) from directions) as outbound_circuits_updated,
       (select count(*) from archived_duplicates) as duplicate_directions_archived,
       (select count(*) from return_unknown) as reverse_directions_marked_unknown,
       (select count(*) from catalog_update) as catalog_records_enriched,
       (select count(*) from stops_insert) as new_stop_entities,
       (select count(*) from links_insert) as stop_links_added;
;

-- ============================================================================
-- 20261112070502 repair_ddd_reverse_sequences_v1
-- ============================================================================

create schema if not exists private;

create table if not exists private.mobility_direction_sequence_backups (
  direction_id uuid primary key,
  line_id uuid not null,
  dataset_version_id uuid,
  network_code text not null,
  line_code text not null,
  direction_code text not null,
  direction_method text not null,
  status text not null,
  stop_ids uuid[] not null,
  stop_names text[] not null,
  backed_up_at timestamptz not null default now(),
  repair_reason text not null
);

create temp table tmp_ddd_reverse_repairs on commit drop as
with pairs as (
  select
    r.id as return_id,
    o.id as outbound_id,
    r.line_id,
    r.dataset_version_id,
    n.code as network_code,
    l.code as line_code,
    r.direction_code,
    r.direction_method,
    r.status::text as status
  from public.mobility_directions r
  join public.mobility_directions o
    on o.line_id = r.line_id
   and o.dataset_version_id = r.dataset_version_id
   and o.direction_method = 'source_documented'
  join public.mobility_lines l on l.id = r.line_id
  join public.mobility_networks n on n.id = l.network_id
  where r.direction_method = 'reverse_derived'
    and r.status = 'candidate'
    and n.code = 'ddd'
),
actual as (
  select
    ls.direction_id,
    array_agg(ls.stop_id order by ls.stop_sequence) as stop_ids,
    array_agg(coalesce(s.canonical_name, '') order by ls.stop_sequence) as stop_names
  from public.mobility_line_stops ls
  left join public.mobility_stops s on s.id = ls.stop_id
  group by ls.direction_id
),
expected as (
  select
    p.return_id,
    array_agg(ls.stop_id order by ls.stop_sequence desc) as stop_ids,
    array_agg(coalesce(s.canonical_name, '') order by ls.stop_sequence desc) as stop_names
  from pairs p
  join public.mobility_line_stops ls on ls.direction_id = p.outbound_id
  left join public.mobility_stops s on s.id = ls.stop_id
  group by p.return_id
)
select
  p.*,
  a.stop_ids as actual_ids,
  a.stop_names as actual_names,
  e.stop_ids as expected_ids,
  e.stop_names as expected_names
from pairs p
join actual a on a.direction_id = p.return_id
join expected e on e.return_id = p.return_id
where a.stop_ids is distinct from e.stop_ids;

insert into private.mobility_direction_sequence_backups (
  direction_id, line_id, dataset_version_id, network_code, line_code,
  direction_code, direction_method, status, stop_ids, stop_names, repair_reason
)
select
  return_id, line_id, dataset_version_id, network_code, line_code,
  direction_code, direction_method, status, actual_ids, actual_names,
  'Sauvegarde avant reconstruction du sens retour à partir du sens source_documented inversé.'
from tmp_ddd_reverse_repairs
on conflict (direction_id) do nothing;

delete from public.mobility_line_stops
where direction_id in (select return_id from tmp_ddd_reverse_repairs);

insert into public.mobility_line_stops (
  direction_id, stop_id, stop_sequence, source_id, verified_at
)
select
  repairs.return_id,
  outbound.stop_id,
  row_number() over (
    partition by repairs.return_id
    order by outbound.stop_sequence desc
  )::integer,
  outbound.source_id,
  outbound.verified_at
from tmp_ddd_reverse_repairs repairs
join public.mobility_line_stops outbound
  on outbound.direction_id = repairs.outbound_id;

do $$
declare
  remaining_mismatches integer;
begin
  with direction_sequences as (
    select
      d.id,
      d.line_id,
      d.direction_method,
      d.dataset_version_id,
      array_agg(ls.stop_id order by ls.stop_sequence) as stop_ids
    from public.mobility_directions d
    join public.mobility_line_stops ls on ls.direction_id = d.id
    where d.direction_method in ('source_documented', 'reverse_derived')
    group by d.id
  ),
  returns as (
    select
      r.line_id,
      r.stop_ids as actual_ids,
      array(
        select x
        from unnest(o.stop_ids) with ordinality u(x, ord)
        order by ord desc
      ) as expected_ids
    from direction_sequences r
    join direction_sequences o
      on o.line_id = r.line_id
     and o.dataset_version_id = r.dataset_version_id
     and o.direction_method = 'source_documented'
    join public.mobility_lines l on l.id = r.line_id
    join public.mobility_networks n on n.id = l.network_id
    where r.direction_method = 'reverse_derived'
      and r.dataset_version_id is not null
      and n.code = 'ddd'
  )
  select count(*) into remaining_mismatches
  from returns
  where actual_ids is distinct from expected_ids;

  if remaining_mismatches > 0 then
    raise exception 'DDD reverse sequence repair incomplete: % mismatches remain', remaining_mismatches;
  end if;
end $$;
;

-- ============================================================================
-- 20261112070508 mobility_osm_candidate_layer_and_search_functions_v1
-- ============================================================================

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create table if not exists public.mobility_osm_stops (
  id uuid primary key default gen_random_uuid(),
  osm_type text not null check (osm_type in ('node','way')),
  osm_id bigint not null,
  name text,
  location extensions.geography(Point,4326) not null,
  tags jsonb not null default '{}'::jsonb,
  osm_version integer,
  osm_timestamp timestamptz,
  source_id uuid references public.mobility_sources(id),
  source_url text not null,
  imported_at timestamptz not null default now(),
  unique(osm_type,osm_id)
);
create index if not exists mobility_osm_stops_name_trgm_idx
  on public.mobility_osm_stops using gin (name extensions.gin_trgm_ops);
create index if not exists mobility_osm_stops_location_gix
  on public.mobility_osm_stops using gist (location);
create index if not exists mobility_osm_stops_source_idx
  on public.mobility_osm_stops(source_id);

create table if not exists public.mobility_stop_geocode_matches (
  id uuid primary key default gen_random_uuid(),
  mobility_stop_id uuid not null references public.mobility_stops(id) on delete cascade,
  osm_stop_id uuid not null references public.mobility_osm_stops(id) on delete cascade,
  match_score numeric(5,4) not null check (match_score >= 0 and match_score <= 1),
  match_method text not null,
  matched_label text,
  network_codes text[] not null default '{}',
  status text not null default 'candidate' check (status in ('candidate','verified','rejected')),
  review_note text,
  created_at timestamptz not null default now(),
  unique(mobility_stop_id,osm_stop_id)
);
create index if not exists mobility_stop_geocode_matches_osm_idx
  on public.mobility_stop_geocode_matches(osm_stop_id);

alter table public.mobility_osm_stops enable row level security;
alter table public.mobility_stop_geocode_matches enable row level security;
revoke all on public.mobility_osm_stops from anon, authenticated;
revoke all on public.mobility_stop_geocode_matches from anon, authenticated;
grant all privileges on public.mobility_osm_stops to service_role;
grant all privileges on public.mobility_stop_geocode_matches to service_role;

insert into public.mobility_sources(name,source_type,url,rights_note,reliability_level)
select 'OpenStreetMap contributors','other','https://www.openstreetmap.org/copyright',
 'Données © OpenStreetMap contributors, licence ODbL. Les positions importées sont des propositions de correspondance et ne remplacent pas une validation terrain.',
 'corroborating'
where not exists(select 1 from public.mobility_sources where name='OpenStreetMap contributors');

create or replace function public.refresh_mobility_osm_stop_matches()
returns integer
language plpgsql
security invoker
set search_path = pg_catalog, public, extensions
as $$
declare
  affected integer := 0;
begin
  with target_stops as (
    select
      s.id,
      s.canonical_name,
      coalesce(s.aliases,'[]'::jsonb) as aliases,
      array_agg(distinct n.code order by n.code) as network_codes
    from public.mobility_stops s
    join public.mobility_line_stops ls on ls.stop_id=s.id
    join public.mobility_directions d on d.id=ls.direction_id
    join public.mobility_lines li on li.id=d.line_id
    join public.mobility_networks n on n.id=li.network_id
    where s.location is null
      and s.status in ('candidate','verified','published')
      and li.status in ('candidate','verified','published')
      and d.status in ('candidate','verified','published')
    group by s.id,s.canonical_name,s.aliases
  ),
  scored as (
    select
      t.id as mobility_stop_id,
      o.id as osm_stop_id,
      greatest(
        extensions.similarity(
          extensions.unaccent(lower(trim(t.canonical_name))),
          extensions.unaccent(lower(trim(o.name)))
        ),
        coalesce(max(
          extensions.similarity(
            extensions.unaccent(lower(trim(alias.value))),
            extensions.unaccent(lower(trim(o.name)))
          )
        ),0)
      )::numeric(5,4) as score,
      t.canonical_name as matched_label,
      t.network_codes
    from target_stops t
    cross join public.mobility_osm_stops o
    left join lateral jsonb_array_elements_text(t.aliases) alias(value) on true
    where nullif(trim(o.name),'') is not null
      and lower(trim(o.name)) not in ('bus stop','bus stop.','arrêt de bus','arret de bus','arrêt','arret','stop')
    group by t.id,o.id,t.canonical_name,t.network_codes,o.name
  ),
  ranked as (
    select *,row_number() over(partition by mobility_stop_id order by score desc,osm_stop_id) as rank
    from scored
    where score >= 0.45
  ),
  upserted as (
    insert into public.mobility_stop_geocode_matches(
      mobility_stop_id,osm_stop_id,match_score,match_method,matched_label,network_codes,status
    )
    select
      mobility_stop_id,osm_stop_id,score,
      case when score >= 0.9999 then 'exact_name' else 'fuzzy_name' end,
      matched_label,network_codes,'candidate'
    from ranked
    where rank <= 3
    on conflict(mobility_stop_id,osm_stop_id) do update
      set match_score=excluded.match_score,
          match_method=excluded.match_method,
          matched_label=excluded.matched_label,
          network_codes=excluded.network_codes
      where public.mobility_stop_geocode_matches.status='candidate'
    returning 1
  )
  select count(*) into affected from upserted;
  return affected;
end;
$$;
revoke all on function public.refresh_mobility_osm_stop_matches() from public,anon,authenticated;
grant execute on function public.refresh_mobility_osm_stop_matches() to service_role;

create or replace function public.get_mobility_stop_coordinates(p_stop_ids uuid[])
returns table(stop_id uuid,latitude double precision,longitude double precision)
language sql
stable
security invoker
set search_path = pg_catalog,public,extensions
as $$
  select s.id,
         extensions.st_y(s.location::extensions.geometry) as latitude,
         extensions.st_x(s.location::extensions.geometry) as longitude
  from public.mobility_stops s
  where s.id = any(coalesce(p_stop_ids,'{}'::uuid[]))
    and s.location is not null;
$$;
revoke all on function public.get_mobility_stop_coordinates(uuid[]) from public,anon,authenticated;
grant execute on function public.get_mobility_stop_coordinates(uuid[]) to service_role;

create or replace function public.verify_dakar_bus_ingest_token(p_token text)
returns boolean
language sql
security definer
set search_path = pg_catalog, public, vault
as $function$
  select coalesce(
    p_token is not null
    and p_token <> ''
    and exists (
      select 1
      from vault.decrypted_secrets
      where name = 'dakar_bus_ingest_token'
        and decrypted_secret = p_token
    ),
    false
  );
$function$;
revoke all on function public.verify_dakar_bus_ingest_token(text) from public,anon,authenticated;
grant execute on function public.verify_dakar_bus_ingest_token(text) to service_role;

do $$
begin
  if not exists (select 1 from vault.secrets where name='dakar_bus_ingest_token') then
    perform vault.create_secret(
      gen_random_uuid()::text || gen_random_uuid()::text,
      'dakar_bus_ingest_token',
      'Jeton privé des fonctions d’ingestion Dakar Bus'
    );
  end if;
end;
$$;

insert into public.mobility_service_patterns(
 direction_id,pattern_type,service_start,service_end,headway_minutes,days_of_week,
 source_id,status,dataset_version_id,period_label,headway_min_minutes,headway_max_minutes,
 expected_wait_minutes,notes
)
select
 d.id,
 'estimated_frequency',
 '06:00',
 '21:00',
 12,
 array[0,1,2,3,4,5,6],
 s.id,
 'candidate',
 l.dataset_version_id,
 'Repère empirique partagé AFTU/TATA',
 12,12,8,
 'Repère commun AFTU/TATA repris du moteur local : intervalle moyen 11,58 min arrondi à 12 min ; attente résiduelle estimée à 8 min. Ce n’est pas une mesure autonome TATA et ne doit pas être présenté comme un prochain passage.'
from public.mobility_directions d
join public.mobility_lines l on l.id=d.line_id
join public.mobility_networks n on n.id=l.network_id
join public.mobility_sources s on s.name='DTech · repères projet mobilité'
where n.code='tata'
  and l.status in ('candidate','verified','published')
  and d.status in ('candidate','verified','published')
  and not exists (
    select 1 from public.mobility_service_patterns existing
    where existing.direction_id=d.id
      and existing.pattern_type='estimated_frequency'
      and existing.period_label='Repère empirique partagé AFTU/TATA'
  );
;

