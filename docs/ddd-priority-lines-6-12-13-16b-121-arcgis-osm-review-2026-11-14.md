# DDD — revue prioritaire des lignes 1, 6, 12, 13, 16B et 121 (OSM / ArcGIS / pages DDD)

Date de revue : 14 novembre 2026  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
HEAD contrôlé : `105d89a724a4220260442adb49b52abeb12bffbe`

## Périmètre et méthode

Cette revue exploite :
- la collecte OSM Overpass du 14 novembre 2026, artefact `dakar-osm-route-candidates`, généré à 07:09:04 UTC (6 610 éléments) ;
- les couches publiques ArcGIS DDD, artefact `ddd-arcgis-route-stop-candidates` (24 couches de tracés et 12 couches d'arrêts récupérées, 25 entités de tracé, 455 points, aucune erreur ni limite de transfert) ;
- la page DDD « Réseau urbain de Dakar » et la page DDD « Info voyageurs ».

Pour les couches ArcGIS qui possèdent des points d'arrêt et une polyligne, les points ont été projetés en UTM 28N sur la polyligne correspondante. La distance mesure la proximité au tracé ; le chaînage donne uniquement un ordre géométrique candidat. Il ne prouve ni l'identité physique de chaque arrêt, ni le sens réel d'exploitation, ni l'actualité du service.

**Règle :** aucun point ArcGIS n'est promu en arrêt passager à partir de sa seule proximité ; aucune direction opposée n'est créée par inversion ; aucun horaire ou intervalle n'est déduit.

## Résumé des résultats

| Ligne | OSM au 14/11 | ArcGIS disponible | Résultat prudent |
|---|---|---|---|
| 1 | Relation 6951328, 38 arrêts ordonnés ; 38/38 à ≤25 m du tracé, corrélation ordre/chaînage +0,9879 | Tracé et couche de points DDD | Un sens OSM géographiquement fort ; aucun retour distinct prouvé |
| 6 | Relation 7499433 : nom « 7 Palais 1 → Parcelles-Assainies », `ref=6`, conflit explicite, un seul membre stop | Tracé 23,50 km et 60 points | Bonne cohérence spatiale des 60 points avec le tracé, mais identité/terminus en conflit entre les pages DDD et OSM |
| 12 | Aucune relation OSM correspondante | Tracé 24,52 km, pas de couche de points dédiée dans l'extraction | Le texte ArcGIS et la fiche DDD actuelle divergent sur les terminus ; pas de séquence d'arrêts validable depuis ArcGIS |
| 13 | Aucune relation OSM correspondante | Tracé 10,56 km et 23 points nommés ; une seconde couche de 22 points avec `Id=0` | Tracé et points cohérents spatialement ; plusieurs noms génériques et différence de granularité avec les 24 repères publiés |
| 16B | Aucune relation OSM correspondante | Tracé banlieue avec 12 champs de segments, sans couche de points dédiée | Bon rapprochement textuel du corridor publié ; source ArcGIS ancienne et pas de liste d'arrêts ponctuels |
| 121 | Relations 6990794 (27 arrêts) et 6999013 (7 arrêts), sens opposés mais terminus incompatibles ; fragment 2792903 non indépendant | Tracé 12,32 km et 31 points | Forte cohérence géométrique des points ; deux candidats OSM partiels, aucun retour complet validé |

## Ligne 6 — conflit d'identité à résoudre avant toute intégration

### Sources DDD

Deux pages publiques du même opérateur ne présentent pas la même ligne 6 :
- la page « Info voyageurs » annonce **Cambérène 2 ↔ Palais 2** ;
- la page « Réseau urbain de Dakar » annonce **Guédiawaye ↔ Palais 1** et publie une séquence commençant par « Terminus Guédiawaye ».

La couche ArcGIS de tracé porte `Nom_Ligne = Ligne 6`, avec un texte de corridor allant de Cambérène 2 vers Cambérène village, puis les secteurs Parcelles, VDN, Liberté 6, Dieuppeul et le centre-ville jusqu'à Palais 2. La couche de points porte 60 enregistrements : premier libellé « Terminus Cambérène », dernier « Terminus Palais de Justice ».

### Contrôle géométrique des 60 points

- 60/60 points sont à 11,6 m ou moins de la polyligne ;
- les distances mesurées sont comprises entre 0 et 11,6 m ;
- le chaînage place les points dans une continuité géométrique de Cambérène vers le centre-ville.

Cela confirme que la couche de points appartient très probablement au corridor de la polyligne. Cela ne résout pas le conflit Cambérène 2 / Guédiawaye ni Palais 2 / Palais 1, et ne prouve pas que le chaînage de la polyligne est le sens commercial actuel.

### OSM

La relation 7499433 a :
- `ref=6` ;
- `name=7 Palais 1 → Parcelles-Assainies` ;
- `from=Palais 1`, `to=Parcelles-Assainies` ;
- un seul membre d'arrêt ordonné ;
- un avertissement OSM `fixme` sur un passage à contresens d'une voie à sens unique.

**Décision :** ne pas associer cette relation à la ligne 6 du catalogue. La référence et le nom se contredisent, la relation n'a qu'un arrêt et ses terminus ne correspondent pas au corridor ArcGIS Cambérène–Palais 2. Conserver cette relation comme anomalie OSM à vérifier.

## Ligne 12 — corridor ArcGIS ancien, terminus divergents

La couche ArcGIS de banlieue contient une polyligne `Ligne 12` et 11 champs de segments textuels. Elle annonce notamment :
- « Terminus Guédiawaye – Cité des Enseignants » au début ;
- des secteurs Lycée Canada, Tally Boubess, Route des Niayes, Capa, Cité des Eaux, Avenue Bourguiba, Hôpital Fann et Avenue Blaise Diagne ;
- « Avenue Léopold Sédar Senghor – Avenue Nelson Mandela – Palais de Justice » à la fin.

La page DDD actuelle annonce **Guédiawaye ↔ Palais 1** et publie une séquence passant par Marché Sandika, Bountou Pikine, Nationale 1, Croisement Cambérène, Autoroute, Cité des Eaux, Station Castors, Avenue Bourguiba, Hôpital Fann, Sahm et le centre-ville.

Il existe des recouvrements de corridor, mais les points de départ et d'arrivée ArcGIS (Cité des Enseignants / Palais de Justice) ne concordent pas avec les terminus DDD actuels (Guédiawaye / Palais 1). Aucune couche de points d'arrêt dédiée à la ligne 12 n'a été trouvée dans l'extraction ArcGIS ; aucune relation OSM 12 n'a été trouvée dans l'extraction OSM.

La métadonnée `lastEditDate` de l'entité ArcGIS de tracé correspond au 6 décembre 2017. Cette ancienneté interdit de traiter ses segments comme une confirmation du service actuel.

**Décision :** conserver le tracé comme référence historique de corridor, sans importer ses segments comme arrêts et sans l'utiliser pour corriger la séquence DDD actuelle.

## Ligne 13 — bon alignement spatial, granularité et libellés à revoir

La page DDD actuelle publie **Liberté 5 ↔ Palais 2** avec 24 repères. ArcGIS fournit :
- une polyligne `Ligne 13` de 10,56 km, dont le texte de segments relie Dieuppeul, Avenue Cheikh Ahmadou Bamba, Station Castors, Cité Port, Lycée Kennedy, Boulevard Général de Gaulle, Allées Papa Guèye Fall, Avenue Faidherbe, Esso Port, Place de l'Indépendance et Palais 2 ;
- une couche de 23 points nommés ;
- une autre couche de 22 points dont l'attribut `Id` vaut 0 pour tous les enregistrements.

Les 23 points nommés sont tous à 10,5 m ou moins de la polyligne. Leurs libellés se répètent fortement (notamment Avenue Cheikh Ahmadou Bamba et Boulevard Général de Gaulle) ; ils ne correspondent donc pas chacun à un arrêt distinct nommé dans la fiche DDD. La seconde couche de 22 points se superpose presque entièrement à la première (22 positions ont un voisin à environ 3 m ou moins, avec un enregistrement plus éloigné d'environ 26 m) ; elle ne doit pas être additionnée comme 22 arrêts supplémentaires.

L'ArcGIS conserve « Cité Port » et des groupes de tronçons qui ne sont pas libellés de la même façon que la séquence actuelle DDD. Il s'agit d'une corroboration du corridor et non d'une transcription exhaustive des 24 arrêts.

Aucune relation OSM 13 n'a été trouvée dans l'extraction du 14 novembre.

**Décision :** garder les 23 points comme candidats géographiques documentaires, ne pas les convertir automatiquement en arrêts du catalogue et ne pas fabriquer le retour.

## Ligne 16B — meilleur rapprochement textuel du lot, mais pas de points d'arrêt

La page DDD actuelle annonce **Malika ↔ Palais 1** et publie une séquence détaillée. La couche ArcGIS `Ligne 16B` contient 12 champs de segments qui reprennent le même corridor et les mêmes repères principaux : Malika, Station Keur Massar, Croisement Keur Massar, LGI, Diamaguène, Thiaroye, Sips, Sotiba, Yarakh, Capa Virmaud, Place Bakou, Scoa, Police Bel Air, Bel Air, GMD, Sofrigal/Môle 8, Cyrnos, Caserne des Sapeurs-Pompiers, Lamine Guèye, Peytavin, Jean Jaurès, République, Léopold Sédar Senghor, Hôpital Principal, Assemblée nationale, Hôpital Le Dantec et Palais 1.

C'est un recoupement textuel favorable du corridor publié, mais les champs ArcGIS sont des paires de repères/segments, pas une liste exhaustive de points d'arrêt. Aucune couche de points d'arrêt dédiée à 16B n'est présente dans l'extraction et aucune relation OSM 16B n'a été trouvée.

La métadonnée `lastEditDate` du tracé correspond au 6 décembre 2017. Les deux champs de longueur de l'entité (`SHAPE_Leng` et `Shape__Length`) diffèrent également ; ne pas utiliser ces valeurs pour calculer une durée ou un nombre d'arrêts.

**Décision :** conserver la correspondance de corridor comme corroboration documentaire, sans prétendre que les deux directions ou chaque arrêt sont validés.

## Ligne 121 — rappel de la revue détaillée

La page DDD actuelle publie 25 repères entre Scat Urbam et Leclerc. La couche ArcGIS contient une polyligne et 31 points ; les 31 points sont à 10,9 m ou moins du tracé.

Les relations OSM :
- 6990794 : 27 arrêts ordonnés, HLM Grand Yoff → Leclerc ; géométriquement forte, mais terminus différent de Scat Urbam ;
- 6999013 : 7 arrêts ordonnés, Leclerc → HLM Grand Medine ; seulement partielle ;
- 2792903 : 3 nœuds partagés avec 6990794, donc pas une troisième direction.

Voir le rapport détaillé : `docs/ddd-line-121-osm-official-direction-review-2026-11-13.md`.

**Décision :** conserver les deux relations directionnelles candidates séparément. Ne pas déclarer le retour officiel et ne pas remplacer Scat Urbam par HLM Grand Medine.

## Ligne 1 — rappel du dossier déjà consolidé

La relation OSM 6951328 contient 38 arrêts ordonnés et suit la polyligne ArcGIS : 38/38 à 25 m ou moins, médiane 5,9 m, corrélation ordre/chaînage +0,9879. Aucun retour OSM distinct n'a été établi dans cette extraction.

Voir `docs/ddd-line-1-refreshed-osm-sequence-continuity-review-2026-11-13.md`.

## Priorités de suite

1. **Ligne 6 :** demander à DDD de résoudre le conflit entre les deux pages officielles (Cambérène 2–Palais 2 contre Guédiawaye–Palais 1) avant toute association de la relation OSM 7499433.
2. **Ligne 12 :** rechercher une fiche opérateur plus récente ou une confirmation des terminus ; le tracé ArcGIS de 2017 est seulement historique.
3. **Ligne 13 :** comparer les 23 points nommés à la liste des 24 repères avec les coordonnées et les identifiants physiques ; ne pas compter la couche `Id=0` en doublon.
4. **Ligne 16B :** rechercher une source récente contenant les points/arrêts ordonnés et le retour ; le corridor textuel est cohérent, mais la couche date de 2017.
5. **Ligne 121 :** obtenir une preuve de terminus et de retour correspondant à Scat Urbam.
6. Continuer ensuite les lignes DDD sans groupe ArcGIS, en séparant toujours les deux sens.

## Sources

- DDD, réseau urbain et séquences détaillées : https://demdikk.sn/reseau-urbain-dakar/
- DDD, index « Info voyageurs » et terminus annoncés : https://demdikk.sn/info-voyageurs/
- ArcGIS, couches urbaines (arrêts et tracés) : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer/
- ArcGIS, couches banlieue : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Itin%C3%A9raire_ligne_de_Banlieue_Dakar_Dem_Dikk/FeatureServer/
- OSM : données des contributeurs OpenStreetMap via Overpass, extraction horodatée du 14 novembre 2026 à 07:09 UTC.

## Garde-fous

Aucune donnée passager n'a été modifiée. Aucun sens n'a été créé par inversion. Aucune fréquence ou heure n'a été inventée. Aucune écriture Supabase, aucun déploiement et aucune modification TER/BRT. GTFS reste non bloquant.
