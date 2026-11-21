import tempfile
import unittest
from pathlib import Path
from scripts.bus_board_profiles import extract, measurement, profile


def call(rank, value, distance):
    return dict(stop_sequence=str(rank), arrival_time=value, departure_time=value, shape_dist_traveled=str(distance))


class BusBoardProfilesTests(unittest.TestCase):
    def test_relative_only_with_midnight_ties_and_nonzero_chainage(self):
        rows = [call(1, '23:56:01', 3), call(2, '24:00:01', 5), call(3, '24:00:01', 11)]
        ids = ('x', 'y', 'z')
        self.assertEqual(measurement(rows), (240, [0, 250, 1000]))
        p = profile([(ids, measurement(rows)), (ids, (360, [0, 350, 1000]))], ['A', 'Arrêt', 'Arrêt'])
        self.assertEqual(set(p), {'count','trips','medianSeconds','perMille','sequenceSha256','sequenceCheck'})
        self.assertEqual((p['medianSeconds'], p['perMille'], p['trips']), (300, [0, 300, 1000], 2))
        for key in ('sequenceSha256','sequenceCheck'):
            self.assertNotEqual(p[key], profile([(ids,measurement(rows))], ['Arrêt', 'A', 'Arrêt'])[key])

    def test_no_cherry_picking_ambiguous_patterns_or_invalid_measurements(self):
        rows = [call(1, '08:00:00', 0), call(2, '08:01:00', 2), call(3, '08:02:00', 4)]
        for bad in [dict(stop_sequence='1'),dict(shape_dist_traveled='nan'),dict(shape_dist_traveled='-1'),dict(departure_time='08:08:00'),dict(arrival_time='8:99:00'),dict(arrival_time='')]:
            self.assertIsNone(measurement([rows[0], {**rows[1], **bad}, rows[2]]))
        good = (('i','j','k'),measurement(rows))
        for other in [(('i','j','v'),good[1]),(good[0],None),(good[0],(120,[0,1000]))]:
            self.assertIsNone(profile([good,other], ['A','A','B']))

    def test_refuses_an_unpinned_archive_before_opening_it(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)/'wrong.zip'; p.write_bytes(b'not a pinned archive')
            with self.assertRaisesRegex(ValueError, 'Unreviewed archive'):
                extract('ddd',p,{'lines':[]})
