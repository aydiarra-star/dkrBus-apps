#!/usr/bin/env python3
"""Process one private staged GTFS archive using the repository's trusted validator.

Required environment:
  DAKAR_BUS_SUPABASE_URL
  DAKAR_BUS_SUPABASE_ANON_KEY
  DAKAR_BUS_GTFS_WORKER_EMAIL
  DAKAR_BUS_GTFS_WORKER_PASSWORD

The worker signs in as a dedicated Auth user whose server-managed app_metadata
contains dakar_gtfs_worker=true. It never receives the service_role key.
The URL is pinned to the dedicated Dakar Bus project.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
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
MAX_MANIFEST_BYTES = 1 * 1024 * 1024
MAX_JSON_RESPONSE_BYTES = 1 * 1024 * 1024
MAX_VALIDATION_REPORT_BYTES = 1 * 1024 * 1024
LEASE_SECONDS = 900
VALIDATOR_VERSION = "dakar-gtfs-validator-v6"
SUPABASE_PROJECT_REF = "mdmuxzaewqzqutkqdylo"
SUPABASE_HOST = f"{SUPABASE_PROJECT_REF}.supabase.co"
STAGING_BUCKET = "dakar-gtfs-staging"
DATASET_ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,119}$")
SHA256_RE = re.compile(r"^[a-f0-9]{64}$")
LEASE_TOKEN_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", re.I)
ARCHIVE_PATH_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,119}/[a-f0-9]{64}/feed\.zip$")
MANIFEST_PATH_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,119}/[a-f0-9]{64}/manifest\.json$")

EXPECTED_VALIDATOR_LIMITS = {
    "max_archive_bytes": 100 * 1024 * 1024,
    "max_entries": 1_000,
    "max_member_bytes": 200 * 1024 * 1024,
    "max_total_uncompressed_bytes": 500 * 1024 * 1024,
    "max_rows_per_table": 2_000_000,
    "max_issue_details": 200,
}


class WorkerError(RuntimeError):
    pass


def worker_error_code(error: Exception) -> str:
    """Return a bounded, non-sensitive code suitable for the staging audit log."""
    if isinstance(error, WorkerError):
        candidate = str(error)
        return candidate if re.fullmatch(r"[A-Z0-9_]{1,80}", candidate) else "WORKER_ERROR"
    if isinstance(error, subprocess.TimeoutExpired):
        return "VALIDATOR_TIMEOUT"
    if isinstance(error, OSError):
        return "WORKER_IO_ERROR"
    return "WORKER_UNEXPECTED_ERROR"


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Never forward the service-role credential through an HTTP redirect."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Returning None makes urllib raise HTTPError instead of following the target.
        return None


def open_without_redirect(request: urllib.request.Request, timeout: int):
    opener = urllib.request.build_opener(NoRedirectHandler)
    return opener.open(request, timeout=timeout)


def validate_supabase_url(base_url: str) -> str:
    try:
        if not isinstance(base_url, str) or base_url != base_url.strip():
            raise WorkerError("SUPABASE_PROJECT_URL_INVALID")
        parsed = urllib.parse.urlsplit(base_url)
        port = parsed.port
    except ValueError as error:
        raise WorkerError("SUPABASE_PROJECT_URL_INVALID") from error
    if (
        parsed.scheme != "https"
        or parsed.hostname != SUPABASE_HOST
        or parsed.username is not None
        or parsed.password is not None
        or port not in (None, 443)
        or parsed.path not in ("", "/")
        or parsed.query
        or parsed.fragment
    ):
        raise WorkerError("SUPABASE_PROJECT_URL_MISMATCH")
    return f"https://{SUPABASE_HOST}"


def verify_archive_bytes(payload: bytes, expected_bytes: int, expected_sha256: str) -> None:
    if (
        not isinstance(expected_bytes, int)
        or isinstance(expected_bytes, bool)
        or expected_bytes <= 0
        or expected_bytes > MAX_ARCHIVE_BYTES
        or len(payload) != expected_bytes
    ):
        raise WorkerError("ARCHIVE_SIZE_MISMATCH")
    if not isinstance(expected_sha256, str) or not SHA256_RE.fullmatch(expected_sha256):
        raise WorkerError("ARCHIVE_SHA256_INVALID")
    actual = hashlib.sha256(payload).hexdigest()
    if actual != expected_sha256:
        raise WorkerError("ARCHIVE_SHA256_MISMATCH")
    if not payload.startswith(b"PK"):
        raise WorkerError("ARCHIVE_NOT_ZIP")


def verify_manifest_bytes(
    payload: bytes,
    expected_sha256: str,
    expected_dataset_id: str,
    expected_archive_sha256: str,
    expected_archive_bytes: int,
) -> None:
    if not isinstance(payload, bytes) or not payload or len(payload) > MAX_MANIFEST_BYTES:
        raise WorkerError("MANIFEST_SIZE_INVALID")
    if not isinstance(expected_sha256, str) or not SHA256_RE.fullmatch(expected_sha256):
        raise WorkerError("MANIFEST_SHA256_INVALID")
    if hashlib.sha256(payload).hexdigest() != expected_sha256:
        raise WorkerError("MANIFEST_SHA256_MISMATCH")
    try:
        manifest = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise WorkerError("MANIFEST_CONTENT_INVALID") from error
    if not isinstance(manifest, dict) or manifest.get("schema_version") != "1.0":
        raise WorkerError("MANIFEST_SCHEMA_INVALID")
    if manifest.get("dataset_id") != expected_dataset_id:
        raise WorkerError("MANIFEST_DATASET_MISMATCH")
    if (
        manifest.get("review_status") != "PENDING_REVIEW"
        or manifest.get("publication_status") != "NOT_PUBLISHED"
        or manifest.get("publication_ready") is not False
    ):
        raise WorkerError("MANIFEST_GOVERNANCE_STATE_INVALID")
    archive = manifest.get("archive")
    if not isinstance(archive, dict) or archive.get("stored_as") != "feed.zip":
        raise WorkerError("MANIFEST_ARCHIVE_METADATA_INVALID")
    manifest_bytes = archive.get("bytes")
    if (
        not isinstance(manifest_bytes, int)
        or isinstance(manifest_bytes, bool)
        or manifest_bytes != expected_archive_bytes
        or archive.get("sha256") != expected_archive_sha256
    ):
        raise WorkerError("MANIFEST_ARCHIVE_MISMATCH")


def validate_claimed_job(job: Any) -> int:
    if not isinstance(job, dict):
        raise WorkerError("CLAIM_METADATA_INCOMPLETE")
    dataset_id = job.get("dataset_id")
    bucket = job.get("archive_bucket")
    object_path = job.get("archive_object_path")
    archive_sha256 = job.get("archive_sha256")
    manifest_object_path = job.get("manifest_object_path")
    manifest_sha256 = job.get("manifest_sha256")
    lease_token = job.get("lease_token")
    raw_bytes = job.get("archive_bytes")

    if not isinstance(dataset_id, str) or not DATASET_ID_RE.fullmatch(dataset_id):
        raise WorkerError("CLAIM_DATASET_ID_INVALID")
    if bucket != STAGING_BUCKET:
        raise WorkerError("CLAIM_BUCKET_INVALID")
    if not isinstance(archive_sha256, str) or not SHA256_RE.fullmatch(archive_sha256):
        raise WorkerError("CLAIM_SHA256_INVALID")
    expected_path = f"{dataset_id}/{archive_sha256}/feed.zip"
    if object_path != expected_path or not isinstance(object_path, str) or not ARCHIVE_PATH_RE.fullmatch(object_path):
        raise WorkerError("CLAIM_OBJECT_PATH_INVALID")
    expected_manifest_path = f"{dataset_id}/{archive_sha256}/manifest.json"
    if (
        manifest_object_path != expected_manifest_path
        or not isinstance(manifest_object_path, str)
        or not MANIFEST_PATH_RE.fullmatch(manifest_object_path)
    ):
        raise WorkerError("CLAIM_MANIFEST_PATH_INVALID")
    if not isinstance(manifest_sha256, str) or not SHA256_RE.fullmatch(manifest_sha256):
        raise WorkerError("CLAIM_MANIFEST_SHA256_INVALID")
    if not isinstance(lease_token, str) or not LEASE_TOKEN_RE.fullmatch(lease_token):
        raise WorkerError("CLAIM_LEASE_TOKEN_INVALID")

    if isinstance(raw_bytes, bool):
        raise WorkerError("CLAIM_ARCHIVE_SIZE_INVALID")
    if isinstance(raw_bytes, int):
        archive_bytes = raw_bytes
    elif isinstance(raw_bytes, str) and raw_bytes.isascii() and raw_bytes.isdecimal():
        archive_bytes = int(raw_bytes)
    else:
        raise WorkerError("CLAIM_ARCHIVE_SIZE_INVALID")
    if archive_bytes <= 0 or archive_bytes > MAX_ARCHIVE_BYTES:
        raise WorkerError("CLAIM_ARCHIVE_SIZE_INVALID")
    return archive_bytes


def validate_report(report: Any, expected_sha256: str, expected_bytes: int) -> dict[str, Any]:
    if not isinstance(report, dict):
        raise WorkerError("VALIDATOR_REPORT_NOT_OBJECT")
    try:
        serialized_bytes = len(json.dumps(report, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
    except (TypeError, ValueError, UnicodeEncodeError) as error:
        raise WorkerError("VALIDATOR_REPORT_SERIALIZATION_INVALID") from error
    if serialized_bytes > MAX_VALIDATION_REPORT_BYTES:
        raise WorkerError("VALIDATOR_REPORT_TOO_LARGE")
    if report.get("schema_version") != "1.0":
        raise WorkerError("VALIDATOR_REPORT_SCHEMA_UNSUPPORTED")

    dataset = report.get("dataset")
    if not isinstance(dataset, dict):
        raise WorkerError("VALIDATOR_REPORT_DATASET_INVALID")
    if dataset.get("filename") != "feed.zip":
        raise WorkerError("VALIDATOR_REPORT_FILENAME_MISMATCH")
    if dataset.get("sha256") != expected_sha256:
        raise WorkerError("VALIDATOR_REPORT_HASH_MISMATCH")
    reported_bytes = dataset.get("archive_bytes")
    if not isinstance(reported_bytes, int) or isinstance(reported_bytes, bool) or reported_bytes != expected_bytes:
        raise WorkerError("VALIDATOR_REPORT_SIZE_MISMATCH")

    if not isinstance(report.get("validated_at"), str) or not report["validated_at"].strip():
        raise WorkerError("VALIDATOR_REPORT_TIMESTAMP_MISSING")
    if not isinstance(report.get("scope"), str) or not report["scope"].strip():
        raise WorkerError("VALIDATOR_REPORT_SCOPE_MISSING")
    if report.get("production_ready") is not False:
        raise WorkerError("VALIDATOR_REPORT_PRODUCTION_READY_FORBIDDEN")

    structure_valid = report.get("structure_valid")
    if not isinstance(structure_valid, bool):
        raise WorkerError("VALIDATOR_REPORT_STATUS_MISSING")

    counts = report.get("counts")
    if not isinstance(counts, dict):
        raise WorkerError("VALIDATOR_REPORT_COUNTS_INVALID")
    errors = counts.get("errors")
    warnings = counts.get("warnings")
    if (
        not isinstance(errors, int) or isinstance(errors, bool) or errors < 0
        or not isinstance(warnings, int) or isinstance(warnings, bool) or warnings < 0
    ):
        raise WorkerError("VALIDATOR_REPORT_COUNTS_INVALID")
    if structure_valid != (errors == 0):
        raise WorkerError("VALIDATOR_REPORT_STATUS_COUNT_MISMATCH")

    tables = report.get("tables")
    if not isinstance(tables, dict):
        raise WorkerError("VALIDATOR_REPORT_TABLES_INVALID")
    for name, count in tables.items():
        if not isinstance(name, str) or not name or not isinstance(count, int) or isinstance(count, bool) or count < 0:
            raise WorkerError("VALIDATOR_REPORT_TABLE_COUNT_INVALID")

    issues = report.get("issues")
    if not isinstance(issues, list) or len(issues) > EXPECTED_VALIDATOR_LIMITS["max_issue_details"]:
        raise WorkerError("VALIDATOR_REPORT_ISSUES_INVALID")
    issue_errors = 0
    issue_warnings = 0
    for issue in issues:
        if not isinstance(issue, dict):
            raise WorkerError("VALIDATOR_REPORT_ISSUE_INVALID")
        severity = issue.get("severity")
        if not isinstance(severity, str) or severity not in {"ERROR", "WARNING"}:
            raise WorkerError("VALIDATOR_REPORT_ISSUE_INVALID")
        if not isinstance(issue.get("code"), str) or not issue["code"].strip():
            raise WorkerError("VALIDATOR_REPORT_ISSUE_INVALID")
        if not isinstance(issue.get("message"), str) or not issue["message"].strip():
            raise WorkerError("VALIDATOR_REPORT_ISSUE_INVALID")
        if "table" in issue and not isinstance(issue["table"], str):
            raise WorkerError("VALIDATOR_REPORT_ISSUE_INVALID")
        if "row" in issue and (
            not isinstance(issue["row"], int) or isinstance(issue["row"], bool) or issue["row"] <= 0
        ):
            raise WorkerError("VALIDATOR_REPORT_ISSUE_INVALID")
        if severity == "ERROR":
            issue_errors += 1
        else:
            issue_warnings += 1
    if errors < issue_errors or warnings < issue_warnings:
        raise WorkerError("VALIDATOR_REPORT_ISSUE_COUNTS_MISMATCH")

    limits = report.get("limits")
    if not isinstance(limits, dict) or limits != EXPECTED_VALIDATOR_LIMITS:
        raise WorkerError("VALIDATOR_REPORT_LIMITS_MISMATCH")
    return report


class SupabaseRest:
    def __init__(self, base_url: str, anon_key: str, worker_email: str, worker_password: str) -> None:
        self.base_url = validate_supabase_url(base_url)
        self.anon_key = anon_key
        self.worker_email = worker_email
        self.worker_password = worker_password
        self.access_token: str | None = None
        if (
            not self.anon_key
            or self.anon_key != self.anon_key.strip()
            or not self.worker_email
            or self.worker_email != self.worker_email.strip()
            or not self.worker_password
        ):
            raise WorkerError("WORKER_CREDENTIALS_MISSING")

    def authenticate(self) -> None:
        """Obtain a short-lived JWT for the dedicated, server-provisioned worker user."""
        payload = json.dumps({
            "email": self.worker_email,
            "password": self.worker_password,
        }).encode("utf-8")
        request = urllib.request.Request(
            self.base_url + "/auth/v1/token?grant_type=password",
            data=payload,
            method="POST",
            headers={
                "apikey": self.anon_key,
                "Content-Type": "application/json",
            },
        )
        try:
            with open_without_redirect(request, timeout=30) as response:
                raw = response.read(65537)
        except (urllib.error.URLError, TimeoutError) as error:
            # Never print the Auth response or credential-bearing request.
            raise WorkerError("WORKER_AUTHENTICATION_FAILED") from error
        if len(raw) > 65536:
            raise WorkerError("WORKER_AUTH_RESPONSE_TOO_LARGE")
        try:
            result = json.loads(raw)
        except json.JSONDecodeError as error:
            raise WorkerError("WORKER_AUTH_RESPONSE_INVALID") from error
        if not isinstance(result, dict):
            raise WorkerError("WORKER_AUTHENTICATION_FAILED")
        user = result.get("user")
        if not isinstance(user, dict):
            raise WorkerError("WORKER_AUTHENTICATION_FAILED")
        confirmed_email = user.get("email")
        if (
            not isinstance(confirmed_email, str)
            or confirmed_email.casefold() != self.worker_email.casefold()
        ):
            raise WorkerError("WORKER_ACCOUNT_MISMATCH")
        if not user.get("email_confirmed_at"):
            raise WorkerError("WORKER_ACCOUNT_NOT_CONFIRMED")
        app_metadata = user.get("app_metadata")
        if not isinstance(app_metadata, dict) or app_metadata.get("dakar_gtfs_worker") is not True:
            raise WorkerError("WORKER_IDENTITY_CLAIM_MISSING")
        token = result.get("access_token")
        if not isinstance(token, str) or not token:
            raise WorkerError("WORKER_AUTHENTICATION_FAILED")
        self.access_token = token

    def request(self, path: str, method: str = "GET", payload: Any = None) -> Any:
        if not self.access_token:
            raise WorkerError("WORKER_AUTHENTICATION_REQUIRED")
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            self.base_url + path,
            data=data,
            method=method,
            headers={
                "apikey": self.anon_key,
                "Authorization": "Bearer " + self.access_token,
                "Content-Type": "application/json",
            },
        )
        try:
            with open_without_redirect(request, timeout=90) as response:
                raw = response.read(MAX_JSON_RESPONSE_BYTES + 1)
        except (urllib.error.URLError, TimeoutError) as error:
            raise WorkerError("SUPABASE_REQUEST_FAILED") from error
        if len(raw) > MAX_JSON_RESPONSE_BYTES:
            raise WorkerError("SUPABASE_RESPONSE_TOO_LARGE")
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

    def download(self, bucket: str, object_path: str, max_bytes: int = MAX_ARCHIVE_BYTES) -> bytes:
        allowed_paths = (
            (MAX_ARCHIVE_BYTES, ARCHIVE_PATH_RE),
            (MAX_MANIFEST_BYTES, MANIFEST_PATH_RE),
        )
        if (
            bucket != STAGING_BUCKET
            or not isinstance(object_path, str)
            or not any(limit == max_bytes and pattern.fullmatch(object_path) for limit, pattern in allowed_paths)
        ):
            raise WorkerError("UNSAFE_ARCHIVE_OBJECT_REFERENCE")
        encoded_path = urllib.parse.quote(object_path, safe="/")
        if not self.access_token:
            raise WorkerError("WORKER_AUTHENTICATION_REQUIRED")
        request = urllib.request.Request(
            f"{self.base_url}/storage/v1/object/{urllib.parse.quote(bucket, safe='')}/{encoded_path}",
            headers={"apikey": self.anon_key, "Authorization": "Bearer " + self.access_token},
        )
        try:
            with open_without_redirect(request, timeout=120) as response:
                payload = response.read(max_bytes + 1)
        except (urllib.error.URLError, TimeoutError) as error:
            code = "MANIFEST_DOWNLOAD_FAILED" if max_bytes == MAX_MANIFEST_BYTES else "ARCHIVE_DOWNLOAD_FAILED"
            raise WorkerError(code) from error
        if len(payload) > max_bytes:
            raise WorkerError("MANIFEST_TOO_LARGE" if max_bytes == MAX_MANIFEST_BYTES else "ARCHIVE_TOO_LARGE")
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

    def fail(self, job: dict[str, Any], error_code: str) -> bool:
        if not isinstance(error_code, str) or not re.fullmatch(r"[A-Z0-9_]{1,80}", error_code):
            raise WorkerError("WORKER_ERROR_CODE_INVALID")
        result = self.request(
            "/rest/v1/rpc/fail_dakar_gtfs_validation",
            method="POST",
            payload={
                "p_dataset_id": job["dataset_id"],
                "p_lease_token": job["lease_token"],
                "p_error_code": error_code,
            },
        )
        return result is True


def process_one(client: SupabaseRest) -> str:
    job = client.claim()
    if job is None:
        return "QUEUE_EMPTY"
    try:
        archive_bytes = validate_claimed_job(job)
        manifest_payload = client.download(
            str(job["archive_bucket"]),
            str(job["manifest_object_path"]),
            max_bytes=MAX_MANIFEST_BYTES,
        )
        verify_manifest_bytes(
            manifest_payload,
            str(job["manifest_sha256"]),
            str(job["dataset_id"]),
            str(job["archive_sha256"]),
            archive_bytes,
        )
        payload = client.download(str(job["archive_bucket"]), str(job["archive_object_path"]))
        verify_archive_bytes(payload, archive_bytes, str(job["archive_sha256"]))

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
                report = validate_report(
                    json.loads(completed.stdout),
                    str(job["archive_sha256"]),
                    archive_bytes,
                )
            except json.JSONDecodeError as error:
                raise WorkerError("VALIDATOR_OUTPUT_INVALID_JSON") from error

        if not client.complete(job, report):
            raise WorkerError("VALIDATION_LEASE_EXPIRED_OR_HASH_MISMATCH")
        return "VALID" if report["structure_valid"] else "INVALID"
    except Exception as error:
        # Transient worker failures release the lease and return the dataset to
        # quarantine immediately. If the lease expired or the RPC is unavailable,
        # the SQL lease-expiry recovery remains the fallback.
        if (
            isinstance(job, dict)
            and isinstance(job.get("dataset_id"), str)
            and DATASET_ID_RE.fullmatch(job["dataset_id"])
            and isinstance(job.get("lease_token"), str)
            and LEASE_TOKEN_RE.fullmatch(job["lease_token"])
        ):
            try:
                client.fail(job, worker_error_code(error))
            except Exception:
                # Preserve the original failure; the lease can still expire safely.
                pass
        raise


def main() -> int:
    base_url = os.environ.get("DAKAR_BUS_SUPABASE_URL", "")
    anon_key = os.environ.get("DAKAR_BUS_SUPABASE_ANON_KEY", "")
    worker_email = os.environ.get("DAKAR_BUS_GTFS_WORKER_EMAIL", "")
    worker_password = os.environ.get("DAKAR_BUS_GTFS_WORKER_PASSWORD", "")
    if not base_url or not anon_key or not worker_email or not worker_password:
        print("Worker non lancé : les identifiants dédiés ne sont pas configurés.", file=sys.stderr)
        return 2
    try:
        client = SupabaseRest(base_url, anon_key, worker_email, worker_password)
        client.authenticate()
        outcome = process_one(client)
    except Exception as error:
        print(f"Échec du traitement GTFS : {worker_error_code(error)}", file=sys.stderr)
        return 1
    print(f"Traitement GTFS terminé : {outcome}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
