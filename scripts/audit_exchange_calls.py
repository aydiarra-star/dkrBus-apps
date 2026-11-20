"""Compare historical occurrences and differently located documentary markers.
No nearest-neighbour stop matching, travel times, schedules or physical links.
Also retain the directional counts and termini of codes absent from the app.
"""
import argparse
import csv
import hashlib
import json
import zipfile
from pathlib import Path

from scripts.audit_interchange_sites import distance
from scripts.audit_reference_archives import inspect
from scripts.compare_bus_occurrences import DIGEST, patterns, tables

CALLS = {'ddd': {'DDD_07': {'D_45', 'D_48', 'D_1258', 'D_128', 'D_122'}, 'DDD_01': {'D_128', 'D_122'},
                 'DDD_18': {'D_700'}}, 'aftu': {'AFTU_42': {'A_12', 'A_13', 'A_17', 'A_2028'}}}
# Source coordinate pairs, not candidate bus doors. Keep lat/lon order explicit.
DDD_TABLE = 'https://demdikk.sn/chatbot-arrets/'
CARTOGRAPHY = {
    'cbaoTable': [14.6694867, -17.4330333, DDD_TABLE], 'posteTable': [14.669285, -17.43627, DDD_TABLE],
    'osmCbao': [14.6694418, -17.4330474, 'https://www.openstreetmap.org/node/4666430941/history/3'],
    'osmPosteCandidate': [14.6695598, -17.4334469, 'https://www.openstreetmap.org/node/711879280/history/2'],
}


def report(files, sheets):
    with sheets.open(newline='') as f:
        codes = {(r['famille'], r['ligne']) for r in csv.DictReader(f)}
    result, extra, points = {}, {}, dict(CARTOGRAPHY)
    for family, path in files.items():
        with path.open('rb') as f:
            if hashlib.file_digest(f, 'sha256').hexdigest() != DIGEST[family]:
                raise ValueError(f'Archive non relue : {family}')
        with zipfile.ZipFile(path) as z:
            result.update(inspect(z, family, {}, specs=CALLS[family]))
            groups, stats = patterns(z, family)
            for code in stats['routes']:
                if (family, code) in codes:
                    continue
                extra[f'{family}:{code}'] = {
                    'lastRegularDateInArchive': stats['lastCalendarEnd'],
                    'variants': [{'id': m['directionId'], 'shape': m['shapeId'], 'trips': m['trips'],
                                  'calls': len(names), 'first': names[0], 'last': names[-1], 'issues': m['issues']}
                                 for m, names in groups.get(code, [])],
                    'tripsWithoutCalls': [m for m in stats['tripsWithoutCalls'] if m['code'] == code],
                }
            focus = set.union(*CALLS[family].values())
            for p in tables(z, 'stops'):
                if p['stop_id'] in focus:
                    points[p['stop_id']] = [float(p['stop_lat']), float(p['stop_lon']), p['stop_name']]
    pairs = [('cbaoTable','osmCbao'), ('cbaoTable','D_128'), ('posteTable','osmPosteCandidate'), ('posteTable','D_122'),
             ('D_45','A_13'), ('A_12','D_48'), ('D_45','A_12'), ('A_13','D_48')]
    return {'scope':'DOCUMENTARY_ONLY_NOT_DOOR_DISTANCES', 'archiveSha256':DIGEST,
            'occurrenceColumns':['stopId','rank','previousStopId','nextStopId'], 'routes':result,
            'pointColumns':['latitude','longitude','archiveLabelOrSource'], 'points':points,
            'markerSeparationsMeters':[[a, b, round(distance(points[a], points[b]), 1)] for a,b in pairs],
            'onlyInArchivesNotProofOfClosure':extra}


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('ddd', type=Path)
    cli.add_argument('aftu', type=Path)
    cli.add_argument('--catalogue', type=Path, default=Path('docs/panneaux/fiches.csv'))
    args = cli.parse_args()
    print(json.dumps(report({'ddd':args.ddd, 'aftu':args.aftu}, args.catalogue), indent=2, ensure_ascii=False))
