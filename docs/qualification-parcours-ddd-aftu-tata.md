# État de qualification des parcours DDD, AFTU et TATA

Document de travail établi à partir des registres versionnés dans le dépôt. Il décrit la structure des données disponibles ; il ne certifie aucun parcours comme officiel ou exploitable pour un calculateur passager.

## Ce que le dépôt contient

| Réseau | Données disponibles | Ce qui manque encore |
|---|---|---|
| DDD | Un catalogue de lignes et terminus ; des séquences de repères publiées pour certaines lignes, avec URL, date de consultation et type « ordre publié » ou « circuit publié » | Séquences distinctes Aller et Retour vérifiées ; correspondance certaine de chaque repère textuel avec un identifiant d’arrêt ; validation des coordonnées |
| AFTU | Catalogue de lignes et terminus avec une source de référence | Séquences ordonnées propres à chaque sens, vérifiées sur une source exploitable |
| TATA (appellation des minibus AFTU) | Fiches secondaires de parcours conservées comme preuves de comparaison ; rattachement à une ligne AFTU à établir par terminus, corridor et GIE | Correspondance certaine avec l'identifiant AFTU, variantes par sens et éventuelles lignes historiques/non concordantes |

## Règles de qualification

1. Une liste de terminus n'est pas un itinéraire détaillé.
2. Une séquence publiée dans un seul ordre ne prouve pas le sens opposé.
3. Un circuit ou une boucle reste un circuit : il n'est pas découpé automatiquement en Aller et Retour.
4. Un repère textuel ne devient pas un arrêt géolocalisé par simple rapprochement de nom.
5. Les coordonnées ne sont ni interpolées ni déduites de la position d'un arrêt voisin.
6. Un sens ne devient « vérifié » qu'après contrôle humain de sa propre séquence et de sa source.
7. Les séquences et les propositions de l'IA restent isolées du catalogue passager jusqu'à validation humaine.

## État détecté par le contrôle automatique

Le module `getCurrentBusRouteAudit()` parcourt le catalogue DDD/AFTU/TATA réellement importé par le domaine. Il compte chaque ligne et ses deux sens, signale les séquences absentes, les statuts non vérifiés et les séquences invalides, et conserve la provenance attachée à chaque constat.

Le contrôle est en lecture seule. Il ne modifie ni les lignes, ni les arrêts, ni les horaires, ni Supabase. Les constats portent le statut `NEEDS_HUMAN_REVIEW`.

## Priorité de récupération

- **DDD :** exploiter les fiches itinéraires publiées ligne par ligne ; transcrire séparément les sens lorsqu'ils sont réellement décrits ; garder les boucles comme telles.
- **AFTU :** récupérer les fiches de parcours par ligne auprès de l'opérateur ou de sources identifiables ; ne pas déduire les arrêts depuis les seuls terminus.
- **TATA :** traiter « Tata » comme une appellation courante des minibus du réseau AFTU, et non comme un opérateur automatiquement distinct. Conserver les fiches secondaires TATA comme preuves de comparaison ; les rattacher à une ligne AFTU seulement après rapprochement des terminus, du corridor, du GIE et des variantes. Ne pas compter deux fois une même desserte.
- **Tous réseaux :** associer chaque arrêt à un identifiant stable uniquement après rapprochement documenté, puis contrôler l'ordre, les doublons et la géographie.


## Registres documentaires ajoutés

Au 13 novembre 2026, le dépôt conserve :
- **65 fiches AFTU détaillées** sont conservées dans `src/data/aftuPublishedRouteCandidates.ts` : 63 fiches liées depuis la page « Infos pratiques » et deux fiches officielles supplémentaires (lignes 27 et 36) retrouvées par leurs URL directes.
- La page officielle AFTU liste aussi les lignes 84, 85, 86, 87, 88, 89 et 91 avec leurs terminus, mais les liens individuels ne sont pas exploitables dans la page consultée ; elles restent donc des lignes repérées, sans fiche détaillée ni séquence vérifiée.
- **2 fiches TATA** issues de Covoiturage.sn, explicitement marquées comme source secondaire, dans `src/data/tataPublishedRouteCandidates.ts`.
- **DDD ArcGIS :** 24 couches d'itinéraires ont été extraites (12 urbaines et 12 banlieue), contenant 25 entités brutes. La couche de la ligne 8 urbaine contient une entité utile et une entité vide : le registre distingue désormais 12 corridors non vides et 1 entité vide sur les 12 couches urbaines. Les attributs textuels de ces couches sont des repères/corridors historiques, pas des arrêts ordonnés ni une preuve des deux sens ; les données brutes restent des candidates à recouper. Les 12 couches urbaines d'arrêts contiennent 455 points, dont 454 géolocalisés et 384 nommés.

