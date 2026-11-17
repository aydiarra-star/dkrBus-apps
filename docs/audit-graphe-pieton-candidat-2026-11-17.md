# Audit du graphe piéton candidat de Dakar — 17 novembre 2026

## Dernière extraction vérifiée

- Exécution GitHub Actions : [44166322851](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44166322851)
- Commit contrôlé : `1a7e8cae9a8e340aa0bb554107db61d76f33d046`
- Artefact : `dakar-pedestrian-graph-candidate` (ID `14364879013`)
- SHA-256 de l'archive : `ae1a83055edcc70bc464ce71ebefaa155836d8cd7845555eceae920353504f65d`
- Généré le : 2026-11-17 à 20:11:08 UTC
- Source : ways OpenStreetMap, via `https://overpass-api.de/api/interpreter`
- Attribution et licence déclarées dans le fichier : © OpenStreetMap contributors, ODbL-1.0
- Emprise de requête : sud 14.50, ouest -17.60, nord 14.95, est -17.05
- Éléments OSM reçus : 311 041
- Cette archive a été régénérée après l'ajout du filtrage restrictif des balises contradictoires `foot` / `foot:access`.

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
| Extrémités d'arêtes présentes dans le graphe | 525 798 / 525 798 |
| Paires dirigées distinctes | 525 790 |
| Paires disposant de l'arête inverse | 100 % |
| Composantes connexes (lecture non orientée) | 1 898 |
| Plus grande composante | 137 223 nœuds |
| Nœuds isolés | 249 |

Les 8 arêtes excédant le nombre de paires dirigées distinctes sont des doublons de paires. Emprise réelle des nœuds : latitude 14.4974611 à 14.94915 ; longitude -17.5301562 à -17.0115335.

## Tests et compilation

Sur la CI 44166322851 :
- Les tests Node des filtres de construction du graphe piéton réussissent, y compris les cas de refus explicite `foot:access=no/private` et les balises contradictoires.
- L'extraction du graphe et le téléversement de l'artefact réussissent.
- La compilation frontend réussit.
- Les tests frontend et données locales réussissent.
- Les 243 tests Python réussissent.
- Le job complet reste en échec uniquement à l'étape `npm audit` : six alertes high associées à `picomatch` (GHSA-fc5q-39xc-vjpf, ReDoS), transitives via Vite/Vitest. La correction automatique proposée rétrograde Vitest vers 3.1.4 et constitue un changement majeur ; aucune mise à jour forcée n'a été appliquée.

## Limites impératives avant utilisation voyageurs

Le fichier porte explicitement le statut `CANDIDATE_GRAPH_NOT_YET_CONNECTED_TO_STOPS`. Les contrôles ci-dessus attestent la cohérence structurelle du fichier, pas la praticabilité réelle de chaque voie.

- Les entrées des arrêts, sorties de stations et quais ne sont pas raccordés.
- Aucune correspondance piétonne n'est activée.
- Les barrières, passages piétons, traversées de routes et accès réels restent à contrôler.
- Les 1 898 composantes montrent que le graphe n'est pas entièrement connecté ; aucun raccord artificiel ne doit être ajouté pour les relier.
- Les voies ne sont pas certifiées par les opérateurs de transport.

**Décision :** conserver cet artefact comme base de travail et de contrôle uniquement. Ne pas l'utiliser pour annoncer un temps de marche ni pour calculer un itinéraire porte-à-porte tant que les accès et liaisons n'ont pas été validés. Ne pas modifier les horaires ou fréquences TER/BRT sur la base de ce graphe.
