"""Compare a reported departure MINUTE to the pinned archives, not a trip match.
Also check every historical occurrence at Ponty and Colobane by literal stop ID.
No archive clock, date or coordinate is exported as passenger service.
"""
import argparse
import hashlib
import json
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

from scripts.audit_terminal_calls import occurrences
from scripts.compare_bus_occurrences import DIGEST, calendar_bounds, tables

TARGETS = {
    'ddd': {'DDD_218': {'D_23', 'D_686'}, 'DDD_01': {'D_122', 'D_128'}, 'DDD_07': {'D_122', 'D_128'}},
    'aftu': {'AFTU_73': {'A_559', 'A_586', 'A_266'}, 'AFTU_75': {'A_1564'}, 'AFTU_65': {'A_1564'}},
}


def seconds(value):
    h, m, s = map(int, value.split(':'))
    if h < 0 or not 0 <= m < 60 or not 0 <= s < 60:
        raise ValueError('Heure GTFS invalide')
    return h * 3600 + m * 60 + s


def inspect(z, family, minutes):
    specs = TARGETS[family]
    labels = {r['stop_id']: r['stop_name'] for r in tables(z, 'stops')}
    trips = {t['trip_id']: t for t in tables(z, 'trips') if t['route_id'] in specs}
    by_trip = defaultdict(list)
    for r in tables(z, 'stop_times'):
        if r['trip_id'] in trips:
            by_trip[r['trip_id']].append(r)
    groups = defaultdict(list)
    for tid, t in trips.items():
        seq = sorted(by_trip[tid], key=lambda r: int(r['stop_sequence']))
        route = t['route_id']
        status, hits = occurrences(seq, specs[route])
        if status in ('TIED_RANKS', 'NO_JOINED_CALLS'):
            raise ValueError(f'{tid}: {status} (ne pas traiter une donnée manquante comme une absence)')
        a, b = seq[0], seq[-1]
        key = route, t['direction_id'], t['shape_id'], len(seq), a['stop_id'], b['stop_id'], hits
        departure = seconds(a['departure_time'])
        groups[key].append((departure, seconds(b['arrival_time']) - departure))
    if {key[0] for key in groups} != specs.keys():
        raise ValueError('Ligne absente')
    result = {}
    for (route, direction, shape, n, start, end, hits), rows in sorted(groups.items(), key=lambda e: repr(e[0])):
        services = {t['service_id'] for t in trips.values() if t['route_id'] == route}
        last, exception = calendar_bounds(z, services)
        row = result.setdefault(route, {'lastRegularDate': last, 'lastException': exception, 'variants': []})
        tally = Counter(f'{sec // 3600:02d}:{sec // 60 % 60:02d}' for sec, _ in rows)
        durations = [d for _, d in rows]
        if min(durations) < 0:
            raise ValueError(f'Durée historique négative : {shape}')
        row['variants'].append({
            'directionId': direction, 'shape': shape, 'trips': len(rows), 'callCount': n,
            'first': [start, labels[start]], 'last': [end, labels[end]],
            'occurrences': [[sid, rank, before, after] for sid, rank, before, after, _, _ in hits],
            **({'originsInReportedMinutes': {clock: tally[clock] for clock in minutes[route]},
                'archivedDurationSeconds': [min(durations), max(durations)]} if route in minutes else {}),
        })
    return result


def report(ddd, aftu, packet):
    minutes = {f"{line['family'].upper()}_{line['code']}": sorted({d['referenceDeparture'] for d in line['directions']}
               | ({line['otherStartMention']} if line['otherStartMention'] else set())) for line in packet['lines']}
    result = {}
    for family, path in [('ddd', ddd), ('aftu', aftu)]:
        with path.open('rb') as f:
            if hashlib.file_digest(f, 'sha256').hexdigest() != DIGEST[family]:
                raise ValueError(f'Archive non relue : {family}')
        with zipfile.ZipFile(path) as z:
            result.update(inspect(z, family, minutes))
    return {'scope': 'HISTORICAL_COMPARISON_ONLY', 'reportedSummary': packet['summaryUrl'], 'archiveSha256': DIGEST,
            'occurrenceColumns': ['stopId', 'rank', 'previousStopId', 'nextStopId'], 'routes': result}


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('ddd', type=Path)
    cli.add_argument('aftu', type=Path)
    args = cli.parse_args()
    packet = json.loads(Path('data/bus-review/reported-218-73.json').read_text())
    print(json.dumps(report(args.ddd, args.aftu, packet), indent=2, ensure_ascii=False))
