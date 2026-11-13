# DDD — contrôle des noms OSM face aux séquences publiées

Date : 13 novembre 2026.

## Objectif

Comparer les noms explicitement présents sur les membres d'arrêt OSM avec les noms de l'ordre d'arrêts publié par Dem Dikk. Cette étape complète le rapprochement géographique OSM–ArcGIS, sans fusionner les données.

## Méthode

- Les séquences de référence proviennent de l'extraction des pages officielles DDD du 13/11/2026 : 39 séquences publiées distinctes, toutes avec au moins deux arrêts.
- Seuls les membres OSM portant un nom sont comparés ; les membres sans nom ne sont pas devinés à partir de leur proximité.
- Normalisation limitée aux accents, à la casse, à la ponctuation et à des préfixes génériques comme « arrêt », « gare » ou « terminus ».
- Calcul d'une plus longue sous-séquence commune (LCS) de noms normalisés, en préservant l'ordre OSM et l'ordre publié.
- Un résultat est une concordance de libellé candidate. Il ne certifie ni l'identité physique du point, ni le sens de circulation, ni la date d'exploitation de la relation OSM.

## Résultats

| Ligne | Relation OSM | Membres OSM nommés | Concordances normalisées ordonnées |
|---|---:|---:|---:|
| 1 | 6951328 | 14 | 5 |
| 7 | 6990669 | 14 | 1 |
| 7 | 7500475 | 11 | 1 |
| 4 | 6990830 | 11 | 1 |
| 4 | 7203970 | 7 | 2 |
| 9 | 6996431 | 10 | 1 |
| 9 | 7487218 | 8 | 1 |
| 10 | 6990845 | 5 | 1 |
| 10 | 7488283 | 2 | 0 |
| 121 | 2792903 | 0 | 0 |
| 121 | 6990794 | 7 | 1 |
| 121 | 6999013 | 1 | 0 |
| 23 | 7495279 | 31 | 1 |

### Positions des concordances

Les positions sont des rangs dans la relation OSM et dans la séquence DDD publiée, en commençant à 1.

- Ligne 1 / relation 6951328 : OSM 1 → DDD 1 ; 9 → 5 ; 23 → 12 ; 29 → 14 ; 37 → 19.
- Ligne 4 / relation 7203970 : OSM 24 → DDD 16 ; OSM 31 → DDD 23.
- Les autres relations du tableau n'ont qu'une concordance ordonnée chacune, ou aucune.

## Interprétation

La ligne 1 / relation 6951328 présente le signal nominal ordonné le plus intéressant : cinq noms normalisés concordants, dont le terminus Parcelles Assainies, Terrain Acapes, UCAD, Marché Tilène et Place de l'Indépendance. C'est une priorité pour une revue manuelle combinant les positions géographiques, les libellés ArcGIS et les terminus publiés.

Les faibles nombres de concordances des autres relations ne prouvent pas qu'elles sont fausses : OSM ne nomme qu'une partie des arrêts, et les libellés peuvent différer. À l'inverse, une concordance de nom générique comme « UCAD » ou « Marché Tilène » n'est pas une preuve suffisante à elle seule.

## Décision de qualité

Aucune relation OSM n'est promue en itinéraire officiel sur cette base. Les directions aller et retour restent séparées ; aucun retour n'est reconstruit par inversion automatique. Les 39 séquences DDD publiées restent elles-mêmes marquées pour revue humaine, avec un seul ordre publié lorsque c'est le cas. Aucune fréquence n'est inférée et aucune donnée de production n'est modifiée.
