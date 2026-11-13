# Rapprochement OSM / séquence DDD publiée — ligne 1 — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Source cartographique : OpenStreetMap, relation 6951328 (© OSM contributors, ODbL)  
Source opérateur : page Dakar Dem Dikk « Réseau urbain de Dakar », séquence conservée dans `src/data/dddPublishedRoutes.ts`.

## Résultat du rapprochement

La relation OSM 6951328 porte la référence 1 et décrit le trajet Parcelles Assainies → Leclerc. Les terminus sont compatibles avec la séquence publiée DDD de la ligne 1 (Parcelles Assainies → Place Leclerc).

| Indicateur | Résultat |
|---|---:|
| Membres ordonnés OSM | 38 |
| Membres avec nom exploitable | 14 |
| Membres anonymes | 24 |
| Arrêts publiés DDD | 22 |
| Correspondances exactes après normalisation, dans l'ordre | 5 |

Les cinq correspondances ordonnées :
1. Terminus Parcelles-Assainies ↔ Terminus Parcelles Assainies
2. Arrêt Terrain-Acapes ↔ Terrain Acapes
3. UCAD ↔ UCAD
4. Marché Tilène ↔ Marché Tilène
5. Place de l’Indépendance ↔ Place de l’Indépendance

La relation OSM comporte également des noms tels que PA U19, Arret Bus Aftu, Manguiers, Eglise Saint Joseph, Medina, Stade, Ville et Patisen. Ils ne sont pas forcés sur un arrêt publié par simple ressemblance. Les deux occurrences « Marché Tilène » sont conservées séparément.

## Évaluation

C'est une piste de direction aller intéressante : les terminus sont compatibles et cinq noms apparaissent dans le même ordre. Mais 24 membres sont anonymes, la correspondance ne couvre qu'une partie de la séquence publiée et aucune relation inverse de ligne 1 n'a été établie par cet audit.

Décision :
- garder la relation 6951328 comme candidat OSM du sens Parcelles Assainies → Leclerc ;
- ne pas l'utiliser seule pour remplacer la séquence DDD ;
- ne pas fabriquer le retour en inversant les 38 membres ;
- rapprocher ensuite les 38 positions OSM de la couche ArcGIS DDD ligne 1 et des 22 repères publiés.

## Garde-fous

La correspondance est une comparaison de noms ordonnée, pas une validation de desserte actuelle ni de l'identité de chaque arrêt. Aucun arrêt n'est fusionné ou supprimé. Aucun horaire ou intervalle n'est déduit. Aucun GTFS utilisé. Aucune écriture Supabase, aucun déploiement et aucune modification TER/BRT ou de l'affichage passager.
