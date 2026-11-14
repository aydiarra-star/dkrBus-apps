# DDD — second inventory ArcGIS des itinéraires et arrêts

Date de collecte : 14 novembre 2026 (04:59 UTC)

## Portée et précautions

Une extraction publique en lecture seule a récupéré les couches cartographiques DDD : 24 couches d'itinéraires et 12 couches d'arrêts attendues. Aucune erreur ni limite de transfert n'a été signalée. Résultat : **25 entités d'itinéraire et 455 entités d'arrêt**. Deux couches d'arrêts (ligne 8 et une des couches ligne 13) n'ont aucun champ Nom_Arret exploitable. Les noms répétés sont conservés ; le nombre de noms uniques n'est pas le nombre d'arrêts physiques validés.

Cette extraction est distincte du service Dem_dikk_mise_a_jour édité en 2024 (777 arrêts, 25 itinéraires). Les deux sources restent séparées : aucun remplacement, fusion, dédoublonnage ou réattribution automatique.

La source fournit des géométries de lignes, des points d'arrêt et, pour plusieurs itinéraires, des champs texte de repères/corridors. Elle ne prouve pas à elle seule le sens commercial, l'ordre de passage exact, l'identité physique de chaque arrêt, les horaires, les fréquences ou l'exploitation actuelle.

## Couches d'arrêts extraites

| Couche | Entités | Noms présents | Noms distincts |
|---|---:|---:|---:|
| Ligne 13 (couche A) | 23 | 23 | 11 |
| Ligne 6 | 60 | 60 | 36 |
| Ligne 7 | 34 | 34 | 19 |
| Ligne 8 | 49 | 0 | 0 |
| Ligne 9 | 36 | 36 | 20 |
| Ligne 1 | 44 | 44 | 22 |
| Ligne 10 | 26 | 26 | 14 |
| Ligne 121 | 31 | 31 | 18 |
| Ligne 13 (couche B) | 22 | 0 | 0 |
| Ligne 18 | 44 | 44 | 22 |
| Ligne 23 | 56 | 56 | 26 |
| Ligne 4 | 30 | 30 | 22 |

Les deux couches nommées ligne 13 sont conservées séparément : 23 points d'une part, 22 points d'autre part. Leur identité et leur éventuel lien ne sont pas résolus par le seul nom de couche.

## Itinéraires : contenu textuel disponible

L'extraction comprend 25 géométries d'itinéraire. Les corridors textuels ci-dessous sont des repères de secteur, pas nécessairement une liste d'arrêts successifs.

