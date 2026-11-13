# Audit de cohérence des paires directionnelles OSM DDD — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Source : extraction Overpass du 13 novembre 2026 à 17:12 UTC  
Attribution : © OpenStreetMap contributors, ODbL

## Objectif

Aller au-delà du simple rapprochement des terminus : comparer les membres d'arrêts ordonnés, les identifiants OSM communs et les noms normalisés entre les deux relations candidates d'une même ligne. Ce contrôle évite de traiter deux relations comme un aller/retour fiable uniquement parce que leurs champs `from` et `to` sont inversés.

## Résumé des six paires candidates

| Ligne | Relation A | Relation B | Membres A/B | Identifiants OSM communs | Noms distincts communs | Similarité Jaccard |
|---|---:|---:|---:|---:|---:|---:|
| DDD 4 | 6990830 | 7203970 | 34 / 32 | 0 | 2 | 0,154 |
| DDD 7 | 6990669 | 7500475 | 31 / 34 | 1 | 6 | 0,353 |
| DDD 9 | 6996431 | 7487218 | 32 / 29 | 0 | 6 | 0,500 |
| DDD 10 | 6990845 | 7488283 | 30 / 25 | 3 | 1 | 0,167 |
| DDD 23 | 7108131 | 7495279 | 47 / 51 | 2 | 8 | 0,182 |
| BRT B1 | 19961937 | 19961993 | 50 / 50 membres bruts | 5 | 24 | 1,000 |

La similarité Jaccard compare les ensembles de noms distincts après normalisation ; elle ne tient pas compte de l'ordre et ne prouve pas l'identité physique des arrêts. Les membres bruts sont conservés intégralement dans l'artefact.

## Conclusions par ligne

### DDD 4 — correspondance faible à approfondir

Les terminus déclarés sont inversés (Leclerc ↔ Liberté 5), mais les deux relations n'ont aucun identifiant d'arrêt commun et seulement deux noms normalisés communs. En outre, la relation annoncée « Leclerc → Liberté 5 » commence dans sa séquence par « Port de Dakar » et finit par un membre nommé « Patisen ». Les champs terminus et les membres ordonnés ne se corroborent donc pas suffisamment.

Décision : paire candidate uniquement. Ne pas importer comme itinéraire bidirectionnel validé.

### DDD 7 — conflit de terminus

Les relations déclarent Palais → Ouakam et Ouakam → Palais 1. Le qualificatif « Palais » n'est pas identique à « Palais 1 ». Une seule identité OSM de membre est commune ; six noms sont partagés. La relation A commence par « Gare Palais 2 », ce qui renforce la nécessité de distinguer Palais, Palais 1 et Palais 2.

Décision : garder la paire en conflit de terminus, sans fusion ni correction automatique.

### DDD 9 — meilleur recouvrement de noms parmi les paires DDD sans identifiants communs

Les terminus déclarés sont inversés (Palais 1 ↔ Liberté 6). Six noms normalisés sont communs, avec une similarité Jaccard de 0,500, mais aucun identifiant OSM de membre n'est commun. La séquence A contient notamment des arrêts nommés autour de Liberté 6 ; la relation B commence à Liberté 6. Les ordres et géométries restent à comparer avant validation.

Décision : priorité haute pour un rapprochement spatial des noms et des positions, mais statut toujours candidat.

### DDD 10 — divergence de terminal côté Palais

Les champs terminus sont inversés (Palais 1 ↔ Liberté 5), avec trois identifiants OSM communs, mais seulement un nom normalisé commun. La relation annoncée depuis Palais 1 commence par « Gare Palais 2 ». Cette divergence est bloquante pour une canonicalisation automatique.

Décision : conserver les deux séquences séparées et résoudre le terminal exact.

### DDD 23 — référence OSM ambiguë

Les terminus déclarés sont inversés (Parcelles Assainies ↔ Palais 1). Les relations partagent deux identifiants OSM et huit noms normalisés. Cependant, la relation aller porte une référence combinée `L23;L5`, qui ne permet pas d'attribuer sans ambiguïté toute la relation à la seule ligne 23.

Décision : candidate multi-référence ; ne pas attribuer automatiquement toute la séquence à DDD 23. Priorité à une vérification de la référence et du tracé.

### BRT B1 — cohérence géographique forte, mais source communautaire

Les deux relations ont 50 membres bruts chacune, soit 25 paires arrêt/quai candidates par sens. Les deux sens ont 24 noms distincts normalisés en commun (Jaccard 1,000) et cinq identifiants OSM communs. Les 25 paires arrêt/quai par sens sont adjacentes, de même nom et distantes de moins de 30 m.

Décision : bon candidat de cohérence OSM pour une comparaison avec les 23 stations BRT officielles. Ce résultat ne remplace pas les données BRT validées ni leurs horaires et fréquences.

## Correction technique de l'analyseur

Le script `scripts/analyze_dakar_osm_directional_pairs.mjs` calcule désormais pour chaque paire :
- les nombres de noms distincts par sens ;
- la liste et le nombre des noms normalisés communs ;
- la similarité Jaccard ;
- les identifiants OSM communs et les paires stop/platform candidates.

L'ordre des membres est conservé séparément pour chaque relation. Les noms normalisés ne sont utilisés que pour mesurer le recouvrement, jamais pour fusionner ou supprimer des arrêts. Les champs terminus ne suffisent plus à conclure à la validation d'une paire.

## Priorités de la suite

1. DDD 9 : comparer les six noms communs et leurs coordonnées, dans l'ordre, avec les fiches officielles DDD et ArcGIS.
2. DDD 7 et 10 : résoudre les conflits Palais / Palais 1 / Palais 2 par la géométrie et les fiches opérateur.
3. DDD 23 : établir si la relation `L23;L5` couvre réellement la ligne 23, la ligne 5 ou un itinéraire commun.
4. DDD 4 : contrôler la séquence réelle au regard des champs terminus, car les premiers et derniers membres ne corroborent pas les terminus déclarés.
5. B1 : rapprocher les 25 positions candidates de chaque sens avec les stations et quais BRT connus, sans modifier la base BRT.

## Garde-fous

Aucun arrêt n'est supprimé, fusionné ou renommé. Aucun sens retour n'est créé par inversion. Aucun horaire ou intervalle n'est déduit d'OSM. Aucun GTFS utilisé. Aucune écriture Supabase, aucun déploiement et aucune modification du catalogue passager ou des données TER/BRT protégées.
