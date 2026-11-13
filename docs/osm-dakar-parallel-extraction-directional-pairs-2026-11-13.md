# Extraction OSM accélérée et rapprochement directionnel — 13 novembre 2026

## Exécution et provenance

- Dépôt : `aydiarra-star/dkrBus-apps`
- Branche : `feat/admin-stop-sequence-audit-phase-a`
- Commit de l'extraction : `29c4b770aebc3e81de7dd0393f1dde9d522cbf26`
- Workflow OSM : run `43460722319`, terminé avec succès le 13/11/2026 à 16:15:41 UTC.
- Artefact : `dakar-osm-route-candidates`, ID `14055144464`, SHA-256 `d8fd5df155c575b1e33bcae7e0e6d06bb545719f16b8594961fbb428411993b7`.
- Attribution : © OpenStreetMap contributors, ODbL.

L'exporteur interroge maintenant trois instances Overpass en parallèle, accepte uniquement la première réponse JSON complète et valide, puis tente un second groupe si nécessaire. Les requêtes perdantes sont annulées. Le contenu de la requête géographique, la boîte de Dakar et la conservation des membres ordonnés n'ont pas été changés.

## Résultat de l'extraction

| Mesure | Résultat |
|---|---:|
| Éléments OSM extraits | 6 610 |
| Relations de lignes de bus | 25 |
| Relations maîtresses | 2 |
| Relations candidates Dakar | 23 |
| Relations avec arrêts/quais ordonnés | 18 |
| Membres d'arrêt/quai ordonnés | 522 |
| Relations sans arrêt/quai ordonné | 7 |
| Conflits de périmètre | 2 |

Les séquences de membres sont conservées indépendamment par relation. Une relation OSM reste une preuve cartographique communautaire, pas une validation de service opérateur, d'exhaustivité des arrêts, d'horaires ou de fréquence.

## Six paires directionnelles candidates

Le script d'analyse a identifié six paires, dont cinq avec terminus inversés et deux liées à une relation maîtresse (les catégories se chevauchent).

| Référence | Relation A — sens et arrêts | Relation B — sens et arrêts | Diagnostic |
|---|---|---|---|
| DDD 4 | 6990830 — Leclerc → Liberté 5, 34 | 7203970 — Liberté 5 → Leclerc, 32 | Terminus inversés ; B correspond au sens publié Liberté 5 → Place Leclerc |
| DDD 7 | 6990669 — Palais → Ouakam, 31 | 7500475 — Ouakam → Palais 1, 34 | Même relation maîtresse ; terminus « Palais » / « Palais 1 » à désambiguïser |
| DDD 9 | 6996431 — Palais 1 → Liberté 6, 32 | 7487218 — Liberté 6 → Palais 1, 29 | Terminus inversés ; B suit le départ publié Liberté 6, mais Palais 1 ne doit pas être assimilé à Palais 2 |
| DDD 10 | 6990845 — Palais 1 → Liberté 5, 30 | 7488283 — Liberté 5 → Palais 1, 25 | Terminus inversés ; B suit le départ publié Liberté 5, mais le terminus diffère de Palais 2 |
| DDD 23 | 7108131 — Parcelles Assainies → Palais 1, 47 | 7495279 — Palais 1 → Parcelles-Assainies, 51 | Terminus inversés et relation maîtresse partagée ; A suit le sens publié, mais la relation 7108131 porte la référence composée L23;L5 |
| B1 | 19961937 — Préfecture de Guédiawaye → Petersen, 50 | 19961993 — Petersen → Préfecture de Guédiawaye, 50 | Terminus inversés ; candidat OSM séparé, sans preuve d'opérateur identique |

Les deux séquences de chaque paire restent distinctes et dans leur ordre OSM. Les comptes d'arrêts sont ceux des membres OSM ayant un rôle stop/platform ; ils ne sont pas assimilés à des listes officielles exhaustives.

### Points à ne pas fusionner

- « Palais », « Palais 1 », « Palais 2 » et « Palais de Justice » restent des lieux/terminus distincts tant qu'une preuve géographique ne les relie pas.
- La relation 7108131 garde intégralement sa référence composée `L23;L5` ; elle n'est pas attribuée automatiquement à la seule ligne 23.
- La paire B1 est une piste OSM et ne modifie en rien les données TER/BRT déjà validées.
- Les directions ne sont jamais créées par simple inversion d'une séquence publiée.

## Contrôles DDD ArcGIS et AFTU/TATA déjà disponibles

Les workflows ArcGIS du même commit ont réussi :

- Service ArcGIS DDD mis à jour : 777 entités d'arrêts, 25 entités de tracés, 750 arrêts nommés, 775 arrêts avec géométrie et 24 tracés avec géométrie.
- Contrôle des séquences publiées sur six lignes de banlieue (217, 218, 219, 227, 228 et 232) : 168 entités nommées, 7 correspondances ordonnées par LCS. L'ordre de réponse ArcGIS n'est pas présumé être l'ordre opérationnel.
- Projection spatiale sur les géométries de tracé : 111 des 168 arrêts à 25 m ou moins de leur tracé propre ; 112 à 100 m ou moins. Ce test est spatial, pas une validation de l'ordre de passage.
- Inventaire ArcGIS : 24 couches de tracé sur 24 et 12 couches d'arrêts sur 12 récupérées, sans erreur ni dépassement de limite.

Le workflow officiel AFTU a également réussi : 65 pages avec texte d'itinéraire récupérées. Sept URL complémentaires (lignes 84, 85, 86, 87, 88, 89 et 91) renvoient HTTP 404 ; elles restent des lacunes documentaires, sans itinéraire extrapolé. La relation OSM AFTU 40 ne possède aucun membre d'arrêt ordonné dans cette extraction : ses ways sont un fragment géométrique, pas une séquence d'arrêts validée.

## Étapes suivantes

1. Rapprocher les lignes DDD restantes entre fiche publiée, corridor et géométrie ArcGIS, points nommés ArcGIS et séquences OSM ; traiter les terminus ambigus séparément.
2. Exploiter les points ArcGIS et leur projection sur les tracés pour proposer un ordre candidat, sans confondre ordre de réponse et ordre de passage.
3. Poursuivre les fiches AFTU récupérées en géocodant les corridors et en vérifiant les relations OSM par opérateur, terminus, géométrie et sens.
4. Étendre le même rapprochement aux lignes TATA ; ne pas convertir automatiquement les routes en arrêts.
5. Garder toutes les données candidates en audit jusqu'à validation. Aucun catalogue passager, horaire, fréquence, base Supabase ou environnement de production n'a été modifié.
