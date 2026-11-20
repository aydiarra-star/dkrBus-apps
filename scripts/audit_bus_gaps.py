"""Make the work queue from the passenger sign census, NOT from route numbers.

One row per variant, including blanks, and a separate list of TATA stop
mentions without ranked calls or timetables. A desired destination in a
report is not the direction of an observed vehicle.
"""
import argparse
import csv
import json
from pathlib import Path


def read(path):
    with path.open(encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))


def write(path, header, rows):
    with path.open('w', encoding='utf-8', newline='') as f:
        out = csv.writer(f, lineterminator='\n')
        out.writerow(header)
        out.writerows(rows)


def generate(boards, output, evidence):
    sheets = read(boards / 'fiches.csv')
    groups = {s['fiche']: [] for s in sheets}
    for family in ('ddd', 'aftu', 'tata'):
        for row in read(boards / f'{family}.csv'):
            groups[row['fiche']].append(row)
    queue = []
    for s in sheets:
        if s['étendue'] == 'alias':
            continue
        rr = groups[s['fiche']]
        if len(rr) != int(s['rangs']):
            raise ValueError(f"{s['fiche']}: liste non raccordée")
        n = len(rr) if s['nature'] == 'arrêts' else 0
        grids = [sum(int(r[f'cellules_{d}']) > 0 for r in rr) for d in ('semaine', 'vendredi', 'samedi', 'dimanche')]
        eligible = sum(r['minutes_source_semaine'] == 'oui' for r in rr)
        causes = sorted({r['raison_ou_limite'] for r in rr if r['minutes_source_semaine'] != 'oui'})
        if not rr:
            causes.append(s['absence'] or 'Liste directionnelle absente')
        queue.append([s['fiche'], s['famille'], s['ligne'], s['variante'], s['depuis'], s['vers'], s['nature'], s['étendue'], len(rr), n, eligible, *grids,
                      s['limite_semaine'], ' ; '.join(causes), s['source_ordre'], s['source_heures']])
    output.mkdir(parents=True, exist_ok=True)
    write(output / 'lacunes-par-sens.csv', ['fiche','famille','ligne','variante','depuis','vers','nature','portée','rangs','rangs_arrêt','décomptables_semaine',
          'rangs_avec_cellule_semaine','vendredi','samedi','dimanche','portée_temporelle_semaine','raisons_sans_décompte','source_ordre','source_heures'], queue)
    observed_codes = {s['ligne'] for s in sheets if s['famille']=='tata'}
    refs = []
    for m in evidence['mentions']:
        for c in m['lines']:
            if c not in observed_codes:
                raise ValueError(f'TATA {c}: mention sans ligne du catalogue')
            urls = [evidence['sources'][k]['url'] for k in m['sources']]
            refs.append(['tata', c, m['stop'], m['title'], m.get('destinationSought', ''), 'non établi',
                         'non indiqué', 'aucune heure', ' | '.join(urls)])
    write(output / 'tata-arrets-cites.csv', ['famille','ligne','arrêt_cité','type_de_mention','destination_recherchée',
          'sens_du_bus','rang','horaire','sources'], refs)
    print(f'{len(queue)} fiches hors alias ; {len(refs)} mentions TATA non ventilées (aucune ajoutée au dénominateur).')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--boards', type=Path, default=Path('docs/panneaux'))
    p.add_argument('--output', type=Path, required=True)
    args = p.parse_args()
    generate(args.boards, args.output, json.loads(Path('src/data/tataNamedStops.json').read_text()))
