# Audit des dessertes et correspondances — Ngor et Mermoz — 16 novembre 2026

## Objectif

Corriger les lacunes de couverture constatées dans l'application pour les secteurs de Ngor et Mermoz, puis identifier les correspondances inter-réseaux qui peuvent améliorer le calcul multimodal.

**Ce document n'active aucune correspondance dans le calculateur.** Il distingue les lignes dont le passage est publié, les arrêts nommés, les pôles candidats et les correspondances dont les accès/quais restent à vérifier.

## 1. Ngor — dessertes publiées

### DDD

La page officielle Dakar Dem Dikk publie :

- **Ligne 221 — Gadaye ↔ Almadies** : terminus Gadaye, Hamo 6, Dial Mbaye, Hôpital Dalal Diam, Pont Sénégal Émergent, Yoff Tonghor, Cité ASECNA, **Rond-point Ngor**, **Ngor village**, terminus Almadies.
- **Ligne 218 — Thiaroye ↔ Aéroport LSS** : la séquence officielle passe par Foire, VDN, Sipres, Ancienne Piste, Ouakam, route des Mamelles, route des Almadies, **Ngor**, puis Aéroport LSS.
- **Ligne 217 — Thiaroye ↔ Ouakam** : la page de réseau affiche aussi une séquence prolongée vers Ngor et Aéroport LSS. Le titre et le détail ne concordent pas sur le terminus : conserver ce conflit et ne pas traiter la ligne 217 comme une liaison indépendante confirmée jusqu'à Ngor sans clarification DDD.
- **TAF TAF** : Ouakam, Mamelles, Croisement Almadies, **Ngor**, Yoff, route de l'Aéroport, Foire, VDN, puis Diamniadio/AIBD.

### AFTU

Les fiches officielles AFTU confirment :

- **Ligne 3** : Yoff-Village, Aéroport, route de Ngor, **village de Ngor**, route de l'Aéroport, Mamelles, Cité ASECNA, Ouakam, puis Petersen.
- **Ligne 35** : Pikine Texaco, Tally Boumack, Khourounar, Cité Lobatt Fall, croisement Cambérène, Patte d'Oie, Yoff, Aéroport, **terminus Ngor**.
- **Ligne 36** : Marché Ndiarème, Parc Lambaye, quartier Cheikh Wade, deux voies Notaire, Dial Mbaye, Cité Enseignants, Croisement Béthio, Case-Ba, Parcelles, Yoff-Village, Aéroport, **terminus Ngor**.
- **Ligne 49** : Gadaye, Marché Ndiarème, route de Rufisque, CAPA, échangeur de Hann, Liberté 6, Sacré-Cœur, **Mermoz rond-point Cheikh Béthio**, Ouakam, Mamelles, rond-point Almadies, **terminus Ngor**.

### Conflit AFTU à ne pas exploiter

Le catalogue AFTU affiche la **ligne 34 Ngor–Pikine Texaco**, mais sa fiche détaillée décrit un parcours Nord Foire–VDN–Liberté 6–Sacré-Cœur–Lat Dior, sans Ngor. La ligne 34 est donc exclue des correspondances Ngor jusqu'à clarification officielle.

## 2. Ngor — pôles candidats à vérifier

### Candidat A : Rond-point Ngor / Ngor village

- DDD 221 nomme explicitement le Rond-point Ngor et Ngor village.
- AFTU 3 dessert explicitement le village de Ngor.
- AFTU 35 et 36 terminent à Ngor ; AFTU 49 termine également à Ngor.
- Un arrêt OSM nommé « Arrêt bus rond point Ngor » est référencé à **14.74894, -17.51440** (node 4747526721).
- Un objet OSM distinct « Garage de Ngor » est référencé à **14.74877, -17.51518** (way 121413765).

Ces deux objets OSM sont voisins, mais cela ne prouve pas que les quais DDD 221 et AFTU 3/35/36/49 sont tous au même endroit. La gare routière et l'arrêt du rond-point doivent être examinés séparément.

### Candidat B : terminus AFTU 35

Un objet OSM nommé « Terminus de bus 35 » est référencé à **14.74149, -17.51849** (node 11544808946), tandis que le Rond-point Ngor est à **14.74894, -17.51440**. Ces positions sont distinctes : ne pas assimiler automatiquement le terminus AFTU au quai DDD 221 du rond-point.