Ces registres servent de preuves de travail pour la revue. Les fiches AFTU décrivent un seul ordre d'itinéraire ; les fiches TATA peuvent mentionner des variantes de retour, mais ne constituent pas des séquences complètes validées. Les fiches AFTU et les fiches secondaires intitulées « TATA » restent dans deux registres documentaires distincts pour conserver leur provenance, mais elles ne constituent pas deux réseaux d'exploitation automatiquement distincts. Les numéros identiques ne prouvent pas à eux seuls qu'il s'agit de la même ligne ; les terminus, le corridor et le GIE doivent être comparés. Aucun candidat n'est injecté dans le catalogue passager.

## Nouvelle source officielle DDD : séquences publiées sur le site opérateur

La page [Réseau urbain Dakar](https://demdikk.sn/reseau-urbain-dakar/) publie des listes de points desservis, dans l'ordre affiché, pour les dessertes urbaines et de banlieue. Le script `scripts/export_ddd_official_route_candidates.mjs` en extrait les sections et produit un artefact d'audit. La page [Info voyageurs](https://demdikk.sn/info-voyageurs/) sert à recouper les identifiants de lignes et les variantes.

L'extraction exécutée le 13 novembre 2026 a repéré **40 sections, soit 39 séquences uniques** après suppression d'une répétition strictement identique de la ligne 18. Les 39 séquences sont désormais conservées dans `src/data/dddOfficialUrbanPublishedRoutes.ts`, `src/data/dddSuburbanPublishedRoutesA.ts` et `src/data/dddSuburbanPublishedRoutesB.ts`, réunies par `src/data/dddOfficialPublishedRoutes.ts` et visibles dans le panneau d'audit administratif. Elles restent des preuves documentaires, non des horaires ou des séquences passager validées.

Règles appliquées à cette extraction :
- chaque liste est conservée dans son ordre publié, sans transformer automatiquement le sens inverse en retour ;
- une flèche « ↔ » dans l'en-tête ne remplace pas deux listes d'arrêts distinctes ;
- les arrêts ne sont pas encore fusionnés avec les points ArcGIS/OSM : chaque correspondance exige un rapprochement géographique et textuel ;
- aucune fréquence, heure de passage intermédiaire ou minute de compte à rebours n'est déduite d'une séquence d'arrêts ;
- la ligne 18 apparaît deux fois avec la même séquence sur la page : le scraper dédoublonne les copies strictement identiques ;
- l'en-tête « Terminus Rufisque ↔ Yenne » est rapproché de la ligne 228 uniquement parce que la page Info voyageurs officielle identifie cette desserte comme ligne 228 ; le rapprochement reste traçable comme tel.

### Divergences officielles à ne pas masquer

- La page détaillée présente une ligne 15, tandis que la page Info voyageurs mentionne 15A et 15B. Ne pas scinder la fiche 15 sans preuve de deux séquences distinctes.
- La page détaillée présente 502 et 503, tandis que la page Info voyageurs mentionne 502A/502B et 503A/503B. Les sous-lignes ne sont pas reconstituées à partir d'un seul parcours générique.
- La page Info voyageurs liste 504A et 504B, mais la page détaillée consultée ne fournit pas leurs séquences d'arrêts : elles restent à l'état « identifiant et terminus à documenter ».
- Le service TAF TAF Ouakam (TO1), limité au corridor Ouakam–Palais 2, reste distinct de la desserte TAF TAF Ouakam–AIBD/Sphère ministérielle.
- Le tracé ArcGIS historique de la ligne 6 urbaine (Cambérène 2–Cambérène village) ne correspond pas à l'identité publiée actuellement pour la ligne 6 de banlieue (Guédiawaye–Palais 1). Conserver les deux preuves et traiter l'ancienne géométrie comme variante historique, pas comme tracé actuel.
- Les couches ArcGIS sont anciennes (métadonnées de mise à jour principalement 2017, certaines 2019) : elles servent à confronter la géographie, pas à remplacer les séquences opérateur plus récentes.

## Rôle de l'IA et responsabilité de qualification

À la demande explicite du responsable du projet, l'assistant IA mène lui-même les recherches approfondies, les recoupements et la qualification documentaire des lignes. Il ne se limite pas à préparer un dossier pour qu'une autre personne fasse toute la vérification.

L'assistant peut attribuer un statut **VALIDÉ DOCUMENTAIREMENT** à une ligne ou à un sens uniquement après avoir vérifié les critères ci-dessous et conservé les preuves. Cette validation signifie que les informations de parcours sont suffisamment corroborées par les sources consultées ; elle ne signifie pas qu'un horaire temps réel ou une fréquence non publiée est garantie.

### Conditions obligatoires avant validation d'une ligne

1. **Identité de la ligne :** réseau et numéro confirmés par une source primaire actuelle (opérateur ou CETUD).
2. **Aller et Retour :** chaque sens doit être décrit et contrôlé séparément. Le retour ne peut jamais être créé par inversion automatique de l'aller.
3. **Ordre des arrêts :** la séquence de chaque sens doit être corroborée par une fiche opérateur, un plan exploitable, un jeu de données géographiques pertinent ou plusieurs sources indépendantes cohérentes.
4. **Recoupement :** comparer les terminus, repères intermédiaires, variantes, dates d'effet et éventuelles divergences entre sources. Une source secondaire seule ne suffit pas pour valider une ligne.
5. **Fréquence et horaires :** rechercher les informations publiées par l'opérateur/CETUD. Si aucune fréquence fiable n'est publiée, conserver « non documentée » dans les données de référence ; ne pas inventer de minutes ni transformer une moyenne réseau en fréquence propre à la ligne.
6. **Arrêts et GPS :** associer les identifiants et coordonnées seulement si le rapprochement est suffisamment probant. Les noms proches ne suffisent pas à fusionner deux arrêts.
7. **Traçabilité :** enregistrer pour chaque preuve l'URL, l'organisme, la date de publication ou de mise à jour si connue, la date de consultation et les éléments précis qu'elle confirme ou contredit.

### Statuts de validation

- `CANDIDATE` : une fiche ou une mention a été retrouvée, mais les preuves sont insuffisantes.
- `PARTIALLY_CORROBORATED` : certains éléments sont confirmés, mais un sens, une partie des arrêts ou la fréquence manque.
- `VALIDATED_ROUTE` : identité, Aller et Retour, ordre des arrêts et cohérence des sources sont recoupés.
- `VALIDATED_WITH_LIMITS` : le parcours est recoupé, mais une donnée comme la fréquence ou certaines coordonnées reste explicitement non publiée/non confirmée. Les limites restent visibles dans les métadonnées, jamais maquillées en faits.
- `CONFLICTING_SOURCES` : les sources se contredisent ; la ligne ne peut pas être déclarée validée tant que l'écart n'est pas résolu.

L'assistant est responsable de l'analyse et de l'attribution de ces statuts sur la base des preuves. En revanche, une modification du catalogue passager, de Supabase ou de l'application publiée reste une opération séparée, traçable et réversible ; elle ne doit pas être confondue avec la validation documentaire.

### Rôle opérationnel de l'IA

L'IA doit comparer les sources, chercher des recoupements officiels et indépendants, identifier les variantes Aller/Retour, repérer les incohérences, documenter les fréquences réellement trouvées et expliquer précisément ce qui manque. Elle peut valider les lignes qui satisfont les critères ci-dessus.

L'IA ne peut pas créer ou corriger automatiquement un arrêt, un identifiant ou des coordonnées sans preuve ; fusionner des arrêts sur la seule ressemblance de nom ; fabriquer un retour en inversant l'aller ; inventer des passages horaires ou des fréquences ; ni modifier les données TER/BRT protégées.

Toute proposition et toute validation doivent rester traçables et réversibles. Les données non confirmées restent candidates et ne sont pas présentées comme officielles.

## Limites

Le GTFS CETUD n'est pas disponible dans le dépôt à ce stade et n'est pas une condition préalable à ces contrôles. Une future livraison GTFS pourra être comparée aux sources existantes ; elle ne remplacera les données qu'après validation. Les horaires TER/BRT ne sont pas concernés par ce chantier.


## Sources publiques retrouvées le 13 novembre 2026

Un relevé séparé consigne les sources et leurs limites dans `docs/recherche-sources-itineraires-2026-11-13.md` :

- DDD : page opérateur avec des séquences textuelles publiées pour plusieurs lignes, sans séquence indépendante de retour pour chaque ligne.
- AFTU : page institutionnelle CETUD et plan cartographique des lignes ; la carte ne donne pas les arrêts ordonnés par sens.
- TATA : pages secondaires décrivant certaines lignes et variantes ; elles restent des candidates non vérifiées tant qu’une source primaire ne les confirme pas.

## Console de revue

La console authentifiée affiche désormais le tableau de bord de `getCurrentBusRouteAudit()` via `src/admin/CurrentBusRouteAuditPanel.tsx`. Il présente les lignes et les deux sens séparément, les séquences absentes, les statuts non vérifiés et les éventuelles séquences invalides. Les filtres ne changent que l’affichage. Aucun bouton de correction ou de publication n’est ajouté à cet audit.


## Principe de traitement des sources officielles et de leur date

Une donnée publiée par le CETUD, un opérateur public ou l'organisme responsable du réseau est une preuve officielle de ce que cet organisme a publié. Elle ne doit pas être rejetée simplement parce que sa date est ancienne. La date est conservée comme métadonnée de provenance et sert à comprendre les versions, les changements de réseau et les éventuelles coexistences de variantes.

La validation doit d'abord porter sur la fidélité de la transcription et la structuration de la donnée officielle. Les autres sources (cartes institutionnelles, fiches d'opérateur, documents d'exploitation, données SIG, archives, publications d'autres organismes) servent à compléter et à expliquer les séquences, pas à disqualifier automatiquement une source officielle.