| Ligne | Repères/corridor ArcGIS | Longueur géométrique (m) |
|---|---|---:|
| 121 | Scat Urban – Mairie Grand Yoff ; Cité CSE – Sipres ; Liberté 6 – Sacré-Cœur ; Sicap Rue 10 – Lycée Blaise Diagne ; Place ONU – Canal 4 ; HLM Fass – RTS ; Rue 22 prolongée – RTS ; Allées Papa Guèye Fall – Faidherbe ; Place de l'Indépendance – Leclerc | 12 318 |
| 13 | Dieuppeul – Avenue Cheikh Ahmadou Bamba ; Castors – Cité Port ; Lycée Kennedy – Général de Gaulle ; Allées Papa Guèye Fall – Faidherbe ; Esso Port – Place de l'Indépendance ; Senghor – Nelson Mandela – Palais 2 | 10 562 |
| 18 | Dieuppeul – Cité Derklé ; Khar Yalla – Cité Marine ; Rue 13 prolongée – Castors ; Cité Port – Rocade Fann Bel Air ; Colobane – Police Bel Air ; Grand Moulin – Quai de pêche ; Esso Port – Place de l'Indépendance ; Pompidou – Peytavin ; Rue 6 – Gueule Tapée ; Lycée Delafosse – Cheikh Anta Diop | 18 588 |
| 20 | Dieuppeul – Allées Ababacar Sy ; Jet d'Eau – Bourguiba ; École Police – Cheikh Anta Diop ; Hôpital Fann – Cité Universitaire ; Lycée Delafosse – HLM Gueule Tapée ; Rue 6 – Malick Sy ; Corniche Ouest – Peytavin ; Pompidou – Esso Port ; Arsenal – MTOA ; Grands Moulins – Police Bel Air | 18 571 |
| 23 | Parcelles – École Dior ; Diamalaye – HLM Grand Médine ; Route du Terminus – Église ; Route des Niayes – échangeur Stade LSS ; Keur Khadim – Camp Pénal ; Front de Terre – Cité des Eaux ; Bourguiba – Cheikh Anta Diop ; Route de Ouakam – Marché Sahm ; Gueule Tapée – Rue 6 – Malick Sy ; Blaise Diagne – Jean Jaurès | 22 261 |
| 7 | Ouakam – Cité Assemblée ; Comico – Cheikh Anta Diop ; Blaise Diagne – Jean Jaurès ; Peytavin – Pompidou ; Place de l'Indépendance – Senghor ; Nelson Mandela – Palais de Justice | 14 137 |
| 227 | Keur Massar – station Keur Massar ; hôpital Keur Massar – Parcelles/Malika ; Yeumbeul ; Police Thiaroye – Route des Niayes ; CES Canada – Pharmacie Golf ; Fadia – Case – Croisement 22 – église | 20 499 |
| 219 | Daroukhane – marché Ndiarème ; terminus Guédiawaye ; stade Amadou Barry – marché Sahm ; corniche – Croisement Béthio ; Fadia – Case – Pont Sénégal 92 ; Hyacinthe Thiandoum – Liberté 6 ; Ancienne Piste – Hôpital militaire Ouakam ; Comico – Cité Asecna ; Cité Assemblée – terminus Ouakam | 21 524 |
| 218 | Dépôt Thiaroye – RN1 ; Pikine – Patte d'Oie ; Foire/VDN – Sipres ; Ancienne Piste – Ouakam ; marché Ouakam – Mamelles ; Almadies – Ngor – Aéroport | 26 518 |
| 217 | Dépôt Thiaroye – Police Thiaroye ; Route des Niayes – Pikine ; Canada/Golf/Fadia/Case ; Croisement 22 – église ; Parcelles – Dior ; Dior – Centre BCEAO – route cimetière Yoff ; Aéroport – Ngor ; Almadies – Mamelles – marché | 24 741 |
| 2 | Daroukhane – Corniche Hamo ; terminus Guédiawaye – marché Sahm ; École Canada – Route des Niayes ; Tally Boumack – RN1 ; autoroute – Cité des Eaux ; Bourguiba – Cheikh Ahmadou Bamba ; Général de Gaulle – Rue 25 – Blaise Diagne ; Jean Jaurès – Pompidou ; Indépendance – Esso Port – Leclerc | 27 213 |
| 16B | Malika – station Keur Massar ; croisement Keur Massar – LGI – Diamaguène ; Thiaroye – Sips ; Sotiba – Yarakh ; Capa/Virmaud – Place Bakou ; SCOA – Police Bel Air ; Bel Air – GMD ; Môle 8 – Cyrnos ; pompiers – Lamine Guèye ; Peytavin – Jean Jaurès | 29 923 |
| 16A | Malika – Yeumbeul ; Tally Diallo – Icotaf ; Lobatt Fall – autoroute ; Colobane ; Place Bakou – CFAO ; Cyrnos – Arsenal ; Indépendance – Palais de Justice 1 | 27 141 |
| 12 | Guédiawaye – Cité des Enseignants ; Maison du PAI – HLM Guédiawaye ; Domaine de Guédiawaye – Lycée Canada ; Route des Niayes – Tally Boubess ; marché poissons – Route de Rufisque ; Capa – TP Cap Vert ; Cité des Eaux – Bourguiba ; Hôpital Fann – Cheikh Anta Diop ; Jean Jaurès – République ; Senghor – Nelson Mandela – Palais de Justice | 24 516 |
| 232 | Baux Maraîchers – Yarakh ; Yarakh – Cafétéria ; Hann Maristes – Cours Sainte-Marie ; Usine des eaux – Front de Terre ; Khar Yalla – Liberté 6 ; référence à la ligne 8 – Aéroport ; Sipres – Foire | 16 218 |
| 5 | Guédiawaye – Corniche ; Cité des Enseignants – Maison du PAI ; HLM/Golf – Route des Niayes ; Police Parcelles – échangeur Stade LSS ; Patte d'Oie – autoroute ; Cyrnos – Lamine Guèye ; Peytavin – Jean Jaurès ; République – Senghor ; Nelson Mandela – Palais de Justice | 21 903 |
| 11 | Keur Massar – Parcelles (Route de Boune) ; Fass Mbao – Diamaguène ; Thiaroye/mer – Croisement Pikine ; RN – autoroute ; Corniche HLM – Colobane ; RTS – Poste Médina ; Blaise Diagne – Sandaga – Lat-Dior ; CSS – Général de Gaulle | 28 284 |
| 228 | Rufisque – ville de Rufisque ; Bargny – Diamniadio – Yenne | 29 747 |

