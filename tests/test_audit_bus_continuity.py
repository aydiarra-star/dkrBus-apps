import unittest
from scripts.audit_bus_continuity import review


def way(w, nodes, role='', **tags):
    return {'ref': w, 'type': 'w', 'role': role, 'feature': {'nodeRefs': nodes, 'tags': tags, 'geometry': [[-17.44+n*0.0001, 14.7] for n in nodes]}}


def check(*members):
    return review({'id': 1, 'version': 1, 'tags': {'operator': 'AFTU', 'ref': '33'}, 'membersInRelationOrder': members})


class Continuity(unittest.TestCase):
    def test_interior_join_real_but_not_an_implied_return(self):
        a = way(1, [1, 2, 3], 'Forward'); b = way(2, [2, 4]); c = way(3, [4, 5], oneway='yes')
        self.assertTrue(check(a, b, c)['orderedRoadChainPossible'])
        self.assertFalse(check(c, b, a)['orderedRoadChainPossible'])

    def test_contradiction_after_a_permitted_turn(self):
        a = way(10, [1, 2]); b = way(11, [4, 3, 2], oneway='yes'); c = way(12, [4, 5]); d = way(13, [8, 9])
        row = check(a, b, c, d)
        self.assertEqual([2], [i['rank'] for i in row['directionConflicts']]); self.assertEqual([12, 13], row['breaks'][0]['ways'])
        self.assertTrue(check(a, way(11, [4, 3, 2], oneway='-1'), c)['orderedRoadChainPossible'])

    def test_ring_wrap_and_offway_occurrence_repeated_at_two_ranks(self):
        pt = {'type': 'n', 'role': 'platform', 'ref': 5, 'feature': {'lat': 14.7003, 'lon': -17.4398}}
        r = check(pt, pt, way(1, [1, 4]), way(2, [2, 3, 4, 2], junction='roundabout'), way(3, [3, 5]))
        self.assertTrue(r['orderedRoadChainPossible']); self.assertEqual([1, 2], [s['rank'] for s in r['offsets'] if s['outside20m']])

    def test_absent_way_or_unhandled_role_is_not_skipped(self):
        for m in [{'ref': 33, 'type': 'w', 'role': ''}, way(33, [2, 4], 'unexamined')]:
            self.assertFalse(check(way(1, [1, 2]), m, way(4, [2, 3]))['orderedRoadChainPossible'])

    def test_occurrence_without_coordinates_is_not_dropped_or_a_zero_offset(self):
        a = way(1, [1, 2, 3]); pt = {'ref': 8, 'type': 'n', 'role': 'platform'}
        for f in [None, {}, {'lat': None, 'lon': None}, {'lat': 14.7}, {'lat': True, 'lon': 0}, {'lat': 92, 'lon': -17.4}]:
            with self.subTest(feature=f):
                r = check({**pt, 'feature': f}, a)
                self.assertTrue(r['orderedRoadChainPossible']); self.assertEqual(r['stops'], 1)
                self.assertIsNone(r['offsets'][0]['offsetM']); self.assertIsNone(r['offsets'][0]['outside20m'])
