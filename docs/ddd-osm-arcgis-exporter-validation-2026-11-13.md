# Validation reproductible du croisement OSM–ArcGIS DDD

Date : 13 novembre 2026.

## Exécution indépendante

Le script versionné `scripts/export_ddd_osm_arcgis_stop_crosswalk.mjs` a été exécuté localement avec Node.js 22.16.0 sur les deux artefacts archivés :

- OSM : `dakar-osm-route-candidates.json`, généré le 2026-11-13T13:33:56.721Z.
- ArcGIS : `ddd-route-stop-candidates.json`, généré le 2026-11-13T13:29:26.350Z.

Vérifications :
- `node --check` : réussi.
- Exécution du script : réussie.
- 374 lignes de données, 14 relations, 20 colonnes.
- Catégories exclusives : 192 à ≤25 m ; 38 entre 25 et 50 m ; 52 entre 50 et 100 m ; 92 au-delà de 100 m ; 0 sans coordonnées.
- 375 lignes dans le fichier CSV en comptant l'en-tête.

## Fichier complet

Le fichier exporté avec le script versionné est fourni séparément sous le nom :

`ddd-osm-arcgis-stop-crosswalk-2026-11-13-verified.csv`

Il conserve les identifiants de membres OSM, le rôle, les coordonnées, le nom et l'identifiant ArcGIS le plus proche, la distance, la bande de proximité et le statut `UNVERIFIED_CANDIDATE`.

Un ancien export simplifié de neuf colonnes existe également dans l'espace de travail. Il ne remplace pas ce fichier détaillé à 20 colonnes. Pour les prochaines comparaisons, utiliser le format détaillé généré par le script versionné.

## Limites conservées

- Le point ArcGIS le plus proche n'est pas nécessairement le même arrêt.
- Le rapprochement est plusieurs-vers-un possible ; aucune unicité d'identifiant ArcGIS n'est imposée.
- Les seuils de distance ne confirment ni l'ordre commercial, ni le sens, ni l'exploitation actuelle.
- Aucun candidat n'est promu automatiquement en arrêt validé.
