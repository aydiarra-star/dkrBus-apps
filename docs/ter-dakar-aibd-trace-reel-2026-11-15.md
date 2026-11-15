# Tracé réel des voies du TER Dakar – AIBD (2026-11-15)

Ce document décrit la géométrie livrée dans `data/ter/`, les sources utilisées et ce qui a été vérifié ou non.

**Statut : géométrie issue d'OpenStreetMap, relue nœud par nœud le 15 novembre 2026. Ce n'est pas un relevé ferroviaire officiel.** Les plans d'exécution et de récolement (APIX, SETEC, SYSTRA) ne sont pas publics et n'ont pas été consultés.

## Fichiers livrés

| Fichier | Contenu |
| --- | --- |
| `data/ter/ter-dakar-aibd.geojson` | Une seule `LineString` continue, WGS 84 (longitude, latitude), 491 sommets. Livrable principal. |
| `data/ter/ter-dakar-aibd.csv` | Les 491 coordonnées successives, avec le point kilométrique cumulé, la phase, la voie OSM et le nœud OSM d'origine. |
| `data/ter/ter-dakar-aibd.dxf` | Export dérivé : une polyligne DXF R12 en UTM 28N (EPSG:32628), en mètres. |
| `data/ter/shp/ter-dakar-aibd.*` | Export dérivé : shapefile polyligne en WGS 84. |
| `data/ter/osm-source/ter-dakar-aibd.osm-extract.json` | Extrait OSM d'origine : relation, voies, nœuds, et mode de vérification de chaque nœud. |
| `scripts/build_ter_dakar_aibd_trace.py` | Reconstruit tous les fichiers ci-dessus depuis l'extrait et contrôle la continuité. |

Le DXF et le shapefile sont générés à partir de la même géométrie OSM. Aucun fichier SHP, DXF ou DWG officiel n'a été trouvé en accès public.

Les fichiers ne contiennent aucune gare, aucun arrêt, aucun horaire et aucune autre ligne.

## Ce que représente la ligne

- Les voies voyageurs du TER à écartement de 1 435 mm, électrifiées en 25 kV 50 Hz.
- Une seule des deux voies de la double voie : celle que suit la relation d'itinéraire OSM dans le sens Dakar vers AIBD. L'autre voie, parallèle à quelques mètres, appartient à la relation de sens inverse (13645076) et n'est pas reprise.
- De heurtoir à heurtoir : du heurtoir de la gare de Dakar (PK 0) au heurtoir de la gare de l'aéroport (PK 55,436).
- Aucun lissage, aucune simplification et aucun point interpolé : chaque sommet est un nœud OSM.

| Mesure | Valeur |
| --- | --- |
| Longueur totale (géodésique WGS 84) | 55 436 m |
| Phase 1, du heurtoir de Dakar au point d'arrêt de Diamniadio | 35 643 m |
| Phase 2, du point d'arrêt de Diamniadio au heurtoir de l'aéroport | 19 792 m |
| Segment le plus long (alignement droit) | 1 719 m |
| Changement de direction le plus fort entre deux segments | 7,0° |

La limite entre les phases est le sommet d'indice 319 (propriété `phase_2_start_index` du GeoJSON).

## Méthode

1. Le corridor a été identifié à partir de l'image de référence fournie (schéma SENTER « Le trajet du TER Dakar-AIBD »). L'image n'a servi qu'à cela : aucune coordonnée n'en est tirée.
2. La relation d'itinéraire OSM **13645077** « Train Express Régional: Dakar - Diamniadio - AIBD » (version 7, 2026-10-01) donne la liste ordonnée des 26 voies parcourues.
3. Les 26 voies ont été lues dans l'API OSM, puis enchaînées par leurs nœuds d'extrémité communs. L'enchaînement ne présente aucune rupture.
4. La voie **1564054430** (85 m) a été ajoutée à la fin. C'est la même voie physique, scindée au point d'arrêt du terminus, qui se prolonge jusqu'au heurtoir. Elle est hors relation : c'est le seul écart par rapport à la relation, fait pour que la ligne atteigne la fin des rails comme à Dakar.
5. Les 491 nœuds ont été interrogés dans l'API OSM le 15 novembre 2026 (voir « Vérification des nœuds »).

## Portions vérifiées

