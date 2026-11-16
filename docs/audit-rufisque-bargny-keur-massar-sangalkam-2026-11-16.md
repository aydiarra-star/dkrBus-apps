# Audit géographique Rufisque, Bargny, Keur Massar et Sangalkam — 16 novembre 2026

## Objet et règle de sécurité

Approfondir les dessertes DDD/AFTU, les pôles routiers et ferroviaires, les points GPS disponibles et les cheminements piétons envisageables.

**Audit documentaire uniquement :** aucun arrêt actif, tracé, horaire, transfert du calculateur ou donnée TER/BRT n'est modifié. Les coordonnées d'une gare, d'un bâtiment ou d'un arrêt OSM non attribué à une ligne ne sont jamais utilisées comme quai opérateur par défaut.

## 1. Rufisque — plusieurs pôles distincts

### DDD : dessertes publiées

Le réseau officiel DDD indique notamment :
- **Ligne 15 — Rufisque ↔ Palais 1** : Terminus Rufisque, Djoutiba, Sortie Rufisque, Croisement Keur Massar, puis corridor Mbao/Thiaroye.
- **Ligne 213 — Rufisque ↔ Dieuppeul** : départ annoncé « Gare de Rufisque », puis HLM SIPRES, ZAC Mbao, Grand Mbao, Keur Mbaye Fall, Petit Mbao et Thiaroye.
- **Ligne 220 — Rufisque ↔ Guédiawaye** : Terminus Rufisque, Djoutiba, HLM Rufisque, SIPRES, SEDIMA, Jaxaay et Station Keur Massar.
- **Ligne 208 — Bayakh ↔ Rufisque** : Gorom 01/02, Bambilor, Noflaye, Sangalkam, Keur Ndiaye Lo et Rufisque.
- La page DDD publie aussi une relation Rufisque–Yenne via Bargny, mais sans numéro de ligne clairement attaché au bloc consulté.

### AFTU : catalogue courant et fiches détaillées

Le catalogue courant AFTU affiche :
- **53** : Terminus Keur Massar (Cité MTOA) – UCAD ;
- **54** : Terminus Rufisque Sonadis – Petersen ;
- **55** : Jaxaay 2 – Petersen ;
- **56** : Liberté 6 – Rufisque ;
- **57** : Sahm – Comico ;
- **58** : Diamalaye – Cité Gendarmerie (Jaxaay) ;
- **59** : Colobane – Bargny ;
- **60** : Almadies – Keur Massar ;
- **61** : Arrêt Chérif (Rufisque) – Penc Mi (Gueule Tapée) ;
- **62** : Terminus Camp Marchand Rufisque – Stade LSS ;
- **63** : Guédiawaye – Rufisque ;
- **64** : Colobane – Jaxaay ;
- **65** : Yoff – Gorom 1 ;
- **66** : Ouakam – Thiawlène Rufisque ;
- **67** : Yeumbeul – Sébikotane ;
- **68** : Diamalaye – Terminus Tivaouane Peul ;
- **69** : Daroukhane – Jaxaay 2 ;
- **70** : Keur Massar – Claudel ;
- **71** : Guédiawaye – Kounoune ;
- **72** : Lac Rose – Poste Thiaroye ;
- **73** : Terminus Bargny (gare ferroviaire) – Tivaouane Peul ;
- **74** : Terminus Malika (Cité Sonatel) – Terminus Gare Routière Colobane ;
- **75** : SIPRES – Cité Assurance ;
- **76** : Rufisque – Liberté 5 ;
- **77** : Diamaguène – Liberté 5 ;
- **78** : Sangalkam – Cambérène ;
- **79** : Diamalaye – Darou Thioub ;
- **80** : Beaux Maraîchers – Tivaouane Peul ;
- **81** : Lat Dior – Comico Yeumbeul ;
- **82** : Rufisque Arafat – Zone de Captage ;
- **83** : UCAD – Jaxaay ;
- **84** : Banoba – Liberté 5 ;
- **85** : Tournallou Boune – Toubab Dialaw ;
- **86** : Bambilor – Mosquée Massalikou Djinane ;
- **87** : MTOA – Liberté 5 ;
- **88** : Bargny – Croisement Niague (Cité SICAP) ;
- **89** : APIX – Dougar.

