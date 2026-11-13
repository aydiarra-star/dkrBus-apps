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
