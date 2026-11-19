"""Compare every archived AFTU stop occurrence to the operator's marked
START → FINISH overlay, never the other way around. QA ranks, not new stops.
The expired pinned archive and the map coordinates are never published here.
"""
import argparse
import hashlib
import json
import math
import zipfile
from pathlib import Path
from scripts.audit_aftu_road_fit import xy
from scripts.compare_bus_occurrences import DIGEST, patterns, tables


def project_calls(line, calls, limit):
    segments, length = [], 0.0
    for a, b in zip(line, line[1:]):
        step = math.dist(a, b)
        if step:
            segments.append((*a, b[0]-a[0], b[1]-a[1], step, length))
            length += step
    far, order, missing = [], [], []
    last = -math.inf
    for rank, p in enumerate(calls, 1):
        if not p:
            missing.append(rank)
            continue
        possible = []
        for ax, ay, dx, dy, step, start in segments:
            x, y = p[0]-ax, p[1]-ay
            t = min(1, max(0, (x*dx+y*dy)/(step*step)))
            if math.hypot(x-t*dx, y-t*dy) <= limit:
                possible.append(start+t*step)
        if not possible:
            far.append(rank)
        else:
            # Earliest possible forward projection dominates all later ones.
            # No smoothing across an absent call or tie in the source order.
            forward = [s for s in possible if s > last+0.01]
            if not forward:
                order.append(rank)
            else:
                last = min(forward)
    ends = [math.dist(a,b) if a else None for a,b in [(calls[0],line[0]), (calls[-1],line[-1])]]
    return {'missing': missing, 'outside': far, 'noProgress': order, 'endGapsM': [round(d, 1) if d is not None else None for d in ends],
            'fit': bool(segments) and len(calls) >= 2 and not (far or order or missing) and all(d is not None and d <= limit for d in ends)}


def compare(folder, archive):
    maps = {f.stem: json.loads(f.read_text()) for f in folder.glob('*.json')}
    with archive.open('rb') as fp:
        if hashlib.file_digest(fp, 'sha256').hexdigest() != DIGEST['aftu']:
            raise ValueError('Archive AFTU non reconnue')
    rows = []
    with zipfile.ZipFile(archive) as z:
        stops = {r['stop_id']: xy((float(r['stop_lon']), float(r['stop_lat']))) for r in tables(z, 'stops')}

        def visit(meta, ids):
            m = maps.get(meta['code'])
            if not m or m['orientation'] not in ('start-first', 'start-last'):
                return
            points = [xy(p) for p in m['positions']]
            if m['orientation'] == 'start-last':
                points.reverse()  # read the single drawing FROM its marked Start, not a return
            r = {k: meta[k] for k in ('code', 'shapeId', 'directionId', 'sequenceHash', 'occurrences', 'issues', 'rankTies')}
            r['shapeHash'] = m['shapeHash']
            for limit in (20, 80):
                q = project_calls(points, [stops.get(i) for i in ids], limit)
                q['fit'] &= not r['issues']
                r[str(limit)] = q
            rows.append(r)
        patterns(z, 'aftu', visit_variant=visit)
    return {'status': 'HISTORICAL_ONLY', 'archiveSha256': DIGEST['aftu'], 'variants': rows}


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    for name in ('maps','archive','output'):
        cli.add_argument(name, type=Path)
    args = cli.parse_args()
    data = compare(args.maps, args.archive)
    args.output.write_text(json.dumps(data, indent=2)+'\n')
    # Full ranked gaps stay in the JSON. A same-code variant with zero calls is
    # NOT represented as a successful check (see tripsWithoutCalls in compare).
    brief = [[r['code'], r['shapeId'], r['occurrences'], r['rankTies'], r['20']['endGapsM'],
              *[[len(r[k]['outside']),len(r[k]['noProgress']),r[k]['fit']] for k in ('20','80')]] for r in data['variants']]
    print('::notice title=Nombre de suites AFTU::'+str(len(brief)))
    for i in range(0,len(brief),20):
        print('::notice title=Appels historiques AFTU::'+json.dumps(brief[i:i+20],separators=(',',':')))
