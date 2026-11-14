# Corroboration géographique OSM / ArcGIS de la ligne DDD 1 — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Sources : relation OSM 6951328 et couche ArcGIS `Arrets_LIgne_1_Dakar_Dem_Dikk`.  
Attribution OSM : © OpenStreetMap contributors, ODbL.

## Avancée majeure

Le rapprochement de la ligne 1 ne repose plus seulement sur les cinq noms communs. Les 38 positions ordonnées OSM ont été comparées aux 44 points de la couche ArcGIS DDD.

| Contrôle spatial | Résultat |
|---|---:|
| Membres OSM ordonnés | 38 |
| Points ArcGIS | 44 |
| Plus proche point ArcGIS à 15 m ou moins | 34 / 38 |
| Plus proche point ArcGIS à 50 m ou moins | 35 / 38 |
| Plus proche point ArcGIS à 100 m ou moins | 36 / 38 |
| Distance médiane au point ArcGIS le plus proche | 1,71 m |
| Distance moyenne | 13,86 m |
| Transitions successives avec OBJECTID ArcGIS non décroissant dans l'ordre OSM | 37 / 37 |

Les 35 transitions strictement croissantes et deux égalités sont compatibles avec un ordre spatial très cohérent entre la relation OSM et les points ArcGIS. Le rapprochement est un plus proche voisin, pas une association individuelle validée : un même point ArcGIS peut être le plus proche de plusieurs membres OSM.

## Lecture

Les deux sources décrivent le même corridor de manière fortement concordante :
- terminus OSM Parcelles Assainies → Leclerc, compatibles avec la ligne DDD 1 publiée ;
- 34 positions OSM à moins de 15 mètres d'un point ArcGIS ;
- ordre des positions OSM qui suit intégralement l'ordre croissant des identifiants ArcGIS voisins ;
- cinq correspondances de noms exactes dans l'ordre : terminus Parcelles Assainies, Terrain Acapes, UCAD, Marché Tilène et Place de l'Indépendance.

Trois membres OSM sont plus éloignés de 50 mètres du point ArcGIS le plus proche, dont deux dépassent 100 mètres. Ils doivent être examinés individuellement avant d'être associés à un arrêt précis. Les 24 membres OSM sans nom restent sans nom : la géométrie ne donne pas le droit de leur attribuer automatiquement le libellé ArcGIS voisin.

## Décision proposée pour la base de travail

Statut : **candidat fortement corroboré géographiquement pour le sens Parcelles Assainies → Leclerc**.

La relation OSM 6951328 et les 44 points ArcGIS peuvent être rapprochés dans une table d'audit avec identifiants sources et distances. Ne pas encore remplacer la séquence DDD publiée ni afficher ces 38 membres comme 38 arrêts passagers validés. Le retour reste à trouver dans les sources, sans inversion artificielle.

## Prochaine étape

Appliquer la même méthode de rapprochement spatial ordonné aux lignes DDD 4, 7, 9, 10 et 23, en traitant séparément les conflits de terminus et la référence combinée `L23;L5`. Puis prioriser les lignes 8 et 121 où les sources actuelles sont incomplètes.

## Garde-fous

Le rapprochement est une corroboration entre deux sources, pas une validation de l'exploitation actuelle ni des horaires. Aucun arrêt n'est fusionné, supprimé ou renommé. Aucun sens retour n'est fabriqué. Aucune fréquence n'est déduite. Aucun GTFS utilisé. Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT ou de l'affichage passager.