Les fiches détaillées AFTU accessibles donnent des séquences utiles, mais leurs numéros de page ne correspondent pas toujours au numéro du catalogue :
- Fiche détaillée **60** : Colobane → autoroute → RN1 → Diamaguène → Sicap Mbao → Fass Mbao → Croisement Keur Massar → Dioutyba (Rufisque) → Sonadis → Sococim → Bargny. Cette séquence correspond au **catalogue 59**.
- Fiche détaillée **61** : Terminus Keur Massar → RN1 → Fass Mbao → Sicap Mbao → Poste Thiaroye → Autoroute → Patte d'Oie → Dispensaire Nabil Choucair → Aéroport → Terminus Almadies. Cette séquence correspond au **catalogue 60**. Moovit et le nom du nœud OSM « Terminus minibus n°61 » conservent le numéro 61 ; l'application utilise le numéro officiel du catalogue, **AFTU 60**.
- Fiche détaillée **62** : Arrêt Chérif (Rufisque) → Arafat → Marché Mardi → Poste Courant → Sonadis → Dangou → Fass Rufisque → HLM Rufisque → Dioutyba → RN1 → Thiaroye → Penc Mi. Correspond au **catalogue 61**.
- Fiche détaillée **63** : Parcelles Dior → Police des Parcelles → Case Bi → Cambérène → Bountou Pikine → Poste Thiaroye → Croisement Keur Massar → Keur Mbaye Fall → Rond-point Djouti Ba → Route des HLM Rufisque → Stade de Rufisque → Rufisque Nord 73 → Arrêt Khaar → Passage à niveau → Rond-point Arafat → Camp Marchand Rufisque. Correspond au **catalogue 62**.
- Fiche détaillée **74** : Terminus Bargny (gare ferroviaire) → Colobane Rufisque → Poste Courant → RN1 → Boulevard Maurice Gueye → Rond-point Djouti Ba → Route des HLM Rufisque → échangeur Rufisque-Ouest → route de Jaxaay → Rond-point Station Shell Keur Massar → Terminus Keur Massar → Tivaouane Peul → Cité Socabeg → Cité Cocehas. Correspond au **catalogue 73**.
- Fiche détaillée **79** : Terminus Sangalkam → Ndiakhirate → Croisement Niagues → Darou Thioub → Niacourab → Croisement Tivaouane Peulh → Station Keur Massar → Malika → Gadaye → Serigne Assane → Marché Boubess → Préfecture Guédiawaye → Cité Nations Unies / Cambérène. Correspond au **catalogue 78**.
- Fiche détaillée **53** (Terminus Keur Massar marché → Sébikotane) ne correspond pas à l'intitulé catalogue 53 MTOA–UCAD.
- Fiche détaillée **54** (Terminus Keur Massar MTOA → UCAD) correspond au **catalogue 53**, pas au catalogue 54 Rufisque Sonadis–Petersen.

**Décision :** les données du calculateur et de la carte utilisent les numéros du catalogue AFTU courant. Les numéros des fiches détaillées et de Moovit sont conservés comme références secondaires, sans les substituer aux numéros officiels.

## 2. Rufisque — points GPS vérifiables et limites

| Point cartographique | Coordonnées GPS | Ce que cela prouve |
|---|---:|---|
| Gare routière de Rufisque (OSM way 178908478) | **14.72167, -17.28356** | Emprise de gare routière OSM ; pas un quai AFTU/DDD identifié |
| Gare ferroviaire de Rufisque (OSM way 206847948) | **14.71572, -17.27034** | Bâtiment/station ferroviaire |
| Terminus 63 (OSM node 6636898185) | **14.72082, -17.25488** | Arrêt de bus OSM ; attribution opérateur/ligne non prouvée |
| Ex Terminus ligne 63 (OSM node 1782535718) | **14.71489, -17.26393** | Ancien arrêt de bus ; ne pas l'assimiler au terminus actuel |
| CEM Camp Marchand (OSM way 627371995) | **14.72010, -17.26281** | Bâtiment scolaire de référence, pas un quai |
| Arrêt Khaar (OSM node 1902193270) | **14.72029, -17.26547** | Arrêt de bus OSM nommé ; cohérent avec le nom « Arrêt Khaar » de la séquence AFTU 63, mais l'attribution opérateur reste à confirmer |

