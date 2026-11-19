"""Read-only check of documentary line occurrences and frozen road extracts against a PBF.

Only the exact code AND a declared family nominate a relation for comparison.
A name match, even unique, is not a platform binding. A missing candidate is
not evidence that a service doesn't operate. This module writes no transit data.
"""
import argparse
import json
import unicodedata
from collections import defaultdict
from pathlib import Path

from scripts.extract_dakar_bus_route_relations_from_pbf import is_stop_member, is_route_way_member


def key(s):
    return ' '.join(''.join(c for c in unicodedata.normalize('NFKD', s.casefold())
                            if not unicodedata.combining(c)).split())


def identity(tags):
    # Explicit ownership first: operator=Aftu, network=Tata denotes ONE
    # relation, not an extra TATA service. Never guess from the route name.
    families = {'dakar dem dikk': 'ddd', 'ddd': 'ddd', 'aftu': 'aftu', 'tata': 'tata'}
    family = families.get(key(tags.get('operator') or tags.get('network') or ''))
    return family, tags.get('ref', '').strip()


def subchain(haystack, needle):
    return bool(needle) and any(haystack[i:i+len(needle)] == needle for i in range(len(haystack)-len(needle)+1))


def compare(inventory, pbf):
    if not inventory['lines'] or not pbf['relations']:
        raise ValueError('Expected a nonempty bus inventory and PBF relation report')
    # Pinned members outside route relations (e.g. the two Jaxaay ways) are
    # checked as road objects, never advertised as members of a bus route.
    pinned = pbf.get('pinnedObjects', {})
    nodes = {n['id']: n for n in pinned.get('nodes', [])}
    ways = {w['id']: w for w in pinned.get('ways', [])}
    relations = {r['id']: r for r in pbf['relations'] if r['tags'].get('type') == 'route'}
    index = defaultdict(list)
    for r in relations.values():
        index[identity(r['tags'])].append(r)
        for m in r['membersInRelationOrder']:
            if m.get('feature') and m['type'] in ('n', 'w'):
                (nodes if m['type'] == 'n' else ways)[m['ref']] = m['feature']

    drift = {'nodes': {}, 'ways': {}, 'relations': {}}
    station_relations = {r['id']: r for r in pinned.get('relations', [])}
    for spec in inventory['pinnedOsm'].get('relations', []):
        rid = spec['id']
        r = station_relations.get(rid)
        if not r or r.get('version') != spec['version']:
            drift['relations'][rid] = 'missing' if not r else 'version'
            continue
        members = [[m['type'], m['ref'], m['role']] for m in r['members']]
        # No inferred adjacency or platform/way correspondence in a stop area.
        if (('members' in spec and sorted(spec['members']) != sorted(members)) or
                any(not subchain(members, pair) for pair in spec.get('sequences', []))):
            drift['relations'][rid] = 'members-or-route-pair'

    for nid, version, lat, lon in inventory['pinnedOsm']['markers']:
        n = nodes.get(nid)
        if not n or (n.get('version'), n.get('lat'), n.get('lon')) != (version, lat, lon):
            drift['nodes'][nid] = 'missing' if not n else 'version-or-position'
    for wid, version, vertices, *expected_oneway in inventory['pinnedOsm']['ways']:
        w = ways.get(wid)
        if not w or w.get('version') != version:
            drift['ways'][wid] = 'missing' if not w else 'version'
            continue
        if expected_oneway:
            tags = w.get('tags') or {}
            default = 'yes' if tags.get('junction') == 'roundabout' else 'no'
            if tags.get('oneway', default) not in (('yes', '1', 'true') if expected_oneway[0] else ('no', '0', 'false')):
                drift['ways'][wid] = 'road-direction'
                continue
        refs, xy = w['nodeRefs'], w['geometry']  # [longitude, latitude]
        if len(refs) != len(xy) or not subchain([[n, y, x] for n, (x, y) in zip(refs, xy)], vertices):
            drift['ways'][wid] = 'source-vertices'

    rows, reviews, assigned = [], [], set()
    for row in inventory['lines']:
        family, code = row['network'], row['code']
        labels = defaultdict(list)
        for source_index, e in enumerate(row['evidence']):
            # Only compare named sequences (not already-derived cartography,
            # historical station IDs, headers or an uncorroborated return).
            if e['kind'] not in ('source-order', 'circuit', 'owner-sequence', 'directional-sheet', 'reader-sheet'):
                continue
            for rank, name in enumerate(e.get('labels', []), 1):
                if name.strip():
                    labels[key(name)].append([source_index, rank])
        candidates = []
        for r in index[family, code]:
            assigned.add(r['id'])
            occurrences = []
            for order, m in enumerate(r['membersInRelationOrder'], 1):
                if not is_stop_member(m['type'], m['role']):
                    continue
                f = m.get('feature') or {}
                name = (f.get('tags') or {}).get('name', '')
                occurrences.append({'memberRank': order, 'role': m['role'], 'type': m['type'], 'id': m['ref'],
                                    'version': f.get('version'), 'name': name or None, 'sameLabel': labels.get(key(name), [])})
            candidates.append({'id': r['id'], 'version': r.get('version'), 'from': r['tags'].get('from'),
                               'to': r['tags'].get('to'), 'occurrences': occurrences})
        rows.append({'network': family, 'code': code, 'relations': candidates})
        for section in (e for e in row['evidence'] if e['kind'] == 'cartographic-section'):
            ids = [int(s.removeprefix('landmark:bus-osm-')) for s in section['markerIds']]
            wids = [abs(i) for i in section['ways']]
            problems = [f'node:{n}' for n in ids if n in drift['nodes']] + [f'way:{w}' for w in wids if w in drift['ways']]
            if 'relation' in section:
                r = relations.get(section['relation'])
                if not r or r.get('version') != section['version'] or identity(r['tags']) != (family, code):
                    problems.append('relation:identity-or-version')
                if r:
                    members = r['membersInRelationOrder']
                    candidates_w = [m['ref'] for m in members if is_route_way_member(m['type'], m['role'])]
                    # Branch reviews (e.g. 40) are not necessarily raw adjacent
                    # members. Platform scopes, by contrast, review a specific run.
                    if section['markerKind'] == 'platform':
                        platforms = [m['ref'] if m['type'] == 'n' and m['role'] == 'platform' else None for m in members if is_stop_member(m['type'], m['role'])]
                        if not subchain(platforms, ids):
                            problems.append('relation:platform-order')
                        if not subchain(candidates_w, wids):
                            problems.append('relation:way-order')
                    elif not set(wids).issubset(candidates_w):
                        problems.append('relation:way-membership')
            reviews.append({'section': section['id'], 'basis': 'route-relation' if 'relation' in section else 'documented-street',
                            'check': 'recheck' if problems else 'pinned-objects-match', 'problems': problems})
    return {'status': 'REVIEW_ONLY', 'source': pbf.get('sourceUrl'), 'sourceSha256': pbf.get('sourceSha256'), 'extractedAt': pbf.get('generatedAt'),
            'attribution': '© OpenStreetMap contributors · ODbL 1.0',
            'ranks': 'sameLabel = [index de la pièce dans evidence (base 0), rang du libellé (base 1)]. Ni fusion ni validation de sens.',
            'lines': rows, 'otherRouteIds': sorted(relations.keys() - assigned), 'memberDrift': drift, 'sections': reviews}


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    for name in ('inventory', 'pbf', 'output'):
        cli.add_argument(name, type=Path)
    args = cli.parse_args()
    report = compare(json.loads(args.inventory.read_text()), json.loads(args.pbf.read_text()))
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f"{len(report['lines'])} codes sources ; {sum(len(r['relations']) for r in report['lines'])} relations attribuées ; "
          f"{len(report['otherRouteIds'])} autres relations. Aucune admission automatique.")
    print('Pinned object discrepancies:', json.dumps(report['memberDrift']))
    for s in report['sections']:
        print(f"{s['section']}: {s['check']} {' '.join(s['problems'])}".rstrip())
