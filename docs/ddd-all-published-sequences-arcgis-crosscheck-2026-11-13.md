# Rapprochement global des séquences DDD publiées avec ArcGIS actualisé

Date : 13 novembre 2026.

## Exécution

- Dépôt : `aydiarra-star/dkrBus-apps`
- Branche : `feat/admin-stop-sequence-audit-phase-a`
- Workflow : `43462691578` — terminé avec succès.
- Commit testé : `f47dcbb57d3bde402ffbc5ae62dc04131203428b`.
- Artefact : `ddd-updated-service-and-sequence-audit`, ID `14056343355`.

Le nouveau script `scripts/compare_ddd_all_published_arcgis_sequences.mjs` rapproche les séquences de `dddPublishedRoutes.ts`, `dddSuburbanPublishedRoutesA.ts` et `dddSuburbanPublishedRoutesB.ts` des points du service ArcGIS DDD actualisé. Il conserve la liste DDD principale comme référence et n'ajoute une séquence banlieue que si son code de ligne n'est pas déjà présent. Les variantes ne sont pas fusionnées.

## Résultats

| Indicateur | Résultat |
|---|---:|
| Séquences publiées comparées | 39 |
| Séquences avec un groupe ArcGIS portant le même code de ligne | 22 |
| Séquences sans groupe ArcGIS de même code | 17 |
| Enregistrements ArcGIS examinés dans les groupes rapprochés | 775 |
| Paires de noms normalisés distincts communs | 56 |
| Correspondances LCS dans l'ordre de réponse ArcGIS | 56 |

## Interprétation

- Les 22 groupes avec un code ArcGIS correspondant sont des rapprochements candidats. Le code de ligne identique n'établit pas à lui seul que chaque point appartient à la séquence publiée.
- Les 17 séquences sans groupe ArcGIS de même code ne sont pas considérées comme inexistantes : elles peuvent ne pas être couvertes par ce service, ou être libellées différemment. Elles restent à rechercher dans les autres couches et sources.
- Les 56 paires de noms communs sont des indices de correspondance textuelle après normalisation des accents, de la casse et des préfixes génériques.
- Les 56 correspondances LCS comparent l'ordre de réponse des entités ArcGIS à l'ordre publié DDD uniquement à titre de diagnostic. L'ordre de réponse d'une couche ArcGIS n'est pas une séquence de circulation validée. Il ne doit pas être utilisé pour reconstruire un trajet passager.
- Les noms répétés, points anonymes, identifiants GlobalID/OBJECTID et géométries sont conservés individuellement dans l'artefact JSON.

## Prochaine priorité

1. Examiner les 17 séquences sans groupe ArcGIS correspondant par code, en recherchant les variantes de libellés, les couches historiques et les relations OSM.
2. Examiner les groupes avec correspondances textuelles, en contrôlant séparément les terminus et les noms ambigus.
3. Utiliser les géométries de tracé pour confirmer les corridors, jamais pour inventer un ordre d'arrêt.
4. Rechercher les sources propres au sens retour ; aucune séquence retour n'est créée par inversion.
5. Poursuivre séparément les lignes AFTU et les fiches TATA.

## Garde-fous

Audit documentaire en lecture seule. Aucun arrêt ni itinéraire n'est promu dans le catalogue passager. Aucune fréquence ou aucun horaire n'est déduit. Aucun GTFS utilisé. Aucune écriture Supabase, aucun déploiement et aucune modification TER/BRT.
