# Enquête approfondie — AFTU 88, 89 et 91 : applications et sources opérationnelles

Date de recherche : 14 novembre 2026
Périmètre : Dakar et sa périphérie, lignes AFTU 88, 89 et 91.
Règle : aucune séquence d'arrêts, direction retour, fréquence ou horaire n'est créée sans preuve.

## 1. Référence actuelle des numéros et corridors

La relecture directe de l'index officiel AFTU « Infos pratiques » impose l'association suivante :

| Ligne AFTU | Corridor publié par AFTU | Niveau de preuve disponible |
|---|---|---|
| 88 | Bargny – Croisement Niague (Cité SICAP) | Corridor/terminus publié, aucun ordre d'arrêts détaillé retrouvé |
| 89 | APIX – Dougar | Corridor/terminus publié, aucun ordre d'arrêts détaillé retrouvé |
| 91 | Le titre « LIGNE 91 » est affiché, sans corridor lisible après ce titre | Numéro affiché, corridor à établir |

**Attention à la numérotation :** « MTOA – Liberté 5 » appartient à la ligne 87, et non à la 88. Les transcriptions antérieures qui décalent ces corridors d'un numéro sont erronées. La ligne 90 est inexistante dans le périmètre, sur confirmation du responsable du projet.

Source primaire : https://aftu-senegal.org/infos-pratiques/ (lecture directe des sections lignes 84–91).

## 2. Sources opérateur et autorité organisatrice

### 2.1 AFTU — index public

L'index AFTU confirme les corridors des lignes 88 et 89 et affiche le numéro 91. Pour les lignes 84 à 91, les libellés « Voir itinéraire » ne sont pas des liens de fiches détaillées dans le rendu public actuellement consulté. En comparaison, la fiche AFTU de la ligne 83 existe et fournit un itinéraire textuel détaillé. Les pages candidates 88, 89 et 91 n'ont pas été retrouvées dans le site public ; les ouvertures des URL construites sur le modèle de la fiche 83 n'ont pas fourni de page exploitable. Il ne faut donc pas considérer le corridor comme une liste d'arrêts.

Fiche témoin montrant le format des détails AFTU disponibles : https://aftu-senegal.org/map/dakar-urbain-ligne-83/

### 2.2 CETUD — réseau, carte et application officielle

La page réseau AFTU du CETUD annonce 72 lignes et 2 300 bus, mais ne publie pas les séquences propres aux lignes 88, 89 et 91.

Le bouton officiel « Télécharger le plan des lignes » mène à une carte JPEG datée du répertoire 2024/11 : https://cetud.sn/wp-content/uploads/2024/11/plan-lignes-aftu.jpeg. Cette carte est utile comme contexte géographique historique, mais elle ne constitue pas une preuve suffisante pour les trois numéros recherchés : elle ne fournit ni liste ordonnée des arrêts ni tracé actuel vérifié pour les lignes 88, 89 et 91.

La fiche App Store de **CETUD Mobilités** (éditeur : CETUD) décrit une application officielle qui permet de parcourir les lignes et leurs arrêts réseau par réseau, consulter les horaires de passage par arrêt et calculer des itinéraires multimodaux. La fiche a publié la version 1.0.14 le 14 novembre 2026. C'est la meilleure application publique à examiner pour les trois lignes, mais la fiche du magasin ne publie pas elle-même les arrêts des lignes 88/89/91.

Références :
- https://cetud.sn/reseaux-de-transport/aftu/
- https://apps.apple.com/sn/app/cetud-mobilit%C3%A9s/id6814449080

### 2.3 CAPTRANS — piste opérationnelle prioritaire

Le CETUD indique explicitement que les données d'exploitation des réseaux classiques AFTU et DDD proviennent de plateformes dédiées (CAPTRANS) et/ou d'enquêtes auprès des opérateurs. Le CETUD a également documenté la mise en place d'une plateforme CAPTRANS centralisant les données issues de l'exploitation AFTU, avec suivi des départs et arrivées de minibus aux terminus et supervision de l'activité.

Cela identifie CAPTRANS comme une piste beaucoup plus proche de l'exploitation réelle que les catalogues d'applications tierces. Aucun export public des séquences 88/89/91 n'a cependant été trouvé sur son site.

Références :
- CETUD, système de données : https://cetud.sn/observatoire/systeme-de-donnees/
- CETUD, lancement de la plateforme CAPTRANS (19/08/2019) : https://cetud.sn/mobilite-urbaine-a-l-ere-du-numerique-le-cetud-lance-une-plateforme-de-centralisation-des-donnees-pour-un-meilleur-suivi-de-l-exploitation-des-transports-en-commun-par-minibus/
- CAPTRANS : https://captrans.sn/

