# Audit géographique et intermodal — Rufisque, PNR, Bargny, Keur Massar et Sangalkam

Date : 16 novembre 2026  
Périmètre : points GPS candidats, distinction des terminus, lignes officielles et correspondances possibles.  
Protection : aucune modification des tracés ou horaires TER/BRT.

## Conclusion opérationnelle

Les pôles doivent être modélisés comme des objets distincts, pas comme un seul point par commune :

1. **Rufisque TER, PNR et gare routière de Rufisque sont trois objets distincts.** La gare TER de Rufisque se trouve à environ 1,59 km à vol d'oiseau du centre de la gare routière. PNR, en revanche, est à environ 172 m à vol d'oiseau de cette gare routière. Les distances sont des mesures géographiques, pas des itinéraires piétons.
2. **Bargny TER est localisé avec un arrêt ferroviaire OSM.** L'AFTU publie explicitement une ligne 74 au terminus « Bargny (gare ferroviaire) », ce qui en fait un candidat de correspondance. Le quai bus et son accès ne sont pas géolocalisés précisément.
3. **Keur Massar possède plusieurs terminus et zones de montée.** La gare routière OSM et le « Terminus 52 » (opérateur TATA dans OSM) sont deux points distincts, séparés d'environ 490 m à vol d'oiseau. Les points génériques DDD/AFTU/TATA du référentiel actuel sont à environ 2,4 km de la gare routière et ne doivent pas être considérés comme des quais validés.
4. **Sangalkam est un pôle de rabattement routier distinct, sans gare TER.** DDD publie la ligne 208 Bayakh–Rufisque via Sangalkam ; AFTU publie la ligne 78 Sangalkam–Camberène. Les terminus et quais précis restent à géolocaliser.
5. **Aucune nouvelle correspondance n'est activée dans cet audit.** Les distances droites ne remplacent jamais les cheminements piétons, et une desserte de commune ne prouve pas un quai commun.

## 1. Rufisque : ne pas fusionner la gare TER, PNR et la gare routière

### Ancrages géographiques OSM

| Objet | Coordonnées WGS84 | Objet OSM | Lecture |
|---|---:|---|---|
| Gare TER Rufisque | 14.71597, -17.27000 | node 10245772297 | Gare ferroviaire TER, opérateur SETER |
| Arrêt ferroviaire Rufisque | 14.71584, -17.27008 | node 2168949718 | Position ferroviaire, distincte du polygone de gare |
| Gare TER PNR | 14.72317, -17.28394 | node 10245772285 | Station ferroviaire SETER |
| Gare routière de Rufisque | 14.72167, -17.28356 | way 178908478 | Emprise de gare routière, amenity=bus_station |

Distances géographiques calculées entre les coordonnées ci-dessus :
- PNR ↔ gare routière de Rufisque : environ **172 m** à vol d'oiseau.
- Gare TER Rufisque ↔ gare routière de Rufisque : environ **1 590 m** à vol d'oiseau.
- Gare TER Rufisque ↔ PNR : environ **1 700 m** à vol d'oiseau.

Le site TER précise que PNR signifie « Passage à Niveau de Rufisque », qu'il s'agit d'une halte distincte de la gare TER de Rufisque et qu'elle se situe dans le secteur de la gare routière de Rufisque. Cette distinction est essentielle : ne pas faire pointer PNR et Rufisque vers le même arrêt.

### Desserte officielle

**Dakar Dem Dikk** publie notamment :
- Ligne 15A/15B : Rufisque ↔ Palais 1.
- Ligne 208 : Bayakh ↔ Rufisque, avec Gorom 01, Gorom 02, Bambilor, Noflaye, Sangalkam et Keur Ndiaye Lo.
- Ligne 213 : Gare de Rufisque ↔ Dieuppeul, via HLM SIPRES, ZAC Mbao, Grand Mbao, Keur Mbaye Fall et d'autres arrêts.
- Ligne 220 : Rufisque ↔ Guédiawaye, via Jaxaay, Station Keur Massar et Malika.
- Ligne 228 : Terminus Rufisque ↔ Yenne, via Ville de Rufisque et Bargny.

