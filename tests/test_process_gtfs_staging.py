from __future__ import annotations

import hashlib
import unittest

from scripts.process_gtfs_staging import WorkerError, validate_report, verify_archive_bytes


class GTFSWorkerTests(unittest.TestCase):
    def test_archive_hash_and_size_are_verified(self) -> None:
        payload = b"PK\x03\x04synthetic-test"
        verify_archive_bytes(payload, len(payload), hashlib.sha256(payload).hexdigest())

    def test_archive_hash_mismatch_is_rejected(self) -> None:
        payload = b"PK\x03\x04synthetic-test"
        with self.assertRaisesRegex(WorkerError, "ARCHIVE_SHA256_MISMATCH"):
            verify_archive_bytes(payload, len(payload), "0" * 64)

    def test_archive_size_mismatch_is_rejected(self) -> None:
        payload = b"PK\x03\x04synthetic-test"
        with self.assertRaisesRegex(WorkerError, "ARCHIVE_SIZE_MISMATCH"):
            verify_archive_bytes(payload, len(payload) + 1, hashlib.sha256(payload).hexdigest())

    def test_non_zip_payload_is_rejected(self) -> None:
        payload = b"not a zip archive"
        with self.assertRaisesRegex(WorkerError, "ARCHIVE_NOT_ZIP"):
            verify_archive_bytes(payload, len(payload), hashlib.sha256(payload).hexdigest())

    def test_report_must_be_bound_to_the_claimed_archive_hash(self) -> None:
        report = {
            "dataset": {"sha256": "a" * 64},
            "structure_valid": True,
            "counts": {"errors": 0, "warnings": 0},
            "tables": {"stops.txt": 1},
        }
        with self.assertRaisesRegex(WorkerError, "VALIDATOR_REPORT_HASH_MISMATCH"):
            validate_report(report, "b" * 64)

    def test_valid_structural_report_is_never_marked_production_ready(self) -> None:
        report = {
            "dataset": {"sha256": "a" * 64},
            "structure_valid": True,
            "production_ready": False,
            "counts": {"errors": 0, "warnings": 0},
            "tables": {"stops.txt": 1},
        }
        self.assertFalse(validate_report(report, "a" * 64)["production_ready"])


if __name__ == "__main__":
    unittest.main()