Les PK sont mesurés le long de la ligne livrée depuis le heurtoir de Dakar.

| PK (km) | Portion | Voies OSM | Dernière édition des voies | Vérification |
| --- | --- | --- | --- | --- |
| 0,000 – 26,277 | Dakar – pont de Rufisque | 810068961 | 2022-12-08 | 72 nœuds par coordonnées, 178 par horodatage |
| 26,277 – 34,895 | Rufisque – aiguille d'entrée de Diamniadio | 810068960, 809624067, 1019038334, 1019038331 | 2022-12-08 | 20 nœuds par coordonnées, 45 par horodatage |
| 34,895 – 36,479 | Traversée de la gare de Diamniadio | 1019038330, 810325933 | 2022-12-08 | 19 nœuds par coordonnées |
| 36,479 – 38,423 | Raccordement phase 1 / phase 2 | 1564054428, 1556868341 | 2026-09-07 et 2026-10-01 | 5 nœuds par coordonnées |
| 38,423 – 44,623 | Phase 2, moitié ouest | 1326448988, 1326448986, 1326448987, 1326448985, 1427316111, 1427316110, 1427052721, 1427052720 | 2026-09-07 | 71 nœuds par coordonnées |
| 44,623 – 52,448 | Phase 2, moitié est | 1556868302, 1556868328, 1556868301, 1556868308, 1556868311, 1556868317, 1556868310, 1556868315 | 2026-09-07 | 59 nœuds par coordonnées |
| 52,448 – 55,436 | Arrivée à l'aéroport et heurtoir | 1556868314, 1564054430 | 2026-10-01 | 22 nœuds par coordonnées |

### Vérification des nœuds

- **Par coordonnées (268 nœuds)** : la latitude et la longitude sont celles lues dans la réponse de l'API OSM du 15 novembre 2026. C'est le cas de tous les nœuds à partir de la gare de Diamniadio, donc de toute la phase 2.
- **Par horodatage (223 nœuds, tous en phase 1)** : les coordonnées viennent d'un instantané OSM de mars 2026 (tuile ferroviaire `data/tiles/14_-18.geojson` du dépôt GitHub `enwo02/train-tracker`, commit `7be85265`). La réponse de l'API OSM du 15 novembre 2026 indique pour chacun une dernière modification entre 2020 et le 8 décembre 2022, donc antérieure à l'instantané : les coordonnées sont inchangées.
- Contrôle croisé : 111 nœuds sont présents dans l'instantané et ont aussi été lus par coordonnées dans l'API. Seuls deux diffèrent, tous deux en gare de Dakar et modifiés le 16 mai 2026 : le heurtoir (2 m) et le point d'arrêt (42 m). La valeur actuelle de l'API a été retenue.

### Contrôles de cohérence

- Toutes les voies portent `railway=rail`, `gauge=1435`, `electrified=contact_line`, `voltage=25000`. Aucune n'est en `construction` ni en `proposed`.
- Aucune voie retenue ne porte de balise `service` (dépôt, garage, liaison entre voies). Les voies de phase 1 portent `usage=main` ; celles de phase 2 n'ont pas encore cette balise dans OSM, mais elles appartiennent à la relation d'itinéraire.
- Longueur : les annonces officielles donnent 36 km pour la phase 1, environ 19 km pour la phase 2 et 55 km au total. La ligne mesure 55,4 km.
- La phase 2 mesure 19,8 km depuis le point d'arrêt de Diamniadio, contre « environ 19 km » annoncés. L'instantané de mars 2026 montre que les rails de la phase 1 se prolongeaient déjà jusqu'au PK 36,96, au-delà de la gare. Mesurée depuis ce point, la partie nouvelle fait 18,5 km. C'est une explication plausible de l'écart, non confirmée par une source officielle.
- Forme : la ligne tracée a été comparée visuellement au schéma SENTER fourni. Les inflexions concordent (remontée vers le nord entre Pikine et Yeumbeul, point bas à Bargny, phase 2 vers le nord-est puis vers le sud jusqu'à l'aéroport).

## Voies écartées

