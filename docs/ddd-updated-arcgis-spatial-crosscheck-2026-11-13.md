# Rapprochement spatial — arrêts et tracés du service ArcGIS DDD mis à jour

Date : 13 novembre 2026.
Source : artefact ddd-updated-service-candidates.zip.
Workflow : 43447719144.
Méthode : coordonnées de points et polylignes projetées d'EPSG:4326 vers EPSG:32628 ; distance minimale de chaque point à la géométrie de tracé candidate.

## Portée du contrôle

Ce rapprochement teste la cohérence géographique interne du service ArcGIS mis à jour. Il ne prouve pas l'identité métier de chaque arrêt, l'ordre de circulation, le sens, l'actualité du service ou la validité d'une fiche opérateur.

Les points restent attachés à leurs GlobalID et à leur Nom_Ligne source. Les entités de tracé sans Nom_Ligne restent anonymes. Aucun arrêt n'est déplacé, fusionné ou réattribué.

## Résultats par ligne

| Groupe de points source | Tracé comparé | Points | À ≤25 m | À ≤100 m | Médiane | Maximum |
|---|---|---:|---:|---:|---:|---:|
| Ligne 1 | Ligne 1 | 44 | 44 | 44 | 6,8 m | 14,9 m |
| Ligne 2 | Ligne 2 | 32 | 32 | 32 | 7,3 m | 15,0 m |
| Ligne 4 | Ligne 4 | 29 | 29 | 29 | 5,1 m | 12,2 m |
| Ligne 5 | Ligne 5 | 18 | 18 | 18 | 7,4 m | 9,5 m |
| Ligne 6 | Ligne 6 | 60 | 60 | 60 | 6,7 m | 11,6 m |
| Ligne 7 | Ligne 7 | 33 | 33 | 33 | 6,2 m | 14,3 m |
| Ligne 8 | Ligne 8 | 49 | 49 | 49 | 6,1 m | 12,1 m |
| Ligne 9 | Ligne 9 | 36 | 36 | 36 | 6,3 m | 15,3 m |
| Ligne 10 | Ligne 10 | 26 | 26 | 26 | 6,2 m | 12,2 m |
| Ligne 11 | Ligne 11 | 23 | 23 | 23 | 6,9 m | 17,1 m |
| Ligne 12 | Ligne 12 | 40 | 40 | 40 | 6,6 m | 9,5 m |
| Ligne 13, groupe LIgne_13 | Ligne 13 | 22 | 22 | 22 | 7,7 m | 10,7 m |
| Ligne 13, groupe ligne_13 | Ligne 13 | 23 | 23 | 23 | 6,5 m | 10,5 m |
| Ligne 16A | Ligne 16A | 13 | 13 | 13 | 7,8 m | 13,4 m |
| Ligne 16B | Ligne 16B | 30 | 30 | 30 | 8,1 m | 16,8 m |
| Ligne 18 | Tracé anonyme, longueur 18,57 km | 44 | 44 | 44 | 5,0 m | 8,4 m |
| Ligne 23 | Ligne 23 | 54 | 54 | 54 | 5,7 m | 10,5 m |
| Ligne 121 | Ligne 121 | 31 | 31 | 31 | 5,8 m | 10,9 m |
| Ligne 217 | Ligne 217 | 30 | 29 | 30 | 6,2 m | 62,2 m |
| Ligne 218, bloc Thiaroye–Aéroport | Ligne 218 | 37 | 37 | 37 | 6,9 m | 16,1 m |
| Ligne 218, bloc Daroukhane–Ouakam | Ligne 219 | 33 | 33 | 33 | 7,3 m | 9,8 m |
| Ligne 227 | Ligne 227 | 8 | 8 | 8 | 6,1 m | 9,0 m |
| Ligne 228 | Tracé anonyme, longueur 28,70 km | 4 | 3 | 4 | 8,4 m | 85,5 m |
| Ligne 232 | Ligne 232 | 23 | 23 | 23 | 5,9 m | 9,7 m |

