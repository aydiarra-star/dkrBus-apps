import unittest

from scripts.audit_thiaroye_site import OID539, LSS, arcgis_line, bounded_segments, probe, samples


class ThiaroyeSurveyTest(unittest.TestCase):
    def test_road_and_nearby_sidewalk_stay_distinct_without_a_distance_to_walk(self):
        nodes = {1: (1, 14.747, -17.3779), 2: (2, 14.747, -17.3781),
                 3: (3, 14.74705, -17.3779), 4: (4, 14.74705, -17.3781)}
        ways = {100: (4, {"highway": "service"}, bounded_segments([1, 2], nodes)),
                101: (5, {"highway": "footway", "access": "private"}, bounded_segments([3, 4], nodes))}
        self.assertEqual(probe((14.747, -17.378), ways), {"roadsWithin12m": [[100, 0.0]], "nearestFootway": [101, 5.6]})
        self.assertEqual(bounded_segments([1, 99, 2], nodes), [])
        short = samples([nodes[1][1:], nodes[2][1:]], ways)
        self.assertEqual(short['0'], [[100, 0.0]])
        self.assertIsNone(short['25'])

    def test_reversed_other_line_or_multipart_arcgis_geometry_cannot_stand_in_for_218(self):
        path = [OID539[::-1], LSS[::-1]]
        def response(paths, oid=7, sr=4326):
            return {"spatialReference": {"wkid": sr}, "features": [{"attributes": {"OBJECTID_12": oid, "Nom_Ligne": "Ligne 218"}, "geometry": {"paths": paths}}]}
        self.assertEqual(arcgis_line(response([path])), [OID539, LSS])
        for source in (response([path[::-1]]), response([path, path]), response([path], 8), response([path], sr=32628), {}):
            with self.subTest(source=source), self.assertRaises(ValueError):
                arcgis_line(source)