### Décision Ngor

Couverture bus confirmée, mais **aucune correspondance automatique n'est encore activée**. Il faut identifier les quais réellement utilisés par les lignes AFTU au Garage de Ngor et les accès piétons vers les arrêts DDD 221 « Rond-point Ngor » et « Ngor village ». Ne pas mettre walkM=0 sur la seule base du nom de quartier.

## 3. Mermoz — dessertes publiées

### DDD

La page officielle DDD confirme **la ligne 7 — Ouakam ↔ Palais 2**, avec une séquence comprenant :

Terminus Ouakam → Cité Assemblée → Cité Comico → Sortie Ouakam → Hôpital IHO → **Mermoz** → ENEA → École Normale → UCAD → centre-ville → Palais 2.

Il est donc incorrect de considérer Mermoz comme dépourvu de DDD : la ligne 7 le dessert explicitement.

### AFTU

Les fiches officielles AFTU confirment plusieurs dessertes du secteur :

- **Ligne 44 — Grand Mbao ↔ Ouakam** : Grand Mbao, route nationale 1, Fass Mbao, SICAP Mbao, Diamaguène, Poste Thiaroye, Patte d'Oie, Pont de l'Émergence, Foire, Ancienne Piste, **Mermoz**, terminus Ouakam.
- **Ligne 49 — Gadaye ↔ Ngor** : Sacré-Cœur, **Mermoz rond-point Cheikh Béthio**, Ouakam, Mamelles, rond-point Almadies, terminus Ngor.
- **Ligne 67 — Thiawlène Rufisque ↔ Ouakam** : Sonadis, Grand Mbao, Poste Thiaroye, route de Hann, Cité des Eaux, avenue Bourguiba, École Normale, **Mermoz**, entrée Ouakam, Cité Avion et Boutique Diallo.

### Point de correspondance le plus prometteur : Avenue Cheikh Anta Diop, 48 / Lycée Mermoz

La fiche d'arrêt Moovit « Avenue Cheikh Anta Diop, 48 » indique un arrêt partagé par les réseaux DDD et AFTU. Elle affiche notamment :

- DDD **7** ;
- AFTU **44** et **49** ;
- d'autres lignes proches ou desservant le même arrêt selon la fiche : 3, 14, 42, 43, 67, 218, 219 et 319.

La fiche situe l'arrêt « Lycée Mermoz » à **54 m, soit environ 1 minute de marche**, de l'arrêt « Avenue Cheikh Anta Diop, 48 ». La page d'arrêt mise à jour le 5 septembre 2026 affiche les lignes 7, 44 et 49 à cet arrêt et précise qu'il dessert les réseaux AFTU et Dakar Dem Dikk. Elle place le repère « Lycée Mermoz » à 54 m, soit environ 1 minute de marche. Cela constitue une preuve solide d'un **pôle de correspondance DDD↔AFTU à Mermoz** au niveau de cet arrêt commun.

Cependant, les fiches officielles d'itinéraire ne donnent pas les coordonnées GPS précises du quai « Avenue Cheikh Anta Diop, 48 ». Le point GPS du bâtiment du lycée ne doit pas être substitué au quai. Il faut relever le point exact de l'arrêt et, si les deux sens utilisent des quais opposés, conserver les deux positions.

### Autre point OSM à distinguer

Un arrêt OSM nommé « Deuxième porte Mermoz » est référencé à **14.70277, -17.47340** (node 4363241793) et attribué au réseau DDD. Il s'agit d'un arrêt distinct du secteur Lycée Mermoz / Avenue Cheikh Anta Diop, 48. Ne pas le fusionner avec le pôle Lycée Mermoz sans vérification de la ligne et du cheminement.

## 4. Correspondances à intégrer au calculateur — ordre de priorité

### Priorité 1 — Mermoz : DDD 7 ↔ AFTU 44 / AFTU 49

La même fiche d'arrêt « Avenue Cheikh Anta Diop, 48 » annonce une desserte DDD et AFTU, et la présence des lignes 7, 44 et 49 est cohérente avec les fiches officielles d'itinéraire.

