import unittest
from scripts.audit_aftu_road_fit import fit, lanes, Roads


class Fit(unittest.TestCase):
    def test_sampled_chord_cannot_jump_a_disconnected_lane(self):
        r = Roads()
        r.add(1, 2, (0, 0), (50, 0)); r.add(3, 4, (50, 0), (90, 0))
        self.assertIn('BROKEN_CHAIN', fit([(0, 0), (90, 0)], r)['gaps'])
        r.add(2, 4, (50, 0), (90, 0))
        self.assertTrue(fit([(0, 0), (90, 0)], r)['possible'])
        self.assertFalse(fit([(90, 0), (0, 0)], r)['possible'])

    def test_tests_middle_of_segment_and_obeys_bus_exceptions(self):
        r = Roads(); r.add(1, 2, (0, 0), (10, 0)); r.add(2, 3, (90, 0), (100, 0))
        self.assertIn('NO_DIRECTED_ROAD', fit([(0, 0), (100, 0)], r)['gaps'])
        self.assertEqual((), lanes({'highway': 'footway'})); self.assertEqual((), lanes({'highway':'service', 'access':'private'}))
        self.assertEqual((1,-1), lanes({'highway':'service','access':'private','bus':'yes','oneway':'yes','oneway:bus':'no'}))
        self.assertEqual((), lanes({'highway':'primary','access:conditional':'no @ (night)'}))
