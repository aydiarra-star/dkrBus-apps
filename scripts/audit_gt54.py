"""Check which side AND variant served the signed GT-54 stop in two expired archives.

Output aggregates and stop IDs, not coordinates, a timetable, a transfer
permission or an itinerary. A positive side is LEFT in the oriented road.
"""

import argparse
import hashlib
import json
import math
import zipfile
from pathlib import Path

from scripts.audit_interchange_sites import distance
from scripts.compare_bus_occurrences import DIGEST, tables

PINS = Path(__file__).resolve().parents[1] / "data/bus-sections/gt54-pins.json"
# shape, direction_id, 1-based rank of FIRST of three calls, status is per trip.
SAMPLES = [
    ("ddd", "DDD_18", "DDD_18_DIEUPEUL", "1", 28, ("D_440", "D_437", "D_436")),
    ("aftu", "AFTU_39", "AFTU_39_Lat Dior", "0", 12, ("A_875", "A_1992", "A_871")),
    ("aftu", "AFTU_39", "AFTU_39_Diamalaye", "1", 54, ("A_872", "A_874", "A_873")),
]


def nearest(point, way):
    """Distance, chainage, oriented offset and interior flag on a bounded polyline."""
    along = 0
    best = None
    scale = math.pi * 6371000 / 180
    east = scale * math.cos(math.radians(point[0]))
    for a, b in zip(way, way[1:]):
        dx, dy = (b[2] - a[2]) * east, (b[1] - a[1]) * scale
        ex, ey = (point[1] - a[2]) * east, (point[0] - a[1]) * scale
        length = math.hypot(dx, dy)
        if length == 0:
            continue
        pos = (dx * ex + dy * ey) / length
        t = min(length, max(0, pos))
        item = (
            math.hypot(ex - t * dx / length, ey - t * dy / length),
            along + t,
            (dx * ey - dy * ex) / length,
            0 < pos < length,
        )
        if best is None or item[0] < best[0]:
            best = item
        along += length
    return best


def locate(point, way):
    best = nearest(point, way)
    if not best or not best[-1]:
        raise ValueError("Pas de projection intérieure")
    return best[1], best[2]


def check_chain(ways):
    a, b = ways
    if a[2][-1] != b[2][0] or a[2][-1][0] != 297234887:
        raise ValueError("Jonction GT-54 / GT-73 non attestée")


def drawing_control(drawn):
    """Only local control points on the marked operator drawing. Not the bus shape."""
    if (
        drawn.get("orientation") != "start-first"
        or drawn.get("shapeHash")
        != "4a059a80248d93101471ae9d75a26ee8a22b4f970bc961f0ae082b41094d8aff"
    ):
        return {"status": "DESSIN_A_RELIRE"}
    pos = [[i, lat, lon] for i, (lon, lat) in enumerate(drawn["positions"])]
    pins = json.loads(PINS.read_text())
    a, b = [w[2] for w in pins["ways"]]
    p = pins["markers"][0]
    # A mid-block, the pole, the actual turn, then two nodes on route de Fann.
    points = [a[2], a[7], [p[0], *p[2:]], a[-1], b[1], b[2]]
    measured = [(n, nearest((lat, lon), pos)) for n, lat, lon in points]
    if not all(q for _, q in measured):
        return {"status": "DESSIN_NON_MESURABLE"}
    return {
        "status": "CONTROLES_LOCAUX_SEULEMENT",
        "shapeHash": drawn["shapeHash"],
        "node_offsetM_chainageM": [
            [n, round(q[0], 1), round(q[1], 1)] for n, q in measured
        ],
        "orderedWithin20m": all(q[0] <= 20 for _, q in measured)
        and all(q[1] < r[1] for (_, q), (_, r) in zip(measured, measured[1:])),
    }


def review(archives):
    spec = json.loads(PINS.read_text())
    pole = spec["markers"][0][2:]
    ways = spec["ways"]
    check_chain(ways)
    result = {}
    for family, route, shape, direction, rank, expected in SAMPLES:
        path = archives[family]
        if hashlib.sha256(path.read_bytes()).hexdigest() != DIGEST[family]:
            raise ValueError("Archive non relue")
        with zipfile.ZipFile(path) as z:
            trips = {
                r["trip_id"]: []
                for r in tables(z, "trips")
                if (r["route_id"], r["shape_id"], r["direction_id"])
                == (route, shape, direction)
            }
            for r in tables(z, "stop_times"):
                if r["trip_id"] in trips:
                    trips[r["trip_id"]].append(r)
            for rows in trips.values():
                sequence = sorted(rows, key=lambda r: int(r["stop_sequence"]))
                window = sequence[rank - 1 : rank + 2]
                if (
                    len({r["stop_sequence"] for r in sequence}) != len(sequence)
                    or tuple(r["stop_id"] for r in window) != expected
                    or any(
                        (r.get("pickup_type"), r.get("drop_off_type")) != ("0", "0")
                        for r in window
                    )
                ):
                    raise ValueError("Variante ou rôles non confirmés dans l’archive")
            if not trips:
                raise ValueError("Aucune course archivée")
            pos = {
                r["stop_id"]: (float(r["stop_lat"]), float(r["stop_lon"]))
                for r in tables(z, "stops")
                if r["stop_id"] in expected
            }
        reverse = shape == "AFTU_39_Diamalaye"
        # Compare opposite-direction calls against the SAME geometric axis.
        order = (1, 0, 0) if reverse else (0, 0, 1)
        calls = []
        for stop, wi in zip(expected, order):
            m, offset = locate(pos[stop], ways[wi][2])
            calls.append(
                {
                    "stop": stop,
                    "way": ways[wi][0],
                    "chainageM": round(m, 1),
                    "signedOffsetM": round(offset, 1),
                }
            )
        result[shape] = {
            "tripsWithThreeRegularCalls": len(trips),
            "ranks": [rank, rank + 1, rank + 2],
            "calls": calls,
            "middleToPoleM": round(distance(pos[expected[1]], pole), 1),
        }
    # ArcGIS: updated DDD stop layer 0, OID 112, outSR=4326.
    survey = (14.683747, -17.457578)
    return {
        "status": "historical-evidence-only",
        "poleSignedOffsetM": round(locate(pole, ways[0][2])[1], 1),
        "arcgis112ToPoleM": round(distance(survey, pole), 1),
        "arcgis112SignedOffsetM": round(locate(survey, ways[0][2])[1], 1),
        "variants": result,
    }


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("ddd", type=Path)
    cli.add_argument("aftu", type=Path)
    print(json.dumps(review(vars(cli.parse_args())), indent=2, ensure_ascii=False))
