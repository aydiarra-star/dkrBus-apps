#!/usr/bin/env python3
"""Audit AFTU Waymark line geometries against the real OSM drivable-road graph."""
from __future__ import annotations

import argparse
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

DAKAR_BBOX = (-17.80, 14.35, -17.00, 15.10)
ROAD_TYPES = {
    "motorway", "motorway_link", "trunk", "trunk_link",
    "primary", "primary_link", "secondary", "secondary_link",
    "tertiary", "tertiary_link", "unclassified", "residential",
    "living_street", "service", "road", "busway",
}
EXCLUDED_SERVICE_TYPES = {"driveway", "parking_aisle", "emergency_access"}
METRES_PER_DEGREE = 111_320.0
REFERENCE_LATITUDE = 14.75
LONGITUDE_SCALE = math.cos(math.radians(REFERENCE_LATITUDE))
GRID_CELL_METERS = 100.0
MAX_SEARCH_RADIUS_METERS = 150.0


def project(lon: float, lat: float) -> tuple[float, float]:
    return (lon * METRES_PER_DEGREE * LONGITUDE_SCALE, lat * METRES_PER_DEGREE)


def distance(left: tuple[float, float], right: tuple[float, float]) -> float:
    return math.hypot(left[0] - right[0], left[1] - right[1])


def point_segment_distance(point, start, end) -> tuple[float, float]:
    dx, dy = end[0] - start[0], end[1] - start[1]
    length_squared = dx * dx + dy * dy
    if length_squared == 0:
        return distance(point, start), 0.0
    fraction = max(0.0, min(1.0, (
        (point[0] - start[0]) * dx + (point[1] - start[1]) * dy
    ) / length_squared))
    nearest = (start[0] + fraction * dx, start[1] + fraction * dy)
    return distance(point, nearest), fraction


def densify_line(coords: list[list[float]], max_step_m: float = 20.0):
    projected = [project(float(coord[0]), float(coord[1])) for coord in coords]
    if len(projected) < 2:
        return projected
    result = [projected[0]]
    for start, end in zip(projected, projected[1:]):
        length = distance(start, end)
        steps = max(1, math.ceil(length / max_step_m))
        for index in range(1, steps + 1):
            fraction = index / steps
            result.append((
                start[0] + (end[0] - start[0]) * fraction,
                start[1] + (end[1] - start[1]) * fraction,
            ))
    return result


def orient_line_to_markers(coords, start_marker, finish_marker):
    if len(coords) < 2 or not start_marker or not finish_marker:
        return coords, "UNRESOLVED_MARKERS", None, None
    start = project(float(start_marker[0]), float(start_marker[1]))
    finish = project(float(finish_marker[0]), float(finish_marker[1]))
    first = project(float(coords[0][0]), float(coords[0][1]))
    last = project(float(coords[-1][0]), float(coords[-1][1]))
    forward_cost = distance(first, start) + distance(last, finish)
    reverse_cost = distance(last, start) + distance(first, finish)
    if reverse_cost < forward_cost:
        oriented, orientation = list(reversed(coords)), "REVERSED_TO_MATCH_MARKERS"
    else:
        oriented, orientation = coords, "AS_DRAWN_MATCHES_MARKERS"
    start_gap = distance(project(*oriented[0]), start)
    finish_gap = distance(project(*oriented[-1]), finish)
    return oriented, orientation, round(start_gap, 1), round(finish_gap, 1)


def build_grid(segments: list[dict], cell_size: float = GRID_CELL_METERS) -> dict:
    grid = defaultdict(list)
    for segment in segments:
        ax, ay = segment["a"]
        bx, by = segment["b"]
        min_x = math.floor((min(ax, bx) - MAX_SEARCH_RADIUS_METERS) / cell_size)
        max_x = math.floor((max(ax, bx) + MAX_SEARCH_RADIUS_METERS) / cell_size)
        min_y = math.floor((min(ay, by) - MAX_SEARCH_RADIUS_METERS) / cell_size)
        max_y = math.floor((max(ay, by) + MAX_SEARCH_RADIUS_METERS) / cell_size)
        for cell_x in range(min_x, max_x + 1):
            for cell_y in range(min_y, max_y + 1):
                grid[(cell_x, cell_y)].append(segment)
    return grid


def nearest_road_segment(point, grid, cell_size: float = GRID_CELL_METERS):
    cell_x = math.floor(point[0] / cell_size)
    cell_y = math.floor(point[1] / cell_size)
    radius = math.ceil(MAX_SEARCH_RADIUS_METERS / cell_size)
    seen = set()
    best = None
    for dx in range(-radius, radius + 1):
        for dy in range(-radius, radius + 1):
            for segment in grid.get((cell_x + dx, cell_y + dy), []):
                segment_id = segment["id"]
                if segment_id in seen:
                    continue
                seen.add(segment_id)
                distance_m, _ = point_segment_distance(point, segment["a"], segment["b"])
                if best is None or distance_m < best[0]:
                    best = (distance_m, segment)
    return best


