import unittest

from scripts.audit_aftu_waymark_road_alignment import (
    audit_route,
    build_grid,
    densify_line,
    nearest_road_segment,
    orient_line_to_markers,
    point_segment_distance,
    project,
)


class AftuWaymarkRoadAlignmentTests(unittest.TestCase):
    def test_point_to_segment_distance_is_measured_in_metres(self):
        distance_m, fraction = point_segment_distance((5, 1), (0, 0), (10, 0))
        self.assertAlmostEqual(distance_m, 1.0)
        self.assertAlmostEqual(fraction, 0.5)

    def test_densifies_long_route_segments(self):
        points = densify_line([[0, 0], [0.001, 0]], max_step_m=20)
        self.assertGreaterEqual(len(points), 6)
        self.assertEqual(points[0], project(0, 0))
        self.assertEqual(points[-1], project(0.001, 0))

    def test_orients_waymark_line_using_explicit_start_and_finish_markers(self):
        coords = [[0.001, 0], [0, 0]]
        oriented, status, start_gap, finish_gap = orient_line_to_markers(
            coords, [0, 0], [0.001, 0]
        )
        self.assertEqual(status, "REVERSED_TO_MATCH_MARKERS")
        self.assertEqual(oriented, [[0, 0], [0.001, 0]])
        self.assertEqual(start_gap, 0)
        self.assertEqual(finish_gap, 0)

    def test_grid_finds_nearest_drivable_road_segment(self):
        segment = {
            "id": 1,
            "a": project(0, 0),
            "b": project(0.001, 0),
            "oneway": "no",
        }
        grid = build_grid([segment])
        match = nearest_road_segment(project(0.0005, 0.00005), grid)
        self.assertIsNotNone(match)
        self.assertLess(match[0], 10)

    def test_route_geometry_is_candidate_when_aligned_and_markers_match(self):
        road = {
            "id": 1,
            "a": project(0, 0),
            "b": project(0.001, 0),
            "oneway": "yes",
        }
        grid = build_grid([road])
        route = {
            "line": "1",
            "publishedDate": "2026-05-18",
            "geojson": [{
                "type": "FeatureCollection",
                "features": [
                    {"type": "Feature", "properties": {"type": "start", "title": "Start"},
                     "geometry": {"type": "Point", "coordinates": [0, 0]}},
                    {"type": "Feature", "properties": {"type": "finish", "title": "Finish"},
                     "geometry": {"type": "Point", "coordinates": [0.001, 0]}},
                    {"type": "Feature", "properties": {"title": "Ligne 1"},
                     "geometry": {"type": "LineString", "coordinates": [[0, 0], [0.001, 0]]}},
                ],
            }],
        }
        result = audit_route(route, grid)
        self.assertTrue(result["roadAlignedCandidate"])
        self.assertTrue(result["directionalRoadCandidate"])
        self.assertEqual(result["orientationToMarkers"], "AS_DRAWN_MATCHES_MARKERS")
        self.assertEqual(result["roadCoverage"]["within20m"], 1.0)
        self.assertEqual(result["onewayConflicts"], 0)

    def test_route_against_one_way_direction_is_flagged(self):
        road = {
            "id": 1,
            "a": project(0, 0),
            "b": project(0.001, 0),
            "oneway": "yes",
        }
        grid = build_grid([road])
        route = {
            "line": "1",
            "geojson": [{
                "type": "FeatureCollection",
                "features": [
                    {"type": "Feature", "properties": {"type": "start"},
                     "geometry": {"type": "Point", "coordinates": [0.001, 0]}},
                    {"type": "Feature", "properties": {"type": "finish"},
                     "geometry": {"type": "Point", "coordinates": [0, 0]}},
                    {"type": "Feature", "properties": {},
                     "geometry": {"type": "LineString", "coordinates": [[0.001, 0], [0, 0]]}},
                ],
            }],
        }
        result = audit_route(route, grid)
        self.assertGreater(result["onewayConflicts"], 0)
        self.assertEqual(result["onewayConflictRate"], 1.0)
        self.assertTrue(result["roadAlignedCandidate"])
        self.assertFalse(result["directionalRoadCandidate"])


if __name__ == "__main__":
    unittest.main()
