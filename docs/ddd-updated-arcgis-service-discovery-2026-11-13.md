# Nouvelle source ArcGIS DDD — service Dem_dikk_mise_a_jour

Date de découverte : 13 novembre 2026.

## Source distincte identifiée

Un second service public ArcGIS DDD a été découvert pendant le contrôle des sources :

- Service : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer
- Item ArcGIS : 819d87dfe26c43b0883a751d2ee90449
- Couche 0 : Arrets_Ligne_Dakar_Dem_Dikk (points)
- Couche 1 : Itinéraire_lignes_Dakar_Dem_Dikk (polylignes)
- Référence spatiale : EPSG:32628 (UTM 28N)

Les métadonnées de la couche d'arrêts exposent notamment Nom_Arret, Nom_Ligne, Id, OBJECTID et GlobalID. La couche de tracés expose Nom_Ligne, plusieurs champs Itinérair* et GlobalID. Les géométries sont disponibles dans le service.

## Fraîcheur et limites

La dernière édition des données de la couche d'arrêts est indiquée au 24 septembre 2024 à 12:00:06. Pour la couche de tracés, la dernière édition des données est indiquée au 11 janvier 2019 à 16:17:22 ; le schéma a été édité le 24 septembre 2024.

Cette source est donc plus récente que certaines couches DDD historiques déjà auditées, mais elle ne constitue pas une preuve d'exploitation actuelle. Les deux services ArcGIS restent séparés dans les archives et les rapprochements.

La consultation des métadonnées ne suffit pas à établir le nombre de lignes, le nombre d'arrêts nommés, leur séquence, leur sens ou leur correspondance avec les fiches publiées DDD. Ces métriques seront calculées à partir de l'extraction complète, pas estimées.

## Extraction reproductible ajoutée au PR #123

Nouveaux fichiers :

- scripts/export_ddd_updated_arcgis_service.mjs
- .github/workflows/audit-ddd-updated-arcgis.yml

Le script :
- récupère les métadonnées des deux couches ;
- télécharge toutes les entités avec pagination, ordre technique explicite par identifiant d'objet et géométries converties en EPSG:4326 ;
- conserve les attributs, GlobalID, identifiants, noms de lignes et noms d'arrêts ;
- contrôle les identifiants d'objet manquants ou dupliqués ;
- produit un artefact JSON distinct pour revue.

Le workflow est en lecture seule, déclenchable manuellement et sur les modifications de ses deux fichiers. Il ne dispose que de la permission GitHub contents: read et n'effectue aucune écriture Supabase.

## Étape suivante après extraction

1. Compter les arrêts et tracés par Nom_Ligne.
2. Vérifier les noms vides, les lignes inconnues, les identifiants dupliqués et les géométries manquantes.
3. Comparer les noms d'arrêts aux séquences publiées DDD sans supprimer les répétitions spatiales.
4. Comparer les tracés aux corridors des anciens services ArcGIS et aux relations OSM directionnelles.
5. Garder les conflits de terminus et les retours manquants séparés ; ne jamais inverser une séquence pour fabriquer le retour.

Aucun arrêt n'est promu au catalogue voyageurs par cette extraction. Aucun horaire ou intervalle n'est déduit. GTFS reste hors périmètre. TER/BRT, Supabase et la production restent intouchés.
