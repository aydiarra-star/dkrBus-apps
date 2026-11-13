# DDD — contrôle spatial des arrêts ArcGIS sur les tracés de banlieue

Date de collecte : 13 novembre 2026.  
Source : FeatureServer public `Dem_dikk_mise_a_jour`, couches `Arrets_Ligne_Dakar_Dem_Dikk` et `Itinéraire_lignes_Dakar_Dem_Dikk`.  
Artefact analysé : `ddd-updated-arcgis-sequence-audit`, extraction de 777 arrêts et 25 tracés.

## Méthode

Les points et tracés sont fournis en longitude/latitude WGS84 par l'exporteur. Chaque point est projeté sur la polyligne de chaque tracé ciblé, avec une projection locale en mètres adaptée au contrôle de proximité dans l'emprise de Dakar. La distance au tracé et le chaînage géométrique sont calculés.

Le chaînage sert uniquement à ordonner les points le long d'une géométrie pour l'audit. Il ne prouve ni le sens commercial, ni l'ordre réel de desserte, ni que le tracé représente le service actuellement exploité. Les résultats ne réaffectent, ne fusionnent et ne suppriment aucun enregistrement.

## Résultats principaux

| Ligne | Arrêts ArcGIS étiquetés | Proximité au tracé portant le même numéro |
|---|---:|---|
| 217 | 30 | 29 à 25 m ou moins ; 30 à 100 m ou moins |
| 218 | 103 | 51 à 25 m ou moins ; 51 à 100 m ou moins |
| 219 | 0 | Tracé présent, mais aucun arrêt étiqueté 219 |
| 227 | 8 | 8 à 25 m ou moins |
| 228 | 4 | Tracé anonyme « Terminus Rufisque – ville de Rufisque » ; association au numéro non automatique |
| 232 | 23 | 23 à 25 m ou moins |

La ligne 217 présente un point à environ 62 m du tracé, les 29 autres étant à 25 m ou moins. Les huit points de la ligne 227 et les 23 points de la ligne 232 sont à moins de 25 m de leurs tracés étiquetés. Ce rapprochement spatial fort ne valide pas, à lui seul, leur ordre de passage ou le sens.

## Anomalie majeure : étiquetage de la ligne 218

Les 103 enregistrements étiquetés 218 se répartissent, dans l'ordre de réponse de la couche, en trois blocs :

- 33 points Daroukhane → Ouakam ;
- 37 points Dépôt Thiaroye → Aéroport LSS ;
- 33 points Daroukhane → Ouakam répétés une seconde fois.

Les deux blocs de 33 points ont les mêmes noms et coordonnées point par point. Ils restent néanmoins 66 enregistrements sources distincts et ne sont pas supprimés.

Le contrôle de proximité donne :

| Bloc source étiqueté 218 | Points | À 25 m ou moins du tracé 218 | À 25 m ou moins du tracé 219 |
|---|---:|---:|---:|
| Daroukhane → Ouakam (premier bloc) | 33 | 7 | 33 |
| Dépôt Thiaroye → Aéroport LSS | 37 | 37 | 7 |
| Daroukhane → Ouakam (bloc répété) | 33 | 7 | 33 |

Le tracé ArcGIS nommé 219 est donc géométriquement compatible avec les deux blocs Daroukhane → Ouakam, tandis que le tracé 218 est compatible avec le bloc Dépôt Thiaroye → Aéroport LSS. C'est une forte indication d'une attribution erronée des deux blocs de 33 points sous l'étiquette 218.

**Décision : ne pas réattribuer automatiquement ces 66 enregistrements à la ligne 219.** Conserver l'étiquette source 218, l'identifiant GlobalID, l'OBJECTID, les coordonnées et les deux rapprochements géométriques. La piste de correction devra être corroborée par la fiche opérateur DDD et la séquence publiée de la ligne 219.

## Ligne 228 : tracé anonyme

La couche contient un tracé de 28,70 km nommé « Terminus Rufisque – ville de Rufisque », sans valeur `Nom_Ligne`. La couche d'arrêts contient quatre points associés à 228. Le rapprochement antérieur indique trois points à 25 m ou moins et les quatre à 100 m ou moins du tracé anonyme. Le nom du corridor rend la correspondance plausible, mais l'identifiant de ligne reste absent de la géométrie source : ne pas compléter ce champ dans la donnée brute.

## Suite du chantier

1. Rechercher une confirmation opérateur DDD de l'attribution Daroukhane → Ouakam à 219.
2. Vérifier séparément les séquences Aller et Retour de 217, 218 et 219 ; ne pas inverser une liste unique pour fabriquer le retour.
3. Conserver les tracés anonymes et les points partiels 228 comme candidats documentés.
4. Rapprocher les points OSM et les relations de bus par identifiants, noms, géométrie et terminus ; les relations OSM restent une preuve cartographique complémentaire.
5. Ne publier aucun changement dans le catalogue passager avant revue.

Aucune écriture Supabase, aucun déploiement et aucune modification des données TER/BRT.


## Contrôle automatisé reproductible

Le script `scripts/project_ddd_arcgis_stops_onto_routes.mjs` et le workflow `.github/workflows/audit-ddd-updated-arcgis.yml` exécutent maintenant cette projection et déposent le rapport `ddd-stop-route-spatial-projection.json` avec les extractions brutes et le rapprochement nominal.

Exécution GitHub Actions du 13 novembre 2026 :
- workflow « Audit updated DDD ArcGIS service (read only) » : **succès** ;
- les étapes d'extraction, de comparaison nominale, de projection géométrique et de dépôt de l'artefact ont toutes réussi ;
- artefact `ddd-updated-service-and-sequence-audit`, SHA-256 `6aaa528a46ccad8c9e493ad3ffea9fed3ad9988d2367f78135b4359081eb59d8`.

Le rapport automatisé confirme 168 points examinés sur les six lignes, cinq tracés identifiés par leur numéro, 111 points à 25 m ou moins de leur propre tracé numéroté et 112 à 100 m ou moins. Le cas 218 reste le principal conflit : 33 groupes nom/coordonnées répétés et 69 enregistrements dont le tracé 219 est le plus proche à 25 m ou moins, contre 27 dont le tracé 218 est le plus proche à cette distance. Ces comptes automatiques ne changent pas l'étiquette de ligne des sources.
