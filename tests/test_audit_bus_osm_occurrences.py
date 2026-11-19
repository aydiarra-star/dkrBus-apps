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

    def test_mixed_case_direction_is_membership_not_permission_to_reverse(self):
        # Like AFTU 40: the member role is capitalised in the source relation.
        m = self.pbf['relations'][0]['membersInRelationOrder'][-1]
        section = self.inventory['lines'][0]['evidence'][-1]
        for kind in ('platform', 'road-limit'):
            with self.subTest(markerKind=kind):
                section['markerKind'] = kind
                if kind == 'road-limit':
                    self.inventory['pinnedOsm']['markers'] += [[21, 2, 14.7, -17.4], [23, 2, 14.72, -17.4]]
                    self.pbf['pinnedObjects']['nodes'] = [{'id': i, 'version': 2, 'lat': y, 'lon': -17.4} for i, y in ((21, 14.7), (23, 14.72))]
                for role, sign, expected in [('Forward', 1, True), ('Forward', -1, False),
                                             ('Backward', 1, False), ('Backward', -1, True),
                                             ('platform', 1, False)]:
                    m['role'], section['ways'] = role, [sign * 10]
                    if kind == 'road-limit':
                        section['markerIds'] = [f'landmark:bus-osm-{i}' for i in ((21, 23) if sign > 0 else (23, 21))]
                    r = compare(self.inventory, self.pbf)['sections'][0]
                    self.assertEqual(r['check'] == 'pinned-objects-match', expected, (role, sign))
                section['ways'] = []
                self.assertEqual(compare(self.inventory, self.pbf)['sections'][0]['check'], 'recheck')

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

    def test_documented_street_is_not_certified_from_a_way_id_alone(self):
        section = self.inventory['lines'][0]['evidence'][-1]
        section.pop('relation'); section.pop('version'); section['markerKind'] = 'road-limit'
        self.inventory['pinnedOsm']['markers'] += [[21, 2, 14.7, -17.4], [23, 2, 14.72, -17.4]]
        self.pbf['pinnedObjects']['nodes'] = [{'id': i, 'version': 2, 'lat': y, 'lon': -17.4} for i, y in ((21, 14.7), (23, 14.72))]
        for ways, ids, ok in [([10], [21,23], True), ([-10], [23,21], True), ([10], [23,21], False),
                               ([10], [1,23], False), ([], [21,23], False), ([10], [], False), ([10], [21], False),
                               ([10,12], [21,23], False), ([10,-10], [21,23], False)]:
            section['ways'] = ways
            section['markerIds'] = [f'landmark:bus-osm-{i}' for i in ids]
            self.assertEqual(compare(self.inventory, self.pbf)['sections'][0]['check'] == 'pinned-objects-match', ok, (ways, ids))
