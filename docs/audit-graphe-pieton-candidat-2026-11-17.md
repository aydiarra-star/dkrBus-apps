> **État courant — extraction stricte de 21:23 UTC (run 44178890103, commit 26a1640).**
> Les anciennes archives historiques plus bas, qui annoncent environ 57 000 ways et 228 000 nœuds, ont été produites avec un filtre antérieur qui admettait des axes de chaussée (residential, service, etc.) à partir de balises de trottoir. Elles sont **supersédées et interdites pour le calcul piéton**. Le filtre strict actuel ne conserve que les géométries dédiées : footway, pedestrian, path, steps, living_street.

## Extraction stricte actuelle — Geofabrik PBF

- CI : https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44178890103
- Commit : 26a16401c8f5b698642040c5f333ea1e0ad28fb3
- Artefact : dakar-pedestrian-graph-candidate (ID 14372330083)
- SHA-256 de l'archive : 249d1bda6604291cd79d14e19b59def7783a3a811c52576dbf93e8246117a105
- URL source : https://download.geofabrik.de/africa/senegal-and-gambia-latest.osm.pbf
- Extraction locale générée : 2026-11-17T21:23:04.399948+00:00 ; ce champ est l'heure d'extraction, **pas** l'horodatage du snapshot OSM. Le rapport ne fournit pas encore l'horodatage du PBF.
- Éléments source : 5 202 ; ways retenus : 2 246 ; ways ignorés : 0.
- Attribution : © OpenStreetMap contributors ; licence ODbL-1.0.
- Emprise : sud 14.50, ouest -17.60, nord 14.95, est -17.05.

### Contrôles indépendants du graphe strict

| Contrôle | Résultat |
|---|---:|
| Nœuds uniques | 10 472 |
| Arêtes orientées | 19 634 |
| Ways piétonniers dédiés | 2 246 |
| Paires dirigées distinctes | 19 632 |
| Doublons de paires dirigées | 2 |
| Références de nœuds invalides | 0 |
| Distances non positives ou invalides | 0 |
| Arêtes sans géométrie exploitable | 0 |
| Paires disposant de l'arête inverse | 100 % |
| Composantes connexes (lecture non orientée) | 935 |
| Plus grande composante | 492 nœuds |
| Composantes isolées d'un seul nœud | 20 |

Emprise réelle : latitude 14.501378 à 14.8899183 ; longitude -17.5301562 à -17.0590672. Le graphe est structurellement cohérent, mais très fragmenté.

### Comparaison avec Overpass sous le même filtre strict

L'artefact Overpass du run 44178002602, ID 14369439414, contient exactement les mêmes 2 246 ways, 10 472 nœuds et 19 634 arêtes. La comparaison des identifiants de ways, des nœuds et des segments géométriques donne une égalité complète. Geofabrik reste la source préférée pour l'extraction PBF reproductible ; Overpass est le secours. **Il n'y a pas de gain de couverture démontré entre ces deux sources strictes.**

### Candidats de proximité aux 13 gares TER phase 1 et 23 stations BRT

Les distances ci-dessous sont des distances **à vol d'oiseau** entre le point d'arrêt du référentiel et le nœud du graphe le plus proche. Elles ne sont ni des distances de marche, ni une preuve d'entrée de station. La taille de composante indique le nombre de nœuds dans la composante non orientée du nœud candidat.

| Arrêt | Nœud piéton candidat le plus proche | Distance droite | Taille de composante |
|---|---:|---:|---:|
| TER Dakar | 13836690450 | 5,1 m | 40 |
| TER Colobane | 13121263255 | 84,0 m | 13 |
| TER Hann | 10245681692 | 31,1 m | 96 |
| TER Dalifort | 10245681710 | 24,7 m | 14 |
| TER Baux Maraichers | 10245681732 | 79,9 m | 19 |
| TER Pikine | 10245736461 | 6,6 m | 21 |
| TER Thiaroye | 10245736507 | 8,1 m | 38 |
| TER Yeumbeul | 10245772252 | 32,6 m | 19 |
| TER Keur Mbaye Fall | 10245772281 | 21,5 m | 35 |
| TER PNR | 10245772288 | 9,9 m | 44 |
| TER Rufisque | 7156767785 | 24,2 m | 26 |
| TER Bargny | 10245849908 | 11,6 m | 20 |
| TER Diamniadio | 10245858086 | 7,5 m | 29 |
| BRT Petersen | 13376766705 | 32,5 m | 4 |
| BRT Grande Mosquée | 13376766850 | 36,8 m | 7 |
| BRT Place de la Nation | 13376766980 | 29,0 m | 2 |
| BRT Dial Diop | 13376766950 | 28,0 m | 6 |
| BRT Grand Dakar | 13376766976 | 31,7 m | 6 |
| BRT Liberté 1 | 13376766989 | 33,3 m | 6 |
| BRT Sacré-Cœur | 13376767006 | 39,3 m | 6 |
| BRT Liberté 5 | 13376767013 | 28,3 m | 2 |
| BRT Liberté 6 | 13376767017 | 33,6 m | 2 |
| BRT Khar Yalla | 13376767033 | 32,4 m | 2 |
| BRT Scat Urbam | 13376900327 | 41,2 m | 6 |
| BRT Thiandoum | 13376900352 | 33,9 m | 2 |
| BRT Grand Médine | 13376900368 | 30,5 m | 2 |
| BRT Police Parcelles | 13376903641 | 33,3 m | 6 |
| BRT Croisement 22 | 13376903653 | 39,7 m | 20 |
| BRT Parcelles | 13376903682 | 34,4 m | 6 |
| BRT Ndingala | 13376903693 | 34,1 m | 2 |
| BRT Golf Sud | 13376903713 | 34,9 m | 9 |
| BRT Dalal Jamm | 13376903736 | 33,2 m | 3 |
| BRT Fith Mith | 13376903751 | 33,5 m | 2 |
| BRT Golf Nord | 13376903769 | 29,7 m | 2 |
| BRT Gueule Tapée | 13376903796 | 33,5 m | 6 |
| BRT Préfecture Guédiawaye | 13376903824 | 15,8 m | 27 |

