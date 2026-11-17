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
