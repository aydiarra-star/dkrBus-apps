# Géométrie réelle du BRT B1 — audit directionnel

Date de l'audit : 15 novembre 2026  
Données cartographiques : extraction OpenStreetMap du 14 novembre 2026  
Périmètre : dessin du tracé B1 uniquement. Les 23 stations et les données d'exploitation ne sont pas modifiées.

## Sources

Deux relations OpenStreetMap distinctes, toutes deux identifiées comme SunuBRT B1 :

| Sens | Relation OSM | Voies routières ordonnées | Sommets après simplification | Longueur mesurée |
|---|---:|---:|---:|---:|
| Préfecture de Guédiawaye → Petersen | 19961937 | 60 | 237 | 17,834 km |
| Petersen → Préfecture de Guédiawaye | 19961993 | 60 | 241 | 17,640 km |

Les 60 membres de voirie de chaque relation sont assemblés dans l'ordre de la relation. L'orientation d'un membre est retournée uniquement lorsque nécessaire pour raccorder exactement ses extrémités à la voie précédente. Les raccords vérifiés sont continus (écart maximal mesuré : 0 m).

Les deux sens restent deux LineString indépendantes. Aucun sens retour n'est fabriqué par inversion d'une autre géométrie.

## Contrôle des stations

Les 23 coordonnées des stations déjà utilisées par Dakar Bus ont été comparées aux deux voies BRT. Chacune se trouve à moins de 2 mètres de l'un des tracés livrés (écart maximal mesuré : environ 0,55 m).

Les géométries ont été simplifiées avec une tolérance d'environ 1 mètre pour limiter le poids du fichier cartographique. Les stations, leurs coordonnées et leur ordre ne sont pas déplacés.

## Limites à afficher dans la gouvernance des données

- La géométrie est une donnée OpenStreetMap contributive, sous licence ODbL 1.0 ; elle n'est pas un plan de récolement certifié du CETUD ou de Dakar Mobilité.
- Les longueurs calculées (17,834 km et 17,640 km) ne sont pas présentées comme la longueur officielle du corridor (18,3 km). Elles reflètent les deux tracés numériques OSM et leurs voies directionnelles.
- Les relations OSM ont été extraites le 14 novembre 2026 ; une nouvelle extraction devra être comparée avant toute mise à jour ultérieure.
- La géométrie ne change ni les 23 stations, ni les lignes B1/B2/B3, ni les horaires, ni les fréquences, ni les temps de passage.
- L'attribution « © les contributeurs d'OpenStreetMap » et la licence ODbL sont conservées dans le fichier et dans la carte.

## Fichiers

- `data/brt/brt-b1-osm.geojson` : deux tracés directionnels.
- `src/domain/brtTrackGeometry.ts` : lecture stricte et validation des deux sens.
- `src/domain/brtTrackGeometry.test.ts` : contrôle des relations, des longueurs, des stations et de la provenance.
- `src/components/TransitMap.tsx` : affichage de chaque direction séparément.
