# Revue de directions candidates — DDD lignes 4 et 7

Date : 13 novembre 2026.

Ce rapport complète la revue détaillée de la ligne 1. Les relations OSM aller et retour sont conservées séparément.

## Ligne 4

Ordre officiel DDD publié : « LIGNE 4 : LIBERTÉ 5 PLACE LECLERC », 26 arrêts.

| Relation OSM | Sens déclaré par les tags OSM | Membres ordonnés | Nommés | ≤25 m ArcGIS | Concordances de noms ordonnées |
|---|---|---:|---:|---:|---:|
| 7203970 | Termibus Liberté 5 → Terminus Leclerc | 32 | 7 | 24 | 2 |
| 6990830 | Terminus Leclerc → Terminus Liberté 5 | 34 | 11 | 2 | 1 |

Pour la relation 7203970, les deux correspondances nominales ordonnées se situent aux positions OSM 24 → DDD 16 et OSM 31 → DDD 23. La géométrie est très proche d'une partie de la couche ArcGIS, mais plusieurs premiers membres présentent des écarts importants (jusqu'à plus de 600 m). Ne pas extrapoler la bonne proximité du reste de la séquence à ces membres éloignés.

Pour la relation 6990830, la médiane spatiale est élevée (environ 111 m) et seulement 2/34 points sont à 25 m ou moins. Elle reste une candidate de retour, mais demande une revue de géométrie plus approfondie.

**Décision ligne 4 :** deux directions distinctes sont documentées dans OSM, avec des terminus compatibles avec le libellé officiel. La relation aller 7203970 est prioritaire pour contrôle, mais aucune des deux n'est validée comme séquence d'exploitation complète.

## Ligne 7

Ordre officiel DDD publié : « LIGNE 7 : OUAKAM PALAIS 2 », 21 arrêts.

| Relation OSM | Sens déclaré par les tags OSM | Membres ordonnés | Nommés | ≤25 m ArcGIS | Concordances de noms ordonnées |
|---|---|---:|---:|---:|---:|
| 7500475 | Terminus Ouakam → Terminus Palais 1 | 34 | 11 | 28 | 1 |
| 6990669 | Terminus Palais → Terminus Ouakam | 31 | 14 | 6 | 1 |

La relation 7500475 a une géométrie globalement proche de la couche ArcGIS : 28/34 points à 25 m ou moins. Elle porte toutefois un terminus « Palais 1 », alors que le libellé officiel DDD de la ligne 7 annonce « Palais 2 ». Le point ArcGIS le plus proche du dernier membre OSM est le « Terminus Palais de Justice », à environ 190,8 m. Cette divergence de terminus doit être résolue avant toute validation.

La relation 6990669 est la direction opposée déclarée par OSM, mais sa proximité avec la couche d'arrêts est nettement plus faible : 6/31 points à 25 m ou moins et médiane d'environ 95,5 m. Ne pas la reconstruire en inversant 7500475.

**Décision ligne 7 :** conserver les deux relations comme directions candidates distinctes. La relation 7500475 est prioritaire pour contrôle des arrêts intermédiaires, mais son terminus déclaré ne concorde pas exactement avec l'intitulé officiel. La relation 6990669 reste en revue géographique.

## Règles de qualité maintenues

- Les ordres officiels DDD publiés sont des références de noms et d'ordre, pas une preuve que chaque relation OSM décrit le service actuel.
- Les distances ArcGIS mesurent le point le plus proche ; elles ne prouvent pas l'identité d'un arrêt.
- Les correspondances de noms sont des candidats et non des identifiants confirmés.
- Aucune direction ne doit être fabriquée par inversion.
- Aucune fréquence ni aucun horaire n'est déduit de ces couches.
- Aucun changement de TER/BRT, de production ou de base Supabase.
