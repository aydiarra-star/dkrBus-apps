# Audit des connexions du graphe multimodal — 18 novembre 2026

## Résultat de l'audit

Le graphe piéton OSM strict disponible dans le dépôt contient 2 246 ways dédiés, 10 472 nœuds et 19 634 arêtes orientées. Il est réparti en 935 composantes connexes ; la plus grande ne contient que 492 nœuds. Les identifiants des 23 stations BRT du référentiel ne sont pas raccordés à ce graphe. Les nœuds les plus proches des gares et stations sont des candidats de proximité, pas des entrées ou des accès certifiés.

En conséquence, ce graphe ne permet pas encore de calculer un chemin piéton voyageurs continu entre les plateformes TER, les stations BRT et les quais de bus.

## Correction appliquée au graphe de correspondances

Chaque correspondance porte désormais une catégorie de preuve distincte :

- `shared_hub` : deux réseaux partagent un pôle documenté ; aucune marche inter-pôle n'est ajoutée ;
- `reference_estimate` : une distance de marche de référence sourcée peut contribuer à l'estimation de durée, mais ne constitue pas une géométrie piétonne vérifiée et ne doit jamais être dessinée comme chemin ;
- `verified_pedestrian_path` : réservé aux futures liaisons dont la source et l'identifiant de chemin réel sont fournis.

Les deux anciennes distances TER ↔ BRT — Dakar ↔ Petersen (~1 km) et Colobane ↔ Place de la Nation (~1,4 km) — restent actives comme estimations de planification sourcées. Leur libellé conserve explicitement la mention « marche de référence ». Elles ne prouvent pas un accès, une traversée, un trottoir ou une géométrie piétonne continue.

Les transferts de pôle partagé Petersen (BRT ↔ DDD, BRT ↔ AFTU, DDD ↔ AFTU) et Guédiawaye (BRT ↔ DDD) restent actifs avec `walkM: 0). Cela signifie uniquement qu'aucune marche inter-pôle n'est ajoutée ; le déplacement interne entre quais n'est pas mesuré.

## Effet fonctionnel et limites

Le calculateur conserve ses résultats multimodaux fondés sur ces estimations, sans les présenter comme des chemins piétons certifiés. Aucune ligne droite de transfert n'est créée à partir des seules coordonnées et aucune géométrie de marche n'est dessinée par ce correctif.

Cette correction ne raccorde pas encore les entrées de stations au graphe piéton. Les accès et sorties du calculateur utilisent toujours le rayon géographique de présélection ; les distances à bord DDD/AFTU/TATA restent des estimations tant que les géométries directionnelles ne sont pas raccordées au moteur. Ces limites ne doivent pas être présentées comme des chemins routiers certifiés.

## Garde-fous

- Aucun chemin piéton, trottoir, traversée ou accès de quai n'est inventé.
- Aucun raccordement automatique au nœud OSM le plus proche.
- Aucun tracé droit de remplacement entre des composantes déconnectées.
- Les estimations de marche restent explicitement identifiées comme telles.
- Les horaires, fréquences, tracés de référence et séquences TER/BRT existants ne sont pas modifiés.
- Le graphe piéton strict reste une source d'audit jusqu'à validation des accès et de la continuité des chemins.
