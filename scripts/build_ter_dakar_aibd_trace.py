#!/usr/bin/env python3
"""Reconstitue le tracé des voies du TER Dakar – AIBD à partir de l'extrait OSM versionné.

Entrée  : data/ter/osm-source/ter-dakar-aibd.osm-extract.json
          (relation d'itinéraire OSM 13645077, voies membres et nœuds).
Sorties : data/ter/ter-dakar-aibd.geojson   une seule LineString, WGS 84
          data/ter/ter-dakar-aibd.csv       coordonnées successives
          data/ter/ter-dakar-aibd.dxf       polyligne, UTM 28N (EPSG:32628), mètres
          data/ter/shp/ter-dakar-aibd.*     shapefile polyligne, WGS 84

Le script n'ajoute aucune gare ni aucun arrêt : il enchaîne les voies dans l'ordre
de la relation, sans lissage ni simplification, et refuse de produire un fichier
si la chaîne présente une rupture.

Usage :
    python3 scripts/build_ter_dakar_aibd_trace.py           # régénère les sorties
    python3 scripts/build_ter_dakar_aibd_trace.py --check   # vérifie sans écrire

Bibliothèque standard uniquement. Les sorties DXF et SHP sont des exports dérivés
de la même géométrie OSM : ce ne sont pas des plans officiels.
"""
from __future__ import annotations

import argparse
import json
import math
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/ter/osm-source/ter-dakar-aibd.osm-extract.json"
OUT_DIR = ROOT / "data/ter"
BASENAME = "ter-dakar-aibd"
EXTRACTED_ON = "2026-11-15"
LAYER = "TER_DAKAR_AIBD"

# WGS 84
WGS84_A = 6378137.0
WGS84_F = 1 / 298.257223563
WGS84_E2 = WGS84_F * (2 - WGS84_F)

# Garde-fous géométriques : au-delà, la chaîne est considérée comme suspecte.
MAX_SEGMENT_M = 2000.0
MAX_TURN_DEG = 15.0
LENGTH_RANGE_M = (54000.0, 57000.0)


def segment_length_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Longueur d'un court segment sur l'ellipsoïde WGS 84 (lon, lat en degrés)."""
    phi = math.radians((a[1] + b[1]) / 2)
    w = math.sqrt(1 - WGS84_E2 * math.sin(phi) ** 2)
    meridian = WGS84_A * (1 - WGS84_E2) / w**3
    prime_vertical = WGS84_A / w
    north = meridian * math.radians(b[1] - a[1])
    east = prime_vertical * math.cos(phi) * math.radians(b[0] - a[0])
    return math.hypot(north, east)


def turn_deg(a, b, c) -> float:
    def bearing(p, q):
        return math.degrees(math.atan2((q[0] - p[0]) * math.cos(math.radians(p[1])), q[1] - p[1]))

    return abs((bearing(b, c) - bearing(a, b) + 180) % 360 - 180)


def to_utm28n(lon: float, lat: float) -> tuple[float, float]:
    """WGS 84 -> UTM zone 28N (EPSG:32628), série de Krüger."""
    n = WGS84_F / (2 - WGS84_F)
    radius = WGS84_A / (1 + n) * (1 + n**2 / 4 + n**4 / 64)
    alpha = (
        n / 2 - 2 * n**2 / 3 + 5 * n**3 / 16,
        13 * n**2 / 48 - 3 * n**3 / 5,
        61 * n**3 / 240,
    )
    phi = math.radians(lat)
    dlam = math.radians(lon - (-15.0))
    c = 2 * math.sqrt(n) / (1 + n)
    t = math.sinh(math.atanh(math.sin(phi)) - c * math.atanh(c * math.sin(phi)))
    xi = math.atan2(t, math.cos(dlam))
    eta = math.atanh(math.sin(dlam) / math.sqrt(1 + t * t))
    easting = eta + sum(a * math.cos(2 * j * xi) * math.sinh(2 * j * eta) for j, a in enumerate(alpha, 1))
    northing = xi + sum(a * math.sin(2 * j * xi) * math.cosh(2 * j * eta) for j, a in enumerate(alpha, 1))
    k0 = 0.9996
    return 500000.0 + k0 * radius * easting, k0 * radius * northing


def build_chain(extract: dict) -> list[dict]:
    """Enchaîne les voies dans l'ordre de la relation, puis la voie terminale."""
    ways = {way["id"]: way for way in extract["ways"]}
    order = list(extract["relation"]["way_members"]) + [extract["terminal_tail_way"]["id"]]
    if sorted(order) != sorted(ways):
        raise SystemExit("L'extrait contient des voies absentes de la relation, ou l'inverse.")

    nodes = extract["nodes"]
    boundary = extract["phase_boundary_node"]
    vertices: list[dict] = []
    phase = 1
    for way_id in order:
        refs = ways[way_id]["nodes"]
        if vertices:
            last = vertices[-1]["node"]
            if refs[0] == last:
                pass
            elif refs[-1] == last:
                refs = refs[::-1]
            else:
                raise SystemExit(f"Rupture de continuité avant la voie OSM {way_id}.")
            refs = refs[1:]
        for ref in refs:
            lon, lat, check = nodes[str(ref)]
            vertices.append({"node": ref, "way": way_id, "lon": lon, "lat": lat, "check": check, "phase": phase})
            if ref == boundary:
                phase = 2
    return vertices


