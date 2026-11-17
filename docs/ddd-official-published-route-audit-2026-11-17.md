# Audit des séquences publiées par Dakar Dem Dikk

Date de génération de l'extraction : 17 novembre 2026  
Date de récupération de la page source enregistrée dans l'artefact : 13 novembre 2026  
Source : https://demdikk.sn/reseau-urbain-dakar/  
Index opérateur : https://demdikk.sn/info-voyageurs/

## Résultat de l'extraction

L'extraction automatisée en lecture seule a relevé :

- 1 120 lignes source examinées ;
- 40 sections de lignes détectées ;
- 39 séquences publiées uniques après regroupement d'une section dupliquée ;
- 39 séquences comportant au moins deux repères ;
- aucun champ obligatoire manquant dans l'artefact.

L'inventaire comporte 39 séquences distinctes. Pour chacune, l'artefact marque :
- `status: NEEDS_HUMAN_REVIEW` ;
- `directionCoverage: ONE_PUBLISHED_ORDER_ONLY` ;
- `reverseSequenceVerified: false` ;
- `stopIdsMatched: false` ;
- `frequencyMinutes: null`.

**Conséquence :** le titre d'une ligne avec une flèche ou deux terminus ne prouve pas que l'opérateur a publié deux listes d'arrêts directionnelles distinctes. Aucune séquence retour, fréquence, identité d'arrêt ou position GPS ne doit être créée par déduction.

## Inventaire des séquences extraites

| Ligne / service | Repères publiés |
|---|---:|
| 1 | 22 |
| 2 | 35 |
| 4 | 26 |
| 5 | 15 |
| 6 | 25 |
| 7 | 21 |
| 8 | 28 |
| 9 | 24 |
| 10 | 29 |
| 11 | 16 |
| 12 | 20 |
| 13 | 24 |
| 15 | 18 |
| 16A | 19 |
| 16B | 27 |
| 18 | 41 |
| 20 | 42 |
| 23 | 40 |
| 121 | 25 |
| 208 | 7 |
| 213 | 17 |
| 217 | 15 |
| 218 | 15 |
| 219 | 19 |
| 220 | 16 |
| 221 | 15 |
| 227 | 16 |
| 228 | 4 |
| 232 | 15 |
| 233 | 15 |
| 234 | 13 |
| 311 | 6 |
| 319 | 17 |
| 327 | 11 |
| 501 | 6 |
| 502 | 8 |
| 503 | 8 |
| TAF TAF | 17 |
| TAF TAF Ouakam (TO1) | 10 |

## Anomalies et points à vérifier avant intégration

### Lignes 217 et 218

Les deux séquences publiées contiennent exactement les mêmes 15 repères, dans le même ordre :

1. Dépôt Thiaroye
2. Sipses
3. Bountou Pikine
4. Patte d'Oie
5. Foire
6. VDN
7. Sipres
8. Ancienne piste
9. Ouakam
10. Marché Ouakam
11. Terminus Ouakam
12. Route des Mamelles
13. Route des Almadies
14. Ngor
15. Terminus Aéroport LSS

Or, le titre de la ligne 217 indique « Thiaroye – Ouakam », alors que la liste publiée se termine à « Terminus Aéroport LSS ». La ligne 218 indique « Thiaroye – Aéroport LSS », ce qui correspond à ce dernier terminus.

Cette répétition peut être une erreur de publication, une liste mutualisée ou une information incomplète ; l'extraction ne permet pas de trancher. Les séquences 217 et 218 doivent donc être conservées comme références opérateur à vérifier, pas comme deux itinéraires validés.

### Ligne 228

La séquence publiée ne comporte que quatre repères : Terminus Rufisque, Ville de Rufisque, Bargny, Diamniadio Yenne. Cette liste est trop sommaire pour fabriquer des arrêts intermédiaires ou des horaires.

### Lignes 7 et 13

Les séquences officielles publiées comptent respectivement 21 et 24 repères. Elles diffèrent en nombre et en libellés des listes Moovit candidates (27/29 occurrences pour la ligne 7 ; 30 par sens pour la ligne 13). Les grilles Moovit ne peuvent donc pas être rattachées aux repères DDD sans rapprochement explicite.

## Méthode d'intégration retenue

1. Garder la transcription opérateur dans son ordre publié et avec sa provenance.
2. Traiter les listes secondaires (Moovit, OSM, ArcGIS) comme des candidats à rapprocher, jamais comme des remplacements automatiques.
3. Rechercher les correspondances par nom, position et ordre ; isoler les homonymes et libellés génériques.
4. Exiger une preuve indépendante pour toute séquence retour.
5. Ne calculer des passages par arrêt qu'après validation de la correspondance entre chaque colonne horaire et l'arrêt correspondant.
6. Maintenir les éléments non résolus hors du catalogue passager.

Aucun horaire TER/BRT, aucune donnée de production, aucun paramètre Supabase et aucun écran passager n'a été modifié par cet audit.


### Lignes 232 et 233

La page DDD publie aussi deux listes identiques de 15 repères pour les lignes 232 et 233 :
- la ligne 232 est annoncée « Baux Maraichers ↔ Aéroport LSS » ;
- la ligne 233 est annoncée « Baux Maraichers ↔ Palais 1 » ;
- pourtant, les deux listes finissent à « Terminus Aéroport LSS » et reprennent les mêmes repères dans le même ordre.

La ligne 233 présente donc un second conflit entre son en-tête et sa liste. Ne pas prolonger la ligne vers Palais 1, ni modifier son terminus, sans confirmation DDD.
