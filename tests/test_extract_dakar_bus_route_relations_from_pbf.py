import unittest
from importlib.util import find_spec
from pathlib import Path
from tempfile import TemporaryDirectory

from scripts.extract_dakar_bus_route_relations_from_pbf import (
    audit_route_way_topology, extract_route_relations,
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
        self.assertTrue(is_route_way_member("w", "Forward"))
        self.assertFalse(is_route_way_member("n", "Forward"))
        self.assertFalse(is_route_way_member("w", "platform"))
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
        self.assertEqual(audit["adjacentMemberSharedNodeCount"], 1)

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

    @unittest.skipUnless(find_spec('osmium'), 'pyosmium installed in the PBF job')
    def test_real_pbf_keeps_member_versions_and_nonmember_street_and_station_objects_separate(self):
        import osmium
        from osmium.osm.mutable import Node, Way, Relation
        with TemporaryDirectory() as tmp:
            file = str(Path(tmp) / 'review.osm.pbf')
            with osmium.SimpleWriter(file) as writer:
                for i in (1, 2, 3):
                    writer.add_node(Node(id=i, version=2, location=(-17.4550269, 14.7373054)))
                writer.add_way(Way(id=4, version=6, nodes=[1, 2]))
                writer.add_way(Way(id=5, version=4, nodes=[2, 3]))
                writer.add_relation(Relation(id=6, version=5, tags={'type': 'route', 'route': 'bus', 'ref': '1'},
                                             members=[('n', 1, 'platform'), ('w', 4, 'Forward')]))
                writer.add_relation(Relation(id=7, version=3, tags={'type': 'public_transport', 'public_transport': 'stop_area'},
                                             members=[('n', 1, 'platform'), ('w', 5, 'platform')]))
            output = extract_route_relations(file, {'markers': [[2, 2, 14.7373054, -17.4550269]], 'ways': [[5, 4, []]], 'relations': [{'id': 7}]})
        self.assertEqual([r['id'] for r in output['relations']], [6])
        roads = output['relations'][0]['routeWaysInRelationOrder']
        self.assertEqual([(w['id'], w['role'], w['memberOrder']) for w in roads], [(4, 'Forward', 1)])
        a, b = output['relations'][0]['membersInRelationOrder']
        self.assertEqual((a['feature']['version'], b['feature']['version']), (2, 6))
        objects = output['pinnedObjects']
        self.assertEqual(objects['nodes'][0]['lat'], 14.7373054)
        self.assertEqual(objects['ways'][0]['nodeRefs'], [2, 3])
        self.assertEqual((objects['ways'][0]['version'], objects['relations'][0]['version']), (4, 3))
        self.assertEqual(objects['relations'][0]['members'][1], {'type': 'w', 'role': 'platform', 'ref': 5})


if __name__ == "__main__":
    unittest.main()
