"""Non-publishing comparison of entire directed AFTU map overlays to an OSM PBF.
A diagnostic witness, not map matching for navigation: neither a close road nor
an unbroken candidate chain establishes that a bus serves any particular stop.
"""
import argparse
import hashlib
import heapq
import json
import math
from collections import defaultdict
from pathlib import Path

# Local equirectangular metres at Dakar. QA limits, not walking distances.
SY = math.pi * 6371000 / 180
SX = SY * math.cos(math.radians(14.7))
STEP, OFFSET, CELL = 15, 20, 60
ROADS = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service', 'busway'}


def xy(p):
    return ((p[0]+17.5)*SX, (p[1]-14.7)*SY)


def lanes(tags):
    road = tags.get('highway', '')
    if road.removesuffix('_link') not in ROADS or tags.get('area') == 'yes':
        return ()
    keys = ['bus', 'psv', 'motor_vehicle', 'vehicle', 'access']
    permission = next((tags[k] for k in keys if k in tags), 'yes')
    if permission not in ('yes', 'designated', 'permissive', 'official') or any(k+':conditional' in tags for k in keys + ['oneway', 'oneway:bus', 'oneway:psv']):
        return ()
    implicit = 'yes' if road == 'motorway' or tags.get('junction') == 'roundabout' else 'no'
    direction = tags.get('oneway:bus', tags.get('oneway:psv', tags.get('oneway', implicit)))
    return (1,) if direction in ('yes', 'true', '1') else (-1,) if direction == '-1' else (1, -1) if direction in ('no', 'false', '0') else ()


class Roads:
    def __init__(self):
        self.grid, self.out = defaultdict(list), defaultdict(list)
        self.edges = []

    def add(self, a, b, A, B):
        dx, dy = B[0]-A[0], B[1]-A[1]
        length = math.hypot(dx, dy)
        if not length or a == b:
            return
        k = len(self.edges)
        self.edges.append((a, b, *A, dx, dy, length))
        self.out[a].append((b, length))
        n = math.ceil(length/(CELL/2))
        for cell in {(math.floor((A[0]+dx*i/n)/CELL), math.floor((A[1]+dy*i/n)/CELL)) for i in range(n+1)}:
            self.grid[cell].append(k)

    def candidates(self, x, y, hx, hy):
        ix, iy = math.floor(x/CELL), math.floor(y/CELL)
        edges = {k for i in range(ix-1, ix+2) for j in range(iy-1, iy+2) for k in self.grid.get((i, j), ())}
        out = {}
        for k in edges:
            _, _, ax, ay, dx, dy, length = self.edges[k]
            if dx*hx+dy*hy < 0.5*length:  # differ by more than 60 degrees
                continue
            t = max(0, min(1, ((x-ax)*dx+(y-ay)*dy)/(length*length)))
            if math.hypot(x-ax-t*dx, y-ay-t*dy) <= OFFSET:
                out[k] = length*t
        return out

    def advance(self, previous, candidates, limit):
        # One continuous directed witness must survive ALL probes. Nearby ways
        # with equal coordinates but different node IDs cannot exchange states.
        reachable = {k: s for k, s in candidates.items() if k in previous and 0 <= s-previous[k] <= limit}
        if len(reachable) == len(candidates):
            return reachable
        best, queue = {}, []
        for k, s in previous.items():
            _, end, *_, length = self.edges[k]
            cost = length-s
            if cost <= limit and cost < best.get(end, math.inf):
                best[end] = cost
                heapq.heappush(queue, (cost, end))
        while queue:
            cost, n = heapq.heappop(queue)
            if best[n] != cost:
                continue
            for other, length in self.out.get(n, ()):
                c = cost+length
                if c <= limit and c < best.get(other, math.inf):
                    best[other] = c
                    heapq.heappush(queue, (c, other))
        reachable.update((k, s) for k, s in candidates.items() if best.get(self.edges[k][0], math.inf)+s <= limit)
        return reachable


def fit(points, graph):
    if len(points) < 2:
        raise ValueError('Missing source line')
    frontier, failures, prev, probes = {}, defaultdict(set), None, 0
    for rank, (a, b) in enumerate(zip(points, points[1:]), 1):
        dx, dy = b[0]-a[0], b[1]-a[1]
        length = math.hypot(dx, dy)
        if not length:
            continue
        count = math.ceil(length/STEP)
        for i in range(0 if prev is None else 1, count+1):
            at = (a[0]+i*dx/count, a[1]+i*dy/count)
            possible = graph.candidates(*at, dx/length, dy/length)
            if not possible:
                failures['NO_DIRECTED_ROAD'].add(rank)
            elif frontier:
                next_states = graph.advance(frontier, possible, math.dist(at, prev)+2*OFFSET)
                if next_states:
                    possible = next_states
                else:
                    failures['BROKEN_CHAIN'].add(rank)
            frontier, prev = possible, at  # restart at a failure; it remains recorded
            probes += 1
    return {'probes': probes, 'gaps': {k: sorted(v) for k, v in failures.items()}, 'possible': bool(probes) and not failures}


def read_pbf(path):
    import osmium
    graph = Roads()

    class Collector(osmium.SimpleHandler):
        def way(self, w):
            signs = lanes(dict(w.tags))
            if not signs:
                return
            prev = None
            for n in w.nodes:
                loc = n.location
                cur = (n.ref, xy((loc.lon, loc.lat))) if loc.valid() and -17.60 <= loc.lon <= -17.05 and 14.50 <= loc.lat <= 14.95 else None
                if prev and cur:
                    for sign in signs:
                        (a, A), (b, B) = (prev, cur) if sign == 1 else (cur, prev)
                        graph.add(a, b, A, B)
                prev = cur
    Collector().apply_file(str(path), locations=True)
    if not graph.edges:
        raise ValueError('No roads in Dakar extent')
    return graph


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    for name in ('pbf', 'maps', 'output'):
        cli.add_argument(name, type=Path)
    args = cli.parse_args()
    graph = read_pbf(args.pbf)
    pbf_sha = hashlib.file_digest(args.pbf.open('rb'), 'sha256').hexdigest()
    rows = []
    for file in sorted(args.maps.glob('*.json')):
        source = json.loads(file.read_text())
        r = {'line': file.stem, 'shapeHash': source['shapeHash'], 'orientation': source['orientation']}
        if r['orientation']:
            pts = [xy(p) for p in source['positions']]
            r.update(fit(pts if r['orientation'] == 'start-first' else pts[::-1], graph))
        rows.append(r)
    args.output.write_text(json.dumps({'sha256': pbf_sha, 'relationsAndTurnRestrictionsChecked': False, 'rows': rows}, indent=2)+'\n')
    # Compact transport receipt; full ranked gaps stay in the audit artifact.
    brief = [[r['line'], r['orientation'], r.get('probes'), {k: [len(v), v[:5]] for k,v in r.get('gaps', {}).items()}, r.get('possible')] for r in rows]
    print('::notice title=Voirie Sénégal::'+pbf_sha)
    for i in range(0,len(rows),15):
        print('::notice title=Ajustement AFTU::'+json.dumps(brief[i:i+15], separators=(',',':')))
