import unittest
from copy import deepcopy

from scripts.audit_bus_osm_occurrences import compare


def node(i, name):
    return {'type': 'n', 'ref': i, 'role': 'platform', 'feature': {'id': i, 'version': 2, 'lat': 14.7, 'lon': -17.4, 'tags': {'name': name}}}


class BusOccurrencesTest(unittest.TestCase):
    def setUp(self):
        vertices = [[21, 14.7, -17.4], [22, 14.71, -17.4], [23, 14.72, -17.4]]
        way = {'id': 10, 'version': 1, 'nodeRefs': [21, 22, 23], 'geometry': [[x, y] for _, y, x in vertices]}
        relation = {'id': 100, 'version': 3, 'tags': {'type': 'route', 'route': 'bus', 'ref': '1A', 'network': 'Tata', 'operator': 'Aftu'},
                    'membersInRelationOrder': [node(1, 'Marché'), node(2, 'Marché'), {'type': 'w', 'ref': 10, 'role': '', 'feature': way}]}
        self.pbf = {'relations': [relation, {**relation, 'id': 101, 'tags': {'type': 'route', 'ref': '1A', 'name': 'Tata 1A'}}],
                    'pinnedObjects': {'ways': [{**way, 'id': 12}]}}
        self.inventory = {'pinnedOsm': {'markers': [[i, 2, 14.7, -17.4] for i in (1, 2)], 'ways': [[10, 1, vertices], [12, 1, vertices[:2]]]},
                          'lines': [{'code': '1A', 'network': 'aftu', 'evidence': [
                              {'kind': 'directional-sheet', 'labels': ['Marché', 'A', 'Marché']},
                              {'kind': 'cartographic-section', 'id': 's', 'relation': 100, 'version': 3, 'ways': [10], 'markerKind': 'platform', 'markerIds': ['landmark:bus-osm-1', 'landmark:bus-osm-2']}]},
                              {'code': '1A', 'network': 'tata', 'evidence': []}, {'code': '1', 'network': 'aftu', 'evidence': []}]}

    def test_preserves_ranks_versions_repetitions_and_unmatched_codes(self):
        r = compare(self.inventory, self.pbf)
        self.assertEqual([len(x['relations']) for x in r['lines']], [1, 0, 0])
        self.assertEqual(r['otherRouteIds'], [101])
        calls = r['lines'][0]['relations'][0]['occurrences']
        self.assertEqual([(x['id'], x['version'], x['memberRank']) for x in calls], [(1, 2, 1), (2, 2, 2)])
        self.assertTrue(all(x['sameLabel'] == [[0, 1], [0, 3]] for x in calls))
        self.assertEqual(r['memberDrift'], {'nodes': {}, 'ways': {}, 'relations': {}})
        self.assertEqual(r['sections'][0]['check'], 'pinned-objects-match')

    def test_moved_interior_node_changed_role_missing_or_reversed_way(self):
        p = deepcopy(self.pbf)
        a, b, w = p['relations'][0]['membersInRelationOrder']
        a['feature']['version'] = 3
        b['role'] = 'platform_exit_only'
        w['feature']['geometry'][1][0] += 0.001  # moving a node need not bump the WAY version
        del p['pinnedObjects']
        r = compare(self.inventory, p)
        self.assertEqual(r['sections'][0]['problems'], ['node:1', 'way:10', 'relation:platform-order'])
        self.assertEqual(r['memberDrift']['ways'], {10: 'source-vertices', 12: 'missing'})
        w['feature']['geometry'][1][0] = -17.4
        w['feature']['nodeRefs'].reverse()
        self.assertEqual(compare(self.inventory, p)['memberDrift']['ways'][10], 'source-vertices')

    def test_no_promotion_of_unattributed_same_number_or_master(self):
        p = deepcopy(self.pbf)
        p['relations'][0]['tags'].update(type='route_master')
        r = compare(self.inventory, p)
        self.assertFalse(any(x['relations'] for x in r['lines']))
        self.assertIn('relation:identity-or-version', r['sections'][0]['problems'])

    def test_stop_area_order_does_not_bind_platforms_but_route_pair_order_matters(self):
        m = [{'type': 'n', 'ref': 1, 'role': 'stop'}, {'type': 'n', 'ref': 2, 'role': 'platform'}]
        expected = [['n', 1, 'stop'], ['n', 2, 'platform']]
        self.pbf['pinnedObjects']['relations'] = [{'id': i, 'version': 3, 'members': list(reversed(m))} for i in (31, 32)]
        self.inventory['pinnedOsm']['relations'] = [{'id': 31, 'version': 3, 'members': expected}, {'id': 32, 'version': 3, 'sequences': [expected]}]
        self.assertEqual(compare(self.inventory, self.pbf)['memberDrift']['relations'], {32: 'members-or-route-pair'})
