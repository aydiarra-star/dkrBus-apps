# DDD — contrôle des doublons géographiques à l'intérieur des couches d'arrêts

Date : 14 novembre 2026

## Périmètre et méthode

Contrôle des 12 couches ponctuelles du deuxième service ArcGIS DDD, extraites dans l'artefact public en lecture seule `ddd-arcgis-route-stop-candidates.json` (workflow `43559941092`, artefact `14100102642`). L'extraction contient 455 entités ponctuelles, réparties sur les 12 couches.

Pour chaque couche, comparaison deux à deux des coordonnées WGS84 par distance haversine. Recherche des coordonnées exactement identiques, puis des paires distinctes à ≤1 m, ≤3 m et ≤25 m. Les résultats concernent uniquement les doublons/proximités à l'intérieur d'une même couche ; ils ne remplacent pas l'audit inter-couches.

## Résultats

- 0 groupe de coordonnées strictement identiques à l'intérieur des 12 couches.
- 0 paire de points distincts à ≤1 m.
- 0 paire à ≤3 m.
- 2 paires à ≤25 m, une dans la couche ligne 13 nommée et une dans la couche ligne 18.
- Toutes les couches ont été analysées ; aucune erreur de calcul liée aux coordonnées manquantes n'a été relevée sur les entités géolocalisées.

## Interprétation

Cette vérification ne révèle pas de doublons géométriques exacts ni de quasi-doublons très proches au sein d'une même couche. Les répétitions de noms d'arrêts dans les attributs ne sont donc pas, à elles seules, des enregistrements géographiquement superposés : plusieurs enregistrements portant le même nom peuvent représenter des positions successives, des quais ou des passages distincts.

Les deux paires à ≤25 m doivent être considérées comme de simples voisinages. Une distance de cet ordre ne permet pas de conclure à un doublon ou à un arrêt commun.

## Décision

1. Ne supprimer aucune entité et ne fusionner aucun GlobalID.
2. Conserver l'ordre source des entités sans l'interpréter comme ordre voyageurs validé.
3. Garder séparé ce contrôle intra-couche de l'audit inter-couches (130 paires ≤1 m, 329 ≤3 m, 396 ≤25 m).
4. Poursuivre la validation des noms, directions et séquences par confrontation aux fiches officielles DDD et aux tracés, sans déduire de retour ou d'horaire.

Aucune écriture base de données, aucun changement des données passagers, TER/BRT ou production.
