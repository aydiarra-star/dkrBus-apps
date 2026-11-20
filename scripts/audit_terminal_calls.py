"""All literal trip-ID joins at the investigated terminal sites. No
calendar extension, inferred GTFS rank, fuzzy trip repair, or current times.
The comparison uses geographic offsets, NOT walking distances.
"""

import argparse
import hashlib
import json
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

from scripts.audit_interchange_sites import distance
from scripts.audit_patte_doie import calendar_bounds
from scripts.compare_bus_occurrences import DIGEST, tables

# Two identically named AFTU poles must remain separate. The stop before/after
# each occurrence, including the absence of a previous/next stop, matters.
SEEDS = {
    "ddd": {
        "DDD_218": {"D_686"},
        "DDD_217": {"D_686"},
        "DDD_402": {"D_686"},
        "DDD_315": {"D_1210"},
        "DDD_07": {"D_60"},
        "DDD_05": {"D_406", "D_1082"},
        "DDD_12": {"D_406", "D_1082"},
    },
    "aftu": {
        "AFTU_73": {"A_586", "A_266"},
        "AFTU_53": {"A_1572"},
        "AFTU_26": {"A_586"},
        "AFTU_67": {"A_25", "A_26", "A_378"},
    },
}
POSTE = (14.7471089, -17.3780703)  # © OSM, node 4419421889 v2
OUAKAM = (14.7256037, -17.4827764)  # node 4363242525 v3
GUEDIAWAYE = (14.7731189, -17.3887409)  # node 5038866775 v3
OID453 = (14.773042655518, -17.3888199835433)
OID343 = (14.7255978303131, -17.4827847179303)
OID539 = (14.7469791502968, -17.3778287197142)  # updated DDD layer 0 / ligne_218


def occurrences(rows, targets):
    if not rows:
        return "NO_JOINED_CALLS", ()
    seq = sorted(rows, key=lambda r: int(r["stop_sequence"]))
    if len({int(r["stop_sequence"]) for r in seq}) != len(seq):
        return "TIED_RANKS", ()
    hits = tuple(
        (
            r["stop_id"],
            i + 1,
            seq[i - 1]["stop_id"] if i else None,
            seq[i + 1]["stop_id"] if i < len(seq) - 1 else None,
            r.get("pickup_type"),
            r.get("drop_off_type"),
        )
        for i, r in enumerate(seq)
        if r["stop_id"] in targets
    )
    return ("MATCH" if hits else "NO_TARGET"), hits


def inspect(family, path):
    specs = SEEDS[family]
    result = {}
    if hashlib.sha256(path.read_bytes()).hexdigest() != DIGEST[family]:
        raise ValueError("Archive non relue")
    with zipfile.ZipFile(path) as z:
        trips = {r["trip_id"]: r for r in tables(z, "trips") if r["route_id"] in specs}
        rows = defaultdict(list)
        for r in tables(z, "stop_times"):
            if r["trip_id"] in trips:
                rows[r["trip_id"]].append(r)
        for route, targets in specs.items():
            counts = Counter()
            services = set()
            for tid, t in trips.items():
                if t["route_id"] != route:
                    continue
                services.add(t["service_id"])
                calls = rows[tid]
                counts[
                    t["shape_id"],
                    t["direction_id"],
                    len(calls),
                    *occurrences(calls, targets),
                ] += 1
            if not services:
                raise ValueError(f"Ligne absente : {route}")
            last, ex = calendar_bounds(z, services)
            result[route] = {
                "lastCalendarDate": last,
                "lastExceptionForTheseServices": ex,
                "variants": [
                    {
                        "shape": sh,
                        "directionId": direction,
                        "calls": n,
                        "status": status,
                        "trips": count,
                        "occurrences": [
                            {
                                "stop": k,
                                "rank": rank,
                                "before": prev,
                                "after": nxt,
                                "pickup": pick,
                                "dropOff": drop,
                            }
                            for k, rank, prev, nxt, pick, drop in hits
                        ],
                    }
                    for (sh, direction, n, status, hits), count in sorted(
                        counts.items(), key=lambda item: repr(item[0])
                    )
                ],
            }
        ids = set.union(*specs.values())
        positions = {
            r["stop_id"]: (float(r["stop_lat"]), float(r["stop_lon"]))
            for r in tables(z, "stops")
            if r["stop_id"] in ids
        }
        if set(positions) != ids:
            raise ValueError("Positions historiques incomplètes")
    return result, positions


def report(ddd, aftu):
    routes = {}
    points = {}
    for family, file in [("ddd", ddd), ("aftu", aftu)]:
        rows, pos = inspect(family, file)
        routes.update(rows)
        points.update(pos)

    def gap(a, b):
        return round(distance(a, b), 1)

    return {
        "scope": "HISTORICAL_REVIEW_ONLY",
        "archiveSha256": DIGEST,
        "attribution": "© OpenStreetMap contributors · ODbL 1.0",
        "routes": routes,
        "offsetsM": {
            "toThiaroyeNode4419421889": {
                k: gap(points[k], POSTE) for k in ("D_686", "A_586", "A_266")
            }
            | {"arcgis539": gap(OID539, POSTE)},
            "toGuediawayeNode5038866775": {
                k: gap(points[k], GUEDIAWAYE) for k in ("D_406", "D_1082", "A_586")
            }
            | {"arcgis453": gap(OID453, GUEDIAWAYE)},
            "toOuakamNode4363242525": {
                k: gap(points[k], OUAKAM) for k in ("D_60", "A_26", "A_25", "A_378")
            }
            | {"arcgis343": gap(OID343, OUAKAM)},
            "betweenSebikotaneArchiveTermini": gap(points["D_1210"], points["A_1572"]),
        },
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("ddd", type=Path)
    p.add_argument("aftu", type=Path)
    a = p.parse_args()
    print(json.dumps(report(a.ddd, a.aftu), ensure_ascii=False, indent=2))
