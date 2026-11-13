# Audit des données OpenStreetMap de Dakar — 13 novembre 2026

## Décision de périmètre

OSM est utilisé sans GTFS CETUD comme source géographique communautaire complémentaire :
- routes et géométries de voirie pour confronter les corridors ;
- arrêts/quais candidats et leurs coordonnées ;
- relations `type=route + route=bus` pour rechercher des séquences et des variantes Aller/Retour lorsqu'elles sont réellement renseignées ;
- relations `type=route_master` pour relier les variantes d'une même ligne ;
- métadonnées OSM (type, identifiant, version, date de modification, tags) conservées pour chaque objet.

OSM ne prouve pas à lui seul qu'une ligne ou une fréquence est officiellement exploitée. Il ne remplace pas les fiches DDD/AFTU/TATA et ne sert jamais à inventer des fréquences. Les données restent des candidats jusqu'au recoupement avec une source d'opérateur/CETUD.

## État de départ connu

Le chantier OSM précédent a signalé un ensemble de **1 169 objets/arrêts candidats**, dont **36 seulement avec géolocalisation exploitable** dans le fichier examiné à l'époque. Ce ratio doit être recalculé sur une extraction OSM fraîche : il ne constitue pas un comptage certifié de l'état actuel de la base OSM.

Points de contrôle à conserver :
- noms d'arrêts ambigus ;
- coordonnées absentes ou non rattachées au bon objet ;
- objets dupliqués techniquement ;
- quais opposés qui peuvent être deux arrêts distincts ;
- nœuds de quai et positions d'arrêt qui décrivent parfois le même arrêt physique, sans être le même objet OSM ;
- relations de lignes incomplètes, avec des membres sans rôle ou un seul sens cartographié.

## Lecture du pipeline présent dans le dépôt

Le script `scripts/import_dakar_osm_geofabrik.mjs` télécharge l'extrait Geofabrik Sénégal–Gambie, découpe la bbox Dakar `-17.56,14.55,-17.12,14.91`, puis filtre :
- `highway=bus_stop` ;
- `public_transport=platform` ;
- `amenity=bus_station` ;
- nœuds `public_transport=stop_position` ou `station` avec `bus=yes`.

Il dédoublonne les objets par identité OSM stable (`type:id`) avant d'envoyer les candidats au service `dakar-bus-osm-stops-sync`. Le rafraîchissement de correspondances est séparé et le script indique que le catalogue canonique et les horaires ne sont pas modifiés.

### Limites techniques relevées avant toute nouvelle exécution

1. **Les relations de lignes ne sont pas extraites.** Le filtre actuel ne récupère pas les relations `route=bus` / `route_master=bus`. Il ne peut donc pas reconstituer à lui seul l'ordre des arrêts Aller/Retour.
2. **Les `stop_position` sans `bus=yes` sont ignorés.** Ils ne doivent pas être ajoutés aveuglément, mais doivent être examinés via leurs tags et leurs relations membres afin d'éviter de perdre des données pertinentes.
3. **Coordonnée représentative des objets `way` :** le collecteur a été corrigé. Pour un polygone fermé, il calcule le centroïde surfacique dans une projection locale ; pour un way ouvert, il prend le point situé à mi-longueur du tracé. La géométrie complète reste conservée. Ce point reste un repère géométrique candidat, pas une preuve de position exacte de montée voyageurs.
4. **Le dédoublonnage par `type:id` ne dédoublonne que les répétitions techniques du même objet OSM.** Il ne fusionne pas les nœuds, ways et relations distincts, ce qui est souhaitable à ce stade.
5. **Les objets OSM ne sont pas regroupés en arrêt physique.** Une plateforme, un stop_position et un stop_area doivent être liés par les relations OSM et la proximité, puis soumis à contrôle ; la proximité seule ne suffit pas.
6. **Le pipeline écrit dans Supabase.** Le script vise un projet Supabase codé en dur et un endpoint distant `dakar-bus-osm-stops-sync`. L'endpoint et le projet doivent être vérifiés contre la configuration officielle actuelle avant toute exécution. Aucune importation ni écriture Supabase n'est lancée dans le cadre de cet audit.

## Méthode de consolidation à appliquer

