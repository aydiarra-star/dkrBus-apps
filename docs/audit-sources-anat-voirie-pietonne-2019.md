# Audit des sources de voirie ANAT / GéoSénégal — 17 novembre 2026

## Source et millésime

Les pages officielles GéoSénégal indiquent que les jeux « Dakar - Voirie 2019 », « Guédiawaye - Voirie 2019 » et « Yeumbeul Nord - Voirie 2019 » proviennent de l'ANAT. Ils sont décrits comme des données vectorielles communales issues d'une restitution 3D à l'échelle 1/2 000e, au format Shapefile.

- Dakar : https://www.geosenegal.gouv.sn/dakar-voirie-2019.html
- Guédiawaye : https://www.geosenegal.gouv.sn/guediawaye-voirie-2019.html
- Yeumbeul Nord : https://geosenegal.gouv.sn/yeumbeul-nord-voirie-2019.html
- Conditions d'utilisation : https://www.geosenegal.gouv.sn/conditions-d-utilisation.html

Les archives complètes du premier téléchargement réussi ont été conservées comme artefact CI `geosenegal-anat-road-sidewalk-source-audit` (run 44180974735, artefact 14372421824). Les archives contiennent des ZIP imbriqués ; l'inventaire initial à un seul niveau les manquait. Le script `scripts/audit_geosenegal_shapefiles.py` et le workflow `anat_road_evidence` ont été ajoutés pour extraire et inspecter récursivement ces couches.

## Géométrie et couches pertinentes

Les fichiers `.prj` inspectés déclarent `WGS_1984_UTM_Zone_28N` (EPSG:32628). Les coordonnées sont métriques projetées ; elles doivent être transformées explicitement vers WGS84 avant affichage dans Leaflet. Aucune conversion ne doit être faite en supposant que les valeurs X/Y sont déjà des longitudes/latitudes.

### Trottoirs — géométries dédiées

| Commune | Entités | Géométries utilisables | Longueur XY cumulée |
|---|---:|---:|---:|
| Dakar | 1 336 | 1 336 | 165,94 km |
| Guédiawaye | 154 | 154 | 20,68 km |
| Yeumbeul Nord | 43 | 43 | 5,51 km |
| **Total** | **1 533** | **1 533** | **192,13 km** |

Ces couches sont des lignes `PolyLineZ`, pas des axes routiers. Elles constituent une source potentielle de cheminement piéton plus fidèle que l'axe de chaussée OSM. Elles ne portent toutefois pas d'information suffisamment complète sur la largeur, l'état, l'accessibilité PMR, les obstacles ou l'ouverture actuelle.

### Sentiers — géométries dédiées

| Commune | Entités | Géométries utilisables | Longueur XY cumulée |
|---|---:|---:|---:|
| Dakar | 1 727 | 1 726 | 137,53 km |
| Guédiawaye | 40 | 39 | 3,31 km |
| Yeumbeul Nord | 45 | 44 | 6,17 km |
| **Total** | **1 812** | **1 809** | **147,01 km** |

Trois entités sont vides ou inutilisables. Les sentiers restent des candidats : leur statut d'ouverture au public, leur état et leurs connexions doivent être vérifiés.

### Autres couches — ne pas convertir automatiquement en chemin piéton

- `Passerelle` : 160 entités à Dakar et 3 à Guédiawaye, de type Shapefile `PolygonZ`. Ce sont des emprises surfaciques, pas des axes de cheminement ; ne pas les transformer en lignes de marche.
- `Axe_chemin` : géométrie linéaire, mais son sens d'usage et ses restrictions doivent être établis avant inclusion.
- `Axe_piste` : géométrie linéaire de piste ; ne pas la considérer automatiquement comme trottoir ou sentier piéton.
- `Bord_route`, `Bord_piste`, `Séparateur`, `Pont` et `Voie_en_construction` : couches utiles à l'analyse des obstacles et du contexte, mais pas des chemins piétons directement activables.

Les valeurs Z sont présentes sur la plupart des géométries Dakar et Guédiawaye, mais certaines couches ou entités n'en ont pas. Les Z nuls ne doivent pas être interprétés sans examen comme une altitude réelle de niveau zéro. Ils peuvent aider à détecter certains passages dénivelés, mais ne suffisent pas à certifier un franchissement.

## Couverture des arrêts de référence

Une mesure préliminaire a calculé la distance plane entre les coordonnées statiques des 13 gares TER phase 1 et 23 stations BRT du dépôt et la ligne de trottoir ANAT la plus proche, après projection en EPSG:32628.

- 8 points sur 36 sont à 10 m ou moins.
- 12 points sur 36 sont à 25 m ou moins.
- 12 points sur 36 sont à 50 m ou moins.
- Les autres sont plus éloignés ; plusieurs gares TER vers l'est sont hors de l'emprise des jeux Dakar / Guédiawaye / Yeumbeul Nord.

Ces mesures ne sont **pas** des distances d'accès à une entrée de station : les coordonnées du référentiel sont des points de référence, pas des portails ou quais certifiés. Une proximité ne prouve ni une entrée ouverte, ni un passage piéton, ni la continuité du trottoir.

## Conditions d'utilisation — blocage avant diffusion commerciale

Les conditions officielles de GéoSénégal précisent que l'ANAT accorde une licence non exclusive et sans frais, mais que la fabrication ou la distribution de produits dérivés à but lucratif nécessite l'accord préalable du Sénégal. La source doit être identifiée par la mention :

`© L’Agence Nationale d’Aménagement du Territoire. Tous droits réservés.`

**Décision :** les couches restent en audit et en préparation interne. Ne pas les incorporer à une version publique ou commerciale de Dakar Bus, ni redistribuer un produit dérivé, avant clarification et obtention de l'accord préalable requis pour l'usage à but lucratif.

## Décision technique

1. Conserver séparément les couches Trottoir et Axe_sentier ; ne pas les fusionner avec les axes de chaussée.
2. Convertir les coordonnées EPSG:32628 vers WGS84 de manière explicite et testée.
3. Auditer les extrémités, intersections, niveaux Z, doublons et géométries vides ; une intersection géométrique ne prouve pas toujours une traversée piétonne.
4. N'utiliser les passerelles qu'après identification de leurs accès aux deux extrémités ; leur polygone ne constitue pas un chemin.
5. Raccorder les gares/stations uniquement à des entrées ou accès confirmés, jamais au point d'arrêt le plus proche par simple seuil métrique.
6. Garder toute correspondance inactive tant que la continuité du chemin et les traversées ne sont pas vérifiées.
7. Ne modifier aucun horaire ni fréquence TER/BRT sur la base de ces données.

Les longueurs indiquées sont des sommes de longueurs XY des géométries sources, pas des kilomètres de réseau connecté ni des distances de marche garanties.
