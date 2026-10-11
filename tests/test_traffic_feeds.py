"""No real incidents or provider credentials: all upstream feeds are doubles."""
from __future__ import annotations

import copy
import json
import tempfile
import threading
import unittest
from datetime import datetime, timedelta, timezone
from email.message import Message
from pathlib import Path
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from scripts.serve_admin_api import create_server
from scripts.traffic_feeds import (
    FEED_TIMEOUT_SECONDS, MAX_FEED_BYTES, SOURCES, FeedConfig, TrafficFeedService,
    fetch_json_feed, fresh, instant, iso, load_feed_config, validate_traffic_query,
)

NOW = datetime(2026, 10, 11, 12, tzinfo=timezone.utc)
HOUR = timedelta(hours=1)


def incident(**overrides):
    return {
        "id": "canonical-accident", "status": "ACTIVE", "severity": "warning",
        "headlineFr": "Incident de test confirmé", "summaryFr": "Perturbation confirmée par le double de source.",
        "updatedAt": iso(NOW), "confirmedAt": iso(NOW), "expiresAt": None,
        "lat": 14.7051, "lon": -17.4602, "affectedNetworks": ["ddd"], "affectedLines": ["10"],
        **overrides,
    }


def feed(items=None, **overrides):
    return {"region": "Dakar", "complete": True, "observedAt": iso(NOW), "incidents": items or [], **overrides}


def configs():
    return {key: FeedConfig(key, f"https://authorized.example/{key}") for key in SOURCES}


def status(payload, source):
    return next(entry["status"] for entry in payload["sources"] if entry["id"] == source)


