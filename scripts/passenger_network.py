"""Compile a service-day edition of a published snapshot for the passenger router.

GTFS supplies each trip's actual calls, shape and times. A separately reviewed
local file scopes which directions and physical accesses may be used. This is
not the direct-ride graph: no parent, nearest-stop or transfer-distance edges.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import sqlite3
from collections import defaultdict
from contextlib import closing
from datetime import date, datetime, time, timezone
from functools import lru_cache
from pathlib import Path

try:
    from .network_graph import _load_calendars, _service_active
    from .snapshot_gtfs import connect_read_only, resolve_active_snapshot
except ImportError:  # direct CLI entry point
    from network_graph import _load_calendars, _service_active
    from snapshot_gtfs import connect_read_only, resolve_active_snapshot

MODES = {"ter": "2", "brt": "3", "ddd": "3", "aftu": "3", "tata": "3"}
MAX_BYTES = 6_000_000
REVIEW_DIR = ".passenger-reviews"  # not a snapshot directory


class PackError(ValueError):
    pass


def require(ok: object, reason: str) -> None:
    if not ok:
        raise PackError(reason)


def sidecar(root: Path, snapshot_id: str) -> Path | None:
    # snapshot_id is from the verified publication journal, never the URL.
    folder = root / REVIEW_DIR
    path = folder / f"{snapshot_id}.json"
    return path if not folder.is_symlink() and not path.is_symlink() and path.is_file() else None


def _clock(raw: str) -> int:
    match = re.fullmatch(r"(\d{1,2}):([0-5]\d):([0-5]\d)", raw or "")
    if not match or int(match[1]) >= 24:
        raise PackError("Horaire absent ou hors du jour de service pris en charge.")
    h, m, s = map(int, match.groups())
    return 3600 * h + 60 * m + s


def _proof(e: dict) -> dict:
    require(e["status"] == "reviewed" and isinstance(e["reference"], str) and e["reference"].strip(), "Preuve de revue manquante.")
    date.fromisoformat(e["date"])
    return {k: e[k] for k in ("status", "reference", "date")}


def _coord(lat: str | float, lon: str | float) -> dict:
    a, b = float(lat), float(lon)
    require(math.isfinite(a) and math.isfinite(b) and 14.4 <= a <= 15 and -17.7 <= b <= -16.9, "Point hors Dakar.")
    return {"lat": a, "lon": b}


def _physical(sid: str, place_id: str) -> str:
    # A reviewed landmark entrance deliberately retains its local identity.
    return place_id if place_id.startswith("landmark:") else f"access:{sid}:{place_id}"


def _binding(sid: str, row: dict) -> dict:
    return {**{k: row[k] for k in ("role", "stepFree", "stopId")},
            "platformId": _physical(sid, row["platformId"]), "evidence": _proof(row["evidence"])}


def _links(sid: str, raw: dict) -> dict:
    require(not set(raw) - {"places", "footways", "platformBindings"}, "Les liaisons ne peuvent pas injecter de services.")
    result = {"places": [], "footways": [], "platformBindings": [], "patterns": []}
    for p in raw.get("places", []):
        require(p["kind"] in ("entrance", "path", "platform"), "Un accès ne peut pas créer un arrêt de ligne.")
        result["places"].append({"id": _physical(sid, p["id"]), "name": p["name"], "kind": p["kind"],
                                 "evidence": _proof(p["evidence"]), **_coord(p["lat"], p["lon"])})
    for w in raw.get("footways", []):
        result["footways"].append({**{k: w[k] for k in ("kind", "name", "access", "stepFree", "crossingsAndBarriersChecked")},
                                  "id": _physical(sid, w["id"]), "from": _physical(sid, w["from"]), "to": _physical(sid, w["to"]),
                                  "positions": [_coord(v["lat"], v["lon"]) for v in w["positions"]], "evidence": _proof(w["evidence"])})
    # Optionally bind an observed platform to a local TER/B1 call. Admission
    # still requires the exact line, direction, call, role and shape position.
    for b in raw.get("platformBindings", []):
        result["platformBindings"].append({**_binding(sid, b), **{k: b[k] for k in ("lineId", "mode", "direction")}})
    return result


def _validated_service_day(conn: sqlite3.Connection, day: date) -> tuple[set, dict]:
    tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    calendars, exceptions = _load_calendars(conn)
    dated = {svc for svc in calendars.keys() | {s for s, _ in exceptions} if _service_active(svc, day, calendars, exceptions)}
    # Never override prohibitions, route/trip-specific rules or mandatory
    # transfer times with the rider's general transfer buffer.
    if "transfers" in tables:
        for row in conn.execute("SELECT * FROM transfers"):
            t = dict(row)
            require((t.get("transfer_type") or "0") == "0" and not any(t.get(k) for k in
                    ("from_route_id", "to_route_id", "from_trip_id", "to_trip_id", "min_transfer_time")),
                    "Règle GTFS particulière non gérée ; complément non activé.")
    frequency = defaultdict(list)
    if "frequencies" in tables:
        for row in conn.execute("SELECT * FROM frequencies"):
            frequency[row["trip_id"]].append(dict(row))
    return dated, frequency


def _profiles(conn, d, ids, dated, frequency, inaccessible: bool) -> dict:
    groups = defaultdict(set)
    matched = False
    query = "SELECT * FROM trips WHERE route_id=? AND direction_id=? AND shape_id=?"
    for trip in conn.execute(query, (d["route_id"], d["direction_id"], d["shape_id"])):
        trip = dict(trip)
        times = [dict(v) for v in conn.execute("SELECT * FROM stop_times WHERE trip_id=? ORDER BY CAST(stop_sequence AS INTEGER)", (trip["trip_id"],))]
        if [v["stop_id"] for v in times] != ids:
            continue  # variant with a different calling pattern, not reviewed
        matched = True
        if trip["service_id"] not in dated:
            continue
        require(len({int(v["stop_sequence"]) for v in times}) == len(ids), "Ordre d’arrêts ambigu.")
        require(all((v.get("pickup_type") or "0") == "0" for v in times[:-1]) and
                all((v.get("drop_off_type") or "0") == "0" for v in times[1:]) and
                not any(v.get(k) for v in times for k in ("start_pickup_drop_off_window", "end_pickup_drop_off_window", "pickup_booking_rule_id", "drop_off_booking_rule_id")),
                "Restrictions de montée/descente non prises en charge.")
        arrivals = [_clock(v["arrival_time"]) for v in times]
        departures = [_clock(v["departure_time"]) for v in times]
        require(all(b >= a and (i == 0 or a > departures[i-1]) for i, (a, b) in enumerate(zip(arrivals, departures))), "Horaires non monotones.")
        origin = departures[0]
        step_free = "no" if inaccessible or trip.get("wheelchair_accessible") == "2" else d.get("stepFree", "unknown")
        profile = ((0, *(t-origin for t in arrivals[1:])), tuple(t-origin for t in departures), step_free)
        intervals = frequency.get(trip["trip_id"], [])
        if not intervals:
            groups[profile].add(origin)
        for f in intervals:
            every = int(f["headway_secs"])
            require(f.get("exact_times") == "1" and every > 0, "Une fréquence indicative ne vaut pas un horaire exact.")
            start, end = _clock(f["start_time"]), _clock(f["end_time"])
            runs = range(start, end, every)
            require(runs and runs[-1] + departures[-1] - origin < 86400, "Créneau vide ou après minuit.")
            groups[profile].update(runs)
    require(matched, "Aucune course avec les appels ordonnés et le tracé revus.")
    return groups


def compile_day(root: Path, snap: dict, day: date, *, review_file: Path | None = None) -> dict:
    sid = snap["snapshot_id"]
    path = review_file if review_file is not None else sidecar(root, sid)
    require(path and path.is_file() and not path.is_symlink() and path.stat().st_size <= MAX_BYTES, "Revue absente ou trop volumineuse.")
    require(snap["validity_status"] == "CURRENT", "Snapshot non courant.")
    midnight = int(datetime.combine(day, time(), timezone.utc).timestamp())
    require(datetime.fromisoformat(snap["valid_from"]).timestamp() <= midnight and
            midnight + 86399 < datetime.fromisoformat(snap["valid_until"]).timestamp(), "Jour hors de la validité du snapshot.")
    return _compiled(root, sid, snap["database_sha256"], day, midnight, path.read_bytes())


@lru_cache(maxsize=3)
def _compiled(root: Path, sid: str, digest: str, day: date, midnight: int, raw: bytes) -> dict:
    review = json.loads(raw)
    require(review["version"] == 1 and review["snapshot_id"] == sid and review["database_sha256"] == digest, "Revue ne correspondant pas au snapshot actif.")
    require(review["public"] is True and isinstance(review["attribution"], str) and review["attribution"].strip(), "Autorisation de diffusion et attribution requises.")
    require(date.fromisoformat(review["first_day"]) <= day <= date.fromisoformat(review["last_day"]), "Jour hors de la revue.")
    directions = review["directions"]
    require(isinstance(directions, list) and 0 < len(directions) <= 1000, "Périmètre de lignes invalide.")
    dataset = _links(sid, review.get("links", {}))
    seen, keys, places = set(), set(), {}
    projection_work = 0
    with closing(connect_read_only(root / sid)) as conn:
        dated, frequency = _validated_service_day(conn, day)
        for d in directions:
            proof, mode, agency = _proof(d["evidence"]), d["mode"], d["agency_id"]
            route, shape, direction = d["route_id"], d["shape_id"], d["direction_id"]
            ids, label, key = d["stop_ids"], d["direction"], d["id"]
            require(isinstance(ids, list) and 2 <= len(ids) <= 512 and len(set(ids)) == len(ids) and all(isinstance(i, str) and i for i in ids), "Séquence ambiguë ou incomplète.")
            selector = (route, direction, shape, tuple(ids))
            require(mode in MODES and selector not in seen and direction in ("0", "1") and shape.strip() and label.strip() and
                    re.fullmatch(r"[A-Za-z0-9_-]{1,80}", key) and key not in keys, "Direction non identifiée ou dupliquée.")
            seen.add(selector)
            keys.add(key)
            r = conn.execute("SELECT * FROM routes WHERE route_id=?", (route,)).fetchone()
            tz = conn.execute("SELECT agency_timezone FROM agency WHERE agency_id=?", (agency,)).fetchone()
            require(r and r["agency_id"] == agency and r["route_type"] == MODES[mode] and tz and tz[0] == "Africa/Dakar", "Opérateur, type de ligne ou fuseau incohérent.")
            vertices = conn.execute("SELECT * FROM shapes WHERE shape_id=? ORDER BY CAST(shape_pt_sequence AS INTEGER) LIMIT 50001", (shape,)).fetchall()
            require(2 <= len(vertices) <= 50000 and len({int(v["shape_pt_sequence"]) for v in vertices}) == len(vertices), "Tracé absent ou séquence de sommets invalide.")
            positions = [_coord(v["shape_pt_lat"], v["shape_pt_lon"]) for v in vertices]
            calls = [f"gtfs:{sid}:stop:{s}" for s in ids]
            inaccessible = False
            for stop_id, call in zip(ids, calls):
                stop = conn.execute("SELECT * FROM stops WHERE stop_id=?", (stop_id,)).fetchone()
                require(stop and (dict(stop).get("location_type") or "0") == "0" and stop["stop_name"], "Arrêt logique introuvable ou non desservi.")
                info = dict(stop)
                access = info.get("wheelchair_boarding") or "0"
                if access == "0" and info.get("parent_station"):
                    parent = conn.execute("SELECT * FROM stops WHERE stop_id=?", (info["parent_station"],)).fetchone()
                    access = dict(parent).get("wheelchair_boarding") if parent else "0"
                inaccessible |= access == "2"
                places[call] = {"id": call, "name": stop["stop_name"], "kind": "call", "evidence": proof, **_coord(stop["stop_lat"], stop["stop_lon"])}
            groups = _profiles(conn, d, ids, dated, frequency, inaccessible)
            network = "aftu_tata" if mode in ("aftu", "tata") else mode
            source = f"{review['attribution']} · {sid} · {route} · {day.isoformat()}"
            projection_work += len(groups) * len(calls) * len(positions)
            require(projection_work <= 2_000_000 and len(dataset["patterns"]) + len(groups) <= 2000, "Édition trop grande pour le calcul mobile.")
            for i, ((arrivals, departures, step_free), runs) in enumerate(sorted(groups.items())):
                line = f"gtfs:{sid}:{key}:{i}"
                dataset["patterns"].append({
                    "network": network, **({"busFamily": mode} if network == "aftu_tata" else {}), "lineId": line,
                    "name": dict(r).get("route_short_name") or dict(r).get("route_long_name") or route, "direction": label,
                    "evidence": proof, "stops": calls, "stepFree": step_free,
                    "shape": {"network": network, "lineId": line, "directionId": label, "verified": True,
                              "source": "REVIEWED_GTFS_SHAPE", "sourceId": f"gtfs:{sid}:{shape}", "positions": positions},
                    "service": {"kind": "timetable", "departures": [midnight + t for t in sorted(runs)], "source": source},
                    "times": {"kind": "offsets", "arrivals": arrivals, "departures": departures, "source": source},
                })
                for b in d.get("platformBindings", []):
                    dataset["platformBindings"].append({**_binding(sid, b), "stopId": f"gtfs:{sid}:stop:{b['stopId']}",
                                                       "lineId": line, "mode": mode, "direction": label})
    dataset["places"].extend(places.values())
    pack = {"version": 1, "snapshot_id": sid, "date": day.isoformat(), "attribution": review["attribution"],
            "revision": hashlib.sha256(raw).hexdigest(), "dataset": dataset}
    require(len(json.dumps(pack, ensure_ascii=False).encode("utf-8")) <= MAX_BYTES, "Édition trop volumineuse.")
    return pack


if __name__ == "__main__":
    # Operator preflight only. This command cannot install an edition, mutate
    # the snapshot or publish the GTFS. The HTTP route has no review_file input.
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Préparer une édition pour audit hors ligne, sans activation.")
    parser.add_argument("--root", type=Path, required=True, help="Dossier des snapshots publiés")
    parser.add_argument("--review", type=Path, required=True, help="Revue destinée à la diffusion publique")
    parser.add_argument("--date", type=date.fromisoformat, required=True)
    args = parser.parse_args()
    try:
        active = resolve_active_snapshot(args.root)
        require(active["available"], "Aucun snapshot actif vérifiable.")
        print(json.dumps(compile_day(args.root, active["snapshot"], args.date, review_file=args.review), ensure_ascii=False))
    except (ValueError, KeyError, TypeError, AttributeError, OSError, sqlite3.DatabaseError) as error:
        sys.exit(f"Édition refusée : {error}")
