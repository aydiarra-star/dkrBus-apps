-- Isolated PostgreSQL test for the private GTFS Storage bucket and metadata ACLs.
-- The generic permissive policy below is a synthetic stand-in for broad policies
-- that might be added for unrelated Storage buckets; the restrictive policy
-- must still deny this one bucket to anon/authenticated.

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

set role anon;
do $anon_storage_test$
declare
  visible_count bigint;
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
    raise exception 'anon can write to the private GTFS staging bucket';
  end if;
end;
$anon_storage_test$;
reset role;

set role authenticated;
do $authenticated_storage_test$
declare
  visible_count bigint;
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
    raise exception 'authenticated can write to the private GTFS staging bucket';
  end if;
end;
$authenticated_storage_test$;
reset role;

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