La gare routière OSM et la gare ferroviaire OSM sont séparées d'environ **1,6 km à vol d'oiseau**. Elles doivent donc rester deux pôles distincts dans le calculateur. Cette valeur n'est pas un itinéraire piéton.

Le terminus AFTU « Camp Marchand » est documenté dans la séquence, mais le bâtiment CEM Camp Marchand et les anciens arrêts OSM ne suffisent pas à identifier le quai actuel. Le point « Terminus 63 » ne doit pas être automatiquement rattaché à la fiche Camp Marchand.

### Sonadis / Djouti Ba / HLM Rufisque

Les fiches catalogue AFTU 59/61/62/73 (fiches détaillées 60/62/63/74) et DDD 15/220 convergent sur les repères Dioutyba/Djouti Ba, Sonadis, HLM Rufisque, Poste Courant et RN1. Une source locale situe la pharmacie Astele « en face arrêt Sonadis » sur Keury Souf / Boulevard Maurice Gueye ; le guichet MSAE de Rufisque est aussi indiqué au Rond-point SONADIS.

Cela confirme un pôle de transport connu, mais **aucune coordonnée GPS fiable du quai Sonadis** n'a été trouvée dans les sources ouvertes consultées. Le point du commerce, de la pharmacie ou de la mairie ne doit pas remplacer l'arrêt.

## 3. Bargny — meilleur candidat de correspondance avec le TER

### Points GPS

- **Gare de Bargny** (OSM way 1016285847) : **14.69798, -17.22923**.
- **Garage clando** (OSM node 4846093863, amenity=bus_station) : **14.69650, -17.23086**.

Mapcarta situe le Garage clando à environ **260 m** de la gare ferroviaire. Cette proximité est un repère géographique, pas une mesure de cheminement piéton vérifié.

### Desserte

- La fiche AFTU détaillée 74 publie explicitement **« Terminus Bargny (gare ferroviaire) »** et une séquence qui remonte par Rufisque jusqu'à Keur Massar.
- La fiche AFTU détaillée 60 publie aussi le terminus Bargny via Sonadis et Sococim.
- DDD publie le passage par Bargny dans la relation Rufisque–Yenne, mais le numéro et le quai exacts ne sont pas identifiés dans la page consultée.

### Correspondance candidate

**TER Bargny ↔ AFTU au pôle gare ferroviaire** est le candidat le plus fort du secteur : la fiche AFTU nomme explicitement la gare ferroviaire comme terminus. Le Garage clando OSM est à proximité, mais on ne sait pas encore s'il représente le quai de cette ligne AFTU, un autre service collectif ou une zone distincte.

Avant activation : relever le quai AFTU réel, l'accès TER ouvert, les traversées et le cheminement piéton entre les deux. Aucun transfert n'est ajouté pour le moment.

## 4. Keur Massar — terminus commun DDD / AFTU 60 et autres pôles séparés

### Terminus principal DDD / AFTU 60 — pôle commun confirmé

