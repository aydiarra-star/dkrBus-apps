# DDD — correction du rapprochement ArcGIS et inventaire strict des séquences candidates

Date : 16 novembre 2026  
Branche : `feature/multimodal-alternatives-and-transfers`  
Service source : `Dem_dikk_mise_a_jour/FeatureServer` — extraction en lecture seule.

## Correction technique

Le générateur `scripts/build_ddd_arcgis_candidate_sequences.mjs` joignait les identifiants de tracés ArcGIS tels quels. Le CSV de rapprochement sérialise certains identifiants numériques sous la forme `18.0`, tandis que le GeoJSON utilise `18`. La jointure échouait donc même lorsque les identifiants désignaient la même entité.

Le générateur normalise désormais les identifiants numériques avant la jointure, sans transformer une valeur vide en identifiant `0`. Deux tests couvrent ces cas :
- `1.0` doit retrouver la géométrie dont l'identifiant est `1` ;
- un identifiant vide doit rester vide et ne jamais correspondre à une géométrie d'identifiant `0`.

## Résultat du rapprochement strict après normalisation

En appliquant les règles déjà présentes dans le générateur — groupe entier géolocalisé, identifiants uniques, tous les arrêts à 25 m ou moins de la géométrie, un seul identifiant et nom de tracé cohérents — on obtient :

- **18 groupes de lignes candidates** ;
- **593 points d'arrêt candidats** ;
- **6 groupes exclus** pour ambiguïté ou incohérence ;
- **0 ligne activée automatiquement** dans le calculateur passager.

| Ligne DDD | Points candidats |
|---|---:|
| 1 | 44 |
| 2 | 32 |
| 4 | 29 |
| 5 | 18 |
| 6 | 60 |
| 7 | 33 |
| 8 | 49 |
| 9 | 36 |
| 10 | 26 |
| 11 | 23 |
| 12 | 40 |
| 16A | 13 |
| 16B | 30 |
| 18 | 44 |
| 23 | 54 |
| 121 | 31 |
| 227 | 8 |
| 232 | 23 |
| **Total** | **593** |

Ces candidats sont triés par chaînage géométrique le long de la polyligne ArcGIS. Cet ordre décrit une progression spatiale sur la géométrie historique ; il ne prouve pas le sens commercial, le retour, ni la desserte actuelle.

## Groupes conservés hors intégration

| Groupe source | Points | Motif |
|---|---:|---|
| groupe sans code de ligne | 2 | pas de rattachement fiable à une ligne nommée |
| ligne 13 — `LIgne_13` | 22 | deux groupes source distincts partagent la même géométrie 13 ; ne pas choisir arbitrairement |
| ligne 13 — `ligne_13` | 23 | même ambiguïté de géométrie partagée |
| ligne 217 | 30 | un arrêt est à 62,2 m de la géométrie, donc le groupe entier reste en revue |
| ligne 218 | 103 | mélange spatial de points 218 et de points candidats 219, avec doublons exacts |
| ligne 228 | 4 | aucune géométrie nommée « Ligne 228 » ; une géométrie non nommée est seulement un candidat |

### Précisions sur les cas sensibles

- **218/219 :** la couche d'arrêts attribue 103 enregistrements au groupe `ligne_218`. L'analyse spatiale distingue 37 positions cohérentes avec la géométrie 218 et 33 positions cohérentes avec la géométrie 219, répétées une seconde fois. La séparation est une piste de correction source, pas une réaffectation automatique.
- **13 :** les deux groupes de 22 et 23 arrêts sont chacun proches de la géométrie 13. Les fusionner ou décider qu'ils représentent l'aller et le retour serait une hypothèse non démontrée.
- **228 :** trois des quatre points sont proches d'une polyligne non nommée ; le quatrième est à environ 85,5 m. Le numéro de ligne n'est pas prouvé par cette seule proximité.
- **217 :** les 29 autres points sont proches de la polyligne, mais le point terminus à 62,2 m empêche l'activation stricte de l'ensemble.

