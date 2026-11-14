# DDD — rapprochement des deux couches d'arrêts étiquetées ligne 13

Date : 14 novembre 2026

## Résultat du rapprochement spatial

L'extraction du second service ArcGIS contient deux couches distinctes portant le nom de ligne 13 :

- `Arret_ligne_13_Dem_Dikk` : 23 points, chacun avec `Nom_Arret` et `GlobalID`.
- `Arrets_LIgne_13_Dakar_Dem_Dikk` : 22 points, aucun `Nom_Arret`, mais des `GlobalID` distincts.

Comparaison géographique des 22 points de la couche sans nom avec les 23 points de la couche nommée, par distance géodésique entre coordonnées :

- 22/22 ont un point nommé à moins de 3 mètres.
- Distance minimale : environ 0,21 m.
- Distance maximale du plus proche voisin : environ 2,90 m.
- Les 22 correspondances retombent sur 22 points nommés distincts : appariement spatial un-à-un.
- Un point de la couche nommée n'a pas de correspondant dans la couche de 22 points.

Cela constitue un indice fort que les deux couches représentent presque le même ensemble spatial, avec une différence de couverture d'un point. Ce n'est pas une preuve d'identité métier : les GlobalID sont distincts et aucune clé commune n'a été fournie.

## Décision

1. Garder les deux couches et leurs GlobalID séparés dans l'inventaire source.
2. Enregistrer les 22 rapprochements comme candidats de doublons spatiaux, sans fusionner ni supprimer les entités.
3. Pour les 22 points de la couche sans nom, utiliser les noms de la couche nommée uniquement comme attributs de rapprochement en audit, jamais comme correction automatique de la source.
4. Ne pas déduire le sens commercial, l'ordre des arrêts, un retour, les horaires ou la fréquence de cette proximité géographique.
5. Une vérification des attributs complets et de la géométrie des deux couches reste nécessaire avant toute consolidation.

## Reproductibilité

Calcul effectué à partir de l'artefact public en lecture seule `ddd-arcgis-route-stop-candidates.json`, produit par le workflow GitHub Actions `43559510914` (artefact `14099114230`). Coordonnées ponctuelles ArcGIS converties en distances géodésiques ; appariement au plus proche voisin calculé dans les deux sens. Aucun changement de base, de données voyageurs ou de production.
