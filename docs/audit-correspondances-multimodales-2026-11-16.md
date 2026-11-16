# Audit des correspondances du calculateur multimodal

Date : 16 novembre 2026  
Branche : `feature/multimodal-alternatives-and-transfers`

## Constat

Le générateur précédent créait automatiquement une correspondance entre deux réseaux lorsque deux positions étaient distantes de 120 m ou moins. Le référentiel contient pourtant des positions DDD/AFTU/TATA approximatives, parfois recopiées des coordonnées TER/BRT ou d'un autre réseau. Cette proximité ne démontre pas l'existence d'un quai partagé, d'un accès piéton ou d'un pôle de correspondance.

Un audit des coordonnées du référentiel a retrouvé **42 paires inter-réseaux** qui auraient été activées par cette seule règle :

| Réseaux rapprochés | Paires |
|---|---:|
| DDD ↔ AFTU | 10 |
| DDD ↔ TER | 3 |
| AFTU ↔ TER | 3 |
| TATA ↔ TER | 3 |
| BRT ↔ DDD | 6 |
| BRT ↔ AFTU | 3 |
| BRT ↔ TATA | 2 |
| DDD ↔ TATA | 6 |
| AFTU ↔ TATA | 6 |
| **Total** | **42** |

Plusieurs de ces paires avaient des coordonnées identiques parce que les arrêts de référence partageaient un point de quartier. Quelques paires avaient même des noms différents malgré leurs coordonnées identiques, par exemple Petersen / Papa Gueye Fall ou Guédiawaye / Préfecture de Guédiawaye. Ce n'est pas une preuve de cheminement piéton.

## Correction appliquée

Le calculateur ne crée désormais plus de correspondance à partir d'un simple rayon géographique. Il n'utilise que les deux correspondances explicitement déclarées dans `CORRIDOR_TRANSFERS` :

1. Gare TER Dakar ↔ station BRT Petersen – Papa Gueye Fall (marche de référence d'environ 1 km).
2. Gare TER Colobane ↔ station BRT Place de la Nation (marche de référence d'environ 1,4 km).

Les 42 rapprochements restent des indices géographiques à vérifier ; ils ne sont pas supprimés des données de référence et ne sont pas présentés comme des correspondances validées.

## Tests ajoutés / adaptés

- Le référentiel doit exposer exactement les correspondances déclarées, toutes marquées `declared: true`.
- Le calculateur ne doit pas relier DDD/AFTU/TATA au TER uniquement parce que des coordonnées approximatives sont proches.
- Le parcours multimodal de référence Guédiawaye → Rufisque doit rester possible via les liens TER ↔ BRT explicitement déclarés.
- Les libellés publics des dessertes AFTU et des anciens points TATA restent uniformisés sous **AFTU**.

## Périmètre protégé

Aucun tracé, arrêt, horaire ou fréquence TER/BRT n'a été modifié. Aucun GTFS, aucune donnée Supabase et aucune position de véhicule en temps réel n'ont été ajoutés. Les lignes DDD/AFTU/TATA restent des corridors de référence tant que leurs séquences et leurs pôles de correspondance ne sont pas suffisamment corroborés.
