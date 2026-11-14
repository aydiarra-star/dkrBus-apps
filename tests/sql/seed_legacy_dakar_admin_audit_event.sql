-- Synthetic legacy audit row inserted before the hash-chain migration in isolated CI only.
-- The migration must backfill this row before restoring append-only UPDATE protection.
insert into public.dakar_admin_audit_events (
  actor_id, action, target_type, target_id, details
) values (
  null,
  'LEGACY_AUDIT_BACKFILL_TEST',
  'synthetic_fixture',
  'legacy-before-chain',
  jsonb_build_object('fixture', true, 'purpose', 'exercise migration backfill')
);
