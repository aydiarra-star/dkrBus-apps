# DDD — rapprochement détaillé des arrêts OSM et ArcGIS

Date : 13 novembre 2026.

## Fichiers sources

- OSM : extraction en lecture seule générée le 13/11/2026 à 12:55:38 UTC. La nouvelle collecte lancée sur le commit courant est encore en cours ; cette analyse utilise donc le dernier artefact OSM réussi.
- ArcGIS DDD : extraction réussie générée le 13/11/2026 à 13:24:08 UTC, 24/24 couches de tracés et 12/12 couches d'arrêts.
- Export reproductible : `scripts/export_ddd_osm_arcgis_stop_crosswalk.mjs`.

## Résultat de l'export

- 16 relations DDD candidates rapprochées d'une couche d'arrêts ArcGIS.
- 374 membres d'arrêt OSM avec coordonnées, chacun conservé dans son ordre d'origine.
- Pour chaque membre : identifiant OSM, séquence, rôle, nom, coordonnées, couche ArcGIS, OBJECTID du point le plus proche, nom et coordonnées ArcGIS, distance en mètres et classe de proximité.
- 192 membres ont leur point ArcGIS le plus proche à 25 m ou moins ; 230 à 50 m ou moins ; 282 à 100 m ou moins.
- Toutes les lignes de l'export sont marquées `UNVERIFIED_CANDIDATE`.

## Résultats par relation

Les comptes sont ceux des membres OSM dont le point ArcGIS le plus proche est dans le rayon indiqué. Ils ne mesurent pas une identité certaine entre deux arrêts.

| Ligne | Relation OSM | Membres | ≤25 m | ≤50 m | ≤100 m | Médiane (m) |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 6951328 | 38 | 34 | 35 | 36 | 1,6 |
| 7 | 6990669 | 31 | 6 | 10 | 17 | 95,5 |
| 7 | 7500475 | 34 | 28 | 30 | 31 | 2,2 |
| 4 | 6990830 | 34 | 2 | 6 | 14 | 111,2 |
| 4 | 7203970 | 32 | 24 | 24 | 24 | 2,2 |
| 9 | 6996431 | 32 | 7 | 15 | 23 | 53,2 |
| 9 | 7487218 | 29 | 27 | 27 | 28 | 1,7 |
| 10 | 6990845 | 30 | 5 | 10 | 21 | 71,4 |
| 10 | 7488283 | 25 | 18 | 20 | 22 | 2,1 |
| 121 | 2792903 | 3 | 3 | 3 | 3 | 1,3 |
| 121 | 6990794 | 27 | 24 | 24 | 26 | 1,6 |
| 121 | 6999013 | 7 | 2 | 4 | 5 | 45,8 |
| 23 | 7495279 | 51 | 12 | 22 | 32 | 67,3 |
| 6 | 7499433 | 1 | 0 | 0 | 0 | 211,0 |
| 8 | 7495137 | 0 | — | — | — | — |
| 18 | 7499475 | 0 | — | — | — | — |

## Lecture et prochaines vérifications

- Les relations 6951328 (ligne 1), 7500475 (7), 7203970 (4), 7487218 (9), 7488283 (10) et 6990794 (121) présentent les rapprochements géographiques les plus cohérents.
- Les relations 6990669 (7), 6990830 (4), 6990845 (10), 6996431 (9), 6999013 (121) et 7495279 (23) demandent une revue plus poussée.
- Les relations 7495137 (8) et 7499475 (18) n'ont pas de séquence d'arrêts OSM dans l'extraction.
- La relation 7499433 reste en conflit : référence 6, nom de ligne 7, un seul arrêt et éloignement de 211 m.
- Les relations à références multiples, dont 7108131 (L23;L5), restent hors attribution automatique.

## Limites

La méthode choisit le point ArcGIS le plus proche de chaque membre OSM. Un même OBJECTID ArcGIS peut donc être le plus proche de plusieurs membres OSM ; ce rapprochement n'est pas un appariement un-à-un. La proximité seule ne confirme ni le nom, ni le terminus, ni la direction, ni l'exploitation actuelle. L'ordre de réponse des entités ArcGIS n'est pas certifié comme ordre opérationnel. Aucun retour n'est inventé, aucune fréquence n'est déduite et aucune donnée passager ou donnée de production n'est modifiée.

Le fichier CSV d'audit conserve les 374 correspondances candidates et leurs identifiants exacts. Le script du dépôt permet de le régénérer à partir des deux JSON d'extraction.
