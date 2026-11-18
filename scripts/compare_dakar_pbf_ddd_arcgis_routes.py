#!/usr/bin/env python3
"""Read-only crosswalk between Dakar OSM route relations and DDD ArcGIS layers.

The report is diagnostic only. It never activates a line, invents a reverse
path, joins disconnected route parts, or modifies passenger data.
"""
from __future__ import annotations

import json
import math
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

STOP_LAYER_BY_LINE = {
    "1": 5, "6": 1, "7": 2, "8": 3, "9": 4, "10": 6,
    "121": 7, "13": 8, "18": 9, "23": 10, "4": 11,
}
REFERENCE_LATITUDE = 14.75
METRES_PER_DEGREE = 111_320.0
LONGITUDE_SCALE = math.cos(math.radians(REFERENCE_LATITUDE))


def normalize_text(value: object) -> str:
    text = unicodedata.normalize("NFD", str(value or "").lower())
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def normalize_endpoint(value: object) -> str:
    text = normalize_text(value)
    text = re.sub(r"^(?:terminus|termibus|gare|arret|station|place)\s+", "", text)
    # Collapse spaces between place names and route-terminal numbers.
    return re.sub(r"\s+", "", text)


OFFICIAL_TERMINI = {
    "1": ("parcellesassainies", "leclerc"),
    "4": ("liberte5", "leclerc"),
    "7": ("ouakam", "palais2"),
    "8": ("aeroportlss", "palais2"),
    "9": ("liberte6", "palais2"),
    "10": ("liberte5", "palais2"),
    "13": ("liberte5", "palais2"),
    "18": ("dieuppeul", "centreville"),
    "20": ("dieuppeul", "centreville"),
    "23": ("parcellesassainies", "palais1"),
    "121": ("scaturbam", "leclerc"),
}
OFFICIAL_TERMINI_SOURCE = "https://demdikk.sn/reseau-urbain-dakar/"
OFFICIAL_TERMINI_CHECKED_AT = "2026-11-18"


def parse_line_ref(value: object) -> str | None:
    raw = str(value or "").strip().upper().replace(" ", "")
    if not raw:
        return None
    if ";" in raw or "," in raw or "/" in raw:
        return None
    raw = re.sub(r"^L", "", raw)
    return raw if re.fullmatch(r"\d{1,3}[A-Z]?", raw) else None


def parse_name_line_ref(value: object) -> str | None:
    raw = str(value or "").strip()
    if re.match(r"^\s*(?:L\s*)?\d{1,3}[A-Z]?\s*[;,/]", raw, re.IGNORECASE):
        return None
    match = re.match(r"^\s*(?:Ligne\s*|L\s*)?(\d{1,3}[A-Z]?)\b", raw, re.IGNORECASE)
    return match.group(1).upper() if match else None


def relation_line_ref_details(relation: dict) -> tuple[str | None, str | None]:
    tags = relation.get("tags") or {}
    raw_ref = tags.get("ref")
    ref_line = parse_line_ref(raw_ref)
    name_line = parse_name_line_ref(tags.get("name"))
    if raw_ref and not ref_line:
        return None, "AMBIGUOUS_OR_MULTILINE_REF"
    if ref_line and name_line and ref_line != name_line:
        return None, "REF_NAME_LINE_MISMATCH"
    return ref_line or name_line, None if (ref_line or name_line) else "NO_UNAMBIGUOUS_LINE_REF"


def relation_line_ref(relation: dict) -> str | None:
    return relation_line_ref_details(relation)[0]


def parse_arcgis_layer_line_ref(layer_name: object) -> str | None:
    normalized = normalize_text(layer_name)
    match = re.search(r"\bligne\s+(\d{1,3}[a-z]?)\b", normalized)
    return match.group(1).upper() if match else None


def parse_relation_endpoints(relation: dict) -> tuple[str | None, str | None]:
    tags = relation.get("tags") or {}
    start = tags.get("from")
    end = tags.get("to")
    if start and end:
        return normalize_endpoint(start), normalize_endpoint(end)
    name = str(tags.get("name") or "")
    match = re.match(r"^\s*(?:L\s*)?\d{1,3}[A-Z]?\s+(.+?)\s*(?:-|–|—|→|↔)\s*(.+?)\s*$", name, re.IGNORECASE)
    if not match:
        return None, None
    return normalize_endpoint(match.group(1)), normalize_endpoint(match.group(2))


