# DDD ligne 23 — rapprochement des deux relations OSM et des sens publiés

Date : 13 novembre 2026.

## Référence officielle

La page DDD publie 40 arrêts pour la ligne 23, de « Terminus des Parcelles » à « Terminus Palais 2 ». Le contrôle compare séparément les deux relations OSM trouvées et ne transforme pas automatiquement l'une en inverse de l'autre.

Source : https://demdikk.sn/reseau-urbain-dakar/

## Candidat A — relation 7108131 : Parcelles → Palais 1

- Référence de relation `L23;L5` : ambiguïté de ligne.
- 47 membres d'arrêt, 102 voies ordonnées, 21 membres nommés.
- Terminus OSM : Parcelles Assainies → Palais 1.
- 40/47 nœuds à 25 m ou moins de la couche ArcGIS DDD ligne 23 ; 44/47 à 100 m ou moins ; médiane environ 1,7 m.
- Deux correspondances normalisées strictes dans l'ordre officiel : Police Parcelles (membre 15 → officiel 12) et UCAD (membre 29 → officiel 25).
- Deux membres portent explicitement `ref=L5` sans mention de L23 ; un autre est partagé `L5;L23`.

**Lecture :** très forte cohérence spatiale avec la couche ArcGIS, mais référence mixte et arrivée Palais 1 au lieu du terminus officiel Palais 2. À garder comme candidat, pas comme séquence exclusive validée.

## Candidat B — relation 7495279 : Palais 1 → Parcelles

- Référence de relation `L 23`.
- 51 membres d'arrêt, 80 voies ordonnées, 31 membres nommés.
- Terminus OSM : Palais 1 → Parcelles-Assainies, soit le sens opposé au titre officiel publié.
- Trois correspondances normalisées strictes apparaissent dans le même ordre que la séquence officielle inversée : UCAD (membre 17 → officiel 16 en ordre inversé), Police Parcelles (membre 38 → officiel 29) et Ecole Dior (membre 49 → officiel 39).
- 18 tags `ref` mentionnent la ligne 23 ; parmi eux, trois sont explicitement partagés `L5;L23`. 31 membres n'ont pas de tag `ref`.
- La cohérence spatiale avec la couche ArcGIS ligne 23 est plus faible : 12/51 nœuds à 25 m ou moins, 22/51 à 50 m ou moins, 32/51 à 100 m ou moins ; médiane environ 67,3 m.

**Lecture :** le sens et les trois noms en ordre inverse en font un candidat sérieux pour le retour, mais les écarts ArcGIS et les membres partagés L5 empêchent une validation automatique.

## Lecture conjointe et décision

Les deux relations suggèrent une couverture des deux sens de la ligne 23 :
- 7108131 suit Parcelles → Palais 1, avec forte proximité ArcGIS, mais référence mixte L23/L5.
- 7495279 suit Palais 1 → Parcelles, porte la référence de relation L23 et contient trois correspondances de noms dans l'ordre inverse, mais présente une proximité ArcGIS nettement plus faible et trois membres explicitement partagés L5/L23.

Le terminus officiel publié est « Palais 2 », alors que les deux relations OSM indiquent « Palais 1 ». Cette différence doit être résolue auprès d'une source DDD ou d'une autre preuve officielle ; elle ne doit pas être masquée par une équivalence supposée.

**Statut recommandé :** deux candidats directionnels distincts `NEEDS_HUMAN_REVIEW`. La relation 7495279 est un candidat de retour à examiner en priorité ; la relation 7108131 reste un candidat aller avec ambiguïté de ligne. Ne pas créer le retour par inversion, ne pas réaffecter les membres L5, ne pas confirmer la séquence entière ni les fréquences.

## Prochaines vérifications

1. Rechercher une version officielle ou une carte DDD qui explique Palais 1 / Palais 2 pour la ligne 23.
2. Comparer les 51 points de la relation 7495279 avec la géométrie ArcGIS de la ligne 23, pas seulement avec les arrêts.
3. Isoler les membres L5 partagés des deux relations et vérifier s'ils sont réellement desservis par la ligne 23.
4. Rechercher une source de fréquence officielle ; laisser `frequencyMinutes=null` en attendant.

Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT et aucune fusion de PR.