Quand une même page officielle contient un titre de ligne et une liste d'arrêts qui semblent diverger, conserver les deux faits publiés. Examiner la séquence complète : la continuation après un repère « Terminus » peut représenter le sens opposé, une boucle ou une variante. Il ne faut ni tronquer la liste ni l'inverser automatiquement. Le rôle de l'IA est de reconstruire la structure la plus fidèle possible à partir des éléments publiés et de marquer seulement les ambiguïtés qui restent réellement irrésolues.

La page CETUD « Système de données » confirme que le CETUD a créé des fichiers GTFS couvrant horaires, arrêts, itinéraires, trajets, tarifs et services. La recherche de ces fichiers devient une piste prioritaire. Leur absence actuelle du dépôt ne signifie pas qu'ils n'existent pas.


## Mise à jour de la revue documentaire — 13 novembre 2026

- **DDD 217 :** la page opérateur donne le titre Thiaroye ↔ Ouakam, mais la séquence publiée continue jusqu'à Aéroport LSS et ressemble à celle de la ligne 218. Le registre conserve les repères de la page et marque explicitement le conflit ; aucun arrêt n'est supprimé et aucun sens n'est fabriqué.
- **DDD 233 :** le titre publié est Baux Maraîchers ↔ Palais 1, tandis que la séquence détaillée se termine à Aéroport LSS. La page officielle Info voyageurs confirme le titre mais ne fournit pas la séquence permettant de résoudre le conflit. Le registre conserve les deux informations publiées et signale l'ambiguïté.
- **AFTU :** le plan téléchargeable du CETUD est une carte JPEG des corridors, pas un fichier d'horaires. Il est ajouté aux sources de recoupement cartographique, sans servir à fabriquer l'ordre des arrêts.
- **GTFS CETUD :** l'existence du référentiel est officiellement confirmée. Aucun lien direct de téléchargement du fichier GTFS n'a été trouvé sur la page Système de données ni dans les deux boutons de téléchargement des plans AFTU/DDD. Le fichier lui-même n'est pas encore dans le dépôt ; la recherche continue.



