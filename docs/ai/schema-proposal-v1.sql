-- PROPOSITION DE SCHÉMA — NE PAS EXÉCUTER DIRECTEMENT.
-- À transformer en migration Supabase générée par la CLI après création du projet dédié
-- et revue de la configuration locale. Cette proposition n'a pas été appliquée à une base.
--
-- Principes : référentiel extensible, provenance obligatoire, directions explicites,
-- compteurs officiels séparés des fiches du catalogue, RLS activé partout.
-- Le service serveur privilégié sera la seule voie d'écriture lors de la V1.

create extension if not exists postgis with schema extensions;

create table if not exists public.mobility_networks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  mode text not null,
  operator_name text,
  status text not null default 'candidate'
    check (status in ('candidate','verified','published','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mobility_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null
    check (source_type in ('operator','authority','government','press','community','field_observation','other')),
  url text,
  rights_note text,
  reliability_level text not null default 'unassessed'
    check (reliability_level in ('unassessed','primary','corroborating','community')),
  created_at timestamptz not null default now()
);

create table if not exists public.mobility_dataset_versions (
  id uuid primary key default gen_random_uuid(),
  version_label text not null unique,
  status text not null default 'candidate'
    check (status in ('candidate','verified','published','rejected','superseded')),
  source_snapshot_date date,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  notes text
);

create table if not exists public.mobility_network_statistics (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references public.mobility_networks(id),
  metric_code text not null,
  metric_value numeric not null check (metric_value >= 0),
  unit text not null,
  source_id uuid not null references public.mobility_sources(id),
  observed_at timestamptz not null,
  valid_from date,
  valid_until date,
  dataset_version_id uuid references public.mobility_dataset_versions(id),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.mobility_lines (
  id uuid primary key default gen_random_uuid(),
  network_id uuid not null references public.mobility_networks(id),
  code text not null,
  public_name text,
  status text not null default 'candidate'
    check (status in ('candidate','verified','published','inactive','archived')),
  dataset_version_id uuid references public.mobility_dataset_versions(id),
  source_id uuid references public.mobility_sources(id),
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  unique (network_id, code, dataset_version_id)
);

create table if not exists public.mobility_stops (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  aliases jsonb not null default '[]'::jsonb,
  location extensions.geography(Point,4326),
  status text not null default 'candidate'
    check (status in ('candidate','verified','published','inactive','archived')),
  source_id uuid references public.mobility_sources(id),
  created_at timestamptz not null default now()
);

create index if not exists mobility_stops_location_gix
  on public.mobility_stops using gist (location);

create table if not exists public.mobility_directions (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.mobility_lines(id),
  direction_code text not null,
  origin_label text,
  destination_label text,
  status text not null default 'candidate'
    check (status in ('candidate','verified','published','inactive','archived')),
  source_id uuid references public.mobility_sources(id),
  dataset_version_id uuid references public.mobility_dataset_versions(id),
  unique (line_id, direction_code, dataset_version_id)
);

create table if not exists public.mobility_line_stops (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.mobility_directions(id) on delete cascade,
  stop_id uuid not null references public.mobility_stops(id),
  stop_sequence integer not null check (stop_sequence > 0),
  source_id uuid references public.mobility_sources(id),
  verified_at timestamptz,
  unique (direction_id, stop_sequence)
);

create table if not exists public.mobility_transfers (
  id uuid primary key default gen_random_uuid(),
  from_stop_id uuid not null references public.mobility_stops(id),
  to_stop_id uuid not null references public.mobility_stops(id),
  walking_distance_m integer check (walking_distance_m >= 0),
  walking_duration_seconds integer check (walking_duration_seconds >= 0),
  accessibility_status text not null default 'unknown'
    check (accessibility_status in ('unknown','accessible','limited','not_accessible')),
  status text not null default 'candidate'
    check (status in ('candidate','verified','published','rejected','expired')),
  source_id uuid references public.mobility_sources(id),
  valid_from date,
  valid_until date,
  check (from_stop_id <> to_stop_id)
);

create table if not exists public.mobility_service_patterns (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.mobility_directions(id),
  pattern_type text not null
    check (pattern_type in ('published_timetable','published_frequency','estimated_frequency','observed')),
  service_start time,
  service_end time,
  headway_minutes numeric check (headway_minutes > 0),
  days_of_week smallint[] not null default '{}',
  source_id uuid references public.mobility_sources(id),
  status text not null default 'candidate'
    check (status in ('candidate','verified','published','expired')),
  valid_from date,
  valid_until date,
  dataset_version_id uuid references public.mobility_dataset_versions(id)
);

create table if not exists public.mobility_data_assertions (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_id uuid,
  predicate text not null,
  value_json jsonb not null,
  source_id uuid not null references public.mobility_sources(id),
  status text not null default 'candidate'
    check (status in ('candidate','verified','published','rejected','expired')),
  observed_at timestamptz not null default now(),
  valid_from timestamptz,
  valid_until timestamptz,
  verified_by text,
  dataset_version_id uuid references public.mobility_dataset_versions(id),
  created_at timestamptz not null default now()
);

create index if not exists mobility_lines_network_idx
  on public.mobility_lines(network_id, code);
create index if not exists mobility_line_stops_direction_sequence_idx
  on public.mobility_line_stops(direction_id, stop_sequence);
create index if not exists mobility_assertions_subject_idx
  on public.mobility_data_assertions(subject_type, subject_id, predicate);
create index if not exists mobility_statistics_network_metric_idx
  on public.mobility_network_statistics(network_id, metric_code, observed_at desc);

-- RLS activé sans politique publique : les clients anon/authenticated n'ont
-- aucun accès direct. L'API serveur contrôlée utilisera son rôle privilégié.
alter table public.mobility_networks enable row level security;
alter table public.mobility_sources enable row level security;
alter table public.mobility_dataset_versions enable row level security;
alter table public.mobility_network_statistics enable row level security;
alter table public.mobility_lines enable row level security;
alter table public.mobility_stops enable row level security;
alter table public.mobility_directions enable row level security;
alter table public.mobility_line_stops enable row level security;
alter table public.mobility_transfers enable row level security;
alter table public.mobility_service_patterns enable row level security;
alter table public.mobility_data_assertions enable row level security;

comment on table public.mobility_network_statistics is
  'Official published counts and other network metrics; never equate them with imported catalogue record counts.';
comment on table public.mobility_directions is
  'Each direction is explicit; never synthesize the return route by reversing the outbound sequence.';
comment on table public.mobility_data_assertions is
  'Source-backed claims with status and validity; AI output is not an authoritative source.';
