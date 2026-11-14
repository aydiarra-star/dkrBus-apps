# DDD — lignes sans groupe ArcGIS de même code : couverture OSM et priorités — 14 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
HEAD de départ contrôlé : `105d89a724a4220260442adb49b52abeb12bffbe`  
Extraction OSM : 14 novembre 2026, 07:09:04 UTC  
Artefact OSM : `dakar-osm-route-candidates`, ID 14103612454  
Artefact ArcGIS : `ddd-arcgis-route-stop-candidates`, ID 14104205847

## 1. Périmètre

La comparaison des 39 séquences DDD présentes dans les registres du dépôt identifie 17 codes sans groupe de points ArcGIS portant le même code. Cela ne signifie pas que ces lignes n'existent pas : il s'agit d'une absence de groupe d'arrêts portant ce code dans les couches publiques examinées.

La revue des 25 relations OSM extraites le 14 novembre ne trouve aucune relation dont la référence corresponde exactement à l'un de ces 17 codes. Les références OSM mixtes ou contradictoires ne sont pas assimilées à un code de ligne par approximation.

## 2. Matrice de couverture des 17 lignes

| Code DDD | Groupe de points ArcGIS de même code | Géométrie ArcGIS de même code | Relation OSM de même référence | Décision |
|---|---|---|---|---|
| 20 | Non | Oui | Non | Géométrie très proche de celle de 18 ; points 18 non attribuables à 20 |
| 208 | Non | Non | Non | Aucune séquence géographique indépendante dans ces extractions |
| 213 | Non | Non | Non | Aucune séquence géographique indépendante dans ces extractions |
| 219 | Non | Oui | Non | 33 positions candidates sont rangées sous le code source 218 ; ne pas réétiqueter |
| 220 | Non | Non | Non | Aucune séquence géographique indépendante dans ces extractions |
| 221 | Non | Non | Non | Aucune séquence géographique indépendante dans ces extractions |
| 233 | Non | Non | Non | Conflit de terminus officiel Palais 1 / séquence se terminant à Aéroport LSS |
| 234 | Non | Non | Non | Aucune séquence géographique indépendante dans ces extractions |
| 311 | Non | Non | Non | Boucle DDD publiée ; aucune géométrie/points de même code trouvés |
| 327 | Non | Non | Non | Aucune séquence géographique indépendante dans ces extractions |
| TO1 | Non | Non | Non | À garder distinct de TAF TAF ; aucune géométrie/points de même code |
| 319 | Non | Non | Non | Aucune séquence géographique indépendante dans ces extractions |
| 501 | Non | Non | Non | Séquence DDD publiée ; pas de couche ArcGIS de même code |
| 502 | Non | Non | Non | Boucle Colobane publiée ; pas de couche ArcGIS de même code |
| 503 | Non | Non | Non | Boucle Colobane publiée ; pas de couche ArcGIS de même code |
| TAF_TAF | Non | Non | Non | Desserte publiée distincte de TO1 ; pas de couche ArcGIS de même code |
| 15 | Non | Non | Non | Séquence DDD publiée distincte de 15A/15B ; pas de couche ArcGIS de même code |

**Précision :** les géométries des lignes 20 et 219 existent bien dans ArcGIS, mais leurs groupes de points de même code sont absents. Pour les 15 autres codes de ce tableau, aucune géométrie ni couche de points portant exactement le code n'a été trouvée dans les 36 couches récupérées.

## 3. Ligne 20 — géométrie presque confondue avec la ligne 18

C'est la découverte prioritaire de cette passe.

Les tracés ArcGIS 18 et 20 ont été projetés en UTM 28N puis comparés :
- longueur calculée du tracé 18 : environ 18 588 m ;
- longueur calculée du tracé 20 : environ 18 571 m ;
- différence de longueur : environ 17 m ;
- distance de Hausdorff entre les deux lignes : environ 25,1 m ;
- les 44 points de la couche d'arrêts 18 sont tous à 8,4 m ou moins du tracé 18 ;
- les mêmes 44 points sont également tous à 8,4 m ou moins du tracé 20.

Les champs textuels ArcGIS des deux tracés ne sont pourtant pas identiques :
- la ligne 18 décrit notamment Dieuppeul, Cité Derklé, Khar Yalla, Cité Marine, Castors, Cité Port, Rocade Fann Bel Air, Colobane, Police Bel Air, Grand Moulin, Esso Port, centre-ville et retour vers Dieuppeul ;
- la ligne 20 décrit Dieuppeul, Allées Ababacar Sy, Jet d'eau, Bourguiba, Hôpital Fann, Cité universitaire, Lycée Delafosse, Gueule Tapée, Rue 6, Corniche Ouest, Esso Port, Bel Air, Colobane, Castors et retour vers Dieuppeul.

