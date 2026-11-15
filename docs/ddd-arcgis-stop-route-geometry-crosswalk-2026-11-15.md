# DDD — audit géométrique ArcGIS arrêts / itinéraires et anomalies 217–219 / 228

Date de l'extraction : 15 novembre 2026  
Service : `Dem_dikk_mise_a_jour/FeatureServer`  
Mode : lecture seule. Aucun arrêt, tracé, horaire, fréquence, donnée Supabase ou donnée passager n'a été modifié.

## 1. Extraction contrôlée

Les requêtes ArcGIS par identifiants ont retourné l'intégralité des entités annoncées par le service :

| Couche | Entités | Géométries | Sans géométrie |
|---|---:|---:|---:|
| 0 — arrêts | 777 | 775 points | 2 |
| 1 — itinéraires | 25 | 24 polylignes | 1 |

Les JSON ArcGIS bruts conservent les identifiants et attributs source. Les GeoJSON ont été exportés en WGS84 ; les mesures M nulles ont été retirées des coordonnées GeoJSON 2D, sans toucher aux JSON bruts.

Fraîcheur des données déclarée par ArcGIS :
- couche d'arrêts : données modifiées le 24 septembre 2024 ;
- couche d'itinéraires : données géométriques modifiées le 11 janvier 2019, même si le schéma/métadonnées de la couche a été modifié le 24 septembre 2024.

**Conséquence :** la géométrie de route reste un témoin historique 2019. Le rapprochement métrique mesure une cohérence spatiale entre deux couches ArcGIS ; il ne certifie pas que les routes sont encore exploitées à l'identique en 2026.

## 2. Méthode de rapprochement

- Projection WGS84 vers UTM zone 28N (EPSG:32628) pour calculer des distances en mètres.
- Pour chaque point, calcul de la distance minimale à la polyligne de la ligne portant le même numéro source, et de sa position linéaire (chainage) le long de la géométrie.
- Les libellés de groupes d'arrêts et les identifiants d'origine restent inchangés.
- Les seuils de 25 m, 50 m et 100 m sont des seuils de proximité géométrique, pas des seuils de validation commerciale.
- Les lignes 13, 218 et 228 font l'objet d'un contrôle spécifique ; aucune réattribution n'est appliquée automatiquement.

Résultat global du rapprochement strict par numéro :
- 718 lignes d'arrêt sur 777 sont à 25 m ou moins de la géométrie de leur ligne nommée ;
- 1 est entre 50 et 100 m ;
- 52 sont à plus de 100 m ;
- 6 n'ont pas de géométrie de route portant explicitement leur numéro source (4 points de `ligne_228` et 2 points sans code de ligne ni géométrie).

Les 52 écarts supérieurs à 100 m ne sont pas 52 erreurs indépendantes : l'analyse détaillée montre qu'ils proviennent du mélange de lignes dans le groupe source `ligne_218` décrit ci-dessous.

### Résultats par groupe source avec géométrie nommée

