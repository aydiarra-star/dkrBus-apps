"""Shared reports use test authors; no fixture is served by the application."""
from __future__ import annotations

import json
import sqlite3
import tempfile
import threading
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from scripts.community_reports import COMMUNITY_HEADER, COMMUNITY_ROUTE, REPORT_KEY_HEADER, CommunityError, CommunityReportStore, validate_draft
from scripts.serve_admin_api import create_server

NOW = datetime(2026, 10, 11, 12, tzinfo=timezone.utc)
DRAFT = {"kind": "CONGESTION", "place": "Portion de route de test", "comment": "Observation de test", "networkId": "ddd", "lat": 14.7051, "lng": -17.4602}


class CommunityStoreTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.store = CommunityReportStore(Path(self.directory.name) / "traffic")

    def test_shared_read_contains_no_delete_capability_and_never_claims_fact_verification(self):
        result = self.store.publish(DRAFT, client="test-author", now=NOW)
        public = self.store.snapshot(now=NOW)
        self.assertEqual(public["reports"][0], result["report"])
        self.assertEqual(public["verification"], "SELF_REPORTED_NOT_OFFICIAL")
        self.assertFalse(result["report"]["assistant"]["factsVerified"])
        self.assertEqual(result["report"]["assistant"]["validation"], "FORM_CHECKED")
        self.assertNotIn(result["deleteKey"], json.dumps(public))
        self.assertEqual(result["report"]["expiresAt"], "2026-10-11T13:00:00.000Z")
        with sqlite3.connect(self.store.path) as db:
            raw = json.dumps(db.execute("SELECT * FROM reports").fetchall())
            self.assertNotIn(result["deleteKey"], raw)
            self.assertNotIn("test-author", raw)

    def test_exact_hour_purges_on_disk_and_subsequent_reads_never_retimestamp(self):
        original = self.store.publish(DRAFT, client="author", now=NOW)
        result = self.store.snapshot(now=NOW + timedelta(minutes=59))
        self.assertEqual(result["reports"][0]["createdAt"], original["report"]["createdAt"])
        self.assertEqual(len(self.store.snapshot(now=NOW + timedelta(hours=1) - timedelta(milliseconds=1))["reports"]), 1)
        self.assertEqual(self.store.snapshot(now=NOW + timedelta(hours=1))["reports"], [])
        with sqlite3.connect(self.store.path) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM reports").fetchone()[0], 0)

    def test_only_owner_can_remove_and_removal_is_immediate_idempotent(self):
        result = self.store.publish(DRAFT, client="author", now=NOW)
        id = result["report"]["id"]
        with self.assertRaises(CommunityError) as error:
            self.store.remove(id, "0" * 64, now=NOW)
        self.assertEqual(error.exception.status, 403)
        self.assertEqual(len(self.store.snapshot(now=NOW)["reports"]), 1)
        self.store.remove(id, result["deleteKey"], now=NOW)
        self.assertEqual(self.store.snapshot(now=NOW)["reports"], [])
        self.store.remove(id, result["deleteKey"], now=NOW)

    def test_bad_coordinates_markup_network_kind_and_client_dates_are_rejected(self):
        for bad in ({**DRAFT, "lat": 91}, {**DRAFT, "lat": True}, {**DRAFT, "lng": None}, {**DRAFT, "lat": 48.89, "lng": 2.24},
                    {**DRAFT, "place": "  "}, {**DRAFT, "place": "<script>x</script>"}, {**DRAFT, "networkId": "unknown"},
                    {**DRAFT, "kind": "UNKNOWN"}, {**DRAFT, "createdAt": "yesterday"}, {**DRAFT, "source": "OFFICIAL"},
                    {**DRAFT, "comment": "x" * 141}, {**DRAFT, "comment": "x\x00y"}):
            with self.subTest(bad=bad), self.assertRaises(CommunityError):
                validate_draft(bad)

    def test_no_position_is_invented_if_user_did_not_attach_it(self):
        value = self.store.publish({"kind": "OTHER", "place": "Hann", "comment": None}, client="author", now=NOW)
        self.assertIsNone(value["report"]["lat"])
        self.assertIsNone(value["report"]["lng"])
        self.assertIsNone(value["report"]["networkId"])

    def test_rate_limit_is_bounded_temporary_and_does_not_leak_raw_client_identity(self):
        for index in range(5):
            self.store.publish({**DRAFT, "place": f"Test {index}"}, client="private-client", now=NOW)
        with self.assertRaises(CommunityError) as error:
            self.store.publish(DRAFT, client="private-client", now=NOW)
        self.assertEqual(error.exception.status, 429)
        self.assertNotIn("private-client", repr(self.store._rates))
        self.store.publish(DRAFT, client="private-client", now=NOW + timedelta(minutes=1))

    def test_restart_preserves_active_reports_not_author_secrets_or_expired_history(self):
        self.store.publish(DRAFT, client="author", now=NOW)
        restarted = CommunityReportStore(self.store.path.parent)
        self.assertEqual(len(restarted.snapshot(now=NOW + timedelta(minutes=1))["reports"]), 1)
        self.assertEqual(restarted.snapshot(now=NOW + timedelta(days=1))["reports"], [])

    def test_concurrent_authors_do_not_overwrite_one_another(self):
        failures = []
        def submit(index):
            try:
                self.store.publish({**DRAFT, "place": f"Test {index}"}, client=str(index), now=NOW)
            except Exception as error:
                failures.append(error)
        threads = [threading.Thread(target=submit, args=(index,)) for index in range(12)]
        for thread in threads: thread.start()
        for thread in threads: thread.join(timeout=3)
        self.assertEqual(failures, [])
        self.assertEqual(len(self.store.snapshot(now=NOW)["reports"]), 12)


class CommunityHttpTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.server = create_server(Path(self.directory.name) / "staging", "127.0.0.1", 0, quiet=True,
                                    community_reports_root=Path(self.directory.name) / "traffic")
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.close)
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def close(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join(timeout=2)

    def call(self, method="GET", path=COMMUNITY_ROUTE, body=None, headers=None):
        req = Request(self.base + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                      headers={"Content-Type": "application/json", **(headers or {})})
        try:
            res = urlopen(req, timeout=3)
        except HTTPError as error:
            res = error
        with res:
            return res.status, json.loads(res.read()), res.headers

    def test_real_http_publication_and_another_read_share_data_with_no_store(self):
        status, created, headers = self.call("POST", body=DRAFT, headers={COMMUNITY_HEADER: "1"})
        self.assertEqual(status, 201)
        status, public, headers = self.call()
        self.assertEqual(status, 200)
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertEqual(public["reports"][0]["id"], created["report"]["id"])
        self.assertNotIn("deleteKey", json.dumps(public))
        status, _, _ = self.call("DELETE", COMMUNITY_ROUTE + "/" + created["report"]["id"], headers={COMMUNITY_HEADER: "1", REPORT_KEY_HEADER: created["deleteKey"]})
        self.assertEqual(status, 200)
        self.assertEqual(self.call()[1]["reports"], [])

    def test_json_custom_header_same_origin_ownership_and_size_are_enforced(self):
        self.assertEqual(self.call("POST", body=DRAFT)[0], 403)
        self.assertEqual(self.call("POST", body=DRAFT, headers={COMMUNITY_HEADER: "1", "Origin": "https://foreign.invalid"})[0], 403)
        self.assertEqual(self.call("POST", body={**DRAFT, "comment": "x" * 5000}, headers={COMMUNITY_HEADER: "1"})[0], 413)
        self.assertEqual(self.call("POST", body={**DRAFT, "createdAt": "yesterday"}, headers={COMMUNITY_HEADER: "1"})[0], 422)
        self.assertEqual(self.call(path=COMMUNITY_ROUTE + "?url=https://foreign.invalid")[0], 400)

    def test_disabled_service_is_explicit_and_never_fake_shared_data(self):
        store = self.server.RequestHandlerClass.community_store
        self.server.RequestHandlerClass.community_store = None
        try:
            status, payload, _ = self.call()
            self.assertEqual(status, 503)
            self.assertEqual(payload["error"], "COMMUNITY_NOT_CONFIGURED")
        finally:
            self.server.RequestHandlerClass.community_store = store