def validate(vertices: list[dict]) -> dict:
    ids = [v["node"] for v in vertices]
    if len(set(ids)) != len(ids):
        raise SystemExit("Un nœud est parcouru deux fois : la ligne n'est pas simple.")
    pts = [(v["lon"], v["lat"]) for v in vertices]
    pk = [0.0]
    for a, b in zip(pts, pts[1:]):
        pk.append(pk[-1] + segment_length_m(a, b))
    longest = max(b - a for a, b in zip(pk, pk[1:]))
    sharpest = max(turn_deg(a, b, c) for a, b, c in zip(pts, pts[1:], pts[2:]))
    if longest > MAX_SEGMENT_M:
        raise SystemExit(f"Segment de {longest:.0f} m : saut suspect dans la géométrie.")
    if sharpest > MAX_TURN_DEG:
        raise SystemExit(f"Angle de {sharpest:.1f}° entre deux segments : géométrie suspecte.")
    if not LENGTH_RANGE_M[0] <= pk[-1] <= LENGTH_RANGE_M[1]:
        raise SystemExit(f"Longueur totale inattendue : {pk[-1]:.0f} m.")
    for v, value in zip(vertices, pk):
        v["pk_m"] = value
    boundary_index = max(i for i, v in enumerate(vertices) if v["phase"] == 1)
    return {
        "length_m": pk[-1],
        "phase_1_length_m": pk[boundary_index],
        "phase_2_length_m": pk[-1] - pk[boundary_index],
        "phase_2_start_index": boundary_index,
        "longest_segment_m": longest,
        "sharpest_turn_deg": sharpest,
        "checked_by_coordinates": sum(v["check"] == "coord" for v in vertices),
        "checked_by_timestamp": sum(v["check"] == "timestamp" for v in vertices),
    }