## Fraîcheur et limites

Les métadonnées ArcGIS indiquent que la couche d'arrêts a été modifiée le 24 septembre 2024, alors que les géométries de lignes remontent au 11 janvier 2019. Les 18 groupes sont donc des **candidats géométriques historiques**, pas une preuve d'exploitation actuelle en novembre 2026.

Aucun horaire, intervalle, compte à rebours, retour ou arrêt commercial n'est déduit de ces données. Aucun de ces 593 points n'est injecté dans le graphe multimodal, le catalogue passager ou la carte opérationnelle par ce correctif.

## Recoupement des séquences publiées DDD

Le workflow CI a comparé les 18 séquences candidates triées par chaînage aux séquences publiées par DDD. L'algorithme recherche des repères nommés communs dans le même ordre ; il ne certifie ni l'identité de chaque arrêt, ni le sens commercial, ni l'exploitation actuelle.

Résultat :
- **14 lignes compatibles avec l'ordre publié** ;
- **0 ligne compatible uniquement en ordre inverse** ;
- **4 lignes non résolues** ;
- certification de direction : **aucune**.

| Ligne | Arrêts officiels | Points ArcGIS | Repères communs ordonnés | Résultat |
|---|---:|---:|---:|---|
| 1 | 22 | 44 | 8 | ordre compatible |
| 2 | 35 | 32 | 2 | non résolu |
| 4 | 26 | 29 | 4 | ordre compatible |
| 5 | 15 | 18 | 2 | non résolu |
| 6 | 25 | 60 | 10 | ordre compatible |
| 7 | 21 | 33 | 5 | ordre compatible |
| 8 | 28 | 49 | 3 | ordre compatible |
| 9 | 24 | 36 | 5 | ordre compatible |
| 10 | 29 | 26 | 7 | ordre compatible |
| 11 | 16 | 23 | 2 | non résolu |
| 12 | 20 | 40 | 5 | ordre compatible |
| 16A | 19 | 13 | 2 | non résolu |
| 16B | 27 | 30 | 7 | ordre compatible |
| 18 | 41 | 44 | 9 | ordre compatible |
| 23 | 40 | 54 | 8 | ordre compatible |
| 121 | 25 | 31 | 7 | ordre compatible |
| 227 | 16 | 8 | 3 | ordre compatible |
| 232 | 15 | 23 | 3 | ordre compatible |

Les repères forts incluent notamment :
- ligne 1 : Parcelles Assainies, Acapes, rond-point 26, VDN, UCAD, Tilène, Place de l'Indépendance et Leclerc ;
- ligne 6 : Cambérène, Police des Parcelles, U.26, Foire, Liberté 6, Liberté 5, Allées Papa Guèye Fall et Faidherbe ;
- ligne 10 : Liberté 5, Derklé, Bourguiba, Aimé Césaire, Corniche Ouest, Sorano et Pasteur ;
- ligne 16B : Malika, Thiaroye, Peytavin, Jean Jaurès, Hôpital Principal, Le Dantec et Palais 1 ;
- ligne 121 : Scat Urban, Liberté 6, Canal 4, Allées Papa Guèye Fall, Faidherbe, Place de l'Indépendance et Leclerc.

**Interprétation :** les 14 résultats rendent plausible que l'ordre croissant du chaînage suit l'ordre de plusieurs repères publiés. Ils ne prouvent pas que tous les points ArcGIS sont des arrêts voyageurs actuels. Les 4 lignes non résolues restent exclues de toute intégration directionnelle. Aucune ligne n'est encore déclarée aller/retour dans le calculateur.

## Prochaine étape

Rapprocher ces 18 séquences candidates avec les séquences publiées par DDD et les autres sources indépendantes, en contrôlant les terminus, les noms d'arrêts et les deux sens séparément. Seules les lignes corroborées pourront ensuite être intégrées au calculateur. Les horaires TER/BRT et leur affichage restent hors périmètre.
