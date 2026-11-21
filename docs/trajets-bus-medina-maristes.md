# Deux façons de préparer un trajet en bus : Médina et Maristes

**Mise à jour :** [les huit quais vers Leclerc, la portion de retour et les contrôles physiques aux Maristes et rue GT-54](validation-physique.md). La mesure initiale à 150 sélections et les six premiers quais décrits ci-dessous sont ceux de `1c720c6`. Les exemples de cette page restent utilisables.

Dans **Trajet**, le choix dépend de ce que l’on peut établir. **Sur la carte** répond entre les points géographiques sélectionnés. **Sur horaires · Maristes** compare des courses qui citent les mêmes fiches d’arrêt ; il ne connaît ni les coordonnées des quais ni le temps pour passer de l’un à l’autre. Les résultats des deux modes ne s’additionnent pas.

## Essayer dans l’application, sans API

| Départ demandé (heure de Dakar) | Choix dans Trajet | Résultat |
|---|---|---|
| Jeudi 19/11/2026, 19:00 | **Sur la carte** : École Manguiers **· DDD 1 vers Leclerc** → Stade Iba Mar Diop **· DDD 1 vers Leclerc** | Direct sur **1 667 m**. Le modèle fait monter vers **19:06** et descendre vers **19:14**. Il suppose le voyageur déjà au quai. Ce n’est pas une annonce de DDD. |
| Même heure, sens inverse, réseau DDD désactivé ou « sans marches vérifiés » | Les mêmes quais | Pas de voyage complet. Un clic GPS ou un choix dans « Portions de bus cartographiées » ne devient pas un quai, même aux mêmes coordonnées. |
| Jeudi 19/11/2026, 05:00 | **Sur horaires · Maristes** : Terminus Guédiawaye → Gare de Colobane | DDD 12 **05:00 → 05:26** ; à la fiche *Route des Maristes, 141*, AFTU 75 **05:34 → 05:46**. **8 min** disponibles. Le passage à 05:27 n’en laisserait qu’une et n’est pas proposé. |
| Même heure | **Sur horaires · Maristes** : Pikine Rue 10, 1858 → Grands Moulins | AFTU 75 **05:07 → 05:19**, puis DDD 12 **05:26 → 05:36**. **7 min** disponibles. C’est l’autre ordre de lignes, pas un trajet fabriqué en retournant les arrêts. |

À **19:00**, les deux mêmes demandes sur fiches donnent respectivement **19:00 → 19:33 / 19:38 → 19:54** (5 min) et **19:08 → 19:24 / 19:33 → 19:47** (9 min). Un horaire compatible ne garantit ni le passage du véhicule ni que l’on atteindra la montée. Vérifier sur place où attendre. Aucun de ces changements n’est dessiné sur la carte.

## Première portion de Médina : six quais vers Leclerc à `1c720c6`