def render_geojson(extract: dict, vertices: list[dict], stats: dict) -> bytes:
    coords = [[v["lon"], v["lat"]] for v in vertices]
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    order = list(extract["relation"]["way_members"]) + [extract["terminal_tail_way"]["id"]]
    properties = {
        "id": BASENAME,
        "name": "TER Dakar – AIBD : tracé des voies (sens Dakar vers AIBD)",
        "railway": "rail",
        "gauge_mm": 1435,
        "electrified": "contact_line",
        "voltage_v": 25000,
        "frequency_hz": 50,
        "length_m": round(stats["length_m"]),
        "vertex_count": len(coords),
        "phase_2_start_index": stats["phase_2_start_index"],
        "phase_1_length_m": round(stats["phase_1_length_m"]),
        "phase_2_length_m": round(stats["phase_2_length_m"]),
        "source": "OpenStreetMap, API 0.6",
        "osm_relation": extract["relation"]["id"],
        "osm_relation_version": extract["relation"]["version"],
        "osm_ways": ",".join(str(way_id) for way_id in order),
        "extracted_on": EXTRACTED_ON,
        "license": "ODbL 1.0",
        "attribution": "© les contributeurs d'OpenStreetMap",
        "accuracy_note": (
            "Voies numérisées par les contributeurs OSM sur imagerie satellite. "
            "Ce n'est pas un relevé ferroviaire officiel (plans APIX, SETEC ou SYSTRA non publics)."
        ),
    }
    head = {
        "type": "FeatureCollection",
        "name": BASENAME,
        "bbox": [min(lons), min(lats), max(lons), max(lats)],
    }
    lines = ["{"]
    for key, value in head.items():
        lines.append(f"  {json.dumps(key)}: {json.dumps(value, ensure_ascii=False)},")
    lines.append('  "features": [')
    lines.append("    {")
    lines.append('      "type": "Feature",')
    lines.append(f'      "properties": {json.dumps(properties, ensure_ascii=False)},')
    lines.append('      "geometry": {')
    lines.append('        "type": "LineString",')
    lines.append('        "coordinates": [')
    lines.extend(
        f"          [{lon:.7f}, {lat:.7f}]" + ("," if i < len(coords) - 1 else "")
        for i, (lon, lat) in enumerate(coords)
    )
    lines.extend(["        ]", "      }", "    }", "  ]", "}"])
    return ("\n".join(lines) + "\n").encode("utf-8")


def render_csv(vertices: list[dict]) -> bytes:
    rows = ["seq,longitude,latitude,pk_m,phase,osm_way_id,osm_node_id,verification"]
    for i, v in enumerate(vertices):
        rows.append(
            f"{i},{v['lon']:.7f},{v['lat']:.7f},{v['pk_m']:.1f},{v['phase']},{v['way']},{v['node']},{v['check']}"
        )
    return ("\n".join(rows) + "\n").encode("utf-8")


def render_dxf(vertices: list[dict]) -> bytes:
    """DXF ASCII R12 : une POLYLINE en UTM 28N (EPSG:32628), unités en mètres."""
    points = [to_utm28n(v["lon"], v["lat"]) for v in vertices]
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    out: list[str] = []

    def add(*pairs):
        for code, value in pairs:
            out.append(str(code))
            out.append(value if isinstance(value, str) else f"{value:.3f}")

    add((999, "TER Dakar-AIBD - derive d'OpenStreetMap (ODbL) - EPSG:32628 - pas un plan officiel"))
    add((0, "SECTION"), (2, "HEADER"), (9, "$ACADVER"), (1, "AC1009"), (9, "$INSUNITS"), (70, "6"))
    add((9, "$EXTMIN"), (10, min(xs)), (20, min(ys)), (30, 0.0))
    add((9, "$EXTMAX"), (10, max(xs)), (20, max(ys)), (30, 0.0), (0, "ENDSEC"))
    add((0, "SECTION"), (2, "TABLES"))
    add((0, "TABLE"), (2, "LTYPE"), (70, "1"))
    add((0, "LTYPE"), (2, "CONTINUOUS"), (70, "0"), (3, "Solid line"), (72, "65"), (73, "0"), (40, 0.0))
    add((0, "ENDTAB"))
    add((0, "TABLE"), (2, "LAYER"), (70, "1"))
    add((0, "LAYER"), (2, LAYER), (70, "0"), (62, "5"), (6, "CONTINUOUS"))
    add((0, "ENDTAB"), (0, "ENDSEC"))
    add((0, "SECTION"), (2, "ENTITIES"))
    add((0, "POLYLINE"), (8, LAYER), (66, "1"), (70, "0"), (10, 0.0), (20, 0.0), (30, 0.0))
    for x, y in points:
        add((0, "VERTEX"), (8, LAYER), (10, x), (20, y), (30, 0.0))
    add((0, "SEQEND"), (8, LAYER), (0, "ENDSEC"), (0, "EOF"))
    return ("\n".join(out) + "\n").encode("ascii")