**AFTU** publie notamment :
- Ligne 55 : Terminus Rufisque Sonadis ↔ Petersen.
- Ligne 57 : Liberté 6 ↔ Rufisque.
- Ligne 62 : Arrêt Cherif (Rufisque) ↔ Penc Mi.
- Ligne 63 : Terminus Camp Marchand Rufisque ↔ Stade LSS.
- Ligne 64 : Guédiawaye ↔ Rufisque.
- Ligne 67 : Ouakam ↔ Thiawlène Rufisque.
- Ligne 77 : Rufisque ↔ Liberté 5.
- Ligne 83 : Rufisque Arafat ↔ Zone de Captage.

### Décision données

Le point actuel `ddd-rufisque` est placé exactement sur la gare TER Rufisque (14.7159649, -17.2699985), alors que l'emprise OSM de la gare routière est environ 1,59 km plus loin. Le point AFTU Rufisque est également placé sur la gare TER ; le point TATA Rufisque est à proximité immédiate de celle-ci.

**Ne pas interpréter ces coordonnées communes comme une correspondance TER ↔ DDD/AFTU/TATA.** Les lignes ont plusieurs terminus possibles à Rufisque (Sonadis, Camp Marchand, Arafat, gare routière, gare TER, etc.). Il faut créer des points distincts par terminus/ligne après validation, plutôt que déplacer tous les réseaux vers la gare routière ou conserver une superposition artificielle à la gare TER.

PNR est le meilleur candidat de proximité avec la gare routière, mais le cheminement réel, les accès et les quais doivent être mesurés avant activation d'un transfert piéton.

## 2. Bargny : gare TER et desserte bus

### Ancrages géographiques OSM

| Objet | Coordonnées WGS84 | Objet OSM | Lecture |
|---|---:|---|---|
| Halte ferroviaire Bargny | 14.69821, -17.22918 | node 9373876214 | Position ferroviaire |
| Emprise ferroviaire Gare de Bargny | 14.69798, -17.22923 | way 1016285847 | Emprise ferroviaire |
| Centre de la commune de Bargny | 14.69380, -17.22970 | node 1250211868 | Localité, pas un quai |
| Garage clando | repéré à proximité | OSM via Mapcarta | Garage routier générique, pas un quai AFTU/DDD certifié |

La gare ferroviaire et le centre de la commune sont séparés d'environ 494 m à vol d'oiseau. La présence d'un « Garage clando » à environ 240 m au sud-ouest de la gare est un indice de desserte routière, mais ne prouve ni l'opérateur ni le quai utilisé par une ligne précise.

### Desserte officielle

**AFTU** publie :
- Ligne 59 : Colobane ↔ Bargny.
- Ligne 74 : Terminus Bargny (gare ferroviaire) ↔ Tivaouane Peul.
- Ligne 89 : Bargny ↔ Croisement Niague (Cité SICAP).
- Ligne 67 : Ouakam ↔ Thiawlène Rufisque.

La mention explicite « gare ferroviaire » de la ligne 74 confirme le pôle comme candidat d'intermodalité TER/AFTU, mais la page de catalogue ne fournit pas les coordonnées de quai ni le cheminement entre le quai bus et l'accès voyageurs TER.

**DDD** publie :
- Ligne 228 : Rufisque ↔ Yenne, avec Bargny dans la séquence.
- Ligne 15A/15B : Rufisque ↔ Palais 1, dont la séquence publiée passe par le secteur de Rufisque et ses croisements.
- Les dessertes doivent être distinguées des simples arrêts de quartier.

### Décision données

