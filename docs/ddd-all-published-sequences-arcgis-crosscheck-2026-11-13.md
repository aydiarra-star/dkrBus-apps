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


## Nouvelle source DDD « Info voyageurs » — 14 novembre 2026

La page officielle https://demdikk.sn/info-voyageurs/ a été consultée en complément de la page « Réseau urbain de Dakar ». Elle présente une liste de lignes et, pour TAF TAF, un descriptif de desserte avec premiers et derniers départs. Cette source est conservée séparément : ses nomenclatures ne doivent pas être fusionnées automatiquement avec les anciennes fiches détaillées.

### Résolution partielle du conflit de la ligne 233

La page « Info voyageurs » confirme explicitement **233 — Baux Maraîchers ↔ Palais 1** et **232 — Baux Maraîchers ↔ Aéroport LSS**. La page « Réseau urbain » conserve toutefois, sous l'en-tête 233, la même liste d'étapes que la 232 et termine à Aéroport LSS. Le terminus commercial annoncé pour 233 est donc confirmé par une seconde page officielle, mais la séquence détaillée d'arrêts de 233 reste à obtenir : **ne pas recopier la séquence de 232 dans 233**.

### Nomenclature à conserver distincte

La page « Info voyageurs » publie désormais les désignations suivantes :
- **501 : Gare de Dakar ↔ Palais 2**, alors que la fiche « Réseau urbain » consultée affiche **Palais 2 ↔ Leclerc**. Conflit officiel entre deux pages DDD ; conserver les deux observations et ne pas choisir arbitrairement.
- **502A : Colobane ↔ UCAD** et **502B : Colobane ↔ Abass Ndao** ; la fiche détaillée ancienne présente une boucle 502 Gare Colobane.
- **503A : Colobane ↔ Môle 8** et **503B : Colobane ↔ Hydrocarbure** ; la fiche détaillée ancienne présente une boucle 503 Gare Colobane.
- **504A : Gare Diamniadio ↔ Sphère Ministérielle** et **504B : Sébikotane ↔ Gare Diamniadio** ; ces deux variantes sont à inventorier séparément, sans extrapoler leurs arrêts.
- La liste « Info voyageurs » répertorie aussi 15A & 15B, 16A & 16B, et les lignes banlieue 217/218 séparément. Garder la nomenclature affichée par source et ne pas assimiler la ligne 15 simple à 15A/15B sans confirmation.

### TAF TAF : horaires publiés, mais fréquences non publiées

La page « Info voyageurs » décrit deux dessertes depuis Ouakam, l'une vers AIBD et l'autre vers Sphère Ministérielle, avec les horaires de premier et dernier départ suivants :

| Sens / destination publié | Premier départ | Dernier départ |
|---|---:|---:|
| Ouakam → AIBD | 06:00 | 21:00 |
| Ouakam → Sphère Ministérielle | 05:45 | 21:00 |
| AIBD → Ouakam | 06:00 | 21:00 |
| Sphère Ministérielle → Ouakam | 06:00 | 20:30 |

La page précise que le même circuit dessert Sphère Ministérielle, mais ne publie pas d'intervalle de passage. Ces heures ne permettent donc **pas** de déduire une fréquence ou un compte à rebours par arrêt. Les trajets AIBD et Sphère Ministérielle doivent être suivis comme deux variantes de destination, sans fusionner leurs horaires.

### Actions de données

1. Ajouter 502A/502B, 503A/503B et 504A/504B à l'inventaire des lignes à documenter, sans fabriquer leurs séquences d'arrêts.
2. Marquer 233 comme terminus commercialement confirmé vers Palais 1 par la page « Info voyageurs », mais avec séquence détaillée encore contradictoire/incomplète.
3. Marquer 501 comme conflit officiel entre « Info voyageurs » et « Réseau urbain ».
4. Enregistrer les quatre couples premier/dernier départ TAF TAF comme horaires de service publiés, sans inventer de fréquence.
5. Garder les pages sources, variantes et versions en provenance séparée ; ne pas supprimer les anciennes observations.

**Garde-fous :** aucun arrêt n'est créé à partir d'un corridor, aucun sens retour n'est reconstruit par inversion, aucune fréquence n'est calculée à partir des seuls premiers/derniers départs, aucune donnée TER/BRT n'est modifiée. Audit documentaire uniquement, sans écriture Supabase ni déploiement.


## Recoupement institutionnel complémentaire — Guide officiel de mobilité JOJ Dakar 2026

Source institutionnelle : guide de mobilité publié sur vie-publique.sn, préparé par le MITTA et le CETUD pour les JOJ du 31 octobre au 13 novembre 2026 : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf

### Ligne 504A : fonction circulaire confirmée, séquence d'arrêts non publiée

Le guide identifie explicitement la **504A comme ligne circulaire de Diamniadio vers les Sphères ministérielles**. Il indique que la ligne Dem Dikk 504 dessert les quatre sites du pôle olympique depuis la gare TER de Diamniadio : Centre équestre, Dakar Arena, Stade Abdoulaye Wade et Centre des expositions de Diamniadio. La 504A est également indiquée comme liaison après TER ou GTS pour rejoindre ces sites.

**Conséquence pour la base :** on peut qualifier le type de service de 504A comme circulaire et confirmer le périmètre des quatre sites. En revanche, le guide ne fournit pas une liste ordonnée d'arrêts routiers, ni un sens aller/retour autonome, ni une fréquence DDD. Ne pas convertir la fréquence TER de 8 minutes mentionnée dans le même paragraphe en fréquence de bus 504A. La variante 504B Sébikotane ↔ Gare Diamniadio est confirmée par la page DDD Info voyageurs, mais sa séquence détaillée reste absente.

### Ligne 233 : confirmation indépendante du terminus Palais

Le guide CETUD/MITTA répertorie la ligne **233 — Baux Maraîchers ↔ Palais** parmi les lignes Dem Dikk desservant les sites de Dakar, notamment la Piscine olympique. Cette preuve institutionnelle indépendante renforce la page DDD « Info voyageurs » qui annonce Baux Maraîchers ↔ Palais 1. La fiche DDD « Réseau urbain » continue toutefois à afficher, sous l'en-tête 233, une séquence identique à la 232 se terminant à Aéroport LSS. Le terminus commercial vers le Palais est donc corroboré ; la séquence détaillée publiée sous le numéro 233 reste contradictoire et ne doit pas être réutilisée telle quelle.

### Portée des variantes 502A/B et 503A/B

La page officielle DDD « Info voyageurs » demeure la seule source officielle trouvée à ce stade pour les corridors suivants :
- 502A Colobane ↔ UCAD
- 502B Colobane ↔ Abass Ndao
- 503A Colobane ↔ Môle 8
- 503B Colobane ↔ Hydrocarbure

Le guide de mobilité JOJ ne fournit pas de séquences détaillées pour ces variantes. Les anciennes séquences circulaires 502 et 503 de la page « Réseau urbain » ne peuvent pas être découpées arbitrairement entre A et B. Les quatre corridors sont donc enregistrés comme services officiellement annoncés, mais leurs arrêts intermédiaires et horaires restent à documenter.

### Sources et limites conservées

- DDD Info voyageurs : https://demdikk.sn/info-voyageurs/
- DDD Réseau urbain : https://demdikk.sn/reseau-urbain-dakar/
- Guide officiel MITTA/CETUD JOJ 2026 : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf

Aucune donnée de circulation temporaire JOJ n'est considérée comme un horaire permanent. Aucun intervalle navette JOJ n'est attribué à un service DDD régulier. Aucun nouvel arrêt, sens ou temps de passage n'est inventé.
