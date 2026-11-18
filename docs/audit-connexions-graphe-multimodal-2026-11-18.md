# Audit des connexions du graphe multimodal — 18 novembre 2026

## Résultat de l'audit

Le graphe piéton OSM strict disponible dans le dépôt contient 2 246 ways dédiés, 10 472 nœuds et 19 634 arêtes orientées. Il est réparti en 935 composantes connexes ; la plus grande ne contient que 492 nœuds. Les identifiants des 23 stations BRT du référentiel ne sont pas raccordés à ce graphe. Les nœuds les plus proches des gares et stations sont des candidats de proximité, pas des entrées ou des accès certifiés.

En conséquence, ce graphe ne permet pas encore de calculer un chemin piéton voyageurs continu entre les plateformes TER, les stations BRT et les quais de bus.

## Correction appliquée au graphe de correspondances

Le catalogue `CORRIDOR_TRANSFERS` conserve les liaisons candidates et leurs distances de référence. Le graphe réellement utilisé par le planificateur (`INTERMODAL_TRANSFERS`) n'active désormais que :

- les transferts dans un pôle partagé explicitement documenté, avec `walkM: 0` pour signifier l'absence de marche inter-pôle mesurée ;
- les futures liaisons positives qui porteront une preuve `verified_pedestrian_path`, avec une source et un identifiant de chemin.

Les deux anciennes distances TER ↔ BRT — Dakar ↔ Petersen (~1 km) et Colobane ↔ Place de la Nation (~1,4 km) — restent conservées comme repères candidats. Elles ne sont plus des arêtes actives, car aucune géométrie piétonne continue et contrôlée n'est fournie pour les justifier.

Les transferts de pôle partagé Petersen (BRT ↔ DDD, BRT ↔ AFTU, DDD ↔ AFTU) et Guédiawaye (BRT ↔ DDD) restent actifs. Leur marche inter-pôle est nulle ; cela ne prétend pas mesurer le déplacement interne entre quais.

## Effet fonctionnel et limites

Un trajet nécessitant une liaison TER ↔ BRT non vérifiée, par exemple Guédiawaye ↔ Rufisque dans le jeu de référence actuel, retourne maintenant `NO_PATH` plutôt que de proposer une correspondance fondée sur une distance indicative.

Cette correction ne raccorde pas encore les entrées de stations au graphe piéton. Les accès et sorties du calculateur utilisent toujours le rayon géographique de présélection ; les distances à bord DDD/AFTU/TATA restent des estimations tant que les géométries directionnelles ne sont pas raccordées au moteur. Ces limites ne doivent pas être présentées comme des chemins routiers certifiés.

## Garde-fous

- Aucun chemin piéton, trottoir, traversée ou accès de quai n'est inventé.
- Aucun raccordement automatique au nœud OSM le plus proche.
- Aucun tracé droit de remplacement entre des composantes déconnectées.
- Les horaires, fréquences, tracés de référence et séquences TER/BRT existants ne sont pas modifiés.
- Le graphe piéton strict reste une source d'audit jusqu'à validation des accès et de la continuité des chemins.
