"""Survey the *boundary* of the Colobane bus station and the two Ponty poles.

Read original shared OSM vertex IDs in small stated windows. No snapping,
implicit movement across a polygon, door assignments, walking times or trips.
A marked entrance, bridge or crossing in the window need not serve either line.
"""
import argparse
import hashlib
import json
from collections import defaultdict
from pathlib import Path

from scripts.audit_interchange_sites import distance, foot_directions, reachable, trace
from scripts.bus_change_candidates import platform_members

WINDOWS = {  # west, south, east, north (lon, lat), discovery only
    'colobane': (-17.446, 14.694, -17.438, 14.704),
    'ponty': (-17.438, 14.6665, -17.4305, 14.672),
}
BUS_AREA = 599927187
PONTY = (4666430941, 711879280)  # two distinct documentary targets
CAP = 700  # path-search limit, not a permitted transfer distance
KEYS = ('name', 'ref', 'railway', 'highway', 'public_transport', 'bus', 'train', 'amenity',
        'entrance', 'barrier', 'access', 'foot', 'foot:access', 'oneway:foot', 'crossing', 'bridge', 'layer')


def restricted(tags):
    return bool(tags.get('barrier')) or any('conditional' in k for k in tags) or any(
        tags.get(k) not in (None, 'yes', 'designated', 'permissive') for k in ('access', 'foot', 'foot:access'))


class Window:
    def __init__(self):
        self.xy, self.blocked = {}, set()
        self.graph, self.touch = defaultdict(list), defaultdict(set)
        self.features, self.walk_ways = {}, {}

    def feature(self, key, version, kind, refs, tags):
        self.features[key] = dict(kind=kind, version=version, vertices=sorted(set(refs)),
                                  tags={k: tags[k] for k in KEYS if k in tags}, routeCalls=[])

    def node(self, nid, version, xy, tags):
        self.xy[nid] = xy
        if restricted(tags):
            self.blocked.add(nid)
        if nid in PONTY:
            kind = 'ponty-pole'
        elif nid in (10245681535, 9373889212, 560521498):
            kind = 'station-reference-not-door'
        elif tags.get('railway') == 'platform' or (tags.get('public_transport') == 'platform' and tags.get('train') == 'yes'):
            kind = 'rail-platform'
        elif tags.get('entrance') not in (None, 'no') or tags.get('barrier') in ('gate', 'lift_gate', 'turnstile'):
            kind = 'entrance-or-control'
        elif tags.get('highway') == 'crossing':
            kind = 'crossing'
        else:
            return
        self.feature(f'n{nid}', version, kind, [nid], tags)

    def way(self, wid, version, refs, tags):
        local = [n for n in refs if n in self.xy]
        if not local:
            return
        if wid == BUS_AREA:
            self.feature(f'w{wid}', version, 'bus-station-boundary', local, tags)
        elif tags.get('railway') == 'platform' or (tags.get('public_transport') == 'platform' and tags.get('train') == 'yes'):
            self.feature(f'w{wid}', version, 'rail-platform', local, tags)
        signs = foot_directions(tags)
        if not signs or restricted(tags):
            return
        for a, b in zip(refs, refs[1:]):
            if a == b or a not in self.xy or b not in self.xy or a in self.blocked or b in self.blocked:
                continue  # no joining across an omitted/restricted vertex
            length = distance(self.xy[a], self.xy[b])
            self.walk_ways[wid] = [version, tags['highway'], tags.get('bridge'), tags.get('oneway:foot')]
            self.touch[a].add(wid); self.touch[b].add(wid)
            for direction in signs:
                start, end = (a, b) if direction == 1 else (b, a)
                self.graph[start].append((end, length, wid))

    def read(self):
        # Targets are individual vertices on the geometry, not an area centre.
        # Do not create an edge between the vertices of a feature.
        rows = {key: {k: v for k, v in f.items() if k != 'vertices'} | {
            'contacts': [[n, sorted(self.touch[n])] for n in f['vertices'] if self.touch.get(n)]}
                for key, f in sorted(self.features.items())}
        focus = [k for k, f in rows.items() if f['kind'] in ('ponty-pole', 'bus-station-boundary')]
        targets = [k for k, f in rows.items() if f['kind'] in ('crossing', 'rail-platform', 'entrance-or-control')]
        paths = []
        for start in set(focus + targets):
            if not rows[start]['contacts']:
                continue
            dist, prev = reachable(self.features[start]['vertices'], self.graph, CAP)
            for end in (focus + targets if start in focus else focus):
                if end == start:
                    continue
                match = min(((dist[n], n) for n, _ in rows[end]['contacts'] if n in dist), default=None)
                if match:
                    paths.append([start, end, *trace(match[1], dist, prev)])
        return {'features': rows, 'boundedDirectedPaths': sorted(paths), 'dedicatedWays': self.walk_ways}


