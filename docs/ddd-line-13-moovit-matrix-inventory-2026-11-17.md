# Matrices horaires Moovit — DDD ligne 13, contrôle du 17 novembre 2026

Date du contrôle : 17 novembre 2026  
Date de mise à jour affichée par Moovit sur les deux pages : 16 novembre 2026  
Source : pages horaires Moovit de la ligne DDD 13, pages distinctes pour chaque sens.

## Sources exactes

- Liberté 5 → Gare Palais : https://moovitapp.com/index/fr/transport_en_commun-time-13-Dakar-5996-1618037-18051475-4256271-0
- Gare Palais → Liberté 5 : https://moovitapp.com/index/fr/transport_en_commun-time-13-Dakar-5996-1618037-18051475-4256270-0

## Structure observée des quatre tableaux

Chaque tableau possède 30 colonnes d'arrêts ordonnées, avec une ligne de départ par course et une heure de passage par colonne.

| Sens | Période | Départs visibles | Premier départ | Dernier départ |
|---|---|---:|---:|---:|
| Liberté 5 → Gare Palais | Semaine | 53 | 06:00 | 20:35 |
| Liberté 5 → Gare Palais | Samedi | 37 | 06:30 | 20:35 |
| Gare Palais → Liberté 5 | Semaine | 51 | 06:45 | 21:00 |
| Gare Palais → Liberté 5 | Samedi | 43 | 07:00 | 21:00 |
| **Total** |  | **184 départs** |  |  |

Les horaires opérationnels affichés par les pages sont :
- Liberté 5 → Gare Palais : semaine 06:00–20:30 ; samedi 06:30–20:35.
- Gare Palais → Liberté 5 : semaine 06:45–21:00 ; samedi 07:00–21:00.

Les lignes de départ dans les tableaux peuvent présenter une heure d'arrivée au terminus légèrement postérieure à l'heure de dernier départ annoncée dans le bandeau opérationnel. Conserver séparément l'heure de départ et la dernière heure de passage au dernier arrêt.

## Contrôles structurels à appliquer à l'extraction

- 30 valeurs horaires exactement par course.
- Format strict `HH:mm`.
- Une colonne stable par arrêt dans chaque sens ; ne jamais inverser l'ordre de la matrice sans table retour dédiée.
- Les heures doivent être non décroissantes le long d'une course.
- Les heures de départ doivent être croissantes dans chaque tableau.
- Les deux sens ont des listes de 30 libellés différentes : le retour n'est pas une simple inversion de la liste aller.
- Toute extraction incomplète, colonne vide, ligne tronquée ou valeur non conforme doit faire échouer la validation et empêcher l'activation passager.

## État de l'intégration

Les pages permettent désormais d'identifier et de compter les quatre matrices complètes. Ce document enregistre leur structure et leurs bornes, mais **ne constitue pas l'import des 5 520 valeurs horaires** (184 courses × 30 arrêts).

Les horaires restent des données secondaires Moovit. Avant l'activation :
1. extraire les 5 520 valeurs et les libellés dans un artefact structuré ;
2. vérifier chaque largeur de ligne, chaque heure et la chronologie ;
3. rapprocher les 30 colonnes de chaque sens avec les arrêts officiels DDD, sans forcer les correspondances ;
4. comparer les durées et les terminus avec la page régulière DDD ;
5. conserver la source, la date de mise à jour et le statut secondaire dans les métadonnées.

Aucun horaire régulier TER/BRT, aucune donnée de production et aucun écran passager n'a été modifié.