Constats :
- 34 des 36 points sont à 50 m ou moins du nœud piéton candidat le plus proche ; Colobane (84,0 m) et Baux Maraichers (79,9 m) dépassent 50 m.
- Les 23 identifiants OSM de station BRT du référentiel sont absents du graphe piéton ; aucun raccordement plateforme-vers-chemin n'est établi.
- Les 36 nœuds candidats les plus proches appartiennent à des composantes de seulement 2 à 96 nœuds. Ils ne prouvent donc pas une continuité de chemin entre les stations.
- Ces mesures servent uniquement à préparer une vérification des entrées, traversées et barrières ; elles ne doivent pas être utilisées comme marche voyageurs.

**Décision actuelle :** conserver l'artefact strict comme base d'audit uniquement. Aucun arrêt n'est projeté automatiquement sur un chemin, aucun transfert piéton n'est activé et aucun temps de marche n'est calculé à partir de ces distances. Les horaires et fréquences TER/BRT restent inchangés.

---

# Audit du graphe piéton candidat de Dakar — 17 novembre 2026

## Archive historique Geofabrik avant filtre strict — 20:27 UTC (supersédée)

- Exécution GitHub Actions : [44168986605](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44168986605)
- Commit contrôlé : `e447f844498d3869222336025746d1e26bad549b`
- Artefact : `dakar-pedestrian-graph-candidate` (ID `14366297825`)
- Généré le : 2026-11-17 à 20:27:07 UTC
- SHA-256 de l'archive téléchargée : `6b2a4ac0042b916b1b4eeec003c29e95ccd2b160ae258074e512eba6554dc7a9`
- Source : extraction des ways OpenStreetMap depuis le PBF Geofabrik Sénégal et Gambie.
- Éléments source extraits : 60 514 ; ways piétonniers : 57 489 ; ways ignorés : 0.
- L'extraction Overpass a échoué sur cette exécution, mais le chemin de secours Geofabrik a réussi ; le graphe a été construit et l'artefact téléversé.
- Emprise de requête : sud 14.50, ouest -17.60, nord 14.95, est -17.05.

### Contrôles indépendants de l'archive Geofabrik

| Contrôle | Résultat |
|---|---:|
| Nœuds | 228 060 |
| Identifiants de nœuds uniques | 228 060 / 228 060 |
| Arêtes orientées | 525 764 |
| Paires dirigées distinctes | 525 756 |
| Doublons de paires dirigées | 8 |
| Références de nœuds invalides | 0 |
| Distances non positives ou invalides | 0 |
| Arêtes sans au moins deux positions | 0 |
| Arêtes sans identifiant de way | 0 |
| Paires disposant de l'arête inverse | 100 % |
| Composantes connexes (lecture non orientée) | 1 899 |
| Plus grande composante | 137 181 nœuds |
| Nœuds sans arête sortante | 0 |

Emprise réelle des nœuds : latitude 14.4974611 à 14.94915 ; longitude -17.5301562 à -17.0115335. Le statut reste `CANDIDATE_GRAPH_NOT_YET_CONNECTED_TO_STOPS`.

### Résultat CI

- Tests des filtres piétons et de sélection des sources : réussis.
- Filtre PBF Geofabrik : réussi.
- Extraction de secours Geofabrik : réussie.
- Téléversement de l'artefact : réussi.
- Compilation frontend : réussie.
- Tests frontend et données locales : réussis.
- 243 tests Python : réussis.
- Échec global uniquement à `npm audit` : six alertes high liées à `picomatch` (GHSA-fc5q-39xc-vjpf). La correction automatique proposée implique une rétrogradation majeure de Vitest ; aucune mise à jour forcée n'a été appliquée.