### Extension de l'extraction AFTU aux fiches officielles non reliées — 13 novembre 2026

La page officielle « Infos pratiques » relie 63 fiches. La recherche directe sur le site AFTU a aussi retrouvé les pages officielles des lignes 27 et 36, accessibles par URL mais absentes des liens extraits de cette page. Le collecteur les récupère désormais explicitement, sans les confondre avec les 63 liens de l'index.

Le registre automatique distingue donc **63 pages reliées + 2 pages officielles supplémentaires**, soit **65 pages récupérées**, avec 65 descriptions d'itinéraire et aucune page manquante dans la dernière exécution attendue. Les pages 27 et 36 ont été ouvertes et leur texte de corridor vérifié sur le site AFTU. Les descriptions restent des parcours publiés à un seul ordre ; elles ne fabriquent pas le sens opposé.

Sources directes :
- Ligne 27 : https://aftu-senegal.org/map/dakar-urbain-ligne-27/
- Ligne 36 : https://aftu-senegal.org/map/dakar-urbain-ligne-36/

Les détails, liens directs et limites des sources sont consignés dans le relevé daté `docs/recherche-sources-itineraires-2026-11-13.md`. Ces constats restent dans le périmètre de la revue documentaire et ne changent pas le catalogue passager ni les horaires TER/BRT.