Autres entités d'itinéraire présentes : lignes 1, 4, 6, 8 (deux entités dont une géométrie de longueur nulle), 9 et 10. Certaines ont peu ou pas de texte de corridor exploitable.

## Rapprochement avec les sources déjà examinées

- **217 :** le corridor de cette couche ArcGIS renforce la piste Dépôt Thiaroye–Police Thiaroye puis Parcelles–Yoff–Ngor–Mamelles. Il ne résout pas le conflit de la fiche DDD publiée précédemment (en-tête Ouakam et liste de repères qui chevauche la 218). Aucun ordre d'arrêt n'est inféré ici.
- **218 :** le texte ArcGIS décrit Thiaroye–RN1–Pikine–Foire/VDN–Ouakam–Almadies–Aéroport, cohérent avec le corridor spatial déjà rapproché de la géométrie 218. Cela ne valide pas le sens ni ne règle l'attribution de l'autre bloc de points, géographiquement proche de 219.
- **219 :** le texte ArcGIS décrit Daroukhane–Guédiawaye–Sahm–Fadia–Ancienne Piste–Ouakam. Cela renforce le corridor de la géométrie 219, mais ne permet pas de reclasser les points historiques codés ligne_218.
- **233/232 :** l'ancienne incohérence de fiche DDD 233 (en-tête Baux Maraîchers–Palais 1, séquence détaillée copiée de 232) n'est pas résolue par le texte ArcGIS 232 Baux Maraîchers–Yarakh et son champ mentionnant la ligne 8/Aéroport. Ne pas substituer l'une à l'autre.
- **16A/16B :** deux corridors ArcGIS distincts sont visibles. Ils restent des candidats à confronter aux pages officielles et à l'usage actuel, pas des lignes à publier automatiquement.

## Décisions d'intégration

1. Conserver les 25 géométries d'itinéraire et les 455 points dans un espace d'audit séparé, avec leurs identifiants source.
2. Ne pas dédupliquer les couches de ligne 13 ni les arrêts aux noms répétés sans comparaison des GlobalID et coordonnées.
3. Ne pas convertir les couples de repères textuels en arrêts intermédiaires ordonnés.
4. Ne pas utiliser cette source pour générer un retour, une fréquence, des horaires ou un compte à rebours.
5. Prioriser le rapprochement géométrique des lignes 217, 218, 219, 227, 232 et 228 avec les pages DDD publiées et les relations OSM distinctes.
6. Garder les données TER/BRT et les données voyageurs de production strictement inchangées.

Artefact source : ddd-route-stop-candidates.json, workflow GitHub Actions 43559272262, artefact ddd-arcgis-route-stop-candidates. Extraction en lecture seule, sans écriture base de données ni déploiement.
