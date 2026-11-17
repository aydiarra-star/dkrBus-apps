# État du branchement du calculateur sur les géométries réelles

Date : 17 novembre 2026

## Changements du 17 novembre

Le calculateur ne mesure plus les trajets de véhicule par la somme de distances Haversine entre centres d'arrêts.

- TER : la distance de chaque segment est mesurée sur la géométrie ferroviaire OSM conservée dans `data/ter/ter-dakar-aibd.geojson`, tronquée au point de séparation de phase 1 pour respecter le périmètre de référence Dakar ↔ Diamniadio (AIBD/phase 2 exclu). Le retour utilise la même emprise ferroviaire dans l'ordre inverse.
- BRT B1 : la géométrie directionnelle est choisie parmi les deux relations OSM B1 conservées dans `data/brt/brt-b1-osm.geojson`, en comparant les terminus de la séquence demandée aux extrémités de la relation.
- DDD, AFTU et TATA : aucune géométrie directionnelle complète avec arrêts/quais raccordés n'est encore branchée dans le moteur. Ces lignes ne sont donc pas embarquées par le calculateur tant que leurs formes ne sont pas construites et contrôlées.
- BRT autres services / lignes : aucune géométrie de ligne propre et contrôlée n'est encore enregistrée dans le registre du calculateur ; ne pas leur attribuer la géométrie B1 par supposition.

## Accès, sortie et correspondances à pied

Les distances Haversine d'accès/sortie et les distances de correspondance positives ne sont plus utilisées pour fabriquer une marche. En l'absence du graphe piéton, le calculateur accepte seulement un départ et une arrivée sélectionnés comme arrêts exacts du référentiel, et seulement les transferts de distance nulle explicitement déclarés dans un même pôle.

Les trajets entre points libres, les marches d'accès/sortie et les correspondances piétonnes positives sont refusés plutôt que dessinés en ligne droite. Les anciennes distances de correspondance déclarées (par exemple TER ↔ BRT à Dakar/Colobane) restent des informations historiques du référentiel mais ne sont pas considérées comme un chemin piéton vérifié.

## Suite nécessaire

1. Extraire un graphe piéton OSM continu : ways `highway` autorisant la marche, passages, ponts, tunnels, accès piétons, sens et interdictions.
2. Connecter les points d'entrée/sortie des arrêts aux nœuds de ce graphe sans créer de raccourci à travers les bâtiments, autoroutes, voies ferrées ou l'eau.
3. Raccorder les arrêts BRT/TER aux quais réels et tester les distances projetées sur les géométries.
4. Construire les formes directionnelles DDD à partir des géométries ArcGIS historiques, des relations OSM et de séquences d'arrêts opérateur ; l'ancienneté et les conflits de sources doivent rester explicites.
5. Construire les formes AFTU/TATA en géocodant les séquences de rues/repères publiées puis en les faisant correspondre aux voies OSM dans le bon ordre. Une simple route routière entre deux centres de quartier n'est pas une ligne AFTU/TATA.
6. Valider les deux sens, les arrêts/quais, la continuité géométrique, les distances et les tests d'absence de saut.
7. Réactiver chaque ligne séparément après revue de sa provenance et de ses deux sens.

## Limites et protection des données validées

Ce déploiement de code ne modifie aucune fréquence, aucun horaire de référence TER/BRT, aucune donnée de service, aucun compte ou donnée usager. Les sources OSM restent attribuées © OpenStreetMap contributors, licence ODbL. Les géométries OSM BRT/TER sont des références cartographiques communautaires, pas des attestations officielles de l'opérateur. Le périmètre TER du calculateur reste celui de la phase 1 Dakar–Diamniadio ; la phase 2 AIBD n'est pas activée.