- **DDD :** la transcription officielle du registre comprend maintenant 34 références de parcours, dont deux nouvelles entrées (311 et 327). La ligne 311 est conservée comme circuit avec un retour non détaillé ; la ligne 327 est conservée comme ordre publié. Les lignes 217 et 233 portent des notes de conflit de source.

- **DDD banlieue :** un registre technique recense aussi 12 couches ArcGIS de géométrie de lignes (217, 218, 219, 227, 228, 232 et autres). Ces polylignes historiques servent au recoupement des corridors, pas à créer des arrêts ordonnés ou des horaires. Les métadonnées et limites sont consignées dans le relevé de recherche du 13 novembre.

## Fréquences officielles transcrites

Le registre `src/data/cetudFrequencyObservations.ts` contient les 59 relevés CETUD/CUREM des tableaux 48, 49, 52 et 53 du rapport de juillet 2020 (mesures EFOV 2016) :
- AFTU : 21 sites du lundi au vendredi et 8 sites le samedi.
- DDD : 22 sites du lundi au vendredi et 8 sites le samedi.
- Chaque observation conserve le site, le sens vers ville / vers banlieue, la période, le tableau et la source.
- Ces observations décrivent un intervalle moyen au point de mesure. Elles ne deviennent pas une fréquence par ligne sans preuve que la ligne concernée dessert ce point selon le même sens et la même période.

Autres périmètres documentés :
- DDD : la source institutionnelle de l'opérateur du 17 novembre 2021 décrit une planification générale de 20 à 30 minutes entre deux bus, sans ventilation par ligne.

- **DDD ligne 1 :** le site officiel DDD publie des heures de premier et dernier départ par terminus : Parcelles Assainies 05:30–20:30 et Leclerc 06:30–21:00. Cette preuve permet de documenter l'amplitude de la ligne 1, mais ne donne pas d'intervalle entre bus ; elle ne crée donc aucun compte à rebours de fréquence.
- **DDD TAF TAF :** la page officielle Info voyageurs publie quatre plages directionnelles : Ouakam → AIBD 06:00–21:00 ; Ouakam → Sphère ministérielle 05:45–21:00 ; AIBD → Ouakam 06:00–21:00 ; Sphère ministérielle → Ouakam 06:00–20:30. Le service TAF TAF est conservé comme desserte nommée distincte, sans l'assimiler automatiquement à la ligne urbaine TO1. Aucun intervalle entre bus n'est publié dans cette page, donc aucune fréquence ni compte à rebours n'en est déduit.
- AFTU : la FAQ officielle donne une amplitude générale jusqu'à 21 h, variable selon les lignes, mais pas une fréquence par ligne.
- AFTU 84 : les données CETUD transmises par le responsable du projet donnent 73 arrêts par sens et une fréquence de 14 minutes.
- Les sources TATA actuellement enregistrées restent secondaires ; aucune fréquence officielle propre à une ligne TATA de Dakar n'est ajoutée sur cette seule base.

