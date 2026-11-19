"""Relative running profiles for the display model, NOT routable data.

From two pinned expired archives retain only aggregate elapsed seconds and
relative distance shares. Exact ordered owner occurrence list, one unambiguous
stop-ID pattern and no tied ranks required. Never export an origin departure,
coordinate, calendar, shape or stop ID. See docs/modeles-passages-bus.md.
"""
import argparse
import hashlib
import json
import math
import statistics
import zipfile
from collections import defaultdict
from pathlib import Path

from scripts.compare_bus_occurrences import DIGEST, label, tables


def profile(samples, names):
    # One bad/ambiguous variant must not be cherry-picked away.
    if (not samples or len(names) < 2 or len({s[0] for s in samples}) != 1 or
            any(s[1] is None or len(s[0]) != len(names) or len(s[1][1]) != len(names) for s in samples)):
        return None
    runs = [s[1] for s in samples]
    data = json.dumps(names, ensure_ascii=False, separators=(',', ':')).encode()
    # Cheap sync guard for immutable bundled arrays. SHA-256 checked in CI.
    check = 2166136261
    for b in data:
        check = ((check ^ b) * 16777619) & 0xffffffff
    return dict(count=len(names), sequenceSha256=hashlib.sha256(data).hexdigest(), sequenceCheck=check,
                trips=len(runs), medianSeconds=round(statistics.median(r[0] for r in runs)),
                perMille=[round(statistics.median(v)) for v in zip(*(r[1] for r in runs))])


def measurement(rows):
    def seconds(value):
        h, m, s = map(int, value.split(':'))
        if not (0 <= h < 48 and 0 <= m < 60 and 0 <= s < 60):
            raise ValueError('Invalid elapsed-time input')
        return h*3600+m*60+s
    try:
        ranks = [int(r['stop_sequence']) for r in rows]
        distances = [float(r['shape_dist_traveled']) for r in rows]
        times = [(seconds(r['arrival_time']), seconds(r['departure_time'])) for r in rows]
    except (ValueError, TypeError, KeyError):
        return None
    if (len(rows) < 2 or sorted(set(ranks)) != ranks or not all(map(math.isfinite, distances)) or
            distances != sorted(distances) or distances[-1] <= distances[0] or
            any(a > d or (i and a < times[i-1][1]) for i, (a, d) in enumerate(times))):
        return None
    duration = times[-1][0] - times[0][1]
    if not 0 < duration < 86400:
        return None
    return duration, [1000*(d-distances[0])/(distances[-1]-distances[0]) for d in distances]


def extract(network, archive, inventory):
    if hashlib.sha256(archive.read_bytes()).hexdigest() != DIGEST[network]:
        raise ValueError('Unreviewed archive: ' + network)
    expected = {}
    for line in inventory['lines']:
        if line['network'] != network:
            continue
        for e in line['evidence']:
            if e['kind'] == 'owner-sequence' and e['side'] in ('outbound', 'inbound'):
                key = network + ':' + line['code'] + ':' + e['side']
                if key in expected and expected[key] != e['labels']:
                    raise ValueError('Conflicting owner sequences: ' + key)
                expected[key] = e['labels']
    matching = {(key.split(':')[1], tuple(map(label, names))): key for key, names in expected.items()}
    if len(matching) != len(expected):
        raise ValueError('Ambiguous owner directions')
    samples = defaultdict(list)
    with zipfile.ZipFile(archive) as z:
        routes = {r['route_id']: r['route_id'].split('_', 1)[1].lstrip('0') for r in tables(z, 'routes') if r['agency_id'] == network.upper()}
        codes = {code for code, _ in matching}
        trips = {r['trip_id']: routes[r['route_id']] for r in tables(z, 'trips') if routes.get(r['route_id']) in codes}
        labels = {r['stop_id']: label(r['stop_name']) for r in tables(z, 'stops')}
        calls = defaultdict(list)
        for r in tables(z, 'stop_times'):
            if r['trip_id'] in trips:
                calls[r['trip_id']].append(r)
        for tid, rows in calls.items():
            rows.sort(key=lambda r: int(r['stop_sequence']))
            ids = tuple(r['stop_id'] for r in rows)
            key = matching.get((trips[tid], tuple(labels[i] for i in ids)))
            if key:
                samples[key].append((ids, measurement(rows)))
    return {key: p for key in sorted(samples) if (p := profile(samples[key], expected[key]))}


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    for field in ('inventory', 'ddd', 'aftu', 'output'):
        cli.add_argument('--' + field, type=Path, required=True)
    args = cli.parse_args()
    inventory = json.loads(args.inventory.read_text())
    profiles = {k: v for n in ('ddd', 'aftu') for k, v in extract(n, getattr(args, n), inventory).items()}
    args.output.write_text(json.dumps(profiles, ensure_ascii=False, indent=2) + '\n')
