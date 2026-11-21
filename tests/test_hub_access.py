import unittest

from scripts.audit_hub_access import BUS_AREA, PONTY, Window


class SurveyOnlyTest(unittest.TestCase):
    def test_no_snapping_boundary_shortcuts_or_reverse_permission(self):
        s = Window()
        for n in range(1, 8):
            # 7 is co-located with, but is not a vertex of, the platform.
            s.node(n, 1, (14.69, -17.44 + .0001 * min(n, 6)), {'railway': 'platform'} if n in (6,7) else {})
        s.way(BUS_AREA, 2, [1, 2, 3, 1], {'amenity': 'bus_station'})
        s.way(21, 3, [2, 4, 5, 6], {'highway': 'footway', 'oneway:foot': 'yes'})
        r = s.read(); start = f'w{BUS_AREA}'
        self.assertEqual(r['features'][start]['contacts'], [[2, [21]]])
        [p] = r['boundedDirectedPaths']; self.assertEqual(p[:2], [start, 'n6']); self.assertGreater(p[2], 0)
        self.assertEqual(p[3:], [2, 6, [21]]); self.assertEqual(r['features']['n7']['contacts'], [])
        self.assertNotIn(BUS_AREA, r['dedicatedWays'])

    def test_restrictions_window_gaps_and_road_axes_are_not_crossings(self):
        s = Window(); a, b = PONTY
        for n, tags in [(a, {}), (b, {}), (1, {'barrier': 'turnstile'})]:
            s.node(n, 1, (14.67, -17.43), tags)
        s.way(1, 1, [a, b], {'highway': 'primary'})
        s.way(2, 1, [a, 1, b], {'highway': 'pedestrian'})
        s.way(3, 1, [a, 9999, b], {'highway': 'footway'})
        s.way(4, 1, [a, b], {'highway': 'footway', 'access:conditional': 'yes @ (07:00-08:00)'})
        s.way(5, 1, [a, b], {'highway': 'path', 'foot:access': 'customers'})
        r = s.read(); self.assertEqual(r['boundedDirectedPaths'], []); self.assertEqual(r['dedicatedWays'], {})
        self.assertEqual(r['features']['n1']['kind'], 'entrance-or-control')
