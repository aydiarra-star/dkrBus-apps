# État de qualification des parcours DDD, AFTU et TATA

Document de travail établi à partir des registres versionnés dans le dépôt. Il décrit la structure des données disponibles ; il ne certifie aucun parcours comme officiel ou exploitable pour un calculateur passager.

## Ce que le dépôt contient

| Réseau | Données disponibles | Ce qui manque encore |
|---|---|---|
| DDD | Un catalogue de lignes et terminus ; des séquences de repères publiées pour certaines lignes, avec URL, date de consultation et type « ordre publié » ou « circuit publié » | Séquences distinctes Aller et Retour vérifiées ; correspondance certaine de chaque repère textuel avec un identifiant d’arrêt ; validation des coordonnées |
| AFTU | Catalogue de lignes et terminus avec une source de référence | Séquences ordonnées propres à chaque sens, vérifiées sur une source exploitable |
| TATA | Catalogue distinct de lignes et terminus, avec provenance déclarée | Séquences ordonnées propres à chaque sens ; horaires et fréquences autonomes vérifiés |

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
- **TATA :** conserver son catalogue distinct ; confirmer les séquences et les horaires auprès de sources TATA/AFTU pertinentes, sans lui attribuer automatiquement les données AFTU.
- **Tous réseaux :** associer chaque arrêt à un identifiant stable uniquement après rapprochement documenté, puis contrôler l'ordre, les doublons et la géographie.


## Registres documentaires ajoutés

Au 13 novembre 2026, le dépôt conserve :
- **65 fiches AFTU détaillées** issues des pages individuelles du site de l'opérateur, avec date, URL et description, dans `src/data/aftuPublishedRouteCandidates.ts`.
- La page officielle AFTU liste aussi les lignes 84, 85, 86, 87, 88, 89 et 91 avec leurs terminus, mais les liens individuels ne sont pas exploitables dans la page consultée ; elles restent donc des lignes repérées, sans fiche détaillée ni séquence vérifiée.
- **2 fiches TATA** issues de Covoiturage.sn, explicitement marquées comme source secondaire, dans `src/data/tataPublishedRouteCandidates.ts`.

Ces registres servent de preuves de travail pour la revue. Les fiches AFTU décrivent un seul ordre d'itinéraire ; les fiches TATA peuvent mentionner des variantes de retour, mais ne constituent pas des séquences complètes validées. Les deux réseaux gardent des registres distincts, même lorsque des numéros de ligne ou des corridors se ressemblent. Aucun candidat n'est injecté dans le catalogue passager.

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
- AFTU : la FAQ officielle donne une amplitude générale jusqu'à 21 h, variable selon les lignes, mais pas une fréquence par ligne.
- AFTU 84 : les données CETUD transmises par le responsable du projet donnent 73 arrêts par sens et une fréquence de 14 minutes.
- Les sources TATA actuellement enregistrées restent secondaires ; aucune fréquence officielle propre à une ligne TATA de Dakar n'est ajoutée sur cette seule base.

La console d'audit expose les 59 observations et leurs références. Elles servent au recoupement documentaire ; elles ne modifient pas les horaires passagers. Le compte à rebours ne doit utiliser que des heures ou intervalles rattachés de façon probante à la ligne, au sens et à la période concernés.
