#!/usr/bin/env bash
set -euo pipefail

: "$DATABASE_URL"

tmpdir="$(mktemp -d)"
first_pid=""

cleanup() {
  if [[ -n "$first_pid" ]]; then
    wait "$first_pid" 2>/dev/null || true
  fi
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
    DELETE FROM public.dakar_admin_staged_datasets
     WHERE dataset_id IN ('worker-concurrency-first', 'worker-concurrency-second');
    DELETE FROM auth.users
     WHERE id IN (
       '00000000-0000-4000-8000-000000000171',
       '00000000-0000-4000-8000-000000000172'
     );" >/dev/null 2>&1 || true
  rm -rf "$tmpdir"
}
trap cleanup EXIT

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO auth.users (id, email, email_confirmed_at)
VALUES
  ('00000000-0000-4000-8000-000000000171', 'gtfs-worker-concurrency-1@example.invalid', now()),
  ('00000000-0000-4000-8000-000000000172', 'gtfs-worker-concurrency-2@example.invalid', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dakar_admin_staged_datasets (
  dataset_id, dataset_version, operator, source, source_type, date_source,
  verified_at, valid_from, valid_until, confidence, service_status, validity_status,
  archive_bucket, archive_object_path, manifest_object_path, archive_sha256,
  archive_bytes, manifest_sha256, imported_at
) VALUES
(
  'worker-concurrency-first', 'synthetic-v1', 'Synthetic CI only', 'Concurrency fixture',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT', 'dakar-gtfs-staging',
  'worker-concurrency-first/' || repeat('a', 64) || '/feed.zip',
  'worker-concurrency-first/' || repeat('a', 64) || '/manifest.json',
  repeat('a', 64), 128, repeat('b', 64), now() - interval '100 days'
),
(
  'worker-concurrency-second', 'synthetic-v1', 'Synthetic CI only', 'Concurrency fixture',
  'UNKNOWN', 'CI', now(), now() - interval '1 day', now() + interval '1 day',
  0.5, 'UNKNOWN', 'CURRENT', 'dakar-gtfs-staging',
  'worker-concurrency-second/' || repeat('c', 64) || '/feed.zip',
  'worker-concurrency-second/' || repeat('c', 64) || '/manifest.json',
  repeat('c', 64), 128, repeat('d', 64), now() - interval '99 days'
);
SQL

# Hold the first claim transaction open after it locks and updates the oldest row.
# The second worker must skip that locked row and claim the next one without waiting.
(
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qAt \
    >"$tmpdir/first.out" 2>"$tmpdir/first.err" <<SQL
BEGIN;
SET request.jwt.claim.role = 'authenticated';
SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000171';
SET request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000171","role":"authenticated","app_metadata":{"dakar_gtfs_worker":true}}';
SELECT dataset_id FROM public.claim_dakar_gtfs_validation(900);
\! touch "$tmpdir/first-claimed"
SELECT pg_sleep(5);
COMMIT;
SQL
) &
first_pid=$!

for _ in $(seq 1 100); do
  [[ -f "$tmpdir/first-claimed" ]] && break
  if ! kill -0 "$first_pid" 2>/dev/null; then
    cat "$tmpdir/first.err" >&2
    echo "The first concurrent worker did not claim a dataset" >&2
    exit 1
  fi
  sleep 0.05
done

if [[ ! -f "$tmpdir/first-claimed" ]]; then
  cat "$tmpdir/first.err" >&2
  echo "Timed out waiting for the first worker claim" >&2
  exit 1
fi

first_dataset="$(grep -E '^(worker-concurrency-first|worker-concurrency-second)$' "$tmpdir/first.out" | head -n 1 || true)"
if [[ "$first_dataset" != "worker-concurrency-first" ]]; then
  cat "$tmpdir/first.out" >&2
  echo "The first worker did not claim the oldest synthetic dataset" >&2
  exit 1
fi

# A two-second statement timeout proves this call does not wait for the first
# transaction's five-second row lock. SKIP LOCKED must return the second row.
second_dataset="$(
  PGOPTIONS='-c statement_timeout=2000' psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qAt <<'SQL'
BEGIN;
SET request.jwt.claim.role = 'authenticated';
SET request.jwt.claim.sub = '00000000-0000-4000-8000-000000000172';
SET request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000172","role":"authenticated","app_metadata":{"dakar_gtfs_worker":true}}';
SELECT dataset_id FROM public.claim_dakar_gtfs_validation(900);
COMMIT;
SQL
)"

if [[ "$second_dataset" != "worker-concurrency-second" ]]; then
  echo "The second worker did not skip the locked row and claim the next dataset: $second_dataset" >&2
  exit 1
fi

wait "$first_pid"
first_pid=""

claimed_count="$(psql "$DATABASE_URL" -qAt -c "
  SELECT count(*)
    FROM public.dakar_admin_staged_datasets
   WHERE dataset_id IN ('worker-concurrency-first', 'worker-concurrency-second')
     AND integrity_status = 'VALIDATING'
     AND validation_lease_token IS NOT NULL
     AND validation_lease_until > now();")"
distinct_leases="$(psql "$DATABASE_URL" -qAt -c "
  SELECT count(DISTINCT validation_lease_token)
    FROM public.dakar_admin_staged_datasets
   WHERE dataset_id IN ('worker-concurrency-first', 'worker-concurrency-second')
     AND integrity_status = 'VALIDATING';")"

if [[ "$claimed_count" != "2" || "$distinct_leases" != "2" ]]; then
  echo "Concurrent claims did not produce two independent active leases" >&2
  exit 1
fi

echo "GTFS worker concurrent claims: two distinct datasets, two active leases, no blocking."
