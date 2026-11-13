# Revue de rafraîchissement de l'inventaire OSM Dakar — 13 novembre 2026

## Source et exécution

Nouvelle extraction terminée avec succès par le workflow GitHub Actions `43442349218`, sur la branche `feat/admin-stop-sequence-audit-phase-a`, commit source `850a9616c0a16cb54795b603de82ac630a5e48a5`.

Archive : `dakar-osm-route-candidates` (605 080 octets), générée le 13 novembre 2026 à 14:36:42 UTC.

Le jeu JSON contient 6 610 éléments OSM, 25 relations de lignes, 2 relations `route_master`, 23 candidates de périmètre Dakar, 18 relations avec arrêts ordonnés et 522 occurrences de membres d'arrêt. Sept relations de lignes ne contiennent aucun arrêt ordonné. Deux conflits de périmètre restent signalés par l'exporteur.

La collecte a rencontré des erreurs sur plusieurs tentatives Overpass (timeout, HTTP 502 et HTTP 504), puis le workflow a terminé avec succès et a archivé le résultat. L'extraction est donc exploitable, mais les erreurs d'endpoints doivent rester visibles dans la traçabilité.

Avertissements conservés : OSM est une source cartographique communautaire, pas une preuve d'exploitation actuelle ; aucun horaire ni fréquence n'est déduit ; les directions absentes ne sont pas fabriquées.

## Découverte importante : deux groupes directionnels explicites

### Ligne 7

La relation maître OSM `7500597` (`Ligne 7`, `ref=L 7`) référence deux relations distinctes :
- `7500475` : Ouakam → Palais 1, 34 membres d'arrêt ordonnés ;
- `6990669` : Palais → Ouakam, 31 membres d'arrêt ordonnés.

Cette structure permet de conserver les deux directions comme deux parcours séparés, sans inverser artificiellement une seule séquence. Les terminus et les séquences doivent encore être rapprochés de la publication DDD ; l'association par route_master est une preuve de structuration OSM, pas une certification officielle.

### Ligne 23

La relation maître `7499003` (`Ligne 23`, `ref=L23`) référence :
- `7495279` : Palais 1 → Parcelles-Assainies, 51 membres d'arrêt, dont 31 nommés ;
- `7108131` : Parcelles-Assainies → Palais 1, 47 membres d'arrêt, dont 21 nommés.

La relation maître confirme que ces deux relations sont regroupées sous une même ligne OSM. Elle renforce la décision de conserver les deux séquences directionnelles distinctes. Les écarts de terminus relevés avec la publication DDD (Palais 1 / Palais 2 selon les sources) restent à résoudre ; aucune séquence n'est promue automatiquement au statut officiel.

## Contrôle des lignes prioritaires

| Ligne / relation | Sens ou extrémités OSM | Membres d'arrêt | Nommés | Décision |
|---|---|---:|---:|---|
| 1 — 6951328 | Parcelles → Leclerc | 38 | 14 | Candidat à forte priorité ; anomalies et écarts de séquence à contrôler |
| 4 — 6990830 | Leclerc → Liberté 5 | 34 | 11 | Garder distinct de l'autre relation de la ligne 4 |
| 4 — 7203970 | Liberté 5 → Leclerc | 32 | 7 | Sens opposé distinct, non fusionné |
| 7 — 6990669 | Palais → Ouakam | 31 | 14 | Membre du route_master 7500597 |
| 7 — 7500475 | Ouakam → Palais 1 | 34 | 11 | Membre du route_master 7500597 |
| 8 — 7495137 | Aéroport de Dakar → Palais | 0 | 0 | Géométrie seule ; ne pas fabriquer les arrêts |
| 9 — 6996431 | Palais 1 → Liberté 6 | 32 | 10 | Candidat directionnel, terminus à contrôler |
| 9 — 7487218 | Liberté 6 → Palais 1 | 29 | 8 | Candidat directionnel distinct |
| 10 — 6990845 | Palais 1 → Liberté 5 | 30 | 5 | Candidat directionnel distinct |
| 10 — 7488283 | Liberté 5 → Palais 1 | 25 | 2 | Candidat directionnel distinct |
| 18 — 7499475 | Terminus 1 → Terminus 2 | 0 | 0 | Géométrie seule ; corridor incomplet selon la revue ArcGIS |
| 23 — 7108131 | Parcelles → Palais 1 | 47 | 21 | Membre du route_master 7499003 |
| 23 — 7495279 | Palais 1 → Parcelles | 51 | 31 | Membre du route_master 7499003 |
| 121 — 6990794 | HLM Grand Yoff → Leclerc | 27 | 7 | Candidat ; terminus de départ non conforme au libellé DDD |
| 121 — 6999013 | Leclerc → HLM Grand Médine | 7 | 1 | Fragment incomplet ; ne pas inverser ni concaténer |

Les deux relations B1 (50 membres d'arrêt chacune) sont présentes dans l'inventaire, mais ne sont pas utilisées pour modifier le référentiel BRT déjà validé.

## Décisions pour la suite

1. Exploiter les deux relations maîtres 7 et 23 pour garder les directions distinctes dans les outils d'audit et les futurs rapprochements.
2. Poursuivre la ligne 1 en contrôlant individuellement les 14 membres nommés et les 24 membres sans nom, sans leur inventer de libellé.
3. Pour la ligne 8, rechercher des identifiants ou noms d'arrêts indépendants : la relation ne contient toujours aucun membre d'arrêt.
4. Pour la ligne 18, chercher le tronçon OSM manquant autour du Port, de l'Hôtel de Ville et de la Place de l'Indépendance ; ne pas compléter par inversion ou ligne droite.
5. Garder les écarts de terminus Palais 1 / Palais 2 et les relations fragmentaires sous revue humaine.

## Périmètre de sécurité

Cette revue est en lecture seule. Aucun changement n'est apporté à l'application en production, aux horaires TER/BRT, à Supabase ou au déploiement. Aucun GTFS n'a été utilisé. Aucune donnée OSM candidate n'est importée automatiquement dans les données voyageurs.