| Ligne | Points source | Points à ≤25 m | Distance maximale | Lecture |
|---|---:|---:|---:|---|
| 1 | 44 | 44 | 14,9 m | cohérence spatiale forte |
| 2 | 32 | 32 | 15,0 m | cohérence spatiale forte |
| 4 | 29 | 29 | 12,2 m | cohérence spatiale forte |
| 5 | 18 | 18 | 9,5 m | cohérence spatiale forte |
| 6 | 60 | 60 | 11,6 m | cohérence spatiale forte |
| 7 | 33 | 33 | 14,3 m | cohérence spatiale forte, terminus à vérifier |
| 8 | 49 | 49 | 12,1 m | cohérence spatiale forte |
| 9 | 36 | 36 | 15,3 m | cohérence spatiale forte, terminus à vérifier |
| 10 | 26 | 26 | 12,2 m | cohérence spatiale forte, terminus à vérifier |
| 11 | 23 | 23 | 17,1 m | cohérence spatiale forte |
| 12 | 40 | 40 | 9,5 m | cohérence spatiale forte |
| 13 — `LIgne_13` | 22 | 22 | 10,7 m | groupe source distinct |
| 13 — `ligne_13` | 23 | 23 | 10,5 m | groupe source distinct, ne pas fusionner |
| 16A | 13 | 13 | 13,4 m | cohérence spatiale forte |
| 16B | 30 | 30 | 16,8 m | cohérence spatiale forte |
| 18 | 44 | 44 | 8,4 m | cohérence spatiale forte |
| 23 | 54 | 54 | 10,5 m | cohérence spatiale forte |
| 121 | 31 | 31 | 10,9 m | cohérence spatiale forte |
| 217 | 30 | 29 | 62,2 m | 1 point à contrôler |
| 218 | 103 | 51 | 3 922,4 m | groupe mélangé : 37 positions 218 + 33 positions candidates 219, ces dernières dupliquées |
| 219 | aucun groupe nommé | — | — | 33 positions candidates présentes sous `ligne_218` |
| 227 | 8 | 8 | 9,0 m | cohérence spatiale forte |
| 228 | 4 | — | 85,5 m max | géométrie candidate OID 10 non numérotée, pas de match explicite |
| 232 | 23 | 23 | 9,7 m | cohérence spatiale forte |

Les distances maximales sont calculées par rapport à la géométrie de même numéro lorsqu'elle existe. Pour la ligne 218, le maximum brut est trompeur tant que les points candidats de la ligne 219 restent regroupés sous `ligne_218`.

## 3. Contrôle des lignes 7, 9 et 10

| Ligne | Groupe d'arrêts | Géométrie ArcGIS | Longueur | Points à ≤25 m |
|---|---|---:|---:|---:|
| 7 | `ligne_7` — 33 points | OID 16 | 14,117 km | 33/33 |
| 9 | `ligne_9` — 36 points | OID 13 | 13,410 km | 36/36 |
| 10 | `LIgne_10` — 26 points | OID 24 | 15,392 km | 26/26 |

La proximité des points à la polyligne est excellente. Cela confirme que les points ArcGIS sont bien placés sur le corridor historique correspondant. Cela ne valide ni la date actuelle du corridor, ni l'ordre commercial exact, ni le retour.

### Conflits de terminus à conserver

| Ligne | Extrémité nommée par les points ArcGIS | Terminus publié par DDD |
|---|---|---|
| 7 | « Terminus Ouakam » → « Terminus Palais de Justice » | Ouakam → Palais 2 |
| 9 | « terminus terrain joot Liberté 6 » → « Termibus DD Palais 1 » | Liberté 6 → Palais 2 |
| 10 | « Arret Terminus Liberté 5 » → « Terminus Palais de Justice » | Liberté 5 → Palais 2 |

Ne pas fusionner « Palais de Justice », « Palais 1 », « Palais 2 » et « Gare Palais » sans preuve d'identité. Les polylignes ArcGIS sont des géométries historiques orientées dans un sens ; elles ne fournissent pas une seconde géométrie de retour.

Moovit publie bien des séquences distinctes pour les lignes 7, 9 et 10, mais ses terminus et nombres d'arrêts diffèrent des repères DDD. L'audit OSM précédent montrait également des qualités différentes entre les relations aller et retour. Les séquences officielles DDD restent la référence commerciale ; aucun arrêt générique Moovit n'est promu en arrêt DDD.

## 4. Découverte majeure — le groupe ArcGIS « ligne_218 » mélange les lignes 218 et 219

La couche 1 contient deux polylignes distinctes :
- OID 7 — « Ligne 218 », longueur 25,598 km, corridor déclaré de Thiaroye vers l'aéroport ;
- OID 8 — « Ligne 219 », longueur 20,772 km, corridor déclaré de Daroukhane vers Ouakam.

La couche 0 contient 103 points sous le seul code `ligne_218`. Le contrôle des noms et coordonnées révèle :

