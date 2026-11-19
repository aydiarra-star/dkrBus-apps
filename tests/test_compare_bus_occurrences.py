"""Structural comparison of expired bus archives; no network or operator feed required."""
import io
from pathlib import Path
import tempfile
import unittest
import zipfile
from unittest.mock import patch
import hashlib

from scripts.compare_bus_occurrences import alignment, compare, patterns


def fixture():
    payload = io.BytesIO()
    with zipfile.ZipFile(payload, 'w') as z:
        z.writestr('routes.txt', 'route_id,agency_id\nDDD_01,DDD\nDDD_015A,DDD\n')
        z.writestr('stops.txt', 'stop_id,stop_name\na,A\nb,B\nc,A\n')
        z.writestr('shapes.txt', 'shape_id\nx\nx\ny\n')
        z.writestr('calendar.txt', 'end_date\n20231231\n')
        z.writestr('trips.txt', 'trip_id,route_id,shape_id,direction_id\nempty,DDD_01,x,1\nt1,DDD_01,x,0\nt2,DDD_01,x,0\nt3,DDD_01,x,0\nt4,DDD_01,y,1\nt5,DDD_015A,y,1\n')
        z.writestr('stop_times.txt', 'trip_id,stop_sequence,stop_id\nt1,2,b\nt1,1,a\nt1,3,c\nt1,4,a\nt2,1,a\nt2,2,b\nt2,3,c\nt2,4,a\nt3,1,a\nt3,2,c\nt4,7,b\nt4,7,a\nt5,1,b\nt5,2,a\nmissing_trip,1,b\n')
    return payload.getvalue()


class BusOccurrenceTests(unittest.TestCase):
    def test_visits_every_trip_and_alternative_even_if_first_is_empty(self):
        with zipfile.ZipFile(io.BytesIO(fixture())) as z:
            groups, stats = patterns(z, 'ddd')
        self.assertEqual(stats['trips'], 6)
        self.assertEqual(len(stats['variants']), 4)
        self.assertEqual(stats['validOrderGroups'], 3)
        self.assertEqual(stats['tripsWithoutCalls'][0]['trips'], 1)
        self.assertEqual(stats['orphanCalls'], 1)
        self.assertEqual(stats['lastCalendarEnd'], '20231231')
        self.assertEqual(set(groups), {'1', '15A'})
        first, names = next((g, n) for g, n in groups['1'] if g['trips'] == 2)
        self.assertEqual((names, first['distinctStopIds'], first['distinctLabels']), (['A','B','A','A'], 3, 2))
        tied, names = next((g, n) for g, n in groups['1'] if g['issues'])
        self.assertEqual((names, tied['rankTies']), (['B','A'], [7]))

    def test_archive_only_routes_and_tata_remain_separate(self):
        rows = [{'network': n, 'code': '1', 'evidence': [{'kind': 'owner-sequence', 'source': 'fixture', 'side': 'outbound', 'labels': ['B','A']}]} for n in ('ddd','tata')]
        with tempfile.TemporaryDirectory() as directory:
            z = Path(directory, 'tiny.zip')
            z.write_bytes(fixture())
            with self.assertRaisesRegex(ValueError, 'fingerprint'):
                compare({'lines': rows}, {'ddd': z})
            with patch.dict('scripts.compare_bus_occurrences.DIGEST', {'ddd': hashlib.sha256(z.read_bytes()).hexdigest()}):
                r = compare({'lines': rows}, {'ddd': z})
        self.assertEqual(r['archives']['ddd']['archiveOnlyCodes'], ['15A'])
        comparisons = r['lines'][0]['sequences'][0]['comparisons']
        tied = next(c for c in comparisons if c['issues'])
        self.assertIs(tied['sameLabelsInFileOrder'], True)
        self.assertNotIn('exactOrder', tied)
        self.assertEqual(r['lines'][1]['sequences'][0]['comparisons'], [])

    def test_alignment_keeps_suffixes_order_and_repetitions(self):
        self.assertTrue(alignment(['Nié (Départ)','A','A'], ['nie','A','A'])['exactOrder'])
        for a in (['A','Nié','A'], ['Nié','A'], ['Nié','A 2','A']):
            self.assertFalse(alignment(['Nié','A','A'], a)['exactOrder'])