1. Refaire une extraction OSM fraîche de la zone Dakar et conserver le PBF brut daté et son empreinte.
2. Produire quatre inventaires distincts : arrêts/quais, positions d'arrêt, stations/gares, relations de lignes.
3. Pour chaque objet, conserver l'identifiant OSM, le type, la version, le timestamp, tous les tags et la géométrie source.
4. Détecter séparément :
   - répétitions du même `type:id` ;
   - candidats au même arrêt physique ;
   - quais opposés ;
   - objets sans coordonnées ;
   - objets sans nom ;
   - objets dont les coordonnées sont hors de Dakar.
5. Lire les relations de bus dans leur ordre de membres et par rôle (`platform`, `stop`, `stop_entry_only`, `stop_exit_only`, `forward`, `backward`, etc.). Une relation par sens/variante est attendue dans le modèle OSM ; si un seul sens est présent, le retour reste manquant.
6. Relier les `route` à leurs `route_master` lorsque disponibles. Comparer les références, opérateurs, réseaux, terminus et membres aux fiches officielles.
7. Attribuer un statut à chaque donnée : `OSM_RAW`, `OSM_CANDIDATE`, `MATCHED_OFFICIAL_SOURCE`, `CONFLICTING_SOURCES`, `MISSING_GEOMETRY`, `MISSING_DIRECTION`. Aucune validation automatique sur le seul nom ou la seule proximité.
8. N'utiliser les points et tracés OSM que pour compléter une séquence si l'identité de la ligne, le sens et l'ordre sont corroborés. Ne jamais dériver une fréquence à partir d'OSM.

## Références de méthode

