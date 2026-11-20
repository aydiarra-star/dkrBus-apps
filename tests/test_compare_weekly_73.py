import unittest

from scripts.compare_weekly_73 import compare


class CopiedTableTest(unittest.TestCase):
    names = ['A', 'Appel local', 'Arrêt De Bus']
    sheet = {'printedLabels': {'2': 'Arrêt De Bus'}, 'weekday': {'ranks': [1, 2, 3], 'nextUntranscribedOrigin': None,
             'profiles': [{'origins': ['22:00', '23:58'], 'elapsed': [0, 2, 3]}, {'origins': ['23:00'], 'elapsed': [0, 1, 2]}]}}
    table = [['Station', 'Départ #1', 'Départ #2', 'Départ #3'], ['A', '22:00', '23:00', '23:58'],
             ['Arrêt De Bus', '22:02', '23:01', '24:00'], ['Arrêt De Bus', '22:03', '23:02', '24:01']]

    def test_display_order_and_service_day(self):
        self.assertEqual(compare(self.table, self.names, self.sheet, 'weekday'), 9)

    def test_refuses_lost_column_wrong_order_and_midnight_wrap(self):
        for table, why in [(self.table[:-1], 'nombre'), ([r[:-1] for r in self.table], 'nombre'),
                           ([*self.table[:2], self.table[3], self.table[2]], 'Rang 2'),
                           ([*self.table[:-1], [*self.table[-1][:-1], '00:01']], 'départ #3')]:
            with self.subTest(why=why), self.assertRaisesRegex(ValueError, why):
                compare(table, self.names, self.sheet, 'weekday')
