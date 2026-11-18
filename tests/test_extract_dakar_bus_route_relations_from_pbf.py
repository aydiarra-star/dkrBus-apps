import unittest

from scripts.extract_dakar_bus_route_relations_from_pbf import (
    audit_route_way_topology,
    is_public_transport_route,
    is_route_way_member,
    is_stop_member,
    relation_intersects_dakar,
)


class BusRouteRelationFilterTests(unittest.TestCase):
    def test_accepts_bus_and_share_taxi_route_relations(self):
        self.assertTrue(is_public_transport_route({"type": "route", "route": "bus"}))
        self.assertTrue(is_public_transport_route({"type": "route", "route": "share_taxi"}))
        self.assertTrue(is_public_transport_route({"type": "route_master", "route_master": "bus"}))

    def test_rejects_unrelated_transport_modes(self):
        self.assertFalse(is_public_transport_route({"type": "route", "route": "subway"}))
        self.assertFalse(is_public_transport_route({"type": "route", "route": "train"}))
        self.assertFalse(is_public_transport_route({"type": "multipolygon", "route": "bus"}))

    def test_keeps_stop_platform_roles_separate_from_route_ways(self):
        self.assertTrue(is_stop_member("n", "stop"))
        self.assertTrue(is_stop_member("n", "platform"))
        self.assertTrue(is_stop_member("w", "platform"))
        self.assertFalse(is_stop_member("w", "forward"))
        self.assertTrue(is_route_way_member("w", "forward"))
        self.assertTrue(is_route_way_member("w", "backward"))
        self.assertFalse(is_route_way_member("n", "stop"))

    def test_relation_must_intersect_the_dakar_extract(self):
        members = [
            {"type": "w", "ref": 101, "role": ""},
            {"type": "n", "ref": 202, "role": "stop"},
        ]
        self.assertTrue(relation_intersects_dakar(members, {202}, set()))
        self.assertTrue(relation_intersects_dakar(members, set(), {101}))
        self.assertFalse(relation_intersects_dakar(members, {999}, {888}))

    def test_topology_audit_recognizes_a_contiguous_route_without_stitching_it(self):
        audit = audit_route_way_topology([
            {"nodeRefs": [1, 2], "geometry": []},
            {"nodeRefs": [2, 3], "geometry": []},
        ])
        self.assertEqual(audit["connectedComponentCount"], 1)
        self.assertEqual(audit["largestComponentWayCount"], 2)
        self.assertTrue(audit["simplePathCandidate"])
        self.assertEqual(audit["adjacentMemberJoinCount"], 1)

    def test_topology_audit_keeps_disconnected_ways_separate(self):
        audit = audit_route_way_topology([
            {"nodeRefs": [1, 2], "geometry": []},
            {"nodeRefs": [3, 4], "geometry": []},
        ])
        self.assertEqual(audit["connectedComponentCount"], 2)
        self.assertFalse(audit["simplePathCandidate"])

    def test_topology_audit_detects_branching_instead_of_calling_it_a_simple_path(self):
        audit = audit_route_way_topology([
            {"nodeRefs": [1, 2], "geometry": []},
            {"nodeRefs": [2, 3], "geometry": []},
            {"nodeRefs": [2, 4], "geometry": []},
        ])
        self.assertEqual(audit["connectedComponentCount"], 1)
        self.assertEqual(audit["branchNodeCount"], 1)
        self.assertFalse(audit["simplePathCandidate"])

    def test_topology_audit_detects_a_connection_at_an_interior_node(self):
        audit = audit_route_way_topology([
            {"nodeRefs": [1, 2, 3], "geometry": []},
            {"nodeRefs": [2, 4], "geometry": []},
        ])
        self.assertEqual(audit["connectedComponentCount"], 1)
        self.assertEqual(audit["branchNodeCount"], 1)
        self.assertEqual(audit["adjacentMemberSharedNodeCount"], 1)
        self.assertFalse(audit["simplePathCandidate"])


if __name__ == "__main__":
    unittest.main()
