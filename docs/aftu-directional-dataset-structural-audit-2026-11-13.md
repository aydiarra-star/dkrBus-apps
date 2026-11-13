# Audit structurel des séquences AFTU aller/retour — 13 novembre 2026

## Périmètre

Contrôle en lecture seule des fichiers directionnels AFTU présents dans `src/data/`. Les séquences ne sont ni réordonnées, ni dédupliquées, ni publiées par ce contrôle. Les occurrences répétées et les libellés génériques « Arrêt de bus » sont conservés : ils peuvent représenter des positions anonymes distinctes.

Le contrôle mesure, pour chaque fichier, la longueur de chaque sens, les répétitions textuelles exactes après normalisation simple et les libellés génériques exacts. Une répétition de texte n'est pas une preuve de doublon géographique.

## Résultats du contrôle

| Ligne | Aller | Retour | Répétitions Aller | Répétitions Retour | « Arrêt de bus » Aller / Retour |
|---:|---:|---:|---:|---:|---:|
| 30 | 77 | 74 | 39 | 41 | 40 / 41 |
| 57 | 56 | 57 | 29 | 31 | 30 / 32 |
| 58 | 39 | 43 | 7 | 10 | 8 / 11 |
| 62 | 72 | 68 | 25 | 23 | 24 / 23 |
| 64 | 61 | 61 | 31 | 32 | 32 / 33 |
| 65 | 57 | 56 | 27 | 29 | 26 / 29 |
| 66 | 77 | 77 | 41 | 41 | 42 / 41 |
| 67 | 71 | 71 | 23 | 22 | 24 / 22 |
| 68 | 50 | 50 | 28 | 30 | 30 / 31 |
| 70 | 14 | 14 | 0 | 0 | 0 / 0 |
| 71 | 54 | 55 | 12 | 12 | 13 / 13 |
| 72 | 22 | 22 | 0 | 0 | 0 / 0 |
| 73 | 10 | 10 | 0 | 0 | 0 / 0 |
| 74 | 14 | 14 | 0 | 0 | 0 / 0 |
| 75 | 52 | 51 | 21 | 22 | 23 / 24 |
| 79 | 15 | 15 | 0 | 0 | 0 / 0 |
| 80 | 17 | 17 | 0 | 0 | 0 / 0 |
| 81 | 16 | 16 | 0 | 0 | 0 / 0 |
| 83 | 14 | — | 0 | — | 0 / — |
| 84 | 73 | 73 | 0 | 0 | 0 / 0 |
| 85 | 89 | 95 | 2 | 2 | 0 / 0 |

Les fichiers 83 et 85 sont des formats différents des fichiers à objet `directions` ; le sens absent de la ligne 83 n'est pas créé par ce contrôle.

## Anomalies et décisions

### Lignes avec nombreux libellés anonymes

Les lignes 30, 57, 58, 62, 64, 65, 66, 67, 68, 71 et 75 contiennent de nombreuses occurrences « Arrêt de bus ». Les valeurs sont des positions anonymes, pas des arrêts nommés. Elles doivent rester dans leur ordre et avec leur multiplicité. Il est interdit de les fusionner sur la seule égalité de texte.

Les répétitions des lignes 30 et 66 sont particulièrement nombreuses. Il faut les confronter aux pages AFTU et aux points OSM/ArcGIS disponibles avant toute tentative de nommage. Aucun nom ne doit être attribué par simple voisinage.

### Ligne 84 — référence CETUD transmise

- 73 points Aller et 73 points Retour ; les longueurs correspondent aux compteurs déclarés dans le fichier.
- La fréquence de 14 minutes est conservée avec sa provenance « CETUD — source transmise par le responsable du projet ».
- Le Retour comporte 73 heures pour 73 points ; l'Aller n'a pas de tableau d'heures dans ce fichier.
- Le dernier point Aller est « Terminus 84_54Derrière Ucad En Face Canal 4 », tandis que le premier point Retour est « Delafosse Commerce » et le dernier « Jaxaay2 Route Du 84 ».
- La fiche AFTU indexée affiche le corridor « UCAD – Jaxaay ». La liste détaillée du fichier transmis comprend des repères de Jaxaay, Mbao, Thiaroye, Patte d'Oie, VDN et UCAD. Les terminus et l'orientation exacte des deux séquences doivent être explicitement réconciliés avant toute qualification.

Décision : conserver les 73+73 points et la fréquence CETUD transmise ; ne pas réétiqueter les directions, ne pas créer les heures Aller et ne pas masquer l'écart de libellé UCAD / Delafosse.

### Ligne 85 — deux sens et répétitions

- 89 points Aller et 95 points Retour, conformément aux compteurs déclarés.
- Deux libellés sont répétés dans chaque sens ; les séquences contiennent notamment des retours locaux et des variantes de desserte.
- La fréquence de 17,5 minutes et les plages 10–15 / 15–25 minutes sont des valeurs candidates transmises, non une fréquence officielle AFTU par ligne établie par la fiche officielle consultée.

Décision : conserver les deux ordres tels quels, mais ne pas promouvoir la fréquence en donnée opérateur officielle sans preuve CETUD/opérateur rattachée à la ligne.

### Ligne 83 — retour absent

Le fichier contient 14 repères pour le parcours publié Rufisque Arafat → Zone de Captage, sans séquence Retour distincte. Le contrôle confirme l'absence du Retour ; il ne le génère pas par inversion.

## TATA : périmètre opérateur

Le CETUD décrit les minibus AFTU comme couramment appelés « Tata ». Les fiches secondaires TATA restent donc des sources de comparaison du réseau AFTU, pas un réseau opérateur séparé à additionner. Les deux rapprochements TATA 1 ↔ AFTU 1 et TATA 2 ↔ AFTU 2 restent des correspondances de corridor à examiner, pas des identités validées.

## Prochaine priorité opérationnelle

1. Reprendre les lignes 30, 57, 58, 62, 64–68, 71 et 75 en rapprochant chaque occurrence anonyme de sa position géographique sans fusion.
2. Contrôler les écarts Aller/Retour des lignes 58, 62, 65, 71 et 75 à partir des fiches primaires et des corridors OSM.
3. Pour la ligne 84, résoudre les noms des terminus et l'orientation des séquences tout en préservant les 73 arrêts par sens et les 14 minutes transmises.
4. Pour la ligne 85, documenter les deux répétitions par sens et vérifier la source de fréquence.
5. Compléter la ligne 83 uniquement lorsqu'une preuve indépendante du Retour sera disponible.

## Garde-fous

Aucun GTFS utilisé. Aucun arrêt anonyme supprimé ou renommé. Aucun retour fabriqué. Aucune fréquence nouvelle déduite. Aucun changement de données TER/BRT, Supabase, catalogue voyageurs ou production.