- Conserver la gare TER Bargny à sa position ferroviaire OSM.
- Créer un point candidat distinct pour le terminus AFTU ligne 74 seulement lorsque son quai est confirmé.
- Ne pas relier automatiquement la ligne DDD 228 à la gare TER : « Bargny » dans la séquence publiée ne précise pas le quai ni l'entrée de gare.
- Ne pas utiliser le centre-ville ou le garage clando comme substitut du quai de la ligne 74.
- Tracer et mesurer le chemin piéton TER ↔ quai bus avant d'ajouter une correspondance.

## 3. Keur Massar : plusieurs terminus, pas un point unique

### Ancrages géographiques OSM

| Objet | Coordonnées WGS84 | Objet OSM | Lecture |
|---|---:|---|---|
| Gare routière de Keur Massar | 14.76984, -17.31840 | way 335756472 | Emprise OSM amenity=bus_station |
| Terminus 52 | 14.77419, -17.31767 | node 5286379847 | Arrêt de bus, opérateur TATA, nommé « terminus 52 » |
| Point générique Keur Massar DDD/AFTU actuel | 14.79000, -17.31000 | Référentiel interne | Coordonnée approximative, pas un quai vérifié |
| Point générique Keur Massar TATA actuel | 14.79050, -17.31050 | Référentiel interne | Coordonnée approximative, pas un quai vérifié |
| Gare TER Keur Mbaye Fall | 14.74408, -17.31389 | référentiel TER / OSM | Gare distincte de Keur Massar |

Distances à vol d'oiseau :
- Gare routière ↔ Terminus 52 : environ **490 m**.
- Gare routière ↔ point générique actuel Keur Massar : environ **2 420 m**.

La gare routière et le Terminus 52 ne doivent pas être fusionnés. Le Terminus 52 est un arrêt cartographié avec l'opérateur TATA ; il peut servir à identifier le service 52, mais ne prouve pas que toutes les lignes AFTU/DDD de Keur Massar utilisent ce même terminus.

### Desserte officielle

**Dakar Dem Dikk** publie notamment :
- Ligne 11 : Keur Massar ↔ Lat Dior.
- Ligne 227 : Terminus Keur Massar ↔ Terminus Parcelles.
- Ligne 234 : Jaxaay ↔ Leclerc, avec Station Keur Massar et Croisement Keur Massar dans la séquence.
- Ligne 311 : Lac Rose ↔ Croisement Keur Massar.
- Ligne 327 : Keur Massar ↔ Terminus Parcelles.

**AFTU** publie notamment :
- Ligne 52 : Bountou Pikine ↔ Keur Massar.
- Ligne 53 : Keur Massar ↔ Sébikotane.
- Ligne 61 : Almadies ↔ Keur Massar.
- Ligne 71 : Keur Massar ↔ Claudel.
- Ligne 84 : UCAD ↔ Jaxaay.
- D'autres lignes desservent les communes voisines et doivent être distinguées par leur terminus réel.

Le CETUD documente un projet d'aménagement de l'aire terminale de Jaxaay au Terminus 52 et la reconstruction d'une gare urbaine moderne à Keur Massar. Ces projets confirment que le secteur comporte plusieurs pôles de montée et d'échanges, mais leur état de livraison doit être contrôlé avant de traiter un plan de projet comme une infrastructure ouverte.

### Décision données

- Remplacer le point unique générique par des objets distincts : gare routière Keur Massar, Terminus 52, terminus AFTU par ligne si nécessaire, et arrêts DDD de passage tels que « Station Keur Massar » et « Croisement Keur Massar ».
- Ne pas déplacer toutes les lignes AFTU/DDD/TATA vers le centre de la gare routière sans preuve.
- Le point TER Keur Mbaye Fall reste distinct de Keur Massar. Il ne doit pas avoir « Keur Massar » comme alias de gare TER.
- Ne pas activer de transfert TER ↔ bus à Keur Massar : la gare TER la plus proche du secteur est Keur Mbaye Fall, qui n'est pas une gare de Keur Massar.

## 4. Sangalkam : corridor de rabattement vers Rufisque

### Ancrages géographiques OSM

