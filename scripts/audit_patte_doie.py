"""Compare the two mapped waiting points with the westbound historical calls.

Diagnostic only. The path is measured by the regional PBF audit, not by this
script. A GTFS point-to-marker offset is NOT a walk and AFTU is NOT a TATA
platform binding. There are no current departure times in this report.
"""

import argparse
import hashlib
import json
import zipfile
from collections import defaultdict
from pathlib import Path

from scripts.audit_gt54 import locate
from scripts.audit_interchange_sites import distance
from scripts.compare_bus_occurrences import DIGEST, calendar_bounds, tables

# © OpenStreetMap contributors, ODbL. Both platform nodes v3 and the local
# section of the one-way trunk w108891328 v13, IN node order, heading west.
MARKERS = {
    "n4697843990": (14.7427341, -17.4353940),
    "n4697855389": (14.7427680, -17.4351768),
}
ROAD = [
    (1239220718, 14.7429832, -17.4335857),
    (6382590446, 14.7426389, -17.4352819),
    (1239220662, 14.7425730, -17.4356144),
]
# DDD updated stop layer 0, OID 544, ligne_218. It has no pickup/drop-off role.
OID544 = (14.742779482055056, -17.435277960047891)
SAMPLES = {
    "ddd": ("DDD_218", "DDD_218_THIAROYE", ("D_485", "D_501", "D_657")),
    "aftu": ("AFTU_60", "AFTU_60_bargny", ("A_1254", "A_990", "A_1564")),
}


def offsets(point):
    return {
        "toMarkersM": {k: round(distance(point, xy), 1) for k, xy in MARKERS.items()},
        "signedOffsetToWestboundRoadM": round(locate(point, ROAD)[1], 1),
    }


def event_rank(rows, expected):
    ordered = sorted(rows, key=lambda r: int(r["stop_sequence"]))
    if len({int(r["stop_sequence"]) for r in ordered}) != len(ordered):
        raise ValueError("Rang dupliqué")
    hits = [i for i, r in enumerate(ordered) if r["stop_id"] == expected[1]]
    if not hits:
        return None
    i = hits[0]
    window = ordered[max(0, i - 1) : i + 2]
    if (
        len(hits) != 1
        or tuple(r["stop_id"] for r in window) != expected
        or any(
            (r.get("pickup_type"), r.get("drop_off_type")) != ("0", "0") for r in window
        )
    ):
        raise ValueError("Appel ambigu, ordre ou rôles historiques incompatibles")
    return i + 1


def archive(family, path):
    route, westbound, expected = SAMPLES[family]
    if hashlib.sha256(path.read_bytes()).hexdigest() != DIGEST[family]:
        raise ValueError("Archive différente de l’édition relue")
    with zipfile.ZipFile(path) as z:
        trips = {r["trip_id"]: r for r in tables(z, "trips") if r["route_id"] == route}
        if not trips:
            raise ValueError("Ligne absente")
        last_calendar, last_exception = calendar_bounds(
            z, {t["service_id"] for t in trips.values()}
        )
        rows = defaultdict(list)
        for r in tables(z, "stop_times"):
            if r["trip_id"] in trips:
                rows[r["trip_id"]].append(r)
        counts = defaultdict(int)
        for tid, t in trips.items():
            calls = rows[tid]
            rank = event_rank(calls, expected)
            if not calls or (rank is not None) != (t["shape_id"] == westbound):
                raise ValueError("Appel absent ou présent dans un autre sens")
            counts[t["shape_id"], t["direction_id"], len(calls), rank] += 1
        [point] = [
            (float(r["stop_lat"]), float(r["stop_lon"]))
            for r in tables(z, "stops")
            if r["stop_id"] == expected[1]
        ]
    return {
        "route": route,
        "archiveSha256": DIGEST[family],
        "lastCalendarDate": last_calendar,
        "lastExceptionForTheseServices": last_exception,
        "window": expected,
        **offsets(point),
        "variants": [
            {"shape": s, "directionId": d, "calls": n, "rank": k, "trips": c}
            for (s, d, n, k), c in sorted(counts.items())
        ],
    }


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    for family in SAMPLES:
        cli.add_argument(family, type=Path)
    files = vars(cli.parse_args())
    print(
        json.dumps(
            {
                "scope": "HISTORICAL_REVIEW_ONLY",
                "attribution": "© OpenStreetMap contributors · ODbL 1.0",
                "markerSignedOffsetsM": {
                    k: round(locate(p, ROAD)[1], 1) for k, p in MARKERS.items()
                },
                "dddArcgis544": offsets(OID544),
                "archives": {f: archive(f, path) for f, path in files.items()},
            },
            indent=2,
            ensure_ascii=False,
        )
    )
