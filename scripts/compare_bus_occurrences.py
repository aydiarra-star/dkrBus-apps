"""Read-only comparison of ALL trips in two pinned, expired PassBi archives.

Never publishes coordinates, transfers, calendars or shapes. A match is between
ordered occurrence lists, not between services. GTFS direction_id has no
outbound/inbound semantics across publishers. No fuzzy geographic assignment.
"""
import argparse
import csv
import difflib
import hashlib
import io
import json
import re
import unicodedata
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

DIGEST = {'aftu': '7fae6b438de6177ff1d777546684e83c8882927b67efa4645dbecca3d77af428',
          'ddd': '578323c9fa4375313d57c4120071da3d0da499eb9216e5a4a22a28ffae707159'}


def label(s):
    # Remove only the editorial endpoint role, not the word Terminus, a number,
    # a landmark qualifier, or a repeated occurrence. Keep undecodable text.
    s = re.sub(r'\s*\((départ|terminus)\)\s*$', '', s.strip(), flags=re.I)
    return ' '.join(re.findall(r'[^\W_]+', ''.join(c for c in unicodedata.normalize('NFKD', s.casefold()) if not unicodedata.combining(c))))


def alignment(expected, actual):
    a, b = list(map(label, expected)), list(map(label, actual))
    blocks = difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks()
    count = sum(k for _, _, k in blocks)
    return {'expectedCount': len(a), 'archiveCount': len(b), 'aligned': count,
            'sameStart': a[0] == b[0], 'sameEnd': a[-1] == b[-1], 'exactOrder': a == b,
            'verbatimInComparedOrder': tuple(expected) == tuple(actual),
            # 1-based source/archived occurrence ranks, not a stop-ID crosswalk.
            'matchingRuns': [[i + 1, j + 1, k] for i, j, k in blocks if k]}


def tables(z, table):
    with z.open(table + '.txt') as raw, io.TextIOWrapper(raw, encoding='utf-8-sig', newline='') as stream:
        yield from csv.DictReader(stream)


# File-order occurrence ranks (1-based) in the two pinned archives. Seeds
# live in separate agency namespaces. None of these IDs is a current platform.
SHARED_SEEDS = {
    'aftu': [('Jaxaay vers ASECNA', 'AFTU_74_bargny', 33, 6), ('Jaxaay vers Sédima', 'AFTU_74_SOCABECK', 52, 6),
             ('Maristes vers Front de Terre', 'AFTU_40_Mbao', 42, 4), ('Maristes vers le giratoire', 'AFTU_40_Petersen', 7, 4),
             ('Université vers Médina', 'AFTU_3_Yoff', 47, 11)],
    'ddd': [('Maristes vers Front de Terre', 'DDD_232_BAUX-MARAICHERS', 11, 3), ('Maristes vers le giratoire', 'DDD_232_AEROPORT', 25, 3),
            ('Université vers Médina', 'DDD_08_AEROPORT-LSS', 35, 6)],
}


def shared_blocks(variants, seeds):
    """All literal consecutive ID matches, including repeated occurrences. No
    fuzzy join, sorting by name, cross-agency comparison or implied return."""
    result = []
    for name, shape, first, length in seeds:
        blocks = {ids[first-1:first-1+length] for m, ids in variants if m['shapeId'] == shape and not m['issues']
                  and first > 0 and length > 1 and first-1+length <= len(ids)}
        row = {'name': name, 'seedShape': shape, 'first': first, 'length': length, 'matches': []}
        if len(blocks) != 1:
            row['status'] = 'SEED_MISSING_OR_AMBIGUOUS'
        else:
            row['status'] = 'ARCHIVE_ONLY'
            needle = blocks.pop()
            row['blockSha256'] = hashlib.sha256(json.dumps(needle).encode()).hexdigest()
            for m, ids in variants:
                for i in range(len(ids) - length + 1):
                    if ids[i:i+length] == needle:
                        row['matches'].append({k: m[k] for k in ('code', 'shapeId', 'directionId', 'sequenceHash', 'issues', 'rankTies')} |
                                              {'first': i + 1, 'last': i + length})
        result.append(row)
    return result