class TrafficFeedTests(unittest.TestCase):
    def service(self, payloads=None):
        responses = {key: feed() for key in SOURCES}
        responses.update(payloads or {})
        fetcher = MagicMock(side_effect=lambda config: copy.deepcopy(responses[config.source_id]))
        return TrafficFeedService(configs(), fetcher=fetcher), fetcher, responses

    def test_no_config_is_unavailable_not_a_fake_normal_network(self):
        payload = TrafficFeedService().snapshot(now=NOW)
        self.assertEqual(payload["alerts"], [])
        self.assertEqual(len(payload["sources"]), 5)
        self.assertTrue(all(entry["status"] == "NOT_CONFIGURED" for entry in payload["sources"]))

    def test_fetches_the_five_sources_again_on_every_request_without_retimestamping(self):
        at = NOW - timedelta(minutes=10)
        service, fetcher, _ = self.service({"cetud": feed([incident(updatedAt=iso(at), confirmedAt=iso(at))])})
        first = service.snapshot(now=NOW)
        second = service.snapshot(now=NOW + timedelta(minutes=1))
        self.assertEqual(fetcher.call_count, 10)
        self.assertEqual({call.args[0].source_id for call in fetcher.call_args_list}, set(SOURCES))
        self.assertEqual(first["alerts"][0]["updatedAt"], iso(at))
        self.assertEqual(second["alerts"][0]["updatedAt"], iso(at))
        self.assertEqual(second["alerts"][0]["expiresAt"], iso(at + HOUR))
        self.assertEqual(second["sources"][0]["checkedAt"], iso(NOW))

    def test_collects_independent_sources_concurrently(self):
        barrier = threading.Barrier(5, timeout=2)
        def fetcher(config):
            barrier.wait()
            return feed()
        payload = TrafficFeedService(configs(), fetcher=fetcher).snapshot(now=NOW)
        self.assertTrue(all(entry["status"] == "LIVE" for entry in payload["sources"]))

    def test_crosses_the_same_incident_without_merging_unrelated_accidents(self):
        service, _, _ = self.service({
            "cetud": feed([incident(), incident(id="different-accident")]),
            "road": feed([incident(updatedAt=iso(NOW - timedelta(seconds=1)), confirmedAt=iso(NOW - timedelta(seconds=1)))]),
        })
        payload = service.snapshot(now=NOW)
        self.assertEqual(len(payload["alerts"]), 2)
        same = next(entry for entry in payload["alerts"] if entry["id"] == "canonical-accident")
        self.assertEqual(same["source"]["id"], "cetud")
        self.assertEqual([entry["id"] for entry in same["corroboratingSources"]], ["road"])
        self.assertEqual(same["expiresAt"], iso(NOW + HOUR - timedelta(seconds=1)))

    def test_later_resolution_wins_and_minimal_tombstones_are_supported(self):
        earlier = NOW - timedelta(minutes=1)
        resolution = {"id": "canonical-accident", "status": "RESOLVED", "updatedAt": iso(NOW)}
        service, _, _ = self.service({
            "cetud": feed([incident(updatedAt=iso(earlier), confirmedAt=iso(earlier))]),
            "road": feed([resolution]),
        })
        self.assertEqual(service.snapshot(now=NOW)["alerts"], [])

    def test_resolution_also_wins_at_the_same_timestamp(self):
        service, _, _ = self.service({"cetud": feed([incident()]), "road": feed([incident(status="RESOLVED", confirmedAt=None)])})
        self.assertEqual(service.snapshot(now=NOW)["alerts"], [])

    def test_known_resolution_cannot_resurrect_when_its_source_is_down(self):
        earlier = NOW - timedelta(minutes=1)
        service, _, responses = self.service({
            "cetud": feed([incident(updatedAt=iso(earlier), confirmedAt=iso(earlier))]),
            "road": feed([incident(status="RESOLVED", confirmedAt=None)]),
        })
        self.assertEqual(service.snapshot(now=NOW)["alerts"], [])
        responses["road"] = None  # next poll fails, while another source lags
        self.assertEqual(service.snapshot(now=NOW + timedelta(minutes=1))["alerts"], [])
        # A strictly newer, real confirmation may describe a reopened incident.
        responses["cetud"] = feed([incident(updatedAt=iso(NOW + timedelta(minutes=1)), confirmedAt=iso(NOW + timedelta(minutes=1)))], observedAt=iso(NOW + timedelta(minutes=1)))
        self.assertEqual(len(service.snapshot(now=NOW + timedelta(minutes=1))["alerts"]), 1)
        service.snapshot(now=NOW + HOUR)
        self.assertEqual(service._withdrawn, {})

    def test_purges_unconfirmed_yesterday_future_and_explicitly_expired_incidents(self):
        items = [
            incident(id="yesterday", updatedAt=iso(NOW - timedelta(days=1))),
            incident(id="unconfirmed", confirmedAt=None),
            incident(id="resolved", status="RESOLVED", confirmedAt=None),
            incident(id="future", updatedAt=iso(NOW + timedelta(seconds=1))),
            incident(id="expired", expiresAt=iso(NOW)),
        ]
        service, _, _ = self.service({"cetud": feed(items)})
        payload = service.snapshot(now=NOW)
        self.assertEqual(payload["alerts"], [])
        self.assertEqual(status(payload, "cetud"), "PARTIAL")

    def test_exactly_one_hour_is_already_expired(self):
        service, _, _ = self.service({"cetud": feed([incident(updatedAt=iso(NOW - HOUR), confirmedAt=iso(NOW - HOUR))])})
        self.assertEqual(service.snapshot(now=NOW)["alerts"], [])
        self.assertFalse(fresh(iso(NOW - HOUR), NOW))
        self.assertTrue(fresh(iso(NOW - HOUR + timedelta(milliseconds=1)), NOW))

    def test_frozen_source_is_stale_even_if_an_individual_incident_is_retimestamped(self):
        service, _, _ = self.service({"ter": feed([incident()], observedAt=iso(NOW - HOUR))})
        payload = service.snapshot(now=NOW)
        self.assertEqual(status(payload, "ter"), "STALE")
        self.assertEqual(payload["alerts"], [])

    def test_missing_or_wrong_date_region_and_malformed_incidents_fail_closed(self):
        for bad in [
            {}, feed(region="other"), feed(observedAt=None), feed(observedAt="2026-10-11T12:00:00"),
            feed([incident(lat=100)]), feed([incident(lat=None, lon=-17.46)]),
            feed([incident(affectedNetworks=["unknown"])]), feed([incident(severity="urgent")]),
            feed([incident(lat=None, lon=None, affectedNetworks=[])]),
        ]:
            with self.subTest(payload=bad):
                service, _, _ = self.service({"cetud": bad})
                self.assertEqual(status(service.snapshot(now=NOW), "cetud"), "UNAVAILABLE")
        self.assertIsNone(instant("2026-02-30T12:00:00Z"))

    def test_road_incidents_need_a_real_location(self):
        service, _, _ = self.service({"road": feed([incident(lat=None, lon=None)])})
        payload = service.snapshot(now=NOW)
        self.assertEqual(status(payload, "road"), "UNAVAILABLE")
        self.assertEqual(payload["alerts"], [])
        service, _, _ = self.service({"road": feed([incident(lat=None, lon=None, affectedStopIds=["unknown-stop"])])})
        self.assertEqual(status(service.snapshot(now=NOW), "road"), "UNAVAILABLE")

    def test_a_failure_drops_previous_data_but_keeps_other_live_sources(self):
        service, fetcher, _ = self.service({"cetud": feed([incident()])})
        self.assertEqual(len(service.snapshot(now=NOW)["alerts"]), 1)
        def outage(config):
            if config.source_id == "cetud":
                raise OSError("provider failure with secret details")
            return feed()
        fetcher.side_effect = outage
        payload = service.snapshot(now=NOW)
        self.assertEqual(payload["alerts"], [])
        self.assertEqual(status(payload, "cetud"), "UNAVAILABLE")
        self.assertEqual(status(payload, "ter"), "LIVE")
        self.assertNotIn("secret details", json.dumps(payload))

    def test_incomplete_provider_snapshots_do_not_claim_full_coverage(self):
        service, _, _ = self.service({"road": feed(complete=False)})
        self.assertEqual(status(service.snapshot(now=NOW), "road"), "PARTIAL")

    def test_withdrawn_confirmation_does_not_resurrect_during_a_provider_outage(self):
        earlier = NOW - timedelta(minutes=1)
        service, _, responses = self.service({
            "cetud": feed([incident(updatedAt=iso(earlier), confirmedAt=iso(earlier))]),
            "road": feed([incident(status="UNCONFIRMED", confirmedAt=None)]),
        })
        self.assertEqual(service.snapshot(now=NOW)["alerts"], [])
        responses["road"] = None
        self.assertEqual(service.snapshot(now=NOW + timedelta(minutes=1))["alerts"], [])

    def test_newer_unconfirmed_state_suppresses_old_active_state(self):
        service, _, _ = self.service({
            "cetud": feed([incident(updatedAt=iso(NOW - timedelta(seconds=1)), confirmedAt=iso(NOW - timedelta(seconds=1)))]),
            "road": feed([incident(status="UNCONFIRMED", confirmedAt=None)]),
        })
        payload = service.snapshot(now=NOW)
        self.assertEqual(payload["alerts"], [])
        self.assertEqual(status(payload, "road"), "PARTIAL")