def render_shapefile(vertices: list[dict], stats: dict) -> dict[str, bytes]:
    """Shapefile ESRI minimal : une polyligne (type 3), WGS 84."""
    pts = [(v["lon"], v["lat"]) for v in vertices]
    box = (min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))
    content = struct.pack("<i4d2ii", 3, *box, 1, len(pts), 0) + b"".join(struct.pack("<2d", *p) for p in pts)

    def header(total_bytes: int) -> bytes:
        return (
            struct.pack(">i5ii", 9994, 0, 0, 0, 0, 0, total_bytes // 2)
            + struct.pack("<2i", 1000, 3)
            + struct.pack("<8d", *box, 0.0, 0.0, 0.0, 0.0)
        )

    shp = header(100 + 8 + len(content)) + struct.pack(">2i", 1, len(content) // 2) + content
    shx = header(108) + struct.pack(">2i", 50, len(content) // 2)

    fields = [
        ("ID", "C", 20, 0, BASENAME),
        ("NAME", "C", 40, 0, "TER Dakar - AIBD"),
        ("LENGTH_M", "N", 8, 0, str(round(stats["length_m"]))),
        ("GAUGE_MM", "N", 5, 0, "1435"),
        ("OSM_REL", "N", 12, 0, "13645077"),
        ("SOURCE", "C", 60, 0, f"OpenStreetMap API 0.6, {EXTRACTED_ON}, ODbL 1.0"),
    ]
    record_length = 1 + sum(f[2] for f in fields)
    year, month, day = (int(part) for part in EXTRACTED_ON.split("-"))
    dbf = struct.pack("<4BIHH20x", 3, year - 1900, month, day, 1, 32 + 32 * len(fields) + 1, record_length)
    for name, kind, size, decimals, _ in fields:
        dbf += struct.pack("<11sc4xBB14x", name.encode("ascii"), kind.encode("ascii"), size, decimals)
    dbf += b"\r " + b"".join(
        (value.rjust(size) if kind == "N" else value.ljust(size)).encode("ascii")
        for _, kind, size, _, value in fields
    )
    dbf += b"\x1a"
    prj = (
        'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],'
        'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]'
    )
    return {".shp": shp, ".shx": shx, ".dbf": dbf, ".prj": prj.encode("ascii"), ".cpg": b"UTF-8"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="vérifie que les sorties sont à jour, sans écrire")
    args = parser.parse_args()

    extract = json.loads(SOURCE.read_text(encoding="utf-8"))
    vertices = build_chain(extract)
    stats = validate(vertices)

    outputs = {
        OUT_DIR / f"{BASENAME}.geojson": render_geojson(extract, vertices, stats),
        OUT_DIR / f"{BASENAME}.csv": render_csv(vertices),
        OUT_DIR / f"{BASENAME}.dxf": render_dxf(vertices),
    }
    for suffix, payload in render_shapefile(vertices, stats).items():
        outputs[OUT_DIR / "shp" / f"{BASENAME}{suffix}"] = payload

    stale = []
    for path, payload in outputs.items():
        if args.check:
            if not path.exists() or path.read_bytes() != payload:
                stale.append(path)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)

    print(f"Sommets            : {len(vertices)}")
    print(f"Longueur totale    : {stats['length_m']:.0f} m")
    print(f"  phase 1          : {stats['phase_1_length_m']:.0f} m")
    print(f"  phase 2          : {stats['phase_2_length_m']:.0f} m")
    print(f"Segment le plus long : {stats['longest_segment_m']:.0f} m")
    print(f"Angle le plus fort   : {stats['sharpest_turn_deg']:.1f}°")
    print(f"Nœuds vérifiés par coordonnées : {stats['checked_by_coordinates']}")
    print(f"Nœuds vérifiés par horodatage  : {stats['checked_by_timestamp']}")
    if stale:
        for path in stale:
            print(f"PAS À JOUR : {path.relative_to(ROOT)}", file=sys.stderr)
        return 1
    print("Sorties à jour." if args.check else f"{len(outputs)} fichiers écrits dans {OUT_DIR.relative_to(ROOT)}/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