def patterns(z, network, *, visit_variant=None):
    routes = {}
    for r in tables(z, 'routes'):
        rid = r['route_id']
        prefix = network.upper() + '_'
        if r['agency_id'] != network.upper() or not rid.startswith(prefix):
            raise ValueError('Unexpected agency or route identifier: ' + rid)
        code = re.sub('^0+(?=[0-9])', '', rid[len(prefix):])  # preserve suffixes
        routes[rid] = code
    stops = {r['stop_id']: r['stop_name'] for r in tables(z, 'stops')}
    trips = {}
    for row in tables(z, 'trips'):
        tid = row['trip_id']
        if tid in trips:
            raise ValueError('Duplicate trip_id: ' + tid)
        trips[tid] = (routes[row['route_id']], row['direction_id'], row['shape_id'])
    shape_points = Counter(r['shape_id'] for r in tables(z, 'shapes'))
    calls = defaultdict(list)
    for r in tables(z, 'stop_times'):
        calls[r['trip_id']].append((int(r['stop_sequence']), r['stop_id']))
    groups, missing = Counter(), Counter()
    for tid, key in trips.items():
        # Stable sorting is important: tied ranks are an anomaly. We can
        # compare the file order as evidence, NEVER break a tie by stop_id.
        seq = sorted(calls.pop(tid, ()), key=lambda p: p[0])
        if not seq:
            missing[key] += 1
            continue
        ranks, ids = zip(*seq)
        duplicate_ranks = tuple(i for i, n in Counter(ranks).items() if n > 1)
        issues = tuple(n for n, cond in [('DUPLICATE_RANK', duplicate_ranks), ('SHORT_TRIP', len(seq) < 2),
                                          ('UNKNOWN_STOP', any(s not in stops for s in ids))] if cond)
        groups[(*key, ids, duplicate_ranks, issues)] += 1
    by_code, variants, ordered_ids = defaultdict(list), [], []
    for (code, direction, shape, ids, ties, issues), n in sorted(groups.items()):
        names = [stops.get(s, '') for s in ids]
        meta = {'code': code, 'directionId': direction, 'shapeId': shape, 'shapePoints': shape_points[shape],
                'trips': n, 'occurrences': len(ids), 'distinctStopIds': len(set(ids)),
                'distinctLabels': len(set(map(label, names))), 'rankTies': list(ties), 'issues': list(issues),
                'sequenceHash': hashlib.sha256(json.dumps(ids).encode()).hexdigest()}
        if visit_variant:
            visit_variant(meta, ids)
        variants.append(meta)
        ordered_ids.append((meta, ids))
        if 'UNKNOWN_STOP' not in issues:
            by_code[code].append((meta, names))
    return by_code, {'routes': sorted(routes.values()), 'trips': len(trips), 'variants': variants,
                     'sharedIdBlocks': shared_blocks(ordered_ids, SHARED_SEEDS.get(network, [])),
                     'validOrderGroups': sum(not v['issues'] for v in variants),
                     'tripsWithoutCalls': [dict(code=k[0], directionId=k[1], shapeId=k[2], trips=v)
                                          for k, v in sorted(missing.items())],
                     'orphanCallGroups': len(calls), 'orphanCalls': sum(map(len, calls.values())),
                     'lastCalendarEnd': max((r['end_date'] for r in tables(z, 'calendar')), default=None)}


def compare(inventory, archives):
    report = {'status': 'HISTORICAL_COMPARISON_ONLY', 'archives': {}, 'lines': []}
    sources = {}
    for network, path in archives.items():
        with path.open('rb') as raw:
            if hashlib.sha256(raw.read()).hexdigest() != DIGEST[network]:
                raise ValueError('Archive fingerprint mismatch: ' + network)
        with zipfile.ZipFile(path) as z:
            sources[network], stats = patterns(z, network)
        report['archives'][network] = {'sha256': DIGEST[network], **stats}
    for network, archive in report['archives'].items():
        current = {r['code'] for r in inventory['lines'] if r['network'] == network}
        archive['archiveOnlyCodes'] = sorted(set(archive['routes']) - current)
    for r in inventory['lines']:
        network, code = r['network'], r['code']
        # The archive is AFTU, not independent evidence for TATA by number.
        candidates = sources.get(network, {}).get(code, [])
        sequences = defaultdict(list)
        for e in r['evidence']:
            if e.get('labels') and e['kind'] in ('owner-sequence', 'directional-sheet', 'source-order', 'circuit', 'reader-sheet'):
                sequences[(e['side'], tuple(e['labels']))].append(e['source'])
        results = []
        for (side, names), refs in sequences.items():
            matches = []
            for meta, other in candidates:
                match = alignment(names, other)
                if meta['issues']:
                    # Not even an exact file-order match resolves tied GTFS ranks.
                    match['sameLabelsInFileOrder'] = match.pop('exactOrder')
                matches.append({**meta, **match})
            results.append({'side': side, 'sources': sorted(set(refs)), 'first': names[0], 'last': names[-1], 'count': len(names),
                            'comparisons': matches})
        report['lines'].append({'network': network, 'code': code, 'archivePatterns': len(candidates), 'sequences': results})
    return report


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    for field in ['inventory', 'ddd', 'aftu', 'output']:
        cli.add_argument('--' + field, required=True, type=Path)
    args = cli.parse_args()
    payload = compare(json.loads(args.inventory.read_text()), {'ddd': args.ddd, 'aftu': args.aftu})
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    print('Comparison only:', len(payload['lines']), 'line identities;', {k: len(v['variants']) for k, v in payload['archives'].items()}, 'historical patterns. No passenger data imported.')
