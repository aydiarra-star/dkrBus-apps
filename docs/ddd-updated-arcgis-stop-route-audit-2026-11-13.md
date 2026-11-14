# Audit de la source ArcGIS DDD mise à jour — extraction complète

Date : 13 novembre 2026.
PR : #123.
Workflow de collecte : 43447719144.
Artefact : ddd-updated-service-candidates.zip.
SHA-256 de l'archive GitHub : 51402c24568464d213b9b486ef5f6f95ba28502f37386ff7c6b5d81cb56eeaa3.

## Source

Service public distinct des FeatureServers DDD historiques déjà audités :

https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer

- Couche 0 : Arrets_Ligne_Dakar_Dem_Dikk.
- Couche 1 : Itinéraire_lignes_Dakar_Dem_Dikk.
- Référence de sortie : EPSG:4326 ; source EPSG:32628.
- Les GlobalID et tous les attributs ont été conservés.
- Pagination par identifiant d'objet ; extraction terminée sans erreur.

Fraîcheur annoncée dans les métadonnées :
- arrêts : 24 septembre 2024 ;
- données des tracés : 11 janvier 2019 ;
- schéma des tracés : 24 septembre 2024.

Cette source reste historique et distincte de l'ancien service ArcGIS. Elle ne prouve pas à elle seule l'exploitation actuelle d'une ligne.

## Résultat global

| Contrôle | Résultat |
|---|---:|
| Entités d'arrêts | 777 |
| Arrêts avec nom non vide | 750 |
| Arrêts avec référence de ligne non vide | 775 |
| Arrêts avec géométrie | 775 |
| Entités de tracé | 25 |
| Tracés avec nom de ligne non vide | 22 |
| Tracés avec géométrie | 24 |
| GlobalID d'arrêts uniques | 777/777 |
| GlobalID de tracés uniques | 25/25 |
| Valeurs du champ Id | 777 fois 0 |

Le champ Id ne permet donc pas d'identifier les arrêts métier dans cette extraction. Les GlobalID sont des identifiants techniques stables ; ils ne constituent pas des codes d'arrêt voyageurs.

Deux entités d'arrêt n'ont ni nom de ligne ni géométrie. Vingt-sept entités d'arrêt ont un nom vide. Trois entités de tracé n'ont pas de nom de ligne ; l'une des trois n'a pas de géométrie.

## Inventaire des arrêts par ligne

Les clés de ligne sont normalisées uniquement pour le comptage ci-dessous. Les valeurs source originales, notamment leur casse, restent conservées dans l'artefact.

| Ligne | Points | Points nommés | Constat |
|---|---:|---:|---|
| 1 | 44 | 44 | Noms répétés sur des axes distincts |
| 2 | 32 | 8 | 24 noms vides |
| 4 | 29 | 29 | Points nommés |
| 5 | 18 | 18 | Longues séries de repères routiers |
| 6 | 60 | 60 | Noms répétés, terminus Justice |
| 7 | 33 | 33 | Un seul groupe de points |
| 8 | 49 | 49 | Contraste avec l'ancienne couche 8 sans noms |
| 9 | 36 | 36 | Terminus Liberté 6 / Palais 1 |
| 10 | 26 | 26 | Terminus Liberté 5 / Palais de Justice |
| 11 | 23 | 23 | Points nommés |
| 12 | 40 | 40 | Points nommés |
| 13 | 22 + 23 | 45 | Deux groupes distincts, casse source différente |
| 16A | 13 | 13 | Points nommés |
| 16B | 30 | 30 | Points nommés |
| 18 | 44 | 43 | Un nom vide |
| 23 | 54 | 54 | 54 noms dans cette source, distincts des 56 points de l'ancien service |
| 121 | 31 | 31 | Points nommés |
| 217 | 30 | 30 | Séquence candidate à contrôler |
| 218 | 103 | 103 | 33 doublons géographiques exacts dans le groupe |
| 219 | 0 | 0 | Aucun point d'arrêt attribué à cette ligne dans la couche 0 |
| 227 | 8 | 8 | Couverture très partielle |
| 228 | 4 | 4 | Couverture très partielle |
| 232 | 23 | 23 | Points nommés |

Les 775 points affectés à une ligne sont comptés dans ce tableau. Les deux entités restantes n'ont pas de référence de ligne.

## Anomalies prioritaires

### Ligne 13 — deux groupes à ne pas fusionner

Le service expose deux valeurs source distinctes :
- LIgne_13 : 22 points ;
- ligne_13 : 23 points.