def percentile(values: list[float], fraction: float):
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, math.ceil(fraction * len(ordered)) - 1))
    return ordered[index]


def extract_road_segments(pbf_path: str) -> list[dict]:
    try:
        import osmium
    except ImportError as error:
        raise RuntimeError("Install pyosmium before running this audit") from error

    segments = []

    class RoadHandler(osmium.SimpleHandler):
        def way(self, way) -> None:
            tags = way.tags
            highway = tags.get("highway")
            if highway not in ROAD_TYPES:
                return
            if tags.get("access") in {"no", "private"}:
                return
            if tags.get("motor_vehicle") in {"no", "private"} or tags.get("bus") == "no":
                return
            if highway == "service" and tags.get("service") in EXCLUDED_SERVICE_TYPES:
                return

            nodes = []
            for node in way.nodes:
                if not node.location.valid():
                    nodes.append(None)
                else:
                    nodes.append((float(node.location.lon), float(node.location.lat)))

            for index, (left, right) in enumerate(zip(nodes, nodes[1:])):
                if left is None or right is None:
                    continue
                lon1, lat1 = left
                lon2, lat2 = right
                if (
                    max(lon1, lon2) < DAKAR_BBOX[0]
                    or min(lon1, lon2) > DAKAR_BBOX[2]
                    or max(lat1, lat2) < DAKAR_BBOX[1]
                    or min(lat1, lat2) > DAKAR_BBOX[3]
                ):
                    continue
                a, b = project(lon1, lat1), project(lon2, lat2)
                if distance(a, b) < 0.5:
                    continue
                segments.append({
                    "id": len(segments),
                    "wayId": int(way.id),
                    "segmentIndex": index,
                    "a": a,
                    "b": b,
                    "name": tags.get("name"),
                    "ref": tags.get("ref"),
                    "highway": highway,
                    "oneway": tags.get("oneway", "no"),
                })

    RoadHandler().apply_file(pbf_path, locations=True)
    return segments


def route_features(route: dict):
    line_features = []
    start_marker = None
    finish_marker = None
    for payload in route.get("geojson") or []:
        for feature in payload.get("features") or []:
            geometry = feature.get("geometry") or {}
            properties = feature.get("properties") or {}
            if geometry.get("type") == "LineString":
                line_features.append(feature)
            elif geometry.get("type") == "MultiLineString":
                for line in geometry.get("coordinates") or []:
                    line_features.append({
                        "type": "Feature",
                        "properties": properties,
                        "geometry": {"type": "LineString", "coordinates": line},
                    })
            elif geometry.get("type") == "Point":
                marker_type = str(properties.get("type") or "").lower()
                if marker_type == "start":
                    start_marker = geometry.get("coordinates")
                elif marker_type == "finish":
                    finish_marker = geometry.get("coordinates")
    return line_features, start_marker, finish_marker


