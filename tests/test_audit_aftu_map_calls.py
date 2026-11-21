import unittest
from scripts.audit_aftu_map_calls import project_calls


class MapCalls(unittest.TestCase):
    def test_separate_endpoints_order_offsets_and_missing_occurrences(self):
        line = [(0,0),(100,0),(200,0)]
        self.assertTrue(project_calls(line, [(3,1),(99,0),(199,1)], 20)['fit'])
        self.assertEqual([2],project_calls(line, [(0,0),(100,23),(200,0)], 20)['outside'])
        self.assertFalse(project_calls(line, [(98,0),(200,0)], 20)['fit'])
        self.assertEqual([3],project_calls(line, [(0,0),(150,0),(40,0),(200,0)], 20)['noProgress'])
        self.assertEqual([2],project_calls(line, [(0,0),None,(200,0)], 20)['missing'])
        self.assertTrue(project_calls(line+[(200,100),(100,100),(100,0)], [(0,0),(100,0),(200,100),(100,0)], 10)['fit'])
