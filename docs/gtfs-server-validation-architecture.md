# GTFS server-side validation architecture

## Decision

Keep `scripts/validate_gtfs.py` as the reference validator and execute it only in a trusted server-side worker. Do not duplicate its rules in the browser and do not trust any validation status supplied by the uploaded manifest.

The current `dakar-gtfs-ingest` Edge Function remains an intake-only endpoint: authenticate an active reviewer, enforce the actual request-body limit, verify the archive checksum, and store the archive and manifest privately. A successful upload must remain `PENDING_SERVER_CHECK`, `PENDING_REVIEW`, and `NOT_PUBLISHED`.

## Why validation must not run inside the intake Edge Function

The reference validator is not a lightweight header check. It reads the ZIP central directory, checks every archive entry, streams several CSV tables, maintains cross-reference indexes in SQLite, validates IDs/sequences/times/calendars/coordinates, and computes a SHA-256 digest. Its default limits permit a 100 MiB archive, 500 MiB uncompressed content, and up to two million rows per table.

Running that complete operation inside the upload request would couple upload reliability to expensive decompression and CSV processing. Supabase Edge Functions document a 2-second CPU limit per request, alongside memory and wall-clock limits. A single request is therefore not an appropriate execution boundary for this workload.

References:
- https://supabase.com/docs/guides/functions/limits
- https://supabase.com/docs/guides/functions/background-tasks

## Required worker contract

A future worker must:

1. Claim one staged dataset atomically, with a lease/timeout so abandoned work can be retried safely.
2. Download only the object path recorded in the private `dakar-gtfs-staging` bucket.
3. Verify the downloaded byte count and SHA-256 against the immutable staged metadata before parsing.
4. Run the existing Python validator with explicit production limits; never accept a caller-provided limit increase.
5. Persist the complete structured report, including issue counts, bounded issue details, table row counts, validator version, and archive hash.
6. Set `integrity_status = OK` only when the trusted validator reports `structure_valid = true`; otherwise set it to `INVALID`.
7. Leave `review_status = PENDING_REVIEW` and `publication_status = NOT_PUBLISHED` in both cases. Structural validity is not source authority, licence approval, freshness, or permission to publish.
8. Be idempotent: retrying the same archive hash must not create a second dataset or overwrite an existing report with a report for different bytes.
9. Never write to the live transport catalogue. Human review and the separate publication workflow remain mandatory.

## Execution boundary and credentials

A dedicated worker on a managed runner is the simplest way to reuse the existing Python validator without reimplementing ZIP/CSV/SQLite behavior. A GitHub-hosted Actions runner is a candidate because the repository already uses Actions and its CI installs Python 3.11.

However, the worker would need narrowly scoped access to the Dakar Bus Supabase project to read private staged objects and write validation reports. The service-role key is highly privileged. It must not be copied into source code, workflow files, logs, or chat, and must not be added to a new secret store without explicit authorization. No existing secret availability is assumed.

Until a secure worker identity and credential path are approved, do not deploy a validator, change Supabase secrets, or promote any staged dataset. Keep all existing staged rows pending. Render is not part of this design.

## Acceptance tests before enabling the worker

- Valid synthetic feed: report is structurally valid, but not production-ready.
- Invalid references, duplicate IDs, malformed CSV, bad calendars/times, and invalid coordinates: report is invalid with bounded issue details.
- ZIP traversal, symlink, encrypted entry, duplicate member, oversized member, oversized expanded total, and excessive entry count: reject safely.
- Archive hash mismatch or changed bytes between staging and validation: reject without updating integrity to OK.
- Worker crash/timeout: lease expires and the same job can be retried without duplicate rows.
- Repeated execution: idempotent report for the same dataset/hash.
- No test fixture is ever inserted into the live dataset.
