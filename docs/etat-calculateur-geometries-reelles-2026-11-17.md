# État du branchement du calculateur sur les géométries réelles

Date : 17 novembre 2026

## État réel du branchement au 17 novembre

Les primitives de géométrie et de graphe routier ont été ajoutées et testées dans `src/domain/roadNetworkRouting.ts`, mais elles ne sont pas encore raccordées au moteur de production `src/domain/planner.ts`. Une première tentative de verrouillage du planner a provoqué 39 régressions frontend ; elle a été retirée pour préserver le fonctionnement existant. La PR reste en brouillon et n'est pas fusionnée.

- TER : la géométrie ferroviaire OSM phase 1 est disponible dans `data/ter/ter-dakar-aibd.geojson`, mais elle n'est pas encore utilisée pour mesurer les jambes du planner.
- BRT B1 : les deux géométries directionnelles OSM sont disponibles dans `data/brt/brt-b1-osm.geojson`, mais elles ne sont pas encore utilisées pour mesurer les jambes du planner.
- DDD : les géométries ArcGIS historiques sont candidates ; aucune direction n'est certifiée.
- AFTU/TATA : les séquences textuelles ne sont pas encore géolocalisées en ways routiers directionnels.
- Marche : l'extracteur du graphe piéton OSM est préparé, mais ses données ne sont pas encore reliées aux accès/quais ni au planner.

Le planner existant reste en place pendant que les géométries et les chemins piétons sont préparés. Il ne faut donc pas annoncer que le calculateur est déjà strictement basé sur les voies réelles.

## Accès, sortie et correspondances à pied

Les distances Haversine d'accès/sortie et les distances de correspondance positives ne sont plus utilisées pour fabriquer une marche. En l'absence du graphe piéton, le calculateur accepte seulement un départ et une arrivée sélectionnés comme arrêts exacts du référentiel, et seulement les transferts de distance nulle explicitement déclarés dans un même pôle.

Les trajets entre points libres, les marches d'accès/sortie et les correspondances piétonnes positives sont refusés plutôt que dessinés en ligne droite. Les anciennes distances de correspondance déclarées (par exemple TER ↔ BRT à Dakar/Colobane) restent des informations historiques du référentiel mais ne sont pas considérées comme un chemin piéton vérifié.

## Préparation du graphe piéton

Un extracteur read-only a été ajouté : `scripts/export_dakar_pedestrian_network.mjs`, avec son filtre/test `scripts/lib/pedestrianNetwork.mjs`. Il récupère les ways OSM piétonnes/voiries accessibles, conserve les nœuds OSM et leur géométrie segment par segment, filtre les accès piétons interdits et respecte les restrictions `oneway:foot`. La CI lance les tests et tente de produire un artefact candidat.

Cet artefact n'est pas encore branché au calculateur : les arrêts ne sont pas raccordés automatiquement à la voie la plus proche. Cette liaison doit passer par des entrées/quais réels et vérifiés.

## Suite nécessaire

1. Extraire et contrôler un graphe piéton OSM continu : ways `highway` autorisant la marche, passages, ponts, tunnels, accès piétons, sens et interdictions.
3. Connecter les points d'entrée/sortie des arrêts aux nœuds de ce graphe sans créer de raccourci à travers les bâtiments, autoroutes, voies ferrées ou l'eau.
4. Raccorder les arrêts BRT/TER aux quais réels et tester les distances projetées sur les géométries.
5. Construire les formes directionnelles DDD à partir des géométries ArcGIS historiques, des relations OSM et de séquences d'arrêts opérateur ; l'ancienneté et les conflits de sources doivent rester explicites.
6. Construire les formes AFTU/TATA en géocodant les séquences de rues/repères publiées puis en les faisant correspondre aux voies OSM dans le bon ordre. Une simple route routière entre deux centres de quartier n'est pas une ligne AFTU/TATA.
7. Valider les deux sens, les arrêts/quais, la continuité géométrique, les distances et les tests d'absence de saut.
8. Réactiver chaque ligne séparément après revue de sa provenance et de ses deux sens.

## Limites et protection des données validées

Ce déploiement de code ne modifie aucune fréquence, aucun horaire de référence TER/BRT, aucune donnée de service, aucun compte ou donnée usager. Les sources OSM restent attribuées © OpenStreetMap contributors, licence ODbL. Les géométries OSM BRT/TER sont des références cartographiques communautaires, pas des attestations officielles de l'opérateur. Le périmètre TER du calculateur reste celui de la phase 1 Dakar–Diamniadio ; la phase 2 AIBD n'est pas activée.
