# DDD lignes 8 et 18 — exploitation des géométries OSM sans membres d'arrêts

Date : 13 novembre 2026.

## Pourquoi cette revue

Les relations OSM 7495137 (ligne 8) et 7499475 (ligne 18) ont zéro membre d'arrêt ordonné. Elles contiennent toutefois des tronçons de route OSM ordonnés. Les couches ArcGIS DDD correspondantes contiennent des points d'arrêt, ce qui permet un contrôle géométrique sans inventer de nœuds d'arrêt OSM.

La comparaison a été effectuée en projetant les géométries en UTM 28N et en mesurant la distance perpendiculaire de chaque point ArcGIS à l'ensemble des tronçons OSM ordonnés.

## Ligne 8 — Aéroport LSS ↔ Palais 2

- Page DDD officielle : 28 arrêts publiés, de Terminus Aéroport LSS à Terminus Palais 2.
- Relation OSM 7495137 : référence L8, opérateur Dakar Dem Dikk, de « Aéroport de Dakar » à « Palais » ; 80 membres de voie ordonnés, zéro membre d'arrêt.
- Couche ArcGIS DDD ligne 8 : 49 points ; les 49 libellés d'arrêt sont vides.

### Résultat géométrique

- 41/49 points ArcGIS à 25 m ou moins de la géométrie OSM.
- 44/49 à 100 m ou moins.
- Distance médiane : environ 7,6 m.
- 5 points dépassent 100 m : OBJECTID 9 (126,9 m), 13 (611,2 m), 14 (164,4 m), 15 (219,3 m) et 49 (187,2 m).
- En associant chaque point ArcGIS au tronçon OSM le plus proche, l'indice de tronçon est non décroissant pour 46 des 48 transitions successives entre points ArcGIS.

**Décision ligne 8 :** signal fort que la géométrie OSM L8 et les points ArcGIS DDD décrivent un corridor largement commun et orienté de façon cohérente. Cette preuve ne donne pas les noms des 49 points ArcGIS (tous vides) et ne permet pas de les convertir en 28 arrêts officiels. Conserver les 80 tronçons OSM comme géométrie candidate ; rechercher une source de coordonnées ou de noms d'arrêts pour faire le raccordement.

## Ligne 18 — Dieuppeul ↔ centre-ville

- Page DDD officielle : itinéraire circulaire publié avec 41 arrêts, départ et retour au terminus Liberté 5 (Dieuppeul).
- Relation OSM 7499475 : référence 18, opérateur Dakar Dem Dikk, de « Terminus 1 » à « Terminus 2 » ; 54 membres de voie ordonnés, zéro membre d'arrêt.
- Couche ArcGIS DDD ligne 18 : 44 points ; elle commence et se termine par « Terminus liberté 5 ».

### Résultat géométrique

- 31/44 points ArcGIS à 25 m ou moins de la géométrie OSM.
- 34/44 à 100 m ou moins.
- Distance médiane : environ 7,4 m.
- Le corridor OSM est très proche de plusieurs tronçons autour de Dieuppeul et Bourguiba, mais il manque une partie importante du centre-ville.
- Les points ArcGIS 18 à 24, qui couvrent notamment Port de Dakar, Hôtel de Ville, Place de l'Indépendance et Avenue George Pompidou, sont éloignés de 1,47 à 1,94 km de la géométrie OSM.
- D'autres écarts dépassent 300 m aux points ArcGIS 3, 17 et 26.

La comparaison des libellés ArcGIS avec la séquence officielle retrouve une seule concordance normalisée stricte dans l'ordre : Avenue Bourguiba (ArcGIS 35 → officiel 37). Les libellés ArcGIS sont des noms de voies et ne reprennent pas tous les arrêts publiés.

**Décision ligne 18 :** conserver la relation OSM comme fragment géométrique utile, mais ne pas la considérer comme l'itinéraire circulaire complet. Le tronçon centre-ville doit être recherché dans d'autres relations ou sources ; ne pas compléter par une ligne droite ni par inversion.

## Suite prioritaire

1. Ligne 8 : retrouver des noms ou identifiants d'arrêts pour les points ArcGIS non nommés, en gardant les cinq anomalies géographiques isolées.
2. Ligne 18 : rechercher le segment manquant autour du Port, de l'Hôtel de Ville et de la Place de l'Indépendance.
3. Vérifier les géométries OSM et ArcGIS dans leur ordre propre avant tout rapprochement de séquence.
4. Ne créer aucun membre d'arrêt, nom, sens ou fréquence sur la seule base d'une proximité géométrique.

Aucune modification TER/BRT, aucune écriture Supabase, aucun déploiement et aucune fusion de PR.
