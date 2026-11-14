# DDD — rapprochement global des séquences publiées avec ArcGIS

Date de l'analyse : 14 novembre 2026  
Workflow source : [43561007316](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/43561007316) — audit ArcGIS actualisé, lecture seule  
Artefact : `14100520531` — `ddd-all-published-sequence-crosscheck.json`  
Sources comparées : `src/data/dddPublishedRoutes.ts`, `src/data/dddSuburbanPublishedRoutesB.ts` et service ArcGIS DDD actualisé (édition source du 24 septembre 2024).

## Résultat global

- 39 séquences publiées comparées.
- 22 séquences disposent d'un groupe de points ArcGIS portant la référence de ligne ; 17 n'ont aucun groupe correspondant dans ce service.
- 775 points ArcGIS répartis dans les groupes correspondants.
- 56 paires de noms communs et 56 correspondances en sous-séquence dans l'ordre de réponse ArcGIS.
- Aucun de ces résultats ne certifie à lui seul l'ordre voyageurs : l'ordre de réponse du service ArcGIS est un signal de comparaison, pas une séquence opérationnelle validée.

## Détail par séquence

| Ligne | Type de séquence | Points ArcGIS | Repères publiés | Noms communs | Correspondances ordonnées |
|---|---|---:|---:|---:|---:|
| 1 | Ordonnée | 44 | 22 | 5 | 5 |
| 4 | Ordonnée | 29 | 27 | 1 | 1 |
| 7 | Ordonnée | 33 | 21 | 3 | 3 |
| 8 | Ordonnée | 49 | 28 | 2 | 2 |
| 9 | Ordonnée | 36 | 24 | 3 | 3 |
| 10 | Ordonnée | 26 | 29 | 3 | 3 |
| 13 | Ordonnée | 45 | 24 | 4 | 4 |
| 18 | Circuit | 44 | 42 | 1 | 1 |
| 20 | Circuit | 0 | 42 | 0 | 0 |
| 23 | Ordonnée | 54 | 40 | 4 | 3 |
| 121 | Ordonnée | 31 | 25 | 5 | 5 |
| 2 | Ordonnée | 32 | 35 | 1 | 1 |
| 5 | Ordonnée | 18 | 15 | 1 | 1 |
| 6 | Ordonnée | 60 | 24 | 5 | 5 |
| 11 | Ordonnée | 23 | 16 | 1 | 1 |
| 12 | Ordonnée | 40 | 20 | 4 | 4 |
| 16A | Ordonnée | 13 | 19 | 2 | 2 |
| 16B | Ordonnée | 30 | 27 | 5 | 5 |
| 208 | Ordonnée | 0 | 7 | 0 | 0 |
| 213 | Ordonnée | 0 | 17 | 0 | 0 |
| 218 | Ordonnée | 103 | 15 | 4 | 5 |
| 219 | Ordonnée | 0 | 19 | 0 | 0 |
| 220 | Ordonnée | 0 | 16 | 0 | 0 |
| 221 | Ordonnée | 0 | 15 | 0 | 0 |
| 227 | Ordonnée | 8 | 16 | 1 | 1 |
| 228 | Ordonnée | 4 | 4 | 0 | 0 |
| 232 | Ordonnée | 23 | 15 | 1 | 1 |
| 234 | Ordonnée | 0 | 13 | 0 | 0 |
| 217 | Ordonnée | 30 | 15 | 0 | 0 |
| 233 | Ordonnée | 0 | 15 | 0 | 0 |
| 311 | Circuit | 0 | 6 | 0 | 0 |
| 327 | Ordonnée | 0 | 11 | 0 | 0 |
| TO1 | Ordonnée | 0 | 10 | 0 | 0 |
| 319 | Ordonnée | 0 | 17 | 0 | 0 |
| 501 | Séquence périurbaine publiée | 0 | 6 | 0 | 0 |
| 502 | Séquence périurbaine publiée | 0 | 8 | 0 | 0 |
| 503 | Séquence périurbaine publiée | 0 | 8 | 0 | 0 |
| TAF_TAF | Séquence périurbaine publiée | 0 | 17 | 0 | 0 |
| 15 | Séquence périurbaine publiée | 0 | 18 | 0 | 0 |

## Priorités de rapprochement

- **Lignes 1, 6, 16B et 121 :** cinq correspondances chacune. Ce sont les meilleurs rapprochements par noms et ordre de réponse dans ce lot. Ils restent à confronter aux directions, aux coordonnées et aux éventuelles répétitions avant toute validation.
- **Lignes 12 et 13 :** quatre correspondances chacune ; même statut de candidat, pas d'import automatique.
- **Ligne 218 :** cinq correspondances, mais le groupe ArcGIS comporte 103 points et se mélange spatialement avec un candidat ligne 219. Ne pas attribuer les 103 points à la seule ligne 218.
- **Ligne 23 :** quatre noms communs mais seulement trois dans la sous-séquence ordonnée ; conserver les écarts et les références mixtes sans réaffectation.
- **Lignes 217 et 233 :** conflits déjà documentés entre titres de terminus et contenu de séquence. Les résultats ne résolvent pas ces conflits.
- **17 séquences sans groupe ArcGIS correspondant :** cela signifie seulement qu'aucun groupe n'a été trouvé dans ce service et ce filtre de référence. Cela ne signifie pas que les lignes ou arrêts n'existent pas.

## Décision et garde-fous

Cet audit sert à classer les prochains rapprochements manuels et à repérer les lignes prioritaires. Il ne valide ni les deux sens, ni l'exhaustivité des arrêts, ni les horaires. Aucun arrêt n'est créé, supprimé, fusionné ou réattribué ; aucune direction retour n'est déduite par inversion. Les boucles 18/20 et les séquences périurbaines restent distinctes. Aucun import automatique, aucune écriture Supabase, aucun déploiement. TER et BRT restent strictement inchangés.
