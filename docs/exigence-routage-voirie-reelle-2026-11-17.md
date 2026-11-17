# Exigence obligatoire — routage sur les voies et itinéraires réels

Date de décision : 17 novembre 2026

## Règle produit

Une recherche multimodale ne doit jamais dessiner ni mesurer un déplacement en reliant deux coordonnées par une droite. Chaque portion doit appartenir à un réseau physique vérifié et compatible avec le mode :

- TER : géométrie ferroviaire et sens de circulation publiés/vérifiés ;
- BRT : géométrie de la plateforme et du corridor BRT, avec sens réellement desservis ;
- DDD : géométrie de l'itinéraire de bus DDD, distincte pour chaque sens ;
- AFTU/TATA : géométrie routière de la ligne concernée, issue d'une relation de ligne ou d'une fiche opérateur géolocalisée et vérifiée ;
- marche d'accès, de sortie et de correspondance : chemin piéton continu sur le graphe viaire, en respectant les passages autorisés.

Une route automobile calculée entre deux centres de quartier n'est pas une géométrie de ligne de bus. Elle ne peut pas être utilisée pour dessiner le trajet du bus.

## Séparer les trois graphes

1. **Graphe des lignes** : nœuds = arrêts/quais confirmés ; arcs = portions successives d'une ligne dans un sens explicite ; chaque arc référence une géométrie de ligne et une provenance.
2. **Graphe de voirie piétonne** : nœuds = intersections/accès piétons ; arcs = ways OSM autorisant effectivement la marche ; il calcule accès, sorties et correspondances.
3. **Graphe de voirie bus** : ways routiers autorisés aux bus, avec restrictions, sens uniques, accès interdits et géométrie de la ligne. Il sert à contrôler/compléter une géométrie opérateur, jamais à remplacer automatiquement le parcours commercial publié.

Le calcul multimodal relie ces graphes uniquement par des quais et cheminements piétons confirmés. La simple proximité de coordonnées ne crée pas une correspondance.

## Sources actuellement disponibles dans le dépôt

### DDD

L'audit ArcGIS du 15 novembre 2026 recense 25 entités d'itinéraire, dont 24 polylignes et une sans géométrie. La couche d'arrêts date du 24 septembre 2024 ; les géométries de route datent du 11 janvier 2019. Ces polylignes sont donc des références historiques à confronter aux fiches DDD et aux relations OSM directionnelles, pas une preuve automatique de l'exploitation actuelle.

L'audit identifie notamment des conflits à ne pas fusionner : les groupes 218/219, la ligne 228 non numérotée et les deux groupes 13. Les directions aller et retour restent distinctes.

### OSM DDD / AFTU / TATA

L'inventaire OSM du 13 novembre 2026 recensait 25 relations de lignes et 2 route-master dans l'extraction, dont 18 relations avec des membres d'arrêts ordonnés. La relation AFTU/TATA 40 (3982642) ne fournit aucun arrêt ordonné. Une relation présente sans ordre d'arrêts ne suffit pas à alimenter le calculateur.

### AFTU/TATA

Les pages opérateur fournissent des séquences de rues/repères pour certaines lignes. Elles doivent être géocodées sur les ways routiers correspondants, dans l'ordre publié, puis vérifiées sur les deux sens. Les centres de quartier et points approximatifs ne sont pas des quais.

### TER / BRT

Les données de service et les fréquences validées ne doivent pas être modifiées par ce chantier. Pour le tracé, les géométries ferroviaires et BRT doivent être des voies dédiées vérifiables, pas une succession de segments entre gares/stations.

## Garde-fous techniques

- Une géométrie de ligne doit porter réseau, identifiant de ligne, sens, source et identifiant source.
- Les arrêts sont projetés sur la géométrie ; si l'écart dépasse le seuil de contrôle, la portion est refusée.
- L'ordre des arrêts doit respecter le chainage de la géométrie directionnelle. Le retour ne se fabrique pas par inversion.
- Un segment de bus n'est calculable que si sa géométrie directionnelle est disponible et validée.
- Une marche n'est calculable que si un chemin continu existe sur le graphe piéton.
- Aucun fallback vers Haversine, ligne droite, OSRM automobile entre centres de lieux ou raccourci hors réseau n'est autorisé pour dessiner ou mesurer une jambe.
- Si la source ou le chemin est absent, le moteur exclut cette option et explique qu'elle n'est pas calculable ; il ne crée pas une route de remplacement.
- Le moteur conserve les données horaires/fréquences existantes indépendamment de la géométrie.

## Primitives ajoutées

`src/domain/roadNetworkRouting.ts` fournit les fonctions testables suivantes :
- projection d'un arrêt sur une géométrie directionnelle ;
- mesure d'une portion par chainage sur cette géométrie ;
- rejet d'un arrêt éloigné, d'un sens inversé ou d'une géométrie non vérifiée ;
- plus court chemin sur un graphe de ways filtré par mode (piéton, bus ou rail), sans connecteur artificiel.

Les tests associés sont dans `src/domain/roadNetworkRouting.test.ts`.

## Conditions avant activation dans le calculateur

La présence de ces primitives ne signifie pas que les données routières de toutes les lignes sont déjà intégrées. L'activation générale exige :
1. l'extraction et la revue des géométries directionnelles DDD, AFTU/TATA, TER et BRT ;
2. le rapprochement des quais confirmés avec les géométries ;
3. l'extraction d'un graphe piéton continu pour les accès et correspondances ;
4. l'intégration des distances et géométries dans le planner et la carte ;
5. des tests de non-régression empêchant tout trait droit, saut d'océan, sens inversé ou correspondance sans chemin ;
6. des essais sur plusieurs trajets de référence avant fusion et déploiement.

Aucune fréquence TER/BRT validée, aucun horaire, aucune donnée de production et aucune donnée passager n'est modifié par cette exigence.
