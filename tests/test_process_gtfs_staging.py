from __future__ import annotations

import hashlib
import unittest

from scripts.process_gtfs_staging import (
    EXPECTED_VALIDATOR_LIMITS,
    MAX_ARCHIVE_BYTES,
    STAGING_BUCKET,
    SUPABASE_HOST,
    SupabaseRest,
    WorkerError,
    validate_claimed_job,
    validate_report,
    validate_supabase_url,
    verify_archive_bytes,
)

VALID_SHA = "a" * 64
VALID_LEASE = "123e4567-e89b-42d3-a456-426614174000"


def valid_report(archive_bytes: int = 128, sha256: str = VALID_SHA) -> dict:
    return {
        "schema_version": "1.0",
        "dataset": {"filename": "feed.zip", "archive_bytes": archive_bytes, "sha256": sha256},
        "validated_at": "2026-11-13T18:00:00+00:00",
        "structure_valid": True,
        "production_ready": False,
        "scope": "GTFS Static structure only; never production approval.",
        "counts": {"errors": 0, "warnings": 0},
        "tables": {"stops.txt": 2},
        "issues": [],
        "limits": dict(EXPECTED_VALIDATOR_LIMITS),
    }


def valid_job() -> dict:
    return {
        "dataset_id": "synthetic-feed",
        "archive_bucket": STAGING_BUCKET,
        "archive_object_path": f"synthetic-feed/{VALID_SHA}/feed.zip",
        "archive_sha256": VALID_SHA,
        "archive_bytes": 128,
        "lease_token": VALID_LEASE,
    }


