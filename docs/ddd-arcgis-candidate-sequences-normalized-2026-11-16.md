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

## Prochaine étape

Rapprocher ces 18 séquences candidates avec les séquences publiées par DDD et les autres sources indépendantes, en contrôlant les terminus, les noms d'arrêts et les deux sens séparément. Seules les lignes corroborées pourront ensuite être intégrées au calculateur. Les horaires TER/BRT et leur affichage restent hors périmètre.
