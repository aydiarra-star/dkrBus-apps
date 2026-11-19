"""Review *entire* bus relations, not only pinned sections. No snapping, inferred
return, shortest-road substitution, or publication. All ranks are one-based.
Input is the versioned regional PBF extractor's JSON, including missing members.
"""
import argparse
import json
import math
from pathlib import Path

from scripts.audit_bus_osm_occurrences import identity
from scripts.extract_dakar_bus_route_relations_from_pbf import is_route_way_member, is_stop_member


def directions(member):
    tags = (member.get('feature') or {}).get('tags', {})
    if any(k in tags for k in ('oneway:conditional', 'oneway:bus:conditional', 'oneway:psv:conditional')):
        return set()
    implicit = 'yes' if tags.get('junction') == 'roundabout' or tags.get('highway') == 'motorway' else 'no'
    rule = tags.get('oneway:bus', tags.get('oneway:psv', tags.get('oneway', implicit)))
    allowed = {1} if rule in ('yes', 'true', '1') else {-1} if rule == '-1' else {-1, 1} if rule in ('no', 'false', '0') else set()
    return allowed & {'forward': {1}, 'backward': {-1}}.get(member['role'].casefold(), {-1, 1})


def reachable_exits(member, refs, entries, exits):
    """A real shared interior node is a possible junction. A ring can wrap in
    the permitted sense. A point-touch cannot consume an ordinary whole way."""
    signs = directions(member)
    ring = len(refs) > 2 and refs[0] == refs[-1]
    return {b for i, a in enumerate(refs) if a in entries for j, b in enumerate(refs) if b in exits and a != b and
            (bool(signs) if ring else (1 if j > i else -1) in signs)}


def road_review(roads):
    ways = [(m.get('feature') or {}).get('nodeRefs') or [] for m in roads]
    breaks, cuts = [], []
    for i, (left, right) in enumerate(zip(ways, ways[1:])):
        cuts.append(set(left).intersection(right))
        if not cuts[-1]:
            breaks.append({'after': i+1, 'ways': [roads[i]['ref'], roads[i+1]['ref']],
                           'issue': 'DISJOINT_IDS' if left and right else 'MISSING_MEMBER'})
    reachable, conflicts = set(), []
    for i, (member, refs) in enumerate(zip(roads, ways)):
        if len(refs) < 2:
            reachable = set()
            continue
        # First/last endpoints of a broken component are *unconstrained*,
        # not forced to the digitised ends of a ring or to an invented stop.
        entries = reachable if i and cuts[i-1] else set(refs)
        exits = cuts[i] if i < len(cuts) and cuts[i] else set(refs)
        reachable = reachable_exits(member, refs, entries, exits)
        if not reachable:
            conflicts.append({'rank': i+1, 'way': member['ref'], 'issue': 'NO_POSITIVE_DIRECTED_TRAVERSAL'})
            reachable = exits  # continue testing after the reported failure
    return breaks, conflicts


def nearest_offset(node, roads):
    # Local tangent plane at platform latitude; only compares THIS relation's
    # own road segments. Distances cannot assign a stop, order or carriageway.
    scale = math.pi * 6371000 / 180
    sx, sy = scale * math.cos(math.radians(node['lat'])), scale
    best = None
    for rank, m in enumerate(roads, 1):
        xy = (m.get('feature') or {}).get('geometry') or []
        for (ax, ay), (bx, by) in zip(xy, xy[1:]):
            x, y = (node['lon']-ax)*sx, (node['lat']-ay)*sy
            dx, dy = (bx-ax)*sx, (by-ay)*sy
            if dx == dy == 0:
                continue
            t = max(0, min(1, (x*dx + y*dy)/(dx*dx+dy*dy)))
            candidate = (math.hypot(x-t*dx, y-t*dy), rank, m['ref'])
            if best is None or candidate < best:
                best = candidate
    return best


def review(relation):
    ms, tags = relation['membersInRelationOrder'], relation['tags']
    roads = [m for m in ms if is_route_way_member(m['type'], m['role'])]
    stops = [m for m in ms if is_stop_member(m['type'], m['role'])]
    unknown = [i for i, m in enumerate(ms, 1) if m['type'] == 'w' and m not in roads and m not in stops]
    missing = [i for i, m in enumerate(roads, 1) if len((m.get('feature') or {}).get('nodeRefs', [])) < 2]
    breaks, conflicts = road_review(roads)
    offsets = []
    for i, m in enumerate(stops, 1):
        f = m.get('feature') or {}
        coords = (f.get('lat'), f.get('lon'))
        located = all(type(v) in (int, float) and math.isfinite(v) and abs(v) <= bound
                      for v, bound in zip(coords, (90, 180)))
        offset = nearest_offset(f, roads) if m['type'] == 'n' and located else None
        offsets.append({'rank': i, 'id': m['ref'], 'role': m['role'], 'closestWayRank': offset[1] if offset else None,
                        'closestWayId': offset[2] if offset else None, 'offsetM': round(offset[0], 2) if offset else None,
                        'outside20m': offset[0] > 20 if offset else None})
    return {'id': relation['id'], 'version': relation['version'], 'identity': identity(tags), 'from': tags.get('from'), 'to': tags.get('to'),
            'ways': len(roads), 'stops': len(stops), 'breaks': breaks, 'directionConflicts': conflicts, 'unknownWayRoles': unknown,
            'missingRoads': missing, 'offsets': offsets, 'orderedRoadChainPossible': bool(roads) and not any((breaks, conflicts, unknown, missing))}


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    for arg in ('input', 'output'):
        cli.add_argument(arg, type=Path)
    cli.add_argument('--ci-summary', action='store_true')
    args = cli.parse_args()
    data = json.loads(args.input.read_text())
    rows = [review(r) for r in data['relations'] if r['tags'].get('type') == 'route' and identity(r['tags'])[0]]
    out = {'source': data['sourceUrl'], 'sha256': data['sourceSha256'], 'attribution': '© OpenStreetMap contributors · ODbL 1.0',
           'status': 'DIAGNOSTIC_ONLY', 'relations': rows}
    args.output.write_text(json.dumps(out, ensure_ascii=False, indent=2)+'\n')
    if args.ci_summary:
        print('::notice title=Empreinte continuité::'+out['sha256'])
        # Actions only retains ten notices per step. The artifact contains all
        # ranks; these per-relation measurements also fit in the check summary.
        brief = [{'id': r['id'], 'version': r['version'], 'identity': r['identity'], 'from': r['from'], 'to': r['to'],
                  'ways': r['ways'], 'stops': r['stops'], 'breaks': [b['after'] for b in r['breaks']],
                  'directionConflicts': [b['rank'] for b in r['directionConflicts']], 'missingRoads': r['missingRoads'],
                  'unknownWayRoles': r['unknownWayRoles'], 'orderedRoadChainPossible': r['orderedRoadChainPossible'],
                  'outside': [[s['rank'], s['offsetM']] for s in r['offsets'] if s['outside20m']],
                  'unmeasured': [s['rank'] for s in r['offsets'] if s['offsetM'] is None]} for r in rows]
        print('::notice title=Nombre de relations bus::'+str(len(brief)))
        for i in range(0, len(brief), 4):
            print('::notice title=Continuité bus::'+json.dumps(brief[i:i+4], ensure_ascii=False, separators=(',', ':')).replace('%', '%25'))
