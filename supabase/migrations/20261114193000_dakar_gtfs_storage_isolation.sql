-- Defense in depth for the private Dakar Bus GTFS quarantine.
-- A restrictive policy blocks every non-BYPASSRLS role even if another permissive
-- storage.objects policy is added later for a different bucket.
begin;

alter table storage.objects enable row level security;

drop policy if exists dakar_gtfs_staging_deny_non_bypass_roles on storage.objects;
create policy dakar_gtfs_staging_deny_non_bypass_roles
on storage.objects
as restrictive
for all
to public
using (bucket_id <> 'dakar-gtfs-staging')
with check (bucket_id <> 'dakar-gtfs-staging');

-- Do not rely on default ACLs: explicitly remove any PUBLIC inheritance from
-- the administrative metadata tables while preserving the direct service_role
-- grants established by the least-privilege migration.
revoke all on table public.dakar_admin_staged_datasets from public, anon, authenticated;
revoke all on table public.dakar_admin_actors from public, anon, authenticated;
revoke all on table public.dakar_admin_audit_events from public, anon, authenticated;

comment on policy dakar_gtfs_staging_deny_non_bypass_roles on storage.objects is
  'Restrictive deny for the private GTFS staging bucket; prevents broad permissive policies from exposing this bucket to non-BYPASSRLS roles.';

commit;
