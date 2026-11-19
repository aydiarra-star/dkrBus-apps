import unittest

from scripts.audit_interchange_sites import foot_directions, is_platform, reachable


class PhysicalReviewTests(unittest.TestCase):
    def test_station_and_vehicle_position_are_not_passenger_platforms(self):
        for kind in ("station", "stop_position"):
            self.assertFalse(
                is_platform({"public_transport": kind, "highway": "bus_stop"})
            )
        self.assertTrue(is_platform({"railway": "platform"}))
        self.assertTrue(is_platform({"public_transport": "platform", "bus": "yes"}))

    def test_no_roads_polygons_or_restricted_paths(self):
        self.assertFalse(foot_directions({"highway": "primary", "sidewalk": "both"}))
        for tags in (
            {"area": "yes"},
            {"access": "private"},
            {"foot:access": "no"},
            {"barrier": "gate"},
            {"access:conditional": "yes @ (Mo)"},
        ):
            self.assertFalse(foot_directions({"highway": "footway", **tags}))
        self.assertEqual(
            foot_directions({"highway": "steps", "oneway:foot": "-1"}), (-1,)
        )

    def test_only_directed_connected_vertices_within_walking_budget(self):
        graph = {2: [(3, 8, 99)], 3: [(5, 8, 100)], 4: [(5, 1, 101)]}
        self.assertEqual(reachable([1], graph, 1200), ({}, {}))
        self.assertEqual(reachable([2], graph, 15)[0], {2: 0, 3: 8})
        dist, prev = reachable([2], graph, 16)
        self.assertEqual(dist, {2: 0, 3: 8, 5: 16})
        self.assertEqual(prev[5], (3, 100))
