# Moteur voyageurs Dakar Bus — état du 18 novembre 2026

**Ce qui fonctionne dans Trajet :** un calcul local daté, sans API, clé, service payant ni GTFS obligatoire. Pour un voyageur déjà au point de montée, deux dessertes sont utilisables : **TER Dakar → Diamniadio (13 gares)** et **BRT B1 Préfecture de Guédiawaye → Petersen (23 stations)**. On peut choisir deux arrêts dans l’ordre du sens admis. La géométrie est contrôlée ; les heures et durées restent des estimations. « Pas d’itinéraire vérifié » ne signifie pas « aucun service sur le terrain ».

**Ce qui ne fonctionne pas à Dakar faute de preuves :** porte-à-porte depuis un GPS, marche d’accès ou de sortie, changement entre quais, itinéraire BRT–TER, sens opposés, B2, DDD, AFTU, TATA et accessibilité sans marches. Le moteur sait traiter ces réseaux et ces opérations ; un jeu synthétique teste notamment trois véhicules et deux changements. **Ce test ne décrit aucun trajet réel à Dakar.** Aucun chemin piéton de démonstration n’est livré au voyageur.

## Reproduire quatre trajets réels

```sh
npm ci
npm run demo:routing  # lit exactement les modules et les géométries du navigateur ; aucune requête à un opérateur
npm run test:routing  # indépendant de React, Leaflet, de l’API et de la publication
```

Dans **Trajet**, choisir le **18/11/2026 à 08:01 (Dakar, UTC+0)** et sélectionner les arrêts par leur nom, pas par un clic géographique. L’heure de départ de la recherche précède la montée. Les secondes ci-dessous permettent de reproduire les calculs ; elles ne reflètent pas une précision observée. L’interface affiche l’heure à la minute.

| Origine → destination | Ligne | Montée → arrivée estimées | Attente | À bord | Total | Distance sur le tracé |
|---|---|---|---:|---:|---:|---:|
| Dakar → Pikine | TER | 08:07 → 08:23 | 6 min | 16 min | 22 min | 11 305 m |
| Colobane → Diamniadio | TER | 08:02 → 08:43:30 | 1 min | 41 min 30 s | 42 min 30 s | 32 777 m |
| Préfecture de Guédiawaye → Petersen – Papa Gueye Fall | B1 | 08:06 → 08:58:43 | 5 min | 52 min 43 s | 57 min 43 s | 17 500 m |
| Grand Médine → Liberté 6 | B1 | 08:05:43 → 08:14:32 | 4 min 43 s | 8 min 49 s | 13 min 32 s | 3 029 m |

Pour ces quatre cas : zéro changement et zéro marche **dans le périmètre entre points de desserte**. Cela ne mesure pas la marche depuis la rue. Les quatre calques utilisent respectivement 131, 298, 240 et 47 sommets de parcours (avec les points de découpe sur la voie). Le B1 donne par exemple les créneaux projetés 08:06, 08:12 et 08:18 au départ de Préfecture, pas trois véhicules observés.

| Contre-épreuve | Résultat attendu |
|---|---|
| Inverser Dakar → Pikine | Refus : pas de géométrie retour TER qualifiée séparément. |
| Inverser Préfecture → Petersen | Refus : la relation OSM retour 19961993 échoue à Préfecture (93,35 m, seuil 80 m). |
| Préfecture → Rufisque | Refus : le changement BRT → TER exigerait une marche entre quais non vérifiée. Aucune partie du trajet n’est dessinée comme un itinéraire complet. |
| Diamniadio → AIBD | Hors périmètre : phase 2, indépendamment de ce que montre la carte de référence Explorer. |
| Position GPS à la coordonnée exacte de Dakar → Pikine | Refus : une coordonnée n’est pas l’identité d’un quai. Même refus pour un ID d’un autre espace de noms (snapshot). |
| B1 au terminus à 21:00 ; B1 dans une année sans calendrier des fériés confirmé | Pas de créneau au départ. Pas d’attente implicite jusqu’au lendemain ni d’assimilation d’un férié inconnu à un jour ouvré. |

