import unittest

from extract_dakar_pedestrian_ways_from_pbf import inside_bounds, is_walkable


class PedestrianPbfFilterTests(unittest.TestCase):
    def test_keeps_walkable_ways_and_residential_access(self):
        self.assertTrue(is_walkable({"highway": "footway"}))
        self.assertTrue(is_walkable({"highway": "pedestrian"}))
        self.assertTrue(is_walkable({"highway": "residential"}))

    def test_rejects_private_and_motorway_access(self):
        self.assertFalse(is_walkable({"highway": "footway", "foot": "no"}))
        self.assertFalse(is_walkable({"highway": "footway", "foot:conditional": "no @ (Mo-Fr 08:00-18:00)"}))
        self.assertFalse(is_walkable({"highway": "footway", "foot:access": "no"}))
        self.assertTrue(is_walkable({"highway": "footway", "access": "private", "foot:access": "yes"}))
        self.assertFalse(is_walkable({"highway": "residential", "access": "private"}))
        self.assertFalse(is_walkable({"highway": "motorway"}))
        self.assertFalse(is_walkable({"highway": "trunk"}))

    def test_major_roads_need_a_mapped_sidewalk_or_explicit_foot_access(self):
        for highway in ("tertiary", "secondary", "primary", "trunk", "trunk_link"):
            self.assertFalse(is_walkable({"highway": highway}))
            self.assertTrue(is_walkable({"highway": highway, "sidewalk": "both"}))
            self.assertFalse(is_walkable({"highway": highway, "sidewalk": "no"}))
        self.assertTrue(is_walkable({"highway": "primary", "foot": "designated"}))
        self.assertFalse(is_walkable({"highway": "primary", "sidewalk": "separate"}))

    def test_dakar_extract_bounds_are_explicit(self):
        self.assertTrue(inside_bounds(14.70, -17.40))
        self.assertFalse(inside_bounds(14.20, -17.40))
        self.assertFalse(inside_bounds(14.70, -16.80))


if __name__ == "__main__":
    unittest.main()