Les données géographiques DDD (couche d'arrêts ArcGIS, séquences des lignes 11 et 227) placent « Terminus Keur Massar » à :
- DDD 11 : **14.785391, -17.309223**.
- DDD 227 : **14.785436, -17.309195**.

OpenStreetMap identifie au même endroit :
- « Terminus Dakar Dem Dik », node 3580321801 : **14.78540, -17.30922**, amenity=bus_station.
- « Terminus minibus n°61 », node 5286379844 : **14.78545, -17.30922**, amenity=bus_station et public_transport=station.
- « Terminus Dakar dem dikk P11 », node 5286379845 : **14.78556, -17.30891**, gare routière voisine.

Le catalogue AFTU courant confirme **ligne 60 : Almadies – Keur Massar**. La fiche détaillée du site AFTU porte le numéro de page 61 et Moovit indexe aussi cette route sous 61 ; le calculateur conserve le numéro officiel du catalogue, **AFTU 60**. Sa fiche détaillée (mise à jour le 7 juillet 2026) décrit : Terminus Keur Massar → Route nationale 1 → Fass Mbao → Sicap Mbao → Poste Thiaroye → Autoroute → Patte d'Oie → Dispensaire Nabil Choucair → Aéroport → Terminus Almadies.

**Conclusion géographique :** le terminus DDD et le terminus minibus n°61 sont co-localisés à quelques mètres. C'est un pôle commun DDD/AFTU confirmé au niveau du terminus. Le calculateur intègre désormais la correspondance DDD 227 ↔ AFTU 60 avec les deux sens documentés de ces lignes. DDD 11 partage le même point terminal, mais reste hors calculateur tant que son terminus final n'est pas réconcilié avec les sources de parcours. Les quais exacts à l'intérieur de l'enceinte restent à relever.

### Extrémité Almadies / Mamelles de la ligne AFTU 61

- La fiche Moovit de la ligne 61 confirme 54 arrêts dans chaque sens et cite notamment Carrefour Mbao, Thiaroy, Stade de Ngor, Aéroport et Terminus 61.
- Le terminus AFTU « Terminus 61 » à Almadies est situé à **31 m / 1 min à pied** de l'arrêt OSM « Arrêt autobus 217 et 218 – Dakar Dem Dikk », node 9562676804, **14.73475, -17.50863**.
- Moovit indique que le pôle Terminus 61 est desservi par AFTU et Dakar Dem Dikk. Le calculateur utilise ce point comme repère GPS de l'extrémité Almadies de l'AFTU 60 ; il ne prétend pas que le quai AFTU est exactement sur le point DDD.
- **Correspondance candidate supplémentaire : AFTU 60 ↔ DDD 217/218**, marche Moovit 31 m. Elle n'est pas encore activée : les lignes DDD 217/218 ne sont pas encore intégrées au graphe du calculateur.
- Le point « Rond-point Ngor » reste un repère cartographique de corridor ; il n'est pas présenté comme un quai AFTU 60 tant que son attribution précise n'est pas confirmée.

### Autres pôles Keur Massar — à ne pas fusionner

- **Terminus 52 (TATA)**, node 5286379847 : **14.77419, -17.31767**, réseau TATA selon OSM. Il est distinct du terminus DDD/AFTU 60.
- **Gare routière de Keur Massar**, OSM way 335756472 : **14.76984, -17.31840**. C'est un autre site, environ 1,8 km du terminus DDD/AFTU 60 à vol d'oiseau.
- **Service spéciale DDD**, node 5602711037 : **14.77054, -17.31875**. Arrêt OSM proche de la gare routière précédente, mais distinct du terminus DDD des lignes 11/227 ; ne pas le rattacher automatiquement à ces lignes.
- **Station MTOA**, OSM way 339556843 : **14.78288, -17.32369**. C'est une station-service, pas un quai. Le catalogue AFTU indique **ligne 53 : Terminus Keur Massar (Cité MTOA) – UCAD** ; son quai MTOA doit rester distinct du terminus principal DDD/AFTU 60.

### Décision

- **Correspondance intégrée au calculateur : DDD 227 ↔ AFTU 60**, terminus principal **14.7854, -17.30922**. DDD 11 partage le même terminus, mais son parcours n'est pas encore intégré.
- **Aucune fusion automatique** avec TATA 52, la gare routière située plus au sud-ouest, l'arrêt Service spéciale DDD ou le terminus MTOA.
- **Intégration active dans ce chantier : DDD 227 ↔ AFTU 60** au pôle commun, avec un transfert de pôle (`walkM: 0`). Cette valeur signifie que les deux lignes partagent la même gare routière ; elle ne prétend pas que les quais sont séparés de zéro mètre.
- Le calculateur reçoit les deux sens de DDD 227 (69 arrêts par sens sur Moovit) et d'AFTU 60 (54 arrêts par sens sur Moovit, index Moovit 61), avec cinq repères GPS de corridor pour DDD 227 et quatre arrêts de référence pour AFTU 60. Le tracé cartographique passe par Ngor, mais le point OSM du rond-point n'est pas présenté comme un quai AFTU 60 tant que son attribution exacte n'est pas confirmée. Les séquences sont limitées aux points majeurs vérifiés ; elles ne remplacent pas encore une base exhaustive de tous les quais.
- Fréquences utilisées pour ces deux lignes : DDD 227, 30 min ; AFTU 60, 42 min comme valeur prudente (Moovit indique environ 20 min en semaine et 42 min le week-end, et le calculateur n'applique pas encore un calendrier par jour). Ces valeurs restent des références secondaires Moovit, pas des horaires officiels DDD/AFTU.
- DDD 11 partage le même terminus GPS, mais n'est pas encore ajouté au calculateur : la séquence officielle DDD annonce Lat Dior tandis que la fiche Moovit consultée annonce Leclerc. Ce désaccord doit être résolu avant d'intégrer cette ligne.
- Aucune donnée, station, séquence ou fréquence TER/BRT n'est modifiée.

## 5. Sangalkam et corridor vers Rufisque

- DDD ligne **208** publie Bayakh → Gorom 01/02 → Bambilor → Noflaye → Sangalkam → Keur Ndiaye Lo → Rufisque.
- Le catalogue AFTU affiche **ligne 78 : Sangalkam–Cambérène** ; la fiche détaillée 79 publie Sangalkam → Ndiakhirate → Niagues → Darou Thioub → Niacourab → Tivaouane Peulh → Station Keur Massar → Gadaye → Guédiawaye/Cambérène.

La desserte des deux réseaux est donc confirmée à l'échelle de la localité et du corridor. Aucun quai exact de Sangalkam n'a été établi ; aucun transfert automatique n'est ajouté.

## 6. Correspondances à prioriser pour le calculateur

| Priorité | Correspondance candidate | Niveau de preuve | Action avant activation |
|---|---|---|---|
| 1 | **DDD 227 ↔ AFTU 60, terminus principal Keur Massar** | Deux points DDD ArcGIS et deux gares routières OSM co-localisés à ~5 m ; catalogue et fiche AFTU 61 confirment Keur Massar | Actif dans le calculateur · relever les quais internes ; DDD 11 reste hors calculateur tant que le terminus final n'est pas réconcilié |
| 2 | TER Bargny ↔ AFTU 73 terminus gare ferroviaire | La fiche AFTU 74 décrit explicitement le terminus « Bargny (gare ferroviaire) » ; les quais bus précis restent non identifiés | Relever le quai AFTU réel et tracer le cheminement piéton depuis l'accès TER |
| 3 | DDD/AFTU autour de Sonadis–Djouti Ba–HLM Rufisque | Plusieurs séquences convergentes ; point GPS du quai Sonadis absent | Géocoder les arrêts exacts et les quais dans les deux sens |
| 4 | DDD 213 ↔ AFTU Camp Marchand / gare de Rufisque | Les terminus et gares OSM sont distincts ; correspondance non prouvée | Identifier le quai DDD « Gare de Rufisque » et le terminus AFTU Camp Marchand |
| 5 | DDD 208 ↔ AFTU 78 à Sangalkam | Desserte locale publiée par les deux réseaux, mais terminus/quais non géocodés | Localiser les arrêts exacts et tracer le cheminement piéton |

Les distances ci-dessus qui sont indiquées « à vol d'oiseau » ne sont jamais utilisées comme temps de marche. Pour le calcul final, il faut un chemin piéton praticable, avec traversées et accès, puis une distance mesurée sur ce chemin.

## Sources

### Opérateurs et autorités
- DDD, réseau urbain et lignes de banlieue : https://demdikk.sn/reseau-urbain-dakar/
- AFTU, catalogue courant : https://aftu-senegal.org/infos-pratiques/
- AFTU, fiche détaillée ligne 54 : https://aftu-senegal.org/map/dakar-urbain-ligne-54/
- AFTU, fiche détaillée page 60 (catalogue officiel ligne 59, Colobane–Bargny) : https://aftu-senegal.org/map/dakar-urbain-ligne-60/
- AFTU, fiche détaillée page 61 (catalogue officiel ligne 60, Almadies–Keur Massar) : https://aftu-senegal.org/map/dakar-urbain-ligne-61/
- DDD, ligne 227 — séquence officielle : https://demdikk.sn/reseau-urbain-dakar/
- Moovit, DDD ligne 227 — deux sens et horaires : https://moovitapp.com/index/fr/transport_en_commun-line-227-Dakar-5996-1618037-18051447-1
- Moovit, AFTU index 61 (catalogue officiel ligne 60) — deux sens et 54 arrêts : https://moovitapp.com/index/fr/transport_en_commun-line-61-Dakar-5996-1618038-18051490-1
- Moovit, AFTU index 61 (catalogue officiel ligne 60) — grille de départs : https://moovitapp.com/index/fr/transport_en_commun-time-61-Dakar-5996-1618038-18051490-4256300-0
- AFTU, fiche détaillée ligne 62 : https://aftu-senegal.org/map/dakar-urbain-ligne-62/
- AFTU, fiche détaillée ligne 63 : https://aftu-senegal.org/map/dakar-urbain-ligne-63/
- AFTU, fiche détaillée page 74 (catalogue officiel ligne 73, Bargny–Tivaouane Peul) : https://aftu-senegal.org/map/dakar-urbain-ligne-74/
- AFTU, fiche détaillée page 79 (catalogue officiel ligne 78, Sangalkam–Cambérène) : https://aftu-senegal.org/map/dakar-urbain-ligne-79/
- Guide officiel de mobilité JOJ Dakar 2026 (photographie datée du réseau) : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf

### Cartographie et repères
- Gare routière de Rufisque : https://mapcarta.com/fr/W178908478
- Gare de Rufisque : https://mapcarta.com/fr/W206847948
- Gare de Bargny : https://mapcarta.com/fr/W1016285847
- Terminus bus Bargny : https://mapcarta.com/fr/N2366463127
- Garage clando Bargny : https://mapcarta.com/fr/N4846093863
- Terminus Dakar Dem Dik : https://mapcarta.com/fr/N3580321801
- Terminus minibus n°61 : https://mapcarta.com/fr/N5286379844
- Arrêt DDD 217/218 proche du Terminus 61 : https://mapcarta.com/N9562676804
- Moovit, Terminus 61 Almadies (31 m à pied du quai DDD voisin) : https://moovitapp.com/index/fr/transport_en_commun-Terminus_61-Dakar-stop_37703727-5996
- Terminus Dakar dem dikk P11 : https://mapcarta.com/fr/N5286379845
- Terminus 52 (TATA) : https://mapcarta.com/fr/N5286379847
- Gare routière de Keur Massar : https://mapcarta.com/fr/W335756472
- Arrêt Service spéciale DDD : https://mapcarta.com/fr/N5602711037
- Station MTOA : https://mapcarta.com/fr/W339556843
- Terminus 63 : https://mapcarta.com/fr/N6636898185
- Ex Terminus ligne 63 : https://mapcarta.com/fr/N1782535718
- CEM Camp Marchand : https://mapcarta.com/fr/W627371995
- Arrêt Khaar : https://mapcarta.com/fr/N1902193270
- Pharmacie Astele, adresse « en face arrêt Sonadis » : https://www.solaas.sn/fiimoowoor/establishment/2309
- CETUD, étude territoriale et réseau de transport collectif : https://cetud.sn/wp-content/uploads/2026/03/10-CETUD-ESRBRT-TOME-2_VF.pdf

## Périmètre

Le calculateur et la carte intègrent désormais les corridors DDD 227 et AFTU 61 ainsi que leur correspondance au terminus partagé de Keur Massar. Les autres points Rufisque/Bargny restent en audit tant que les quais exacts ou les chemins piétons ne sont pas prouvés. Les lignes, stations, tracés et horaires TER/BRT restent strictement inchangés.