def is_ddd_relation(relation: dict) -> bool:
    tags = relation.get("tags") or {}
    attribution = " ".join(str(tags.get(key) or "") for key in ("operator", "network", "name")).lower()
    if "dakar dem dikk" in attribution or re.search(r"\bddd\b", attribution):
        return True
    stops = relation.get("stopsInRelationOrder") or []
    attributed = 0
    for stop in stops:
        stop_tags = stop.get("tags") or {}
        stop_attribution = " ".join(str(stop_tags.get(key) or "") for key in ("operator", "network")).lower()
        if "dakar dem dikk" in stop_attribution or re.search(r"\bddd\b", stop_attribution):
            attributed += 1
    return bool(stops) and attributed >= max(3, math.ceil(len(stops) * 0.7))


def project_dakar(lon: float, lat: float) -> tuple[float, float]:
    return (
        lon * METRES_PER_DEGREE * LONGITUDE_SCALE,
        lat * METRES_PER_DEGREE,
    )


def point_segment_distance(point: tuple[float, float], start: tuple[float, float], end: tuple[float, float]) -> tuple[float, float]:
    dx, dy = end[0] - start[0], end[1] - start[1]
    length_squared = dx * dx + dy * dy
    if length_squared == 0:
        return math.hypot(point[0] - start[0], point[1] - start[1]), 0.0
    fraction = max(0.0, min(1.0, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length_squared))
    projected = (start[0] + fraction * dx, start[1] + fraction * dy)
    return math.hypot(point[0] - projected[0], point[1] - projected[1]), fraction


def project_stop_to_path(stop: dict, path: list[list[float]]) -> dict | None:
    if not isinstance(path, list) or len(path) < 2:
        return None
    try:
        latitude = float(stop["lat"])
        longitude = float(stop["lon"])
    except (KeyError, TypeError, ValueError):
        return None
    if not math.isfinite(latitude) or not math.isfinite(longitude):
        return None
    point = project_dakar(longitude, latitude)
    projected_path = [project_dakar(float(coord[0]), float(coord[1])) for coord in path]
    chainage = 0.0
    best = None
    for index in range(1, len(projected_path)):
        start, end = projected_path[index - 1], projected_path[index]
        segment_length = math.hypot(end[0] - start[0], end[1] - start[1])
        distance, fraction = point_segment_distance(point, start, end)
        candidate = {
            "distanceMeters": distance,
            "chainageMeters": chainage + fraction * segment_length,
            "segmentIndex": index - 1,
        }
        if best is None or candidate["distanceMeters"] < best["distanceMeters"]:
            best = candidate
        chainage += segment_length
    return best


def monotonicity(values: list[float], tolerance_m: float = 5.0) -> dict:
    increasing = decreasing = flat = 0
    for left, right in zip(values, values[1:]):
        delta = right - left
        if delta > tolerance_m:
            increasing += 1
        elif delta < -tolerance_m:
            decreasing += 1
        else:
            flat += 1
    transitions = increasing + decreasing + flat
    directional = increasing + decreasing
    if not directional:
        orientation = "UNRESOLVED"
        score = 0.0
    elif increasing > decreasing:
        orientation = "INCREASING"
        score = increasing / max(1, directional)
    elif decreasing > increasing:
        orientation = "DECREASING"
        score = decreasing / max(1, directional)
    else:
        orientation = "MIXED"
        score = 0.5
    return {
        "orientation": orientation,
        "monotonicityScore": round(score, 3),
        "increasingTransitions": increasing,
        "decreasingTransitions": decreasing,
        "flatTransitions": flat,
        "transitions": transitions,
    }


def _feature_paths(feature: dict) -> list[list[list[float]]]:
    geometry = feature.get("geometry") or {}
    paths = geometry.get("paths")
    if not isinstance(paths, list):
        return []
    return [path for path in paths if isinstance(path, list) and len(path) >= 2]


