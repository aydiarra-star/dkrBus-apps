"""Condense two CI check receipts to versionable measurements (no polylines).
Inputs: gh api --paginate .../check-runs/JOB/annotations. The full ranked
measurements are in the two workflow artifacts. Incomplete receipts fail.
"""
import argparse
import json
import re
from pathlib import Path


def freeze(aftu, regional, revision, aftu_job, regional_job):
    def notices(check, title):
        return [a['message'] for a in check if a['title'] == title]

    def one(check, title):
        [v] = notices(check, title)
        return v

    def unpack(check, title):
        return [v for text in notices(check, title) for v in json.loads(text)]

    pbf = one(regional, 'Empreinte continuité')
    if not re.fullmatch('[0-9a-f]{64}', pbf) or one(aftu, 'Voirie Sénégal') != pbf:
        raise ValueError('Les deux PBF doivent être identifiés et identiques pour ce rapprochement.')
    if not re.fullmatch('[0-9a-f]{40}', revision):
        raise ValueError('Révision source requise')
    pages = unpack(aftu, 'Cartes AFTU')
    acquisition = one(aftu, 'Acquisition AFTU')
    count = re.search(r' · (\d+) pages · ', acquisition)
    if not count or len(pages) != int(count[1]) or not pages or len({r[0] for r in pages}) != len(pages):
        raise ValueError('Reçus des pages absents, dupliqués ou tronqués')
    fits = unpack(aftu, 'Ajustement AFTU')
    indexed = {r[0]: r[1:] for r in fits}
    if len(indexed) != len(fits):
        raise ValueError('Mesure dupliquée')
    drawings = {}
    for code, status, roles, lines, page_hash, other, names in sorted(pages, key=lambda r: int(r[0])):
        row = {'pageStatus': status, 'pageHash': page_hash, 'markers': list(zip(roles or [], names or [])), 'lineCount': len(lines or [])}
        if status == 'MAP_READ' and len(lines) == 1 and not other and lines[0][0] is not None:
            vertices, meters, longest, over300, _, offsets, shape_hash = lines[0]
            orientation, probes, gaps, possible = indexed.pop(code)
            row.update({'vertices': vertices, 'meters': meters, 'maxStepM': longest, 'over300': over300, 'shapeHash': shape_hash,
                        'markerEndGapsM': offsets, 'orientation': orientation, 'probes': probes, 'roadGaps': gaps, 'possible': possible})
        drawings[code] = row
    if indexed:
        raise ValueError('Mesure de voirie sans carte correspondante')
    variants = unpack(aftu, 'Appels historiques AFTU')
    if len(variants) != int(one(aftu, 'Nombre de suites AFTU')):
        raise ValueError('Reçus des suites historiques incomplets')
    for code, shape, count, ties, ends, at20, at80 in variants:
        drawings[code].setdefault('archive', []).append({'shape': shape, 'calls': count, 'tiedRanks': ties, 'endGapsM': ends,
                                                         'at20': at20, 'at80': at80})
    relations = sorted(unpack(regional, 'Continuité bus'), key=lambda r: r['id'])
    if len(relations) != int(one(regional, 'Nombre de relations bus')) or len({r['id'] for r in relations}) != len(relations):
        raise ValueError('Reçus régionaux absents ou dupliqués')
    return {'sourceRevision': revision, 'aftuCheck': aftu_job, 'regionalCheck': regional_job, 'acquisition': acquisition, 'pageErrors': json.loads(one(aftu, 'Pages AFTU non acquises')),
            'pbfSha256': pbf, 'attribution': '© OpenStreetMap contributors · ODbL 1.0', 'pinnedReview': one(regional, 'Revue OSM'),
            'drawings': drawings, 'relations': relations}


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    for name in ['aftu','regional','revision','aftu_job','regional_job','output']:
        cli.add_argument(name)
    a = cli.parse_args()
    data = freeze(json.loads(Path(a.aftu).read_text()), json.loads(Path(a.regional).read_text()), a.revision, a.aftu_job, a.regional_job)
    # Keep one record per page/relation per line to make future observations diffable.
    dump = lambda v: json.dumps(v, ensure_ascii=False, separators=(',', ':'))
    maps, rels = data.pop('drawings'), data.pop('relations')
    Path(a.output).write_text(json.dumps(data, ensure_ascii=False, indent=2)[:-2]+',\n  "drawings": {\n'+
                              ',\n'.join('    '+dump(k)+': '+dump(v) for k,v in maps.items())+'\n  },\n  "relations": [\n'+
                              ',\n'.join('    '+dump(r) for r in rels)+'\n  ]\n}\n')
