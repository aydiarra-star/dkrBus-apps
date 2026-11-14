# Candidats d'arrêts OSM autour des géométries DDD — lignes 8 et 18

Date : 13 novembre 2026.

## Méthode

Le jeu OSM extrait contient des nœuds d'arrêts qui ne sont pas membres des relations de lignes. Le script `scripts/export_ddd_osm_way_stop_node_candidates.mjs` recherche, dans ce même jeu, les nœuds marqués comme arrêt/quai et portant un indice de réseau ou d'opérateur, puis mesure leur distance aux voies ordonnées de la relation OSM ciblée en UTM 28N.

Les candidats sont classés :
- `EXPLICIT_TARGET_LINE_REF` : le nœud porte explicitement la référence de la ligne ciblée ;
- `EXPLICIT_OTHER_LINE_REF` : le nœud porte une référence d'une autre ligne ;
- `SHARED_DDD_STOP_CANDIDATE` : le nœud est identifié DDD, mais sans référence de ligne.

Ce rapprochement est un inventaire de candidats spatiaux, pas une preuve de desserte. Les nœuds partagés peuvent servir plusieurs lignes et ne sont pas automatiquement ajoutés à une relation.

## Ligne 8 — relation OSM 7495137

- 80 voies OSM ordonnées ; 0 membre d'arrêt dans la relation.
- 309 nœuds d'arrêt avec indice de réseau/opérateur examinés dans l'extraction.
- 75 candidats à 100 m ou moins ; 65 à 25 m ou moins ; 67 à 50 m ou moins.
- 71 candidats partagés DDD sans référence de ligne ; 1 nœud explicitement référencé à une autre ligne ; 3 nœuds portant explicitement la référence L8/8.

### Trois nœuds avec référence explicite L8/8

| Nœud OSM | Nom | Tags de ligne | Distance à la géométrie |
|---:|---|---|---:|
| 5062287541 | Ligne 8 | ref=L8 ; stop_position ; from Aéroport de Dakar ; to Palais | 0,0 m |
| 5062287540 | Ligne 8 | ref=L8 ; stop_position ; from Palais ; to Aéroport de Dakar | 0,0 m |
| 1596282885 | Arrêt Echangeur Foire | ref=8 ; route_ref=8 ; highway=bus_stop | 27,8 m |

Les deux nœuds « Ligne 8 » sont des positions d'arrêt avec métadonnées de trajet, pas des noms d'arrêts voyageurs. Le nœud « Arrêt Echangeur Foire » est un vrai candidat d'arrêt explicitement référencé à la ligne 8.

Un autre nœud proche, 4697158010 « Tata », porte `route_ref=31` : il est classé comme référence d'une autre ligne et ne doit pas être attribué à la ligne 8.

Parmi les candidats partagés proches figurent notamment « Maire de Yoff », « Pharmacie de patte d'oie », « Auchan Castor », « UCAD », « Manguiers », « SAHM », « Medina », « Marché Tilène », « Hôpital Principal » et « Gare Palais 2 ». Ces noms sont utiles pour rechercher des correspondances avec la liste DDD, mais l'absence de référence L8 empêche de les confirmer comme arrêts de la ligne 8.

## Ligne 18 — relation OSM 7499475

- 54 voies OSM ordonnées ; 0 membre d'arrêt dans la relation.
- 309 nœuds d'arrêt avec indice de réseau/opérateur examinés dans l'extraction.
- 47 candidats à 100 m ou moins ; 36 à 25 m ou moins ; 40 à 50 m ou moins.
- 45 candidats partagés DDD sans référence de ligne ; 2 portent explicitement une référence de ligne différente ; 0 ne porte une référence explicite à la ligne 18.

Les deux références d'une autre ligne sont :
- Nœud 4363242542 « Arrêt Avenue Fahd Ben Abdel Aziz », `ref=Ligne 23`, à environ 19,0 m.
- Nœud 4323807985 « Arrêt Limite Khar YALLA », `ref=Ligne 23`, à environ 18,8 m.

Ils ne doivent pas être réaffectés à la ligne 18. La présence de nombreux quais DDD proches de la géométrie OSM ne suffit pas à reconstruire la séquence circulaire de la ligne 18, surtout puisque la géométrie OSM manque le segment centre-ville déjà identifié dans le rapport de revue.

## Exports et reproduction

Les fichiers CSV détaillés sont produits avec le script versionné :
- `ddd-line-8-osm-node-stop-candidates-2026-11-13.csv`
- `ddd-line-18-osm-node-stop-candidates-2026-11-13.csv`

Commande type :

```bash
node scripts/export_ddd_osm_way_stop_node_candidates.mjs \
  dakar-osm-route-candidates.json 7495137 ddd-line-8-osm-node-stop-candidates.csv 100
```

Le statut de toutes les lignes exportées reste `UNVERIFIED_NODE_CANDIDATE`. Aucun arrêt n'est ajouté automatiquement, aucune direction n'est inversée et aucune fréquence n'est déduite.
