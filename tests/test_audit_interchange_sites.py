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

    def test_regional_search_requires_real_nodes_and_directed_alight_board_roles(self):
        from scripts.audit_interchange_sites import regional_candidates

        def platform(i, ref, memberships):
            return {
                "id": i,
                "refs": [ref],
                "touchingFootways": [71],
                "memberships": memberships,
                "tags": {},
            }

        a = [31, 1, "platform_exit_only", "bus", "18", "A", "B"]
        b = [32, 1, "platform_entry_only", "bus", "39", "C", "D"]
        ps = {
            p["id"]: p
            for p in [
                platform("n1", 1, [a, b]),
                platform("n2", 2, [b]),
                platform("n3", 3, [b]),
                platform("n4", 4, [[33, 1, "platform", "stop_area", None, None, None]]),
            ]
        }
        r = regional_candidates(
            ps, {1: [(2, 30, 71)], 2: [(4, 10, 71)]}, {31: "ddd", 32: "aftu"}
        )
        self.assertEqual(set(r["sameObjectByRole"]), {"n1"})
        self.assertEqual(len(r["sameObjectByRole"]["n1"]), 1)
        self.assertEqual(
            [p for p, _ in r["pathsBetweenRouteRoles"]], [["n1", "n2", 30, 1, 2, [71]]]
        )
        self.assertNotIn("n3", r["labels"])
