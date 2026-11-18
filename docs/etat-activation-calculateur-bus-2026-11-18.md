# État d'activation du calculateur bus — 18 novembre 2026

## Décision de sûreté

Les sept corridors DDD / AFTU / TATA actuellement présents dans le petit graphe de démonstration ne sont pas des lignes passagers validées. Leurs arrêts et enchaînements sont des points de référence de quartier ; ils ne disposent pas tous d'une géométrie routière directionnelle exploitable. Le calculateur ne doit donc pas les proposer comme des courses réelles tant que les preuves requises ne sont pas réunies.

Les lignes concernées sont `ddd-1`, `ddd-2`, `ddd-3`, `aftu-1`, `aftu-2`, `aftu-3` et `tata-1`. Elles restent présentes dans le référentiel de données pour les audits et la préparation cartographique, mais sont marquées `plannerEnabled: false`.

Cette mesure ne supprime pas les données ni les tracés cartographiques sources. Elle empêche seulement le moteur de calcul de convertir des distances à vol d'oiseau entre points de quartier en kilomètres parcourus par un bus.

## Éléments vérifiés

### DDD

- La couche ArcGIS `Dem_dikk_mise_a_jour` contient 777 entités d'arrêts et 25 entités d'itinéraires ; les dates déclarées sont 24 septembre 2024 pour les arrêts et 11 janvier 2019 pour les géométries de ligne.
- L'audit de 18 séquences candidates donne 14 compatibilités d'ordre aller, 0 ordre retour certifié et 4 cas non résolus.
- Le classement par chaînage sur une polyligne ArcGIS décrit un ordre géométrique, pas automatiquement le sens commercial exploité.
- Les arrêts ArcGIS restent une base historique cartographique ; leur présence ne prouve pas le service actuel.

Source : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer

### AFTU

- La page institutionnelle AFTU/CETUD confirme le réseau et son catalogue de lignes.
- Les 28 fichiers détaillés actuellement audités possèdent des séquences aller/retour, mais aucune étape géolocalisée dans les sources retranscrites ; 629 libellés d'arrêt sont génériques.
- Dix des 28 fichiers n'ont pas les deux grilles directionnelles.
- Une fiche de ligne comme la ligne 60 fournit un itinéraire textuel (axes et localités), pas une polyligne routière ni les coordonnées de chaque arrêt.

Sources :
- https://cetud.sn/reseaux-de-transport/aftu/
- https://aftu-senegal.org/infos-pratiques/
- https://aftu-senegal.org/map/dakar-urbain-ligne-60/

### TATA

- Le catalogue audité comprend 62 lignes.
- Aucune des 62 n'a encore de séquence retour dans l'inventaire.
- Aucune étape n'est géolocalisée dans les fichiers sources audités.

## Conditions de réactivation

Une ligne pourra être réactivée seulement après validation de chacun des points suivants :

1. Identifiant de ligne et opérateur concordant avec une source traçable.
2. Deux séquences commerciales distinctes aller et retour ; aucun retour créé par inversion automatique.
3. Arrêts physiques géolocalisés et reliés à des identifiants de source.
4. Polyligne routière continue pour chaque sens, issue d'une relation OSM attribuée ou d'une source opérateur/autorité.
5. Projection de chaque arrêt sur la bonne polyligne, dans l'ordre, avec une tolérance documentée.
6. Accès, sorties et correspondances à pied raccordés à un graphe piéton continu et contrôlé.
7. Tests de non-régression et CI entièrement verts.

Les rapprochements de noms, les coordonnées approximatives de quartiers et les tracés de carte sans sens certifié ne satisfont pas ces conditions.

## Périmètre protégé

Aucun changement aux horaires, fréquences, arrêts ou tracés de référence TER/BRT n'est effectué par cette mesure.
