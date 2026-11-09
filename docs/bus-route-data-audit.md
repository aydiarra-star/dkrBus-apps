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

## Inventaire technique DDD intégré

Le fichier `src/data/dddHistoricalArcgisRegistry.ts` conserve les identifiants des couches historiques et les estimations publiées par le service ArcGIS : lignes 1 (44 points), 4 (30), 6 (60), 7 (34), 8 (49), 9 (36), 10 (26), 13 (deux couches distinctes : 23 et 22 points), 18 (44), 23 (56) et 121 (31). Cela représente 455 entités d'arrêt estimées dans les douze couches recensées. Les deux couches de la ligne 13 sont conservées séparément, sans supposer qu'elles sont identiques. La ligne 20 dispose d'une géométrie d'itinéraire (couche 15), mais aucune couche d'arrêts correspondante n'est identifiée dans cet inventaire : elle reste explicitement à compléter, sans créer de points fictifs.

Les identifiants de couches et volumes sont conservés comme métadonnées de source, dans le système de coordonnées EPSG:32628. Ils ne sont pas encore importés comme séquences Aller/Retour : le service publie des points par ligne, mais les informations consultées ne prouvent pas à elles seules l'ordre de desserte ni le sens de chaque point. Le registre garde donc `directionOrderVerified: false`.


## Résultat de la consolidation historique — DDD ligne 13

Les deux couches ont maintenant été interrogées directement par l'API ArcGIS, et leurs entités ont été comparées par coordonnées dans la projection native EPSG:32628 :

- Couche 0 : 23 entités, avec `Nom_Arret` et géométrie ponctuelle.
- Couche 8 : 22 entités, avec `Id` et géométrie ponctuelle.
- Vingt-deux entités de la couche 8 ont une correspondance spatiale avec vingt-deux points de la couche 0 ; les écarts mesurés vont d'environ 0,2 m à 2,9 m.
- Un point supplémentaire de la couche 0 (OBJECTID 2, « Arret Terminus Liberté 5 ») se trouve à environ 26,3 m du point le plus proche de la couche 8. Il est conservé comme point distinct, sans le supprimer ni l'assimiler au terminus voisin.

Le fichier `src/data/dddLine13HistoricalMerged.ts` rassemble donc les 45 enregistrements sources en 23 points consolidés provisoires : les 22 rapprochements conservent les deux identifiants, les deux coordonnées d'origine et leur écart ; le point non apparié est conservé séparément. **Aucune donnée source brute n'est détruite.** Les rapprochements sont qualifiés de « doublons spatiaux candidats », pas de doublons commerciaux définitivement prouvés.

La géométrie historique de l'itinéraire (couche 13) comporte un tracé de 138 sommets et une longueur publiée d'environ 10,56 km. La projection des points sur ce tracé donne un chaînage croissant compatible avec l'ordre OBJECTID de la couche 0. Cet ordre spatial sert au classement technique de la couche historique ; il ne suffit pas à certifier le sens actuellement exploité. La fiche d'itinéraire historique date du 13 décembre 2017 et mentionne des terminus Dieuppeul / Palais 2, alors que les points d'arrêt nomment Liberté 5 / Palais 1 : cette divergence est conservée comme contrôle à effectuer, et non corrigée par supposition.

Les coordonnées WGS84 ont été calculées à partir des coordonnées sources EPSG:32628 pour permettre la cartographie. Cette consolidation historique n'est pas encore déclarée comme séquence Aller ou Retour actuelle ; elle doit être confrontée à la fiche officielle actuelle et aux observations récentes avant activation comme parcours passager.


## Résultat du classement géographique des autres couches DDD

L'extraction et le rapprochement spatial avec les géométries d'itinéraire ont été automatisés dans `scripts/extract_ddd_historical_arcgis.mjs` et `scripts/analyze_ddd_historical_arcgis.mjs`. L'exécution du 9 novembre 2026 a traité les douze couches d'arrêts historiques :

- 455 enregistrements bruts récupérés ;
- 454 enregistrements disposent d'une géométrie ponctuelle ;
- un enregistrement de la ligne 7 (couche 2) n'a pas de géométrie et reste conservé sans coordonnées ;
- les 49 points de la ligne 8 (couche 3) ne disposent pas de champ `Nom_Arret` : ils sont localisables mais pas nommables à partir de cette couche ;
- les 22 points de la deuxième couche de la ligne 13 (couche 8) ont un champ `Id` mais aucun nom d'arrêt ; ils ont été rapprochés spatialement de 22 des 23 points nommés de la couche 0 ;
- la couche d'arrêts de la ligne 18 (couche 9) présente deux ruptures dans la progression du chaînage quand on suit les OBJECTID : son ordre doit être contrôlé avant de l'utiliser comme séquence ;
- pour les autres couches, les OBJECTID progressent dans le même sens que le chaînage calculé sur la géométrie historique associée.

La distance maximale entre un point et sa géométrie d'itinéraire historique varie d'environ 8,4 m à 23 m selon la couche. Le script produit un fichier de candidats ordonnés par chaînage pour chaque couche et un résumé `ordered-candidates-summary.json` dans l'artefact GitHub Actions `ddd-historical-arcgis-snapshots`.

**Ce classement est une aide à la reconstitution, pas une certification Aller/Retour.** Les couches contiennent un seul tracé de référence par ligne, et le chaînage indique une position le long de ce tracé. Il ne prouve pas à lui seul le sens exploité, l'actualité de l'arrêt ou les horaires. Les lignes 13 et 18 nécessitent notamment un contrôle de terminus et d'orientation ; la ligne 8 nécessite une source permettant de nommer les points. La ligne 20 conserve sa géométrie historique, mais aucune couche d'arrêts correspondante n'a été trouvée dans cet inventaire.

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
