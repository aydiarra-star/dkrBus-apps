#!/usr/bin/env python3
"""Recursively inspect official GéoSénégal/ANAT road shapefile archives.

This is a read-only source audit. It does not publish or activate any geometry.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path, PurePosixPath
from zipfile import BadZipFile, ZipFile


def safe_extract(archive: Path, destination: Path, root: Path) -> int:
    extracted = 0
    root_resolved = root.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    with ZipFile(archive) as zipped:
        for info in zipped.infolist():
            if info.is_dir():
                continue
            member = PurePosixPath(info.filename)
            if member.is_absolute() or ".." in member.parts:
                raise ValueError(f"Unsafe ZIP member in {archive}: {info.filename}")
            if "__MACOSX" in member.parts or member.name.startswith("._"):
                continue
            target = (destination / Path(*member.parts)).resolve()
            if root_resolved not in target.parents and target != root_resolved:
                raise ValueError(f"ZIP member escapes extraction root: {info.filename}")
            target.parent.mkdir(parents=True, exist_ok=True)
            with zipped.open(info) as source, target.open("wb") as output:
                while chunk := source.read(1024 * 1024):
                    output.write(chunk)
            extracted += 1
    return extracted


def extract_nested_archives(root: Path) -> list[dict[str, object]]:
    processed: set[Path] = set()
    audit: list[dict[str, object]] = []
    while True:
        archives = sorted(
            path for path in root.rglob("*.zip")
            if "__MACOSX" not in path.parts and path.resolve() not in processed
        )
        if not archives:
            break
        for archive in archives:
            processed.add(archive.resolve())
            destination = archive.parent / f"{archive.stem}_contents"
            try:
                count = safe_extract(archive, destination, root)
                audit.append({
                    "archive": str(archive.relative_to(root)),
                    "extractedFiles": count,
                    "status": "extracted",
                })
            except (BadZipFile, OSError, ValueError) as error:
                audit.append({
                    "archive": str(archive.relative_to(root)),
                    "status": "error",
                    "error": str(error),
                })
    return audit


def inspect_shapefile(path: Path, root: Path) -> dict[str, object]:
    import shapefile

    reader = shapefile.Reader(str(path), encoding="latin1")
    feature_count = len(reader)
    empty = 0
    total_length = 0.0
    z_values: list[float] = []
    valid_geometries = 0

    for shape in reader.shapes():
        points = shape.points
        if len(points) < 2:
            empty += 1
            continue
        valid_geometries += 1
        for start, end in zip(points, points[1:]):
            total_length += math.hypot(end[0] - start[0], end[1] - start[1])
        for value in getattr(shape, "z", []) or []:
            if isinstance(value, (int, float)) and math.isfinite(value):
                z_values.append(float(value))

    prj_path = path.with_suffix(".prj")
    prj = prj_path.read_text(encoding="utf-8", errors="replace") if prj_path.exists() else None
    return {
        "file": str(path.relative_to(root)),
        "featureCount": feature_count,
        "validLineOrShapeCount": valid_geometries,
        "emptyOrSinglePointCount": empty,
        "shapeType": reader.shapeType,
        "bboxSourceCoordinates": list(reader.bbox) if reader.bbox else None,
        "totalLengthSourceUnits": round(total_length, 2),
        "zRange": [round(min(z_values), 3), round(max(z_values), 3)] if z_values else None,
        "fields": [field[0] for field in reader.fields[1:]],
        "projectionFile": str(prj_path.relative_to(root)) if prj else None,
        "projectionWkt": prj.strip() if prj else None,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    root = args.root.resolve()
    root.mkdir(parents=True, exist_ok=True)
    extraction = extract_nested_archives(root)

    try:
        import shapefile  # noqa: F401
    except ImportError as error:
        raise SystemExit("pyshp is required: python -m pip install pyshp") from error

    inventory = []
    for path in sorted(root.rglob("*.shp")):
        if "__MACOSX" in path.parts or path.name.startswith("._"):
            continue
        try:
            inventory.append(inspect_shapefile(path, root))
        except Exception as error:  # one malformed layer must not hide other evidence
            inventory.append({
                "file": str(path.relative_to(root)),
                "status": "error",
                "error": str(error),
            })

    payload = {
        "purpose": "read-only official ANAT/GéoSénégal source inspection; no passenger routing activation",
        "nestedArchives": extraction,
        "shapefileCount": len(inventory),
        "shapefiles": inventory,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "nestedArchives": len(extraction),
        "shapefiles": len(inventory),
        "successfulShapefiles": sum(1 for item in inventory if item.get("status") != "error"),
        "inventory": str(args.output),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