def audit_route(route: dict, grid: dict) -> dict:
    line_features, start_marker, finish_marker = route_features(route)
    if not line_features:
        return {
            "line": route.get("line"),
            "publishedDate": route.get("publishedDate"),
            "hasLineGeometry": False,
            "roadAlignedCandidate": False,
            "reason": "NO_LINESTRING_GEOMETRY",
        }

    line_feature = line_features[0]
    coords = line_feature.get("geometry", {}).get("coordinates") or []
    oriented_coords, orientation, start_gap, finish_gap = orient_line_to_markers(
        coords, start_marker, finish_marker
    )
    samples = densify_line(oriented_coords)
    nearest_matches = [nearest_road_segment(point, grid) for point in samples]
    distances = [match[0] for match in nearest_matches if match is not None]
    within = {
        str(threshold): sum(value <= threshold for value in distances)
        for threshold in (10, 15, 20, 30, 50)
    }
    coverage = {
        threshold: round(count / max(1, len(samples)), 3)
        for threshold, count in within.items()
    }

    oneway_checked = 0
    oneway_conflicts = 0
    for left, right in zip(samples, samples[1:]):
        midpoint = ((left[0] + right[0]) / 2, (left[1] + right[1]) / 2)
        match = nearest_road_segment(midpoint, grid)
        if match is None or match[0] > 20:
            continue
        segment = match[1]
        oneway = str(segment.get("oneway") or "no").lower()
        if oneway not in {"yes", "1", "true", "-1"}:
            continue
        route_dx, route_dy = right[0] - left[0], right[1] - left[1]
        road_dx = segment["b"][0] - segment["a"][0]
        road_dy = segment["b"][1] - segment["a"][1]
        dot = route_dx * road_dx + route_dy * road_dy
        oneway_checked += 1
        if (oneway == "-1" and dot > 0) or (oneway != "-1" and dot < 0):
            oneway_conflicts += 1

    ordered = sorted(distances)
    median = ordered[len(ordered) // 2] if ordered else None
    p95 = percentile(distances, 0.95)
    maximum = max(distances) if distances else None
    conflict_rate = round(oneway_conflicts / oneway_checked, 3) if oneway_checked else None
    markers_ok = bool(
        start_gap is not None and finish_gap is not None
        and start_gap <= 50 and finish_gap <= 50
    )
    road_aligned = bool(
        coverage["20"] >= 0.90
        and coverage["30"] >= 0.95
        and p95 is not None and p95 <= 35
        and maximum is not None and maximum <= 100
        and markers_ok
        and (conflict_rate is None or conflict_rate <= 0.10)
    )
    return {
        "line": route.get("line"),
        "publishedDate": route.get("publishedDate"),
        "pageUrl": route.get("url"),
        "mapId": route.get("mapId"),
        "itineraryText": route.get("itineraryText"),
        "lineGeometryFeatureCount": len(line_features),
        "geometryPointCount": len(coords),
        "sampleCount": len(samples),
        "orientationToMarkers": orientation,
        "startMarkerGapMeters": start_gap,
        "finishMarkerGapMeters": finish_gap,
        "roadCoverage": {
            "within10m": coverage["10"],
            "within15m": coverage["15"],
            "within20m": coverage["20"],
            "within30m": coverage["30"],
            "within50m": coverage["50"],
        },
        "nearestRoadDistanceMeters": {
            "median": round(median, 1) if median is not None else None,
            "p95": round(p95, 1) if p95 is not None else None,
            "maximum": round(maximum, 1) if maximum is not None else None,
        },
        "onewaySegmentsChecked": oneway_checked,
        "onewayConflicts": oneway_conflicts,
        "onewayConflictRate": conflict_rate,
        "roadAlignedCandidate": road_aligned,
        "activationStatus": "NOT_ACTIVATED_AUDIT_ONLY",
    }


def build_report(aftu: dict, road_segments: list[dict], pbf_path: str) -> dict:
    grid = build_grid(road_segments)
    route_results = [audit_route(route, grid) for route in aftu.get("routes") or []]
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sources": {
            "aftuIndex": (aftu.get("source") or {}).get("indexUrl"),
            "osmPbf": pbf_path,
            "osmAttribution": "© OpenStreetMap contributors, ODbL 1.0",
        },
        "method": (
            "Each AFTU Waymark LineString is oriented to its explicit start/finish "
            "markers, densified at 20 m, then sampled against the nearest drivable "
            "OSM road segment. One-way conflicts are checked against OSM oneway tags. "
            "This is a geometry audit only; it does not create a reverse route."
        ),
        "thresholds": {
            "coverageWithin20m": 0.90,
            "coverageWithin30m": 0.95,
            "p95RoadDistanceMetersMax": 35,
            "maximumRoadDistanceMetersMax": 100,
            "maximumTerminalMarkerGapMeters": 50,
            "maximumOneWayConflictRate": 0.10,
        },
        "summary": {
            "aftuRoutes": len(route_results),
            "routesWithLineGeometry": sum(row.get("lineGeometryFeatureCount", 0) > 0 for row in route_results),
            "routesWithBothTerminalMarkers": sum(
                row.get("startMarkerGapMeters") is not None
                and row.get("finishMarkerGapMeters") is not None
                for row in route_results
            ),
            "routesRoadAlignedCandidates": sum(row.get("roadAlignedCandidate", False) for row in route_results),
            "routesWithOneWayConflicts": sum(row.get("onewayConflicts", 0) > 0 for row in route_results),
            "osmDrivableRoadSegments": len(road_segments),
        },
        "routes": route_results,
        "warning": (
            "AFTU Waymark pages provide one mapped line geometry per route, not a "
            "verified return geometry or complete intermediate stop sequence. "
            "No return path is inferred by reversing the line."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pbf", required=True)
    parser.add_argument("--aftu-json", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    aftu = json.loads(Path(args.aftu_json).read_text(encoding="utf-8"))
    roads = extract_road_segments(args.pbf)
    if not roads:
        raise SystemExit("No drivable OSM road segments found in the Dakar bounding box")
    report = build_report(aftu, roads, args.pbf)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False))
    return 0 if report["summary"]["routesWithLineGeometry"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
