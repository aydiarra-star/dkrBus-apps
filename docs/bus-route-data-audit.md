# Audit des sources de parcours — DDD, AFTU et TATA

## Règles non négociables

- Les réseaux DDD, AFTU et TATA sont trois opérateurs distincts. Un numéro de ligne identique ne crée jamais une correspondance entre réseaux.
- Chaque ligne comporte deux directions autonomes : `outbound` (Aller) et `inbound` (Retour).
- La séquence d'arrêts du Retour n'est jamais produite en inversant celle de l'Aller.
- Une rue traversée n'est pas automatiquement un arrêt commercial.
- Un terminus, un arrêt, une coordonnée, un ordre de desserte ou une fréquence non documentés restent non renseignés.
- Aucun flux GTFS n'est requis par ce référentiel.

## État des sources consultées

| Réseau | Source | Ce qu'elle permet d'établir | Limite à respecter |
| --- | --- | --- | --- |
| DDD | [Info voyageurs officielle](https://demdikk.sn/info-voyageurs/) | Catalogue des lignes et terminus publiés | Ne fournit pas à elle seule les séquences détaillées de tous les arrêts |
| DDD | [Réseau urbain officiel](https://demdikk.sn/reseau-urbain-dakar/) | Descriptions d'itinéraires et arrêts de certaines lignes | Couverture partielle du réseau |
| DDD | [ArcGIS — arrêts](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0) | Couche de points avec les champs Nom_Arret, Nom_Ligne et Id ; projection source EPSG:32628 ; données d'arrêts modifiées le 24 septembre 2024 | L'ancienneté et la couverture doivent être contrôlées ligne par ligne ; la couche ne suffit pas à prouver l'ordre directionnel |
| DDD | [ArcGIS — itinéraires](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/1) | Couche de géométries linéaires et attributs d'itinéraires | Les données de géométrie indiquées par le service datent du 11 janvier 2019 ; ne pas les traiter comme preuve de tracé actuel sans contrôle |
| DDD | [ArcGIS — réseau interurbain](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer) | Couches séparées d'arrêts et d'itinéraires pour plusieurs lignes | Couverture historique/partielle ; validation de fraîcheur nécessaire |
| AFTU | [Catalogue officiel AFTU](https://aftu-senegal.org/infos-pratiques/) | Identifiants des lignes et accès aux fiches d'itinéraire | Les fiches ne donnent pas toujours une liste ordonnée d'arrêts avec coordonnées |
| AFTU | [Fiche officielle ligne 1](https://aftu-senegal.org/map/dakar-urbain-ligne-1/) et [ligne 2](https://aftu-senegal.org/map/dakar-urbain-ligne-2/) | Tracés décrits par rues ; la ligne 2 documente notamment des rues de retour différentes | Les rues décrites ne doivent pas être converties artificiellement en arrêts |
| AFTU | [CETUD — réseau AFTU](https://cetud.sn/reseaux-de-transport/aftu/) | Contexte institutionnel et plan global des lignes | Plan global insuffisant pour ordonner les arrêts de chaque sens |
| TATA | [MoMove — guide](https://momove.app/guide) | Catalogue tiers de parcours et terminus TATA à Dakar | Source non officielle ; elle ne valide ni la liste complète des arrêts, ni leur ordre, ni les horaires |
| TATA | [Covoiturage Sénégal — itinéraires TATA](https://www.covoiturage.sn/bus-tata-itineraire/) | Source secondaire de comparaison des terminus/parcours | À corroborer avant de valider un arrêt ou une direction |

## Niveaux de validation utilisés dans le code

- `awaiting_stops` : la ligne et ses terminus de référence sont répertoriés, mais les arrêts ordonnés du sens ne sont pas établis.
- `stops_mapped` : une séquence de points a été cartographiée ; elle n'est pas encore déclarée validée.
- `verified` : séquence du sens contrôlée avec une source exploitable et suffisamment actuelle.

La complétude d'une ligne exige que les deux sens soient `verified`. La présence d'une séquence dans un seul sens ne rend jamais la ligne complète.

## Travail restant avant activation des tableaux par arrêt

1. Extraire les entités des couches ArcGIS DDD et vérifier, ligne par ligne, le rattachement des points aux géométries et aux sens. Les points seuls ne déterminent pas leur ordre.
2. Comparer les géométries anciennes aux itinéraires actuellement publiés par DDD.
3. Parcourir les fiches AFTU ligne par ligne ; relever séparément les trajets Aller et Retour et obtenir des arrêts nommés, pas seulement des rues.
4. Obtenir une source opérateur ou institutionnelle pour les séquences TATA ; les catalogues secondaires ne suffisent pas à certifier les arrêts.
5. Géocoder uniquement les arrêts identifiés et contrôler leur position sur le corridor du sens concerné.
6. Ajouter des fréquences et horaires seulement lorsqu'une source publique fiable les donne pour la ligne et le sens concernés.

## Affichage passager

Le compte à rebours est une couche distincte des données de parcours. Une fréquence de ligne ne prouve pas l'heure de passage à chaque arrêt. Tant qu'aucun horaire directionnel par arrêt n'est validé, l'application ne doit pas afficher de compte à rebours local fabriqué. Le rendu doit rester cohérent avec les panneaux TER/BRT et afficher uniquement le décompte lorsqu'une donnée de passage exploitable existe.