Les deux entités ArcGIS ont une métadonnée `lastEditDate` du 13 décembre 2017. La page DDD actuelle publie deux circuits distincts 18 et 20. Le rapprochement géométrique montre donc que la couche de points 18 ne peut pas être affectée automatiquement à la ligne 18 plutôt qu'à la ligne 20 : les deux tracés sont quasiment superposés et les mêmes points satisfont les deux géométries.

### OSM

Une relation OSM 18 existe (ID 7499475), mais elle ne contient aucun membre d'arrêt ordonné et ses terminus sont génériques (« Terminus 1 » / « Terminus 2 »). Aucune relation 20 n'a été trouvée dans l'extraction.

**Décision :** conserver les 44 points sous leur couche source 18, ne pas les dupliquer pour la ligne 20 et ne pas les réattribuer. Il faut une fiche opérateur ou une carte DDD plus récente pour distinguer les deux circuits.

## 4. Ligne 219 — rappel du candidat caché dans l'étiquette 218

La couche ArcGIS contient une géométrie 219, mais aucun groupe de points nommé 219. Parmi les 103 points étiquetés 218, 33 positions uniques (OBJECTID 54–86) se projettent toutes à 9,8 m ou moins du tracé 219 ; ces mêmes positions sont répétées exactement dans un second bloc (OBJECTID 293–325). Un bloc distinct de 37 points (OBJECTID 87–123) suit le tracé 218.

La page officielle DDD actuelle confirme le corridor Daroukhane ↔ Ouakam de la ligne 219. Cette preuve géographique est forte, mais l'attribut ArcGIS d'origine reste `ligne_218` : aucune réaffectation n'est effectuée.

Voir `docs/ddd-suburban-lines-217-218-219-227-228-232-geospatial-followup-2026-11-13.md`.

## 5. Autres lignes sans couverture géographique exploitable

Pour 208, 213, 220, 221, 233, 234, 311, 327, TO1, 319, 501, 502, 503, TAF_TAF et 15 :
- une séquence ou un corridor est publié dans les sources DDD conservées dans le dépôt ;
- aucun groupe ArcGIS d'arrêts de même code n'a été retourné ;
- aucune géométrie ArcGIS de même code n'a été retournée ;
- aucune relation OSM de même référence n'a été trouvée dans l'extraction du 14 novembre.

La page DDD officielle permet de confirmer plusieurs terminus et séquences, mais elle ne fournit pas automatiquement des coordonnées pour chaque repère ni une liste de retour indépendante. Les boucles 502 et 503 et la boucle 311 doivent rester des circuits publiés, sans découpage artificiel.

Le cas 233 reste bloqué par son conflit interne : l'en-tête annonce Palais 1, alors que la séquence de repères se termine à Aéroport LSS. TO1 et TAF TAF restent deux services distincts ; la séquence TAF TAF ne doit pas être utilisée pour compléter TO1.

## 6. Priorités de collecte externe

1. **Ligne 20 :** obtenir une carte ou une fiche DDD récente distinguant le circuit 20 du 18 ; la géométrie ArcGIS de 2017 ne permet pas d'attribuer les points.
2. **Ligne 219 :** faire confirmer par DDD l'attribution des 33 positions candidates actuellement stockées sous 218 ; conserver les deux blocs et les doublons d'origine.
3. **Ligne 233 :** résoudre le conflit de terminus avec une source DDD explicite.
4. **208, 213, 220, 221 et 234 :** rechercher les cartes, fiches opérateur ou relevés d'arrêts propres à chaque ligne.
5. **311 et 327 :** rechercher une géométrie et des coordonnées de points sans casser la boucle 311 publiée.
6. **TO1, 319, 501, 502, 503, TAF_TAF et 15 :** chercher des couches/cartes opérateur distinctes et conserver les identifiants exacts, notamment la séparation TO1/TAF TAF et 15/15A/15B.

## 7. Sources et limites

- DDD, réseau urbain : https://demdikk.sn/reseau-urbain-dakar/
- DDD, Info voyageurs : https://demdikk.sn/info-voyageurs/
- ArcGIS urbain : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer/
- ArcGIS banlieue : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Itin%C3%A9raire_ligne_de_Banlieue_Dakar_Dem_Dikk/FeatureServer/
- OSM : contributeurs OpenStreetMap via Overpass ; extraction du 14 novembre 2026 à 07:09 UTC.

L'absence d'une relation OSM ou d'une couche ArcGIS ne prouve pas l'inexistence de la ligne. Les géométries et les points sont des indices de corridor, pas une validation de desserte ou de sens. Les couches de tracé 18 et 20 datent de décembre 2017 ; elles ne prouvent pas le service actuel.

## 8. Garde-fous

Aucun arrêt, itinéraire, terminus ou fréquence n'est inventé. Aucun retour n'est fabriqué par inversion. Aucun point n'est fusionné, supprimé ou réattribué. Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT. GTFS n'est pas requis et ne bloque pas la suite.
