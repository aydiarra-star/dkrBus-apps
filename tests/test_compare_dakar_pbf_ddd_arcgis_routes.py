import unittest

from scripts.compare_dakar_pbf_ddd_arcgis_routes import (
    best_route_geometry_match,
    classify_direction_pairs,
    monotonicity,
    nearest_arcgis_stop_audit,
    parse_line_ref,
    parse_relation_endpoints,
    project_stop_to_path,
)


class DddOsmArcgisDirectionalCrosswalkTests(unittest.TestCase):
    def test_parses_single_line_refs_and_rejects_ambiguous_multi_refs(self):
        self.assertEqual(parse_line_ref("L 23"), "23")
        self.assertEqual(parse_line_ref("121"), "121")
        self.assertIsNone(parse_line_ref("L23;L5"))
        self.assertIsNone(parse_line_ref(""))

    def test_parses_explicit_reversed_route_endpoints(self):
        relation = {"tags": {"name": "10 Palais - Liberté"}}
        self.assertEqual(parse_relation_endpoints(relation), ("palais", "liberte"))

    def test_monotonicity_detects_both_directions_and_mixed_order(self):
        self.assertEqual(monotonicity([0, 100, 200])["orientation"], "INCREASING")
        self.assertEqual(monotonicity([200, 100, 0])["orientation"], "DECREASING")
        self.assertEqual(monotonicity([0, 100, 50])["orientation"], "MIXED")

    def test_stop_projects_to_the_real_path_without_a_straight_line_fallback(self):
        path = [[-17.45, 14.70], [-17.44, 14.70], [-17.43, 14.70]]
        projection = project_stop_to_path({"lat": 14.70, "lon": -17.445}, path)
        self.assertIsNotNone(projection)
        self.assertLess(projection["distanceMeters"], 0.1)
        self.assertGreater(projection["chainageMeters"], 0)

    def test_geometry_match_requires_stop_sequence_coverage_and_monotonic_order(self):
        relation = {
            "stopsInRelationOrder": [
                {"id": 1, "memberOrder": 0, "lat": 14.70, "lon": -17.45, "tags": {"name": "A"}},
                {"id": 2, "memberOrder": 1, "lat": 14.70, "lon": -17.44, "tags": {"name": "B"}},
                {"id": 3, "memberOrder": 2, "lat": 14.70, "lon": -17.43, "tags": {"name": "C"}},
            ]
        }
        route_layer = {
            "layerId": 17,
            "layerName": "Ligne 1",
            "features": [{
                "attributes": {"OBJECTID": 7, "Nom_Ligne": "Ligne 1"},
                "geometry": {"paths": [[[-17.45, 14.70], [-17.44, 14.70], [-17.43, 14.70]]]},
            }],
        }
        match = best_route_geometry_match(relation, route_layer)
        self.assertIsNotNone(match)
        self.assertEqual(match["stopWithin50m"], 3)
        self.assertEqual(match["orientation"], "INCREASING")
        self.assertEqual(match["routeFeatureObjectId"], 7)

    def test_direction_pair_requires_exact_reversed_endpoints_and_both_candidates(self):
        rows = [
            {
                "line": "10", "relationId": 1, "name": "10 Palais - Liberté",
                "from": "palais", "to": "liberte",
                "geometryCandidate": True, "stopLayerCandidate": True, "directionCandidate": True,
            },
            {
                "line": "10", "relationId": 2, "name": "10 Liberté - Palais",
                "from": "liberte", "to": "palais",
                "geometryCandidate": True, "stopLayerCandidate": True, "directionCandidate": True,
            },
        ]
        pair = classify_direction_pairs(rows)[0]
        self.assertEqual(pair["explicitReversePairs"], 1)
        self.assertTrue(pair["bidirectionalGeometryAndStopsCandidate"])

    def test_unverified_return_direction_never_becomes_a_bidirectional_candidate(self):
        rows = [
            {
                "line": "9", "relationId": 1, "from": "palais", "to": "liberte",
                "geometryCandidate": True, "stopLayerCandidate": True, "directionCandidate": True,
            },
            {
                "line": "9", "relationId": 2, "from": "liberte", "to": "palais",
                "geometryCandidate": False, "stopLayerCandidate": False, "directionCandidate": False,
            },
        ]
        pair = classify_direction_pairs(rows)[0]
        self.assertEqual(pair["explicitReversePairs"], 1)
        self.assertFalse(pair["bidirectionalGeometryAndStopsCandidate"])

    def test_missing_arcgis_stop_coordinates_are_ignored_without_crashing(self):
        audit = nearest_arcgis_stop_audit(
            {"stopsInRelationOrder": [{"id": 1, "lat": None, "lon": None, "tags": {}}]},
            {"features": [{"attributes": {"OBJECTID": 1}, "geometry": {"x": None, "y": None}}]},
        )
        self.assertEqual(audit["osmStopComparedCount"], 0)
        self.assertEqual(audit["nearestWithin50m"], 0)


if __name__ == "__main__":
    unittest.main()
