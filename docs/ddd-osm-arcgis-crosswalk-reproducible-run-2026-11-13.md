# Rapport reproductible du rapprochement OSM / ArcGIS DDD — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Workflow : [Audit DDD OSM-ArcGIS stop crosswalk](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/43480155081)  
Artefact : `ddd-osm-arcgis-stop-crosswalk`, ID `14065011231`  
SHA256 : `394ce58665d1cadacf3d777819aead3b364fe82400de7e4a5a9b06e49dbf1da0`

## Résultat global

Le workflow a récupéré lui-même les relations OSM et les couches DDD ArcGIS, puis exécuté le script de rapprochement. Les trois étapes ont réussi. L'extraction ArcGIS optimisée à quatre requêtes simultanées a également réussi.

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

Le script gère maintenant les références multiples sans les réduire silencieusement à une seule ligne, et conserve les identifiants ArcGIS voisins, les distances et les diagnostics d'ordre. L'extraction ArcGIS utilise quatre requêtes simultanées au maximum, avec conservation de l'ordre déterministe des couches et les tentatives de reprise existantes. Cette nouvelle extraction et le rapprochement ont tous deux réussi dans le workflow référencé ci-dessus.

## Garde-fous

Proximité et correspondance ordonnée ne prouvent pas l'identité physique de chaque arrêt, l'exploitation actuelle ni les horaires. Aucun arrêt n'est fusionné, supprimé ou renommé. Aucun sens retour n'est fabriqué. Aucune fréquence n'est déduite. Aucun GTFS utilisé. Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT ou de l'affichage passager.

## Re-exécution indépendante du 13 novembre 2026 — 18:29 UTC

Le workflow en lecture seule a été relancé sur le commit `0e674518f34ea82488b6fa0277fa6eae348e4772` et a terminé avec succès (artefact GitHub Actions `14066751074`).

Résultats de cette extraction :

- 17 comparaisons relation OSM / couche d'itinéraire DDD ;
- 421 membres d'arrêts OSM comparés ;
- 218 correspondances les plus proches à 15 m ou moins ;
- 270 à 50 m ou moins ;
- 326 à 100 m ou moins ;
- 1 comparaison portant une référence multi-ligne ambiguë ;
- 6 relations candidates sans couche d'arrêts DDD correspondante.

Les relations OSM 1434825 (réf. 36) et 3982642 (réf. 40) restent des candidates sans couche DDD correspondante, et non des itinéraires validés à importer. Les relations B1 19961937 et 19961993 ont chacune 50 membres d'arrêts OSM ; elles ne doivent pas être attribuées au réseau DDD. Les deux autres candidats n'ont pas de référence exploitable.

Cette ré-exécution confirme la reproductibilité du rapprochement spatial. Elle ne transforme pas une proximité géographique en validation d'exploitant et ne modifie aucune séquence passager.