def evaluate_route_path(stops: list[dict], path: list[list[float]], feature: dict, path_index: int) -> dict | None:
    projections = []
    for index, stop in enumerate(stops):
        projection = project_stop_to_path(stop, path)
        if projection is None:
            continue
        projections.append({
            "stopSequence": stop.get("memberOrder", index + 1),
            "stopId": stop.get("id"),
            "stopName": (stop.get("tags") or {}).get("name"),
            **projection,
        })
    if not projections:
        return None
    distances = [item["distanceMeters"] for item in projections]
    within25 = sum(distance <= 25 for distance in distances)
    within50 = sum(distance <= 50 for distance in distances)
    within100 = sum(distance <= 100 for distance in distances)
    eligible = [item for item in projections if item["distanceMeters"] <= 100]
    ordered = sorted(eligible, key=lambda item: item["stopSequence"])
    monotone = monotonicity([item["chainageMeters"] for item in ordered])
    sorted_distances = sorted(distances)
    median = sorted_distances[len(sorted_distances) // 2]
    return {
        "routeFeatureObjectId": (feature.get("attributes") or {}).get("OBJECTID"),
        "routeFeatureName": (feature.get("attributes") or {}).get("Nom_Ligne"),
        "routeFeatureDescription": (feature.get("attributes") or {}).get("Itinérair"),
        "pathIndex": path_index,
        "pathPointCount": len(path),
        "stopProjectionCount": len(projections),
        "stopWithin25m": within25,
        "stopWithin50m": within50,
        "stopWithin100m": within100,
        "coverageWithin50m": round(within50 / len(stops), 3) if stops else 0.0,
        "medianDistanceMeters": round(median, 1),
        "maximumDistanceMeters": round(max(distances), 1),
        **monotone,
        "stopProjections": projections,
    }


def best_route_geometry_match(relation: dict, route_layer: dict | None) -> dict | None:
    if not route_layer:
        return None
    stops = relation.get("stopsInRelationOrder") or []
    candidates = []
    for feature in route_layer.get("features") or []:
        for path_index, path in enumerate(_feature_paths(feature)):
            candidate = evaluate_route_path(stops, path, feature, path_index)
            if candidate:
                candidates.append(candidate)
    if not candidates:
        return None
    candidates.sort(key=lambda item: (
        -item["stopWithin50m"],
        -item["monotonicityScore"],
        item["medianDistanceMeters"],
        item["maximumDistanceMeters"],
    ))
    return candidates[0]


def nearest_arcgis_stop_audit(relation: dict, stop_layer: dict | None) -> dict:
    arcgis_stops = []
    for feature in (stop_layer or {}).get("features") or []:
        geometry = feature.get("geometry") or {}
        try:
            longitude = float(geometry["x"])
            latitude = float(geometry["y"])
        except (KeyError, TypeError, ValueError):
            continue
        if not math.isfinite(longitude) or not math.isfinite(latitude):
            continue
        arcgis_stops.append({
            "objectId": (feature.get("attributes") or {}).get("OBJECTID"),
            "name": (feature.get("attributes") or {}).get("Nom_Arret"),
            "point": project_dakar(longitude, latitude),
        })
    matches = []
    for stop in relation.get("stopsInRelationOrder") or []:
        if stop.get("lat") is None or stop.get("lon") is None or not arcgis_stops:
            continue
        point = project_dakar(float(stop["lon"]), float(stop["lat"]))
        distances = sorted(
            [
                (math.hypot(point[0] - item["point"][0], point[1] - item["point"][1]), item)
                for item in arcgis_stops
            ],
            key=lambda pair: pair[0],
        )
        distance, nearest = distances[0]
        second_distance = distances[1][0] if len(distances) > 1 else None
        matches.append({
            "osmStopId": stop.get("id"),
            "osmStopName": (stop.get("tags") or {}).get("name"),
            "nearestArcgisObjectId": nearest["objectId"],
            "nearestArcgisStopName": nearest["name"],
            "distanceMeters": round(distance, 1),
            "uniqueWithin5mMargin": second_distance is None or second_distance - distance > 5,
        })
    distances = [item["distanceMeters"] for item in matches]
    return {
        "arcgisStopFeatureCount": len(arcgis_stops),
        "osmStopComparedCount": len(matches),
        "nearestWithin25m": sum(distance <= 25 for distance in distances),
        "nearestWithin50m": sum(distance <= 50 for distance in distances),
        "nearestWithin100m": sum(distance <= 100 for distance in distances),
        "uniqueNearestWithin25m": sum(item["distanceMeters"] <= 25 and item["uniqueWithin5mMargin"] for item in matches),
        "matches": matches,
    }


def relation_direction_candidate(relation: dict, route_layer: dict | None, stop_layer: dict | None) -> dict:
    line = relation_line_ref(relation)
    start, end = parse_relation_endpoints(relation)
    stops = relation.get("stopsInRelationOrder") or []
    geometry_match = best_route_geometry_match(relation, route_layer)
    stop_match = nearest_arcgis_stop_audit(relation, stop_layer)
    route_layer_mapping_verified = bool(
        route_layer and parse_arcgis_layer_line_ref(route_layer.get("layerName")) == line
    )
    stop_layer_mapping_verified = bool(
        stop_layer and parse_arcgis_layer_line_ref(stop_layer.get("layerName")) == line
    )
    geometry_ok = bool(
        route_layer_mapping_verified
        and geometry_match
        and geometry_match["coverageWithin50m"] >= 0.9
        and geometry_match["monotonicityScore"] >= 0.9
        and geometry_match["medianDistanceMeters"] <= 25
        and geometry_match["maximumDistanceMeters"] <= 100
        and len(stops) >= 8
    )
    stops_ok = bool(
        stop_layer_mapping_verified
        and stop_match["osmStopComparedCount"] >= 8
        and stop_match["nearestWithin50m"] / max(1, stop_match["osmStopComparedCount"]) >= 0.8
        and stop_match["uniqueNearestWithin25m"] / max(1, stop_match["osmStopComparedCount"]) >= 0.5
    )
    official_termini = OFFICIAL_TERMINI.get(line)
    official_termini_match = bool(
        official_termini and start and end and {start, end} == set(official_termini)
    )
    return {
        "relationId": relation.get("id"),
        "line": line,
        "name": (relation.get("tags") or {}).get("name"),
        "from": start,
        "to": end,
        "officialTermini": list(official_termini) if official_termini else None,
        "officialTerminiMatch": official_termini_match,
        "osmStopCount": len(stops),
        "routeLayerId": (route_layer or {}).get("layerId"),
        "routeLayerName": (route_layer or {}).get("layerName"),
        "stopLayerId": (stop_layer or {}).get("layerId"),
        "stopLayerName": (stop_layer or {}).get("layerName"),
        "routeLayerMappingVerified": route_layer_mapping_verified,
        "stopLayerMappingVerified": stop_layer_mapping_verified,
        "geometryMatch": geometry_match,
        "stopLayerMatch": stop_match,
        "geometryCandidate": geometry_ok,
        "geometryDirectionCandidate": geometry_ok,
        "stopLayerCandidate": stops_ok,
        "directionCandidate": geometry_ok and stops_ok,
        "activationStatus": "NOT_ACTIVATED_AUDIT_ONLY",
    }


def classify_direction_pairs(direction_rows: list[dict]) -> list[dict]:
    by_line: dict[str, list[dict]] = defaultdict(list)
    for row in direction_rows:
        if row.get("line"):
            by_line[row["line"]].append(row)
    results = []
    for line, rows in sorted(by_line.items(), key=lambda item: item[0]):
        pairs = []
        used = set()
        for index, left in enumerate(rows):
            if index in used or not left.get("from") or not left.get("to"):
                continue
            for other_index in range(index + 1, len(rows)):
                right = rows[other_index]
                if other_index in used:
                    continue
                if left["from"] == right.get("to") and left["to"] == right.get("from"):
                    pairs.append({
                        "outboundRelationId": left["relationId"],
                        "outboundName": left["name"],
                        "outboundGeometryCandidate": left["geometryCandidate"],
                        "outboundStopLayerCandidate": left["stopLayerCandidate"],
                        "returnRelationId": right["relationId"],
                        "returnName": right["name"],
                        "returnGeometryCandidate": right["geometryCandidate"],
                        "returnStopLayerCandidate": right["stopLayerCandidate"],
                        "bidirectionalGeometryCandidate": left["geometryCandidate"] and right["geometryCandidate"],
                        "bidirectionalStopLayerCandidate": left["stopLayerCandidate"] and right["stopLayerCandidate"],
                        "bidirectionalOfficialTerminiMatch": left["officialTerminiMatch"] and right["officialTerminiMatch"],
                        "bidirectionalCandidate": left["directionCandidate"] and right["directionCandidate"],
                    })
                    used.update({index, other_index})
                    break
        results.append({
            "line": line,
            "relationCount": len(rows),
            "explicitReversePairs": len(pairs),
            "bidirectionalGeometryCandidate": any(pair["bidirectionalGeometryCandidate"] for pair in pairs),
            "bidirectionalStopLayerCandidate": any(pair["bidirectionalStopLayerCandidate"] for pair in pairs),
            "bidirectionalGeometryAndStopsCandidate": any(pair["bidirectionalCandidate"] for pair in pairs),
            "bidirectionalOfficialTerminiMatch": any(pair["bidirectionalOfficialTerminiMatch"] for pair in pairs),
            "pairs": pairs,
            "unpairedRelations": [row["relationId"] for index, row in enumerate(rows) if index not in used],
        })
    return results


def build_report(osm: dict, arcgis: dict) -> dict:
    layers = arcgis.get("layers") or []
    layer_by_id = {(layer.get("group"), layer.get("layerId")): layer for layer in layers}
    route_layers_by_line = {}
    for layer in layers:
        if layer.get("group") != "urban_routes_and_stops" or layer.get("kind") != "route":
            continue
        line_ref = parse_arcgis_layer_line_ref(layer.get("layerName"))
        if line_ref:
            route_layers_by_line.setdefault(line_ref, []).append(layer)

    rows = []
    excluded_relations = []
    for relation in osm.get("relations") or []:
        line, exclusion_reason = relation_line_ref_details(relation)
        if exclusion_reason:
            excluded_relations.append({
                "relationId": relation.get("id"),
                "ref": (relation.get("tags") or {}).get("ref"),
                "name": (relation.get("tags") or {}).get("name"),
                "reason": exclusion_reason,
            })
            continue
        if not line or line not in STOP_LAYER_BY_LINE or not is_ddd_relation(relation):
            continue
        stop_layer_id = STOP_LAYER_BY_LINE[line]
        stop_layer = layer_by_id.get(("urban_routes_and_stops", stop_layer_id))
        route_layer_candidates = route_layers_by_line.get(line, [])
        if len(route_layer_candidates) == 1:
            route_layer = route_layer_candidates[0]
        elif route_layer_candidates:
            combined = dict(route_layer_candidates[0])
            combined["layerName"] = " | ".join(layer.get("layerName") or "" for layer in route_layer_candidates)
            combined["layerId"] = [layer.get("layerId") for layer in route_layer_candidates]
            combined["features"] = [
                feature
                for layer in route_layer_candidates
                for feature in (layer.get("features") or [])
            ]
            route_layer = combined
        else:
            route_layer = None
        row = relation_direction_candidate(relation, route_layer, stop_layer)
        row["routeLayerCandidateCount"] = len(route_layer_candidates)
        row["routeLayerCandidateNames"] = [layer.get("layerName") for layer in route_layer_candidates]
        row["stopLayerMappingVerified"] = bool(
            stop_layer and parse_arcgis_layer_line_ref(stop_layer.get("layerName")) == line
        )
        rows.append(row)
    pairs = classify_direction_pairs(rows)
    return {
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "sources": {
            "osmGeneratedAt": osm.get("generatedAt"),
            "osmSource": osm.get("source"),
            "arcgisGeneratedAt": arcgis.get("generatedAt"),
            "arcgisAttribution": arcgis.get("attribution"),
            "arcgisExtractionErrors": arcgis.get("errors") or [],
            "officialDddRoutePage": OFFICIAL_TERMINI_SOURCE,
            "officialTerminiCheckedAt": OFFICIAL_TERMINI_CHECKED_AT,
        },
        "method": "OSM route relation stop positions are projected against the matching DDD ArcGIS route paths and stop layers. All distances are metre-scale diagnostics. Explicit relation endpoints are paired only when reversed exactly. No geometry is stitched and no line is activated.",
        "thresholds": {
            "routeGeometryCoverageWithin50m": 0.9,
            "routeGeometryMonotonicity": 0.9,
            "routeGeometryMedianDistanceMetersMax": 25,
            "routeGeometryMaximumDistanceMetersMax": 100,
            "stopLayerCoverageWithin50m": 0.8,
            "minimumStopCount": 8,
        },
        "summary": {
            "dddRelationsCompared": len(rows),
            "relationsWithGeometryCandidate": sum(row["geometryCandidate"] for row in rows),
            "relationsWithStopLayerCandidate": sum(row["stopLayerCandidate"] for row in rows),
            "directionCandidates": sum(row["directionCandidate"] for row in rows),
            "linesCompared": len(pairs),
            "linesWithExplicitReversePair": sum(row["explicitReversePairs"] > 0 for row in pairs),
            "linesWithBidirectionalGeometryCandidate": sum(row["bidirectionalGeometryCandidate"] for row in pairs),
            "linesWithBidirectionalStopLayerCandidate": sum(row["bidirectionalStopLayerCandidate"] for row in pairs),
            "linesWithBidirectionalGeometryAndStopsCandidate": sum(row["bidirectionalGeometryAndStopsCandidate"] for row in pairs),
            "linesWithOfficialTerminiMatch": sum(row["bidirectionalOfficialTerminiMatch"] for row in pairs),
        },
        "linePairs": pairs,
        "directionComparisons": rows,
        "excludedRelations": excluded_relations,
        "warning": "Candidate alignment is not proof of current commercial operation. Operator approval, current stop names, complete service directions and timetable validation remain required.",
    }


def main() -> int:
    if len(sys.argv) != 4:
        print("Usage: compare_dakar_pbf_ddd_arcgis_routes.py OSM_RELATIONS.json DDD_ARCGIS.json OUTPUT.json", file=sys.stderr)
        return 2
    osm = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    arcgis = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    report = build_report(osm, arcgis)
    output = Path(sys.argv[3])
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
