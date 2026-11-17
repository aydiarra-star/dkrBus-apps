# Audit géométrique DDD / AFTU / TATA — 17 novembre 2026

Cet audit provient des artefacts générés par la CI Dakar Bus le 17 novembre 2026. Il sert à décider quelles géométries peuvent être activées sans fabriquer de trajet. Les artefacts bruts restent téléchargeables depuis l'exécution CI qui a produit les rapports.

## DDD — géométries ArcGIS et séquences publiées

Source ArcGIS : service Dem Dikk, couche d'arrêts `Dem_dikk_mise_a_jour` et couche d'itinéraires de banlieue.

- 777 entités d'arrêts, 25 entités d'itinéraire.
- Dernière modification déclarée des arrêts : 24 septembre 2024.
- Dernière modification déclarée des géométries de ligne : 11 janvier 2019.
- 18 séquences candidates, 593 arrêts candidats.
- 6 groupes exclus pour ambiguïté de groupe source ou géométrie d'arrêt à revoir.
- Contrôle de proximité : 777 lignes de contrôle, 718 points à 25 m ou moins d'une géométrie nommée, 52 au-delà de 100 m, 6 sans correspondance de ligne nommée et 2 sans géométrie d'arrêt.

Les 18 candidats sont triés par chainage le long de la polyligne ArcGIS. Cela donne un ordre géométrique, pas une direction commerciale certifiée.

| Ligne candidate | Arrêts | Géométrie (km) | Écart max arrêt/ligne (m) | Contrôle séquence |
|---|---:|---:|---:|---|
| 1 | 44 | 17,872 | 14,9 | Compatible aller |
| 2 | 32 | 26,253 | 15,0 | Non résolu |
| 4 | 29 | 12,222 | 12,2 | Compatible aller |
| 5 | 18 | 21,117 | 9,5 | Non résolu |
| 6 | 60 | 23,547 | 11,6 | Compatible aller |
| 7 | 33 | 14,117 | 14,3 | Compatible aller |
| 8 | 49 | 21,152 | 12,1 | Compatible aller |
| 9 | 36 | 13,410 | 15,3 | Compatible aller |
| 10 | 26 | 15,392 | 12,2 | Compatible aller |
| 11 | 23 | 27,291 | 17,1 | Non résolu |
| 12 | 40 | 23,651 | 9,5 | Compatible aller |
| 16A | 13 | 26,179 | 13,4 | Non résolu |
| 16B | 30 | 28,874 | 16,8 | Compatible aller |
| 18 | 44 | 18,588 | 8,4 | Compatible aller |
| 23 | 54 | 22,269 | 10,5 | Compatible aller |
| 121 | 31 | 12,318 | 10,9 | Compatible aller |
| 227 | 8 | 19,780 | 9,0 | Compatible aller |
| 232 | 23 | 15,653 | 9,7 | Compatible aller |

Le contrôle des séquences publiées compare 18 lignes : 14 sont compatibles dans l'ordre aller, aucune n'est certifiée dans l'ordre retour, 4 restent non résolues. La certification de direction reste explicitement `NONE`. Les noms rapprochés ne sont que des ancres candidates et non une preuve d'identité ou de sens.

**Décision :** conserver ces géométries comme candidats historiques pour l'audit et l'affichage différencié, mais ne pas les activer dans le calculateur tant que le sens retour et les séquences commerciales correspondantes ne sont pas établis. Ne pas inverser automatiquement la polyligne pour fabriquer le retour.

## AFTU — état de géolocalisation

- 28 fichiers détaillés de lignes.
- Les 28 disposent de séquences aller et retour dans les sources retranscrites.
- 18 disposent des deux horaires directionnels ; les lignes 80, 83, 84, 85-unverified, 86, 87, 88, 89, 90 et 91 ont une ou deux grilles manquantes.
- 0 waypoint géolocalisé à ce stade.
- 629 libellés génériques « Arrêt de bus ».
- La ligne 85 reste non vérifiée.

**Décision :** les séquences texte ne sont pas encore des géométries de voies. Il faut géocoder les repères et arrêts réels, les faire correspondre aux ways routiers, vérifier les deux sens et raccorder les arrêts/quais. Ne pas transformer un waypoint textuel en point de carte arbitraire.

## TATA — état de géolocalisation

- 62 lignes dans le catalogue de référence.
- 0 séquence retour présente dans l'inventaire.
- 62 lignes avec un seul sens décrit.
- 0 waypoint géolocalisé.

**Décision :** aucune ligne TATA ne peut encore être activée comme itinéraire directionnel complet. Il faut obtenir ou confirmer les retours, géocoder les séquences aller/retour et les faire correspondre aux ways routiers.

## Rapprochement des noms AFTU/TATA ↔ DDD

Sur 1 373 noms de waypoints distincts :
- 18 correspondances exactes avec une seule localisation candidate ;
- 23 noms ambigus ;
- 1 329 sans correspondance exacte DDD ;
- 3 libellés génériques.

La règle de l'audit est stricte : correspondance normalisée exacte uniquement ; plusieurs lieux possibles restent ambigus ; aucun géocodage flou automatique.

## Règle d'activation

Une ligne ne peut entrer dans le calculateur que si ses deux sens ont une géométrie routière continue, ses arrêts/quais sont identifiés et projetés dans l'ordre, et les accès/correspondances piétons disposent d'un chemin continu sur le graphe piéton. Les sources historiques et communautaires sont indiquées comme telles. Les absences et conflits restent des exclusions, jamais des raccourcis.

Les fréquences TER/BRT validées et les horaires existants ne sont pas modifiés par cet audit.
