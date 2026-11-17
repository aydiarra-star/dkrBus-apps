import unittest

from extract_dakar_pedestrian_ways_from_pbf import inside_bounds, is_walkable


class PedestrianPbfFilterTests(unittest.TestCase):
    def test_keeps_only_dedicated_pedestrian_geometry(self):
        for highway in ("footway", "pedestrian", "path", "steps", "living_street"):
            self.assertTrue(is_walkable({"highway": highway}))
        for highway in ("residential", "service", "unclassified", "tertiary", "secondary", "primary", "trunk", "trunk_link", "motorway"):
            self.assertFalse(is_walkable({"highway": highway}))
            self.assertFalse(is_walkable({"highway": highway, "sidewalk": "both"}))
            self.assertFalse(is_walkable({"highway": highway, "foot": "designated"}))

    def test_rejects_private_and_conditional_foot_access(self):
        self.assertFalse(is_walkable({"highway": "footway", "foot": "no"}))
        self.assertFalse(is_walkable({"highway": "footway", "foot:conditional": "no @ (Mo-Fr 08:00-18:00)"}))
        self.assertFalse(is_walkable({"highway": "footway", "foot:access": "no"}))
        self.assertFalse(is_walkable({"highway": "footway", "foot": "yes", "foot:access": "no"}))
        self.assertFalse(is_walkable({"highway": "footway", "foot": "no", "foot:access": "yes"}))
        self.assertTrue(is_walkable({"highway": "footway", "access": "private", "foot:access": "yes"}))
        self.assertFalse(is_walkable({"highway": "footway", "access": "private"}))

    def test_dakar_extract_bounds_are_explicit(self):
        self.assertTrue(inside_bounds(14.70, -17.40))
        self.assertFalse(inside_bounds(14.20, -17.40))
        self.assertFalse(inside_bounds(14.70, -16.80))


if __name__ == "__main__":
    unittest.main()
