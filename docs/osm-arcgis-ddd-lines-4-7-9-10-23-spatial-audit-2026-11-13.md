# Rapprochement spatial directionnel OSM / ArcGIS DDD — lignes 4, 7, 9, 10 et 23 — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Sources : relations de bus OSM et couches de points ArcGIS DDD de `Ligne_inter_urbain/FeatureServer`.  
Les géométries ArcGIS ont été demandées en WGS84 (`outSR=4326`).

## Résultat principal

Pour chaque relation OSM, chaque membre géolocalisé a été rapproché du point ArcGIS le plus proche de la couche de la même ligne. Les valeurs ci-dessous sont des correspondances de proximité, pas des associations un-à-un validées : plusieurs membres OSM peuvent avoir le même point ArcGIS le plus proche.

| Ligne | Relation OSM | Sens annoncé | Membres OSM | Points ArcGIS | À ≤15 m | À ≤50 m | À ≤100 m | Ordre OBJECTID non décroissant |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| 4 | 7203970 | Liberté 5 → Leclerc | 32 | 30 | 24 | 24 | 24 | 30/31 |
| 7 | 7500475 | Ouakam → Palais 1 | 34 | 33 | 27 | 30 | 31 | 33/33 |
| 9 | 7487218 | Liberté 6 → Palais 1 | 29 | 36 | 27 | 27 | 28 | 28/28 |
| 10 | 7488283 | Liberté 5 → Palais 1 | 25 | 26 | 17 | 20 | 22 | 24/24 |
| 23 | 7108131 | Parcelles → Palais 1 | 47 | 56 | 39 | 40 | 44 | 42/46 |

Les directions retenues dans ce tableau concordent avec les sens publiés de ces lignes. L'ordre des identifiants ArcGIS suit l'ordre OSM pour la quasi-totalité des transitions, ce qui renforce la cohérence géographique.

## Comparaison avec les relations opposées

Les autres relations candidates de chaque paire présentent une proximité nettement plus faible avec ces mêmes couches ArcGIS :

| Ligne | Relation opposée | Membres | À ≤15 m | Ordre OBJECTID non décroissant |
|---|---:|---:|---:|---:|
| 4 | 6990830 | 34 | 2 | 10/33 |
| 7 | 6990669 | 31 | 2 | 4/30 |
| 9 | 6996431 | 32 | 6 | 2/31 |
| 10 | 6990845 | 30 | 4 | 5/29 |
| 23 | 7495279 | 51 | 8 | 8/50 |

Cette asymétrie suggère que les couches de points historiques contrôlées représentent principalement le sens indiqué dans le premier tableau, et non les deux sens. Elle ne permet pas de déclarer que le retour n'existe pas.

## Décision ligne par ligne

- **DDD 4** : la relation 7203970 est fortement corroborée par la couche ArcGIS et correspond au sens publié Liberté 5 → Leclerc. Garder 6990830 séparée comme candidate inverse non corroborée par cette couche.
- **DDD 7** : la relation 7500475 est fortement corroborée dans le sens Ouakam → Palais 1. Le conflit Palais / Palais 1 / Palais 2 demeure à résoudre avant canonicalisation.
- **DDD 9** : la relation 7487218 est fortement corroborée dans le sens Liberté 6 → Palais 1. La destination « Palais 1 » ne doit pas être remplacée par « Palais 2 » sans preuve.
- **DDD 10** : la relation 7488283 est la meilleure correspondance géographique avec la couche contrôlée dans le sens Liberté 5 → Palais 1. Les 3 membres qui dépassent 100 m demandent un examen individuel.
- **DDD 23** : la relation 7108131 est très proche de la couche de ligne 23 et suit l'ordre ArcGIS. Mais sa référence OSM est `L23;L5` : la relation reste multi-référence et ne doit pas être attribuée exclusivement à la ligne 23 avant clarification.

## Prochaine étape

Créer un tableau de correspondance par membre contenant l'identifiant OSM, l'identifiant ArcGIS voisin, la distance et le nom des deux sources. Les cas éloignés, les noms contradictoires et les terminus ambigus doivent rester signalés. Ensuite, appliquer le même contrôle à la ligne 1 (déjà fortement corroborée) et aux lignes 121, 8 et 18 qui ont des lacunes particulières.

## Garde-fous

Les distances sont calculées vers le point ArcGIS le plus proche ; elles ne prouvent pas que deux entités sont le même arrêt. Les points ArcGIS peuvent décrire un corridor ou un seul sens. Aucun arrêt n'est fusionné, supprimé ou renommé. Aucun retour n'est fabriqué. Aucune fréquence ou heure n'est déduite. Aucun GTFS utilisé. Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT ou de l'affichage passager.
