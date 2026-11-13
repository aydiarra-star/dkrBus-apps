# Rapport reproductible du rapprochement OSM / ArcGIS DDD — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Workflow : [Audit DDD OSM-ArcGIS stop crosswalk](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/43479948817)  
Artefact : `ddd-osm-arcgis-stop-crosswalk`, ID `14065136141`  
SHA256 : `4276d69d16b83fbc45b034ed2e9806ccdc5feaf0d0c3d8aef67596b7f01bba75`

## Résultat global

Le nouveau workflow a récupéré lui-même les relations OSM et les couches DDD ArcGIS, puis exécuté le script de rapprochement. Les trois étapes ont réussi.

| Indicateur | Résultat |
|---|---:|
| Comparaisons relation / couche | 17 |
| Comparaisons multi-références signalées comme ambiguës | 1 |
| Membres OSM comparés | 421 |
| Plus proches positions ArcGIS à 15 m ou moins | 218 |
| À 50 m ou moins | 270 |
| À 100 m ou moins | 326 |
| Relations candidates sans couche DDD correspondante | 6 |

## Direction la mieux corroborée par la couche ArcGIS

La correspondance « un-à-un ordonnée » utilise un seuil de 50 m et compare l'ordre des membres OSM à l'ordre de réponse ArcGIS, puis à son inverse. C'est un diagnostic spatial : l'ordre ArcGIS n'est pas certifié comme ordre opérationnel.

| Ligne | Relation | Sens OSM | Membres OSM | À ≤15 m | Appariement ordonné 50 m, sens direct / inverse |
|---|---:|---|---:|---:|---:|
| 1 | 6951328 | Parcelles → Leclerc | 38 | 34 | 34 / 1 |
| 4 | 7203970 | Liberté 5 → Leclerc | 32 | 24 | 24 / 1 |
| 7 | 7500475 | Ouakam → Palais 1 | 34 | 27 | 30 / 1 |
| 9 | 7487218 | Liberté 6 → Palais 1 | 29 | 27 | 27 / 1 |
| 10 | 7488283 | Liberté 5 → Palais 1 | 25 | 17 | 20 / 1 |
| 23 | 7108131 | Parcelles → Palais 1 | 47 | 39 | 38 / 3 |

Les relations opposées de ces lignes obtiennent des scores nettement plus faibles contre les mêmes couches. Cela indique que les couches ArcGIS contrôlées correspondent principalement aux directions indiquées ci-dessus. Cela ne prouve pas que les sens opposés n'existent pas : ils doivent rester séparés et être vérifiés avec leurs propres sources.

## Réserve impérative sur la ligne 23

La relation 7108131 porte la référence combinée `L23;L5`. Le script la compare à la couche 23, mais marque le résultat comme ambigu. La bonne concordance géographique ne permet pas de supprimer cette ambiguïté ni de réaffecter toute la relation à la seule ligne 23.

## Automatisation ajoutée

Le workflow `.github/workflows/audit-ddd-osm-arcgis-crosswalk.yml` :
1. récupère les relations et membres ordonnés OSM ;
2. récupère les couches DDD ArcGIS ;
3. exécute `scripts/compare_ddd_osm_arcgis_stops.mjs` ;
4. publie l'artefact JSON du rapprochement.

Le script gère maintenant les références multiples sans les réduire silencieusement à une seule ligne, et conserve les identifiants ArcGIS voisins, les distances et les diagnostics d'ordre. L'extraction ArcGIS utilise désormais quatre requêtes simultanées au maximum, avec conservation de l'ordre déterministe des couches et les tentatives de reprise existantes.

## Garde-fous

Proximité et correspondance ordonnée ne prouvent pas l'identité physique de chaque arrêt, l'exploitation actuelle ni les horaires. Aucun arrêt n'est fusionné, supprimé ou renommé. Aucun sens retour n'est fabriqué. Aucune fréquence n'est déduite. Aucun GTFS utilisé. Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT ou de l'affichage passager.
