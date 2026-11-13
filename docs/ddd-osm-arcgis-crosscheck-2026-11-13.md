# Rapprochement initial DDD — OSM et ArcGIS

Date des extractions : 13 novembre 2026 (UTC).

## Sources et périmètre

- ArcGIS DDD : extraction publique des couches de tracés et d'arrêts, générée le 13/11/2026 à 12:27:59 UTC.
- OpenStreetMap : relations de bus extraites en lecture seule dans l'emprise de Dakar, générées le 13/11/2026 à 12:33:39 UTC.
- Méthode : distance géographique entre les membres d'arrêt OSM et les points de la couche ArcGIS correspondant au numéro de ligne ; comptage des plus proches voisins à 25/50/100/200 m et diagnostic de sous-séquence ordonnée un-à-un à 50/100 m, dans l'ordre ArcGIS puis dans l'ordre inverse.

Ce rapprochement est un **outil de tri des preuves**, pas une validation d'itinéraire. L'ordre de réponse des entités ArcGIS n'est pas certifié comme ordre opérationnel des arrêts. La proximité seule ne prouve ni l'identité de l'arrêt, ni le sens, ni l'exploitation actuelle. Aucun identifiant n'est fusionné et aucune donnée voyageur n'est modifiée.

## Résumé OSM

- 6 610 éléments OSM récupérés.
- 25 relations de bus et 2 relations maîtres.
- 23 relations classées candidates dans l'emprise ; 2 relations classées en conflit de périmètre.
- 18 relations ont au moins un membre d'arrêt ordonné ; 522 occurrences de membres d'arrêt sur l'ensemble des relations.
- 7 relations candidates n'ont aucun membre d'arrêt exploitable.
- 2 relations maîtres : ligne 23 et ligne 7.
- Les directions absentes ne sont jamais fabriquées. Aucune fréquence n'est déduite.

## Comparaisons par relation

Les colonnes « proches ≤ 50 m » comptent les membres OSM dont le point ArcGIS le plus proche est à 50 m ou moins. « Ordonnés ≤ 50 m » est le maximum de correspondances un-à-un qui préservent l'ordre relatif des deux listes. Les valeurs ne sont pas des arrêts validés.

| Ligne / ref OSM | Relation OSM | Membres OSM | Points ArcGIS | Proches ≤ 50 m | Ordonnés ≤ 50 m (ArcGIS / inverse) |
|---|---:|---:|---:|---:|---:|
| 121 | 2792903 | 3 | 31 | 3 | 1 / 3 |
| 1 | 6951328 | 38 | 44 | 35 | 34 / 1 |
| 7 | 6990669 | 31 | 33 | 10 | 1 / 10 |
| 121 | 6990794 | 27 | 31 | 24 | 24 / 1 |
| 4 | 6990830 | 34 | 30 | 6 | 1 / 6 |
| 10 | 6990845 | 30 | 26 | 10 | 1 / 10 |
| 9 | 6996431 | 32 | 36 | 15 | 1 / 15 |
| 121 | 6999013 | 7 | 31 | 4 | 1 / 4 |
| 4 | 7203970 | 32 | 30 | 24 | 24 / 1 |
| 9 | 7487218 | 29 | 36 | 27 | 27 / 1 |
| 10 | 7488283 | 25 | 26 | 20 | 20 / 1 |
| 8 | 7495137 | 0 | 49 | 0 | 0 / 0 |
| 23 | 7495279 | 51 | 56 | 22 | 3 / 20 |
| 6* | 7499433 | 1 | 60 | 0 | 0 / 0 |
| 18 | 7499475 | 0 | 44 | 0 | 0 / 0 |
| 7 | 7500475 | 34 | 33 | 30 | 30 / 1 |

* **Conflit de libellé à ne pas valider :** la relation 7499433 porte le ref « 6 », mais son nom est « 7 Palais 1 → Parcelles-Assainies » et elle ne contient qu'un seul membre d'arrêt. Le rapprochement avec la couche DDD 6 est donc purement mécanique et doit rester en conflit.

## Relations à traiter séparément

- La relation 7108131 porte le ref multiple « L23;L5 », contient 47 membres d'arrêt et est reliée à la relation maître de la ligne 23. Elle n'est pas affectée automatiquement à la ligne 23 ou à la ligne 5 : arbitrage documentaire requis.
- Les deux relations B1 (19961937 et 19961993) décrivent des séquences BRT opposées. Elles sont conservées hors du rapprochement DDD.
- Les relations 10123245 et 10123246 sont classées hors périmètre (opérateur APSRTC, trajets Vijayawada–Hyderabad) et ne doivent pas être intégrées au réseau dakarois.
- La relation 3982642 (ref 40, opérateur Aftu, réseau Tata) est une candidate AFTU/TATA, sans séquence d'arrêt exploitable dans cette extraction.
- Les relations 1434825 (ref 36), 3853555 (sans ref) et 14222002 (sans ref, un arrêt) restent non attribuées à une ligne DDD.

## Priorités de rapprochement

1. **Candidats à examiner en premier :** DDD 1 (6951328), 7 (7500475), 4 (7203970), 9 (7487218), 10 (7488283) et 121 (6990794). Ils présentent plusieurs proximités géographiques et des sous-séquences ordonnées. Cela ne suffit pas à certifier les deux sens.
2. **Candidats partiels :** les relations 6990669 (7), 6990830 (4), 6990845 (10), 6996431 (9), 6999013 (121) et 7495279 (23). Les écarts peuvent refléter des couches ArcGIS incomplètes, des variantes, des arrêts non appariés ou des différences de séquence.
3. **À résoudre avant toute association :** ligne 6 / relation 7499433, ligne 23 / relation 7108131 à ref multiple, et les relations 18 / 8 sans arrêts ordonnés.
4. Pour chaque candidat, conserver les identifiants OSM (type + id), les identifiants ArcGIS (couche + OBJECTID), la distance, le libellé source, l'ordre d'origine et le statut de revue. Ne pas fusionner les objets sur le seul critère de distance.

## Limites de collecte

L'endpoint Overpass principal a fourni l'extraction. Un endpoint secondaire a échoué sur deux tentatives (échec réseau puis HTTP 504) ; cette erreur est conservée dans l'artefact. Elle ne remet pas en cause la présence de l'extraction principale, mais interdit de présenter cette collecte comme une couverture exhaustive de toutes les relations OSM de Dakar.

Attribution OSM : © les contributeurs OpenStreetMap, données sous licence ODbL. Les données ArcGIS sont attribuées au service public DDD.
