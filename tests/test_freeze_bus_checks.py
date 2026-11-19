"""Tampered/truncated CI annotations must never look like a complete audit."""
import json
import unittest
from scripts.freeze_bus_checks import freeze


class BusSourceReceiptTests(unittest.TestCase):
    def setUp(self):
        def notices(groups):
            return [{'title': k, 'message': v if isinstance(v, str) else json.dumps(v)} for k, v in groups.items()]
        self.a = notices({'Acquisition AFTU': 'PARTIAL_SOURCE_RESPONSE · 1 pages · 1 erreurs',
                          'Pages AFTU non acquises': [['2', 'HTTP 404']], 'Cartes AFTU': [['1', 'NO_READABLE_OVERLAY', None, None, None, None, None]],
                          'Voirie Sénégal': 'a'*64, 'Nombre de suites AFTU': '0'})
        self.r = notices({'Empreinte continuité': 'a'*64, 'Continuité bus': [{'id': 1}], 'Nombre de relations bus': '1', 'Revue OSM': 'QA'})

    def run_freeze(self):
        return freeze(self.a, self.r, 'b'*40, 'test-AFTU', 'test-OSM')

    def test_unreadable_page_has_no_fabricated_length_or_archive_fit(self):
        out = self.run_freeze()
        self.assertEqual(out['drawings']['1'], {'pageStatus': 'NO_READABLE_OVERLAY', 'pageHash': None, 'markers': [], 'lineCount': 0})
        self.assertEqual(out['pageErrors'], [['2', 'HTTP 404']])

    def test_truncated_page_errors_variants_relations_and_different_pbf_fail(self):
        for src, title, message in [(self.a,'Pages AFTU non acquises','[]'), (self.a,'Nombre de suites AFTU','1'),
                                    (self.a,'Cartes AFTU','[]'), (self.a,'Voirie Sénégal','0'*64), (self.r,'Continuité bus','[]')]:
            with self.subTest(title=title):
                item = next(a for a in src if a['title'] == title)
                original, item['message'] = item['message'], message
                with self.assertRaises(ValueError):
                    self.run_freeze()
                item['message'] = original
