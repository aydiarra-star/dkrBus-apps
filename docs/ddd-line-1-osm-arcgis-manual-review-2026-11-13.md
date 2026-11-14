# Revue détaillée prioritaire — DDD ligne 1

Date : 13 novembre 2026.

## Sources croisées

- Ordre publié DDD : page officielle « Réseau urbain Dakar », extrait archivé le 13/11/2026.
- Relation OSM : 6951328, nom « 1 Parcelles - Leclerc », de Parcelles assainies vers Terminus Leclerc.
- Couche ArcGIS d'arrêts DDD associée à la ligne 1 : couche 5.
- Croisement exécuté avec `scripts/export_ddd_osm_arcgis_stop_crosswalk.mjs`.

## Résultat de structure

- Ordre officiel publié : 22 arrêts.
- Relation OSM : 38 membres d'arrêts ordonnés, dont 14 nommés.
- 34 des 38 membres OSM ont un point ArcGIS de la couche ligne 1 à 25 m ou moins.
- 35/38 sont à 50 m ou moins ; 36/38 à 100 m ou moins.
- Quatre occurrences dépassent 25 m : séquences OSM 24 (86,3 m), 30 (151,6 m), 33 (35,0 m) et 38 (189,3 m).
- Les 38 correspondances restent candidates et plusieurs points OSM peuvent avoir le même arrêt ArcGIS le plus proche.

## Concordances nominales ordonnées

Cinq noms normalisés sont retrouvés dans le même ordre relatif dans la relation OSM et dans l'ordre officiel :

| Rang OSM | Membre OSM | Rang DDD publié | Arrêt officiel | ArcGIS le plus proche | Distance |
|---:|---|---:|---|---|---:|
| 1 | 5056748481 | 1 | Terminus Parcelles Assainies | Arret terminus Parcelles Assainies | 7,3 m |
| 9 | 4323839208 | 5 | Terrain Acapes | Arret Terrain Acapes | 0,9 m |
| 23 | 4666430964 | 12 | UCAD | Arret UCAD | 1,4 m |
| 28 | 4666430953 | 14 | Marché Tilène | Arret marché Tilène | 4,4 m |
| 37 | 4666430939 | 19 | Place de l’Indépendance | Arret Place de l'indépendance | 0,7 m |

Ces cinq correspondances forment un signal solide de cohérence géographique et d'ordre relatif. Elles ne suffisent pas à elles seules à confirmer les 38 membres ni à combler les arrêts non nommés.

## Points à revoir avant toute validation

- OSM 24 « Arret Bus Aftu » : le point ArcGIS le plus proche est l'arrêt UCAD à 86,3 m. Vérifier si le membre OSM est une plateforme distincte ou une mauvaise affectation.
- OSM 30 « Stade » : point ArcGIS le plus proche à 151,6 m. Ne pas l'associer automatiquement à l'arrêt Avenue Blaise Diagne.
- OSM 33 : proximité à 35,0 m seulement ; conserver en attente.
- OSM 38 « Patisen » : point ArcGIS le plus proche à 189,3 m ; possible arrêt hors couche ou mauvais point, à examiner séparément.
- Les membres OSM 2 à 8, 10 à 22, 25 à 27, 29, 31 à 36 ne portent pas tous un nom exploitable. Les noms ArcGIS proches peuvent aider à proposer une correspondance, mais ne doivent pas être copiés dans OSM comme certitude.

## Décision

**Statut proposé : `HIGH_PRIORITY_CANDIDATE`, pas `CONFIRMED`.**

La relation 6951328 est la meilleure candidate actuellement étudiée pour une revue manuelle détaillée : les deux terminus sont cohérents avec le sens indiqué, les cinq noms concordent dans le même ordre, et la plupart des points sont très proches de la couche ArcGIS de la ligne 1.

Ne pas importer automatiquement cette relation comme itinéraire final. Conserver les 38 membres ordonnés, les cinq correspondances nominales et les quatre anomalies comme éléments de preuve séparés. Ne pas générer le retour en inversant cette séquence.

## Référence de l'ordre officiel

1. Terminus Parcelles Assainies
2. Sapeur Pompiers
3. Unités 09 10 15
4. Ecole Dior
5. Terrain Acapes
6. Unités 22 24
7. Marché Grand Médine
8. Rond point 26
9. VDN-Foire
10. Cité Keur Gorgui
11. Ecole Normale
12. Ucad
13. Rond point Sham
14. Marché Tilène
15. Poste Médina
16. Difoncé
17. Sandaga
18. Avenue George Pompidou
19. Place de l’Indépendance
20. Gare TER
21. Embarcadère
22. Terminus Leclerc

Source officielle : https://demdikk.sn/reseau-urbain-dakar/
