# DDD — extraction des corridors ArcGIS banlieue 217/218/219/227/228/232 — 13 novembre 2026

## Résultat de l'extraction

Une lecture directe de l'artefact public `ddd-route-stop-candidates` a permis d'isoler six entités de tracé ArcGIS de la couche **Itinéraire ligne de Banlieue Dakar Dem Dikk**. Les attributs `Itinérair`, `Itinéra_1` … `Itinéra_8` (selon la ligne) contiennent des segments/corridors textuels ordonnés dans la fiche cartographique. Les géométries sont des polylignes.

| Ligne | Couche ArcGIS | Segments textuels renseignés | SHAPE_Leng (m) | Shape__Length (m) |
|---|---:|---:|---:|---:|
| 217 | 4 | 8 | 23 878,63 | 24 741,48 |
| 218 | 3 | 6 | 25 597,50 | 26 518,14 |
| 219 | 2 | 9 | 20 771,65 | 21 524,31 |
| 227 | 0 | 6 | 19 780,13 | 20 499,45 |
| 228 | 11 | 2 | 28 696,99 | 29 747,37 |
| 232 | 8 | 7 | 15 653,50 | 16 218,37 |

Les valeurs de longueur sont celles des attributs ArcGIS, reproduites sans recalcul. Les deux champs de longueur diffèrent légèrement ; ils ne doivent pas être confondus ni utilisés comme distance voyageurs exacte.

## Corridors textuels récupérés

### Ligne 217
1. Dépôt Thiaroye – police Thiaroye
2. Route des Niayes – Pikine
3. Canada Golf Fadia – Case
4. Croisement 22 – Église
5. Terminus Parcelles Assainies – Dior
6. Dior Centre BCEAO – Route cimetière Yoff
7. Route de l’Aéroport – Ngor
8. Route des Almadies – Mamelles – Marché

### Ligne 218
1. Dépôt Thiaroye – Route Nationale n° 1
2. Pikine – Patte d’Oie
3. Foire VDN – Sipres
4. Ancienne piste – Ouakam
5. Marché Ouakam – terminus Ouakam / route des Mamelles
6. Route des Almadies – Ngor – Terminus aéroport

### Ligne 219
1. Daroukhane – marché Ndiarème
2. Deux voies notaires – Terminus Guédiawaye
3. Stade Amadou Barry – Marché Sham
4. Marché Jeudi corniche – Croisement Béthio
5. Fadia – Case – Pont Sénégal 92
6. Hyacinthe Thiandoum 6 – Deux voies Liberté 6
7. Ancienne Piste – Hôpital militaire de Ouakam
8. Comico – Cité Asecna
9. Cité Assemblée – Terminus Ouakam

### Ligne 227
1. Terminus Keur Massar – Station Keur Massar
2. Hôpital Keur Massar – P Ass Keur Massar / Terminus Malika
3. Route de Yeumbeul – Croisement Yeumbeul
4. Police Thiaroye – Route des Niayes
5. CES Canada – Pharmacie Golf
6. Fadia Case – Croisement 22 – Église

### Ligne 228
1. Terminus Rufisque – ville de Rufisque
2. Bargny – Diamniadio Yenne

### Ligne 232
1. Baux Maraîchers – Yarakh
2. Yarakh – Cafétéria
3. Hann Maristes – Cours Sainte Marie de Hann
4. Usine des eaux – Front de terre
5. Khar Yalla – Rond-Point Liberté 6
6. Itinéraire ligne 8 – Terminus Aéroport
7. Deux voies Sipres – Foire

## Sources ArcGIS

Toutes les entités proviennent de la couche publique ArcGIS suivante (FeatureServer, couche 0 à 11) :
`https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Itin%C3%A9raire_ligne_de_Banlieue_Dakar_Dem_Dikk/FeatureServer`

Les six entités examinées sont les couches 0 (227), 2 (219), 3 (218), 4 (217), 8 (232) et 11 (228). Chaque entité récupérée possède une géométrie de type polyligne. Les attributs de tracé ont une date de dernière édition ArcGIS de 2017 dans les métadonnées de couche.

## Qualification et prochaine étape

- **Avancée confirmée :** les six lignes disposent désormais d'un corridor textuel ArcGIS et d'une géométrie de tracé exploitable pour la comparaison cartographique. Cela enrichit la base de preuve DDD au-delà des seules relations OSM.
- **Limite importante :** ces attributs sont des repères/corridors successifs, pas une liste exhaustive d'arrêts physiques avec coordonnées ni un horaire de passage.
- **Sens :** une entité polyligne unique ne permet pas à elle seule de certifier les deux sens commerciaux. Ne pas fabriquer le retour par inversion. Rechercher une fiche opérateur distincte, une seconde séquence OSM indépendante ou une source cartographique directionnelle corroborante.
- **Ligne 228 :** la description disponible est particulièrement courte (deux segments) ; elle ne doit pas être présentée comme une séquence complète d'arrêts.
- **Ligne 227 :** les libellés rapprochent Keur Massar, Malika, Yeumbeul, Thiaroye, Canada/Golf et Fadia ; l'ordre et les terminus doivent être confrontés à une source DDD publiée avant validation.
- Les lignes restent au statut de candidats documentaires. Aucun arrêt, horaire, fréquence ou sens n'est ajouté au catalogue passager sur cette seule base.

## Garde-fous

Audit en lecture seule. Aucun changement des données passagers, aucun appel d'écriture Supabase, aucun déploiement. TER et BRT ne sont pas touchés. GTFS n'est pas requis et ne bloque pas cette analyse.
