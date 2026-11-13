# Résultat de l'audit directionnel OSM — 13 novembre 2026

## Exécution vérifiée

- Dépôt : `aydiarra-star/dkrBus-apps`
- Branche : `feat/admin-stop-sequence-audit-phase-a`
- Dernier commit du correctif : `97f8026a7f7d45768b30d612d9b10a8d2cc8912f`
- Dernier audit OSM de ce commit : [run 43458582381](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/43458582381), encore en attente au moment de cette mise à jour.
- Dernier audit OSM terminé et vérifié : [run 43453919566](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/43453919566), **success**, sur le commit précédent.
- Artifact vérifié de cette exécution précédente : `dakar-osm-route-candidates`, SHA-256 `c2c7ea5e97e073afa69353f636d34e1fd64a1306956701459584e5f07a490f97`.
- Extraction OSM produite le 13 novembre 2026 à 15:38:00 UTC.

## Correction de rapprochement

Le premier contrôle strict ne reconnaissait pas certaines paires car OSM mélange les libellés « Terminus », « Termibus » et les formes avec/sans espace avant le numéro (ex. « Palais 1 » / « Palais1 », « Liberté 5 » / « Liberté5 »).

Le script `scripts/analyze_dakar_osm_directional_pairs.mjs` normalise désormais ces seuls préfixes et espaces de terminus, tout en conservant les numéros distincts : « Palais 1 » ne devient jamais « Palais 2 ». Le test local sur l'extraction vérifiée identifie six paires candidates :

| Référence | Relations | Indice détecté | Réserve |
|---|---:|---|---|
| B1 / SunuBRT | 19961937 ↔ 19961993 | Terminus inversés | Opérateur non renseigné dans les deux relations ; ce n'est pas une ligne DDD |
| DDD 4 | 6990830 ↔ 7203970 | Terminus inversés | Pas de relation maîtresse commune |
| DDD 7 | 6990669 ↔ 7500475 | Relation maîtresse 7500597 | « Palais » / « Palais 1 » reste une divergence de libellé |
| DDD 9 | 6996431 ↔ 7487218 | Terminus inversés | Pas de relation maîtresse commune ; « Palais 1 » vs « Palais1 » est une différence d'espacement seulement |
| DDD 10 | 6990845 ↔ 7488283 | Terminus inversés | Pas de relation maîtresse commune ; conserver le conflit Palais 1 / Palais 2 avec la fiche DDD |
| DDD 23 | 7108131 ↔ 7495279 | Terminus inversés et relation maîtresse 7499003 | Relation 7108131 avec référence composée `L23;L5`, donc pas de preuve exclusive L23 |

Les séquences d'arrêts sont conservées dans l'ordre propre à chaque relation. Les relations ne sont ni fusionnées ni réaffectées. Le nombre de paires ci-dessus est un résultat de test local ; le nouveau workflow doit encore confirmer la production de l'artefact après correction.

## Lignes non appariées

Les autres relations isolées restent des pistes à comparer aux séquences publiées DDD. L'absence de paire automatique ne signifie pas que le retour n'existe pas : elle signifie seulement que les critères stricts de terminus inversés ou de relation maîtresse commune ne l'ont pas détecté.

## Portée et garde-fous

- OSM fournit une preuve cartographique contributive, pas une validation de l'opérateur, du service actuellement exploité, des horaires ou des fréquences.
- Les six paires restent des candidates, pas des itinéraires passagers validés.
- Aucun arrêt, sens, horaire ou fréquence manquant n'est inventé.
- Aucune donnée TER/BRT n'est modifiée.
- Aucun catalogue passager, Supabase, Render ou environnement de production n'est modifié.
- Aucun GTFS n'est utilisé ni requis.

## Prochaine étape de revue

Comparer les deux séquences OSM DDD 7 et DDD 23 avec les fiches officielles déjà transcrites, puis vérifier les lignes 4, 9 et 10 en gardant visibles les différences de terminus, de nombre et d'ordre des arrêts. Les références ambiguës restent en revue humaine.
