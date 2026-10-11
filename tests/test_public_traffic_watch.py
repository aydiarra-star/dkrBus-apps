"""Public operator bodies are doubles: never manufacture today's incidents."""
from __future__ import annotations

import json
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock

from scripts.probe_traffic_access import CETUD_WATCH_URL, SECAA_TIMEZONE_URL, Response
from scripts.public_traffic_watch import PublicTrafficWatch, WATCH_URLS, bulletin_state, extract_bulletins
from scripts.traffic_feeds import FeedConfig, SOURCES, TrafficFeedService, iso

NOW = datetime(2026, 10, 11, 12, tzinfo=timezone.utc)


def post(at=NOW, title="Info trafic · TER", text="Le trafic est interrompu sur le TER.", **extra):
    return {"id": 42, "date_gmt": at.strftime("%Y-%m-%dT%H:%M:%S"), "modified_gmt": NOW.strftime("%Y-%m-%dT%H:%M:%S"),
            "title": {"rendered": title}, "content": {"rendered": text}, **extra}


def response(value, status=200):
    return Response(status, "application/json", json.dumps(value))


def html_bulletin(at=iso(NOW), **extra):
    article = {"@type": "NewsArticle", "headline": "Info trafic · TER", "articleBody": "Le trafic est interrompu sur le TER.",
               "datePublished": at, "identifier": "bulletin-1", **extra}
    return Response(200, "text/html", '<script type="application/ld+json">' + json.dumps(article) + '</script>')


