# Politique d'acceptation des sources — Dakar Bus

**Décision validée le 17 novembre 2026**

## Règle obligatoire

Une donnée correctement sourcée est retenue même si sa date de mise à jour est ancienne. L'ancienneté n'est pas un motif automatique de rejet. La provenance et la fraîcheur sont deux informations distinctes :

- Provenance : organisme/source, URL précise, couche ou document, champs utilisés.
- Date des données : date de dernière modification annoncée par la source, lorsqu'elle existe.
- Date de collecte : date à laquelle Dakar Bus a récupéré une copie.
- Statut d'usage : donnée officielle publiée, donnée historique, rapprochement cartographique candidat ou donnée opérationnelle vérifiée.

Une alerte d'ancienneté peut déclencher un contrôle complémentaire, mais ne doit jamais supprimer ni écarter automatiquement une donnée correctement sourcée. Une donnée récente sans provenance vérifiable ne remplace pas une donnée ancienne sourcée.

## Source DDD validée

- Service : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer
- Couche d'arrêts : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0
- Type : points géographiques ; champs notamment Nom_Arret, Nom_Ligne, Id.
- Dernière modification annoncée par ArcGIS pour la couche : **24 septembre 2024 à 12:00:06**.
- Décision : **source acceptée et conservée**, conformément à la règle validée par l'utilisateur le 17 novembre 2026.

La date du 24 septembre 2024 est la date de mise à jour indiquée par le service ArcGIS, pas la date de collecte ni une preuve que chaque arrêt est encore exploité aujourd'hui. Les arrêts restent une base historique officielle exploitable pour la cartographie, la comparaison et la reconstruction des séquences. Tout rapprochement avec OSM, Moovit, MoMove ou d'autres sources conserve sa propre provenance et son statut candidat/validé.

## Garde-fous d'intégration

1. Ne jamais modifier les données ni les affichages TER/BRT déjà validés.
2. Conserver séparément les séquences aller et retour ; ne pas créer un retour en inversant automatiquement l'aller.
3. Ne pas calculer de compte à rebours par arrêt sans une séquence directionnelle et des temps cumulés propres à chaque arrêt.
4. Une géométrie ou un arrêt proche n'est pas, à lui seul, une preuve d'identité ou d'ordre opérationnel.
5. Ne pas afficher publiquement les mentions « estimation » ou « indicatif » dans les panneaux voyageurs déjà spécifiés ; conserver la provenance, la date et le niveau de validation dans les données internes.
6. Ne pas fusionner ni déployer automatiquement une modification avant les tests et contrôles de non-régression.

## Références techniques

- Calcul existant des passages par arrêt : src/domain/stopPassageCountdown.ts.
- Rapprochements AFTU/TATA ↔ OSM : scripts/build_aftu_tata_osm_stop_crosswalk.node.mjs.
- Rapprochements AFTU/TATA ↔ DDD : scripts/build_aftu_tata_ddd_stop_crosswalk.node.mjs.
- Extraction des couches DDD : scripts/extract_ddd_historical_arcgis.mjs et scripts/export_ddd_arcgis_layers.mjs.

La règle de conservation des sources anciennes est testée dans src/domain/sourceEvidencePolicy.test.ts.


## Source officielle DDD complémentaire — contrôle du 17 novembre 2026

Une consultation du site officiel DDD a identifié une page voyageurs plus récente dans son contenu public que la couche géographique ArcGIS :

- Page officielle : https://demdikk.sn/info-voyageurs/
- Date de consultation Dakar Bus : **17 novembre 2026**.
- Date de dernière mise à jour éditoriale : **non affichée par le site** ; ne pas confondre la date de consultation avec une date de publication.
- Contenu : lignes urbaines, lignes de banlieue et TAF TAF, terminus et séquences d'arrêts publiées pour plusieurs lignes.
- Usage retenu : référence officielle complémentaire pour les lignes, terminus et séquences explicitement présentes sur la page ; comparaison prioritaire avec les anciennes extractions et les autres sources.
- Limite : la page ne fournit pas une date certifiée de mise à jour, ni une preuve de circulation en temps réel pour chaque arrêt. Elle ne remplace pas automatiquement les géométries et coordonnées ArcGIS.

