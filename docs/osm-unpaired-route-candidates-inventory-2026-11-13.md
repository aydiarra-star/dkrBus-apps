# Inventaire des relations OSM candidates non appariées — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Extraction Overpass : 13 novembre 2026, 18:05 UTC  
Attribution : © OpenStreetMap contributors, ODbL

## Résultat de l'analyseur amélioré

L'extraction conserve 23 relations candidates Dakar. Six paires directionnelles candidates sont détectées (cinq par terminus inversés et deux avec relation maître partagée, certaines appartenant aux deux catégories). L'analyseur conserve désormais aussi les **11 relations candidates non appariées**, au lieu de les laisser hors du rapport.

Un conflit explicite entre la référence de ligne et le nom de relation est détecté.

## Inventaire des 11 relations

| Relation OSM | Référence | Nom | Membres ordonnés | Motif |
|---:|---|---|---:|---|
| 1434825 | 36 | ligne 36 | 0 | Terminus absents |
| 2792903 | 121 | Ligne 121 | 3 | Fragment sans terminus |
| 3853555 | — | — | 0 | Métadonnées absentes |
| 3982642 | 40 | Ligne 40 (AFTU/TATA) | 0 | Terminus et arrêts absents |
| 6951328 | 1 | 1 Parcelles - Leclerc | 38 | Aucun inverse candidat retrouvé |
| 6990794 | 121 | 121 Hlm Grand Yoff - Leclerc | 27 | Aucun inverse strict retrouvé |
| 6999013 | 121 | 121 Leclerc - HLM Grand Medine | 7 | Terminus différents de HLM Grand Yoff |
| 7495137 | 8 | Ligne 8 | 0 | Aucun membre d'arrêt ordonné |
| 7499433 | 6 | 7 Palais 1 → Parcelles-Assainies | 1 | **Référence 6 / nom 7 contradictoires** |
| 7499475 | 18 | — | 0 | Terminus génériques, sans séquence |
| 14222002 | — | — | 1 | Référence et terminus absents |

Les relations 1434825, 2792903, 3982642, 3853555 et 14222002 ne peuvent pas être transformées en itinéraires à partir des seules métadonnées disponibles. Les relations 6951328, 6990794, 6999013 et 7495137 possèdent des informations partielles à rapprocher de sources opérateur et des couches géographiques. La relation 7499475 ne permet pas d'identifier des terminus réels.

## Conflit à ne pas masquer : relation 7499433

La relation 7499433 porte `ref=6`, mais son nom commence par `7`. Elle ne possède qu'un membre anonyme. Elle ne doit donc être attribuée ni à la ligne 6 ni à la ligne 7 dans l'application avant vérification.

## Protection contre les rapprochements inter-lignes

L'analyseur directionnel exclut désormais toute relation portant plusieurs références de ligne de ses groupes de paires. Par exemple, une relation `L23;L5` reste visible dans l'inventaire non apparié avec le motif `AMBIGUOUS_MULTIPLE_ROUTE_REFS_NOT_PAIRED`. Elle ne peut plus servir à créer une paire directionnelle sous la ligne 23 ou sous la ligne 5. Le résumé JSON compte séparément ces candidats ambigus. Cette règle évite qu'une référence composite soit silencieusement utilisée pour relier deux lignes différentes.

Le CI contrôle maintenant aussi la syntaxe de `scripts/analyze_dakar_osm_directional_pairs.mjs`.

## Recontrôle sur extraction fraîche — 18:16 UTC

Le workflow en lecture seule du 13 novembre a récupéré 6 610 éléments OSM, 25 relations de lignes et 2 relations maîtres. Le périmètre Dakar retient 23 relations candidates, dont 18 avec membres d'arrêts/quais ordonnés (522 membres au total) et 7 relations sans séquence d'arrêts exploitable.

L'analyseur directionnel a détecté 5 paires candidates : quatre par terminus inversés et une par relation maître partagée. Les références concernées sont 4, 7, 9, 10 et B1. Elles restent des candidates et non des lignes validées. Treize relations restent non appariées ; le résumé signale explicitement 1 référence multiple ambiguë et 1 conflit entre la référence et le nom.

Contrôles ciblés confirmés dans l'inventaire :
- Les trois relations portant la référence 121 restent séparées : deux fragments ont des terminus incompatibles entre eux et la troisième ne possède que trois membres anonymes.
- La relation 7499433 reste en conflit (ref=6, nom commençant par 7) et ne rejoint aucune paire.
- La relation L23;L5 reste ambiguë et exclue de tout appariement inter-lignes.

Aucun trajet manquant, arrêt, sens ou horaire n'est créé à partir de ces éléments. L'extraction et l'analyse sont reproductibles via le workflow « Audit Dakar OSM bus routes (read only) ».

## Prochaines priorités

1. DDD 1 : confronter les 38 membres ordonnés de la relation 6951328 aux séquences DDD officielles et aux arrêts ArcGIS.
2. DDD 121 : rapprocher les trois relations conservées et leurs géométries sans inventer une paire aller/retour.
3. DDD 8 : rechercher les membres d'arrêt manquants dans les sources géographiques et les pages opérateur.
4. DDD 36 et 18 : vérifier si les couches ArcGIS et les fiches officielles apportent des terminus et des séquences.
5. AFTU/TATA 40 : traiter séparément de DDD ; ne pas confondre les opérateurs ni inventer des arrêts.
6. Relation 7499433 : garder le conflit 6/7 visible jusqu'à corroboration externe.

## Garde-fous

Cet inventaire est une liste de pistes OSM, pas un catalogue d'itinéraires validés. Aucun arrêt n'est supprimé, fusionné ou renommé. Aucun retour n'est fabriqué. Aucune fréquence ou heure n'est calculée. Aucun GTFS utilisé. Aucune écriture Supabase, aucun déploiement et aucune modification TER/BRT ou de l'affichage passager.