- 70 positions uniques (nom d'arrêt + coordonnées) ;
- 33 positions sont chacune présentes deux fois, soit 66 enregistrements ;
- les 33 positions répétées sont toutes à 25 m ou moins de la polyligne OID 8 « Ligne 219 » ;
- parmi ces 33 positions, 26 sont à plus de 100 m de la polyligne OID 7 « Ligne 218 » ; 7 sont dans un secteur de corridor partagé et proches des deux géométries ;
- les 37 positions non dupliquées sont toutes à 25 m ou moins de la polyligne OID 7 « Ligne 218 » ; 30 sont à plus de 100 m de la polyligne OID 8 et 7 se trouvent dans le secteur partagé.

Les deux blocs dupliqués conservent des identifiants distincts : premiers enregistrements `OBJECTID 54–86` / `OBJECTID_12 506–538`, copies `OBJECTID 293–325` / `OBJECTID_12 745–777`. Les 33 noms et coordonnées des deux blocs sont identiques.

### Interprétation prudente

La preuve géométrique indique une contamination de l'attribution source : le groupe `ligne_218` contient :
- 37 positions cohérentes avec la géométrie de la ligne 218 ;
- 33 positions distinctes cohérentes avec la géométrie de la ligne 219, dupliquées une seconde fois.

Cette lecture est cohérente avec la page officielle DDD, qui distingue bien :
- ligne 218 : Thiaroye ↔ Aéroport LSS ;
- ligne 219 : Daroukhane ↔ Ouakam.

### Contrôle de l'ordre géométrique par chainage

Les points de chaque bloc suivent aussi le sens de la polyligne correspondante :

- **Ligne 218 / OID 7**, de « Terminus Dépôt Thiaroye 218 » (0,00 km) à « Terminus Aéroport L.S.S » (25,60 km). Repères intermédiaires : RN (0,91), Pikine RN (3,17), Croisement Cambérène (5,49), Entrée Patte d’Oie (6,52), Avenue Seydina Limamoulaye (7,47), VDN (10,29), Ancienne Piste (14,35), Avenue Cheikh Anta Diop (16,22), Route de Ouakam (16,56), Stade municipal de Ouakam (18,04), Mamelles (19,46), Corniche Ouest (20,01), Route de l’Aéroport (22,99), Virage (24,35).
- **Ligne 219 / OID 8**, de « Terminus Daroukhane » (0,00 km) à « Arret Ouakam » (20,77 km). Repères intermédiaires : Stade de Ndiarème (0,68), Terminus DDD Guédiawaye (2,35), Rond Point Marché Jeudi (4,52), Case ba (8,82), Rond Point 6 (13,47), Liberté 6 (13,96), 2 voies Sacré Cœur (14,62), Ancienne Piste (15,79), Avenue Cheikh Anta Diop (17,26), Ouakam (18,00), Marché Ouakam (20,19).

Ce chainage provient de l'ordre des segments de la polyligne ArcGIS et de la projection des points dessus. Il vérifie la cohérence des deux blocs, mais les libellés génériques ArcGIS ne sont pas automatiquement assimilés aux 19 repères commerciaux DDD.

Moovit confirme une ligne 219 distincte avec deux directions (83 arrêts Daroukhane → Ouakam et 80 dans le sens opposé). Les extrémités sont cohérentes au niveau du corridor, mais ses listes très détaillées ne sont pas équivalentes aux 19 repères publiés par DDD.

**Décision :** signaler les 33 positions comme candidates de la ligne 219 dans le crosswalk, garder leurs deux copies et tous leurs IDs dans les données brutes, et ne pas réécrire le code source `ligne_218` ni le catalogue passager avant une validation opérateur/OSM complémentaire.

### Contradiction Moovit sur la ligne 218

Les pages Moovit consultées présentent la ligne 218 comme « Thiaroye – Aéroport », mais leur direction Aéroport part de « Terminus Rufisque » (69 arrêts) et leur direction Thiaroye termine également à « Terminus Rufisque » (67 arrêts). Ce terminus ne correspond pas au terminus Thiaroye publié par DDD ni au début de la géométrie ArcGIS OID 7 (« Dépôt Thiaroye »).

La ligne 217 Moovit présente également des terminus « Terminus Rufisque » / « Stade Municipal » ou « Rue Okm 282, 222 », qui ne correspondent pas littéralement au corridor officiel DDD Thiaroye ↔ Ouakam. Ces séquences Moovit ne doivent donc pas être utilisées pour remplacer les géométries et repères officiels sans vérification supplémentaire.

## 5. Ligne 228 — géométrie candidate non numérotée

La couche des arrêts contient 4 points sous le code `ligne_228`. La couche des itinéraires contient une polyligne OID 10 sans `Nom_Ligne`, dont les champs de corridor indiquent :
- « Terminus Rufisque – ville de Rufisque » ;
- « Bargny – Diamniadio Yenne ».

Sur les 4 points `ligne_228`, 3 sont à 25 m ou moins de cette polyligne et le quatrième à 85,5 m. La page DDD publie une ligne « Terminus Rufisque ↔ Yenne » avec quatre repères : Terminus Rufisque, Ville de Rufisque, Bargny et Diamniadio Yenne. Moovit publie deux directions distinctes de la ligne 228, 53 arrêts chacune, mais ses terminus sont « Toubab Dialaw » et « Terminus Rufisque ».

La polyligne OID 10 mesure 28,697 km et ses champs de corridor concordent avec les deux segments DDD Rufisque–ville de Rufisque et Bargny–Diamniadio Yenne. Les 4 points `ligne_228` sont à 85,5 m au plus de cette polyligne, dont 3 à 25 m ou moins. Les noms ArcGIS mentionnent « Gare Routière de Rufisque », « Mairie de Yène » et « Toubab Dialaw/Rufisque ».

La correspondance avec 228 est donc fortement plausible au niveau du corridor et des sources secondaires, mais deux limites subsistent : OID 10 n'a pas de numéro de ligne et le terminus DDD « Diamniadio Yenne » ne correspond pas littéralement au terminus Moovit/ArcGIS « Toubab Dialaw ». **Ne pas attribuer OID 10 à la ligne 228 automatiquement.** Il faut une clé opérateur ou une preuve indépendante qui résolve cette différence de terminus.

## 6. Ligne 13 — deux groupes à conserver séparément

La couche 0 contient :
- `LIgne_13` : 22 points ;
- `ligne_13` : 23 points.

Les deux groupes suivent la même géométrie de la ligne 13 ; chaque point du premier groupe trouve un point du second à 2,9 m au plus. Les deux groupes sont aussi proches de la polyligne ArcGIS. Cela indique probablement deux relevés/versions presque superposés, mais ne prouve pas qu'ils sont interchangeables.

**Décision :** conserver les deux graphies, les deux comptes et les identifiants d'origine ; aucune fusion.

## 7. Lignes 217 et 218 — contradiction des sources officielles et secondaires

29 des 30 points du groupe `ligne_217` sont à 25 m ou moins de la géométrie de la ligne 217. Le point source `OBJECTID 124`, nommé « Terminus 2017 2018 », est à 62,2 m. Il reste un candidat à vérifier, pas une raison de déplacer automatiquement le point.

### Géométries ArcGIS distinctes

- Ligne 217 / OID 6 : 23,879 km ; 30 points source, dont 29 à 25 m ou moins.
- Ligne 218 / OID 7 : 25,598 km ; 37 points source identifiés dans le groupe mélangé `ligne_218`, tous à 25 m ou moins.
- Les deux polylignes partagent un corridor (distance minimale 0 m), mais leurs extrémités ne sont pas identiques : une extrémité est séparée de 33,3 m et l'autre d'environ 1,56 km. Leur distance de Hausdorff est d'environ 2,97 km. Elles ne doivent donc pas être fusionnées.

### Contradiction de la page officielle DDD

La page officielle affiche des titres distincts :
- ligne 217 : Thiaroye ↔ Ouakam ;
- ligne 218 : Thiaroye ↔ Aéroport LSS.

Cependant, la liste des 15 repères publiée sous ces deux titres est identique, et les deux listes se terminent par « Terminus aéroport LSS ». La séquence de la ligne 217 est donc contradictoire avec son propre titre de terminus. C'est une incohérence de la source DDD à faire confirmer par l'opérateur, pas une raison de modifier la géométrie.

### Contradiction Moovit

- Moovit 217 affiche des extrémités « Rue Okm 282, 222 » / « Stade Municipal » et « Terminus Rufisque » selon le sens.
- Moovit 218 affiche « Terminus Rufisque » → « Aeroport » et le retour « Aeroport » → « Terminus Rufisque ».
- Ces terminus ne concordent pas littéralement avec les terminus DDD Thiaroye / Ouakam / Aéroport ni avec les points ArcGIS « Dépôt Thiaroye » et « Terminus Aéroport L.S.S ».

**Décision :** pour 217/218, conserver séparément les deux géométries ArcGIS et les séquences DDD publiées, marquer le conflit de terminus/sequence, et ne pas importer les séquences Moovit comme correction. Il faut une confirmation DDD ou une preuve OSM directionnelle fiable pour trancher.

## 8. Couverture OSM et limites de la validation

L'audit OSM directionnel antérieur n'a pas identifié de relation OSM directionnelle dédiée exploitable pour les lignes 218 et 219. Il ne faut donc pas présenter OSM comme ayant confirmé l'attribution des 33 points. La validation actuelle repose sur la convergence ArcGIS géométrique + séquences officielles DDD + contrôle directionnel Moovit pour 219, avec les limites indiquées ci-dessus.

Aucun rapprochement de proximité ne suffit à lui seul à prouver le sens de circulation, l'ordre commercial exact ou l'état actuel d'une ligne. Les lignes 218/219 restent candidates à validation finale de l'attribution source, et la ligne 228 reste sans numéro explicite dans la couche géométrique.

## 9. Fichiers et sources

Artefacts CI :
- `ddd-arcgis-2024-source-extract` : JSON ArcGIS bruts, GeoJSON arrêts/routes et métadonnées.
- `ddd-arcgis-stop-route-crosswalk` : CSV arrêt→géométrie, chainage, distances et rapport JSON des anomalies.

Sources publiques :
- DDD, réseau urbain : https://demdikk.sn/reseau-urbain-dakar/
- DDD, info voyageurs : https://demdikk.sn/info-voyageurs/
- ArcGIS arrêts, couche 0 : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0
- ArcGIS itinéraires, couche 1 : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/1
- Moovit 219 Daroukhane → Ouakam : https://moovitapp.com/index/fr/transport_en_commun-line-219-Dakar-5996-1618037-18051501-1
- Moovit 219 Ouakam → Daroukhane : https://moovitapp.com/index/fr/transport_en_commun-line-219-Dakar-5996-1618037-18051501-0
- Moovit 218 Aéroport : https://moovitapp.com/index/fr/transport_en_commun-line-218-Dakar-5996-1618037-18051488-0
- Moovit 218 Thiaroye : https://moovitapp.com/index/fr/transport_en_commun-line-218-Dakar-5996-1618037-18051488-1
- Moovit 217 Ouakam : https://moovitapp.com/index/fr/transport_en_commun-line-217-Dakar-5996-1618037-18051502-0
- Moovit 217 Thiaroye : https://moovitapp.com/index/fr/transport_en_commun-line-217-Dakar-5996-1618037-18051502-1
- Audit OSM directionnel antérieur : `docs/osm-dakar-directional-pairs-2026-11-13.md`

## Décision finale de cet audit

- Extraire et conserver toutes les géométries et IDs ArcGIS : terminé.
- Produire le crosswalk métrique des 777 arrêts : terminé.
- Identifier le mélange 218/219 et les doublons : terminé comme constat de source, attribution candidate seulement.
- Identifier la géométrie Rufisque–Yenne sans numéro, candidate 228 : terminé comme constat, sans réattribution.
- Résoudre définitivement les terminus Palais 1 / Palais 2 / Palais de Justice : non résolu.
- Obtenir une relation OSM dédiée et fiable pour 218/219 : non résolu dans les sources OSM extraites.
- Modifier les parcours passagers ou déployer une correction : non autorisé par cet audit et non effectué.