def read_pbf(pbf):
    import osmium
    sites = {key: Window() for key in WINDOWS}
    for n in osmium.FileProcessor(str(pbf), osmium.osm.NODE):
        if n.location.valid():
            lat, lon = n.location.lat, n.location.lon
            for k, (w, s, e, north) in WINDOWS.items():
                if w <= lon <= e and s <= lat <= north:
                    sites[k].node(n.id, n.version, (lat, lon), dict(n.tags))
    for w in osmium.FileProcessor(str(pbf), osmium.osm.WAY):
        if w.id != BUS_AREA and not any(w.tags.get(k) for k in ('railway', 'public_transport', 'highway')):
            continue
        refs = [n.ref for n in w.nodes]
        for site in sites.values():
            if any(n in site.xy for n in refs):
                site.way(w.id, w.version, refs, dict(w.tags))
    for r in osmium.FileProcessor(str(pbf), osmium.osm.RELATION).with_filter(osmium.filter.KeyFilter('route')):
        for site in sites.values():
            for c in platform_members(r, site.features):
                site.features[c['pole']]['routeCalls'].append(c)
    with pbf.open('rb') as f:
        digest = hashlib.file_digest(f, 'sha256').hexdigest()
    return {'scope': 'SURVEY_ONLY_NOT_PASSENGER_PATHS', 'attribution': '© OpenStreetMap contributors · ODbL 1.0',
            'pbfSha256': digest, 'boundsWSEN': WINDOWS, 'limitMeters': CAP,
            'pathColumns': ['fromFeature', 'toFeature', 'lengthBetweenMappedVerticesM', 'fromVertex', 'toVertex', 'wayIds'],
            'sites': {k: site.read() for k, site in sites.items()}}


def receipt(report, site):
    rows = report['sites'][site]; fs = rows['features']; paths = rows['boundedDirectedPaths']
    anchors = [f'w{BUS_AREA}', 'n10245681535', 'n9373889212', 'n560521498'] if site == 'colobane' else [f'n{n}' for n in PONTY]
    return {'hash': report['pbfSha256'], 'anchors': {k: fs.get(k) for k in anchors},
            'kinds': {kind: sum(f['kind'] == kind for f in fs.values()) for kind in sorted({f['kind'] for f in fs.values()})},
            'railPlatforms': {k: f['contacts'] for k, f in fs.items() if f['kind'] == 'rail-platform'},
            'counts': {'dedicatedWays': len(rows['dedicatedWays']), 'paths': len(paths)},
            'firstPathsByLength': sorted(paths, key=lambda p: (p[2], p[0], p[1]))[:8]}


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('pbf', type=Path); cli.add_argument('output', type=Path)
    args = cli.parse_args(); result = read_pbf(args.pbf)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    for site in WINDOWS:
        text = json.dumps(receipt(result, site), ensure_ascii=False, separators=(',', ':'))
        print(f'::notice title=Accès {site}::' + text.replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A'))