class PublicTrafficWatchTests(unittest.TestCase):
    def test_extracts_only_explicit_fresh_current_bulletins_with_publisher_dates(self):
        items = extract_bulletins("cetud", response([post(at=NOW - timedelta(minutes=12))]), NOW)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["updatedAt"], "2026-10-11T11:48:00Z")
        self.assertEqual(items[0]["confirmedAt"], items[0]["updatedAt"])
        self.assertEqual(items[0]["affectedNetworks"], ["ter"])
        self.assertIsNone(items[0]["lat"])
        self.assertIsNone(items[0]["delayMinutes"])
        self.assertEqual(items[0]["source"]["id"], "cetud")

    def test_yesterday_exact_hour_future_and_modified_old_article_are_never_revived(self):
        for at in (NOW - timedelta(days=1), NOW - timedelta(hours=1), NOW + timedelta(seconds=1)):
            with self.subTest(at=at):
                self.assertEqual(extract_bulletins("cetud", response([post(at=at)]), NOW), [])
        self.assertEqual(len(extract_bulletins("cetud", response([post(at=NOW - timedelta(hours=1) + timedelta(seconds=1))]), NOW)), 1)

    def test_a_recent_joj_news_article_is_not_a_current_incident(self):
        for value in (post(title="JOJ Dakar 2026 : le dispositif de circulation présenté"),
                      post(text="Le trafic sera interrompu demain."), post(text="Le trafic pourrait être interrompu."),
                      post(text="Le trafic n'est pas interrompu."), post(text="Exercice : le trafic est interrompu.")):
            self.assertEqual(extract_bulletins("cetud", response([value]), NOW), [])

    def test_undated_html_and_global_website_modified_date_are_not_evidence(self):
        for body in ('<p>Info trafic : le trafic est interrompu sur le TER.</p>',
                     '<script type="application/ld+json">' + json.dumps({"@type": "WebPage", "dateModified": iso(NOW), "description": "Info trafic : le trafic est interrompu."}) + '</script>'):
            self.assertEqual(extract_bulletins("ter", Response(200, "text/html", body), NOW), [])

    def test_dated_json_ld_bulletin_requires_timezone_valid_calendar_and_traffic_heading(self):
        self.assertEqual(len(extract_bulletins("ter", html_bulletin(), NOW)), 1)
        for at in ("2026-10-11T12:00:00", "2026-02-30T12:00:00Z", iso(NOW + timedelta(seconds=1))):
            self.assertEqual(extract_bulletins("ter", html_bulletin(at), NOW), [])
        self.assertEqual(extract_bulletins("ter", html_bulletin(headline="Nouveaux horaires TER"), NOW), [])

    def test_fresh_post_about_another_explicit_day_is_not_current(self):
        for day in ("9 octobre 2026", "12 octobre", "2026-10-09", "12/10/2026"):
            value = post(text=f"Le trafic est interrompu sur le TER le {day}.")
            self.assertEqual(extract_bulletins("cetud", response([value]), NOW), [])
        self.assertEqual(len(extract_bulletins("cetud", response([post(text="Le trafic est interrompu sur le TER le 11 octobre 2026.")]), NOW)), 1)

    def test_local_all_clear_cannot_withdraw_an_unrelated_network_incident(self):
        items = extract_bulletins("cetud", response([
            post(at=NOW - timedelta(minutes=2)),
            post(title="Info trafic · TER", text="Le trafic est normal à la gare de Dakar sur le TER.", id=43),
        ]), NOW)
        self.assertTrue(any(item["status"] == "ACTIVE" for item in items))

    def test_resolution_keeps_a_canonical_tombstone_for_a_delayed_old_bulletin(self):
        original = post(at=NOW - timedelta(minutes=2))
        data = [original, post(title="Info trafic · TER", text="Le trafic est normal sur le TER.", id=43)]
        watch = PublicTrafficWatch(reader=lambda url: response(data) if url == CETUD_WATCH_URL else Response(200, "text/html", "undated"))
        service = TrafficFeedService(public_watch=watch.source_snapshot)
        self.assertEqual(service.snapshot(now=NOW)["alerts"], [])
        data.pop()  # delayed public cache loses the newer all-clear
        self.assertEqual(service.snapshot(now=NOW + timedelta(minutes=1))["alerts"], [])

    def test_no_location_or_network_is_invented_for_generic_cetud_road_news(self):
        self.assertEqual(extract_bulletins("cetud", response([post(title="Info trafic", text="La circulation est interrompue à Hann.")]), NOW), [])

    def test_markup_and_script_are_not_passed_to_the_assistant(self):
        items = extract_bulletins("cetud", response([post(text="<p>Le trafic est interrompu sur le TER.</p><script>privateCode()</script>")]), NOW)
        self.assertEqual(len(items), 1)
        self.assertNotIn("privateCode", items[0]["summaryFr"])
        self.assertNotIn("<p>", items[0]["summaryFr"])

    def test_recent_explicit_resolution_removes_older_bulletin_for_same_network_only(self):
        items = extract_bulletins("cetud", response([
            post(at=NOW - timedelta(minutes=2)),
            post(title="Info trafic · BRT", text="Le service est suspendu sur le BRT.", id=43),
            post(title="Info trafic · TER", text="Le trafic est normal sur le TER.", id=44),
        ]), NOW)
        self.assertFalse(any(item["status"] == "ACTIVE" and item["affectedNetworks"] == ["ter"] for item in items))
        self.assertTrue(any(item["status"] == "ACTIVE" and item["affectedNetworks"] == ["brt"] for item in items))
        self.assertTrue(any(item["status"] == "RESOLVED" for item in items))

    def test_maintenance_auth_redirect_invalid_json_and_transport_failure_fail_closed(self):
        for bad in (Response(503, "text/html", "maintenance"), response({"code": "rest_login_required"}, 401),
                    Response(302, "text/html", "redirect"), Response(200, "application/json", "not JSON")):
            watch = PublicTrafficWatch(reader=lambda _url, value=bad: value)
            value = watch.source_snapshot("cetud", NOW)
            self.assertEqual(value["status"], "UNAVAILABLE")
            self.assertEqual(value["incidents"], [])
        watch = PublicTrafficWatch(reader=lambda _url: (_ for _ in ()).throw(OSError("secret remote error")))
        self.assertNotIn("secret", json.dumps(watch.source_snapshot("cetud", NOW)))

    def test_road_preserves_old_timestamp_and_never_invents_incident_gps(self):
        payload = {"success": True, "state": {"code": "ralenti"}, "updated_at": "2026-10-09 13:22:26", "incidents": [{"pk": "34.7", "location": "Sebi Ponty"}]}
        zone = {"timezone_string": "Africa/Dakar", "gmt_offset": 0}
        watch = PublicTrafficWatch(reader=lambda url: response(zone if url == SECAA_TIMEZONE_URL else payload))
        result = watch.source_snapshot("road", NOW)
        self.assertEqual(result["status"], "STALE")
        self.assertEqual(result["observedAt"], "2026-10-09T13:22:26Z")
        self.assertEqual(result["incidents"], [])
        payload["updated_at"] = "2026-10-11 11:59:00"
        result = watch.source_snapshot("road", NOW)
        self.assertEqual(result["status"], "PARTIAL")
        self.assertEqual(result["incidents"], [])
        zone["gmt_offset"] = False
        self.assertEqual(watch.source_snapshot("road", NOW)["status"], "UNAVAILABLE")

    def test_core_proxy_consumes_public_watch_but_never_marks_it_live(self):
        reader = Mock(side_effect=lambda url: response([post()]) if url == CETUD_WATCH_URL else Response(200, "text/html", "Trafic normal"))
        watch = PublicTrafficWatch(reader=reader)
        service = TrafficFeedService(public_watch=watch.source_snapshot)
        first = service.snapshot(now=NOW)
        self.assertEqual(len(first["alerts"]), 1)
        self.assertFalse(any(source["status"] == "LIVE" for source in first["sources"]))
        self.assertEqual(first["alerts"][0]["updatedAt"], "2026-10-11T12:00:00Z")
        self.assertEqual(service.snapshot(now=NOW + timedelta(hours=1))["alerts"], [])
        self.assertEqual(reader.call_count, 10)

    def test_authenticated_adapter_precedes_public_watch_even_when_adapter_is_down(self):
        fallback = Mock(return_value={"status": "UNAVAILABLE", "observedAt": None, "incidents": []})
        service = TrafficFeedService({"ter": FeedConfig("ter", "https://authorized.example/ter")}, public_watch=fallback,
                                     fetcher=lambda _config: (_ for _ in ()).throw(OSError("down")))
        value = service.snapshot(now=NOW)
        self.assertEqual(next(item for item in value["sources"] if item["id"] == "ter")["status"], "UNAVAILABLE")
        self.assertNotIn("ter", [call.args[0] for call in fallback.call_args_list])
        self.assertEqual(set(WATCH_URLS), set(SOURCES))
        with self.assertRaises(ValueError):
            PublicTrafficWatch().source_snapshot("arbitrary")