La console d'audit expose les 59 observations et leurs références. Elles servent au recoupement documentaire ; elles ne modifient pas les horaires passagers. Le compte à rebours ne doit utiliser que des heures ou intervalles rattachés de façon probante à la ligne, au sens et à la période concernés.

## Règle du compte à rebours voyageurs

Le tableau passager ne doit utiliser que les intervalles rattachés à une ligne par une source officielle ou une donnée CETUD transmise et qualifiée. Les plages TransitByCity / Moovit restent des références de recherche et ne pilotent plus le compte à rebours.
- AFTU 84 : fréquence CETUD transmise de 14 minutes, amplitude générale AFTU 06:00–21:00 ; le compte à rebours est calculé séparément sur Aller et Retour, à partir des séquences propres à chaque sens.
- DDD : l'amplitude générale officielle sert à afficher l'état de service, mais aucune fréquence officielle par ligne n'est actuellement rattachée au compte à rebours.
- AFTU (autres lignes) et TATA : les horaires secondaires restent hors du calcul passager tant qu'une fréquence officielle par ligne n'est pas établie.

Le calcul ne doit jamais transformer une moyenne de passage observée à un site en fréquence propre à une ligne. Si la fréquence officielle manque, aucun compte à rebours numérique n'est affiché pour cette ligne.


## AFTU — extraction des fiches officielles de lignes

Le site officiel AFTU publie une fiche d'itinéraire pour de nombreuses lignes urbaines (liens « Voir itinéraire »). Le script `scripts/export_aftu_official_routes.mjs` récupère la liste de ces fiches et leur texte d'itinéraire, avec URL et date affichée lorsque présente. Il produit un artefact JSON de contrôle via `.github/workflows/audit-aftu-official-routes.yml`.

Les descriptions de rues et de corridors sont conservées telles quelles : elles ne sont pas artificiellement transformées en arrêts intermédiaires. Une fiche décrivant un sens ne crée pas automatiquement le sens retour. Les fréquences ne sont pas déduites du texte de l'itinéraire ; les références de fréquence séparées restent la source pour le compte à rebours.


### Extraction automatique de toutes les fiches AFTU reliées

Une collecte automatisée en lecture seule a parcouru les liens de la page officielle « Infos pratiques » :
- 63 fiches individuelles reliées ;
- 62 textes d'itinéraire récupérés automatiquement ;
- la fiche 30 a été ouverte, mais son bloc d'itinéraire n'a pas été extrait par le parseur ; la description déjà conservée dans le registre candidat reste à recouper.

Le relevé complet est produit par `scripts/export_aftu_official_routes.mjs` et le workflow `audit-aftu-official-routes.yml`. Les descriptions restent des corridors publiés dans un seul sens, pas des séquences aller/retour indépendantes. Les pages n'ont pas été injectées automatiquement dans le catalogue passager.


### Actualisation de l'extraction automatique — 13 novembre 2026

Le parseur des pages AFTU a été corrigé pour les fiches qui publient directement le corridor après la date sans intertitre « ITINERAIRE ». Une nouvelle exécution a récupéré les **63 pages reliées sur 63**, sans erreur et sans itinéraire manquant. La fiche de la ligne 30, auparavant non extraite par le parseur, est désormais incluse. Cette extraction documentaire ne change pas le statut de qualification des séquences : chaque fiche reste une description publiée à rapprocher des deux sens et des arrêts géolocalisés.


## Clarification du périmètre TATA / AFTU — 13 novembre 2026

