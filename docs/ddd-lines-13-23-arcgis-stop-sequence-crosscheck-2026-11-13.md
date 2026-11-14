# Rapprochement ArcGIS / séquences DDD — lignes 13 et 23

Date : 13 novembre 2026.

## Source

Archive `ddd-arcgis-route-stop-candidates`, produite par le workflow `43446577538` sur le commit `2d492bb7c6afe887410a216286a499dd4540f0dd`.

Contrôle d'extraction : 24/24 couches d'itinéraires et 12/12 couches d'arrêts récupérées, 25 entités d'itinéraire et 455 points, aucune erreur ni limite de transfert dépassée.

Les distances point–tracé sont des distances locales approximatives calculées à partir des coordonnées longitude/latitude. Elles mesurent la proximité géographique, pas la validité d'un arrêt voyageurs.

## Ligne 13

### Couche nommée `Arret_ligne_13_Dem_Dikk`

- 23 points avec libellés.
- 23/23 à moins de 25 m de la géométrie de l'itinéraire.
- Distance médiane point–tracé : environ 6,5 m ; maximum : environ 10,5 m.
- Premier libellé : « Terminus Liberté 5 ».
- Dernier libellé : « Arret Terminus DDD Palais 1 ».

La séquence officielle DDD publiée comporte 24 repères et se termine par « Terminus Palais 2 ». La couche ArcGIS se termine donc explicitement à Palais 1 : le conflit Palais 1 / Palais 2 est conservé.

Après normalisation des accents, de la casse et des préfixes génériques « Arrêt » / « Terminus », seules deux correspondances nominales strictes et ordonnées sont communes aux deux séquences :
- Allées Papa Guèye Fall ;
- Avenue Faidherbe.

Les autres noms de la couche ArcGIS répètent principalement « Avenue Cheikh Ahmadou Bamba » et « Boulevard du Général de Gaulle », ou utilisent des repères différents de la liste publiée. La proximité avec le tracé est excellente, mais ne valide pas les 23 libellés comme transcription des 24 arrêts DDD.

### Seconde couche anonymisée

Une autre couche, `Arrets_LIgne_13_Dakar_Dem_Dikk`, contient 22 points avec `Id=0` et sans nom d'arrêt. Elle est conservée séparément. Elle ne doit pas être fusionnée avec la couche nommée sur la seule base du numéro de ligne ; l'identité et la relation entre les deux couches doivent être confirmées par les métadonnées et les GlobalID.

**Décision ligne 13 :** candidat ArcGIS géographiquement fort, mais séquence voyageurs non validée. Conserver le conflit de terminus Palais 1 / Palais 2 et ne pas remplacer la séquence DDD publiée.

## Ligne 23

Couche `Arrets_LIgne_23_Dakar_Dem_Dikk` :
- 56 points ;
- 54 libellés non vides et 2 points sans nom ;
- 56/56 points à moins de 25 m de la géométrie ArcGIS ;
- distance médiane point–tracé : environ 5,6 m ; maximum : environ 10,5 m ;
- premier libellé : « Terminus Parcelles Assainies » ;
- dernier libellé : « Terminus Palais de JUSTICE ».

La séquence DDD publiée comporte 40 repères et se termine à « Terminus Palais 2 ». Après normalisation des noms, seules deux correspondances nominales strictes et ordonnées sont communes :
- Acapes ;
- UCAD.

La couche ArcGIS comporte de longues séries de points portant des libellés d'axes routiers, notamment « Route des Ndiayes » et « Avenue du président Bourguiba ». Ces points sont spatialement distincts et ne doivent pas être dédupliqués par texte. Deux points sont anonymes et doivent le rester.

Le terminus ArcGIS « Palais de JUSTICE » et le terminus DDD « Palais 2 » sont conservés comme libellés différents tant qu'une source opérateur ne confirme pas leur équivalence. Les 56 points sur le corridor ne démontrent pas qu'ils correspondent aux 40 repères publiés, ni que l'ordre OBJECTID est le sens commercial exploité.

**Décision ligne 23 :** conserver les 56 points comme candidats géographiques rattachés au corridor ; ne pas les réduire à 40, ne pas leur attribuer de correspondance par proximité seule et ne pas déduire le retour par inversion.

## Résumé des décisions

| Ligne | Points ArcGIS | Proximité au tracé | Correspondances nominales ordonnées | Décision |
|---|---:|---:|---:|---|
| 13 (couche nommée) | 23 | 23/23 à moins de 25 m | 2 | Candidat, conflit Palais 1 / Palais 2 |
| 13 (couche anonyme) | 22 | Non rapprochée à la couche nommée dans ce contrôle | 0 | Candidat anonyme distinct |
| 23 | 56 | 56/56 à moins de 25 m | 2 | Candidat, ne pas assimiler Palais de Justice à Palais 2 |

## Suite

- Examiner les identifiants et métadonnées des deux couches de la ligne 13 avant toute consolidation.
- Garder les 56 points de la ligne 23, les deux anonymes et les libellés répétés.
- Poursuivre le contrôle des sens avec les relations OSM directionnelles et les publications DDD, sans fusionner des sources incompatibles.

## Garde-fous

Analyse documentaire en lecture seule : aucun import dans le catalogue voyageurs, aucune écriture Supabase, aucun déploiement, aucune modification de la production ou des données TER/BRT. Aucun GTFS utilisé. Aucun horaire ou intervalle n'est déduit d'ArcGIS.
