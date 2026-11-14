# DDD ligne 23 — revue de la relation OSM mixte L23/L5

Date : 13 novembre 2026.

## Référence officielle

La page DDD publie la ligne 23 sous le titre « PARCELLES ASSAINIES PALAIS 1 » dans un ordre de 40 arrêts, avec « Terminus des Parcelles » au départ et « Terminus Palais 2 » à l'arrivée.

Source : https://demdikk.sn/reseau-urbain-dakar/

## Relation OSM 7108131

- Nom OSM : « ARRET CITE SOPRIM ».
- Référence de relation : `L23;L5` (ambiguïté explicite entre deux lignes).
- Départ/arrivée OSM : « Terminus Parcelles Assainies » → « Terminus Palais 1 ».
- 47 membres d'arrêt ordonnés et 102 membres de voie ordonnés.
- La couche ArcGIS DDD ligne 23 contient 56 points. Parmi les 47 nœuds OSM, 40 sont à 25 m ou moins d'un point ArcGIS, 40 à 50 m ou moins et 44 à 100 m ou moins ; distance médiane au point ArcGIS le plus proche : environ 1,7 m.
- 21 membres OSM portent un nom.
- Deux concordances normalisées strictes apparaissent dans le même ordre avec la séquence officielle : « ARRET POLICE PARCELLES » (membre OSM 15 → arrêt officiel 12 « Police Parcelles ») et « UCAD » (membre OSM 29 → arrêt officiel 25 « UCAD »).

### Contrôle des références sur les membres

Sur les 47 membres :
- 34 n'ont pas de tag `ref` ;
- 9 tags `ref` contiennent une mention de ligne 23 (dont des références partagées avec ligne 1 ou ligne 5) ;
- deux nœuds portent explicitement `ref=L5` sans mention de ligne 23.

Le nœud 14 (« ARRET CITE SOPRIM ») porte `ref=L5;L23`, tandis que le nœud 15 (« ARRET POLICE PARCELLES ») porte `ref=L5`. Cette portion ne peut pas être attribuée en bloc à la ligne 23 sans vérifier la desserte commune et la séquence exacte. Plusieurs autres membres portent des références L23 ou des libellés DDD génériques.

## Écarts à résoudre

1. **Terminus :** l'OSM termine à « Terminus Palais 1 », alors que la page DDD termine à « Terminus Palais 2 ». Ne pas traiter ces noms comme équivalents.
2. **Référence de ligne :** la relation est explicitement mixte L23/L5 ; ne pas importer ses 47 arrêts comme une séquence exclusive ligne 23.
3. **Couverture :** 40/47 nœuds proches de la couche ArcGIS est un signal spatial fort, mais ne prouve ni le service de chaque arrêt ni son ordre officiel.
4. **Noms :** seules deux concordances normalisées strictes sont confirmées par le contrôle d'ordre. Les autres noms ou références restent des indices de recherche.
5. **Retour :** la relation décrit un seul ordre Parcelles → Palais 1 ; elle ne fournit pas la séquence retour officielle.

## Décision

Conserver la relation 7108131 comme **candidate géométrique et séquentielle à forte proximité**, mais avec statut `NEEDS_HUMAN_REVIEW` et `MIXED_LINE_REFERENCE`. Ne pas l'importer comme itinéraire validé de la ligne 23, ne pas réattribuer les membres L5, ne pas substituer Palais 1 à Palais 2 et ne pas inverser la séquence pour fabriquer le retour.

## Suite

- Rechercher une relation OSM ou une source DDD distincte portant explicitement L23 et terminant à Palais 2.
- Vérifier si les membres L5 sont des arrêts partagés ou des erreurs d'affectation.
- Comparer les points ArcGIS et les arrêts officiels sans automatiser l'appariement.
- Laisser la fréquence non renseignée tant qu'une source officielle ne la confirme pas.

Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT et aucune fusion de PR.
