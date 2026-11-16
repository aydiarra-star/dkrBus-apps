create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

create schema auth;
create schema storage;

create table auth.users (
  id uuid primary key,
  email text,
  email_confirmed_at timestamptz
);

create function auth.role()
returns text
language sql
stable
as $
  select current_setting('request.jwt.claim.role', true)
$;

create function auth.jwt()
returns jsonb
language sql
stable
as $
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$;

create function auth.uid()
returns uuid
language sql
stable
as $
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id bigint generated always as identity primary key,
  bucket_id text not null,
  name text not null
);