**Décision inchangée :** le succès du chemin de secours confirme la production d'un graphe OSM structurellement cohérent. Il ne confirme ni la praticabilité de chaque voie, ni les entrées des stations, ni les correspondances. Aucun temps de marche et aucune liaison voyageurs ne doivent être calculés à partir de cet artefact avant raccordement et validation des accès. Les horaires TER/BRT restent intacts.

---

## Archive historique Overpass avant filtre strict — 20:25 UTC (supersédée)

- Exécution GitHub Actions : [44168969950](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44168969950)
- Commit contrôlé : `e447f844498d3869222336025746d1e26bad549b`
- Artefact : `dakar-pedestrian-graph-candidate` (ID `14366322600`)
- SHA-256 de l'archive téléchargée : `670c50e14ad4af028bbf3cbe83a1b97aeda2dd94bd45df6fb66134e08f2d661c`
- Généré le : 2026-11-17 à 20:25:24 UTC
- Source : ways OpenStreetMap, endpoint `https://maps.mail.ru/osm/tools/overpass/api/interpreter`
- Éléments OSM reçus : 311 041 ; emprise de requête inchangée : sud 14.50, ouest -17.60, nord 14.95, est -17.05.
- Les étapes d'extraction Overpass, de test du filtre PBF, de construction du graphe de secours Geofabrik (non nécessaire car Overpass a réussi) et de téléversement de l'artefact sont cohérentes : le filtre PBF passe et l'artefact est bien présent.

### Contrôles indépendants de cette nouvelle archive

| Contrôle | Résultat |
|---|---:|
| Nœuds | 228 074 |
| Identifiants de nœuds uniques | 228 074 / 228 074 |
| Arêtes orientées | 525 798 |
| Arêtes avec distance positive, positions valides et références de nœuds présentes | 525 798 / 525 798 |
| Paires dirigées distinctes | 525 790 |
| Doublons de paires dirigées | 8 |
| Paires disposant de l'arête inverse | 100 % |
| Composantes connexes (lecture non orientée) | 1 898 |
| Plus grande composante | 137 223 nœuds |
| Nœuds isolés | 249 |

Emprise réelle des nœuds : latitude 14.4974611 à 14.94915 ; longitude -17.5301562 à -17.0115335. Le statut demeure `CANDIDATE_GRAPH_NOT_YET_CONNECTED_TO_STOPS`. Les avertissements du fichier précisent que les entrées et quais ne sont pas raccordés, qu'aucune correspondance n'est activée et que barrières et traversées doivent encore être contrôlées.

### Résultat CI sur cette version

- Tests des filtres piétons et sélection de source : réussis.
- Extraction et téléversement du graphe : réussis.
- Compilation frontend : réussie.
- Tests frontend et données locales : réussis.
- 243 tests Python : réussis.
- Échec global uniquement sur `npm audit` : six alertes high de `picomatch` (GHSA-fc5q-39xc-vjpf). La correction proposée par npm implique une rétrogradation majeure de Vitest ; aucune mise à jour forcée n'a été appliquée.

**Décision inchangée :** ce graphe est une base structurelle vérifiée, pas une preuve de chemin piéton praticable. Il reste interdit de l'utiliser pour calculer des temps de marche ou activer des correspondances avant raccordement et validation terrain des accès. Les horaires TER/BRT ne sont pas concernés.

---

## Archive historique Overpass avant filtre strict — 20:11 UTC (supersédée)

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


## Durcissement du filtre piéton — géométrie des grandes voies

Le 17 novembre, le filtre du graphe candidat a été durci : les ways OSM classés `tertiary`, `secondary`, `primary`, `trunk`, `trunk_link`, `residential`, `unclassified` et `service` sont désormais exclus du graphe piéton, même lorsqu'ils portent `sidewalk=yes/both` ou `foot=designated`. Seules les géométries dédiées aux déplacements piétons (notamment `footway`, `pedestrian`, `path`, `steps` et les voies partagées `living_street`) restent admissibles.

Motif : la géométrie extraite pour ces objets est l'axe de la chaussée. La seule présence d'une balise de trottoir indique qu'un trottoir existe, mais ne fournit pas sa géométrie propre ; utiliser l'axe routier comme chemin piéton ferait passer le calcul sur une ligne qui n'est pas le trottoir. Les trottoirs ne seront intégrés que lorsqu'une géométrie piétonne dédiée (par exemple un way `footway` ou `path`) est disponible et contrôlable. Les axes des voies résidentielles et de service sont également écartés : leur caractère accessible à pied ne prouve pas que l'axe routier soit le cheminement piéton.

Des tests de non-régression vérifient maintenant que ces grandes voies restent exclues, y compris avec des balises `sidewalk` ou `foot` permissives. Ce choix réduit volontairement la couverture du graphe candidat au bénéfice de la fidélité géométrique. Il ne modifie aucun itinéraire ou horaire voyageurs : le graphe reste non raccordé aux arrêts et non activé.