class GTFSWorkerTests(unittest.TestCase):
    def test_archive_hash_and_size_are_verified(self) -> None:
        payload = b"PK\x03\x04synthetic-test"
        verify_archive_bytes(payload, len(payload), hashlib.sha256(payload).hexdigest())

    def test_archive_hash_mismatch_is_rejected(self) -> None:
        payload = b"PK\x03\x04synthetic-test"
        with self.assertRaisesRegex(WorkerError, "ARCHIVE_SHA256_MISMATCH"):
            verify_archive_bytes(payload, len(payload), "0" * 64)

    def test_invalid_archive_digest_is_rejected(self) -> None:
        with self.assertRaisesRegex(WorkerError, "ARCHIVE_SHA256_INVALID"):
            verify_archive_bytes(b"PK\x03\x04x", 5, "not-a-sha")

    def test_archive_size_mismatch_and_limit_are_rejected(self) -> None:
        payload = b"PK\x03\x04synthetic-test"
        with self.assertRaisesRegex(WorkerError, "ARCHIVE_SIZE_MISMATCH"):
            verify_archive_bytes(payload, len(payload) + 1, hashlib.sha256(payload).hexdigest())
        with self.assertRaisesRegex(WorkerError, "ARCHIVE_SIZE_MISMATCH"):
            verify_archive_bytes(b"PK", MAX_ARCHIVE_BYTES + 1, hashlib.sha256(b"PK").hexdigest())

    def test_non_zip_payload_is_rejected(self) -> None:
        payload = b"not a zip archive"
        with self.assertRaisesRegex(WorkerError, "ARCHIVE_NOT_ZIP"):
            verify_archive_bytes(payload, len(payload), hashlib.sha256(payload).hexdigest())

    def test_report_accepts_complete_hash_and_size_bound_validator_output(self) -> None:
        report = validate_report(valid_report(), VALID_SHA, 128)
        self.assertFalse(report["production_ready"])

    def test_report_must_be_bound_to_the_claimed_archive_hash(self) -> None:
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_HASH_MISMATCH"):
            validate_report(valid_report(), "b" * 64, 128)

    def test_report_must_be_bound_to_the_claimed_archive_size(self) -> None:
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_SIZE_MISMATCH"):
            validate_report(valid_report(archive_bytes=129), VALID_SHA, 128)

    def test_report_cannot_claim_production_readiness(self) -> None:
        report = valid_report()
        report["production_ready"] = True
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_PRODUCTION_READY_FORBIDDEN"):
            validate_report(report, VALID_SHA, 128)

    def test_report_status_must_match_error_count(self) -> None:
        report = valid_report()
        report["counts"]["errors"] = 1
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_STATUS_COUNT_MISMATCH"):
            validate_report(report, VALID_SHA, 128)

    def test_report_counts_and_table_rows_must_be_non_negative_integers(self) -> None:
        report = valid_report()
        report["counts"]["warnings"] = True
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_COUNTS_INVALID"):
            validate_report(report, VALID_SHA, 128)

        report = valid_report()
        report["tables"]["stops.txt"] = -1
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_TABLE_COUNT_INVALID"):
            validate_report(report, VALID_SHA, 128)

    def test_report_issue_details_must_be_well_formed_and_counted(self) -> None:
        report = valid_report()
        report["issues"] = [{"severity": "ERROR", "code": "BAD", "message": "bad"}]
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_ISSUE_COUNTS_MISMATCH"):
            validate_report(report, VALID_SHA, 128)

        report["counts"]["errors"] = 1
        report["structure_valid"] = False
        report["issues"][0]["code"] = ""
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_ISSUE_INVALID"):
            validate_report(report, VALID_SHA, 128)

    def test_report_must_use_the_expected_validator_resource_limits(self) -> None:
        report = valid_report()
        report["limits"]["max_archive_bytes"] += 1
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_LIMITS_MISMATCH"):
            validate_report(report, VALID_SHA, 128)

    def test_claimed_job_accepts_only_the_dedicated_bucket_and_canonical_path(self) -> None:
        job = valid_job()
        self.assertEqual(validate_claimed_job(job), 128)
        job["archive_bytes"] = "128"
        self.assertEqual(validate_claimed_job(job), 128)

        job = valid_job()
        job["archive_object_path"] = "../other-project/feed.zip"
        with self.assertRaisesRegex(WorkerError, "CLAIM_OBJECT_PATH_INVALID"):
            validate_claimed_job(job)

    def test_claimed_job_rejects_wrong_bucket_hash_dataset_and_lease(self) -> None:
        for key, value, code in [
            ("archive_bucket", "public", "CLAIM_BUCKET_INVALID"),
            ("archive_sha256", "xyz", "CLAIM_SHA256_INVALID"),
            ("dataset_id", "../bad", "CLAIM_DATASET_ID_INVALID"),
            ("lease_token", "not-a-uuid", "CLAIM_LEASE_TOKEN_INVALID"),
            ("archive_bytes", True, "CLAIM_ARCHIVE_SIZE_INVALID"),
        ]:
            job = valid_job()
            job[key] = value
            with self.subTest(key=key), self.assertRaisesRegex(WorkerError, code):
                validate_claimed_job(job)

    def test_supabase_url_is_pinned_to_the_dakar_bus_project(self) -> None:
        self.assertEqual(validate_supabase_url(f"https://{SUPABASE_HOST}"), f"https://{SUPABASE_HOST}")
        self.assertEqual(SupabaseRest(f"https://{SUPABASE_HOST}/", "test-key").base_url, f"https://{SUPABASE_HOST}")
        for url in [
            "https://other-project.supabase.co",
            f"http://{SUPABASE_HOST}",
            f"https://{SUPABASE_HOST}/other",
            f"https://user:pass@{SUPABASE_HOST}",
            f"https://{SUPABASE_HOST}?project=other",
        ]:
            with self.subTest(url=url), self.assertRaises(WorkerError):
                validate_supabase_url(url)

    def test_storage_download_rejects_noncanonical_path_before_network_access(self) -> None:
        client = SupabaseRest(f"https://{SUPABASE_HOST}", "test-key")
        with self.assertRaisesRegex(WorkerError, "UNSAFE_ARCHIVE_OBJECT_REFERENCE"):
            client.download(STAGING_BUCKET, "../../secrets")


if __name__ == "__main__":
    unittest.main()
