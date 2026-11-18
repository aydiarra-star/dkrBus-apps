# Audit des connexions du graphe multimodal — 18 novembre 2026

## État vérifié

Le graphe piéton OSM strict extrait pour Dakar contient 10 472 nœuds et 19 634 arêtes orientées, répartis en 935 composantes connexes ; la plus grande composante compte 492 nœuds. Les identifiants des 23 stations BRT du référentiel ne sont pas encore raccordés à des accès de quai validés.

Ce graphe ne permet donc pas de calculer un chemin piéton voyageurs continu et certifié entre les plateformes TER, les stations BRT et les arrêts de bus.

## Preuves des correspondances

Chaque correspondance est classée selon une preuve typée :

- `shared_hub` : deux réseaux partagent un pôle documenté ; aucune marche inter-pôle n'est ajoutée ;
- `reference_estimate` : une distance de référence sourcée peut contribuer à l'estimation de durée, sans constituer une géométrie piétonne vérifiée ;
- `verified_pedestrian_path` : réservé à un chemin réel accompagné de sa source et de son identifiant de chemin.

Les deux distances TER ↔ BRT — Dakar ↔ Petersen (~1 km) et Colobane ↔ Place de la Nation (~1,4 km) — restent des estimations sourcées dans le calculateur. Elles ne doivent jamais être dessinées comme des chemins piétons réels.

Les trois transferts du pôle Petersen (BRT ↔ DDD, BRT ↔ AFTU, DDD ↔ AFTU) et celui de Guédiawaye (BRT ↔ DDD) sont des pôles partagés documentés avec `walkM: 0`. Cela signifie uniquement qu'aucune marche inter-pôle n'est ajoutée ; le déplacement interne entre quais n'est pas mesuré.

## Limites et garde-fous

- Aucun chemin piéton, trottoir, passage ou accès de quai n'est inventé.
- Aucun raccordement automatique au nœud OSM le plus proche.
- Aucun trait droit de remplacement entre des composantes déconnectées.
- Les distances estimées restent identifiées comme estimations.
- Les horaires, fréquences, tracés et séquences TER/BRT ne sont pas modifiés.
- Les corridors DDD/AFTU/TATA non vérifiés restent désactivés dans le calculateur.