- La voie métrique (1 000 mm, « Chemin de fer de Dakar au Niger ») vers Thiès, qui longe le TER en phase 1 puis s'en sépare au début de la phase 2.
- Les voies de service et de garage (`service=yard`, `spur`), notamment autour de Colobane, Yeumbeul, Rufisque et Diamniadio.
- Les liaisons entre les deux voies principales (`service=crossover`).
- La seconde voie principale (sens AIBD vers Dakar).
- Les deux amorces de voie qui partent des aiguilles 14160412776 et 14160412777 à l'entrée de la gare de l'aéroport (voies 1556868344 et 1556868345).

## Sources

| Source | Usage | Accès |
| --- | --- | --- |
| OpenStreetMap, API 0.6 : relations 13645077 et 13645076, 27 voies, 491 nœuds, groupes de modifications 188689523, 189814695, 182757984 et 182758589 | Géométrie, balises, dates d'édition | Consultée le 2026-11-15 |
| Instantané OSM de mars 2026 (`enwo02/train-tracker`, tuile `14_-18.geojson`) | Coordonnées de 223 nœuds de phase 1, contrôle croisé, repérage de la voie métrique | Consulté le 2026-11-15 |
| Termes de référence de l'audit environnemental et social de la phase 2 (APIX, site de la BAD) : 19 km, deux voies à écartement de 1,435 m, du PK 36 (Diamniadio) au PK 55 (gare de l'AIBD), SYSTRA assistant à maîtrise d'ouvrage | Contrôle des longueurs et des caractéristiques | <https://www.afdb.org/sites/default/files/documents/project-related-procurement/tdr_audit_par_phase_2_revu_dpm_10-03-23_revu_bad_vf.pdf> |
| Presse du 28 septembre 2026 sur la mise en service commerciale de la phase 2 (19 km en double voie électrifiée, 55 km au total) | Confirmation que la phase 2 est en exploitation | <https://www.dakaractu.com/TER-la-desserte-de-l-AIBD-officiellement-mise-en-service_a276475.html> |
| Image de référence fournie (schéma SENTER) | Identification du corridor, comparaison de forme | Fournie par le demandeur |

Sources demandées mais non exploitées :

- **Plans d'exécution et de récolement APIX, documents techniques SETEC et SYSTRA** : aucun plan ni fichier géographique en accès public n'a été trouvé.
- **Études d'impact environnemental des phases 1 et 2** : seul le résumé contenu dans les termes de référence ci-dessus a été lu. Les études complètes et leurs plans n'ont pas été consultés.
- **Orthophotographies et images satellites** : aucune image n'a pu être consultée directement. Le contrôle sur imagerie est celui des contributeurs OSM, qui déclarent avoir tracé sur Mapbox Satellite (phase 2, septembre 2026) et sur Esri World Imagery (gare de Dakar, mai 2026). L'imagerie utilisée pour le reste de la phase 1 (éditions de 2020 à 2022) n'a pas été recherchée.
- **OpenRailwayMap** : non consulté séparément, car il affiche les mêmes données OSM.

## Limites

- La précision est celle d'une numérisation sur image satellite : quelques mètres en général, sans garantie. Elle n'a pas été mesurée contre un levé.
- La phase 2 a été retracée dans OSM le 7 septembre 2026 par un seul contributeur. C'est la portion la moins recoupée.
- Les alignements droits comptent peu de sommets (jusqu'à 1,7 km entre deux points). Dans les courbes, les sommets sont espacés de 30 à 100 m : la ligne y est une suite de cordes, pas un arc.
- La ligne suit une seule voie. Pour un affichage à grande échelle de la double voie, il faudrait ajouter la voie de sens inverse.
- Les données OSM évoluent. L'extrait versionné fige l'état du 15 novembre 2026.

## Reproduire et recontrôler

```bash
python3 scripts/build_ter_dakar_aibd_trace.py --check
```

La commande reconstruit la chaîne depuis l'extrait, échoue en cas de rupture de continuité, de saut de plus de 2 km ou d'angle de plus de 15°, et vérifie que les fichiers livrés sont à jour.

Pour comparer avec l'état courant d'OSM :

- relation : <https://api.openstreetmap.org/api/0.6/relation/13645077.json>
- géométrie complète d'une voie : `https://api.openstreetmap.org/api/0.6/way/<id>/full.json`

Attribution obligatoire en cas de réutilisation : « © les contributeurs d'OpenStreetMap », licence ODbL 1.0.
