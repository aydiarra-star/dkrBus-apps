# Prendre la DDD 1 à Médina ; où en sont les correspondances ?

**Jeudi 19 novembre 2026 à 19 h, heure de Dakar, sans édition opérateur.** La DDD 1 est calculable sur huit quais vers Leclerc et sur deux autres vers les Parcelles. Cela donne **29 directs** sur le formulaire étendu. Il n’y a pas de correspondance interréseaux admise : les deux cas les plus avancés n’ont pas la même pièce manquante.

| Essai dans Trajet | Résultat pour le voyageur |
|---|---|
| **Sur la carte** · École Manguiers → El Malick Sandaga, choisir les arrêts « DDD 1 vers Leclerc » | **2 847 m**, montée vers **19:06**, descente vers **19:19**. Le direct précédent jusqu’au Stade reste à 1 667 m et 19:14. |
| **Sur la carte** · PMI Médina → Rue 37 × Blaise Diagne, choisir « DDD 1 vers Parcelles » | **290 m**, montée vers **19:05**, descente vers **19:06**. Ce n’est pas le sens inverse du premier trajet. |
| **Sur la carte** · Colobane (référence DDD) → Diamalaye (référence AFTU) | Sous **Préparer un changement**, la **18 puis la 39** : lien vers le poteau « 18 / 39 » et sens à demander. **Pas de voyage complet, d’ETA ni de traversée proposée.** Ne pas choisir la station TER Colobane pour tester ces deux fiches de bus. |
| **Sur horaires · Maristes** · Terminus Guédiawaye → Gare de Colobane | DDD 12 **19:00–19:33**, AFTU 75 **19:38–19:54**. Les **5 min** d’écart laissent **au plus 2 min** pour se déplacer si l’on garde 3 min de marge. La durée nécessaire est inconnue. Ce n’est pas une correspondance cartographiée. |

### DDD 1 : les quais et les minutes ont des sources différentes

