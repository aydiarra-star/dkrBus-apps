"""Access research must not turn public pages/stale payloads into live alerts."""
from __future__ import annotations

import json
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from scripts.probe_traffic_access import CANDIDATES, SECAA_TIMEZONE_URL, Response, audit, inspect_response, probe, read_public_url

NOW = datetime(2026, 10, 11, 12, tzinfo=timezone.utc)
ZONE = {"timezone_string": "Africa/Dakar", "gmt_offset": 0}


def json_response(value, status=200):
    return Response(status, "application/json", json.dumps(value))


def secaa(at="2026-10-09 13:22:26"):
    # Minimal shape of the real response obtained during research, not an
    # active incident fixture, and never imported by the product.
    return {"success": True, "state": {"code": "ralenti"}, "updated_at": at,
            "count": 1, "incidents": [{"location": "Sebi Ponty", "pk": "PK 34.7 → 35.3"}]}


class TrafficAccessAuditTests(unittest.TestCase):
    def test_real_editorial_api_is_not_an_incident_feed_even_for_a_fresh_article(self):
        result = inspect_response(CANDIDATES["cetud"], json_response([{"date_gmt": "2026-10-11T11:59:00"}]), NOW)
        self.assertTrue(result["readAccess"])
        self.assertEqual(result["classification"], "PUBLIC_EDITORIAL_API")
        self.assertFalse(result["eligibleForLiveTraffic"])
        self.assertFalse(result["trafficSnapshotComplete"])

    def test_provider_rest_denial_is_not_an_empty_or_normal_network(self):
        for status in (401, 403, 200):
            with self.subTest(status=status):
                result = inspect_response(CANDIDATES["ddd"], json_response({"code": "rest_login_required", "data": {"status": 401}}, status), NOW)
                self.assertFalse(result["readAccess"])
                self.assertEqual(result["classification"], "AUTHENTICATION_OR_PERMISSION_REQUIRED")
                self.assertFalse(result["eligibleForLiveTraffic"])

    def test_maintenance_and_undated_traffic_html_are_not_live(self):
        for status in (200, 503):
            with self.subTest(status=status):
                result = inspect_response(CANDIDATES["sunubrt"], Response(status, "text/html", "<h1>Notre site est actuellement en <em>maintenance</em></h1>"), NOW)
                self.assertEqual(result["classification"], "MAINTENANCE")
                self.assertFalse(result["eligibleForLiveTraffic"])
        result = inspect_response(CANDIDATES["ter"], Response(200, "text/html", "Trafic normal sur le réseau"), NOW)
        self.assertEqual(result["classification"], "PUBLIC_HTML_NOT_A_VERIFIED_FEED")
        self.assertFalse(result["eligibleForLiveTraffic"])

    def test_real_road_api_timestamp_is_preserved_and_the_october_9_payload_is_stale(self):
        result = inspect_response(CANDIDATES["road"], json_response(secaa()), NOW, source_timezone=ZONE)
        self.assertTrue(result["readAccess"])
        self.assertEqual(result["classification"], "PUBLIC_ROAD_STATE_API")
        self.assertEqual(result["lastOperatorUpdateRaw"], "2026-10-09 13:22:26")
        self.assertEqual(result["lastOperatorUpdateUtc"], "2026-10-09T13:22:26.000Z")
        self.assertEqual(result["freshness"], "STALE")
        self.assertFalse(result["incidentGpsVerified"])
        self.assertFalse(result["eligibleForLiveTraffic"])

    def test_fresh_road_state_still_does_not_prove_whole_dakar_or_incident_coordinates(self):
        result = inspect_response(CANDIDATES["road"], json_response(secaa("2026-10-11 11:59:00")), NOW, source_timezone=ZONE)
        self.assertEqual(result["freshness"], "RECENT_PARTIAL")
        self.assertEqual(result["coverage"], "AUTOROUTE_ONLY")
        self.assertFalse(result["trafficSnapshotComplete"])
        self.assertFalse(result["incidentGpsVerified"])
        self.assertFalse(result["reuseRightsVerified"])
        self.assertFalse(result["eligibleForLiveTraffic"])

    def test_exact_hour_future_and_invalid_calendar_are_not_recent(self):
        for at, expected in [("2026-10-11 11:00:00", "STALE"), ("2026-10-11 12:00:01", "FUTURE"), ("2026-02-30 11:59:00", "TIMESTAMP_OR_TIMEZONE_UNVERIFIED")]:
            with self.subTest(at=at):
                result = inspect_response(CANDIDATES["road"], json_response(secaa(at)), NOW, source_timezone=ZONE)
                self.assertEqual(result["freshness"], expected)
                self.assertFalse(result["eligibleForLiveTraffic"])

    def test_naive_source_date_without_verified_timezone_is_not_restamped(self):
        result = inspect_response(CANDIDATES["road"], json_response(secaa()), NOW)
        self.assertEqual(result["freshness"], "TIMESTAMP_OR_TIMEZONE_UNVERIFIED")
        self.assertNotIn("lastOperatorUpdateUtc", result)
        for zone in ({"timezone_string": "Africa/Dakar", "gmt_offset": False},
                     {"timezone_string": "Europe/Paris", "gmt_offset": 0},
                     {"timezone_string": "Africa/Dakar", "gmt_offset": "0"}):
            with self.subTest(zone=zone):
                result = inspect_response(CANDIDATES["road"], json_response(secaa()), NOW, source_timezone=zone)
                self.assertEqual(result["freshness"], "TIMESTAMP_OR_TIMEZONE_UNVERIFIED")
                self.assertNotIn("lastOperatorUpdateUtc", result)
        reader = lambda url: json_response(secaa()) if url == CANDIDATES["road"].url else Response(500, "text/html", "Erreur")
        result = probe(CANDIDATES["road"], NOW, reader)
        self.assertTrue(result["readAccess"])
        self.assertEqual(result["freshness"], "TIMESTAMP_OR_TIMEZONE_UNVERIFIED")

    def test_audit_does_not_publish_any_alerts_or_claim_five_connections(self):
        def reader(url):
            return json_response(ZONE if url == SECAA_TIMEZONE_URL else secaa())
        result = audit(["road"], now=NOW, reader=reader)
        self.assertEqual(result["purpose"], "ACCESS_RESEARCH_NOT_ALERTS")
        self.assertFalse(result["allFiveRealtimeFeedsVerified"])
        self.assertNotIn("alerts", result)
        self.assertNotIn("generatedAt", result)
        self.assertEqual(result["sources"][0]["freshness"], "STALE")
        for ids in ([], ["road", "road"], ["private-provider"]):
            with self.assertRaises(ValueError):
                audit(ids, now=NOW, reader=reader)

    def test_bounded_transport_and_allowlisted_urls_never_send_auth_or_follow_redirects(self):
        from email.message import Message
        from io import BytesIO
        response = BytesIO(b'{"namespaces":[]}')
        response.code = 200
        response.headers = Message()
        response.headers["Content-Type"] = "application/json"
        with patch("scripts.probe_traffic_access.build_opener") as build:
            build.return_value.open.return_value = response
            result = read_public_url(CANDIDATES["sunubrt"].url)
            self.assertEqual(result.status, 200)
            request = build.return_value.open.call_args.args[0]
            self.assertIsNone(request.get_header("Authorization"))
            self.assertIsNone(request.get_header("Cookie"))
            self.assertIn("no-store", request.get_header("Cache-control"))
            self.assertEqual(build.return_value.open.call_args.kwargs["timeout"], 5)
        with self.assertRaises(ValueError):
            read_public_url("https://arbitrary-provider.invalid/private")

    def test_network_errors_redirections_and_invalid_json_never_prove_traffic(self):
        result = probe(CANDIDATES["road"], NOW, lambda _url: (_ for _ in ()).throw(OSError("private details")))
        self.assertEqual(result["classification"], "NETWORK_OR_RESPONSE_ERROR")
        self.assertNotIn("private details", json.dumps(result))
        for response, expected in [(Response(302, "text/html", "redirect"), "REDIRECT_NOT_FOLLOWED"), (Response(200, "application/json", "not JSON"), "INVALID_JSON"), (json_response({"success": False}), "UNVERIFIED_JSON_API")]:
            result = inspect_response(CANDIDATES["road"], response, NOW)
            self.assertEqual(result["classification"], expected)
            self.assertFalse(result["eligibleForLiveTraffic"])
