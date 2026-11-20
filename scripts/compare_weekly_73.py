"""Check a copied Moovit Lac Rose table against every stored cell, offline.

Copy ONE complete 'Station / Départ #1 / …' table as tab-separated text.
No scraping, clock extrapolation, sorted stop names or mutation of app data.
"""
import argparse
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'src' / 'data'


def compare(rows, names, sheet, period):
    grid = sheet[period]
    n = len(names)
    if not n or grid['ranks'] != list(range(1, n + 1)) or grid['nextUntranscribedOrigin'] is not None:
        raise ValueError('Ce contrôle demande une fiche complète dans ce sens et ce jour.')
    columns = {}
    for profile in grid['profiles']:
        for t in profile['origins']:
            if t in columns or len(profile['elapsed']) != n:
                raise ValueError('Origine dupliquée ou colonne locale incomplète.')
            h, m = map(int, t.split(':'))
            columns[t] = ['%02d:%02d' % divmod(60*h + m + dt, 60) for dt in profile['elapsed']]
    origins = sorted(columns)
    if len(rows) != n + 1 or rows[0] != ['Station', *(f'Départ #{i}' for i in range(1, len(origins) + 1))]:
        raise ValueError('En-tête, nombre de rangs ou de départs différent de la fiche choisie.')
    for rank, (name, row) in enumerate(zip(names, rows[1:]), 1):
        label = sheet.get('printedLabels', {}).get(str(rank), name)
        if not row or row[0] != label or len(row) != len(origins) + 1:
            raise ValueError(f'Rang {rank} : {label!r} puis {len(origins)} cellules attendues.')
        for i, t in enumerate(origins, 1):
            if row[i] != columns[t][rank - 1]:
                raise ValueError(f'Rang {rank} {label!r}, départ #{i} {t} : copie {row[i]!r}, app {columns[t][rank-1]!r}.')
    return n * len(origins)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('side', choices=('outbound', 'inbound'))
    p.add_argument('period', choices=('weekday', 'weekend'))
    p.add_argument('tsv', type=Path)
    a = p.parse_args()
    data = json.loads((ROOT / f'weekly-cells/aftu-73-{a.side}.json').read_text())
    names = json.loads((ROOT / 'aftu-73-directions.json').read_text())['waypoints' if a.side == 'outbound' else 'inboundWaypoints']
    with a.tsv.open(encoding='utf-8-sig', newline='') as f:
        count = compare(list(csv.reader(f, delimiter='\t')), names, data, a.period)
    print(f'{data["source"]} · {a.period} · {count} cellules identiques à la copie ; aucune donnée modifiée.')
