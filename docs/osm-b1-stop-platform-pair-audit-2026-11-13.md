# OSM B1 — distinction entre arrêts et quais dans les deux sens

Date : 13 novembre 2026  
Source : extraction OpenStreetMap via Overpass, artefact du workflow 43469576776  
Licence / attribution : © OpenStreetMap contributors, ODbL

## Résultat du contrôle

Les deux relations B1 ont chacune 50 membres ordonnés de rôle arrêt/quai :

| Sens OSM | Relation | Départ → arrivée | Membres bruts | Paires arrêt + quai candidates |
|---|---:|---|---:|---:|
| Aller | 19961937 | Préfecture de Guédiawaye → Petersen | 50 | 25 |
| Retour | 19961993 | Petersen → Préfecture de Guédiawaye | 50 | 25 |

Dans les deux relations, les 50 membres alternent exactement entre 25 membres de rôle `stop` et 25 membres de rôle `platform`. Chaque paire adjacente porte le même nom normalisé et les deux coordonnées sont proches :

- relation 19961937 : distance moyenne arrêt/quai 3,60 m ; maximum 7,83 m ;
- relation 19961993 : distance moyenne 3,70 m ; maximum 7,42 m.

Cela montre que le compteur brut de 50 membres ne doit pas être présenté comme 50 arrêts physiques distincts. Il décrit 25 paires arrêt/quai candidates dans chaque sens.

## Correction apportée à l'analyseur

Le script `scripts/analyze_dakar_osm_directional_pairs.mjs` a été ajusté pour :
- conserver tous les membres OSM dans `orderedStops`, sans perte d'identifiants ni de positions ;
- exposer séparément `stopMemberCount` et `stopPlatformPairCount` ;
- construire `orderedStopPlatformPairs` uniquement lorsque deux membres adjacents sont respectivement `stop` puis `platform`, ont le même nom normalisé, des coordonnées exploitables et une distance inférieure ou égale à 30 m ;
- ne pas convertir les paires candidates en arrêts opérateur validés.

La règle ne s'applique pas aux relations qui ne contiennent que des membres `platform`, comme les relations DDD examinées ici. Elle ne fusionne pas les sens aller et retour.

## Portée et limites

- Les 25 paires par sens sont des rapprochements géographiques de membres OSM, pas une validation par SunuBRT ou l'opérateur.
- L'ordre relationnel est conservé indépendamment pour chaque sens.
- Les paires ne sont pas ajoutées au catalogue voyageur.
- Aucun horaire ou intervalle n'est déduit d'OSM.
- Aucun GTFS utilisé, aucune écriture Supabase, aucun déploiement et aucune modification des données TER/BRT.

## Prochaine vérification

Faire passer le nouveau contrôle CI, puis comparer les 25 positions B1 par sens avec les arrêts et quais géographiques des couches BRT/OSM disponibles. Toute différence de nom ou de position doit rester visible jusqu'à corroboration.