Le guide officiel de mobilité des JOJ Dakar 2026 constitue également une source officielle récente pour les lignes et certains terminus :
https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf

### Décision de rapprochement

1. Conserver la couche ArcGIS des arrêts du 24 septembre 2024 comme base géographique sourcée.
2. Ajouter la page Info voyageurs DDD comme référence officielle complémentaire consultée le 17 novembre 2026, sans lui attribuer une date de mise à jour non publiée.
3. En cas de divergence, conserver les deux formulations avec leurs sources respectives et marquer le point à vérifier ; ne pas écraser silencieusement un terminus ou une variante.
4. Une séquence publiée dans un seul sens ne prouve pas le sens retour. Ne pas fabriquer le retour par inversion.
5. Aucun arrêt ne passe au catalogue passager uniquement parce qu'il apparaît dans une liste de noms : vérifier la ligne, le sens, la localisation et les éventuelles variantes.


## Source DDD plus récente — application officielle (2025)

La fiche officielle de l'application Dem Dikk sur l'App Store documente une version **2025.4.1 publiée le 2 octobre 2025**. La version annoncée comprend une carte interactive des lignes et arrêts du réseau urbain et la géolocalisation des arrêts :
https://apps.apple.com/fr/app/dem-dikk/id6476461159

Cette date est plus récente que la dernière modification de la couche ArcGIS d'arrêts (24 septembre 2024). Elle est donc adoptée dans l'inventaire des sources comme **preuve d'une version applicative DDD plus récente**, et comme piste prioritaire pour retrouver les données cartographiques de l'application.

Limite technique à conserver : la fiche App Store décrit les fonctionnalités et la version de l'application, mais ne publie pas le jeu de données des arrêts, son horodatage de mise à jour, ni un export réutilisable. Elle ne suffit donc pas à remplacer les 777 entités ArcGIS déjà extraites. Tant que les données cartographiques de cette application ne sont pas accessibles et vérifiables, les arrêts ArcGIS 2024 restent conservés ; les lignes/terminus publiés sur la page officielle Info voyageurs et le guide officiel JOJ 2026 servent de contrôles complémentaires.


## Précision de datation — application DDD et page Info voyageurs (17 novembre 2026)

La page officielle DDD consacrée à la nouvelle application mobile indique explicitement que celle-ci est disponible depuis le **3 septembre 2025** :
https://demdikk.sn/v2appmobile/

La fiche App Store indique séparément la version **2025.4.1 du 2 octobre 2025** :
https://apps.apple.com/fr/app/dem-dikk/id6476461159

Ces dates ne sont pas contradictoires : le 3 septembre 2025 est la date de disponibilité annoncée sur le site DDD ; le 2 octobre 2025 est la date de publication de la version App Store 2025.4.1. La nouvelle application annonce une carte interactive des lignes et arrêts urbains et la géolocalisation des arrêts proches.

**Décision de source :** ces deux références sont adoptées comme preuves datées d'une version applicative DDD postérieure à la couche ArcGIS de septembre 2024. Elles deviennent une piste prioritaire pour retrouver un export ou un service cartographique plus récent. Elles ne prouvent toutefois pas la date de mise à jour des données internes de la carte et ne livrent pas les coordonnées/identifiants des arrêts. En conséquence, la couche ArcGIS 2024 reste conservée comme base géographique sourcée jusqu'à récupération et comparaison d'un jeu de données plus récent et exploitable.

La page officielle « Info voyageurs » actuellement accessible expose des lignes et terminus complémentaires :
https://demdikk.sn/info-voyageurs/
La date de consultation est le **17 novembre 2026** ; aucune date de dernière mise à jour éditoriale n'est affichée. Ne pas attribuer à cette page une date de publication non démontrée.