Les deux groupes possèdent des GlobalID distincts et aucune coordonnée identique exacte dans le contrôle effectué. Ils ne doivent pas être fusionnés par simple normalisation de casse. Leurs terminus et leurs libellés restent à rapprocher de la page DDD, qui publie Liberté 5 → Palais 2, et de l'ancien service qui présentait déjà un conflit Palais 1 / Palais 2.

### Ligne 218 — répétition exacte et segments hétérogènes

La couche contient 103 points. Le contrôle des coordonnées et des noms retrouve 33 paires de points exactement superposés, avec les mêmes libellés, sous des OBJECTID différents. Le groupe comporte donc 70 positions géographiques distinctes après simple détection des répétitions exactes, sans supprimer les objets source.

L'ordre des enregistrements présente aussi une rupture majeure entre un groupe de points allant de Daroukhane vers le secteur Ouakam et un autre groupe commençant à « Terminus Dépôt Thiaroye 218 ». Les transitions de séquence ne doivent pas être traitées comme une direction continue. Il faut séparer les fragments et rechercher leur sens à partir des attributs, des géométries et des sources opérateur.

Ne pas déduire que les 33 répétitions sont des doublons à supprimer : conserver les deux identités et documenter le recouvrement.

### Ligne 217 — continuité à vérifier

Les 30 points sont nommés, mais plusieurs repères intermédiaires portent des noms d'axes et la séquence présente des sauts géographiques importants entre certains points consécutifs de l'ordre OBJECTID. Conserver les 30 entités et examiner les transitions avant tout appariement avec la séquence officielle Thiaroye ↔ Ouakam.

### Ligne 219 — tracé sans points d'arrêt

Le service contient un tracé nommé « Ligne 219 » et une géométrie de corridor, mais aucun arrêt portant Nom_Ligne=ligne_219 dans la couche de points. La page DDD publie Daroukhane ↔ Ouakam. Le tracé est un candidat de corridor uniquement ; ne pas lui attribuer les points d'une autre ligne.

### Lignes 2, 227 et 228

- Ligne 2 : 32 points, dont 24 sans nom.
- Ligne 227 : 8 points nommés seulement.
- Ligne 228 : 4 points nommés seulement.

Ces volumes ne couvrent pas à eux seuls les séquences publiées DDD. Les points manquants ne doivent pas être générés à partir des noms de corridors.

### Lignes 8 et 23 — différences entre générations ArcGIS

La nouvelle source contient 49 points nommés pour la ligne 8, alors que l'ancienne couche examinée avait 49 points sans nom. La nouvelle source contient 54 points nommés pour la ligne 23, alors que l'ancienne couche en comptait 56, dont deux anonymes.

Ces écarts sont conservés comme différences entre services et extractions ; ils ne prouvent ni ajout ni suppression d'arrêts voyageurs.

## Tracés et attributs de corridor

La couche de tracés contient 25 entités, dont 22 avec un nom de ligne non vide et 24 avec une géométrie. Elle apporte des descriptions de corridors et des longueurs géométriques pour plusieurs lignes urbaines et de banlieue.

Les attributs Itinérair* décrivent des axes et secteurs, pas une liste exhaustive d'arrêts ni deux séquences directionnelles indépendantes. L'ordre de retour des entités et des champs n'est pas assimilé à un ordre commercial sans preuve de séquencement.

Les couches de points et de tracés sont conservées séparément. Aucun arrêt n'est fusionné entre lignes, même si les noms ou les coordonnées se ressemblent.

## Décisions et prochaine passe

1. Comparer les points nommés de ce service aux séquences publiées DDD, ligne par ligne, avec un appariement un-à-un et un contrôle de l'ordre source.
2. Traiter en premier les lignes 217 et 218, puis 2, 11, 12, 16A, 16B, 227, 228 et 232.
3. Examiner la ligne 219 à partir de son tracé uniquement, sans inventer ses arrêts.
4. Résoudre séparément les deux groupes de la ligne 13.
5. Comparer les points 8 et 23 entre générations ArcGIS, sans écrasement ni dédoublonnage inter-service.
6. Conserver les identifiants source, les noms répétés, les noms vides et les géométries manquantes.
7. Établir les directions uniquement à partir de preuves directionnelles distinctes. Ne jamais inverser une liste publiée pour créer un retour.

## Garde-fous

Extraction documentaire en lecture seule. Aucun arrêt ou parcours n'est promu au catalogue passager. Aucun horaire ou intervalle n'est déduit. Aucun import Supabase, aucun déploiement et aucune modification de production. TER/BRT restent intouchables. GTFS reste hors périmètre.
