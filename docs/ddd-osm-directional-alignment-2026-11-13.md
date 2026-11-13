# Alignement des directions OSM avec les séquences DDD publiées — 13 novembre 2026

## Méthode

Comparaison des terminus des relations OSM de l'extraction du 13 novembre 2026 à 15:38 UTC avec l'ordre de référence présent dans `src/data/dddOfficialUrbanPublishedRoutes.ts`.

Le sens publié DDD est gardé comme référence d'orientation. Une relation OSM dont les extrémités sont inversées est identifiée comme le sens opposé. Les membres OSM ne sont jamais assimilés automatiquement aux arrêts DDD : les noms peuvent manquer, les membres peuvent désigner des quais, et les nombres de points ne sont pas équivalents aux repères publiés.

## Résultat direction par direction

| Ligne | Sens de la fiche DDD | Relation OSM dans le même sens | Membres (nommés) | Relation OSM en sens opposé | Membres (nommés) |
|---|---|---:|---:|---:|---:|
| 4 | Liberté 5 → Leclerc (26 repères) | 7203970 | 32 (7) | 6990830 | 34 (11) |
| 7 | Ouakam → Palais 2 (21 repères) | 7500475 | 34 (11) | 6990669 | 31 (14) |
| 9 | Liberté 6 → Palais 2 (24 repères) | 7487218 | 29 (8) | 6996431 | 32 (10) |
| 10 | Liberté 5 → Palais 2 (29 repères) | 7488283 | 25 (2) | 6990845 | 30 (5) |

## Écarts à garder visibles

- **Ligne 4 :** les extrémités OSM correspondent à celles de la fiche DDD, mais aucune relation maître commune n'a été identifiée. La paire repose sur l'inversion des terminus. La relation 7203970, dans le sens publié, comporte 25 membres sans nom.
- **Ligne 7 :** les deux relations sont reliées à la relation maître OSM 7500597. La relation 7500475 suit le sens publié, mais se termine à « Palais 1 » ; la fiche DDD indique « Palais 2 ». La relation opposée commence par un membre nommé « Gare Palais 2 », ce qui ne suffit pas à harmoniser les libellés de terminus.
- **Ligne 9 :** la relation 7487218 suit le sens publié Liberté 6 → Palais, mais son terminus OSM est « Palais1 » ; DDD publie « Palais 2 ». Les membres OSM ne sont pas tous nommés.
- **Ligne 10 :** la relation 7488283 suit le sens publié Liberté 5 → Palais, mais se termine à « Palais 1 » contre « Palais 2 » chez DDD. Seuls 2 de ses 25 membres sont nommés.

## Décisions

1. Les quatre paires restent deux séquences OSM distinctes par ligne ; aucune séquence n'est inversée artificiellement.
2. Le sens OSM correspondant à la fiche DDD est repéré, mais il ne constitue pas une validation des arrêts.
3. Les membres sans nom restent présents avec leurs identifiants OSM ; aucun nom ne leur est attribué.
4. Les divergences « Palais », « Palais 1 », « Palais 2 » restent des divergences de source, pas des alias automatiques.
5. Les nombres de membres OSM et de repères DDD ne sont jamais utilisés pour supprimer ou fusionner des arrêts.

## Périmètre

Analyse documentaire en lecture seule. Aucun horaire, intervalle ou temps de passage n'est déduit. Aucune donnée TER/BRT, donnée passager, base Supabase, service Render ou production n'est modifiée. Aucun GTFS n'est utilisé.
