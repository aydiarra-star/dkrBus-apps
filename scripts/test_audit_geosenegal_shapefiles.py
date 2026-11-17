#!/usr/bin/env python3
"""Regression tests for the read-only GéoSénégal archive inspector."""
from __future__ import annotations

import io
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

import shapefile

from audit_geosenegal_shapefiles import extract_nested_archives, inspect_shapefile, safe_extract


class GeosenegalArchiveInspectorTests(unittest.TestCase):
    def test_recursively_extracts_nested_archives(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            nested_bytes = io.BytesIO()
            with ZipFile(nested_bytes, "w") as nested:
                nested.writestr("layer/data.txt", "ok")
            outer = root / "outer.zip"
            with ZipFile(outer, "w") as archive:
                archive.writestr("inner.zip", nested_bytes.getvalue())
            audit = extract_nested_archives(root)
            self.assertEqual(len(audit), 2)
            self.assertEqual((root / "outer_contents" / "inner_contents" / "layer" / "data.txt").read_text(), "ok")

    def test_rejects_zip_path_traversal(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive = root / "bad.zip"
            with ZipFile(archive, "w") as zipped:
                zipped.writestr("../outside.txt", "not allowed")
            with self.assertRaises(ValueError):
                safe_extract(archive, root / "unpacked", root)
            self.assertFalse((root.parent / "outside.txt").exists())

    def test_multipart_length_does_not_join_disconnected_parts(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            shp_path = root / "multipart.shp"
            writer = shapefile.Writer(str(shp_path), shapeType=shapefile.POLYLINE)
            writer.field("id", "N")
            writer.line([[[0, 0], [1, 0]], [[100, 100], [101, 100]]])
            writer.record(1)
            writer.close()
            result = inspect_shapefile(shp_path, root)
            self.assertEqual(result["partCount"], 2)
            self.assertEqual(result["totalPartLengthSourceUnits"], 2.0)


if __name__ == "__main__":
    unittest.main()
