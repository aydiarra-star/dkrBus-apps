# Synthèse du rapprochement des arrêts DDD — OSM / ArcGIS

Date de contrôle : 13 novembre 2026.

## Sources fraîches

- OSM : extraction du 13/11/2026 à 12:55:38 UTC, issue de l'audit en lecture seule du dépôt. 6 610 éléments, 25 relations de bus, 2 relations maîtres, 23 candidates dans l'emprise de Dakar, 2 conflits de périmètre, 18 relations avec membres d'arrêt ordonnés et 522 occurrences d'arrêts au total.
- ArcGIS DDD : extraction du 13/11/2026 à 12:43:20 UTC. 24/24 couches de tracés et 12/12 couches d'arrêts récupérées, 25 entités de tracé, 455 entités d'arrêt, 379 noms utilisables, 76 noms absents et 454 géométries d'arrêt exploitables.
- Le nouveau résultat OSM est strictement identique au précédent sur les éléments, relations, relations maîtres et statistiques. Seul l'endpoint de collecte et l'horodatage changent. L'endpoint principal z.overpass-api.de a réussi ; les endpoints de secours ont rencontré des timeouts/502/504. La couverture ne doit donc pas être qualifiée d'exhaustive.

## Méthode

Pour chaque relation DDD à référence numérique unique, chaque nœud d'arrêt OSM est rapproché du point ArcGIS le plus proche dans la couche correspondant à la ligne. Les seuils sont 25 m, 50 m et 100 m. Chaque proposition conserve l'identifiant OSM, son rang, la couche ArcGIS, l'OBJECTID, le nom publié et la distance. La proximité n'établit pas l'identité de l'arrêt et ne valide pas le sens. Les listes ArcGIS ne sont pas certifiées comme ordre opérationnel.

## Résultats principaux

| Ligne | Relation OSM | Arrêts OSM | ≤25 m | ≤50 m | ≤100 m | Médiane |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 6951328 | 38 | 34 | 35 | 36 | 1,7 m |
| 7 | 7500475 | 34 | 28 | 30 | 31 | 2,2 m |
| 4 | 7203970 | 32 | 24 | 24 | 24 | 2,2 m |
| 9 | 7487218 | 29 | 27 | 27 | 28 | 1,7 m |
| 10 | 7488283 | 25 | 18 | 20 | 22 | 2,1 m |
| 121 | 6990794 | 27 | 24 | 24 | 26 | 1,6 m |
| 121 | 2792903 | 3 | 3 | 3 | 3 | 1,3 m |
| 23 | 7495279 | 51 | 12 | 22 | 32 | 67,3 m |

Ces huit relations réunissent 239 membres d'arrêt ; 185 ont un point ArcGIS le plus proche à 50 m ou moins. Les relations 1, 7 (7500475), 4 (7203970), 9 (7487218), 10 (7488283) et 121 (6990794) sont les plus solides géographiquement. Elles restent des candidates à une revue des noms, terminus et séquences, pas des lignes validées.

## Relations et anomalies à garder séparées

- Ligne 7 / relation 6990669 : 31 arrêts, seulement 10 plus proches voisins à 50 m ; l'autre relation de la ligne 7 (7500475) est nettement mieux alignée.
- Ligne 4 / relation 6990830 : 34 arrêts, 6 voisins à 50 m ; ne pas la confondre avec la relation 7203970.
- Ligne 9 / relation 6996431 : 32 arrêts, 15 voisins à 50 m.
- Ligne 10 / relation 6990845 : 30 arrêts, 10 voisins à 50 m.
- Ligne 121 / relation 6999013 : 7 arrêts, 4 voisins à 50 m.
- Ligne 23 / relation 7495279 : 51 arrêts, 22 voisins à 50 m ; rapprochement partiel seulement.
- Ligne 6 / relation 7499433 : ref 6, mais nom « 7 Palais 1 → Parcelles-Assainies », un seul arrêt et 211 m du point ArcGIS le plus proche. Conflit maintenu, aucune attribution.
- Ligne 8 / relation 7495137 et ligne 18 / relation 7499475 : aucun membre d'arrêt ordonné exploitable dans OSM.
- Relation 7108131, ref multiple L23;L5 : 47 arrêts, non attribuée automatiquement.
- Relation AFTU/TATA 3982642 (ref 40) : aucune séquence d'arrêt dans l'extraction ; distincte du DDD.
- Les deux relations B1 restent BRT et sont exclues du DDD ; les relations APSRTC restent hors périmètre.

## Décision

Aucune association d'identifiants OSM/ArcGIS n'est promue en donnée validée et aucune donnée voyageur n'est modifiée. Les candidats les plus solides peuvent maintenant être confrontés aux séquences officielles DDD déjà extraites, arrêt par arrêt, en maintenant distincts l'aller et le retour. Aucune fréquence n'est inférée d'OSM ou d'ArcGIS.
