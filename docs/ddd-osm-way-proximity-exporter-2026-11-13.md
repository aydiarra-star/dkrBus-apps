# Export reproductible de proximité OSM–ArcGIS — lignes DDD 8 et 18

Date : 13 novembre 2026.

## Script ajouté

`scripts/export_ddd_osm_way_arcgis_stop_proximity.mjs`

Le script :
- lit une relation OSM et une couche ArcGIS d'arrêts en lecture seule ;
- projette les coordonnées WGS84 en UTM zone 28N ;
- calcule pour chaque point ArcGIS la distance minimale aux segments de voies OSM ordonnés ;
- indique le membre de voie OSM le plus proche ;
- exporte les résultats en CSV avec le statut `GEOMETRY_CANDIDATE`.

Il ne crée pas de membre d'arrêt, ne confirme pas l'identité des arrêts et ne publie aucune donnée.

## Commandes de reproduction

```bash
node --check scripts/export_ddd_osm_way_arcgis_stop_proximity.mjs

node scripts/export_ddd_osm_way_arcgis_stop_proximity.mjs \
  dakar-osm-route-candidates.json ddd-route-stop-candidates.json \
  7495137 3 ddd-line-8-way-geometry-crosswalk.csv

node scripts/export_ddd_osm_way_arcgis_stop_proximity.mjs \
  dakar-osm-route-candidates.json ddd-route-stop-candidates.json \
  7499475 9 ddd-line-18-way-geometry-crosswalk.csv
```

## Résultats vérifiés sur les artefacts du 13/11/2026

| Ligne | Relation OSM | Voies OSM ordonnées | Points ArcGIS | ≤25 m | 25–50 m | 50–100 m | >100 m |
|---|---:|---:|---:|---:|---:|---:|---:|
| 8 | 7495137 | 80 | 49 | 41 | 0 | 3 | 5 |
| 18 | 7499475 | 54 | 44 | 31 | 0 | 3 | 10 |

Les CSV détaillés ont été générés localement :
- `ddd-line-8-way-geometry-crosswalk-2026-11-13.csv`
- `ddd-line-18-way-geometry-crosswalk-2026-11-13.csv`

Les statistiques sont des distances point-vers-segment, pas des validations d'arrêts. Les points ArcGIS de la ligne 8 n'ont aucun nom ; la géométrie de la ligne 18 ne couvre pas tout le secteur centre-ville. Les deux limites sont décrites dans `ddd-lines-8-18-osm-way-geometry-review-2026-11-13.md`.

## Contrôle CI

Le workflow `.github/workflows/ci.yml` contient désormais une étape `node --check` dédiée à ce nouvel exportateur. Le résultat CI doit être vérifié sur le HEAD courant du PR avant de considérer ce contrôle comme passé.
