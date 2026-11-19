from __future__ import annotations

import copy
import json
import tempfile
import unittest
from datetime import datetime, timezone

from passenger_edition_fixture import DAY, NOW, make_publication
from scripts.serve_read_api import ApiError, journeys_payload, network_payload, passenger_network_payload
from scripts.snapshot_gtfs import list_snapshots


class PassengerEditionTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.pub, self.sid, self.path, self.review = make_publication(temp.name)

    def get(self, day=DAY, sid=None, **params):
        return passenger_network_payload(self.pub, {"date": [day], "snapshot": [sid or self.sid], **params}, now=NOW)

    def test_exact_service_day_calls_and_roles_for_each_mode(self):
        pack = self.get()
        self.assertEqual(pack["snapshot_id"], self.sid)
        self.assertTrue(network_payload(self.pub, now=NOW)["passenger_review"])
        self.assertEqual(len(list_snapshots(self.pub, now=NOW)), 1)
        data = pack["dataset"]
        self.assertEqual([p.get("busFamily", p["network"]) for p in data["patterns"]], ["ter", "brt", "ddd", "aftu", "tata"])
        self.assertEqual([p["stopId"] for p in data["platformBindings"][:2]], [f"gtfs:{self.sid}:stop:A0", f"gtfs:{self.sid}:stop:B0"])
        self.assertEqual(len(data["footways"]), 4)  # no reverse, proximity, parent or implicit transfers
        q = data["patterns"][2]
        self.assertEqual(q["service"]["departures"], [int(datetime(2026, 11, 18, 8, 20, tzinfo=timezone.utc).timestamp())])
        self.assertEqual(q["times"]["arrivals"], (0, 300))
        for day, count in [("2026-11-19", 0), ("2026-11-21", 0), ("2026-11-22", 5)]:
            self.assertEqual(len(self.get(day)["dataset"]["patterns"]), count)  # exceptions override calendar

    def test_direct_timetable_is_bound_to_the_selected_snapshot(self):
        from unittest.mock import patch
        q = {"origin": ["A0"], "destination": ["B0"], "at": [f"{DAY}T07:55:00Z"]}
        self.assertEqual(journeys_payload(self.pub, q | {"snapshot": [self.sid]}, now=NOW)["snapshot_id"], self.sid)
        with self.assertRaises(ApiError) as err:
            journeys_payload(self.pub, q | {"snapshot": ["previous"]}, now=NOW)
        self.assertEqual(err.exception.code, "SNAPSHOT_CHANGED")
        # The actual graph read, not just the metadata at request start.
        with patch("scripts.serve_read_api.load_graph", return_value={"snapshot": {"snapshot_id": "next"}}), self.assertRaises(ApiError) as err:
            journeys_payload(self.pub, q | {"snapshot": [self.sid]}, now=NOW)
        self.assertEqual(err.exception.code, "SNAPSHOT_CHANGED")

    def test_accessible_review_respects_gtfs_parent_when_child_flag_is_unspecified(self):
        def changes(t):
            rows = t["stops.txt"].splitlines()
            rows[0] += ",parent_station"
            for i in range(1, len(rows)):
                if rows[i].startswith("A0,"):
                    rows[i] = rows[i].rsplit(",", 1)[0] + ",0,P"  # inherits the station restriction
                elif rows[i].startswith("A1,"):
                    rows[i] += ",P"  # the explicitly accessible child does not inherit 2
                else:
                    rows[i] += ","
            t["stops.txt"] = "\n".join([*rows, "P,Station essai,14.82,-17.34,1,2,", ""])
        with tempfile.TemporaryDirectory() as temp:
            pub, sid, _, _ = make_publication(temp, changes)
            ps = passenger_network_payload(pub, {"date": [DAY], "snapshot": [sid]}, now=NOW)["dataset"]["patterns"]
            self.assertEqual([p["stepFree"] for p in ps], ["no", "yes", "yes", "yes", "yes"])

    def test_conditional_refresh_cannot_keep_withdrawn_or_replaced_review(self):
        rev = self.get()["revision"]
        self.assertTrue(self.get(known_revision=[rev])["unchanged"])
        self.review["links"]["footways"].pop()
        self.path.write_text(json.dumps(self.review))
        new = self.get(known_revision=[rev])
        self.assertNotEqual(new["revision"], rev)
        self.assertEqual(len(new["dataset"]["footways"]), 3)
        self.path.unlink()
        self.assertFalse(network_payload(self.pub, now=NOW)["passenger_review"])
        with self.assertRaises(ApiError):
            self.get(known_revision=[rev])

    def test_rejects_other_snapshot_invalid_date_stale_manifest_and_unpublished(self):
        for day, sid, code in [(DAY, "old-id", "SNAPSHOT_CHANGED"), ("bad", self.sid, "INVALID_QUERY"), ("2026-11-25", self.sid, "NO_REVIEWED_NETWORK")]:
            with self.subTest(day=day, sid=sid), self.assertRaises(ApiError) as err:
                self.get(day, sid)
            self.assertEqual(err.exception.code, code)
        q = {"date": [DAY], "snapshot": [self.sid]}
        with self.assertRaises(ApiError) as err:
            passenger_network_payload(self.pub, q, now=datetime(2027, 1, 1, tzinfo=timezone.utc))
        self.assertEqual(err.exception.code, "SNAPSHOT_CHANGED")
        with self.assertRaises(ApiError) as err:
            passenger_network_payload(self.pub / "empty", q, now=NOW)
        self.assertEqual(err.exception.code, "NOT_PUBLISHED")

    def test_review_cannot_override_hash_rights_route_or_order(self):
        for key, val, in_direction in [("database_sha256", "mismatch", False), ("public", False, False), ("mode", "ddd", True), ("stop_ids", ["B0", "A0"], True), ("shape_id", "S2", True), ("direction_id", "1", True)]:
            review = copy.deepcopy(self.review)
            (review["directions"][0] if in_direction else review)[key] = val
            self.path.write_text(json.dumps(review))
            with self.subTest(key=key), self.assertRaises(ApiError) as err:
                self.get()
            self.assertEqual(err.exception.status, 409)

    def test_inexact_frequencies_and_prohibitions_are_not_guaranteed_departures(self):
        for extra in [{"frequencies.txt": "trip_id,start_time,end_time,headway_secs,exact_times\nT0,08:00:00,08:30:00,600,0\n"},
                      {"transfers.txt": "from_stop_id,to_stop_id,transfer_type\nB2,A3,3\n"}]:
            with tempfile.TemporaryDirectory() as temp:
                pub, sid, _, _ = make_publication(temp, lambda t: t.update(extra))
                with self.assertRaises(ApiError) as err:
                    passenger_network_payload(pub, {"date": [DAY], "snapshot": [sid]}, now=NOW)
                self.assertEqual(err.exception.code, "NO_REVIEWED_NETWORK")

    def test_exact_frequency_is_end_exclusive_and_gtfs_no_access_overrides_review(self):
        def changes(t):
            t["frequencies.txt"] = "trip_id,start_time,end_time,headway_secs,exact_times\nT0,09:00:00,09:30:00,600,1\n"
            t["trips.txt"] = t["trips.txt"].replace("shape_id\n", "shape_id,wheelchair_accessible\n")
            for i in range(5):
                t["trips.txt"] = t["trips.txt"].replace(f",S{i}\n", f",S{i},{2 if i == 0 else 1}\n")
            t["stops.txt"] = t["stops.txt"].replace("B1,Essai B1,14.82,-17.3325,0,1", "B1,Essai B1,14.82,-17.3325,0,2")
        with tempfile.TemporaryDirectory() as temp:
            pub, sid, _, _ = make_publication(temp, changes)
            ps = passenger_network_payload(pub, {"date": [DAY], "snapshot": [sid]}, now=NOW)["dataset"]["patterns"]
            self.assertEqual([datetime.fromtimestamp(t, timezone.utc).strftime("%H:%M") for t in ps[0]["service"]["departures"]], ["09:00", "09:10", "09:20"])
            self.assertEqual([p["stepFree"] for p in ps], ["no", "no", "yes", "yes", "yes"])
