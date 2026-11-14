# DDD — intersections spatiales entre couches d'arrêts

Date : 14 novembre 2026

## Méthode

Analyse des 12 couches de points d'arrêt du second service ArcGIS DDD, soit 455 entités. Les coordonnées de l'artefact sont en longitude/latitude WGS84. Les distances entre points sont calculées avec la formule haversine. Les résultats sont des rapprochements spatiaux entre couches différentes, pas des identifications d'arrêts physiques communs.

## Résultats

| Seuil de proximité | Paires de points candidates | Couples de couches concernés |
|---|---:|---:|
| ≤ 1 m | 130 | 43 |
| ≤ 3 m | 329 | 55 |
| ≤ 25 m | 396 | 62 |

Les nombres de paires ne représentent pas des arrêts uniques : un même point peut être proche de plusieurs entités dans une autre couche, et les couches peuvent contenir des points répétés. Les rapprochements sont donc volontairement conservés comme candidats et ne sont pas dédupliqués.

## Exemples de rapprochements à examiner

- Lignes 6 et 9 : plusieurs points très proches, dont des repères autour de Liberté 5, Cheikh Sidaty Aidara et Boulevard Général de Gaulle.
- Lignes 7 et 1 : proximité de points autour de l'UCAD et de l'avenue Cheikh Anta Diop.
- Lignes 10 et 4 : correspondances géographiques autour de Rue GY-583 et Sérigne Fallou Mbacké.
- Lignes 13 et 18 : plusieurs points proches autour de l'avenue Cheikh Ahmadou Bamba et du terminus Liberté 5.
- Ligne 8 et ligne 23 : plusieurs proximités autour de l'avenue du président Bourguiba ; la couche 8 n'ayant pas de noms d'arrêt, elle ne peut pas être validée par le nom.

## Interprétation et limites

Une proximité de quelques mètres peut signaler un arrêt partagé, deux quais opposés, des points de plateforme, une géométrie dupliquée ou simplement deux arrêts voisins. Elle ne suffit pas à conclure à l'identité d'un arrêt. Les écarts entre couches peuvent aussi refléter des relevés différents.

Aucune fusion, suppression, correction de nom, affectation d'itinéraire, déduction de sens, d'ordre, de fréquence ou d'horaire n'est autorisée par cette seule analyse.

## Décision

1. Conserver chaque point avec son GlobalID et sa couche d'origine.
2. Utiliser ces résultats pour prioriser les vérifications de terrain et les rapprochements avec les pages officielles DDD.
3. Traiter en premier les couples de couches 6/9, 7/1, 10/4 et 13/18, sans modifier les données sources.
4. Garder les deux couches ligne 13 séparées ; leur rapprochement spatial interne est documenté dans le rapport dédié.

Source : artefact public en lecture seule `ddd-arcgis-route-stop-candidates.json`, workflow GitHub Actions `43559717906`, artefact `14100166432`. Aucune écriture base de données, aucun changement des données voyageurs et aucun déploiement.
