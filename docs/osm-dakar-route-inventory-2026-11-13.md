# Inventaire OSM transport Dakar — triage du 13 novembre 2026

## Collecte

Source : extraction OSM en lecture seule, générée le 13/11/2026 à 13:33:56 UTC.

- 6 610 éléments.
- 25 relations de lignes et 2 relations route-master.
- 23 relations classées candidates dans le périmètre Dakar ; 2 conflits de périmètre.
- 18 relations possèdent des membres d'arrêts ordonnés, soit 522 occurrences.
- 7 relations n'ont aucun membre d'arrêt ordonné.
- Les deux relations route-master concernent les lignes 23 et 7.

## Triage des relations utiles

| Référence / nom OSM | Relation | Opérateur / réseau OSM | Arrêts ordonnés | Décision |
|---|---:|---|---:|---|
| DDD 1 Parcelles – Leclerc | 6951328 | Dakar Dem Dikk | 38 | Candidate à revue |
| DDD 7 Palais – Quakam | 6990669 | Dakar Dem Dikk | 31 | Candidate à revue, géométrie dispersée |
| DDD 7 Quakam – Palais | 7500475 | Dakar Dem Dikk | 34 | Candidate à revue |
| DDD 4 Leclerc – Liberté | 6990830 | Dakar Dem Dikk | 34 | Candidate à revue, géométrie dispersée |
| DDD 4 Liberté – Leclerc | 7203970 | Dakar Dem Dikk | 32 | Candidate à revue |
| DDD 9 Palais – Liberté | 6996431 | Dakar Dem Dikk | 32 | Candidate à revue, géométrie dispersée |
| DDD 9 Liberté – Palais | 7487218 | Dakar Dem Dikk | 29 | Candidate à revue |
| DDD 10 Palais – Liberté | 6990845 | Dakar Dem Dikk | 30 | Candidate à revue, géométrie dispersée |
| DDD 10 Liberté – Palais | 7488283 | Dakar Dem Dikk | 25 | Candidate à revue |
| DDD 121 HLM Grand Yoff – Leclerc | 6990794 | Non renseigné | 27 | Candidate à revue |
| DDD 121 Leclerc – HLM Grand Medine | 6999013 | Non renseigné | 7 | Candidate à revue, géométrie partielle |
| DDD 121, nom générique | 2792903 | Non renseigné | 3 | Candidate incomplète |
| DDD 23 Termibus Palais 1 → Parcelles-Assainies | 7495279 | Dakar Dem Dikk | 51 | Candidate à revue ; direction indiquée dans le nom |
| DDD, référence L23;L5 | 7108131 | Dakar Dem Dikk | 47 | Ambiguë : deux références, ne pas attribuer automatiquement |
| DDD, référence 6 mais nom indiquant ligne 7 | 7499433 | Dakar Dem Dikk | 1 | Conflit interne, isoler |
| DDD ligne 8 | 7495137 | Dakar Dem Dikk | 0 | Relation sans séquence d'arrêts |
| DDD ligne 18 | 7499475 | Dakar Dem Dikk | 0 | Relation sans séquence d'arrêts |
| AFTU ligne 40 | 3982642 | Aftu / Tata | 0 | Relation présente, mais aucun arrêt ordonné à exploiter |
| Ligne 36 | 1434825 | Non renseigné | 0 | Référence présente, opérateur et arrêts à documenter |
| Ligne sans référence | 3853555 | Non renseigné | 0 | Métadonnées insuffisantes |
| Relation sans référence | 14222002 | Non renseigné | 1 | Un membre isolé, pas un itinéraire exploitable |
| B1 Omnibus Guédiawaye → Petersen | 19961937 | SunuBRT | 50 | BRT, hors périmètre de cette revue DDD |
| B1 Omnibus Petersen → Guédiawaye | 19961993 | SunuBRT | 50 | BRT, hors périmètre de cette revue DDD |

Deux relations APSRTC (10123245 et 10123246) sont classées en conflit de périmètre ; elles ne doivent pas être utilisées pour décrire le réseau dakarois.

## Décisions opérationnelles

1. Les relations DDD directionnelles restent distinctes. Les relations 6990669/7500475, 6990830/7203970, 6996431/7487218 et 6990845/7488283 ne sont pas fusionnées.
2. Les lignes 8 et 18 restent dans la liste de recherche, mais sans ordre d'arrêts OSM exploitable.
3. La relation AFTU/TATA ligne 40 confirme seulement la présence d'une relation OSM étiquetée Aftu/Tata ; elle ne fournit aucun ordre d'arrêts.
4. La relation 7108131 ne doit pas être forcée vers la ligne 23 ou la ligne 5.
5. Les relations B1 sont explicitement identifiées comme BRT et ne sont pas réutilisées pour DDD.
6. Aucun itinéraire, retour, arrêt ou horaire n'est créé sur la base de ces seules données OSM.

## Suite prioritaire

- Croiser les séquences officielles DDD avec les six groupes géographiquement les plus cohérents identifiés dans `ddd-osm-arcgis-consolidation-2026-11-13.md`.
- Reprendre les lignes 8 et 18 via les pages officielles et les autres sources cartographiques, sans attendre GTFS.
- Pour AFTU/TATA, poursuivre l'extraction des pages officielles ligne par ligne ; OSM ne fournit pas ici la séquence de la ligne 40.
- Garder les horaires et fréquences séparés de cette revue géographique : aucune fréquence OSM n'est utilisée.
