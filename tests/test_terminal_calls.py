import unittest

from scripts.audit_terminal_calls import occurrences
from scripts.ouakam_site import site, on_road, before_end, drawing_frame


def call(i, stop, pickup="0", drop="0"):
    return dict(
        stop_sequence=str(i), stop_id=stop, pickup_type=pickup, drop_off_type=drop
    )


class HistoricalTerminalTest(unittest.TestCase):
    def test_literal_order_roles_and_repeated_occurrences(self):
        # Do not drop the penultimate stop because the last has the same label,
        # or use a first/last flag in place of the literal pickup/drop-off code.
        status, hits = occurrences(
            [call(30, "a", "1"), call(10, "a"), call(20, "b", "0", "1")], {"a", "b"}
        )
        self.assertEqual(status, "MATCH")
        self.assertEqual(
            hits,
            (
                ("a", 1, None, "b", "0", "0"),
                ("b", 2, "a", "a", "0", "1"),
                ("a", 3, "b", None, "1", "0"),
            ),
        )

    def test_missing_rows_are_not_a_negative_stop_match(self):
        self.assertEqual(occurrences([], {"a"}), ("NO_JOINED_CALLS", ()))
        self.assertEqual(occurrences([call(1, "b")], {"a"}), ("NO_TARGET", ()))
        self.assertEqual(
            occurrences([call(1, "a"), call(1, "b")], {"a"}), ("TIED_RANKS", ())
        )


class OuakamFrameTest(unittest.TestCase):
    def test_side_and_progress_on_the_reviewed_bounded_parts(self):
        road, poles = site()
        positions = [on_road(p, road) for p in poles.values()]
        self.assertEqual(
            [p["alongM"] for p in positions], sorted(p["alongM"] for p in positions)
        )
        self.assertTrue(all(p["leftM"] < 0 for p in positions))
        self.assertIsNone(on_road((road[0][1], road[0][2]), road))

    def test_drawing_end_is_oriented_and_samples_short_lines_honestly(self):
        self.assertIsNone(before_end([(14.7, -17.3)] * 2, 25))
        self.assertEqual(drawing_frame(None, []), {"status": "NO_DIRECTIONAL_DRAWING"})
        road, poles = site()
        point = poles["n4363242525"]
        xy = [point[1], point[0]]
        d = {
            "positions": [xy, [xy[0], xy[1] - 0.0002]],
            "orientation": "start-last",
            "overlayHash": "fixture",
        }
        out = drawing_frame(
            d, [("start", "a", None, None), ("finish", "b", point, point)]
        )
        self.assertEqual(out["metersBeforeFinish"]["0"], out["finishMarker"])
        self.assertIsNone(out["metersBeforeFinish"]["25"])
