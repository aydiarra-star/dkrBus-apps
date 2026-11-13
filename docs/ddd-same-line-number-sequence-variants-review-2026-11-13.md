# Variantes DDD de même numéro — contrôle des séquences urbaines et banlieue

Date : 13 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`

## Objectif

Contrôler les numéros de lignes présents à la fois dans `src/data/dddPublishedRoutes.ts` et dans `src/data/dddSuburbanPublishedRoutesA.ts`. Le rapprochement ArcGIS global conserve la séquence principale lorsqu'un numéro existe déjà ; il faut donc documenter les variantes écartées du rapprochement agrégé afin qu'elles ne disparaissent pas de l'audit.

## Résultats vérifiés dans les fichiers du dépôt

| Ligne | Référentiel principal | Variante banlieue | Écart observé | Traitement |
|---|---|---|---|---|
| 2 | Daroukhane → Place Leclerc | Même corridor et même enchaînement général | Différences de graphie/casse : « Route des Niayes » / « Rte des Niayes », « Péage Pikine » / « PEAGE Pikine », « Gare de Dakar » / « Gare de dakar » | Variante textuelle à conserver ; pas de nouvel arrêt déduit |
| 5 | Guédiawaye → Palais 1 | Même corridor et même enchaînement général | « Marché Jeudi » / « Marche Jeudi » ; annotation supplémentaire « Direction Général ASCENA » accolée à « Avenue Jean Jaurès » dans la variante | Conserver l'annotation comme différence de source ; ne pas créer un arrêt ASCENA séparé sans preuve |
| 6 | Cambérène 2 → Palais 2 | La variante commence à « Terminus Guédiawaye » et termine à « Palais 1 » | La variante ajoute « Camberene » entre « Hôpital Dalal Diam » et « Case PA » ; terminus de départ et d'arrivée différents | Divergence majeure ; deux versions non fusionnées et non substituées |

## Détail prioritaire — ligne 6

La séquence principale contient 25 repères et indique :
- origine : Cambérène 2 ;
- passage de « Marché Jeudi » à « Hôpital Dalal Diam », puis « Case PA » ;
- terminus : Palais 2.

La variante banlieue contient également 25 repères, mais indique :
- origine : Guédiawaye ;
- passage de « Marché Jeudi » à « Hôpital Dalal Diam », puis « Camberene », puis « Case PA » ;
- terminus : Palais 1.

Le même nombre de repères ne rend pas ces séquences équivalentes. Les différences peuvent refléter une variante de desserte, une différence de fiche ou une erreur de transcription ; les fichiers seuls ne permettent pas de trancher. Il faut donc rechercher une fiche opérateur datée, un tracé géographique corroborant et les deux sens avant toute canonicalisation.

## Conséquence pour les rapprochements ArcGIS

Le script `scripts/compare_ddd_all_published_arcgis_sequences.mjs` conserve la séquence principale et n'ajoute une séquence banlieue que si son numéro n'est pas déjà représenté. C'est une règle utile pour éviter les doublons dans le tableau global, mais elle ne constitue pas une validation des variantes de même numéro.

Pour la suite :
1. garder un inventaire séparé des variantes de même numéro ;
2. comparer chaque variante avec les couches ArcGIS et les relations OSM, sans supposer que l'ordre de réponse ArcGIS est l'ordre de circulation ;
3. vérifier séparément origine, terminus et arrêts distinctifs ;
4. ne fusionner ou remplacer aucune séquence avant preuve opérateur ;
5. ne créer aucun sens retour par inversion.

## Périmètre et garde-fous

Contrôle documentaire en lecture seule des fichiers du dépôt. Aucun arrêt n'est supprimé ou renommé. Aucune fréquence ou aucun horaire n'est inféré. Aucun GTFS utilisé. Aucun changement TER/BRT, aucune écriture Supabase, aucun déploiement et aucune modification du catalogue passager.
