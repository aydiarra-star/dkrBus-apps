# Revue détaillée DDD — ligne 23 et relation OSM multi-référence

Date : 13 novembre 2026.

## Référence officielle

La page officielle DDD publie la ligne 23 dans le sens « Parcelles Assainies → Palais 1 », avec 40 arrêts, de « Terminus des Parcelles » à « Terminus Palais 2 ».

La couche ArcGIS dédiée à la ligne 23 contient 56 points. Ses extrémités sont « Terminus Parcelles Assainies » et « Terminus Palais de JUSTICE ». Elle reprend plusieurs libellés de quartiers et de voies, avec des noms qui ne sont pas toujours identiques à la liste officielle.

## Deux relations OSM à ne pas confondre

| Relation | Référence OSM | Sens déclaré | Membres ordonnés | ≤25 m ArcGIS | Médiane | Concordances nominales ordonnées |
|---|---|---|---:|---:|---:|---:|
| 7108131 | L23;L5 | Parcelles Assainies → Palais 1 | 47 | 40 | 1,7 m | 2 |
| 7495279 | L23 | Palais 1 → Parcelles-Assainies | 51 | 12 | 67,3 m | 1 |

### Relation 7108131 — forte cohérence, attribution ambiguë

Cette relation a 47 membres ordonnés, dont 21 nommés. Quarante membres sur 47 sont à 25 m ou moins du point ArcGIS le plus proche ; 44/47 sont à 100 m ou moins. Deux concordances de noms ordonnées apparaissent avec la liste officielle :

- OSM 15 « ARRET POLICE PARCELLES » → officiel 12 « Police Parcelles ».
- OSM 29 « UCAD » → officiel 25 « UCAD ».

Les trois écarts les plus importants concernent :
- OSM 3 « Arrêt Chez Joe » : environ 268 m du point ArcGIS le plus proche.
- OSM 10 « Arrêt Rue Mame Abdou Aziz Sy » : environ 311 m.
- OSM 13 « Arrêt Ecole Elite » : environ 241 m.

Les terminus déclarés sont compatibles dans leur géographie générale avec la ligne officielle, mais la relation porte explicitement les références multiples « L23;L5 ». Elle ne peut donc pas être affectée automatiquement à la ligne 23. La forte proximité et les deux noms concordants en font une priorité de revue manuelle, pas une validation.

### Relation 7495279 — sens opposé déclaré, signal spatial plus faible

Cette relation porte la référence L23 et le nom « Termibus Palais 1 → Parcelles-Assainies ». Elle compte 51 membres ordonnés, dont 31 nommés. Seulement 12/51 sont à 25 m ou moins du point ArcGIS le plus proche ; 32/51 sont à 100 m ou moins et la médiane est d'environ 67,3 m.

Une concordance nominale ordonnée stricte ressort : UCAD (OSM 17 → officiel 25) si l'on compare les libellés sans inverser l'ordre officiel. Le trajet est déclaré dans le sens opposé à la liste DDD publiée. De nombreux points sont éloignés de la couche ArcGIS, notamment dans les zones Avenue Bourguiba, Khar Yalla et Parcelles.

Cette relation reste une candidate possible pour le sens opposé, mais les écarts spatiaux empêchent de l'utiliser comme séquence retour validée.

## Décision de qualité

1. Placer la relation 7108131 en **priorité de désambiguïsation** : demander ou rechercher une preuve permettant de déterminer si elle décrit la ligne 23, la ligne 5, ou un tronçon commun aux deux.
2. Garder la relation 7495279 séparée comme candidate OSM de sens opposé ; ne pas en déduire un retour officiel.
3. Conserver les 40 arrêts publiés par DDD comme référence textuelle.
4. Ne pas fusionner les relations, ne pas renverser une séquence et ne pas copier les libellés ArcGIS dans les données validées sans contrôle.
5. Aucun horaire ou intervalle n'est déduit des données géographiques.

## Sources

- DDD : https://demdikk.sn/reseau-urbain-dakar/
- OSM via Overpass : relation 7108131 et relation 7495279, export Dakar du 13/11/2026.
- ArcGIS DDD : couche publique « Arrets_LIgne_23_Dakar_Dem_Dikk », couche 10 du jeu d'audit.
