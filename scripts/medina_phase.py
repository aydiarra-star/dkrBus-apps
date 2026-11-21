"""Reproduce one *relative* approach-time estimate, never a 2026 run or position."""

import argparse
import hashlib
import statistics
import zipfile
from collections import defaultdict
from pathlib import Path

from scripts.compare_bus_occurrences import DIGEST, tables

# Each sequence is independently anchored in a named direction of the archive.
ANCHORS = {
    "outbound": (
        "1",
        "DDD_01_PARCELLES-ASSAINIES",
        ("D_805", "D_599"),
        28,
        ("D_419", "D_420", "D_733"),
    ),
    "inbound": (
        "0",
        "DDD_01_LECLERC",
        ("D_140", "D_146"),
        11,
        ("D_441", "D_421", "D_422"),
    ),
}


def approach(archive, direction="outbound"):
    side, shape, origin, rank, local = ANCHORS[direction]
    if hashlib.sha256(archive.read_bytes()).hexdigest() != DIGEST["ddd"]:
        raise ValueError("Archive non relue")
    with zipfile.ZipFile(archive) as z:
        trips = {
            r["trip_id"]
            for r in tables(z, "trips")
            if r["route_id"] == "DDD_01"
            and r["direction_id"] == side
            and r["shape_id"] == shape
        }
        calls = defaultdict(list)
        for row in tables(z, "stop_times"):
            if row["trip_id"] in trips:
                calls[row["trip_id"]].append(row)
    elapsed = []
    for trip in trips:
        seq = sorted(calls[trip], key=lambda r: int(r["stop_sequence"]))
        ids = [r["stop_id"] for r in seq]
        if (
            tuple(ids[:2]) != origin
            or tuple(ids[rank - 1 : rank + 2]) != local
            or ids.count(local[0]) != 1
            or len(set(r["stop_sequence"] for r in seq)) != len(seq)
        ):
            raise ValueError("Profil non apparié")

        def seconds(v):
            h, m, s = map(int, v.split(":"))
            if not (0 <= h < 48 and 0 <= m < 60 and 0 <= s < 60):
                raise ValueError("Heure invalide")
            return 3600 * h + 60 * m + s

        dt = seconds(seq[rank - 1]["arrival_time"]) - seconds(seq[0]["departure_time"])
        if not 0 < dt < 86400:
            raise ValueError("Durée invalide")
        elapsed.append(dt)
    return len(elapsed), min(elapsed), statistics.median(elapsed), max(elapsed)


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("ddd_zip", type=Path)
    cli.add_argument("--direction", choices=ANCHORS, default="outbound")
    args = cli.parse_args()
    print(*approach(args.ddd_zip, args.direction))