**Action requise avant activation technique :** obtenir les coordonnées du quai exact et vérifier si les lignes partagent le même quai ou deux quais distincts. Si un seul quai commun est confirmé, le calculateur pourra traiter le transfert comme un échange au même arrêt ; sinon, utiliser la distance piétonne mesurée entre les quais.

### Priorité 2 — Ngor : DDD 221 ↔ AFTU 3 / 35 / 36 / 49

Les dessertes se rencontrent dans le secteur Ngor, mais les sources ne démontrent pas encore que les véhicules utilisent le même quai. Vérifier Garage de Ngor, terminus AFTU 35, terminus AFTU 36/49 et arrêts DDD du Rond-point Ngor / village de Ngor.

**Action requise avant activation technique :** cartographier les quais et le cheminement piéton réel, puis calculer la distance de marche. Aucun walkM=0 ne doit être utilisé par défaut.

### Priorité 3 — Mermoz : AFTU 67 ↔ DDD 7

Les deux lignes desservent le secteur Mermoz, mais les sources ne prouvent pas encore qu'elles partagent exactement le quai Avenue Cheikh Anta Diop, 48. À vérifier avec les points d'arrêt de la ligne 67 et les quais DDD 7.

### Priorité 4 — Mermoz / Ancienne Piste / Ouakam

Les lignes AFTU 44, 49, 67 et DDD 7/219 ont des tronçons ou repères communs dans le corridor Mermoz–Ouakam. Ne pas créer de correspondance à l'échelle du quartier : retenir uniquement les arrêts nommés communs ou les quais proches dont le cheminement est vérifié.

## 5. Conséquences pour le calcul multimodal

Après validation géographique, le graphe de correspondances devra :

1. proposer un changement de réseau uniquement aux arrêts ou pôles réellement partagés ;
2. intégrer la marche entre quais lorsque les arrêts sont distincts ;
3. ne pas confondre un passage dans le même quartier avec une correspondance ;
4. conserver des arrêts séparés pour les sens opposés quand les quais sont distincts ;
5. permettre les chaînes DDD↔AFTU et AFTU↔AFTU au même pôle, sans créer de liaison directe fictive entre les terminus ;
6. ne modifier aucun horaire ni aucune séquence TER/BRT existante.

## Sources

### Officielles

- DDD — Réseau urbain et banlieue : https://demdikk.sn/reseau-urbain-dakar/
- DDD — Info voyageurs : https://demdikk.sn/info-voyageurs/
- AFTU — Catalogue des lignes : https://aftu-senegal.org/infos-pratiques/
- AFTU — Ligne 3 : https://aftu-senegal.org/map/dakar-urbain-ligne-3/
- AFTU — Ligne 35 : https://aftu-senegal.org/map/dakar-urbain-ligne-35/
- AFTU — Ligne 36 : https://aftu-senegal.org/map/dakar-urbain-ligne-36/
- AFTU — Ligne 44 : https://aftu-senegal.org/map/dakar-urbain-ligne-44/
- AFTU — Ligne 49 : https://aftu-senegal.org/map/dakar-urbain-ligne-49/

### Arrêts et cartographie

- Moovit — Avenue Cheikh Anta Diop, 48 : https://moovitapp.com/index/fr/transport_en_commun-Avenue_Cheikh_Anta_Diop_48-Dakar-stop_37702386-5996
- Moovit — Lycée Mermoz : https://moovitapp.com/index/fr/transport_en_commun-Lyc%C3%A9e_Mermoz-Dakar-stop_37702387-5996
- OSM/Mapcarta — Arrêt bus rond-point Ngor : https://mapcarta.com/fr/N4747526721
- OSM/Mapcarta — Garage de Ngor : https://mapcarta.com/W121413765
- OSM/Mapcarta — Terminus de bus 35 : https://mapcarta.com/fr/N11544808946
- OSM/Mapcarta — Deuxième porte Mermoz : https://mapcarta.com/fr/N4363241793

## Périmètre de modification

Document d'audit uniquement. Aucun code, arrêt actif, coordonnée de calcul, tracé, horaire, transfert du graphe ou donnée TER/BRT n'est modifié dans cette PR.
