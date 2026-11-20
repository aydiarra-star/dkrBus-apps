#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

tmpdir="$(mktemp -d)"
first_pid=""

cleanup() {
  if [[ -n "$first_pid" ]]; then
    wait "$first_pid" 2>/dev/null || true
  fi
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
    DELETE FROM public.dakar_admin_gtfs_upload_sessions
     WHERE dataset_id IN ('synthetic-cleanup-race-cleanup-first', 'synthetic-cleanup-race-finalize-first');" >/dev/null 2>&1 || true
  rm -rf "$tmpdir"
}
trap cleanup EXIT

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DELETE FROM public.dakar_admin_gtfs_upload_sessions
 WHERE dataset_id IN ('synthetic-cleanup-race-cleanup-first', 'synthetic-cleanup-race-finalize-first');

INSERT INTO public.dakar_admin_gtfs_upload_sessions (
  dataset_id, dataset_version, operator, source, source_type, date_source,
  verified_at, valid_from, valid_until, confidence, service_status, validity_status,
  archive_object_path, manifest_object_path, archive_sha256, archive_bytes,
  manifest_sha256, manifest_text, expires_at, created_at
) VALUES
(
  'synthetic-cleanup-race-cleanup-first', 'synthetic-v1', 'Synthetic CI only', 'CI race',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT',
  'synthetic-cleanup-race-cleanup-first/' || repeat('a',64) || '/feed.zip',
  'synthetic-cleanup-race-cleanup-first/' || repeat('a',64) || '/manifest.json',
  repeat('a',64), 128, repeat('b',64), '{"schema_version":"1.0"}',
  now() - interval '1 minute', now() - interval '30 hours'
),
(
  'synthetic-cleanup-race-finalize-first', 'synthetic-v1', 'Synthetic CI only', 'CI race',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT',
  'synthetic-cleanup-race-finalize-first/' || repeat('c',64) || '/feed.zip',
  'synthetic-cleanup-race-finalize-first/' || repeat('c',64) || '/manifest.json',
  repeat('c',64), 128, repeat('d',64), '{"schema_version":"1.0"}',
  now() + interval '1 minute', now() - interval '26 hours 15 minutes'
);
SQL

cleanup_id="00000000-0000-4000-8000-000000000301"
finalize_id="00000000-0000-4000-8000-000000000302"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
  UPDATE public.dakar_admin_gtfs_upload_sessions
     SET upload_id = CASE dataset_id
       WHEN 'synthetic-cleanup-race-cleanup-first' THEN '$cleanup_id'::uuid
       WHEN 'synthetic-cleanup-race-finalize-first' THEN '$finalize_id'::uuid
     END
   WHERE dataset_id IN ('synthetic-cleanup-race-cleanup-first', 'synthetic-cleanup-race-finalize-first');" >/dev/null

# Race A: cleanup claims first and holds the row lock. The finalizer must wait
# for the atomic claim to commit, then observe CLEANUP_PENDING and refuse revival.
(
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qAt >"$tmpdir/cleanup.out" 2>"$tmpdir/cleanup.err" <<SQL
BEGIN;
SET request.jwt.claim.role = 'service_role';
SELECT public.claim_dakar_gtfs_upload_session_cleanup('$cleanup_id', 600);
\! touch "$tmpdir/cleanup-claimed"
SELECT pg_sleep(3);
COMMIT;
SQL
) &
first_pid=$!

for _ in $(seq 1 100); do
  [[ -f "$tmpdir/cleanup-claimed" ]] && break
  if ! kill -0 "$first_pid" 2>/dev/null; then
    cat "$tmpdir/cleanup.err" >&2
    echo "The cleanup transaction did not claim its expired synthetic session" >&2
    exit 1
  fi
  sleep 0.05
done
[[ -f "$tmpdir/cleanup-claimed" ]] || { echo "Timed out waiting for cleanup claim" >&2; exit 1; }
grep -Eq '^(t|true)$' "$tmpdir/cleanup.out" || { cat "$tmpdir/cleanup.out" >&2; echo "Cleanup did not win race A" >&2; exit 1; }

finalize_after_cleanup="$(PGOPTIONS='-c statement_timeout=10000' psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qAt -c "
  SET request.jwt.claim.role = 'service_role';
  SELECT coalesce(public.protect_dakar_gtfs_upload_session_for_finalize('$cleanup_id', 600)::text, 'NULL');")"
[[ "$finalize_after_cleanup" == "NULL" ]] || { echo "Finalizer revived a cleanup-claimed session: $finalize_after_cleanup" >&2; exit 1; }
wait "$first_pid"
first_pid=""

# Race B: finalization extends a live session first and holds the row lock.
# The cleanup claim must then observe the new future expiry and return false.
(
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qAt >"$tmpdir/finalize.out" 2>"$tmpdir/finalize.err" <<SQL
BEGIN;
SET request.jwt.claim.role = 'service_role';
SELECT public.protect_dakar_gtfs_upload_session_for_finalize('$finalize_id', 600);
\! touch "$tmpdir/finalize-claimed"
SELECT pg_sleep(3);
COMMIT;
SQL
) &
first_pid=$!

for _ in $(seq 1 100); do
  [[ -f "$tmpdir/finalize-claimed" ]] && break
  if ! kill -0 "$first_pid" 2>/dev/null; then
    cat "$tmpdir/finalize.err" >&2
    echo "The finalizer transaction did not reserve its synthetic session" >&2
    exit 1
  fi
  sleep 0.05
done
[[ -f "$tmpdir/finalize-claimed" ]] || { echo "Timed out waiting for finalization reservation" >&2; exit 1; }
grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2} ' "$tmpdir/finalize.out" || { cat "$tmpdir/finalize.out" >&2; echo "Finalization did not win race B" >&2; exit 1; }

cleanup_after_finalize="$(PGOPTIONS='-c statement_timeout=10000' psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qAt -c "
  SET request.jwt.claim.role = 'service_role';
  SELECT public.claim_dakar_gtfs_upload_session_cleanup('$finalize_id', 600)::text;")"
[[ "$cleanup_after_finalize" == "false" ]] || { echo "Cleanup claimed a session protected by finalization: $cleanup_after_finalize" >&2; exit 1; }
wait "$first_pid"
first_pid=""

states="$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qAt -c "
  SELECT
    (SELECT state FROM public.dakar_admin_gtfs_upload_sessions WHERE upload_id = '$cleanup_id') || '|' ||
    (SELECT state FROM public.dakar_admin_gtfs_upload_sessions WHERE upload_id = '$finalize_id');")"
[[ "$states" == "CLEANUP_PENDING|UPLOAD_PENDING" ]] || { echo "Unexpected concurrent terminal states: $states" >&2; exit 1; }

echo "GTFS upload cleanup/finalization concurrency: cleanup-first blocks revival; finalize-first blocks cleanup."