## Ce que l’audit a changé dans le calcul

Le calculateur historique (`src/domain/planner.ts`) pouvait accepter une marche par rayon, une liaison `walkM`, un ordre inversé ou une distance à vol d’oiseau quand la géométrie manquait. Les attentes n’étaient pas des vérifications de compatibilité avec le prochain départ. Avant cette intégration, il donnait notamment **120 min et une correspondance** pour Préfecture → Rufisque, malgré l’absence de cheminement documenté pour les **1 400 m** entre Place de la Nation et Colobane. Une portion ferroviaire et une portion BRT correctes ne valident pas la liaison entre elles.

Nous réutilisons en lecture seule les géométries, [l’audit directionnel](../src/domain/referenceRouteGeometry.ts), la découpe le long de la voie, le plus court chemin sur ways et les références temporelles disponibles. Nous ne réutilisons ni le rayon d’accrochage, ni le demi-intervalle, ni la liste des pôles comme arêtes du graphe voyageurs.

| Source examinée | Décision d’admission |
|---|---|
| TER, relation OSM 13645077 (extrait du 15/11/2026) | Bornage à la phase 1 avant découpe. 13 appels dans l’ordre Dakar → Diamniadio ; écart maximal mesuré 11,34 m. Le fichier complet et le tableau existant ne sont pas raccourcis. |
| B1, relations OSM 19961937 et 19961993 (14/11/2026) | Audit séparé des deux sens. 19961937 admise : 23 stations, écart maximal 0,54 m, jointure déclarée entre membres de 0 m. 19961993 refusée, pas réparée par inversion. Les paires *stop/platform* candidates ne remplacent pas le référentiel des 23 stations. |
| B2 | Règle de cadence isolée et testée ; aucun tracé ni séquence de montée/descente validés pour construire un parcours. |
| DDD | ArcGIS : 25 entités, 777 arrêts candidats ; 14 des 18 séquences étudiées compatibles à l’aller, pas de retour certifié. Une séquence compatible ou une ligne historique cartographiée n’est pas un service actuel vérifié. |
| AFTU / TATA | 28 lignes AFTU documentées dans les deux sens, dont 18 avec horaires aux deux sens ; aucun des 28 couples géocodé et validé. 62 entrées TATA, pas de retours géocodés validés. Aucun service ou temps « officiel » ajouté. |
| Marche | [Audit du graphe candidat](audit-graphe-pieton-candidat-2026-11-17.md) : 10 472 nœuds, 19 634 arcs orientés, 935 composantes, 492 nœuds dans la plus grande. Pas de chaîne vérifiée quai–voie publique–quai pour ces dessertes. Les anciens centres de chaussée, la proximité et les quatre liaisons `walkM: 0` ne sont pas des trottoirs. **0 arête piétonne activée à Dakar.** |

