# Revue des rapprochements flous AFTU / TATA / DDD

Date de génération : 17 novembre 2026  
Source de comparaison : inventaires de corridors AFTU, listes d'arrêts Moovit, catalogue TATA et arrêts candidats ArcGIS DDD.

## Résultat global

- 1 373 noms de points de passage distincts examinés ;
- 16 noms produisent une suggestion floue au seuil de 85 % ;
- 16 paires de suggestions au total ;
- 3 suggestions présentent un seul groupe de localisation ;
- 13 suggestions présentent plusieurs groupes de localisation ;
- 0 suggestion n'est acceptée automatiquement ;
- la position candidate finale reste volontairement `null` pour chaque rapprochement flou.

L'inventaire source couvre 72 corridors AFTU, 28 fichiers détaillés AFTU, 62 lignes TATA et 4 748 occurrences de points de passage.

## Suggestions à examiner en premier

Ces trois noms ont un seul groupe de localisation candidat dans l'extrait ArcGIS. Ils restent à contrôler manuellement avec le contexte de ligne et l'ordre du parcours :

| Nom AFTU/TATA | Candidat ArcGIS | Similarité | Contexte |
|---|---|---:|---|
| Ecole Elémentaire Hlm Grand Médine | Arret Ecole Elémentaire HL Grand Médine | 97,06 % | DDD ligne 23 |
| Aéroport LSS | Arret Aéroport L.S.S / Terminus Aéroport L.S.S | 85,71 % | DDD lignes 8 et 232 |
| SDE Guédiawaye | Terminus DDD Guédiawaye | 85,71 % | DDD ligne 5 |

Même pour ces trois cas, une similarité de nom ne suffit pas à prouver que le point AFTU/TATA est le même arrêt physique.

## Suggestions ambiguës — plusieurs localisations

| Nom AFTU/TATA | Candidat textuel | Similarité | Groupes de localisation |
|---|---|---:|---:|
| Stade Léopole Sédar Senghor | Arret Stade Léopold Sédar Senghor | 96,30 % | 2 |
| Boulevard Du General De Gaulle, 3 | Arret Boulevard du Général De Gaulle | 92,31 % | 4 |
| Route De Niayes | Arret Route des Ndiayes | 92,31 % | 12 |
| Avenue Cheikh Anta Diop, 4 | Arret Avenue Cheikh Anta Diop | 92,00 % | 10 |
| Avenue Jean Jaures, 4 | Arret Avenue Jean Jaurès | 90,00 % | 3 |
| Avenue Jean Jaures, 7 | Arret Avenue Jean Jaurès | 90,00 % | 3 |
| 2 voies de Liberté VI | Arret 2 voies Liberté 6 | 88,89 % | 4 |
| Avenue Cheikh Anta Diop, 19 | Arret Avenue Cheikh Anta Diop | 88,46 % | 10 |
| Avenue Cheikh Anta Diop, 25 | Arret Avenue Cheikh Anta Diop | 88,46 % | 10 |
| Avenue Cheikh Anta Diop, 39 | Arret Avenue Cheikh Anta Diop | 88,46 % | 10 |
| Avenue Cheikh Anta Diop, 48 | Arret Avenue Cheikh Anta Diop | 88,46 % | 10 |
| Route De Rufisque, 5 | Arret Route de Rufisque | 87,50 % | 14 |
| Route De Rufisque, 8 | Arret Route de Rufisque | 87,50 % | 14 |

Les groupes multiples correspondent à des positions différentes le long d'un même axe ou à des arrêts homonymes. Choisir le premier point ou la moyenne des coordonnées créerait un faux arrêt.

## Décision de qualité des données

1. Les correspondances floues restent des propositions de revue, jamais des coordonnées de production.
2. Les noms de rues sans numéro ou les grands axes (Jean Jaurès, Cheikh Anta Diop, Route de Rufisque, Route des Ndiayes) doivent être rapprochés par proximité géographique, ordre de passage et contexte de ligne.
3. Un point candidat unique doit encore être confirmé par une source indépendante ou une vérification humaine.
4. Aucun arrêt AFTU/TATA n'est remplacé par un arrêt DDD sur la seule base du nom.
5. Les 4 748 occurrences restent des occurrences de catalogue, pas un décompte d'arrêts physiques uniques.

## Étape suivante

Prioriser les trois candidats à localisation unique pour revue manuelle, puis traiter les groupes ambigus avec un rapprochement spatial et directionnel. Garder les cas non résolus hors du routage passager et des comptes à rebours.

Aucun horaire TER/BRT, aucune donnée de production et aucun écran passager n'a été modifié par cette revue.