Le CETUD précise également avoir créé des fichiers GTFS contenant lignes, arrêts, itinéraires, trajets, tarifs et services. Le GTFS reste une piste de vérification si une version publique exploitable est accessible ; il ne devient pas une condition bloquante du chantier.

## 3. Applications de mobilité examinées

| Application / source | Couverture annoncée ou observée | Résultat pour 88 / 89 / 91 | Valeur pour l'enquête |
|---|---|---|---|
| **CETUD Mobilités** | Application officielle CETUD ; lignes, arrêts, horaires par arrêt et calcul d'itinéraires | La fiche magasin ne donne pas les séquences ; contenu interne de l'application à examiner | Priorité maximale |
| **FastFey** | Notes de version mentionnant un filtre AFTU (lignes « A »), en plus de BRT et TER | Aucun résultat public indexé par numéro 88/89/91 | Candidat sérieux à tester dans l'application |
| **Seddo** | Application de mobilité Dakar ; historique App Store mentionnant explicitement les lignes AFTU, BRT et DDD | Aucun détail public trouvé pour les trois numéros | Candidat sérieux à tester dans l'application |
| **PassBi** | Application indépendante de calcul multimodal ; déclare utiliser les GTFS publics centralisés par CETUD et intégrer progressivement AFTU | Aucune séquence 88/89/91 publiquement visible dans la fiche magasin | Priorité élevée si ses données AFTU sont effectivement intégrées |
| **Moovit** | Page AFTU Dakar : 64 lignes et 1 634 arrêts ; son inventaire public consulté ne fait pas apparaître les nouveaux corridors 88/89/91 | Pas de fiche Dakar AFTU trouvée pour ces numéros | Catalogue incomplet ou en retard ; ne permet pas de conclure que les lignes n'existent pas |
| **MoMove** | 109 lignes cartographiées à Dakar, données annoncées au 09/06/2026 | Le tableau public ne fournit pas de fiche AFTU 88/89/91. Les lignes 60/68/74 qui mentionnent Bargny sont étiquetées TATA, pas AFTU | Indice cartographique partiel ; attention aux collisions de numéros entre réseaux |
| **Transitrun** | Répertoire AFTU annoncé à 64 lignes et 3 813 arrêts ; liste publique terminant à la ligne 84 | Aucun 88/89/91 | Référentiel secondaire ancien/incomplet, non corroborant |
| **Dakar Transit** | Site promotionnel annonçant 64 lignes AFTU et 1 634 arrêts | Aucun détail de ligne ni jeu de données public exploitable trouvé sur le site | À ne pas utiliser comme preuve sans accès à ses données réelles |
| **Weego** | Guide voyageurs renvoyant vers le plan de lignes CETUD pour AFTU | Pas de séquence propre aux trois lignes | Guide d'orientation, pas une source de parcours AFTU |
| **Bus Bii** | Application orientée DDD et TATA ; sa fiche magasin indique les filtres DDD/TATA | Pas de preuve de couverture AFTU 88/89/91 | Ne pas confondre ses lignes TATA avec les lignes AFTU |
| **Talibi** | Application sénégalaise annonçant la recherche d'itinéraires, les lignes et arrêts de bus ; provenance détaillée des données non publiée | Aucun numéro 88/89/91 publiquement vérifié | Piste secondaire à tester, provenance à établir |
| **SunuBRT** | Application Dakar Mobilité, centrée sur l'information réseau et les trajets multimodaux | Pas de séquence AFTU 88/89/91 publiée dans sa fiche | Source complémentaire, pas preuve AFTU directe |

Références principales des applications :
- FastFey : https://apps.apple.com/sn/app/fastfey/id6739596735
- Seddo : https://apps.apple.com/sn/app/seddo/id6737347803 et https://play.google.com/store/apps/details?id=com.wakana.seddo
- PassBi : https://play.google.com/store/apps/details?id=com.senpassbi.app et https://senpassbi.com/
- Moovit AFTU : https://moovitapp.com/index/fr/transport_en_commun-lines-Dakar-5996-1618038
- MoMove : https://momove.app/guide
- Transitrun : https://transitrun.com/fr/public-transit-lines_AFTU_12223
- Weego : https://weegolife.com/en/guides/transports-dakar/lignes-bus-dakar
- Bus Bii : https://play.google.com/store/apps/details?id=com.busbi.topandbrice
- Talibi : https://play.google.com/store/apps/details?hl=fr&id=com.talibi.app
- SunuBRT : https://play.google.com/store/apps/details?id=prod.maasify.dakar

