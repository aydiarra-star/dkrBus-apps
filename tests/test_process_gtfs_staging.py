from __future__ import annotations

import hashlib
import io
import unittest
import urllib.request
from unittest.mock import Mock, patch

from scripts.process_gtfs_staging import (
    EXPECTED_VALIDATOR_LIMITS,
    MAX_ARCHIVE_BYTES,
    MAX_MANIFEST_BYTES,
    MAX_JSON_RESPONSE_BYTES,
    MAX_VALIDATION_REPORT_BYTES,
    NoRedirectHandler,
    STAGING_BUCKET,
    SUPABASE_HOST,
    VALIDATOR_VERSION,
    SupabaseRest,
    WorkerError,
    validate_claimed_job,
    process_one,
    validate_report,
    validate_supabase_url,
    verify_archive_bytes,
    verify_manifest_bytes,
    worker_error_code,
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
        "manifest_object_path": f"synthetic-feed/{VALID_SHA}/manifest.json",
        "manifest_sha256": "b" * 64,
        "archive_bytes": 128,
        "lease_token": VALID_LEASE,
    }


class GTFSWorkerTests(unittest.TestCase):
    def test_validator_version_tracks_the_current_structural_rules(self) -> None:
        self.assertEqual(VALIDATOR_VERSION, "dakar-gtfs-validator-v7")

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

    def test_manifest_hash_and_archive_binding_are_verified(self) -> None:
        payload = (
            b'{"schema_version":"1.0","dataset_id":"synthetic-feed",'
            b'"review_status":"PENDING_REVIEW","publication_status":"NOT_PUBLISHED",'
            b'"publication_ready":false,"archive":{"stored_as":"feed.zip","bytes":128,"sha256":"'
            + VALID_SHA.encode("ascii")
            + b'"}}'
        )
        digest = hashlib.sha256(payload).hexdigest()
        verify_manifest_bytes(payload, digest, "synthetic-feed", VALID_SHA, 128)

    def test_manifest_hash_dataset_archive_and_governance_mismatches_are_rejected(self) -> None:
        base = (
            b'{"schema_version":"1.0","dataset_id":"synthetic-feed",'
            b'"review_status":"PENDING_REVIEW","publication_status":"NOT_PUBLISHED",'
            b'"publication_ready":false,"archive":{"stored_as":"feed.zip","bytes":128,"sha256":"'
            + VALID_SHA.encode("ascii")
            + b'"}}'
        )
        digest = hashlib.sha256(base).hexdigest()
        with self.assertRaisesRegex(WorkerError, "MANIFEST_SHA256_MISMATCH"):
            verify_manifest_bytes(base, "0" * 64, "synthetic-feed", VALID_SHA, 128)
        with self.assertRaisesRegex(WorkerError, "MANIFEST_DATASET_MISMATCH"):
            verify_manifest_bytes(base, digest, "other-feed", VALID_SHA, 128)
        with self.assertRaisesRegex(WorkerError, "MANIFEST_ARCHIVE_MISMATCH"):
            verify_manifest_bytes(base, digest, "synthetic-feed", VALID_SHA, 127)
        bad_governance = base.replace(b'"NOT_PUBLISHED"', b'"PUBLISHED"')
        with self.assertRaisesRegex(WorkerError, "MANIFEST_GOVERNANCE_STATE_INVALID"):
            verify_manifest_bytes(
                bad_governance,
                hashlib.sha256(bad_governance).hexdigest(),
                "synthetic-feed",
                VALID_SHA,
                128,
            )

    def test_manifest_size_limit_is_enforced(self) -> None:
        with self.assertRaisesRegex(WorkerError, "MANIFEST_SIZE_INVALID"):
            verify_manifest_bytes(b"x" * (MAX_MANIFEST_BYTES + 1), "0" * 64, "synthetic-feed", VALID_SHA, 128)

    def test_report_accepts_complete_hash_and_size_bound_validator_output(self) -> None:
        report = validate_report(valid_report(), VALID_SHA, 128)
        self.assertFalse(report["production_ready"])

    def test_report_payload_size_is_bounded_before_database_submission(self) -> None:
        report = valid_report()
        report["structure_valid"] = False
        report["counts"]["errors"] = 1
        report["issues"] = [{
            "severity": "ERROR",
            "code": "SYNTHETIC",
            "message": "x" * MAX_VALIDATION_REPORT_BYTES,
        }]
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_TOO_LARGE"):
            validate_report(report, VALID_SHA, 128)

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

    def test_claimed_job_rejects_noncanonical_manifest_path_and_digest(self) -> None:
        for key, value, code in [
            ("manifest_object_path", "../manifest.json", "CLAIM_MANIFEST_PATH_INVALID"),
            ("manifest_sha256", "not-a-hash", "CLAIM_MANIFEST_SHA256_INVALID"),
        ]:
            job = valid_job()
            job[key] = value
            with self.subTest(key=key), self.assertRaisesRegex(WorkerError, code):
                validate_claimed_job(job)

    def test_supabase_url_is_pinned_to_the_dakar_bus_project(self) -> None:
        self.assertEqual(validate_supabase_url(f"https://{SUPABASE_HOST}"), f"https://{SUPABASE_HOST}")
        self.assertEqual(SupabaseRest(f"https://{SUPABASE_HOST}/", "test-anon-key", "worker@example.invalid", "synthetic-password").base_url, f"https://{SUPABASE_HOST}")
        for url in [
            f" https://{SUPABASE_HOST}",
            f"https://{SUPABASE_HOST} ",
            "https://other-project.supabase.co",
            f"http://{SUPABASE_HOST}",
            f"https://{SUPABASE_HOST}/other",
            f"https://user:pass@{SUPABASE_HOST}",
            f"https://{SUPABASE_HOST}?project=other",
        ]:
            with self.subTest(url=url), self.assertRaises(WorkerError):
                validate_supabase_url(url)

    def test_worker_credentials_reject_surrounding_whitespace(self) -> None:
        with self.assertRaisesRegex(WorkerError, "WORKER_CREDENTIALS_MISSING"):
            SupabaseRest(
                f"https://{SUPABASE_HOST}",
                " test-anon-key",
                "worker@example.invalid",
                "synthetic-password",
            )
        with self.assertRaisesRegex(WorkerError, "WORKER_CREDENTIALS_MISSING"):
            SupabaseRest(
                f"https://{SUPABASE_HOST}",
                "test-anon-key",
                " worker@example.invalid",
                "synthetic-password",
            )

    def test_authenticate_uses_password_grant_and_keeps_the_worker_token_private(self) -> None:
        with patch("scripts.process_gtfs_staging.urllib.request.build_opener") as build_opener:
            opener = Mock()
            opener.open.return_value = io.BytesIO(
                b'{"access_token":"synthetic-access-token","user":{"email":"worker@example.invalid",'
                b'"email_confirmed_at":"2026-11-17T00:00:00Z","app_metadata":{"dakar_gtfs_worker":true}}}'
            )
            build_opener.return_value = opener

            client = SupabaseRest(
                f"https://{SUPABASE_HOST}",
                "test-anon-key",
                "worker@example.invalid",
                "synthetic-password",
            )
            client.authenticate()

            request = opener.open.call_args.args[0]
            self.assertEqual(request.full_url, f"https://{SUPABASE_HOST}/auth/v1/token?grant_type=password")
            self.assertEqual(request.get_header("Apikey"), "test-anon-key")
            self.assertEqual(client.access_token, "synthetic-access-token")
            self.assertNotIn("synthetic-password", repr(client.access_token))

    def test_authenticate_rejects_unconfirmed_or_unprivileged_worker_accounts(self) -> None:
        responses = [
            (
                b'{"access_token":"synthetic-token","user":{"email":"worker@example.invalid",'
                b'"email_confirmed_at":null,"app_metadata":{"dakar_gtfs_worker":true}}}',
                "WORKER_ACCOUNT_NOT_CONFIRMED",
            ),
            (
                b'{"access_token":"synthetic-token","user":{"email":"worker@example.invalid",'
                b'"email_confirmed_at":"2026-11-17T00:00:00Z","app_metadata":{"dakar_gtfs_worker":false}}}',
                "WORKER_IDENTITY_CLAIM_MISSING",
            ),
            (
                b'{"access_token":"synthetic-token","user":{"email":"other@example.invalid",'
                b'"email_confirmed_at":"2026-11-17T00:00:00Z","app_metadata":{"dakar_gtfs_worker":true}}}',
                "WORKER_ACCOUNT_MISMATCH",
            ),
        ]
        for response_body, expected_error in responses:
            with self.subTest(expected_error=expected_error):
                with patch("scripts.process_gtfs_staging.urllib.request.build_opener") as build_opener:
                    opener = Mock()
                    opener.open.return_value = io.BytesIO(response_body)
                    build_opener.return_value = opener
                    client = SupabaseRest(
                        f"https://{SUPABASE_HOST}",
                        "test-anon-key",
                        "worker@example.invalid",
                        "synthetic-password",
                    )
                    with self.assertRaisesRegex(WorkerError, expected_error):
                        client.authenticate()
                    self.assertIsNone(client.access_token)

    def test_request_rejects_oversized_json_responses(self) -> None:
        with patch("scripts.process_gtfs_staging.urllib.request.build_opener") as build_opener:
            opener = Mock()
            opener.open.return_value = io.BytesIO(b"x" * (MAX_JSON_RESPONSE_BYTES + 1))
            build_opener.return_value = opener
            client = SupabaseRest(
                f"https://{SUPABASE_HOST}",
                "test-anon-key",
                "worker@example.invalid",
                "synthetic-password",
            )
            client.access_token = "synthetic-access-token"
            with self.assertRaisesRegex(WorkerError, "SUPABASE_RESPONSE_TOO_LARGE"):
                client.request("/rest/v1/rpc/claim", method="POST", payload={})

    def test_manifest_download_uses_its_canonical_path_and_size_limit(self) -> None:
        manifest_path = f"synthetic-feed/{VALID_SHA}/manifest.json"
        with patch("scripts.process_gtfs_staging.urllib.request.build_opener") as build_opener:
            opener = Mock()
            opener.open.return_value = io.BytesIO(b'{"synthetic":true}')
            build_opener.return_value = opener
            client = SupabaseRest(
                f"https://{SUPABASE_HOST}",
                "test-anon-key",
                "worker@example.invalid",
                "synthetic-password",
            )
            client.access_token = "synthetic-access-token"
            payload = client.download(STAGING_BUCKET, manifest_path, max_bytes=MAX_MANIFEST_BYTES)
            self.assertEqual(payload, b'{"synthetic":true}')
            request = opener.open.call_args.args[0]
            self.assertIn("/dakar-gtfs-staging/" + manifest_path, request.full_url)

        with patch("scripts.process_gtfs_staging.urllib.request.build_opener") as build_opener:
            opener = Mock()
            opener.open.return_value = io.BytesIO(b"x" * (MAX_MANIFEST_BYTES + 1))
            build_opener.return_value = opener
            client = SupabaseRest(
                f"https://{SUPABASE_HOST}",
                "test-anon-key",
                "worker@example.invalid",
                "synthetic-password",
            )
            client.access_token = "synthetic-access-token"
            with self.assertRaisesRegex(WorkerError, "MANIFEST_TOO_LARGE"):
                client.download(STAGING_BUCKET, manifest_path, max_bytes=MAX_MANIFEST_BYTES)

    def test_request_requires_a_dedicated_worker_access_token(self) -> None:
        client = SupabaseRest(
            f"https://{SUPABASE_HOST}",
            "test-anon-key",
            "worker@example.invalid",
            "synthetic-password",
        )
        with self.assertRaisesRegex(WorkerError, "WORKER_AUTHENTICATION_REQUIRED"):
            client.request("/rest/v1/rpc/claim", method="POST", payload={})

    def test_redirect_handler_refuses_to_follow_external_targets(self) -> None:
        request = urllib.request.Request(f"https://{SUPABASE_HOST}/rest/v1/rpc/claim")
        handler = NoRedirectHandler()
        self.assertIsNone(
            handler.redirect_request(
                request,
                None,
                302,
                "Found",
                {},
                "https://attacker.invalid/collect",
            )
        )

    def test_supabase_rest_requests_use_the_no_redirect_handler(self) -> None:
        with patch("scripts.process_gtfs_staging.urllib.request.build_opener") as build_opener:
            opener = Mock()
            opener.open.return_value = io.BytesIO(b"[]")
            build_opener.return_value = opener

            client = SupabaseRest(f"https://{SUPABASE_HOST}", "test-anon-key", "worker@example.invalid", "synthetic-password")
            client.access_token = "synthetic-access-token"
            client.request("/rest/v1/rpc/claim", method="POST", payload={})

            build_opener.assert_called_once_with(NoRedirectHandler)
            opener.open.assert_called_once()

    def test_storage_download_rejects_noncanonical_path_before_network_access(self) -> None:
        client = SupabaseRest(f"https://{SUPABASE_HOST}", "test-anon-key", "worker@example.invalid", "synthetic-password")
        with self.assertRaisesRegex(WorkerError, "UNSAFE_ARCHIVE_OBJECT_REFERENCE"):
            client.download(STAGING_BUCKET, "../../secrets")

    def test_worker_failure_codes_are_bounded_and_non_sensitive(self) -> None:
        self.assertEqual(worker_error_code(WorkerError("ARCHIVE_DOWNLOAD_FAILED")), "ARCHIVE_DOWNLOAD_FAILED")
        self.assertEqual(worker_error_code(WorkerError("secret\nvalue")), "WORKER_ERROR")
        self.assertEqual(worker_error_code(OSError("synthetic")), "WORKER_IO_ERROR")

    def test_worker_requeues_a_claim_after_download_failure(self) -> None:
        job = valid_job()
        client = Mock()
        client.claim.return_value = job
        client.download.side_effect = WorkerError("MANIFEST_DOWNLOAD_FAILED")

        with self.assertRaisesRegex(WorkerError, "MANIFEST_DOWNLOAD_FAILED"):
            process_one(client)

        client.fail.assert_called_once_with(job, "MANIFEST_DOWNLOAD_FAILED")
        client.complete.assert_not_called()

    def test_failure_rpc_uses_only_the_claimed_dataset_and_lease(self) -> None:
        client = SupabaseRest(f"https://{SUPABASE_HOST}", "test-anon-key", "worker@example.invalid", "synthetic-password")
        job = valid_job()
        with patch.object(client, "request", return_value=True) as request:
            self.assertTrue(client.fail(job, "ARCHIVE_DOWNLOAD_FAILED"))
        request.assert_called_once_with(
            "/rest/v1/rpc/fail_dakar_gtfs_validation",
            method="POST",
            payload={
                "p_dataset_id": job["dataset_id"],
                "p_lease_token": job["lease_token"],
                "p_error_code": "ARCHIVE_DOWNLOAD_FAILED",
            },
        )

    def test_failure_rpc_rejects_unbounded_error_text(self) -> None:
        client = SupabaseRest(f"https://{SUPABASE_HOST}", "test-anon-key", "worker@example.invalid", "synthetic-password")
        with self.assertRaisesRegex(WorkerError, "WORKER_ERROR_CODE_INVALID"):
            client.fail(valid_job(), "secret value")


if __name__ == "__main__":
    unittest.main()