- Centre de Sangalkam : 14.77930, -17.22826 (node 3661556417).
- Marché de Sangalkam : 14.77877, -17.22654 (way 112591679).

Ces deux objets localisent le centre et un repère public, mais aucun des deux n'est un quai de transport identifié. Il faut rechercher le terminus réel et les arrêts directionnels de chaque ligne.

### Desserte officielle

- **DDD ligne 208** : Bayakh ↔ Rufisque, séquence publiée via Gorom 01, Gorom 02, Bambilor, Noflaye, Sangalkam et Keur Ndiaye Lo.
- **AFTU ligne 78** : Sangalkam ↔ Camberène.

### Décision données

Sangalkam est un pôle de rabattement DDD/AFTU à traiter séparément. Il ne faut pas le relier directement à la gare TER Rufisque ou Bargny sur la seule base du nom de commune. La ligne DDD 208 fournit un corridor routier publié vers Rufisque ; l'arrêt exact de Sangalkam et les arrêts intermédiaires doivent être géocodés avant intégration.

## 5. Règles de mise à jour du graphe

1. Ne pas fusionner les arrêts uniquement parce qu'ils portent le même nom de commune.
2. Distinguer les objets « gare », « gare routière », « quai », « arrêt de ligne » et « point d'accès piéton ».
3. Utiliser un identifiant de point par quai/terminus lorsque plusieurs opérateurs ou lignes utilisent des lieux différents.
4. Enregistrer les sources, l'identifiant OSM, la date, la précision et le niveau de validation.
5. Calculer les distances piétonnes sur un réseau piéton praticable ; les valeurs à vol d'oiseau ne servent qu'à comparer des candidats.
6. N'ajouter une entrée dans `CORRIDOR_TRANSFERS` qu'après validation du quai de départ, du quai d'arrivée et du chemin piéton.
7. Les correspondances non validées restent des candidats d'audit, jamais des transferts affichés à l'usager.
8. Les tracés, arrêts, horaires et fréquences TER/BRT de référence restent gelés.

## Sources

### Opérateurs et autorités
- TER Sénégal, liste des gares et ordre officiel : https://ter-senegal.sn/gares/
- TER Sénégal, page PNR : https://ter-senegal.sn/pnr/
- TER Sénégal, page Rufisque : https://ter-senegal.sn/rufisque/
- TER Sénégal, page Bargny : https://ter-senegal.sn/bargny/
- Dakar Dem Dikk, info voyageurs et liste des lignes : https://demdikk.sn/info-voyageurs/
- Dakar Dem Dikk, séquences détaillées des lignes : https://demdikk.sn/reseau-urbain-dakar/
- AFTU, catalogue officiel des lignes : https://aftu-senegal.org/infos-pratiques/
- CETUD, suivi du projet RTC à Keur Massar : https://cetud.sn/suivi-du-plan-dactions-de-reinstallation-par-du-projet-rtc-phase-i-a-keur-massar/

### Références cartographiques
- Gare TER Rufisque, node 10245772297 : https://mapcarta.com/fr/N10245772297
- Gare routière de Rufisque, way 178908478 : https://mapcarta.com/fr/W178908478
- PNR, node 10245772285 : https://mapcarta.com/fr/N10245772285
- Gare de Bargny, way 1016285847 : https://mapcarta.com/fr/W1016285847
- Halte ferroviaire Bargny, node 9373876214 : https://mapcarta.com/fr/17536444
- Gare routière de Keur Massar, way 335756472 : https://mapcarta.com/fr/W335756472
- Terminus 52, node 5286379847 : https://mapcarta.com/fr/N5286379847
- Sangalkam, node 3661556417 : https://mapcarta.com/fr/16838226
- Marché de Sangalkam, way 112591679 : https://mapcarta.com/fr/W112591679

## Périmètre de modification

Documentation et calage de données uniquement. Aucun changement de code actif, de tracé, d'horaire ou de fréquence TER/BRT. Aucun transfert bus ↔ TER n'est ajouté dans cette étape.
