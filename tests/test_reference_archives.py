import io
import unittest
import zipfile
from unittest.mock import patch

from scripts.audit_reference_archives import TARGETS, inspect


class SummaryComparisonTest(unittest.TestCase):
    def read(self, calls):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as z:
            z.writestr('trips.txt', 'trip_id,service_id,route_id,shape_id,direction_id\nt,s,R,drawing,1\n')
            z.writestr('stops.txt', 'stop_id,stop_name\na,Ciel Oil\nb,Ciel Oil\n')
            z.writestr('stop_times.txt', 'trip_id,stop_id,stop_sequence,arrival_time,departure_time\n' + calls)
            z.writestr('calendar.txt', 'service_id,end_date\ns,20231231\n')
            z.writestr('calendar_dates.txt', 'service_id;date;exception_type\n')
        with zipfile.ZipFile(buf) as z, patch.dict(TARGETS, {'test': {'R': {'a', 'b'}}}):
            return inspect(z, 'test', {'R': ['05:30', '05:31']})['R']['variants'][0]

    def test_reports_only_the_minute_at_origin_not_an_arrival_or_a_new_transcription(self):
        row = self.read('t,b,15,05:31:00,05:31:00\nt,a,2,5:30:58,5:30:59\n')
        self.assertEqual(row['originsInReportedMinutes'], {'05:30': 1, '05:31': 0})
        self.assertEqual(row['archivedDurationSeconds'], [1, 1])
        self.assertEqual(row['occurrences'], [['a', 1, None, 'b'], ['b', 2, 'a', None]])
        self.assertNotEqual(row['first'], row['last'])  # same name, still different IDs

    def test_missing_join_and_tied_rank_are_not_zero_matches(self):
        for calls in ['', 't,b,2,05:31:00,05:31:00\nt,a,2,05:30:00,05:30:00\n']:
            with self.assertRaisesRegex(ValueError, 'NO_JOINED_CALLS|TIED_RANKS'):
                self.read(calls)

    def test_does_not_infer_rollover_or_copy_tomorrows_clock(self):
        with self.assertRaisesRegex(ValueError, 'négative'):
            self.read('t,a,1,23:58:00,23:58:00\nt,b,2,00:01:00,00:01:00\n')
        row = self.read('t,a,1,29:30:59,29:30:59\nt,b,2,29:32:00,29:32:00\n')
        self.assertEqual(row['originsInReportedMinutes'], {'05:30': 0, '05:31': 0})
