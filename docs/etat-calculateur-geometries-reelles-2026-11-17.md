# État du branchement du calculateur sur les géométries réelles

Date : 17 novembre 2026

## État réel du branchement au 17 novembre

Les primitives de géométrie et de graphe routier sont testées dans `src/domain/roadNetworkRouting.ts`. Une intégration partielle et strictement filtrée a maintenant été ajoutée à `src/domain/planner.ts` : elle mesure certaines portions TER phase 1 et BRT B1 uniquement lorsqu'une géométrie directionnelle passe l'audit. Les autres lignes et les accès piétons ne sont pas encore raccordés au graphe réel. La PR reste en brouillon et n'est pas fusionnée.

- TER : la géométrie ferroviaire OSM de la phase 1 Dakar–Diamniadio est utilisée pour mesurer une portion véhicule uniquement si `auditTerPhaseOneGeometry()` passe. Le sens inverse et toute portion hors de la phase 1 ne sont pas certifiés par cette intégration.
- BRT B1 : seule la direction Préfecture de Guédiawaye → Petersen, dont l'audit passe, peut fournir une distance mesurée sur la géométrie. La direction inverse échoue encore au seuil de contrôle et n'est pas activée.
- DDD : les géométries ArcGIS historiques restent candidates ; aucune direction n'est certifiée dans le planner.
- AFTU/TATA : les séquences textuelles ne sont pas encore géolocalisées en ways routiers directionnels.
- Marche : les extracteurs Overpass/PBF et les tests de graphe existent, mais aucun accès/quai n'est raccordé de manière certifiée au planner.

Le planner existant reste en place avec cette intégration partielle. Pour toute portion sans géométrie directionnelle validée, le calcul historique Haversine demeure le repli ; il ne faut donc pas annoncer que le calculateur est déjà strictement basé sur les voies réelles.

## Contrôle métrique des géométries TER/BRT — audit du 17 novembre

Un audit automatisé supplémentaire est ajouté dans `src/domain/referenceRouteGeometry.ts` avec ses tests.

- **TER phase 1** : les 13 gares Dakar → Diamniadio se projettent sur la géométrie physique ferroviaire OSM, avec un écart maximal d'environ 11,4 m et un chainage strictement croissant. La coupe s'arrête à Diamniadio ; AIBD et la phase 2 ne sont pas incluses. Cette géométrie décrit l'alignement physique de la voie, pas un horaire ni une attestation officielle SETER.
- **BRT B1, Préfecture → Petersen** (relation OSM 19961937) : les 23 stations sont ordonnées et se projettent à moins d'un mètre au maximum.
- **BRT B1, Petersen → Préfecture** (relation OSM 19961993) : l'ordre est monotone, mais l'écart maximal atteint environ 93,4 m au terminus Préfecture, au-delà du seuil de contrôle de 80 m. Cette direction échoue donc à la validation et ne doit pas être activée avant vérification de l'accès/quai réel.

Ce contrôle est à la fois un audit et le garde-fou de l'intégration partielle du planner. La phase 1 TER et la seule direction BRT B1 Préfecture → Petersen validée peuvent alimenter la mesure des distances véhicule. La direction inverse BRT reste exclue tant que l'écart terminal n'est pas résolu.

## État actuel des distances et des raccordements dans le planner

Le planner de production n'est que partiellement raccordé aux géométries auditées. Pour les portions sans géométrie directionnelle validée, il conserve les calculs historiques suivants :

- les accès et sorties libres sont estimés par distance Haversine entre les coordonnées du point et les arrêts du référentiel ;
- les portions véhicule TER phase 1 et BRT B1 Préfecture → Petersen utilisent la distance mesurée sur la géométrie auditée lorsque la projection et le sens sont acceptés ; les autres portions véhicule retombent sur la somme de distances Haversine entre arrêts successifs, puis la vitesse commerciale du modèle ;
- les correspondances positives utilisent les distances `walkM` déclarées dans le référentiel, sans chemin piéton calculé sur les ways ;
- la géométrie de carte des courses BRT/TER est distincte de ces calculs métriques : la présence d'une polyline sur la carte ne prouve pas que le planner a mesuré le trajet sur cette polyline.

Ces replis historiques restent actifs afin de ne pas casser le calculateur existant. L'intégration ne couvre pas encore les deux sens de toutes les lignes et ne satisfait pas l'exigence finale de routage sur les voies réelles. Il ne faut donc pas présenter les durées/distances du planner comme des distances routières exactes ni les correspondances comme des chemins piétons vérifiés.

## Préparation du graphe piéton

Deux voies d'extraction read-only sont maintenant prévues : `scripts/export_dakar_pedestrian_network.mjs` interroge Overpass ; si les instances Overpass sont indisponibles, la CI télécharge le PBF Geofabrik Sénégal/Gambie, extrait la boîte de Dakar avec Osmium, puis `scripts/extract_dakar_pedestrian_ways_from_pbf.py` conserve les ways piétonnes avec leurs identifiants de nœuds et géométries. Les filtres/test JS et Python excluent les accès interdits et n'acceptent les axes majeurs que si un trottoir ou un accès piéton explicite est cartographié.

Le graphe produit reste un candidat OSM : il n'est pas encore branché au calculateur et les arrêts/quais ne sont pas raccordés automatiquement. Cette liaison doit passer par des entrées/quais réels et vérifiés.

## Suite nécessaire

1. Extraire et contrôler un graphe piéton OSM continu : ways `highway` autorisant la marche, passages, ponts, tunnels, accès piétons, sens et interdictions.
2. Connecter les points d'entrée/sortie des arrêts aux nœuds de ce graphe sans créer de raccourci à travers les bâtiments, autoroutes, voies ferrées ou l'eau.
3. Raccorder les arrêts BRT/TER aux quais réels et tester les distances projetées sur les géométries.
4. Construire les formes directionnelles DDD à partir des géométries ArcGIS historiques, des relations OSM et de séquences d'arrêts opérateur ; l'ancienneté et les conflits de sources doivent rester explicites.
5. Construire les formes AFTU/TATA en géocodant les séquences de rues/repères publiées puis en les faisant correspondre aux voies OSM dans le bon ordre. Une simple route routière entre deux centres de quartier n'est pas une ligne AFTU/TATA.
6. Valider les deux sens, les arrêts/quais, la continuité géométrique, les distances et les tests d'absence de saut.
7. Réactiver chaque ligne séparément après revue de sa provenance et de ses deux sens.

## Limites et protection des données validées

Ce déploiement de code ne modifie aucune fréquence, aucun horaire de référence TER/BRT, aucune donnée de service, aucun compte ou donnée usager. Les sources OSM restent attribuées © OpenStreetMap contributors, licence ODbL. Les géométries OSM BRT/TER sont des références cartographiques communautaires, pas des attestations officielles de l'opérateur. Le périmètre TER du calculateur reste celui de la phase 1 Dakar–Diamniadio ; la phase 2 AIBD n'est pas activée.
