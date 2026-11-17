-- Isolated PostgreSQL test for the private GTFS Storage bucket and metadata ACLs.
-- The generic permissive policy below is a synthetic stand-in for broad policies
-- that might be added for unrelated Storage buckets; restrictive policies must
-- deny non-workers, permit worker reads only, and keep all worker writes blocked.
insert into auth.users (id, email, email_confirmed_at)
values ('00000000-0000-4000-8000-000000000119', 'gtfs-worker-storage-ci@example.invalid', now())
on conflict (id) do nothing;

do $metadata_acl_test$
declare
  target_table regclass;
begin
  foreach target_table in array array[
    'public.dakar_admin_staged_datasets'::regclass,
    'public.dakar_admin_actors'::regclass,
    'public.dakar_admin_audit_events'::regclass
  ] loop
    if has_table_privilege('anon', target_table, 'SELECT')
       or has_table_privilege('anon', target_table, 'INSERT')
       or has_table_privilege('anon', target_table, 'UPDATE')
       or has_table_privilege('anon', target_table, 'DELETE')
       or has_table_privilege('authenticated', target_table, 'SELECT')
       or has_table_privilege('authenticated', target_table, 'INSERT')
       or has_table_privilege('authenticated', target_table, 'UPDATE')
       or has_table_privilege('authenticated', target_table, 'DELETE') then
      raise exception 'Application roles have direct privileges on %', target_table;
    end if;
  end loop;

  if not exists (
    select 1
      from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = 'dakar_gtfs_staging_deny_non_bypass_roles'
       and permissive = 'RESTRICTIVE'
       and cmd = 'ALL'
       and qual like '%dakar-gtfs-staging%'
       and with_check like '%dakar-gtfs-staging%'
  ) then
    raise exception 'Restrictive private-bucket policy is missing or incomplete';
  end if;

  if coalesce((select public from storage.buckets where id = 'dakar-gtfs-staging'), true) then
    raise exception 'GTFS staging bucket is not private';
  end if;

  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
      and policyname='dakar_gtfs_staging_worker_read' and permissive='PERMISSIVE' and cmd='SELECT')
     or not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
      and policyname='dakar_gtfs_worker_scope' and permissive='RESTRICTIVE' and cmd='ALL')
     or not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
      and policyname='dakar_gtfs_staging_worker_no_insert' and permissive='RESTRICTIVE' and cmd='INSERT')
     or not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
      and policyname='dakar_gtfs_staging_worker_no_update' and permissive='RESTRICTIVE' and cmd='UPDATE')
     or not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
      and policyname='dakar_gtfs_staging_worker_no_delete' and permissive='RESTRICTIVE' and cmd='DELETE') then
    raise exception 'Dedicated worker Storage read-only policies are incomplete';
  end if;
end;
$metadata_acl_test$;

-- Simulate a broad permissive Storage policy. The restrictive bucket policy must
-- take precedence for this bucket while leaving unrelated buckets unaffected.
grant usage on schema storage to anon, authenticated, service_role;
grant select, insert, update, delete on table storage.objects to anon, authenticated, service_role;
alter role service_role bypassrls;
drop policy if exists test_generic_storage_access on storage.objects;
create policy test_generic_storage_access
on storage.objects
as permissive
for all
to anon, authenticated
using (true)
with check (true);

insert into storage.objects (bucket_id, name)
values ('dakar-gtfs-staging', 'synthetic-only/private-policy-test.zip');

insert into storage.buckets (id, name, public)
values ('dakar-bus-other-test', 'dakar-bus-other-test', false)
on conflict (id) do nothing;
insert into storage.objects (bucket_id, name)
values ('dakar-bus-other-test', 'synthetic-only/other-policy-test.zip');

set request.jwt.claim.role = 'anon';
set request.jwt.claim.sub = '';
set request.jwt.claims = '{}';
set role anon;
do $anon_storage_test$
declare
  visible_count bigint;
  affected bigint;
  rejected boolean := false;
begin
  select count(*) into visible_count
    from storage.objects
   where bucket_id = 'dakar-gtfs-staging';
  if visible_count <> 0 then
    raise exception 'anon can read the private GTFS staging bucket';
  end if;

  begin
    insert into storage.objects (bucket_id, name)
    values ('dakar-gtfs-staging', 'synthetic-only/anon-write.zip');
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then
    raise exception 'anon can insert into the private GTFS staging bucket';
  end if;

  update storage.objects
     set name = 'synthetic-only/anon-overwrite.zip'
   where bucket_id = 'dakar-gtfs-staging'
     and name = 'synthetic-only/private-policy-test.zip';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'anon can update the private GTFS staging bucket';
  end if;

  delete from storage.objects
   where bucket_id = 'dakar-gtfs-staging'
     and name = 'synthetic-only/private-policy-test.zip';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'anon can delete from the private GTFS staging bucket';
  end if;

  select count(*) into visible_count
    from storage.objects
   where bucket_id = 'dakar-bus-other-test';
  if visible_count <> 1 then
    raise exception 'The restrictive GTFS policy unexpectedly blocks an unrelated bucket';
  end if;

  insert into storage.objects (bucket_id, name)
  values ('dakar-bus-other-test', 'synthetic-only/anon-other.zip');
  update storage.objects
     set name = 'synthetic-only/anon-other-updated.zip'
   where bucket_id = 'dakar-bus-other-test'
     and name = 'synthetic-only/anon-other.zip';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'The generic policy cannot update an unrelated bucket';
  end if;
  delete from storage.objects
   where bucket_id = 'dakar-bus-other-test'
     and name = 'synthetic-only/anon-other-updated.zip';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'The generic policy cannot delete from an unrelated bucket';
  end if;
