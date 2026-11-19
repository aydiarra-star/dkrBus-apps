# B1 : jusqu’où la marche est-elle documentée ?

Revue cartographique du 18 novembre 2026, **pas un relevé sur place**. Source des objets et de l’extrait [`reviewedPassengerLinks.ts`](../../src/data/reviewedPassengerLinks.ts) : [© les contributeurs OpenStreetMap](https://www.openstreetmap.org/copyright), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Horaires et appels : modèle B1 existant, inchangé. Ni la fréquence ni l’accessibilité ne proviennent de ces objets OSM.

## Scat Urbam : deux îlots, un quai central

Les deux relations de **route** attribuent le même nœud de quai [11739915373 v2](https://api.openstreetmap.org/api/0.6/node/11739915373/2.json) à des positions d’arrêt différentes, à des rangs indépendants : [19961937 v4](https://api.openstreetmap.org/api/0.6/relation/19961937/4.json), `stop 11738664176 → platform 11739915373` vers Petersen ; [19961993 v3](https://api.openstreetmap.org/api/0.6/relation/19961993/3.json), `stop 11739915374 → platform 11739915373` vers Guédiawaye. Scat Urbam est intermédiaire dans les deux portions B1 admises. Il y a donc **deux rôles par sens** (montée, descente), et non quatre quais.

Le point de route n’est membre d’[aucun way](https://api.openstreetmap.org/api/0.6/node/11739915373/ways.json). La marche repose sur une preuve supplémentaire, spécifique à cette station : la [zone d’arrêt 17357331 v4](https://api.openstreetmap.org/api/0.6/relation/17357331/4.json) identifie **une seule voie de quai**, [1458592675 v3](https://api.openstreetmap.org/api/0.6/way/1458592675/3.json), entre les deux voies de bus. Le point et la ligne figurent tous deux avec le rôle `platform` et le même réseau dans le [même relevé cartographique](https://api.openstreetmap.org/api/0.6/changeset/175954276.json). [L’historique de cette station](https://api.openstreetmap.org/api/0.6/relation/17357331/history.json) distingue le point représentatif de la station et son quai linéaire avant ce changement de balisage. Il ne s’agit pas de deux extrémités reliées par un passage entre voies.

Le calcul est **le long de la voie de quai**, jusqu’à l’abscisse du point de quai (50,33 % du way à partir du nord ; écart transversal 0,105 m). C’est un repère sur la plateforme, **pas la position d’une porte du bus**, ni un nouvel objet OSM. Aucun segment n’est tracé entre le nœud isolé et la ligne. L’identité du quai a été relue avant cette mesure ; le test numérique ne cherche pas des quais voisins. Le modèle ne déplace **aucun appel B1**. Les écarts entre le point cartographié et les deux tracés de service sont respectivement de 5,9 et 5,7 m.

| Sens du chemin admis | Nœuds et ways parcourus | Longueur et usage |
|---|---|---|
| Îlot nord → quai | jonction 13376900325 → [1458592674 v1](https://api.openstreetmap.org/api/0.6/way/1458592674/1.json) → nœud commun 13376900326 → portion de 1458592675 | 61,37 m ; accès à une montée B1 seulement |
| Quai → îlot nord | même portion de quai jusqu’à 13376900326 → 1458592674 → 13376900325 | 61,37 m ; sortie après une descente seulement |
| Îlot sud → quai | jonction 13376900328 → [1458592676 v1](https://api.openstreetmap.org/api/0.6/way/1458592676/1.json) → nœud commun 13376900327 → portion de 1458592675 | 71,37 m ; accès seulement |
| Quai → îlot sud | même portion de quai jusqu’à 13376900327 → 1458592676 → 13376900328 | 71,37 m ; sortie seulement |

Les deux accès `highway=footway` débouchent effectivement sur ce quai par leurs extrémités. Sur ces portions, aucune traversée de chaussée, restriction de sens ni barrière cartographiée ; usage voyageurs en station, pas un raccourci public entre côtés de rue. Les îlots sont **déjà au milieu** des traversées [nord](https://api.openstreetmap.org/api/0.6/way/1458592673/full.json) et [sud](https://api.openstreetmap.org/api/0.6/way/1458592677/full.json). Leurs zébras ne valident pas le chemin depuis une adresse ou un commerce jusqu’à l’îlot. Pas de déclaration « sans marches », de garantie d’ouverture, de temps de contrôle des billets, de marche DDD 121 ni de transfert B1–B1. Les profils stricts, le rayon de marche et le dernier départ restent opposables. Une épingle même exactement au point de l’îlot ne reprend pas son identité.

## Petersen : ne pas appliquer la même règle

La [zone d’arrêt 19961714 v2](https://api.openstreetmap.org/api/0.6/relation/19961714/2.json) contient **deux** quais linéaires et **deux** nœuds de quai. L’ordre des membres de la zone n’apparie pas une ligne à son quai : lire les relations de route ci-dessus.

* **Descente B1 vers Petersen** : `stop 13376764678 / platform 13376766987 v2` ; 2,3 m du dernier appel du modèle. La sélection « Petersen · quai de descente B1 » est disponible à l’arrivée. Aucune marche ni montée depuis ce quai.
* **Montée vers Guédiawaye** : `stop 13376764679 / platform 13377966011 v1` ; **96,0 m** de l’appel de référence. L’attache au quai est refusée au seuil existant de **80 m**. Le départ modélisé *depuis l’appel de service* reste disponible comme auparavant ; il ne promet pas la marche depuis le quai de descente. Le cas de test utilise la vraie position de cet autre quai.
* Les ways `1458575519`, `1458575523`, `1458575522`, `1458575515` et les traversées marquées `13376766713/714` sont des éléments d’enquête. Ni quai DDD/AFTU identifié ni chaîne de bout en bout. Aucune estimation de changement ne les relie au TER Dakar ou à la 121.

## Rejeu local

```sh
npm run audit:place-connections -- --at 2026-11-18T19:00 --from landmark:scat-ilot-nord --to ref:brt-petersen
npm run audit:place-connections -- --at 2026-11-18T19:00 --from ref:brt-petersen --to landmark:scat-ilot-sud
npx vitest run src/routing/stationAccess.test.ts
```

Au départ de l’îlot nord à 19 h : **47 s de marche**, 4 min 06 s d’attente modélisée, 23 min 50 s à bord ; arrivée vers **19 h 28**. Ces temps sont calculés, pas observés. Le moteur filtre les chemins d’entrée/sortie **pendant** la recherche piétonne, avant de comparer les parcours. La même marche ne peut pas servir à traverser une station sans prendre de transport.
