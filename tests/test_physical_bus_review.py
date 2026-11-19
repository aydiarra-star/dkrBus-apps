import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

from scripts.audit_gt54 import check_chain, drawing_control, locate, PINS
from scripts.medina_phase import ANCHORS, approach


class PhysicalBusTests(unittest.TestCase):
    def test_candidate_requires_the_actual_vertex_and_signed_side(self):
        pins = json.loads(PINS.read_text())
        a, b = pins["ways"]
        check_chain([a, b])
        wrong = [[-1, *b[2][0][1:]], *b[2][1:]]
        with self.assertRaises(ValueError):
            check_chain([a, [b[0], b[1], wrong]])
        p = pins["markers"][0][2:]
        self.assertAlmostEqual(locate(p, a[2])[1], -3.06, places=2)
        self.assertAlmostEqual(locate(p, a[2][::-1])[1], 3.06, places=2)
        with self.assertRaises(ValueError):
            locate(p, a[2][:2])

    def test_phase_uses_separate_variant_and_exact_consecutive_archive_ids(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "small.zip"

            def sample(bad):
                trips = []
                times = []
                for key, (side, shape, origin, rank, local) in ANCHORS.items():
                    trips.append(f"{key},DDD_01,{side},{shape}")
                    ids = list(origin) + ["other"] * (rank - 3) + list(local)
                    if bad and key == "inbound":
                        ids[rank - 1], ids[rank] = ids[rank], ids[rank - 1]
                    for i, stop in enumerate(ids, 1):
                        times.append(f"{key},{i},{stop},07:{i:02}:00,07:{i:02}:30")
                with zipfile.ZipFile(path, "w") as z:
                    z.writestr(
                        "trips.txt",
                        "trip_id,route_id,direction_id,shape_id\n" + "\n".join(trips),
                    )
                    z.writestr(
                        "stop_times.txt",
                        "trip_id,stop_sequence,stop_id,arrival_time,departure_time\n"
                        + "\n".join(reversed(times)),
                    )
                return hashlib.sha256(path.read_bytes()).hexdigest()

            with patch.dict("scripts.medina_phase.DIGEST", ddd=sample(False)):
                self.assertEqual(approach(path, "inbound"), (1, 570, 570, 570))
                self.assertEqual(approach(path, "outbound"), (1, 1590, 1590, 1590))
            with patch.dict(
                "scripts.medina_phase.DIGEST", ddd=sample(True)
            ), self.assertRaisesRegex(ValueError, "Profil"):
                approach(path, "inbound")

    def test_drawing_controls_check_the_turn_not_only_a_nearby_point(self):
        ways = json.loads(PINS.read_text())["ways"]
        road = [v[1:][::-1] for v in ways[0][2] + ways[1][2][1:]]
        identity = {
            "shapeHash": "4a059a80248d93101471ae9d75a26ee8a22b4f970bc961f0ae082b41094d8aff",
            "orientation": "start-first",
        }
        self.assertTrue(
            drawing_control({**identity, "positions": road})["orderedWithin20m"]
        )
        self.assertFalse(
            drawing_control({**identity, "positions": road[::-1]})["orderedWithin20m"]
        )
        self.assertFalse(
            drawing_control({**identity, "positions": road[:2]})["orderedWithin20m"]
        )
        self.assertEqual(
            drawing_control({**identity, "orientation": "start-last"})["status"],
            "DESSIN_A_RELIRE",
        )

    def test_patte_doie_uses_the_whole_ordered_window_and_regular_roles(self):
        from scripts.audit_patte_doie import event_rank

        triple = ("first", "at", "next")
        rows = [
            dict(stop_id=k, stop_sequence=str(i), pickup_type="0", drop_off_type="0")
            for i, k in enumerate(triple, 1)
        ]
        self.assertEqual(event_rank(rows[::-1], triple), 2)
        self.assertIsNone(event_rank(rows[:1], triple))
        for bad in (
            rows[:-1],
            rows + [rows[1]],
            [rows[0], dict(rows[1], pickup_type="1"), rows[2]],
            [dict(rows[0], stop_id="other"), *rows[1:]],
        ):
            with self.assertRaises(ValueError):
                event_rank(bad, triple)
