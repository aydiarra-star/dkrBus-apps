-- Private storage and metadata registry for GTFS staging.
-- No existing mobility tables or transport records are changed.
-- Uploads and integrity checks must be performed by a trusted server using service_role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dakar-gtfs-staging', 'dakar-gtfs-staging', false, 524288000, array['application/zip','application/json'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.dakar_admin_staged_datasets (
  dataset_id text primary key check (dataset_id ~ '^[a-z0-9][a-z0-9-]{0,119}$'),
  dataset_version text not null,
  operator text not null,
  source text not null,
  source_type text not null check (source_type in ('OFFICIAL','GTFS','VERIFIED','COMMUNITY','UNKNOWN')),
  source_url text,
  date_source text not null,
  verified_at timestamptz not null,
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  service_status text not null check (service_status in ('ACTIVE','PLANNED','SUSPENDED','UNKNOWN')),
  validity_status text not null check (validity_status in ('NOT_YET_VALID','CURRENT','STALE')),
  archive_bucket text not null default 'dakar-gtfs-staging' check (archive_bucket = 'dakar-gtfs-staging'),
  archive_object_path text not null unique,
  manifest_object_path text not null unique,
  archive_sha256 text not null check (archive_sha256 ~ '^[a-f0-9]{64}$'),
  archive_bytes bigint not null check (archive_bytes > 0),
  manifest_sha256 text not null check (manifest_sha256 ~ '^[a-f0-9]{64}$'),
  record_count jsonb not null default '{}'::jsonb check (jsonb_typeof(record_count) = 'object'),
  validation_report jsonb not null default '{}'::jsonb check (jsonb_typeof(validation_report) = 'object'),
  integrity_status text not null default 'PENDING_SERVER_CHECK'
    check (integrity_status in ('PENDING_SERVER_CHECK','OK','INVALID')),
  review_status text not null default 'PENDING_REVIEW'
    check (review_status in ('PENDING_REVIEW','APPROVED','REJECTED')),
  publication_status text not null default 'NOT_PUBLISHED'
    check (publication_status in ('NOT_PUBLISHED','PUBLISHED')),
  imported_by uuid references auth.users(id) on delete restrict,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (valid_until > valid_from)
);

create index if not exists dakar_admin_staged_datasets_review_idx
  on public.dakar_admin_staged_datasets (review_status, imported_at desc);
create index if not exists dakar_admin_staged_datasets_operator_idx
  on public.dakar_admin_staged_datasets (operator, dataset_version);

alter table public.dakar_admin_staged_datasets enable row level security;
revoke all on table public.dakar_admin_staged_datasets from anon, authenticated;
grant all on table public.dakar_admin_staged_datasets to service_role;

drop policy if exists dakar_gtfs_staging_service_role_only on storage.objects;
create policy dakar_gtfs_staging_service_role_only
on storage.objects
for all
to service_role
using (bucket_id = 'dakar-gtfs-staging')
with check (bucket_id = 'dakar-gtfs-staging');