class TrafficConfigurationAndTransportTests(unittest.TestCase):
    def test_only_server_controlled_authorized_https_urls_are_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "feeds.json"
            path.write_text(json.dumps({"ter": {"url": "https://authorized.example/ter", "tokenEnv": "TER_TRAFFIC_TOKEN"}}))
            self.assertEqual(load_feed_config(path)["ter"].token_env, "TER_TRAFFIC_TOKEN")
            for bad in [
                {"unknown": {"url": "https://authorized.example/"}},
                {"ter": {"url": "http://authorized.example/"}},
                {"ter": {"url": "https://localhost/"}},
                {"ter": {"url": "https://127.0.0.1/"}},
                {"ter": {"url": "https://name:secret@authorized.example/"}},
                {"ter": {"url": "https://authorized.example/", "tokenEnv": "inline-secret"}},
                {"ter": {"url": "https://authorized.example/", "headers": {"Authorization": "secret"}}},
            ]:
                path.write_text(json.dumps(bad))
                with self.subTest(config=bad), self.assertRaises(ValueError):
                    load_feed_config(path)

    def test_http_reads_are_json_size_bounded_and_never_cache_or_expose_auth(self):
        headers = Message()
        headers["Content-Type"] = "application/json"
        response = MagicMock()
        response.__enter__.return_value = response
        response.status = 200
        response.headers = headers
        response.read.return_value = json.dumps(feed()).encode()
        opener = MagicMock()
        opener.open.return_value = response
        config = FeedConfig("ter", "https://authorized.example/ter", "TER_TRAFFIC_TOKEN")
        with patch("scripts.traffic_feeds.build_opener", return_value=opener), patch.dict("os.environ", {"TER_TRAFFIC_TOKEN": "test-only-secret"}):
            self.assertEqual(fetch_json_feed(config)["region"], "Dakar")
            request = opener.open.call_args.args[0]
            self.assertEqual(request.get_header("Cache-control"), "no-cache, no-store")
            self.assertEqual(request.get_header("Authorization"), "Bearer test-only-secret")
            self.assertEqual(opener.open.call_args.kwargs["timeout"], FEED_TIMEOUT_SECONDS)
            response.read.assert_called_with(MAX_FEED_BYTES + 1)
            response.read.return_value = b"x" * (MAX_FEED_BYTES + 1)
            with self.assertRaises(ValueError):
                fetch_json_feed(config)

    def test_query_validation_never_accepts_upstream_urls_or_invalid_gps(self):
        validate_traffic_query("")
        validate_traffic_query("lat=14.7&lon=-17.46&radius=1500")
        for query in ["lat=14.7", "radius=1", "lat=NaN&lon=0", "lat=91&lon=0", "lat=0&lon=0&radius=0", "lat=0&lat=1&lon=0", "url=https://other.example"]:
            with self.subTest(query=query), self.assertRaises(ValueError):
                validate_traffic_query(query)


class TrafficHttpIntegrationTests(unittest.TestCase):
    def test_public_traffic_route_works_without_gtfs_and_is_never_cached(self):
        with tempfile.TemporaryDirectory() as directory:
            service = TrafficFeedService(configs(), fetcher=lambda config: feed(observedAt=iso(datetime.now(timezone.utc))))
            server = create_server(Path(directory) / "staging", "127.0.0.1", 0, traffic_service=service, quiet=True)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f"http://127.0.0.1:{server.server_address[1]}"
            try:
                with urlopen(base + "/api/traffic/alerts?lat=14.7&lon=-17.46&radius=1500", timeout=5) as response:
                    payload = json.load(response)
                    self.assertEqual(response.status, 200)
                    self.assertEqual(response.headers["Cache-Control"], "no-store")
                    self.assertEqual(payload["region"], "Dakar")
                    self.assertEqual(payload["alerts"], [])
                    self.assertTrue(all(entry["status"] == "LIVE" for entry in payload["sources"]))
                for request, expected in [
                    (Request(base + "/api/traffic/alerts?lat=91&lon=0"), 400),
                    (Request(base + "/api/traffic/alerts", method="POST"), 405),
                ]:
                    with self.assertRaises(HTTPError) as error:
                        urlopen(request, timeout=5)
                    self.assertEqual(error.exception.code, expected)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)
