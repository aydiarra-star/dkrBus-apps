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
3. **Le centre des objets de type way est calculé par moyenne des sommets.** Pour les plateformes surfaciques, ce n'est pas nécessairement le centroïde géométrique. Il faut conserver la géométrie d'origine et calculer un point représentatif avec une méthode géométrique correcte.
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
