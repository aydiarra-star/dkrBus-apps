# Extraction AFTU — bilan des fiches officielles et des pages manquantes

Date de contrôle : 13 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`

## Résultat de l'extraction

Le workflow de récupération des fiches officielles AFTU a terminé avec succès et a produit un artefact JSON.

| Indicateur | Résultat |
|---|---:|
| Liens de fiches repérés dans « Infos pratiques » | 63 |
| Pages supplémentaires testées par URL directe | 9 |
| Fiches récupérées | 65 |
| Fiches avec texte d'itinéraire | 65 |
| Fiches récupérées sans itinéraire exploitable | 0 |
| Erreurs de récupération | 7 |

Les 9 pages supplémentaires testées comprennent les deux pages directes 27 et 36, récupérées, et les sept pages 84, 85, 86, 87, 88, 89 et 91, qui répondent HTTP 404 à l'URL conventionnelle testée.

## Décision

- Les 65 fiches récupérées sont conservées comme descriptions de corridors publiées par AFTU.
- Les descriptions de rues ne sont pas transformées artificiellement en arrêts physiques individuels.
- Les sept pages en 404 restent des lacunes de source ; leur présence dans la liste officielle et leurs terminus ne suffisent pas à reconstituer une séquence détaillée.
- Aucun sens retour n'est créé par inversion.
- Aucune fréquence n'est déduite des descriptions.

## Robustesse du collecteur

Le collecteur `scripts/export_aftu_official_routes.mjs` a été renforcé après une erreur réseau transitoire `ETIMEDOUT` :
- trois tentatives avec délais progressifs pour les erreurs réseau temporaires, timeouts, HTTP 429 et erreurs serveur ;
- aucune répétition pour les erreurs HTTP client non temporaires ;
- si l'index AFTU est indisponible, un artefact explicite `SOURCE_UNAVAILABLE` est produit plutôt que de faire échouer le workflow sans résultat ;
- aucune donnée ancienne ou supposée n'est substituée à une page inaccessible.

Le statut du collecteur décrit la disponibilité de la source ; il ne transforme pas les 65 descriptions en itinéraires voyageurs validés.

## Garde-fous

Aucun GTFS utilisé. Aucune écriture Supabase. Aucun déploiement. Aucun changement TER/BRT. Aucun ajout automatique au catalogue passager.
