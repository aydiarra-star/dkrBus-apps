#!/usr/bin/env python3
"""Read-only extraction of walkable OSM ways from a Geofabrik PBF."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

WALKABLE = {
    "footway", "pedestrian", "path", "steps", "living_street",
    "residential", "service", "unclassified", "tertiary",
    "secondary", "primary", "trunk", "trunk_link",
}
MAJOR_ROADS = {"tertiary", "secondary", "primary", "trunk", "trunk_link"}
MOTOR_ONLY = {"motorway", "motorway_link"}
BOUNDS = {"south": 14.50, "west": -17.60, "north": 14.95, "east": -17.05}


def is_walkable(tags: dict[str, str]) -> bool:
    highway = str(tags.get("highway", ""))
    if highway not in WALKABLE or highway in MOTOR_ONLY:
        return False
    foot = str(tags.get("foot") or tags.get("foot:access") or "").lower()
    access = str(tags.get("access", "")).lower()
    if tags.get("foot:conditional"):
        return False
    if foot in {"no", "private"}:
        return False
    if access in {"no", "private"} and foot not in {"yes", "designated", "permissive", "destination"}:
        return False
    sidewalk = str(tags.get("sidewalk", "")).lower()
    has_sidewalk = sidewalk in {"yes", "both", "left", "right"} or any(
        str(tags.get(key, "")).lower() in {"yes", "designated"}
        for key in ("sidewalk:left", "sidewalk:right")
    )
    if highway in MAJOR_ROADS and not has_sidewalk and foot not in {"yes", "designated", "permissive"}:
        return False
    if highway == "service" and str(tags.get("service", "")) in {"driveway", "parking_aisle", "private"} and foot not in {"yes", "designated", "permissive"}:
        return False
    return True


def inside_bounds(lat: float, lon: float) -> bool:
    return BOUNDS["south"] <= lat <= BOUNDS["north"] and BOUNDS["west"] <= lon <= BOUNDS["east"]


def extract_pedestrian_ways(pbf_path: str) -> dict:
    try:
        import osmium
    except ImportError as exc:
        raise RuntimeError("Le module Python pyosmium est requis (pip install osmium).") from exc

    class Handler(osmium.SimpleHandler):
        def __init__(self):
            super().__init__()
            self.elements = []
            self.node_elements = []
            self.skipped = 0

        def node(self, node):
            tags = {tag.k: tag.v for tag in node.tags}
            if not any(key in tags for key in ('barrier', 'access', 'foot', 'foot:access', 'foot:conditional', 'highway', 'crossing')):
                return
            if not node.location.valid():
                return
            self.node_elements.append({'type': 'node', 'id': int(node.id), 'lat': float(node.location.lat), 'lon': float(node.location.lon), 'tags': tags})

        def way(self, way):
            tags = {tag.k: tag.v for tag in way.tags}
            if not is_walkable(tags):
                return
            refs = []
            geometry = []
            for node in way.nodes:
                if not node.location.valid():
                    self.skipped += 1
                    return
                lat = float(node.location.lat)
                lon = float(node.location.lon)
                refs.append(int(node.ref))
                geometry.append({"lat": lat, "lon": lon})
            if len(refs) < 2 or len(refs) != len(geometry):
                self.skipped += 1
                return
            if not any(inside_bounds(point["lat"], point["lon"]) for point in geometry):
                return
            self.elements.append({
                "type": "way",
                "id": int(way.id),
                "nodes": refs,
                "tags": tags,
                "geometry": geometry,
            })

    handler = Handler()
    handler.apply_file(pbf_path, locations=True)
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "endpoint": "Geofabrik Senegal and Gambia OSM PBF",
        "sourceUrl": "https://download.geofabrik.de/africa/senegal-and-gambia-latest.osm.pbf",
        "attribution": "© OpenStreetMap contributors",
        "license": "ODbL-1.0",
        "geographicBounds": BOUNDS,
        "elements": handler.elements + handler.node_elements,
        "summary": {
            "walkableWayCount": len(handler.elements),
            "taggedNodeCount": len(handler.node_elements),
            "skippedWays": handler.skipped,
        },
    }


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: extract_dakar_pedestrian_ways_from_pbf.py INPUT.osm.pbf OUTPUT.json", file=sys.stderr)
        return 2
    report = extract_pedestrian_ways(sys.argv[1])
    output = Path(sys.argv[2])
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
