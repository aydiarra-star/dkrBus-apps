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


## Actualisation de la liste prioritaire — 14 novembre 2026

Le nouvel artefact de comparaison globale confirme les **17 séquences sans groupe de points ArcGIS portant le même code**. Cette absence de groupe ne signifie pas que la ligne n'existe pas : elle signifie seulement qu'aucun groupe de points de la couche comparée n'a été rapproché sous ce code.

| Code DDD publié | Départ publié | Arrivée publiée | Point de vigilance |
|---|---|---|---|
| 20 | Dieuppeul | Centre-ville | Aucun groupe de points de même code |
| 208 | Bayakh | Rufisque | Aucun groupe de points de même code |
| 213 | Rufisque | Dieuppeul | Aucun groupe de points de même code |
| 219 | Daroukhane | Ouakam | Géométrie de ligne présente ; points candidats observés sous l'étiquette 218, à confirmer sans réétiquetage automatique |
| 220 | Rufisque | Guédiawaye | Aucun groupe de points de même code |
| 221 | Gadaye | Almadies | Aucun groupe de points de même code |
| 233 | Baux Maraîchers | Palais 1 | Conflit : la séquence extraite se termine à Aéroport LSS ; le titre officiel indique Palais 1 |
| 234 | Jaxaay | Leclerc | Aucun groupe de points de même code |
| 311 | Lac Rose | Croisement Keur Massar | Aucun groupe de points de même code |
| 327 | Keur Massar | Terminus Parcelles | Aucun groupe de points de même code |
| TO1 | Ouakam | Palais 2 | Aucun groupe de points de même code |
| 319 | Liberté 6 | Ouakam | Aucun groupe de points de même code |
| 501 | Non renseigné | Non renseigné | Code présent dans les séquences publiées, terminus absents |
| 502 | Non renseigné | Non renseigné | Code présent dans les séquences publiées, terminus absents |
| 503 | Non renseigné | Non renseigné | Code présent dans les séquences publiées, terminus absents |
| TAF_TAF | Non renseigné | Non renseigné | Libellé publié à qualifier, terminus absents |
| 15 | Non renseigné | Non renseigné | Code présent dans les séquences publiées, terminus absents |

### Priorité de rapprochement

1. **219** : traiter d'abord le conflit d'étiquetage entre la géométrie 219 et les points enregistrés sous 218 ; garder les identifiants et doublons d'origine.
2. **233** : résoudre le conflit de terminus avec une source DDD explicite avant toute publication.
3. **20, 208, 213, 220, 221, 234, 311, 327, TO1 et 319** : chercher les couches ArcGIS alternatives et relations OSM portant des références ou terminus compatibles.
4. **501, 502, 503, TAF_TAF et 15** : retrouver d'abord une fiche officielle donnant les terminus ; ne pas déduire les extrémités à partir du seul code.

Ce contrôle reste un rapprochement de sources. Il ne valide ni sens retour, ni ordre de passage, ni fréquence. Aucun parcours passager n'est modifié et aucun point n'est automatiquement réaffecté.


## Complément officiel retrouvé sur la page DDD — 14 novembre 2026

La page actuelle « Réseau urbain de Dakar » a été relue directement : https://demdikk.sn/reseau-urbain-dakar/. Elle fournit des terminus et des séquences publiées pour plusieurs lignes qui étaient jusque-là décrites dans ce rapport comme ayant des terminus non renseignés. Cette page corrige donc le statut documentaire, sans changer le constat ArcGIS : ces lignes n'ont toujours pas de groupe de points portant le même code dans la couche comparée.

| Code | Terminus / corridor désormais visibles sur la page DDD | Détail publié |
|---|---|---|
| 20 | Dieuppeul ↔ Centre-ville | Séquence publiée détaillée |
| 208 | Bayakh ↔ Rufisque | Gorom 01, Gorom 02, Bambilor, Noflaye, Sangalkam, Keur Ndiaye Lo, Rufisque |
| 213 | Rufisque ↔ Dieuppeul | Séquence publiée détaillée |
| 219 | Daroukhane ↔ Ouakam | 19 repères publiés ; la séquence ArcGIS candidate reste sous l'étiquette source 218 |
| 220 | Rufisque ↔ Guédiawaye | Séquence publiée détaillée |
| 221 | Gadaye ↔ Almadies | Séquence publiée détaillée |
| 233 | Baux Maraîchers ↔ Palais 1 | **Conflit maintenu** : la liste de repères se termine à Aéroport LSS |
| 234 | Jaxaay ↔ Leclerc | Séquence publiée détaillée |
| 311 | Lac Rose ↔ Croisement Keur Massar | Séquence courte publiée ; la page mentionne « Retour vers Lac Rose » |
| 327 | Keur Massar ↔ Terminus Parcelles | Séquence publiée détaillée |
| 319 | Liberté 6 ↔ Ouakam | Séquence publiée détaillée |
| TO1 | Ouakam ↔ Palais 2 | Séquence publiée détaillée |
| 501 | Palais 2 ↔ Leclerc | Séquence publiée détaillée |
| 502 | Gare Colobane ↔ Gare Colobane | Boucle publiée |
| 503 | Gare Colobane ↔ Gare Colobane | Boucle publiée |
| TAF_TAF | Ouakam → AIBD dans la séquence affichée | Liste publiée ; le titre ne précise pas de terminus opposé |
| 15 | Rufisque ↔ Palais 1 | Séquence publiée détaillée |

### Corrections d'interprétation

- Les terminus de 501, 502 et 503 ne sont plus « non renseignés » : la page DDD affiche Palais 2 ↔ Leclerc pour 501 et des boucles Colobane pour 502/503.
- Le libellé TAF_TAF reste distinct de TO1 : la page affiche une desserte Ouakam–AIBD pour TAF TAF, tandis que TO1 est explicitement Ouakam–Palais 2. Ne pas les fusionner.
- La ligne 15 est publiée comme Rufisque ↔ Palais 1 ; conserver cette ligne distincte de 15A/15B tant que la nomenclature officielle ne confirme pas une équivalence.
- La ligne 219 est maintenant confirmée par la page officielle avec terminus Ouakam et 19 repères. Le nom ArcGIS « Daroukhane – marché Ndiarème » correspond à un libellé de géométrie, pas à une preuve de terminus final au marché Ndiarème.
- La ligne 233 conserve un conflit réel entre son en-tête Palais 1 et sa séquence textuelle qui se termine à Aéroport LSS.

**Important :** ces découvertes enrichissent les références documentaires et les terminus publiés. Elles ne créent toujours aucun groupe ArcGIS de même code, ne fournissent pas les coordonnées de chaque arrêt, ne valident pas un sens retour indépendant et ne donnent pas de fréquence. Les boucles 502/503 et la mention de retour de 311 doivent être conservées comme telles, sans être artificiellement séparées en deux séquences.