Le [tableau des arrêts de Dakar Dem Dikk](https://demdikk.sn/chatbot-arrets/) place les six appels ci-dessous à la suite sur la 01 **avant** le terminus Leclerc. La [relation OSM 6951328, version 28](https://api.openstreetmap.org/api/0.6/relation/6951328/28.json) va des Parcelles vers Leclerc. Les rangs ci-dessous comptent les appels dans chacune de ces sources (base 1), pas les ways. Les noms affichés suivent la desserte DDD ; un repère OSM peut porter un autre nom. Le contrôle porte sur l’ordre, le rôle de quai, le sens, le côté de la chaussée et la position, pas sur le seul nom.

| Rang DDD | Appel dans l’application | Rang OSM | Nœud de quai OSM, version | Écart entre le point DDD et le quai |
|---:|---|---:|---|---:|
| 34 | École Manguiers | 25 | 4666430960 v2 | 12,7 m |
| 35 | Police Médina | 26 | 4666430958 v7 | 0,9 m |
| 36 | Rue 31 × Blaise Diagne | 27 | 4666430955 v2 | 11,3 m |
| 37 | Marché Tilène | 28 | 4666430953 v5 | 7,4 m |
| 38 | Rue 11 × Blaise Diagne | 29 | 4666430951 v6 | 4,1 m |
| 39 | Stade Iba Mar Diop | 30 | 4666430950 v2 | 3,2 m |

Les cinq segments sont découpés **sur la voirie** du sens déjà relu, entre projections successives des quais. Le [registre des ways et jointures](../data/bus-sections/README.md) conserve la portion plus large `ddd-1-sahm`, ses extrémités et la rupture en amont au rang 21. Le [service initial](https://github.com/aydiarra-star/dkrBus-apps/blob/1c720c699aebf3f546db563d1b6a163eb2432b11/src/routing/medinaService.ts) ne prenait que les rangs 25–30 et leurs versions de nœuds. Ses six identifiants `ref:ddd-1-medina-…` sont distincts des `landmark:bus-osm-…`. Il ne raccorde pas l’origine des Parcelles, une ligne partageant la rue, le trottoir, un quai du retour ou le TER/B1. Aucune voie piétonne ni permission de changer de véhicule n’a été ajoutée.

**D’où viennent les minutes ?** [DDD](https://demdikk.sn/) publie **05:30–20:30 aux Parcelles** (06:30–21:00 à Leclerc dans l’autre sens). Il ne s’agit pas des bornes d’un quai de Médina. Pour les jours de semaine non fériés du calendrier connu, le modèle applique aux Parcelles les [plages d’intervalle supposé](../src/domain/dddOriginWindows.ts) de **8 min** en pointe et **13 min** hors pointe, avec le dernier départ du terminus. Les créneaux sont ensuite décalés, pas réinitialisés à chaque quai.

- L’[archive PassBi épinglée](https://github.com/impactsolutionsas/passbi_core/tree/7a2b99824699cb10daf69852c8fbecb746200d77/gtfs_folder) a des calendriers expirés en 2023. Dans `Dem_Dikk.zip`, `DDD_01`, `direction_id=1`, shape `DDD_01_PARCELLES-ASSAINIES`, **119** courses vont effectivement de `D_805` (Terminus Parcelles) à `D_419` (École Manguier) au rang 28. Le premier point historique diffère de l’origine DDD d’environ **233 m** et `D_419` du quai OSM d’environ **22 m** : ce ne sont pas des identifiants actuels équivalents.
- Départ au premier appel → arrivée à `D_419` : **2 097 / 3 518 / 4 645 s** (minimum / médiane / maximum). **+3 518 s**, soit environ 59 min, est une **hypothèse de phase** à Manguiers. Les valeurs historiques vont d’environ 35 à 77 min ; ce n’est ni un intervalle de confiance ni la ponctualité mesurée en 2026. Aucune course de l’archive n’est remise en service.
- Sur la portion seulement : distance le long de la chaussée à **18 km/h**, avec **30 s** par arrêt intermédiaire. Le dernier passage modélisé à Manguiers est à 21:28:38 ; une seconde plus tard il n’est plus disponible à ce quai. Week-end, jour férié, calendrier inconnu et demande d’accessibilité stricte : pas de direct annoncé. Ni la géométrie ni l’horaire ne prouvent l’accessibilité.

## Maristes : identité des fiches et règle de comparaison

La [fiche 37702688](https://moovitapp.com/index/fr/transport_en_commun-Route_Des_Maristes_141-Dakar-stop_37702688-5996) donne la **12 vers Palais** et la **75 vers Colobane**. La [fiche 37702687](https://moovitapp.com/index/fr/transport_en_commun-Route_Des_Maristes_141-Dakar-stop_37702687-5996) concerne les sens opposés. Ni ces libellés ni les deux limites routières cartographiées aux Maristes n’établissent un point de montée commun. La gare routière de Colobane sur la fiche n’est pas assimilée à la gare TER.

| Tableau de semaine Moovit | Colonnes effectivement utilisées, dans le sens du tableau | Périmètre de lecture |
|---|---|---|
| [DDD 12 → Gare Palais](https://moovitapp.com/index/fr/transport_en_commun-time-12-Dakar-5996-1618037-18051468-4256257-0) | r1 Terminus Guédiawaye `37702749` ; r37 Maristes `37702688` ; r47 Grands Moulins `37702678` | 3 colonnes sur 63 appels, **6 courses** autour de 05 h et 19 h |
| [AFTU 75 → Gare de Colobane](https://moovitapp.com/index/fr/transport_en_commun-time-75-Dakar-5996-1618038-18051476-4256273-0) | r24 Pikine Rue 10, 1858 `37702627` ; r37 Maristes `37702688` ; r52 Gare de Colobane `37702002` | 3 colonnes sur 52 appels, **12 courses**. Le [sens opposé](https://moovitapp.com/index/fr/transport_en_commun-time-75-Dakar-5996-1618038-18051476-4256272-0) n’est pas utilisé. |

Le [relevé](../src/data/maristesTimetables.ts) garde chaque triplet d’heures **sur sa course**. Les départs rapprochés ne sont pas une fréquence à prolonger. Exemple : sur la 75 partie à l’origine à 04:53, les trois colonnes valent 05:15, **05:27**, 05:39 ; partie à 19:07, elles valent 19:36, **19:52**, 20:06. Les fiches secondaires du jeudi indiquent une mise à jour le 16/11. Le calcul est borné volontairement aux jours de semaine **du 16 au 20/11/2026**, pas à une date de validité opérateur présumée. Une absence de résultat à midi ne signifie pas que la ligne s’arrête à midi.

Le [comparateur](../src/routing/timetableAdvice.ts) cherche un premier départ non manqué **dans l’heure**. Il évalue les directs et, si autorisé, l’enchaînement des deux sens à `37702688`. Il exige entre les deux passages au moins **3 min** ou la marge réglée par le voyageur si elle est supérieure, au plus **60 min**. Cette marge **n’est pas** un temps de marche. Parmi ces seules courses : première arrivée, puis moins de changements, puis départ le plus tardif. Réseaux désactivés, option « direct », heure modifiée et accessibilité stricte s’appliquent aussi ici. Aucune requête trajet à l’API, géométrie, substitution GPS ou voie de correspondance ne découle du résultat.

## Mesures de la première portion (`1c720c6`)

Jeudi **19/11/2026 à 19:00, Dakar**, sans édition opérateur, mêmes réglages du formulaire géographique. Un couple = deux sélections distinctes, orientées ; chaque colonne est exclusive.

| Formulaire | Couples | Complets | Carte exacte | Tronçon seul | Carte approchée | Changement à vérifier | Fiche seule | Sans proposition |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [Avant : 144 IDs](../data/bus-review/replay-panneaux-v1-2026-11-19.json) | 20 592 | 716 | 108 | 4 746 | 0 | 976 | 334 | 13 712 |
| [À `1c720c6` : mêmes 144 IDs](https://github.com/aydiarra-star/dkrBus-apps/blob/1c720c699aebf3f546db563d1b6a163eb2432b11/data/bus-review/replay-calculateur-144-2026-11-19.json) | 20 592 | **716** | 108 | 4 804 | 0 | 976 | 334 | 13 654 |
| [À `1c720c6` : 150 IDs](https://github.com/aydiarra-star/dkrBus-apps/blob/1c720c699aebf3f546db563d1b6a163eb2432b11/data/bus-review/replay-calculateur-2026-11-19.json) | 22 350 | **731** | 108 | 5 040 | 0 | 976 | 334 | 15 161 |

À périmètre constant, les **mêmes couples, étapes, heures et mètres** donnent l’empreinte `8b88d089…dbf162`. Le gain de 58 tronçons de remplacement n’est pas un gain de voyages complets. Dans le formulaire étendu : 78 couples TER, **344** B1 Préfecture → Petersen, **294** B1 Petersen → Gueule Tapée et **15 DDD 1** (tous les couples en avant sur six quais). **44** marches initiales, **44** finales, **zéro** changement. Empreinte `e3644448…74b2a5`. L’attribution de ce premier service était une **portion** du sens vers Leclerc, pas la ligne 1 entière. Aucun départ d’origine daté n’a été fabriqué.

**Dénominateur séparé pour les fiches** : 5 fiches → 20 couples. À [05:00](../data/bus-review/horaires-maristes-2026-11-19-0500.json) et à [19:00](../data/bus-review/horaires-maristes-2026-11-19-1900.json), 6 directs sur horaires, **2 enchaînements possibles sur horaires** et 12 sans comparaison. Ils ne font pas passer les 731 voyages géographiques à 733. Les [6 950 décomptes actifs dans Explorer à 19 h](passages-bus-par-ligne.md) sont, elles aussi, un autre indicateur.

**Contrôles hors des deux exemples.** À la même heure, entre arrêts choisis : TER Dakar → Pikine 19:03–19:19 ; B1 Préfecture de Guédiawaye → Petersen 19:00–19:52 ; TER Pikine → Rufisque 19:03–19:21, Rufisque → Diamniadio 19:05–19:15 et Bargny → Diamniadio 19:03–19:07. Depuis Dakar vers l’épingle `14.7900,-17.3100` de Keur Massar, le calcul refuse toujours la marche finale ; ni la 74 à Bargny ni une proximité à vol d’oiseau ne la complètent. Yoff → Keur Massar garde les fiches distinctes de la 66.

## Limites et prochaine preuve utile

- **Maristes** : relever séparément la descente de la 12 et la montée de la 75 dans les sens indiqués, puis les rôles inverses. Fournir positions, accès, traversées et durée minimale, ou une preuve du même point d’attente, et les courses applicables. Aucun quai de la 232, de la 37 ou de la 40 n’est prêté à la 12.
- **VDN/Castel** : les deux fiches Castel et Cimetière Saint-Lazare n’ont pas le même ID. L’arrêt historique `D_801` de la 1/218 se situe vers Castel ; les minutes de la **1A** ne sont pas celles de la **1**. La position du véhicule sur une bretelle ne prouve pas le lieu où attendre. **Niaga** : le CEM côté Lac Rose et le point d’en face sont distincts ; la P102 ne documente pas une traversée. **Jaxaay** : partager des IDs historiques sur la même chaussée ne prouve ni un quai actuel ni une course compatible. Aucun de ces trois cas n’est activé.
- **Droits** : géométrie et positions affichées à Médina : [© les contributeurs OpenStreetMap, ODbL 1.0](https://www.openstreetmap.org/copyright), [extraits et versions](../data/bus-sections/README.md). DDD documente l’ordre et les bornes ; ses coordonnées ne sont pas redistribuées comme une couche cartographique. PassBi ne sert qu’à l’agrégat de durée : ni ZIP, ni course, ni calendrier redistribué. Pour Moovit, liens et extraits factuels limités aux colonnes et courses indiquées, pas de reprise d’une base complète ni de coordonnées ; **pas de licence opérateur ou de droit de republication intégrale présumé**. Une extension nécessite de revoir la source, la date et les droits.

### Reproduire

```sh
npm ci
at=2026-11-19T19:00
node scripts/audit_place_connections.mjs --at "$at" --from ref:ddd-1-medina-4666430960 --to ref:ddd-1-medina-4666430950
node scripts/audit_place_connections.mjs --matrix --at "$at" --points data/bus-sections/selection-0c6cf56.json > /tmp/constant.json
cmp /tmp/constant.json data/bus-review/replay-calculateur-144-2026-11-19.json
node scripts/audit_place_connections.mjs --matrix --at "$at" > /tmp/etendu.json
cmp /tmp/etendu.json data/bus-review/replay-calculateur-2026-11-19.json
node scripts/audit_bus_day.mjs --at "$at" --replay /tmp/etendu.json --markdown /tmp/par-ligne.md
cmp /tmp/par-ligne.md docs/etat-par-ligne-2026-11-19.md
node scripts/audit_timetable_advice.mjs --at 2026-11-19T05:00
node scripts/audit_timetable_advice.mjs --at "$at"
# Facultatif, avec le ZIP épinglé déjà acquis localement (SHA-256 vérifié) :
python -m scripts.medina_phase /chemin/Dem_Dikk.zip  # 119 2097 3518 4645
```

SHA-256 attendu du ZIP : `578323c9fa4375313d57c4120071da3d0da499eb9216e5a4a22a28ffae707159`. Pour la recette mobile, servir le build et lancer `BROWSER_TOOLS=/chemin/outils-navigateur node scripts/smoke_bus_journeys_mobile.mjs` ([prérequis Chromium](modeles-passages-bus.md)). Les contrôles n’installent pas d’édition et ne publient rien.