- [OpenStreetMap — schéma bus](https://wiki.openstreetmap.org/wiki/FR:Bus) : distinction plateforme/quai et position d'arrêt ; attention aux doublons d'objets qui décrivent le même arrêt.
- [OpenStreetMap — bus et relations](https://wiki.openstreetmap.org/wiki/Buses) : relations `route=bus` distinctes par direction/variante et `route_master` pour les regrouper.
- [OSM Inspector — arrêts et plateformes](https://tools.geofabrik.de/osmi/?view=pubtrans_stops) : couches séparées pour stop_position, plateformes et arrêts classiques.
- [Geofabrik — extrait Sénégal et Gambie](https://download.geofabrik.de/africa/senegal-and-gambia-latest.osm.pbf) : extrait source utilisé par le pipeline du dépôt.

Attribution : © les contributeurs OpenStreetMap, données sous licence ODbL.


## Extraction des relations de lignes — ajout du 13 novembre 2026

Un second outil, distinct de l'import des arrêts, récupère en lecture seule les relations OSM de bus et les relations maîtres dans l'emprise de Dakar. Il interroge l'API publique OSM Public Transport → GeoJSON avec les termes Dakar, AFTU, Dem Dikk et TATA, récupère les relations directionnelles et conserve l'ordre des arrêts, les coordonnées, les identifiants de relations et la géométrie disponible.

Le workflow manuel `.github/workflows/audit-dakar-osm-routes.yml` dépose un fichier JSON téléchargeable en artefact GitHub Actions. Il n'écrit ni dans Supabase ni dans le catalogue passager. Les deux directions sont récupérées depuis les relations séparées lorsqu'elles existent ; aucune direction inverse n'est fabriquée. Les recherches tronquées et les erreurs sont conservées dans le rapport.

API et documentation :
- [API OSM Public Transport → GeoJSON](https://openstreetmap.tools/public_transport_geojson/docs) — recherche de relations, détails ordonnés des arrêts et relations maîtres.
- Les résultats restent des candidats cartographiques à rapprocher des fiches DDD/AFTU/TATA ; les fréquences ne sont jamais déduites d'OSM.

Le workflow d'import géographique existant est également rendu strictement manuel : il ne s'exécute plus quotidiennement ni sur chaque push. Cela évite qu'une extraction OSM déclenche une écriture Supabase sans revue préalable.


## Sources cartographiques DDD — extraction ArcGIS en lecture seule

La recherche a révélé deux FeatureServer publics décrivant des couches DDD :
- `Ligne_inter_urbain` : couches de tracés et d'arrêts pour plusieurs lignes urbaines ;
- `Itinéraire_ligne_de_Banlieue_Dakar_Dem_Dikk` : tracés de lignes de banlieue, dont 217, 218, 219 et 227.

Le script `scripts/export_ddd_arcgis_layers.mjs` récupère les métadonnées, attributs, géométries et dates de mise à jour des couches listées. Le workflow `.github/workflows/audit-ddd-arcgis.yml` produit un artefact JSON pour revue. Les couches cartographiques anciennes (certaines mises à jour en 2017) restent utilisables comme références historiques à comparer aux pages DDD actuelles ; elles ne prouvent pas seules qu'une ligne circule encore aujourd'hui et ne fournissent pas de fréquence.

Les tracés géographiques peuvent aider à contrôler les conflits de terminus et les correspondances entre arrêts textuels et coordonnées. Aucun horaire ni compte à rebours n'est déduit de ces géométries.


## Qualité des coordonnées OSM — correction du 13 novembre 2026

Le collecteur des relations OSM ne prend plus la moyenne arithmétique des sommets pour représenter un membre `way`. Il conserve tous les sommets et calcule un point représentatif géométrique : centroïde surfacique pour les ways fermés, point à mi-longueur pour les ways ouverts. Les membres `node` gardent leurs coordonnées natives. Ces points servent au rapprochement cartographique, sans remplacer les coordonnées d'un arrêt vérifié.


## Contrôle de périmètre géographique des relations OSM — 13 novembre 2026

La première extraction a retourné 25 relations de bus, mais l'ensemble brut contenait aussi deux relations APSRTC dont les terminus indiqués sont Vijayawada et Hyderabad, hors du réseau dakarois. Le collecteur classe désormais chaque relation en trois catégories sans supprimer les objets bruts : `DAKAR_CANDIDATE` (indices géographiques ou opérateur/réseau local), `OUTSIDE_DAKAR_SCOPE` (terminus explicitement hors zone et sans indice local), et `SCOPE_UNCONFIRMED` (preuves insuffisantes). Les compteurs bruts restent disponibles pour audit ; les statistiques dakaroises doivent être calculées sur les candidates, sans considérer les relations non confirmées comme des lignes locales.

## Contradictions entre métadonnées et géométrie — contrôle renforcé

L'extraction fraîche a révélé deux relations APSRTC dont les terminus déclarés sont Vijayawada et Hyderabad, alors que plusieurs géométries de membres se trouvent dans Dakar. La seule présence de coordonnées dans la bbox ne suffit donc pas à classer une relation comme dakaroise. Le collecteur attribue désormais le statut `SCOPE_CONFLICT` à ce type de contradiction, conserve les objets bruts et les exclut du compteur des candidates locales. Les relations dont les terminus sont explicitement extérieurs sans géométrie locale sont classées `OUTSIDE_DAKAR_SCOPE`. Elles restent consultables pour audit, sans être supprimées.


## Résultat de l'extraction OSM fraîche — 13 novembre 2026, 07:00 UTC

L'exécution du workflow de lecture seule a abouti et a produit un artefact JSON. Résumé vérifié dans cet artefact :
- 27 éléments OSM bruts : 25 relations `route=bus` et 2 relations `route_master=bus` ;
- 23 relations classées `DAKAR_CANDIDATE` ;
- 2 relations classées `SCOPE_CONFLICT`, toutes deux APSRTC (relations 10123245 et 10123246), terminus déclarés Vijayawada ↔ Hyderabad malgré des géométries locales ;
- 18 relations avec des membres d'arrêts ordonnés, soit 522 occurrences d'arrêts ;
- 7 relations sans membre d'arrêt exploitable ;
- aucune relation dans les catégories `SCOPE_UNCONFIRMED` ou `OUTSIDE_DAKAR_SCOPE` pour cette extraction.

Le collecteur a dû abandonner une première tentative sur l'endpoint Overpass principal après un délai d'attente, puis l'extraction a abouti via le mécanisme de reprise. L'artefact conserve cet incident dans `endpointErrors`. Le résultat est donc exploitable pour la revue, mais les compteurs doivent rester attachés à la date de l'extraction et ne pas être présentés comme un inventaire exhaustif permanent d'OSM.

Quelques relations illustrent les limites à traiter avant rapprochement automatique :
- DDD : les relations 6951328 (ligne 1), 6990669 / 7500475 (ligne 7), 6990830 / 7203970 (ligne 4), 6990845 / 7488283 (ligne 10) et 6996431 / 7487218 (ligne 9) proposent des variantes directionnelles ou des séquences à comparer aux fiches DDD ;
- la relation 6990794 (réf. 121) et la relation 6999013 (réf. 121) ont des volumes d'arrêts très différents (27 contre 7) et ne doivent pas être fusionnées sur le seul numéro ;
- la relation 7499433 porte la référence « 6 » mais le nom « 7 Palais 1 → Parcelles-Assainies » : elle est conservée comme conflit de métadonnées, sans servir à valider la ligne 6 ou 7 ;
- la relation 7108131 est étiquetée comme un arrêt « Cité Soprim » mais contient 47 membres d'arrêt et des références L23/L5 ; son rôle de relation d'arrêt/route maître doit être examiné avant tout usage comme séquence de ligne.

Ces cas confirment la règle : une relation OSM est une preuve cartographique candidate, pas une validation de l'identité de ligne. Les séquences restent isolées jusqu'au rapprochement des terminus, de l'opérateur, des rôles de membres et de la séquence officielle. Aucun sens retour, horaire ou intervalle n'est déduit automatiquement.


## Recoupement spatial OSM ↔ arrêts ArcGIS DDD — extraction du 13 novembre 2026

Un outil reproductible a été ajouté : `scripts/compare_ddd_osm_arcgis_stops.mjs`. Il prend les deux artefacts JSON (relations OSM et couches ArcGIS DDD), associe uniquement les références de lignes sans ambiguïté aux couches d'arrêts DDD correspondantes, puis calcule pour chaque arrêt OSM la distance au point ArcGIS le plus proche. Il ne fusionne aucun arrêt et ne modifie aucune donnée passager.

Commande après téléchargement et décompression des deux artefacts :

```bash
npm run audit:ddd-osm-crosscheck -- dakar-osm-route-candidates.json ddd-route-stop-candidates.json ddd-osm-arcgis-crosscheck.json
```

Résultat calculé sur les extractions OSM du 13/11/2026 à 07:00:07 UTC et ArcGIS du 13/11/2026 à 06:57:10 UTC : **16 relations comparables**, **374 positions d'arrêts OSM comparées**, dont **230 ont un point ArcGIS le plus proche à 50 m ou moins** et **282 à 100 m ou moins**. Ce sont des rapprochements de proximité « plus proche voisin » : plusieurs arrêts OSM peuvent pointer vers le même point ArcGIS. Ces chiffres ne sont donc pas des correspondances uniques et ne constituent pas une validation de parcours.

| Ligne DDD | Relation OSM | Arrêts OSM | Arrêts ArcGIS | Plus proche à ≤50 m | Plus proche à ≤100 m |
|---|---:|---:|---:|---:|---:|
| 1 | 6951328 | 38 | 44 | 35 | 36 |
| 4 | 6990830 | 34 | 30 | 6 | 14 |
| 4 | 7203970 | 32 | 30 | 24 | 24 |
| 6 | 7499433 | 1 | 60 | 0 | 0 |
| 7 | 6990669 | 31 | 33 | 10 | 17 |
| 7 | 7500475 | 34 | 33 | 30 | 31 |
| 8 | 7495137 | 0 | 49 | 0 | 0 |
| 9 | 6996431 | 32 | 36 | 15 | 23 |
| 9 | 7487218 | 29 | 36 | 27 | 28 |
| 10 | 6990845 | 30 | 26 | 10 | 21 |
| 10 | 7488283 | 25 | 26 | 20 | 22 |
| 18 | 7499475 | 0 | 44 | 0 | 0 |
| 23 | 7495279 | 51 | 56 | 22 | 32 |
| 121 | 2792903 | 3 | 31 | 3 | 3 |
| 121 | 6990794 | 27 | 31 | 24 | 26 |
| 121 | 6999013 | 7 | 31 | 4 | 5 |

### Anomalies et décisions de revue

- **Ligne 1 :** correspondance spatiale forte entre la relation OSM et la couche d'arrêts ArcGIS. Les noms, l'ordre exact et l'actualité de chaque arrêt doivent encore être contrôlés ; cela ne prouve pas le retour.
- **Ligne 7 :** la relation 7500475 (Ouakam → Palais 1) correspond spatialement à 30/34 points dans un rayon de 50 m. La relation 6990669 (Palais → Ouakam) n'en rapproche que 10/31 à 50 m. Conserver les deux séquences séparées ; vérifier si la relation 6990669 représente une variante, une ancienne cartographie ou un tracé divergent.
- **Ligne 4 :** forte asymétrie : 24/32 points proches pour 7203970, mais seulement 6/34 pour 6990830. Ne pas considérer automatiquement ces deux relations comme des sens opposés du même parcours sans examiner les tracés et les arrêts éloignés.
- **Ligne 9 :** rapprochement plutôt fort pour 7487218 (27/29 à 50 m), plus faible pour 6996431 (15/32). Garder les deux relations candidates et vérifier les variantes.
- **Ligne 10 :** rapprochement partiel pour les deux relations ; 7488283 est plus proche de la couche ArcGIS que 6990845. La différence doit être examinée, pas effacée.
- **Ligne 121 :** trois relations sont trouvées, avec 3, 27 et 7 arrêts. Les terminus et les séquences divergent ; elles ne doivent pas être agrégées sur le seul numéro 121.
- **Ligne 23 :** la relation 7495279 compte 51 arrêts ordonnés, mais seulement 22/51 points à 50 m de la couche ArcGIS. Une autre relation 7108131 porte la référence combinée `L23;L5` et 47 arrêts ; elle est signalée comme référence multiple ambiguë et n'est pas rapprochée automatiquement.
- **Ligne 6 :** la relation 7499433 porte la référence « 6 » mais son nom indique « 7 Palais 1 → Parcelles-Assainies » ; elle ne présente qu'un seul arrêt ordonné, éloigné de la couche 6 (211 m). Elle reste un conflit de métadonnées.
- **Lignes 8 et 18 :** les relations 7495137 et 7499475 n'ont aucun arrêt ordonné exploitable malgré l'existence de couches ArcGIS de 49 et 44 arrêts.
- **Références non rapprochées automatiquement :** 36, 40, les relations sans référence et B1 sont conservées dans `unmatchedCandidateRoutes`. La relation multi-référence `L23;L5` y est explicitement signalée, pas répartie artificiellement entre deux lignes.

La couche ArcGIS DDD est une source géographique historique ; ses points et les relations OSM sont des preuves complémentaires. Les statuts de qualification restent donc candidats ou partiellement corroborés. Aucune séquence n'est marquée `verified` sur la seule base de ces distances, aucun retour n'est généré par inversion, et aucune fréquence n'est déduite de la géographie.

## Nouvelle extraction OSM de confirmation — 13 novembre 2026, 08:10 UTC

Une nouvelle exécution du workflow a récupéré le même jeu de 27 éléments (25 relations de lignes et 2 relations maîtres), sans erreur d'endpoint. Le contrôle de périmètre confirme :
- 23 relations `DAKAR_CANDIDATE` ;
- 2 relations `SCOPE_CONFLICT` (APSRTC 10123245 et 10123246), conservées dans les données brutes mais exclues des candidates locales ;
- 18 relations avec 522 occurrences d'arrêts ordonnés ; 7 relations sans arrêt ordonné ;
- mêmes identifiants de relations et mêmes volumes d'arrêts que l'extraction précédente de 06:30 UTC.

Le recoupement reproductible avec l'artefact ArcGIS DDD donne à nouveau 16 relations comparables, 374 positions OSM comparées, 230 plus proches voisins à 50 m ou moins et 282 à 100 m ou moins. La stabilité des chiffres confirme la reproductibilité de cette extraction, pas l'actualité ni la validation des parcours.

### Cas AFTU ligne 40

La fiche officielle AFTU de la ligne 40, publiée le 29 juin 2026, décrit le corridor Grand Mbao → Route nationale 1 → Fass Mbao → Poste Thiaroye → Yarakh → Cafétéria → Maristes → Échangeur Hann → Autoroute → Colobane → Petersen ([fiche officielle AFTU ligne 40](https://aftu-senegal.org/map/dakar-urbain-ligne-40/)).

OSM contient la relation 3982642 avec les tags `ref=40`, `operator=Aftu` et `network=Tata`. Elle comporte 35 membres de type way et 305 sommets géométriques, mais **aucun arrêt ordonné**, aucun terminus `from/to` et aucun sens renseigné. La référence, l'opérateur et le réseau concordent avec la fiche officielle ; la séquence d'arrêts et la couverture complète de la géométrie ne sont pas confirmées. La relation reste donc un candidat de corridor, jamais une séquence utilisable pour l'affichage passager.

La relation OSM 1434825 (« ligne 36 ») n'a pas d'opérateur identifié et ne comporte aucun arrêt ordonné ; elle ne peut pas être rattachée à une fiche AFTU par le seul numéro. Les deux relations B1 continuent de contenir 50 occurrences d'arrêts par sens ; elles restent hors de toute modification des données ou horaires BRT déjà validés.

Artefact de cette extraction : `dakar-osm-route-candidates.zip`, généré le 13/11/2026 à 08:10:05 UTC. Attribution : © OpenStreetMap contributors, ODbL.

### Vérification complémentaire des fiches AFTU 36 et 40

Les deux fiches officielles AFTU retrouvées dans l'extraction sont comparées aux relations OSM de même référence :

| Ligne | Fiche officielle AFTU | Relation OSM candidate | Constat |
|---|---|---|---|
| 36 | Marché Ndiarème → Parc Lambaye → quartier Cheikh Wade → 2 voies Notaire → Dial Mbaye → Cité des Enseignants → Bethio → Golf → Case-Ba → Parcelles → Yoff Village → Aéroport → Ngor | 1434825, « ligne 36 » | Relation sans membre exploitable ni opérateur ; aucun sens, aucun arrêt et aucune géométrie de parcours permettant de corroborer la fiche. La simple référence 36 ne suffit pas au rapprochement. |
| 40 | Grand Mbao → RN1 → Fass Mbao → Poste Thiaroye → Yarakh → Cafétéria → Maristes → échangeur Hann → autoroute → Colobane → Petersen | 3982642, « Ligne 40 », operator=Aftu, network=Tata | Identité de ligne et corridor compatibles au niveau des tags et du contexte, mais 35 ways géométriques sans arrêt ordonné ni terminus/sens OSM. Candidat de corridor uniquement ; aucun ordre d'arrêts passager ne peut en être tiré. |

Les fiches officielles AFTU consultées sont [ligne 36](https://aftu-senegal.org/map/dakar-urbain-ligne-36/) et [ligne 40](https://aftu-senegal.org/map/dakar-urbain-ligne-40/). Elles décrivent chacune un seul corridor publié et ne donnent pas une séquence indépendante complète pour le retour. Les deux lignes restent donc en revue documentaire, sans fréquence ni compte à rebours ajouté.


### Relations directionnelles DDD : lignes 4, 7, 9 et 10

Le contrôle de l'extraction OSM fraîche confirme plusieurs paires de relations DDD avec terminus inversés. Il s'agit d'un progrès pour identifier les deux sens sans inverser artificiellement une seule liste :

| Ligne | Sens 1 (relation OSM) | Sens 2 (relation OSM) | Membres d'arrêts ordonnés | Qualification |
|---|---|---|---:|---|
| 4 | Leclerc → Liberté 5 (6990830) | Liberté 5 → Leclerc (7203970) | 34 / 32 | Paire directionnelle candidate ; correspondance spatiale très asymétrique avec les couches ArcGIS historiques (6/34 contre 24/32 à ≤50 m). |
| 7 | Palais → Ouakam (6990669) | Ouakam → Palais 1 (7500475) | 31 / 34 | Paire directionnelle candidate ; les deux relations sont aussi membres de la relation maître OSM 7500597 (« Ligne 7 »). La proximité ArcGIS est très différente (10/31 contre 30/34 à ≤50 m). |
| 9 | Palais 1 → Liberté 6 (6996431) | Liberté 6 → Palais 1 (7487218) | 32 / 29 | Paire directionnelle candidate ; proximité ArcGIS plus forte pour la seconde relation (15/32 contre 27/29 à ≤50 m). |
| 10 | Palais 1 → Liberté 5 (6990845) | Liberté 5 → Palais 1 (7488283) | 30 / 25 | Paire directionnelle candidate ; rapprochement ArcGIS partiel (10/30 contre 20/25 à ≤50 m). |

La ligne 1 (relation 6951328, Parcelles assainies → Leclerc, 38 membres d'arrêts ordonnés) n'a qu'une relation directionnelle identifiée dans cet extrait. La ligne 121 reste ambiguë : les relations 2792903, 6990794 et 6999013 ne forment pas une paire propre sur le seul numéro, et leurs terminus/volumes divergent.

**Ce que cela permet :** conserver séparément les deux ordres de membres OSM des lignes 4, 7, 9 et 10 comme candidats de sens, avec leurs identifiants de relation et leurs terminus. **Ce que cela ne permet pas encore :** déclarer les arrêts validés, les afficher comme parcours voyageurs, ni attribuer une fréquence. Les membres sont surtout des plateformes OSM sans nom ; les écarts de rapprochement avec l'ArcGIS historique imposent une revue des coordonnées, des noms d'arrêts et des divergences de tracé avant toute promotion.

Les deux directions B1 restent intactes. Aucune donnée TER/BRT, aucun catalogue passager et aucune donnée Supabase n'ont été modifiés par ce rapprochement.
