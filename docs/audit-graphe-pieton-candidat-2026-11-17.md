# Audit du graphe piéton candidat de Dakar — 17 novembre 2026

## Résultat de l'extraction

- Exécution GitHub Actions : [44165209583](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44165209583)
- Artefact : `dakar-pedestrian-graph-candidate` (ID `14365247221`)
- SHA-256 de l'archive : `3a7fe5f18afa03d901c848c0d0af4184095a54df59f2194ec2b2bd41a3d479bb`
- Généré le : 2026-11-17 à 20:04:21 UTC
- Source : ways OpenStreetMap, via `https://maps.mail.ru/osm/tools/overpass/api/interpreter`
- Attribution et licence déclarées dans le fichier : © OpenStreetMap contributors, ODbL-1.0
- Emprise de requête : sud 14.50, ouest -17.60, nord 14.95, est -17.05
- Éléments OSM reçus : 311 041

## Contrôles indépendants sur l'archive téléchargée

| Contrôle | Résultat |
|---|---:|
| Nœuds | 228 074 |
| Arêtes orientées | 525 798 |
| Ways piétonniers représentés | 57 491 |
| Ways écartés par l'extracteur | 0 |
| Identifiants de nœuds uniques | 228 074 / 228 074 |
| Arêtes avec distance positive | 525 798 / 525 798 |
| Arêtes avec au moins deux positions | 525 798 / 525 798 |
| Arêtes avec identifiant de way | 525 798 / 525 798 |
| Extrémités d'arêtes présentes dans le graphe | 525 798 / 525 798 |
| Paires dirigées distinctes | 525 790 |
| Paires disposant de l'arête inverse | 100 % |
| Composantes connexes (lecture non orientée) | 1 898 |
| Plus grande composante | 137 223 nœuds |
| Nœuds isolés | 249 |

Emprise réelle des nœuds : latitude 14.4974611 à 14.94915 ; longitude -17.5301562 à -17.0115335.

> **Version de l'audit :** cet artefact a été généré avant le correctif de priorité restrictive des balises contradictoires `foot` / `foot:access` ajouté ensuite dans le code. Il sert à documenter la structure de l'extraction précédente ; la prochaine CI doit régénérer le graphe avec ce correctif avant toute nouvelle validation.

## Limites impératives avant utilisation voyageurs

Le fichier porte explicitement le statut `CANDIDATE_GRAPH_NOT_YET_CONNECTED_TO_STOPS`. Les contrôles ci-dessus attestent la cohérence structurelle du fichier, pas la praticabilité réelle de chaque voie.

- Les entrées des arrêts, sorties de stations et quais ne sont pas raccordés.
- Aucune correspondance piétonne n'est activée.
- Les barrières, passages piétons, traversées de routes et accès réels restent à contrôler.
- Les 1 898 composantes montrent que le graphe n'est pas entièrement connecté ; aucun raccord artificiel ne doit être ajouté pour les relier.
- Les 8 arêtes au-delà des paires dirigées distinctes sont des doublons de paires ; elles restent à examiner avant dédoublonnage.
- Les voies ne sont pas certifiées par les opérateurs de transport.

**Décision :** conserver cet artefact comme base de travail et de contrôle uniquement. Ne pas l'utiliser pour annoncer un temps de marche ni pour calculer un itinéraire porte-à-porte tant que les accès et liaisons n'ont pas été validés. Ne pas modifier les horaires ou fréquences TER/BRT sur la base de ce graphe.
