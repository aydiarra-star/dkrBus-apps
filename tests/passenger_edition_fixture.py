"""Synthetic five-mode publication, used ONLY by tests/recipes in temporary stores.

Run from the repo with PYTHONPATH=. python tests/passenger_edition_fixture.py
for an actual API payload to exercise the TypeScript consumer. No network I/O.
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

from scripts.passenger_network import REVIEW_DIR
from scripts.publish_gtfs import publish_dataset
from scripts.review_gtfs import approve_dataset
from scripts.serve_read_api import network_payload, passenger_network_payload
from scripts.snapshot_gtfs import resolve_active_snapshot
from auth_helpers import proof
from test_serve_admin_api import ApiTestSupport, FULL_ATTESTATIONS
from test_stage_gtfs import NOW

DAY = "2026-11-18"
MODES = ["ter", "brt", "ddd", "aftu", "tata"]
E = {"status": "reviewed", "reference": "ESSAI SYNTHÉTIQUE – aucune observation de terrain", "date": "2026-10-08"}


def fixture():
    tables = {
        "agency.txt": "agency_id,agency_name,agency_url,agency_timezone\n",
        "routes.txt": "route_id,agency_id,route_short_name,route_long_name,route_type\n",
        "trips.txt": "route_id,service_id,trip_id,direction_id,shape_id\n",
        "stops.txt": "stop_id,stop_name,stop_lat,stop_lon,location_type,wheelchair_boarding\n",
        "shapes.txt": "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\n",
        "stop_times.txt": "trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type\n",
        "calendar.txt": "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\nWK,1,1,1,1,1,0,0,20260101,20261231\n",
        "calendar_dates.txt": "service_id,date,exception_type\nWK,20261119,2\nWK,20261122,1\n",
    }
    review = {"version": 1, "public": True, "attribution": "Réseau fictif – QA uniquement", "first_day": "2026-11-18", "last_day": "2026-11-24",
              "directions": [], "links": {"places": [], "footways": []}}
    previous = None
    for i, mode in enumerate(MODES):
        a, b = f"A{i}", f"B{i}"
        x = round(-17.34 + .004 * i, 5)
        start = {"lat": 14.82, "lon": x}
        end = {"lat": 14.82, "lon": round(x + .0035, 5)}
        tables["agency.txt"] += f"{mode},Essai {mode},https://example.invalid/qa,Africa/Dakar\n"
        tables["routes.txt"] += f"R{i},{mode},Q{i},Essai {mode},{2 if mode == 'ter' else 3}\n"
        tables["trips.txt"] += f"R{i},WK,T{i},0,S{i}\n"
        for j, pt in enumerate([start, {"lat": 14.8205, "lon": x + .001}, end], 1):
            tables["shapes.txt"] += f"S{i},{pt['lat']},{pt['lon']},{j}\n"
        bindings = []
        for j, (s, pt, role) in enumerate([(a, start, "board"), (b, end, "alight")]):
            tables["stops.txt"] += f"{s},Essai {s},{pt['lat']},{pt['lon']},0,1\n"
            clock = f"08:{10*i + 5*j:02d}:00"
            tables["stop_times.txt"] += f"T{i},{clock},{clock},{s},{j+1},{j},{1-j}\n"
            review["links"]["places"].append({**pt, "id": f"p{s}", "kind": "platform", "name": f"Quai essai {s}", "evidence": E})
            bindings.append({"role": role, "stepFree": "yes", "stopId": s, "platformId": f"p{s}", "evidence": E})
        review["directions"].append({"id": f"qa{i}", "mode": mode, "agency_id": mode, "route_id": f"R{i}", "direction_id": "0", "shape_id": f"S{i}",
                                     "direction": f"Vers essai {b}", "stop_ids": [a, b], "stepFree": "yes", "evidence": E, "platformBindings": bindings})
        if previous:
            review["links"]["footways"].append({"id": f"w{i}", "from": f"pB{i-1}", "to": f"p{a}", "name": f"Passage essai {i}", "kind": "crossing", "stepFree": "yes",
                                              "transferTiming": {"from": f"pB{i-1}", "to": f"p{a}", "seconds": 55, "evidence": E},
                                              "access": "public", "crossingsAndBarriersChecked": True, "evidence": E,
                                              "positions": [previous, {"lat": 14.82012, "lon": x - .00025}, start]})
        previous = end
    return tables, review


def make_publication(directory, change_tables=None):
    tables, review = fixture()
    if change_tables:
        change_tables(tables)
    root, dataset_id = ApiTestSupport().stage_feed(str(directory), "qa-passenger", tables=tables)
    approve_dataset(root, dataset_id, proof=proof("fatou.ndiaye", "reviewer"), attestations=FULL_ATTESTATIONS, now=NOW)
    published = Path(directory) / "published"
    result = publish_dataset(root, published, dataset_id, proof=proof("ousmane.fall", "publisher"), note="Publication temporaire pour test automatique", now=NOW)
    sid = result["snapshot_id"]
    review.update(snapshot_id=sid, database_sha256=resolve_active_snapshot(published, now=NOW)["snapshot"]["database_sha256"])
    folder = published / REVIEW_DIR
    folder.mkdir()
    path = folder / f"{sid}.json"
    path.write_text(json.dumps(review), encoding="utf-8")
    return published, sid, path, review


def same_position_publication(directory):
    # Distinct trips explicitly call at the same logical stop. That alone would
    # admit NO interchange: also name the physical position and reviewed pair.
    def changes(tables):
        tables['stop_times.txt'] = tables['stop_times.txt'].replace(',A3,1,', ',B2,1,')
        rows = tables['shapes.txt'].splitlines()
        previous = next(r.split(',')[1:3] for r in rows if r.startswith('S2,') and r.endswith(',3'))
        tables['shapes.txt'] = '\n'.join([('S3,' + ','.join(previous) + ',1' if r.startswith('S3,') and r.endswith(',1') else r) for r in rows]) + '\n'
    pub, sid, path, review = make_publication(directory, changes)
    third = review['directions'][3]
    third['stop_ids'][0] = 'B2'
    third['platformBindings'][0].update(stopId='B2', platformId='pB2')
    review['links']['footways'] = []
    review['links']['samePlatformChanges'] = [{
        'platformId': 'pB2', 'minimumSeconds': 300, 'stepFree': 'yes', 'evidence': E,
        'alight': {'directionKey': 'qa2', 'stopId': 'B2'}, 'board': {'directionKey': 'qa3', 'stopId': 'B2'}}]
    path.write_text(json.dumps(review), encoding='utf-8')
    return pub, sid, path, review


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as temp:
        pub, sid, path, review = (same_position_publication if "--same-position" in sys.argv else make_publication)(temp)
        if "--access-only" in sys.argv:
            next(w for w in review['links']['footways'] if w['id'] == 'w3')['onlyFor'] = 'access'
            path.write_text(json.dumps(review), encoding='utf-8')
        edition = passenger_network_payload(pub, {"date": [DAY], "snapshot": [sid]}, now=NOW)
        print(json.dumps({"snapshot": network_payload(pub, now=NOW), "edition": edition} if "--with-snapshot" in sys.argv else edition))
