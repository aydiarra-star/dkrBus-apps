# Patte d’Oie : deux poteaux reliés, deux services à confirmer

**Ce que la carte établit :** un chemin de **23,7 m** relie le [poteau nommé DDD](https://www.openstreetmap.org/node/4697843990) au [poteau TATA](https://www.openstreetmap.org/node/4697855389) ; le parcours se retrouve dans les deux sens. **Ce que le calculateur ne peut pas annoncer pour jeudi 19 novembre 2026 :** descendre de la 218 à l’un, monter dans la 60 à l’autre et arriver à destination. Dans OpenStreetMap, aucun des deux objets ne précise de numéro de ligne ni de rôle de montée/descente. Le chemin n’est donc pas ajouté au graphe voyageur.

**Dans l’application** : ouvrir **Explorer → DDD → 218 → Dépôt Thiaroye vers Aéroport LSS**, ou **Explorer → AFTU / TATA → TATA → 60 → Bargny vers Colobane**. « Changer à Patte d’Oie ? » ouvre la carte des poteaux et précise quoi demander. Cette indication ne figure ni sur l’autre sens, ni sur la 218 de Rufisque, ni sur la fiche homonyme AFTU 60. Le compteur de chaque repère reste celui de sa fiche, pas un horaire validé à ce poteau.

## Le chemin et ses limites

Le balayage de l’extrait OSM de Dakar trouve **967 objets de quai**, dont **57** ayant un nœud sur le réseau piéton examiné. Il trouve **52 parcours dirigés** d’au plus 1 200 m entre objets distincts. Parmi ceux-ci, **aucun** n’a aux deux extrémités une appartenance à des relations de réseaux différents avec des rôles compatibles ; aucun objet unique ne cumule ces deux rôles non plus. Ce n’est pas un constat d’absence de correspondances dans la ville. [Reçu régional](../data/bus-review/interchange-region-2026-11-19.json) · [exécution sur le PBF](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44635677913/job/135953425264) · [artefact intégral](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44635677913/artifacts/14583867757).

| Parcours dirigé testé | Mesure sur le chemin | Ce qui reste inconnu |
|---|---:|---|
| Patte d’Oie : DDD `4697843990` → TATA `4697855389` ; TATA → DDD testé indépendamment | **23,7 m** dans chaque sens, sur le [chemin 639363334 v3](https://api.openstreetmap.org/api/0.6/way/639363334/full.json). Les poteaux v3 sont des nœuds consécutifs de ce chemin. | Positions des portes des lignes visées, état et accès du passage, marche réelle et prochain départ. La bidirectionnalité du chemin ne donne pas le sens inverse des lignes. |
| Petersen : extrémité de quai BRT `13376766706` ↔ zébra `13376766714` | **50,7 m** dans chaque sens par `1458575519`. | Pas de point de montée R01A identifié au bout. L’indication [« juste en face »](https://www.sunubrt.sn/) ne mesure pas l’accès au bus. |
| Guédiawaye : extrémités NO `13376903833` et SE `13376903836` ↔ traversée `13376903816` | **84,8 m** (NO) et **251,4 m** (SE), aller et retour testés. | Pour chacune des deux extrémités, **aucun chemin trouvé dans l’extrait** jusqu’au poteau DDD `6440488778`, dans les deux sens. Ne pas prolonger la marche sur la boucle de service des bus. |

Les mesures partent de nœuds identifiés : elles ne commencent pas à la porte d’un véhicule. Un `highway=path` sans restriction cartographiée n’est pas une attestation d’accessibilité ou d’absence de travaux. © les contributeurs [OpenStreetMap](https://www.openstreetmap.org/copyright), ODbL 1.0.

## Quelles lignes, dans quel sens ?

Les deux poteaux sont à droite de la [chaussée à sens unique vers l’ouest](https://api.openstreetmap.org/api/0.6/way/108891328/full.json) : respectivement **12,8 et 11,7 m** de son axe. L’[arrêt DDD « Entrée Patte d’Oie », ligne 218, OID 544](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0/query?objectIds=544&outFields=*&outSR=4326&f=json) est du même côté, à **13,5 m du poteau DDD et 11,0 m du poteau TATA**. Affecter les quais au point le plus proche attribuerait le second à la DDD.

| Archive PassBi, sens et rôle | Appel entre les deux arrêts encadrants | Contrôle de l’autre sens |
|---|---|---|
| DDD 218 depuis Thiaroye vers Aéroport LSS | `D_485 → D_501 → D_657` ; `D_501` au rang **11/34**, à **6,0 m** du poteau DDD. Montée et descente régulières sur ce triplet dans les **87** courses examinées. | Aucune occurrence de `D_501` dans les **66** courses à 35 appels depuis Aéroport LSS. |
| **AFTU**, 60 depuis Bargny vers Colobane | `A_1254 → A_990 → A_1564` ; `A_990` au rang **45/46** dans **91** courses avec les deux rôles réguliers. **9,3 m du poteau DDD, 17,5 m du poteau TATA** : le libellé de secteur ne suffit pas pour choisir le poteau. | Aucune occurrence de `A_990` dans les **92** courses à 45 appels depuis Colobane. Ni ces courses ni leurs heures ne sont attribuées à TATA. |

[Contrôle reproductible des triplets, côtés et calendriers](../data/bus-review/patte-doie-occurrences.json). Les ZIP [PassBi, révision `7a2b998`](https://github.com/impactsolutionsas/passbi_core/tree/7a2b99824699cb10daf69852c8fbecb746200d77/gtfs_folder) sont identifiés par SHA-256. Les deux calendriers s’arrêtent le **31/12/2023** ; aucune exception ne les étend au jour demandé. Les poteaux ont changé de position dans OSM en septembre 2024 ([DDD](https://api.openstreetmap.org/api/0.6/node/4697843990/history.json), [TATA](https://api.openstreetmap.org/api/0.6/node/4697855389/history.json)).

- La [fiche DDD](https://demdikk.sn/reseau-urbain-dakar/) place Patte d’Oie entre Bountou Pikine et Foire depuis Thiaroye. La [grille secondaire à 69 appels](https://transitbycity.com/fr/senegal/dakar/operators/dakar-dem-dikk/routes/218/) **part de Rufisque**, non de Thiaroye. Ne pas décaler ses 25 minutes de fréquence jusqu’à `D_501`.
- La [description TATA 60](https://www.covoiturage.sn/bus-tata-itineraire/ligne/60/colobane/bargny/) relie Colobane et Bargny ; la [liste de secteurs vers Colobane](https://www.xibaaru.sn/bus-tata-voici-les-nouveaux-tarifs-document/) date de **2020**. Ni l’une ni l’autre ne nomme le poteau. La [carte officielle AFTU 60](https://aftu-senegal.org/map/dakar-urbain-ligne-60/) est marquée **Colobane → Bargny**. Le [PDF de la 60](https://appassets.mvtdev.com/map/48/l/5996/18051498.pdf) compte **48 appels vers Colobane**, dont plusieurs « Arrêt de bus » : sa plage de 04:20 à 22:00 n’est pas une heure de montée à `4697855389`.

## Le relevé qui permettrait de trancher

1. Pour **218 → 60**, identifier le véhicule 218 depuis Thiaroye, son arrêt précédent et la position exacte de sa porte à la descente. Identifier indépendamment l’opérateur de la 60 vers Colobane, son point de montée et l’arrêt suivant. Pour **60 → 218**, vérifier les deux autres rôles, sans retourner le premier relevé.
2. Suivre le chemin **porte à porte** à pied : noter extrémités, accès public, traversées, barrières, éventuels détours et durée. Les 23,7 m sont un repère pour retrouver le site ; ils ne remplacent pas le relevé. Une photo datée des panneaux ou un plan opérateur avec identifiants de quais permettrait de lever l’ambiguïté des marqueurs.
3. Obtenir pour le jour demandé les **deux courses** et les heures aux appels concernés. Tester le premier départ après **descente + marche + marge** (180 s dans l’audit, réglable dans l’application ; respecter aussi le minimum propre au changement), puis la descente à destination. Si le dernier départ est manqué, ne pas rouler l’horloge à demain. Tant que ces données manquent, durée, marge restante et prochaine montée sont **inconnues** ; ne pas saisir zéro pour les remplacer.

L’[Observatoire du CETUD](https://cetud.sn/observatoire/systeme-de-donnees/) est une piste pour une édition datée et les identifiants d’arrêt ; aucun contact n’a été effectué. Le contrôle de staging et ses champs sont décrits dans [Préparer une correspondance](preparer-une-correspondance.md). Pour rejouer sans toucher aux données voyageurs :

```sh
python -m scripts.audit_patte_doie /chemin/Dem_Dikk.zip /chemin/AFTU.zip | cmp - data/bus-review/patte-doie-occurrences.json
python -m scripts.audit_interchange_sites /chemin/dakar.osm.pbf /tmp/sites.json --regional /tmp/region.json
jq '[.directedPaths[] | select((.[:2]|sort)==["n4697843990","n4697855389"])]' /tmp/region.json
node scripts/audit_passenger_transfers.mjs --at 2026-11-19T19:00 --json | jq '.directions[] | select(.dossier=="patte-doie-ddd-tata") | [.from.mode,.to.mode,.meters,.timed.status]'
```