## 4. Documents de planification et cartes

Le guide officiel de mobilité des JOJ Dakar 2026 présente une sélection de lignes AFTU utiles pour desservir certains sites. Il ne prétend pas recenser tout le réseau et ne cite pas 88, 89 ou 91. Son silence n'est donc pas une preuve d'inexistence.

Le plan AFTU CETUD de novembre 2024 est antérieur à l'index actuel. Il peut aider à comprendre les grands axes, mais ne permet pas de reconstituer les trois nouvelles lignes.

Références :
- Guide officiel JOJ/CETUD : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf
- Carte AFTU CETUD : https://cetud.sn/wp-content/uploads/2024/11/plan-lignes-aftu.jpeg

## 5. Bilan probatoire actuel

### Ligne 88 — Bargny / Croisement Niague (Cité SICAP)
- Confirmé : l'index AFTU publie ces deux extrémités.
- Non confirmé : les arrêts intermédiaires, leur ordre, la variante exacte de terminus à Bargny, le tracé et le sens retour.
- Attention : les lignes TATA 60, 68 et 74 qui passent par Bargny dans certains catalogues ne sont pas la ligne AFTU 88.

### Ligne 89 — APIX / Dougar
- Confirmé : l'index AFTU publie ces deux extrémités.
- Non confirmé : les arrêts intermédiaires, leur ordre, le tracé et le sens retour.
- Attention : la présence de « Cité APIX » dans d'autres lignes AFTU ne prouve pas qu'elles appartiennent à la ligne 89.

### Ligne 91
- Confirmé : le titre « LIGNE 91 » apparaît sur l'index AFTU.
- Non confirmé : corridor, terminus, arrêts, tracé et directions.
- Ne pas lui attribuer APIX – Dougar : ce corridor est celui de la ligne 89 dans l'index actuellement publié.

### Niveau de conclusion
À ce stade, aucune application tierce consultée ne fournit publiquement une séquence d'arrêts exploitable et corroborée pour les trois lignes. L'absence dans Moovit, MoMove ou Transitrun est une absence de données publiées dans ces catalogues, pas une preuve que les lignes n'existent pas.

## 6. Prochaine phase de recherche

1. Examiner dans l'application CETUD Mobilités les fiches exactes 88, 89 et 91, leurs deux directions, les arrêts et les horaires affichés ; conserver les libellés tels qu'ils apparaissent.
2. Tester les mêmes recherches dans FastFey et Seddo, puis comparer chaque arrêt avec CETUD et AFTU. Relever la date/version de l'application et les captures de chaque sens.
3. Vérifier PassBi et sa provenance GTFS : présence effective des lignes, route_id, trip_id, direction_id, stop_id, ordre stop_sequence et dates de validité. Ne pas supposer qu'une intégration annoncée couvre tous les services AFTU.
4. Chercher auprès de CAPTRANS et des GIE concernés les fiches opérationnelles ou relevés de terminus qui permettraient de confirmer les parcours. CAPTRANS est identifié par le CETUD comme plateforme de données d'exploitation AFTU.
5. Rechercher ensuite une corroboration géographique indépendante (OSM et cartographie routière), sans convertir un simple tracé routier en séquence d'arrêts.
6. Conserver séparément aller et retour. Une direction ne sera jamais fabriquée par inversion de l'autre.

## 7. Protection du projet

Cette enquête est documentaire. Aucun itinéraire passager n'est ajouté sur la seule base de terminus. Aucun horaire ou intervalle n'est estimé pour ces lignes. Les données TER/BRT restent inchangées. Aucune écriture Supabase, mise en production ou fusion de PR n'est effectuée.

## 8. Vérification complémentaire — carte CETUD, accès aux données et applications (14 novembre 2026)

### 8.1 Carte officielle AFTU accessible depuis le CETUD

Le bouton « Télécharger le plan des lignes » de la page institutionnelle AFTU du CETUD a été suivi directement. Il mène à :
https://cetud.sn/wp-content/uploads/2024/11/plan-lignes-aftu.jpeg

La carte est un document cartographique de novembre 2024. Elle donne un aperçu des corridors AFTU représentés à cette date, mais ne fournit ni liste d'arrêts ordonnée, ni tableau des deux directions, ni horaires. Elle ne permet pas d'identifier avec assez de certitude une séquence exploitable pour les lignes 88, 89 et 91. Elle ne doit donc pas servir à construire leurs arrêts intermédiaires.

### 8.2 Point d'entrée institutionnel pour obtenir les données