Les audits supplémentaires sur `main` ([connexions](https://github.com/aydiarra-star/dkrBus-apps/blob/189eb82c3f9950e31943b6627552dc40ac7bbc99/docs/audit-connexions-graphe-multimodal-2026-11-18.md), [relations bus OSM](https://github.com/aydiarra-star/dkrBus-apps/blob/189eb82c3f9950e31943b6627552dc40ac7bbc99/docs/audit-relations-bus-osm-dakar-2026-11-18.md)) distinguent également les pôles partagés et les estimations des chemins vérifiés ; les relations DDD/AFTU/TATA demeurent candidates. Aucune de ces données n’est automatiquement promue dans le calculateur.

## Architecture et contrat d’entrée (`src/routing/`)

1. **`model.ts`, `dakar.ts`** — Normalisation des points nommés, lignes et directions. Une desserte (`call`), un quai (`platform`), une entrée (`entrance`) et un nœud piéton (`path`) ont des identités séparées. Un `call` permet un résultat *entre arrêts* ; il ne constitue jamais un accès à pied. AFTU et TATA restent identifiables séparément sous le filtre de réseau commun de l’application.
2. **`geometry.ts`, `vehicleGraph.ts`, `network.ts`** — Compilation hors requête. Une direction doit fournir ses appels dans l’ordre, une provenance revue et datée, une géométrie de **cette** ligne et **ce** sens, un service et des temps valides. Pour une LineString auditée, la projection se fait uniquement sur la voie du service déjà identifié (tolérance 80 m, chaînage croissant). Pour des ways, la source désigne les nœuds et les membres de **chaque inter-arrêt** : Dijkstra ne parcourt que ces membres orientés, conserve les sommets réels et refuse la section si elle contient une branche, un îlot ou un raccourci non résolu. On ne cherche pas une route générique entre deux arrêts. Les limites de saut par sommet (2 000 m ferroviaire, 1 000 m routier, 250 m piéton) sont des garde-fous, **pas** des preuves. Un défaut invalide la direction entière ; les rejets sont inspectables dans `Network.rejected`.
3. **`walking.ts`** — Dijkstra orienté, tas binaire, borne en mètres **sur le chemin**. Chaque arête doit identifier exactement ses deux extrémités et leurs coordonnées, décrire une voie piétonne publique revue, traversées et obstacles contrôlés. Aucun lien automatique par parent, nom, proximité ou identifiant de pôle commun. Aucune inversion de voie. Le filtre sans marches exclut aussi l’état `unknown`.
4. **`dakarService.ts`, `serviceTime.ts`** — Départs datés ou créneaux depuis l’origine de la direction, décalés à la station de montée. Une requête couvre un jour de service à Dakar ; un véhicule déjà parti du terminus peut encore desservir une station aval. Les fréquences sont des projections à partir du début de fenêtre, jamais un relevé temps réel. Voir les règles ci-dessous.
5. **`search.ts`, `ranking.ts`** — Recherche à tours de montée, de type RAPTOR multicritère, avec index des directions desservant chaque point. Au tour *k*, arrivée à chaque arrêt aval puis fermeture piétonne sur chemins vérifiés. Un changement exige un chemin explicite, même dans la même gare. Départ suivant ≥ arrivée à pied + marge de correspondance ; pas de marge ajoutée une deuxième fois au total. Trois changements au maximum par défaut (borne configurable 0–5). Un front de Pareto conserve heure d’arrivée, montées, marche, pire intervalle de service ; les prédécesseurs restituent les arcs réellement utilisés. À défaut de résultat, un second scan **diagnostique seulement** topologie déconnectée ou horaires incompatibles.
6. **`presentation.ts`, `answers.ts`** — Le panneau, le copilote et Leaflet consomment les résultats du même service daté. Pour la carte, seule conversion `(lat, lon)` → `[lat, lon]`, sans autre recherche de géométrie. On affiche la variante choisie : étapes, arrêts desservis, points de changement, marche en pointillés. Aucun calque intégral ou routage automobile de secours en vue Trajet. Explorer garde ses tracés et tableaux historiques. La simulation antérieure reste consultable sur ouverture explicite, sans alimenter la carte voyageurs. Les horaires directs du snapshot et leurs distances indicatives sont étiquetés à part. L’outil automobile existant est distinct : « Voiture : Dakar à Pikine » dans Explorer.

**Classement.** Arrivée la plus tôt ; moins de changements ; moins de mètres à pied ; simplicité (changements, puis marche, puis arrivée) ; cadence (plus petit des pires intervalles, seulement si comparables). Un parcours gagnant plusieurs critères n’est présenté qu’une fois. Nous ne classons pas la *ponctualité réelle*, inconnue. Le trajet restitue montée, descente, sens, temps à bord, marche, attente, créneaux suivants et sources. `totalSeconds = walkSeconds + waitSeconds + rideSeconds`.

### Règles temporelles du moteur uniquement

| Service | Lundi–samedi non férié | Dimanche / férié confirmé |
|---|---|---|
| TER phase 1 | 05:35–22:00, 8 min | 06:30–22:00, 20 min |
| B1 | 06:00–21:00, 6 min | 06:00–11:00, 10 min ; 11:00–21:00, 7 min |
| B2 (non routable) | 06:00–21:00, 6 min | Pas de règle sourcée, aucun créneau |

Les fenêtres de départ au **terminus** incluent le début et excluent la fin ; on ne promet pas un dernier départ à la fermeture. Les jours fériés dépendent du calendrier sénégalais intégré (2026). Durées TER : milieux des plages cumulées TER INFOS du dépôt, pas des horaires individuels. Durées B1 : modèle existant à 25 km/h et arrêts intermédiaires de 30 s, appliqué aux distances mesurées sur la voie. Attente : temps jusqu’au créneau compatible, pas une constante égale à la moitié de la fréquence. Marche : longueur de la polyligne à la vitesse du profil choisi ; marge de transfert du profil. Aucune vitesse ni fréquence de substitution pour lancer un réseau non vérifié. Les règles B1/B2 de la mission s’appliquent **ici seulement** ; aucune réécriture de `frequencies.ts`, `stationBoard.ts`, des horaires, données ou tracés TER/BRT.

### Prochaine activation possible

Pour ouvrir un échange tel que Colobane ↔ Place de la Nation : identifier les accès et quais **pour chaque sens**, documenter sur une source réutilisable les sorties/entrées, trottoirs, traversées, obstacles et sens autorisés, puis vérifier une chaîne continue et mesurable dans les deux directions séparément. Pour un bus : opérateur et ligne exacts, service actuel, séquence ordonnée, montée/descente, voie de chaque inter-arrêt, calendrier et temps étayés. Importer comme candidat, revoir les preuves, puis ajouter un test aller **et** retour (y compris de refus) avant admission. Un futur adaptateur GTFS pourra remplir les mêmes contrats ; `parent_station`, `transfers.txt` ou des coordonnées seules ne qualifient pas un cheminement.

## Vérification sur la branche

| Contrôle local | Résultat |
|---|---|
| `npm run test:all` | **979** tests Vitest (105 fichiers) et **247** tests Python réussis. Les tests du nouveau routage incluent réseau déconnecté, trois véhicules, correspondance manquée, sens retour indépendant, admission des voies, fériés, fin de service, chemin piéton non vérifié, accessibilité et classement. |
| `node --test $(git ls-files '*node-test.mjs')` ; `python3 -B scripts/test_extract_dakar_pedestrian_ways_from_pbf.py` | **47 + 3** tests supplémentaires réussis (audits de données et extraction). Aucun gros extrait téléchargé ni republié. |
| `npm run build` | TypeScript, Vite, vérification du bundle et montage réel du bundle dans les vues principales réussis. Avertissement non bloquant d’import statique/dynamique du registre ArcGIS. |
| `npm audit --omit=dev --audit-level=moderate` | **0 vulnérabilité signalée** dans les dépendances de production. Aucune dépendance ajoutée et lockfile inchangé. |
| `npm audit` complet | **Non conforme** : mêmes **6 entrées de sévérité haute**, aucune critique, avant et après. Racine : `picomatch@4.0.7`, [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), dans l’outillage Vite/Vitest (`npm ls picomatch --all`). Le registre n’offre pas de version corrigée au contrôle. Pas de `--force`, de dérogation silencieuse ni de verdict « tout vert ». Refaire l’audit complet et les tests après correctif. |

Les essais SQL/PostgreSQL et Deno et les collectes externes de la CI ne sont pas remplacés par ces contrôles locaux. Revue par PR uniquement ; **pas de fusion, pas de publication de données et pas de déploiement**.
