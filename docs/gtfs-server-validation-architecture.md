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


## Hardening follow-up

The private worker is pinned to the dedicated Dakar Bus Supabase project reference mdmuxzaewqzqutkqdylo; it rejects any other host, URL path, credentials, query string, or non-HTTPS endpoint. It accepts only the private dakar-gtfs-staging bucket and the canonical object path <dataset_id>/<sha256>/feed.zip.

Before a report can be stored, the worker verifies the validator schema version, archive filename, exact byte count and SHA-256, fixed production resource limits, non-negative table counts, bounded issue objects, and the consistency rule structure_valid == (errors == 0). A report cannot set production_ready to true. The database RPC independently checks the hash, size, core report shape, fixed limits and status/count consistency; it rejects stale lease tokens and appends a server-validation audit event in the same transaction.

Stop-time chronology is now checked after sorting by trip_id and stop_sequence, independently of the order in which rows appear in stop_times.txt. An unsorted file remains a warning, but it can no longer bypass chronological validation.

The new migration is exercised only against an isolated PostgreSQL 16 service in GitHub Actions. It is not applied to the active Supabase database by CI. The manual worker workflow is not dispatched as part of CI. No real GTFS archive is assumed, no staged row is created, and a structurally valid result still leaves human review pending and publication disabled.


## Intake cleanup and activation boundary

The intake function now accepts exactly one `feed`, `manifest`, and `dataset_id` multipart field. If a later upload or staging-row insert fails, it attempts to remove only the objects created by that request and returns a distinct error when Storage reports that cleanup was incomplete. Database error details are not returned to the caller.

The multipart parser enforces the actual request-stream byte count even when `Content-Length` is absent. It still materializes the bounded `FormData` and archive bytes in the Edge Function before hashing; the 100 MiB archive limit is therefore a request cap, not proof that a 100 MiB upload fits the active Edge Function memory/CPU budget. Do not deploy or enable this intake path until its runtime resource behavior is verified in a dedicated non-production Supabase project, or the upload path is changed to a bounded direct-to-private-Storage flow. CI uses only synthetic in-memory multipart tests and does not upload files or write to Supabase.
