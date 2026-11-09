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
| DDD | [ArcGIS — arrêts](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0) | Couche de points avec les champs Nom_Arret, Nom_Ligne et Id ; projection source EPSG:32628 ; données d'arrêts modifiées le 24 septembre 2024 | **Source exploitable à conserver** : date utile comme photographie cartographique datée. Contrôler la couverture et comparer aux fiches actuelles ; la couche ne suffit pas seule à prouver l'ordre directionnel |
| DDD | [ArcGIS — itinéraires](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/1) | Couche de géométries linéaires et attributs d'itinéraires | **Source historique exploitable** : conserver les tracés comme référence géographique datée, les comparer aux itinéraires actuels et aux points d'arrêt 2024. Une date ancienne ne rend pas la géométrie inutile ; elle impose de noter sa période de validité et son niveau de corroboration |
| DDD | [ArcGIS — réseau interurbain](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer) | Service historique comprenant des couches distinctes d'arrêts et d'itinéraires pour les lignes 1, 4, 6, 7, 8, 9, 10, 13, 18, 20, 23 et 121 ; chaque couche d'arrêt porte les noms de haltes et une géométrie ponctuelle | **À exploiter comme référence historique utile** : conserver les arrêts et tracés, documenter leur date, les comparer aux autres sources et ne pas supposer qu'ils sont obsolètes du seul fait de leur ancienneté |
| AFTU | [Catalogue officiel AFTU](https://aftu-senegal.org/infos-pratiques/) | Identifiants des lignes et accès aux fiches d'itinéraire | Les fiches ne donnent pas toujours une liste ordonnée d'arrêts avec coordonnées |
| AFTU | [Fiche officielle ligne 1](https://aftu-senegal.org/map/dakar-urbain-ligne-1/) et [ligne 2](https://aftu-senegal.org/map/dakar-urbain-ligne-2/) | Tracés décrits par rues ; la ligne 2 documente notamment des rues de retour différentes | Les rues décrites ne doivent pas être converties artificiellement en arrêts |
| AFTU | [CETUD — réseau AFTU](https://cetud.sn/reseaux-de-transport/aftu/) | Contexte institutionnel et plan global des lignes | Plan global insuffisant pour ordonner les arrêts de chaque sens |
| TATA | [MoMove — guide](https://momove.app/guide) | Catalogue tiers de parcours et terminus TATA à Dakar | Source non officielle ; elle ne valide ni la liste complète des arrêts, ni leur ordre, ni les horaires |
| TATA | [Covoiturage Sénégal — itinéraires TATA](https://www.covoiturage.sn/bus-tata-itineraire/) | Source secondaire de comparaison des terminus/parcours | À corroborer avant de valider un arrêt ou une direction |

## Politique de traitement des dates anciennes

Une donnée ancienne n'est pas rejetée du seul fait de son âge. Elle est conservée avec sa date, sa provenance et son rôle : les couches historiques de l'ancien service interurbain peuvent fournir des arrêts nommés et leurs positions pour plusieurs lignes ; une géométrie de 2019 peut aider à reconstituer un corridor, comparer un itinéraire ou retrouver l'ordre spatial des arrêts ; les points d'arrêt de 2024 peuvent aider à identifier et géolocaliser les haltes. On croise ces couches entre elles et avec les fiches officielles disponibles. On marque ensuite chaque élément comme confirmé, corroboré ou à contrôler. Seule une preuve contradictoire ou une modification documentée justifie d'écarter une ancienne donnée. On ne transforme toutefois pas une ancienne géométrie en garantie que le service circule encore exactement sur ce tracé aujourd'hui.

## Niveaux de validation utilisés dans le code

- `awaiting_stops` : la ligne et ses terminus de référence sont répertoriés, mais les arrêts ordonnés du sens ne sont pas établis.
- `stops_mapped` : une séquence de points a été cartographiée ; elle n'est pas encore déclarée validée.
- `verified` : séquence du sens contrôlée avec une source exploitable et suffisamment actuelle.

La complétude d'une ligne exige que les deux sens soient `verified`. La présence d'une séquence dans un seul sens ne rend jamais la ligne complète.

## Travail restant avant activation des tableaux par arrêt

1. Exploiter en priorité les couches historiques par ligne du service interurbain DDD (arrêts et itinéraires séparés pour les lignes 1, 4, 6, 7, 8, 9, 10, 13, 18, 20, 23 et 121), puis les croiser avec les couches générales de 2019 et les points d'arrêts de 2024. Conserver les entités comme références datées, puis vérifier ligne par ligne le rattachement des points aux géométries et aux sens.
2. Comparer les géométries anciennes aux itinéraires actuellement publiés par DDD.
3. Parcourir les fiches AFTU ligne par ligne ; relever séparément les trajets Aller et Retour et obtenir des arrêts nommés, pas seulement des rues.
4. Obtenir une source opérateur ou institutionnelle pour les séquences TATA ; les catalogues secondaires ne suffisent pas à certifier les arrêts.
5. Géocoder uniquement les arrêts identifiés et contrôler leur position sur le corridor du sens concerné.
6. Ajouter des fréquences et horaires seulement lorsqu'une source publique fiable les donne pour la ligne et le sens concernés.

## Affichage passager

Le compte à rebours est une couche distincte des données de parcours. Une fréquence de ligne ne prouve pas l'heure de passage à chaque arrêt. Tant qu'aucun horaire directionnel par arrêt n'est validé, l'application ne doit pas afficher de compte à rebours local fabriqué. Le rendu doit rester cohérent avec les panneaux TER/BRT et afficher uniquement le décompte lorsqu'une donnée de passage exploitable existe.