**Avant Leclerc.** Aux [six quais déjà relus](trajets-bus-medina-maristes.md) s’ajoutent deux appels consécutifs de la [liste géolocalisée de DDD](https://demdikk.sn/chatbot-arrets/). Rangs en base 1 : **40** Crédit Foncier et **41** El Malick Sandaga = **31** `4666430947 v7` et **32** `4666430945 v6` de la [relation Parcelles → Leclerc](https://api.openstreetmap.org/api/0.6/relation/6951328/28.json), rôle `platform`. Les écarts point DDD → quai sont **13,0 et 9,6 m** ; les quais sont à droite de l’axe orienté (**6,7 et 7,4 m**). On n’interpole pas les quais 33–34, proches l’un de l’autre.

Au giratoire de la Poste, la relation seule **n’est pas continue**. Le [tracé ArcGIS de la ligne 1, couche 1, OID 25](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/1/query?objectIds=25&outFields=Nom_Ligne&outSR=4326&f=json) corrobore le passage de ce **sens** par l’arc sud-ouest. Après `108821782`, le bus suit `430805832 v2` (partie), `411081532 v2`, `108821823 v10` (partie), `108821791 v9`, `362032755 v10` puis `430617858 v7`. Les deux parties indiquées **ne sont pas membres** de la relation. Les extrémités se joignent par **identité de nœud et de coordonnées** ; pas de segment droit entre deux ways disjoints. Le [registre OSM](../src/data/busSectionWays.ts) contient les sommets utilisés, le [compilateur](../src/routing/medinaService.ts) vérifie aussi sens, absence de boucle et progression de chaque quai à ≤20 m de la voie. Une extension invalide ne fait pas perdre la portion initiale de six quais.

**Après Leclerc.** Contrôle séparé, sans inverser le tracé ArcGIS. Les appels DDD **57 PMI Médina** et **58 Rue 37 × Blaise Diagne** sont respectivement à **2,2 et 9,7 m** des quais `4666430956 v3` et `4666430957 v7`. Ces quais sont à droite de la chaussée montante (3,7 et 7,0 m) ; les appels **11–12 `D_441` / `D_421`** de `DDD_01_LECLERC` étaient à **1,0 et 1,0 m**. L’accord est sur les occurrences de la **1**, pas sur l’appartenance des poteaux aux relations de la 4/7. Au giratoire de Sahm : `25860686 → 430812008 → 162751433 → 430810297 → 108697076`. Les points DDD 55 et 56 sont plus proches de la chaussée opposée (**3,2 et 2,4 m** de celle-ci) : pas de prêt de quai. L’appel 59 est à environ 62 m du poteau envisagé ; la portion ne se prolonge pas jusqu’à lui.

**Heures estimées**, pas de départs datés de DDD. La [publication DDD](https://demdikk.sn/) borne le départ **aux Parcelles** à 05:30–20:30 et **à Leclerc** à 06:30–21:00. Le modèle semaine non fériée (8/13 min, 18 km/h, 30 s aux arrêts intermédiaires) décale les deux origines **indépendamment**. Dans l’[archive PassBi épinglée](https://github.com/impactsolutionsas/passbi_core/tree/7a2b99824699cb10daf69852c8fbecb746200d77/gtfs_folder), le temps d’approche de Manguiers est de **2 097 / 3 518 / 4 645 s** pour 119 courses. Après Leclerc, de `D_140` à `D_441` : **631 / 1 066 / 1 355 s** pour 89 courses (min/médiane/max). Seule la **médiane relative** sert au modèle. Derniers passages modélisés aux premiers quais : **21:28:38** et **21:17:46** respectivement. Ni les grilles expirées, ni les panneaux estimés d’Explorer ne deviennent un horaire du jour.

### Où attendre : rue GT-54 et Maristes

**GT-54, Gueule Tapée.** Le [poteau 2175197258 v3](https://www.openstreetmap.org/node/2175197258/history/3) porte « Arret bus 18 / 39 ». Aucun rôle de relation n’y est inscrit. Il est **3,1 m à droite** de `233379481 v7` vers le nord-ouest. L’[arrêt DDD de la 18, OID 112](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0/query?objectIds=112&outFields=*&outSR=4326&f=json) est à **1,5 m** du poteau, du même côté. La [relation 7499475 v18](https://api.openstreetmap.org/api/0.6/relation/7499475/18.json) et le [tracé DDD OID 21](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/1/query?objectIds=21&outFields=Nom_Ligne&outSR=4326&f=json) passent ensuite sur la **route de Fann** `44134446 v15` par le nœud commun `297234887`. Ce sont des rues de circulation du bus, pas des trottoirs. [DDD](https://demdikk.sn/reseau-urbain-dakar/) place Rue 6, Gueule Tapée et lycée Delafosse dans cet ordre ; [AFTU](https://aftu-senegal.org/map/dakar-urbain-ligne-39/) décrit Lat Dior → Rue 6 → Gueule Tapée Claudel → École normale → Diamalaye.

| Contrôle sur les deux ZIP (pas le service actuel) | Appels encadrants, puis rue empruntée | Position de l’appel central |
|---|---|---|
| 18, `DDD_18_DIEUPEUL`, 39 courses | r28 `D_440` → **r29 `D_437`** → r30 `D_436`, GT-54 puis Fann | 14,6 m du poteau, à droite |
| 39 depuis Lat Dior, 54 courses | r12 `A_875` → **r13 `A_1992`** → r14 `A_871`, GT-54 puis Fann | **0,3 m** du poteau, à droite |
| 39 depuis Diamalaye, 72 courses | r54 `A_872` → **r55 `A_874`** → r56 `A_873`, Fann puis GT-54 | 8,8 m du poteau, **côté opposé** |

Les trois appels de chaque suite avaient explicitement `pickup_type=0` et `drop_off_type=0` sur **toutes** les courses examinées. La collecte AFTU contrôle aussi six positions locales (dont le poteau, le virage et la route de Fann) sur son dessin marqué de **17 040 m**. Ce contrôle ne valide ni les arrêts ni la ligne entière. Les [mesures signées et abscisses](../data/bus-review/gt54-occurrences.json) sont reproductibles. C’est un emplacement bien mieux identifié qu’un simple nom de quartier, **pas une permission actuelle dans les deux sens**. La [18 à 45 appels](https://transitbycity.com/fr/senegal/dakar/operators/dakar-dem-dikk/routes/18/) passe par la Corniche et Roosevelt ; ses 12 minutes ne sont pas une cadence à GT-54. La [plage de Dieuppeul publiée en 2022](https://goamobile.com/zoom_pub?entreprise=Dakar+Dem+Dikk&num_image_cat=2386) n’est pas une course pour ce jeudi. Il reste à confirmer la descente et la montée pour les services actuels, leurs heures sur ces variantes et un délai minimal au point d’attente. **Prochaine montée et marge réalisable : inconnues**, pas zéro.

**Route des Maristes, 141.** La [fiche 37702688](https://moovitapp.com/index/fr/transport_en_commun-Route_Des_Maristes_141-Dakar-stop_37702688-5996) donne des heures pour la 12 vers Palais et la 75 vers Colobane ; la [37702687](https://moovitapp.com/index/fr/transport_en_commun-Route_Des_Maristes_141-Dakar-stop_37702687-5996) concerne l’autre sens. Les distances de leur rubrique « à proximité » (26 et 363 m) ne sont **pas** la marche de la 12 à la 75. La lecture des métadonnées de localisation des six fiches [n’a obtenu que des réponses vides en CI](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44614124279/job/135878133166) ; elle ne contredit pas la lecture des horaires et n’apporte aucune coordonnée.

- Côté sud, [4223959282 v3](https://www.openstreetmap.org/node/4223959282) est référencé **232**. Les occurrences historiques `D_542` de la 232 et `A_1934` Allianz de la 75 sont à moins d’un mètre du poteau. Côté remontant, [4223949598 v3](https://www.openstreetmap.org/node/4223949598) est aussi **232**, à 1,0 m de l’[OID 483 de DDD](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0/query?objectIds=483&outFields=*&outSR=4326&f=json), et à 1,5 m du `A_2004` Le Féerique de l’autre 75. **18,9 m à vol d’oiseau** entre les deux poteaux : ni une traversée mesurée, ni une marche à faire par défaut.
- La [232 vers Aéroport](https://transitbycity.com/fr/senegal/dakar/operators/dakar-dem-dikk/routes/232/) nomme bien « Route des Maristes, 141 » au rang 16/35. Elle ne dit pas que le rang **37/63 de la 12** est ce poteau. La 12 historique par UCAD et la 75 à 76 appels depuis Malika ne sont pas les fiches à 63 et 52 appels. Les poteaux cartographiés avec `route_ref=12` plus au sud ne documentent pas non plus l’appel 37. Le PBF n’établit pas de chemin vers un quai de la 75.
- Aux seuls horaires relus et avec 3 min de marge : **12→75** à 05 h, arrivée 05:26, 05:27 écarté, montée candidate 05:34 (budget de déplacement ≤5 min) ; à 19 h, 19:33 → 19:38 (≤2 min). **75→12**, 05:19 → 05:26 (≤4 min) et 19:24 → 19:33 (≤6 min). Ces quatre budgets sont des **maximums**, pas des marches constatées. [Colonnes, courses, date et conditions du comparateur](trajets-bus-medina-maristes.md#maristes--identité-des-fiches-et-règle-de-comparaison). Pour ouvrir le changement sur la carte, il faut situer les points d’attente pour ces rôles et mesurer le parcours public ou démontrer le même point avec un délai minimal. Le numéro de fiche ne fait pas cela.

### Chemins entre quais : lecture du PBF, pas un rayon de correspondance

Le [contrôle des huit sites](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44611979362/job/135870684880) travaille sur la découpe Dakar du PBF régional d’empreinte `71283e1dddedef3c60336a0b9b1a4d1bf0a6e4508f688cf6eadaca6e0e09cbf6`. L’artefact `dakar-bus-occurrence-review/interchange-sites.json` porte sa propre empreinte d’extrait. [Méthode et fenêtres](../scripts/audit_interchange_sites.py) : nœuds et ways de quais, pas les centroïdes de gares ; jointures par **nœud commun** sur des chemins piétons, orientations et restrictions prises en compte, recherche limitée à **1 200 m sur le graphe**. Un nœud commun avec un polygone n’est pas une porte prouvée. Zéro chemin trouvé dans cet extrait ne signifie pas que la marche est impossible sur place.

| Site | Objets de quai | Touchent un chemin | Chemins candidats orientés | Ce qui manque pour le changement recherché |
|---|---:|---:|---:|---|
| Maristes | 19 | 0 | 0 | Point d’attente des deux appels 37 (ci-dessus). |
| Médina / Gueule Tapée | 66 | 1 | 0 | À GT-54 : rôles et services du jour. Les deux sens de la 1 ne se rejoignent pas à pied par défaut. |
| Colobane | 21 | 1 | 0 | Le quai TER touche des voies de gare. Le poteau `4223959275` (15/16B) et `6957521517` (« TATA » sans numéro) ne ferment pas une chaîne jusqu’au bus. |
| Petersen | 17 | 3 | 2 | **27,4 m** par `1458575521`, dans chaque sens entre deux aménagements **BRT**. Pas jusqu’à une montée DDD/AFTU/TATA. |
| Guédiawaye | 17 | 4 | 4 | **21,4 / 24,2 m** par `1458592771` / `1458592785`, aller et retour **BRT**. Aucun de ces chemins ne touche le poteau bus `6440488778`. |
| Pikine | 3 | 1 | 0 | Seulement le quai ferroviaire `1016285860` touche des chemins ; pas de porte ni de quai de bus reliés. |
| Rufisque | 8 | 0 | 0 | Deux quais ferroviaires, plusieurs poteaux dont un ancien terminus 63. Aucun parcours quai à quai établi. |
| Diamniadio | 5 | 1 | 0 | Un quai TER touche une voie. L’archive « Gare TER Diamniadio » (`D_1267`, 504 sans lettre) est à 363 m du repère TER à vol d’oiseau : ni une marche ni un rôle de la 504A/B. Les mesures du [guide des JOJ](https://www.vie-publique.sn/docs/7ec17f81-341f-48d4-a0b1-c18ea09c3603/guide-mobilite-dakar-joj-2026.pdf) ont pris fin le 14/11. |

Les [dossiers de correspondance](../src/admin/dakarTransferDossiers.ts) incluent les deux ordres des lignes 18/39 et 12/75. **24 dossiers, 48 sens, 50 évaluations bloquées avant l’horaire**. Aucun `survey:` dans le formulaire ou le graphe. Les quatre arcs existants de Scat Urbam servent uniquement à entrer ou sortir du BRT. Il n’y a ni arc piéton de changement ni exception de même quai sur la base locale.

### Rejeu à sélection constante et sur le formulaire actuel

Même jeudi à **19:00**, Dakar. Un couple est orienté. Les colonnes suivantes partitionnent les réponses ; une piste de changement n’est pas un changement effectué.

| Révision / sélections | Couples | Complet | Carte exacte | Tronçon de remplacement | Carte approchée | Piste de changement | Fiche seule | Sans proposition |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Base `1c720c6`, 144 | 20 592 | 716 | 108 | 4 804 | 0 | 976 | 334 | 13 654 |
| [Même cohorte 144, après](../data/bus-review/replay-calculateur-144-2026-11-19.json) | 20 592 | **716** | 108 | 4 804 | 0 | 979 | 331 | 13 654 |
| Base `1c720c6`, 150 | 22 350 | 731 | 108 | 5 040 | 0 | 976 | 334 | 15 161 |
| [Même cohorte 150, après](../data/bus-review/replay-calculateur-150-2026-11-19.json) | 22 350 | **731** | 108 | 5 050 | 0 | 979 | 331 | 15 151 |
| [Formulaire entier, 154](../data/bus-review/replay-calculateur-2026-11-19.json) | 23 562 | **745** | 108 | 5 160 | 0 | 979 | 331 | 16 239 |

Les **716 mouvements TER/B1 et les 15 anciens directs DDD sont conservés**, à IDs, heures, arrêts et distances identiques au millimètre. [Comparaison des empreintes](../data/bus-review/comparaison-physique-2026-11-19.json) : `movementSha256` inclut les sélections, types d’étapes, lignes, suites d’arrêts, voies piétonnes, attentes et heures. Le libellé du sens aller s’étend désormais jusqu’à Sandaga ; il change les IDs d’option qui entrent dans l’ancienne `wholeJourneySha256` à 150, **pas le mouvement**. Les 10 tronçons supplémentaires à 150 ne sont pas des trajets complets. Le gain de **14** sur le formulaire à **154** nécessite de nouvelles sélections : **13** vers Crédit Foncier ou El Malick Sandaga, **1** vers les Parcelles. Total : 78 TER, 344 B1 vers Petersen, 294 B1 vers Gueule Tapée, 28 DDD 1 vers Leclerc, 1 DDD 1 vers les Parcelles. 44 marches initiales et 44 finales, aucune marche de changement. **745 directs / 0 à un changement / 0 à plusieurs** (minimum par couple).

**Pourquoi le formulaire ne rend pas un voyage complet :** 306 `OUT_OF_SCOPE`, 1 705 `NO_PATH`, 20 698 `UNVERIFIED_ACCESS`, 108 `DOCUMENTED_SECTION_ONLY`. Les catégories documentaires du tableau ci-dessus décrivent ce que le formulaire peut néanmoins montrer pour ces refus. Sur la base à 150 : **298 / 1 339 / 19 874 / 108** ; exactement les mêmes codes de refus sur les 150 après modification.

| Filtres de réseaux | DDD+AFTU | DDD+TATA | AFTU+TATA | TER+DDD | TER+AFTU | TER+TATA | BRT+DDD | BRT+AFTU | BRT+TATA |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Complets autorisant l’un **ou** l’autre, avant et après à 150 | 15 | 15 | 0 | 93 | 78 | 78 | 653 | 638 | 638 |
| Complets autorisant l’un **ou** l’autre, à 154 | 29 | 29 | 0 | 107 | 78 | 78 | 667 | 638 | 638 |
| Une option utilise effectivement **les deux** réseaux, à 154 | **0** | **0** | **0** | **0** | **0** | **0** | **0** | **0** | **0** |

[Reçu des neuf filtres](../data/bus-review/replay-reseaux-2026-11-19.json) : diagnostic et refus pour **23 562 couples par filtre**. À 150, les neuf reçus de comparaison (mouvements, comptes et refus) sont identiques avant/après. Les [6 950 décomptes d’Explorer](passages-bus-par-ligne.md) et les 20 couples sur fiches à 05 h / 19 h ont été rejoués séparément ; aucun n’est ajouté aux 745.

### Reproduire sans publication

```sh
at=2026-11-19T19:00
node scripts/audit_place_connections.mjs --at "$at" --from ref:ddd-1-medina-retour-4666430956 --to ref:ddd-1-medina-retour-4666430957
node scripts/audit_place_connections.mjs --at "$at" --from ref:ddd-colobane --to ref:aftu-diamalaye --modes ddd,aftu
node scripts/audit_place_connections.mjs --matrix --at "$at" > /tmp/form.json
node scripts/audit_place_connections.mjs --matrix --at "$at" --points data/bus-sections/selection-1c720c6.json > /tmp/150.json
node scripts/audit_place_connections.mjs --matrix --at "$at" --points data/bus-sections/selection-0c6cf56.json > /tmp/144.json
node scripts/audit_transfer_modes.mjs --at "$at" > /tmp/modes.json
cmp /tmp/modes.json data/bus-review/replay-reseaux-2026-11-19.json
node scripts/audit_bus_day.mjs --at "$at" --replay /tmp/form.json --markdown /tmp/par-ligne.md
node scripts/audit_passenger_transfers.mjs --at "$at" --json > /tmp/dossiers.json
# Pour les mesures de la base avec le MÊME instrument, sans changer de branche :
root=$PWD; base=$(mktemp -d); git archive 1c720c6 | tar -x -C "$base"
cp scripts/audit_{place_connections,transfer_modes}.mjs "$base/scripts/"; ln -s "$root/node_modules" "$base/node_modules"
(cd "$base" && node scripts/audit_place_connections.mjs --matrix --at "$at" > /tmp/base150.json && node scripts/audit_transfer_modes.mjs --at "$at" > /tmp/base150-modes.json)
node scripts/audit_transfer_modes.mjs --at "$at" --points data/bus-sections/selection-1c720c6.json | cmp /tmp/base150-modes.json -
# Deux archives locales épinglées (jamais une source de départs du jour) :
python -m scripts.medina_phase /chemin/Dem_Dikk.zip --direction inbound
python -m scripts.audit_gt54 /chemin/Dem_Dikk.zip /chemin/AFTU.zip | cmp data/bus-review/gt54-occurrences.json -
```

**Sources et réutilisation.** [© les contributeurs OpenStreetMap · ODbL 1.0](https://www.openstreetmap.org/copyright) pour les positions et la voirie réutilisées. [Pins de GT-54](../data/bus-sections/gt54-pins.json) et [registre des portions](../data/bus-sections/README.md). Les identités d’arrêt, heures et observations ponctuelles citées ne constituent pas une base opérateur. Aucun ZIP, tableau horaire complet, géométrie Waymark ou coordonnée de Moovit n’est distribué. Les filtres stricts du calculateur (en particulier [même quai, sens et deux services datés](../src/routing/samePlatformChanges.ts)) restent applicables.
