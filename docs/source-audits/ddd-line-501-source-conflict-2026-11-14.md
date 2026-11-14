# Audit des sources DDD — ligne 501 — 2026-11-14

## Périmètre

Audit documentaire de la ligne 501 à partir des deux pages officielles Dakar Dem Dikk et des métadonnées du service ArcGIS DDD consultées le 14 novembre 2026. Aucun changement de donnée applicative.

## Constat des sources officielles

### Page « Info voyageurs »

La page officielle présente :

- **LIGNE 501 : GARE DE DAKAR ↔ PALAIS 2**

Cette page ne publie pas de liste d'arrêts détaillée ni de séquence indépendante par direction pour la ligne 501.

Source : https://demdikk.sn/info-voyageurs/

### Page « Réseau urbain Dakar »

La page officielle présente un intitulé différent :

- **LIGNE 501 : PALAIS 2 ↔ LECLERCL** (orthographe « LECLERCL » telle que publiée)
- Séquence affichée : Terminus Palais 2 → Avenue Nelson Mandela → Avenue Léopold Sédar Senghor → Place de l’Indépendance → Esso Port Embarcadère → Terminus Leclerc.

La page contient donc une séquence de six libellés dans le sens présenté, mais ne publie pas de séquence de retour distincte.

Source : https://demdikk.sn/reseau-urbain-dakar/

## Contrôle des métadonnées ArcGIS DDD

Le service public « Dem_dikk_mise_a_jour » expose deux couches distinctes :

- `Arrets_Ligne_Dakar_Dem_Dikk` (couche 0), géométrie ponctuelle, avec les champs `Nom_Arret`, `Nom_Ligne` et `Id`. Sa date de dernière modification des données indiquée dans les métadonnées est le **24 septembre 2024**.
- `Itinéraire_lignes_Dakar_Dem_Dikk` (couche 1), géométrie linéaire, avec plusieurs champs de texte d'itinéraire. Sa date de dernière modification des données indiquée est le **11 janvier 2019**.

Sources :
- Service : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer
- Couche arrêts : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0
- Couche itinéraires : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/1

Ces métadonnées confirment l'existence de couches d'arrêts et d'itinéraires, mais ne prouvent pas à elles seules que leurs enregistrements décrivent la ligne 501 actuelle, ses deux directions, ou la divergence Gare de Dakar / Leclerc. La couche itinéraires porte en outre une date de données ancienne (2019) : elle ne doit pas être considérée comme validation actuelle sans contrôle des enregistrements concernés.

## Analyse et décision

Les deux pages officielles ne concordent pas sur le terminus associé à la ligne 501 :

- « Gare de Dakar » sur Info voyageurs ;
- « Palais 2 » et « Leclerc » sur la page Réseau urbain.

Il n'existe pas, dans ces publications, de preuve permettant d'affirmer que « Gare de Dakar » est interchangeable avec « Leclerc », ni de reconstruire un retour indépendant. Les métadonnées ArcGIS disponibles ne résolvent pas cet écart sans examen ciblé des entités de la ligne.

**Décision :** conserver l'écart documentaire ouvert. Ne pas fusionner les terminus, ne pas renommer « LECLERCL » silencieusement, ne pas créer de retour par inversion automatique et ne pas modifier la séquence de production sur la seule base de cet audit.

## Garde-fous

- Documentation uniquement : aucun arrêt de production ajouté, supprimé ou renommé.
- Aucun horaire ou fréquence ajouté.
- Aucun tracé ou retour déduit.
- Aucune modification TER/BRT.
- Aucune écriture Supabase.
- Aucun déploiement.

## Suite de vérification

Interroger les entités ArcGIS des deux couches avec un filtre exact sur la ligne 501, vérifier les attributs et les positions, puis comparer ces résultats aux publications DDD avant toute évolution des données applicatives.

## Vérification du catalogue ArcGIS interurbain

Le catalogue du service public `Ligne_inter_urbain` expose des couches dédiées pour les lignes 1, 4, 6, 7, 8, 9, 10, 13, 18, 20, 23 et 121. Il ne présente pas de couche dédiée à la ligne 501 dans cet inventaire.

Source : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer/layers

Cette absence de couche dédiée dans ce service ne prouve pas l'absence de données 501 dans d'autres services ArcGIS. Le service générique `Dem_dikk_mise_a_jour` possède bien un champ `Nom_Ligne` sur sa couche d'arrêts et un champ `Nom_Ligne` sur sa couche de tracés ; les entités propres à 501 doivent encore être interrogées et vérifiées avant toute conclusion sur leur contenu.

## Résultat de l'audit ArcGIS

- Couche générique d'arrêts : disponible, avec `Nom_Arret`, `Nom_Ligne` et `Id`, mais dernière modification des données le 24 septembre 2024.
- Couche générique de tracés : disponible, avec `Nom_Ligne` et plusieurs champs descriptifs d'itinéraire, mais dernière modification des données le 11 janvier 2019.
- Catalogue interurbain : aucune couche dédiée 501 répertoriée.
- Aucun résultat d'entités ArcGIS 501 n'est considéré comme validé dans ce PR.

La vérification ArcGIS ne lève donc pas la contradiction des terminus. Elle précise seulement quelles couches existent et quelles vérifications ciblées restent nécessaires.