La page actuelle du système de données du CETUD précise explicitement :
- les données d'exploitation des réseaux classiques AFTU et DDD proviennent de plateformes dédiées (CAPTRANS) et/ou d'enquêtes auprès des opérateurs ;
- les fichiers GTFS du CETUD sont conçus pour contenir lignes, arrêts, itinéraires, trajets, tarifs et services ;
- le contact de l'Observatoire est **observatoire@cetud.sn**, téléphone **+221 33 859 47 20**.

Page de référence : https://cetud.sn/observatoire/systeme-de-donnees/

Le site actuel de CAPTRANS donne les coordonnées suivantes : **captrans@captrans.sn**, **+221 33 877 60 38**, Guédiawaye, quartier Mbode 3. La page décrit la gestion et la supervision opérationnelle de bus AFTU, mais ne publie pas de fichiers d'itinéraires ni de données de séquences 88/89/91.

Page : https://captrans.sn/index.php/aftu/

Ces coordonnées constituent des voies de demande de données primaires. Elles ne signifient pas que CAPTRANS ou le CETUD ont déjà confirmé les parcours des trois lignes.

### 8.3 Contrôle plus strict des fiches d'applications

- **CETUD Mobilités** : sa fiche officielle CETUD indique que le réseau et le calcul d'itinéraires sont consultables sans compte. C'est la première interface à interroger directement. La fiche magasin ne donne toutefois aucune séquence ligne par ligne.
- **FastFey** : les notes de version 2.0.0 (08/07/2025) annoncent un filtre AFTU (« lignes A »), BRT et TER. La fiche publique comporte aussi un avis utilisateur signalant des lignes manquantes. Cet avis n'est pas une preuve technique, mais rappelle qu'une absence ou présence dans l'application doit être contrôlée ligne par ligne.
- **Seddo** : la fiche Google Play actuelle décrit la recherche d'itinéraires, les lignes et arrêts intermédiaires et la navigation vers les arrêts. Elle ne documente pas publiquement l'origine des données ni une couverture garantie de toutes les lignes AFTU. La promesse fonctionnelle ne suffit donc pas à corroborer 88/89/91.
- **PassBi** : sa fiche Google Play précise que l'intégration AFTU est progressive, et que les sources déclarées comprennent les GTFS publics centralisés par le CETUD ainsi que des sources opérateurs. L'éditeur précise que l'application est indépendante et n'est pas affiliée à un organisme public. Il faut contrôler les identifiants et dates des données avant d'utiliser un itinéraire affiché comme preuve.
- **SunuBRT** : sa fiche Google Play annonce la consultation de lignes, horaires, arrêts proches et calcul d'itinéraires multimodaux. Elle ne prouve pas que les trois lignes AFTU sont incluses.
- **Bus Bii** : sa fiche décrit explicitement les itinéraires TATA et Dakar Dem Dikk. Elle n'est pas une source directe pour l'identité des lignes AFTU 88, 89 et 91.
- **Dakar Transit** : son site promotionnel annonce 64 lignes AFTU, mais aucune fiche détaillée publique ni export exploitable des lignes 88/89/91 n'a été obtenu. Ne pas traiter le nombre annoncé comme une preuve de couverture de ces numéros.

Références complémentaires :
- CETUD Mobilités : https://apps.apple.com/sn/app/cetud-mobilit%C3%A9s/id6814449080
- FastFey : https://apps.apple.com/fr/app/fastfey/id6739596735
- Seddo : https://play.google.com/store/apps/details?id=com.wakana.seddo
- PassBi : https://play.google.com/store/apps/details?id=com.senpassbi.app
- SunuBRT : https://play.google.com/store/apps/details?hl=fr&id=prod.maasify.dakar
- Bus Bii : https://play.google.com/store/apps/details?hl=fr&id=com.busbi.topandbrice
- Dakar Transit : https://dakartransitsenegal.online/

### 8.4 Conclusion opérationnelle mise à jour

La recherche publique permet désormais de confirmer le meilleur chemin d'accès aux données primaires : CETUD / Observatoire et CAPTRANS. Elle n'a pas encore révélé de fichier public contenant les séquences complètes des lignes 88, 89 ou 91. Les applications tierces annoncent des fonctionnalités utiles, mais leurs fiches magasins ne prouvent pas la couverture des trois lignes.

La prochaine vérification doit porter sur les données réellement servies dans les applications et, en parallèle, sur une demande ciblée au CETUD/CAPTRANS : fiches de ligne, arrêts ordonnés, sens aller/retour, identifiants d'arrêts, date de validité et source de la donnée. Toute séquence issue d'une application sera comparée à une source indépendante avant d'être qualifiée.
