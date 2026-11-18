# Audit des relations de bus OSM — Dakar — 18 novembre 2026

## Source et périmètre

- Source : extrait PBF Geofabrik Sénégal et Gambie, filtré par appartenance à l'emprise de Dakar.
- URL source : https://download.geofabrik.de/africa/senegal-and-gambia-latest.osm.pbf
- Instantané analysé : 18 novembre 2026 à 13:25 UTC.
- Emprise : 14.50–14.95 N, 17.60–17.05 O.
- Attribution : © OpenStreetMap contributors.
- Licence : ODbL-1.0.

Le traitement conserve l'ordre des membres de relation, les rôles, les identifiants de nœuds, les métadonnées OSM et chaque way séparément. Il mesure les connexions par identifiants de nœuds partagés. Il ne raccorde, ne réordonne et ne dessine jamais les ways discontinus.

## Résultats de l'extraction

| Indicateur | Résultat |
|---|---:|
| Relations `type=route, route=bus` | 25 |
| Relations `type=route_master` | 5 |
| Relations bus avec membres d'arrêts | 18 / 25 |
| Relations bus avec ways routiers | 25 / 25 |
| Relations bus topologiquement candidates à un chemin simple | 9 / 25 |

Attribution des 25 relations de type `route` :
- 15 attribuées explicitement à Dakar Dem Dikk ;
- 1 attribuée à AFTU/TATA ;
- 2 attribuées à SunuBRT ;
- 2 attribuées à APSRTC ;
- 4 sans opérateur/réseau exploitable ;
- 1 avec une attribution générique « transport en commun ».

Le décompte de 19 relations DDD dans le résumé global inclut également des relations `route_master` ; il ne faut pas le confondre avec les 15 relations de ligne `type=route`.

## Résultats utiles pour DDD et AFTU/TATA

| Relation | Arrêts | Ways | Composantes | Branches | Conclusion |
|---|---:|---:|---:|---:|---|
| DDD 1 — Parcelles / Leclerc (6951328) | 38 | 66 | 4 | 5 | Fragmentée |
| DDD 10 — Palais / Liberté (6990845) | 30 | 64 | 5 | 4 | Fragmentée |
| DDD 10 — Liberté / Palais (7488283) | 25 | 72 | 2 | 6 | Fragmentée |
| DDD 4 — Leclerc / Liberté (6990830) | 34 | 56 | 4 | 0 | Fragmentée |
| DDD 4 — Liberté / Leclerc (7203970) | 32 | 61 | 3 | 0 | Fragmentée |
| DDD 7 — Palais / Ouakam (6990669) | 31 | 64 | 4 | 4 | Fragmentée |
| DDD 7 — Ouakam / Palais (7500475) | 34 | 57 | 4 | 4 | Fragmentée |
| DDD 121 — « Ligne 121 » (2792903) | 3 | 4 | 1 | 0 | Candidat incomplet |
| AFTU/TATA 40 (3982642) | 0 | 31 | 5 | 3 | Aucun arrêt ; fragmentée |

La relation DDD 121 (2792903) est topologiquement continue, mais ne décrit que trois arrêts et quatre ways. Une seconde relation 121 (6999013) comporte sept arrêts et 18 ways, mais son attribution opérateur n'est pas portée explicitement par la relation elle-même. Ces éléments sont des pistes de revue manuelle, pas des lignes commerciales certifiées.

La relation AFTU/TATA 40 ne contient aucun membre d'arrêt ; ses 31 ways sont répartis en cinq composantes et trois nœuds de branchement. Elle ne peut pas être utilisée pour construire un itinéraire passager.

## Interprétation et décision

Aucune des relations DDD/AFTU/TATA examinées ne fournit à elle seule les preuves nécessaires pour activer une ligne dans le calculateur : attribution explicite, numéro exact, arrêts ordonnés, continuité géométrique et deux sens contrôlés.

Les neuf candidats topologiques simples ne sont pas neuf lignes DDD/AFTU utilisables : ils comprennent notamment les deux relations BRT B1, des relations APSRTC, des relations sans attribution et les relations 121 incomplètes. Un résultat topologique positif n'est donc pas une validation commerciale.

Décision :
- conserver ces relations comme preuves d'audit uniquement ;
- ne pas activer automatiquement les lignes DDD/AFTU/TATA à partir de ces données ;
- ne pas assembler les composantes disjointes, même lorsqu'elles sont proches géographiquement ;
- exiger une vérification séparée de l'ordre des arrêts, de l'attribution et de chaque sens avant activation ;
- ne modifier aucun horaire, fréquence ou tracé de référence TER/BRT.

## Reproductibilité

L'artefact `dakar-bus-route-relations` du workflow CI contient le JSON complet, avec identifiants de relations et de nœuds, versions, horodatages, changesets, utilisateurs, membres ordonnés et audit topologique. Le script `scripts/extract_dakar_bus_route_relations_from_pbf.py` produit cet audit sans fabriquer de géométrie.
