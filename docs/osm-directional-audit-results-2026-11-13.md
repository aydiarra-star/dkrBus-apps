# Résultat de l'audit directionnel OSM — 13 novembre 2026

## Exécution vérifiée

- Dépôt : `aydiarra-star/dkrBus-apps`
- Branche : `feat/admin-stop-sequence-audit-phase-a`
- Commit audité : `2db71ec4a66db41d08c08ffa06712d3ce1e73767`
- Workflow : [Audit Dakar OSM bus routes (read only)](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/43453919566)
- Résultat : **success**
- Artifact : `dakar-osm-route-candidates`, SHA-256 `c2c7ea5e97e073afa69353f636d34e1fd64a1306956701459584e5f07a490f97`
- Extraction OSM produite le 13 novembre 2026 à 15:38:00 UTC.

## Résultat du rapprochement automatique

L'extraction contient 23 relations candidates dans le périmètre Dakar. Le rapprochement prudent a identifié **3 paires directionnelles candidates** : 1 paire par inversion des terminus et 2 paires par appartenance à une même relation `route_master`.

| Référence OSM | Relation A | Relation B | Indice | Conclusion |
|---|---:|---:|---|---|
| B1 | 19961937 | 19961993 | Terminus inversés, 5 membres d'arrêt communs | Candidate seulement ; opérateurs déclarés différents |
| DDD 7 | 6990669 | 7500475 | Même `route_master` 7500597 | Paire DDD candidate ; terminus génériques « Palais » / « Quakam » |
| DDD 23 | 7108131 | 7495279 | Même `route_master` 7499003 ; 2 membres communs | Paire candidate ; la relation 7108131 n'a pas un nom de ligne explicite et son ref est partagé avec L5 |

Les membres d'arrêts sont conservés dans l'ordre propre à chaque relation. Les relations ne sont ni fusionnées ni réaffectées.

## Lignes non appariées

Les relations isolées observées pour les lignes 4, 9 et 10 ne forment pas de paire automatique dans cette extraction : l'algorithme n'a trouvé ni inversion exacte des terminus ni relation `route_master` commune exploitable pour elles. Elles restent des pistes distinctes à comparer aux séquences publiées par DDD ; leur absence de paire ne signifie pas que le retour n'existe pas.

La ligne 23 nécessite une revue renforcée : la relation 7108131 porte une référence ambiguë `L23;L5` et un nom descriptif « ARRET CITE SOPRIM ». Elle ne doit pas être considérée comme un retour L23 validé sans corroboration supplémentaire.

## Portée et garde-fous

- OSM fournit ici une preuve cartographique contributive, pas une validation de l'opérateur, du service actuellement exploité, des horaires ou des fréquences.
- Les relations B1, DDD 7 et DDD 23 restent des candidates, pas des itinéraires passagers validés.
- Aucun arrêt, sens, horaire ou fréquence manquant n'est inventé.
- Aucune donnée TER/BRT n'est modifiée.
- Aucun catalogue passager, Supabase, Render ou environnement de production n'est modifié.
- Aucun GTFS n'est utilisé ni requis.

## Prochaine étape de revue

Comparer les séquences détaillées des deux relations DDD 7 et DDD 23 avec les fiches officielles déjà transcrites, puis examiner séparément les relations isolées DDD 4, 9 et 10. Toute divergence de terminus, d'ordre ou d'identifiant d'arrêt reste signalée sans correction automatique.
