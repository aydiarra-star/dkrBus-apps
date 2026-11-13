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
- **65 fiches AFTU** issues des pages individuelles du site de l'opérateur, avec date, URL et description, dans `src/data/aftuPublishedRouteCandidates.ts`.
- **2 fiches TATA** issues de Covoiturage.sn, explicitement marquées comme source secondaire, dans `src/data/tataPublishedRouteCandidates.ts`.

Ces registres servent de preuves de travail pour la revue. Les fiches AFTU décrivent un seul ordre d'itinéraire ; les fiches TATA peuvent mentionner des variantes de retour, mais ne constituent pas des séquences complètes validées. Les deux réseaux gardent des registres distincts, même lorsque des numéros de ligne ou des corridors se ressemblent. Aucun candidat n'est injecté dans le catalogue passager.

## Rôle autorisé de l'IA

L'IA agit comme **copilote de contrôle et d'aide à la décision**, pas comme autorité de validation :
- comparer les fiches et les données existantes, en conservant les sources et les dates ;
- repérer les anomalies de nom, de séquence, de sens, de doublon potentiel ou de coordonnées ;
- proposer des rapprochements entre repères et arrêts sous forme de candidats argumentés ;
- expliquer les écarts, signaler les preuves manquantes et classer les dossiers à examiner ;
- préparer une fiche de revue claire pour le validateur humain.

L'IA ne peut pas :
- créer ou corriger automatiquement un arrêt, un identifiant ou des coordonnées ;
- fusionner deux arrêts parce que leurs noms se ressemblent ;
- fabriquer le Retour en inversant l'Aller, ou inventer des passages horaires ;
- déclarer un parcours « vérifié », remplacer une source ou publier une modification ;
- modifier les données TER/BRT protégées.

Toute proposition IA doit être traçable, réversible et marquée `NEEDS_HUMAN_REVIEW`. Seul un humain autorisé peut accepter une proposition et déclencher une éventuelle mise à jour ultérieure.

## Limites

Le GTFS CETUD n'est pas disponible dans le dépôt à ce stade et n'est pas une condition préalable à ces contrôles. Une future livraison GTFS pourra être comparée aux sources existantes ; elle ne remplacera les données qu'après validation. Les horaires TER/BRT ne sont pas concernés par ce chantier.


## Sources publiques retrouvées le 13 novembre 2026

Un relevé séparé consigne les sources et leurs limites dans `docs/recherche-sources-itineraires-2026-11-13.md` :

- DDD : page opérateur avec des séquences textuelles publiées pour plusieurs lignes, sans séquence indépendante de retour pour chaque ligne.
- AFTU : page institutionnelle CETUD et plan cartographique des lignes ; la carte ne donne pas les arrêts ordonnés par sens.
- TATA : pages secondaires décrivant certaines lignes et variantes ; elles restent des candidates non vérifiées tant qu’une source primaire ne les confirme pas.

## Console de revue

La console authentifiée affiche désormais le tableau de bord de `getCurrentBusRouteAudit()` via `src/admin/CurrentBusRouteAuditPanel.tsx`. Il présente les lignes et les deux sens séparément, les séquences absentes, les statuts non vérifiés et les éventuelles séquences invalides. Les filtres ne changent que l’affichage. Aucun bouton de correction ou de publication n’est ajouté à cet audit.