end;
$anon_storage_test$;
reset role;

set request.jwt.claim.role = 'authenticated';
set request.jwt.claim.sub = '';
set request.jwt.claims = '{}';
set role authenticated;
do $authenticated_storage_test$
declare
  visible_count bigint;
  affected bigint;
  rejected boolean := false;
begin
  select count(*) into visible_count
    from storage.objects
   where bucket_id = 'dakar-gtfs-staging';
  if visible_count <> 0 then
    raise exception 'authenticated can read the private GTFS staging bucket';
  end if;

  begin
    insert into storage.objects (bucket_id, name)
    values ('dakar-gtfs-staging', 'synthetic-only/authenticated-write.zip');
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then
    raise exception 'authenticated can insert into the private GTFS staging bucket';
  end if;

  update storage.objects
     set name = 'synthetic-only/authenticated-overwrite.zip'
   where bucket_id = 'dakar-gtfs-staging'
     and name = 'synthetic-only/private-policy-test.zip';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'authenticated can update the private GTFS staging bucket';
  end if;

  delete from storage.objects
   where bucket_id = 'dakar-gtfs-staging'
     and name = 'synthetic-only/private-policy-test.zip';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'authenticated can delete from the private GTFS staging bucket';
  end if;

  select count(*) into visible_count
    from storage.objects
   where bucket_id = 'dakar-bus-other-test';
  if visible_count <> 1 then
    raise exception 'The restrictive GTFS policy unexpectedly blocks an unrelated bucket for authenticated';
  end if;

  insert into storage.objects (bucket_id, name)
  values ('dakar-bus-other-test', 'synthetic-only/authenticated-other.zip');
  update storage.objects
     set name = 'synthetic-only/authenticated-other-updated.zip'
   where bucket_id = 'dakar-bus-other-test'
     and name = 'synthetic-only/authenticated-other.zip';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'The generic policy cannot update an unrelated bucket for authenticated';
  end if;
  delete from storage.objects
   where bucket_id = 'dakar-bus-other-test'
     and name = 'synthetic-only/authenticated-other-updated.zip';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'The generic policy cannot delete from an unrelated bucket for authenticated';
  end if;
end;
$authenticated_storage_test$;
reset role;

set request.jwt.claim.role = 'authenticated';
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000119';
set request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000119","role":"authenticated","app_metadata":{"dakar_gtfs_worker":true}}';
set role authenticated;
do $worker_storage_test$
declare
  visible_count bigint;
  affected bigint;
  rejected boolean := false;
begin
  select count(*) into visible_count
    from storage.objects
   where bucket_id = 'dakar-gtfs-staging';
  if visible_count <> 1 then
    raise exception 'The dedicated worker cannot read the private GTFS staging bucket';
  end if;

  select count(*) into visible_count
    from storage.objects
   where bucket_id = 'dakar-bus-other-test';
  if visible_count <> 0 then
    raise exception 'The dedicated worker can read an unrelated Storage bucket';
  end if;

  begin
    insert into storage.objects (bucket_id, name)
    values ('dakar-gtfs-staging', 'synthetic-only/worker-write.zip');
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then
    raise exception 'The dedicated worker can insert into the private GTFS staging bucket';
  end if;

  update storage.objects
     set name = 'synthetic-only/worker-overwrite.zip'
   where bucket_id = 'dakar-gtfs-staging'
     and name = 'synthetic-only/private-policy-test.zip';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'The dedicated worker can update the private GTFS staging bucket';
  end if;

  delete from storage.objects
   where bucket_id = 'dakar-gtfs-staging'
     and name = 'synthetic-only/private-policy-test.zip';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'The dedicated worker can delete from the private GTFS staging bucket';
  end if;

  rejected := false;
  begin
    insert into storage.objects (bucket_id, name)
    values ('dakar-bus-other-test', 'synthetic-only/worker-other.zip');
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected then
    raise exception 'The dedicated worker can write to an unrelated Storage bucket';
  end if;
end;
$worker_storage_test$;
reset role;

set request.jwt.claim.role = 'service_role';
set request.jwt.claim.sub = '';
set request.jwt.claims = '{}';
set role service_role;
do $service_role_storage_test$
declare
  visible_count bigint;
begin
  select count(*) into visible_count
    from storage.objects
   where bucket_id = 'dakar-gtfs-staging';
  if visible_count <> 1 then
    raise exception 'service_role cannot access the private staging object';
  end if;
end;
$service_role_storage_test$;
reset role;
