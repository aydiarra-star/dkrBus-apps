#!/usr/bin/env python3
"""Process one private staged GTFS archive using the repository's trusted validator.

Required environment:
  DAKAR_BUS_SUPABASE_URL
  DAKAR_BUS_SUPABASE_SERVICE_ROLE_KEY

The service-role key is read only from the process environment and is never printed.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / "scripts" / "validate_gtfs.py"
MAX_ARCHIVE_BYTES = 100 * 1024 * 1024
LEASE_SECONDS = 900
VALIDATOR_VERSION = "dakar-gtfs-validator-v1"


class WorkerError(RuntimeError):
    pass


def verify_archive_bytes(payload: bytes, expected_bytes: int, expected_sha256: str) -> None:
    if len(payload) != expected_bytes or len(payload) <= 0 or len(payload) > MAX_ARCHIVE_BYTES:
        raise WorkerError("ARCHIVE_SIZE_MISMATCH")
    actual = hashlib.sha256(payload).hexdigest()
    if actual != expected_sha256:
        raise WorkerError("ARCHIVE_SHA256_MISMATCH")
    if not payload.startswith(b"PK"):
        raise WorkerError("ARCHIVE_NOT_ZIP")


def validate_report(report: Any, expected_sha256: str) -> dict[str, Any]:
    if not isinstance(report, dict):
        raise WorkerError("VALIDATOR_REPORT_NOT_OBJECT")
    dataset = report.get("dataset")
    counts = report.get("counts")
    tables = report.get("tables")
    if not isinstance(dataset, dict) or dataset.get("sha256") != expected_sha256:
        raise WorkerError("VALIDATOR_REPORT_HASH_MISMATCH")
    if not isinstance(report.get("structure_valid"), bool):
        raise WorkerError("VALIDATOR_REPORT_STATUS_MISSING")
    if not isinstance(counts, dict) or not isinstance(tables, dict):
        raise WorkerError("VALIDATOR_REPORT_SHAPE_INVALID")
    if not isinstance(counts.get("errors"), int) or not isinstance(counts.get("warnings"), int):
        raise WorkerError("VALIDATOR_REPORT_COUNTS_INVALID")
    return report


class SupabaseRest:
    def __init__(self, base_url: str, service_key: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.service_key = service_key

    def request(self, path: str, method: str = "GET", payload: Any = None) -> Any:
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            self.base_url + path,
            data=data,
            method=method,
            headers={
                "apikey": self.service_key,
                "Authorization": "Bearer " + self.service_key,
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                raw = response.read()
        except (urllib.error.URLError, TimeoutError) as error:
            raise WorkerError("SUPABASE_REQUEST_FAILED") from error
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError as error:
            raise WorkerError("SUPABASE_RESPONSE_INVALID_JSON") from error

    def claim(self) -> dict[str, Any] | None:
        rows = self.request(
            "/rest/v1/rpc/claim_dakar_gtfs_validation",
            method="POST",
            payload={"p_lease_seconds": LEASE_SECONDS},
        )
        if not isinstance(rows, list):
            raise WorkerError("CLAIM_RESPONSE_INVALID")
        if not rows:
            return None
        if len(rows) != 1 or not isinstance(rows[0], dict):
            raise WorkerError("CLAIM_RESPONSE_INVALID")
        return rows[0]

    def download(self, bucket: str, object_path: str) -> bytes:
        encoded_path = urllib.parse.quote(object_path, safe="/")
        request = urllib.request.Request(
            f"{self.base_url}/storage/v1/object/{urllib.parse.quote(bucket, safe='')}/{encoded_path}",
            headers={"apikey": self.service_key, "Authorization": "Bearer " + self.service_key},
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = response.read(MAX_ARCHIVE_BYTES + 1)
        except (urllib.error.URLError, TimeoutError) as error:
            raise WorkerError("ARCHIVE_DOWNLOAD_FAILED") from error
        if len(payload) > MAX_ARCHIVE_BYTES:
            raise WorkerError("ARCHIVE_TOO_LARGE")
        return payload

    def complete(self, job: dict[str, Any], report: dict[str, Any]) -> bool:
        result = self.request(
            "/rest/v1/rpc/complete_dakar_gtfs_validation",
            method="POST",
            payload={
                "p_dataset_id": job["dataset_id"],
                "p_lease_token": job["lease_token"],
                "p_archive_sha256": job["archive_sha256"],
                "p_report": report,
                "p_validator_version": VALIDATOR_VERSION,
            },
        )
        return result is True


def process_one(client: SupabaseRest) -> str:
    job = client.claim()
    if job is None:
        return "QUEUE_EMPTY"
    required = ("dataset_id", "archive_bucket", "archive_object_path", "archive_sha256", "archive_bytes", "lease_token")
    if any(not job.get(key) for key in required):
        raise WorkerError("CLAIM_METADATA_INCOMPLETE")

    payload = client.download(str(job["archive_bucket"]), str(job["archive_object_path"]))
    verify_archive_bytes(payload, int(job["archive_bytes"]), str(job["archive_sha256"]))

    with tempfile.TemporaryDirectory(prefix="dakar-gtfs-worker-") as directory:
        archive = Path(directory) / "feed.zip"
        archive.write_bytes(payload)
        completed = subprocess.run(
            [sys.executable, str(VALIDATOR), str(archive)],
            capture_output=True,
            text=True,
            timeout=600,
            check=False,
            # Do not pass the Supabase service-role key to the validator subprocess.
            env={"PATH": os.environ.get("PATH", ""), "PYTHONIOENCODING": "utf-8"},
        )
        if completed.returncode not in (0, 1):
            raise WorkerError("VALIDATOR_EXECUTION_FAILED")
        try:
            report = validate_report(json.loads(completed.stdout), str(job["archive_sha256"]))
        except json.JSONDecodeError as error:
            raise WorkerError("VALIDATOR_OUTPUT_INVALID_JSON") from error

    if not client.complete(job, report):
        raise WorkerError("VALIDATION_LEASE_EXPIRED_OR_HASH_MISMATCH")
    return "VALID" if report["structure_valid"] else "INVALID"


def main() -> int:
    base_url = os.environ.get("DAKAR_BUS_SUPABASE_URL", "").strip()
    service_key = os.environ.get("DAKAR_BUS_SUPABASE_SERVICE_ROLE_KEY", "")
    if not base_url or not service_key:
        print("Worker non lancé : les identifiants sécurisés ne sont pas configurés.", file=sys.stderr)
        return 2
    if not base_url.startswith("https://"):
        print("Configuration refusée : l’URL Supabase doit utiliser HTTPS.", file=sys.stderr)
        return 2
    try:
        outcome = process_one(SupabaseRest(base_url, service_key))
    except (WorkerError, subprocess.TimeoutExpired, OSError) as error:
        print(f"Échec du traitement GTFS : {error}", file=sys.stderr)
        return 1
    print(f"Traitement GTFS terminé : {outcome}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
