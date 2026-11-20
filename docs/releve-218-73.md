# DDD 218 et AFTU 73 vers Niague : ce qui est utilisable

**Quatre départs de référence sont consignés ; aucune grille arrêt par arrêt n’a été reçue.** Le [commentaire de la PR](https://github.com/aydiarra-star/dkrBus-apps/pull/275#issuecomment-7031395979) renvoie à une autre conversation pour le détail. Dans l’audit des lignes (administration), le [résumé transcrit](../data/bus-review/reported-218-73.json) reste consultable sans ouvrir un panneau voyageurs. La date du commentaire n’est pas la date de circulation.

| Ligne et sens, selon le résumé | Départ fourni à l’origine | Intervalle annoncé pour la ligne |
|---|---:|---:|
| DDD 218 · Poste Thiaroye → terminus 7218/219 | 05:28 | 16 min |
| DDD 218 · terminus 7218/219 → Poste Thiaroye | 05:28 | 16 min |
| AFTU 73 · Station Ciel Oil/Thiaroye → terminus de la ligne 73 à Niague | 05:31 | 10 min |
| AFTU 73 · terminus de la ligne 73 à Niague → Station Ciel Oil/Thiaroye | 05:31 | 10 min |

Le texte mentionne aussi **05:30** pour la 73. Rien ne permet d’en faire le premier départ d’un sens, un passage en plus ou une correction de 05:31. Deux origines à la même heure sur la 218 sont possibles, pas contradictoires en soi. Pour ces quatre sens : **arrivée, durée, dernier passage, date, type de jour, période et document primaire inconnus**. L’asymétrie des durées de la 73 est signalée mais non chiffrable. Aucune observation de véhicule ni validation opérateur. Il n’y a donc ni compte à rebours du jour ni départ supplémentaire issu de 10 ou 16 minutes.

## Lac Rose et Niague : variante ou remplacement ?

**Non tranché.** La [carte AFTU](https://aftu-senegal.org/map/dakar-urbain-ligne-73/) marque « TERMINUS POSTE THIAROYE » → « TERMINUS LAC ROSE ». La [grille de semaine](depot-thiaroye.md) en sens opposé donne **Lac Rose 05:55 → CEM Thiaroye 06:53 → dépôt 06:54** (59 min pour ce départ). Les fiches ont 75 rangs par sens ; l’[ordre des arrêts](../src/data/aftu-73-directions.json) comporte déjà « École Elémentaire Niaga », « Cem Niaga » et « Marché De Niaga » aux rangs 3, 4, 7 vers Thiaroye, et aux rangs 73, 72, 69 vers Lac Rose. Un secteur desservi n’identifie pas le terminus du nouveau relevé. Ni les 75 libellés ni les minutes interpolées entre les trois repères ne sont recopiés dans la 73 de Niague. L’ancienne grille et ses deux panneaux restent intacts.

**Les ZIP historiques ne sont pas l’original manquant.** Le [contrôle de tous les appels](../data/bus-review/reference-archives.json) joint les courses par ID et trie leurs rangs numériques, dans deux [archives épinglées](https://github.com/impactsolutionsas/passbi_core/tree/7a2b99824699cb10daf69852c8fbecb746200d77/gtfs_folder). Dernier jour des calendriers réguliers : 31/12/2023, pas une validité de ce relevé. Lecture à la minute, sans arrondir ni décaler le début des courses :

| Archives, et elles seules | Rangs × courses | Départs dans la ou les minutes du résumé |
|---|---:|---|
| `D_686` Terminus Poste Thiaroye → `D_23` Terminus 7218 219 | 34 × 87 | 0 à 05:28 |
| `D_23` → `D_686` | 35 × 66 | 0 à 05:28 |
| `A_586` Station Ciel Oil → `A_559` Terminus De La Ligne 73 | 78 × 119 | 0 à 05:30 ; 0 à 05:31 |
| `A_559` → `A_266` Station Ciel Oil | 79 × 111 | 0 à 05:30 ; 0 à 05:31 |

Au retour, `A_586` est le **78e** appel, `A_266` le **79e**, malgré le même nom. Ce contrôle ne prouve **pas** que `A_559` correspond à Niague ni que `D_23` est le terminus signalé aujourd’hui. Les durées d’archives restent dans le fichier de comparaison, pas dans le relevé. La 218 officielle Thiaroye–LSS et la grille secondaire depuis **Rufisque** restent elles aussi indépendantes.

**Pour lever le blocage** : conserver cette version du résumé ; joindre séparément pour chaque sens l’original ordonné (rang, libellé, HH:MM), y compris doublons et éventuel changement de jour indiqué par la source. Relever les bornes, le jour de service et la provenance si connus. Le [contrôle de transcription](../src/admin/reportedRunReview.ts) signale bornes discordantes, rangs manquants/doublés, heures invalides ou décroissantes, sans trier, interpoler ou normaliser les noms. Le cas de minuit exige une indication explicite du jour suivant. Une durée ainsi calculée décrirait **une course**, pas toute la ligne.

## Trois lieux, six sens contrôlés séparément

| Lieu | Dans un sens | Dans l’autre | Pourquoi le calculateur ne propose rien |
|---|---|---|---|
| Poste Thiaroye · 218 / 73 de Niague | 05:28 est le **départ** de la 218 au terminus opposé à Poste, pas sa descente à Poste. 05:31 est le départ de la 73 à Ciel Oil. | 05:31 est un départ de Niague, pas l’arrivée avant une 218 partant de Poste. | Ni trois minutes de marge ni une marche à zéro mètre. Les [deux dessins sortants](depot-thiaroye.md) du dossier Lac Rose ne valent pas pour les deux arrivées de ce dossier. |
| Ponty · DDD 1 / 7 | Le [poteau 4666430941 v3](https://www.openstreetmap.org/node/4666430941/history/3) figure au rang **36/38** de la [1 vers Leclerc](https://www.openstreetmap.org/relation/6951328/history/28) et **30/34** de la [7 vers Palais 1](https://www.openstreetmap.org/relation/7500475/history/14). L’appel précédent de la 1 est `4666430943` ; le suivant de la 7, `4754571946`. Les 119 et 160 courses d’archives appelaient `D_128`, Cbao Ponty. | Vers Ouakam puis les Parcelles, les 138 courses de la 7 et 89 de la 1 appelaient `D_122`, **Poste Ponty** (rangs 7/36 et 4/43). Le [poteau 711879280 v2](https://www.openstreetmap.org/node/711879280/history/2), près de cet ancien arrêt, [n’a pas de relation parente](https://api.openstreetmap.org/api/0.6/node/711879280/relations.json). | Au premier poteau, inverser l’ordre des numéros **ne retourne pas les véhicules**. La [fiche DDD](https://demdikk.sn/reseau-urbain-dakar/) nomme Palais **2**. Vérifier le sens exploité, la permission de rester à cet emplacement et deux appels datés. |
| Gare routière de Colobane · AFTU 75 / 65 | [Fin de la 75 depuis Malika](https://aftu-senegal.org/map/dakar-urbain-ligne-75/) et [début de la 65 vers Jaxaay 2](https://aftu-senegal.org/map/dakar-urbain-ligne-65/) : **0,4 m entre symboles**, **1,4 m entre bouts des tracés**. Dans l’archive : `A_1869 → A_1564` sur 74 arrivées de la 75 ; `A_1564 → A_1401` sur 62 départs de la 65. | Dans l’archive : `A_1400 → A_1564` sur 79 arrivées de la 65 ; `A_1564 → A_1868` sur 60 départs de la 75. Ces deux rôles **ne sont pas dessinés** par les deux cartes précédentes. | L’ancienne 65 allait à **Kounoune École Mbaba**. Un ID commun dans l’archive ou deux symboles voisins ne donnent ni porte, ni délai à quai. La [gare TER de Colobane](colobane-walking-transfer-audit-2026-11-16.md) est encore un autre site : pas de traversée vérifiée entre les accès. |

À Colobane, on peut vérifier **le temps sur deux fiches**, sans prétendre vérifier une correspondance : en semaine la [75 depuis Marché](https://moovitapp.com/index/fr/transport_en_commun-time-75-Dakar-5996-1618038-18051476-4256273-0) donne 03:50 → 04:33, puis la [65 depuis Gare De Colobane](https://moovitapp.com/index/fr/transport_en_commun-time-65-Dakar-5996-1618038-18051436-4256193-0) indique 04:42 (Rocade Bel Air 04:43). Écart **9 min**. Au retour, la [65 depuis Jaxaay](https://moovitapp.com/index/fr/transport_en_commun-time-65-Dakar-5996-1618038-18051436-4256192-0) donne 04:20 → 05:11 et la [75 vers Yeumbeul](https://moovitapp.com/index/fr/transport_en_commun-time-75-Dakar-5996-1618038-18051476-4256272-0) indique 05:16 (rue HLM 225 à 05:17) : **5 min**. Ce sont deux écarts bruts entre fiches hebdomadaires secondaires ; ni la destination de la 75, ni l’affectation du jour, ni le temps réellement disponible entre portes ne sont certifiés. Aucun horaire de ces fiches n’a été ajouté au moteur.

## Ce qui a changé dans la recherche

- Le [balayage régional](../scripts/bus_change_candidates.py) ne se limite plus aux changements entre réseaux. Pour DDD → DDD ou AFTU → AFTU, il faut deux références de ligne distinctes et non ambiguës, des relations orientées, un membre `platform` compatible, un membre précédent pour la descente et un suivant pour la montée. Un `stop_area`, une inscription « L23;L5 » ou le premier arrêt d’une ligne ne prouvent pas une descente. Le [reçu](../data/bus-review/within-bus-families.json) donne les compteurs complets et **des exemples**, pas le graphe régional.
- Au [job régional](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44682883487/job/136110227623), **336 occurrences DDD** examinables : **58 objets partagés, 246 couples ordonnés d’occurrences, 26 couples ordonnés de numéros**, aucune paire de quais distincts reliée pour ces rôles. Aucun membre AFTU satisfaisant ces critères dans cet extrait. Le [job des dessins AFTU](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44682883570/job/136110227472) trouve indépendamment **49 couples orientés** fin → départ d’une autre ligne à 20 m ou moins **sur les deux mesures**. Ce ne sont pas 49 lieux distincts ou 49 correspondances. Entre réseaux, TER et BRT compris : 967 objets, 57 touchant un chemin, 52 chemins orientés, **0 entre rôles interréseaux identifiés**. Données OSM : [© les contributeurs, ODbL](https://www.openstreetmap.org/copyright).
- Un trajet **direct** modélisé peut encore être affiché comme tel. En revanche, la recherche voyageurs ne joint plus deux courses via une marche si l’une n’a qu’une cadence ou une durée modélisée. Il faut deux services datés avec temps par appel. Une arrivée estimée plus rapide ne peut pas masquer une arrivée datée au même endroit.
- La revue hors ligne répond désormais à « ces **deux** courses peuvent-elles s’enchaîner **par ce chemin** ? », même si un autre bus direct serait plus rapide. Elle restreint le balayage aux appels et voies déjà admis, conserve direction, marge et calendrier, puis contrôle les étapes réellement retournées. Un essai avec un modèle peut être marqué `MODELLED_ONLY`, jamais `DATED_WITNESS`. Aucun identifiant de revue n’est ajouté à la carte voyageurs.

### Rejouer sans publier

```sh
python -m scripts.audit_reference_archives /chemin/Dem_Dikk.zip /chemin/AFTU.zip | cmp - data/bus-review/reference-archives.json
npx vitest run src/admin/{reportedRunReview,transferWitness}.test.ts src/routing/{transferReview,search}.test.ts
node scripts/audit_passenger_transfers.mjs --at 2026-11-20T05:28 --json
node scripts/audit_place_connections.mjs --at 2026-11-19T19:00 --matrix | cmp - data/bus-review/replay-calculateur-2026-11-19.json
```

La [CI AFTU](../.github/workflows/audit-aftu-official-routes.yml) vérifie les empreintes des ZIP, puis le reçu d’archives octet par octet. Les nouvelles mesures de terrain **à demander** restent les mêmes dans chacun des sens : identification et côté des deux portes ; autorisation de rester sur place avec délai minimal ou chemin public orienté avec accès et traversées ; deux courses concordantes pour la même date. Aucun opérateur contacté, aucune visite sur place ni publication en production.