Le CETUD précise dans son rapport d'enquête mobilité que les « minibus AFTU » sont couramment appelés « Tata » par les Dakarois. Le CETUD décrit également l'AFTU comme l'association regroupant les opérateurs privés organisés en 14 GIE. La documentation institutionnelle historique indique que les minibus de marque TATA ont été mis en circulation dans le cadre du programme AFTU, aux côtés d'autres marques de véhicules.

Conséquence pour le modèle de données Dakar Bus :
- le réseau opérateur de référence est **AFTU** ;
- « TATA » est conservé comme appellation/alias usuel du mode de minibus AFTU, pas comme un second opérateur à additionner automatiquement ;
- les pages « lignes TATA » de sources secondaires restent des pièces de comparaison avec leur provenance, mais ne deviennent pas des fiches officielles ;
- une fiche TATA secondaire n'est rattachée à une ligne AFTU qu'après rapprochement des terminus, du corridor, du GIE et des variantes ;
- les éventuelles différences de parcours sont conservées comme variantes ou conflits à examiner, jamais écrasées par un simple numéro identique.

Sources institutionnelles :
- [CETUD — rapport EMTASUD, définition des modes de transport](https://cetud.sn/wp-content/uploads/2026/03/9-CETUD-EMTASUD_RAPPORT-VF.pdf) : minibus AFTU couramment appelés « Tata ».
- [CETUD — présentation de l'AFTU](https://cetud.sn/reseaux-de-transport/aftu/) : organisation de l'AFTU et ses 14 GIE.
- [CETUD — historique du renouvellement des minibus AFTU](https://cetud.sn/l-aftu-est-la-fierte-des-transporteurs-urbains-du-senegal/) : minibus TATA et KING LONG dans le programme AFTU.

### Premier rapprochement des fiches secondaires TATA avec AFTU

La comparaison des deux fiches secondaires TATA déjà conservées avec les fiches officielles AFTU fait apparaître deux correspondances de corridor :
- TATA ligne 1 ↔ AFTU ligne 1 : Lat-Dior ↔ HLM Grand Yoff ;
- TATA ligne 2 ↔ AFTU ligne 2 : Route principale des Parcelles ↔ Gare Petersen.

Ces rapprochements sont enregistrés dans `src/data/tataPublishedRouteCandidates.ts` sous `possibleAftuLine` et `CORRIDOR_MATCH_NEEDS_REVIEW`. Ils signifient « correspondance probable à contrôler », pas validation de l'identité complète des parcours. Les différences de repères, les variantes de retour et les séquences complètes doivent encore être comparées. Les fiches secondaires TATA ne remplacent pas les fiches officielles AFTU.


## Recoupement spatial DDD — OSM et ArcGIS, 13 novembre 2026

Un rapprochement de proximité entre les arrêts ordonnés de 16 relations OSM DDD et les couches d'arrêts ArcGIS DDD a comparé 374 positions. Le point ArcGIS le plus proche se trouve à 50 m ou moins pour 230 positions, et à 100 m ou moins pour 282. Ce sont des correspondances de proximité non exclusives : elles ne prouvent ni l'identité de l'arrêt, ni l'ordre du parcours, ni l'exploitation actuelle.

Les résultats sont contrastés selon la relation : ligne 1 (35/38 positions à 50 m), ligne 7 (30/34 dans un sens, 10/31 dans l'autre), ligne 4 (24/32 contre 6/34), ligne 9 (27/29 contre 15/32), ligne 10 (20/25 contre 10/30), ligne 23 (22/51) et ligne 121 (3/3, 24/27 et 4/7 sur trois relations distinctes). Les relations 6, 8 et 18 présentent des anomalies ou aucun arrêt ordonné exploitable. Les variantes restent séparées et les divergences doivent être résolues avant toute validation.

Le détail relation par relation, la méthode et les limites sont conservés dans `docs/osm-dakar-audit-2026-11-13.md` ; le calcul est reproductible avec `npm run audit:ddd-osm-crosscheck`. Aucun statut `verified` n'est attribué par la seule proximité géographique.