## Découverte majeure — attribution potentiellement erronée du bloc de 33 points

Le groupe source ligne 218 compte 103 entités :
- 33 points de la séquence Daroukhane → secteur Ouakam ;
- une répétition exacte de ces mêmes 33 coordonnées et libellés sous d'autres OBJECTID ;
- 37 points d'un autre bloc allant de Thiaroye vers l'Aéroport LSS.

Le rapprochement géométrique donne :
- bloc de 37 points : 37/37 à 25 m ou moins du tracé nommé Ligne 218 ;
- bloc de 33 points : 33/33 à 25 m ou moins du tracé nommé Ligne 219 ;
- les 33 points du premier bloc sont répétés à l'identique dans le second bloc, soit 70 positions uniques pour 103 enregistrements.

La séquence officielle publiée pour la ligne 219 est Daroukhane → Ouakam ; celle de la ligne 218 est Thiaroye → Aéroport LSS. Les terminus, les noms et les géométries concordent donc avec une hypothèse de mauvaise attribution des 33 points de ligne 219 sous l'étiquette source ligne 218.

**Décision :** conflit d'attribution très fortement corroboré spatialement, mais pas corrigé automatiquement. Conserver les 66 enregistrements originaux, les 33 paires de GlobalID et la qualification « candidat d'attribution ligne 219 ». Ne pas supprimer les répétitions ni réécrire Nom_Ligne sans revue de la source.

La ligne 219 dispose ainsi d'un tracé et de 33 points candidats géographiquement cohérents, malgré l'absence de points étiquetés ligne 219 dans le champ Nom_Ligne de la couche d'arrêts.

## Tracés anonymes — lignes 18 et 228

Deux entités de tracé ont une géométrie mais aucun Nom_Ligne :
- tracé de 18,57 km : les 44 points de la ligne 18 sont tous à 25 m ou moins, médiane 5,0 m ;
- tracé de 28,70 km : les 4 points de la ligne 228 sont tous à 100 m ou moins, dont 3 à 25 m ou moins.

Ces rapprochements permettent de proposer des identités candidates pour les deux tracés anonymes. La correspondance de la ligne 18 est particulièrement forte ; celle de la ligne 228 est plus limitée, avec un point à 85,5 m. Garder les noms de ligne absents dans la source et documenter les rapprochements sans réécrire les attributs.

## Ligne 217 et couverture des points

Le groupe de 30 points de la ligne 217 est très proche de son tracé : 29/30 à 25 m ou moins et 30/30 à 100 m ou moins. Un point s'écarte à 62,2 m. Il faut conserver cet écart comme candidat à revue, sans le déplacer.

Les lignes 227 et 228 ont peu de points dans la couche d'arrêts (8 et 4). Leur proximité avec un tracé ne prouve pas que la liste soit exhaustive.

## Conséquences pour la suite

1. Séparer le bloc ligne 218 en trois groupes documentaires : 33 points, leur répétition exacte de 33 points, et le bloc de 37 points.
2. Comparer le bloc de 33 points à la séquence officielle de la ligne 219 et rechercher une preuve opérateur complémentaire avant toute réattribution.
3. Garder le bloc de 37 points comme candidat de la ligne 218.
4. Associer les deux tracés anonymes aux lignes 18 et 228 uniquement comme rapprochements candidats.
5. Comparer les noms et l'ordre de toutes les lignes aux séquences DDD publiées, sans traiter OBJECTID comme ordre voyageurs certifié.
6. Conserver les deux groupes ligne 13 indépendants malgré leur proximité respective avec le tracé ligne 13.
7. Ne pas fabriquer de retour, de fréquence ou d'horaire.

## Garde-fous

Aucune écriture Supabase, aucun import au catalogue passager, aucun déploiement, aucune modification de production ou des données TER/BRT. Aucun GTFS utilisé. L'analyse reste documentaire et en lecture seule.
