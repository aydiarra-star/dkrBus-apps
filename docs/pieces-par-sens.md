# Correspondances : pièces par sens

Calculateur local au 2026-11-19 à 19:00 (Dakar), sans édition opérateur : **43 dossiers, 86 sens, 88 évaluations, 88 bloquées avant horaire**. Une même gare peut avoir plusieurs directions de service. Les entrées/sorties seules (4 arcs) ne sont pas des chemins de correspondance.

Chaque rubrique sépare descente, montée et droit de passage. Si les portes sont effectivement au même endroit dans le même site, fournir à la place du chemin une autorisation **pour ces deux appels orientés** et un délai minimal. Sinon mesurer chaque segment, traversée et contrôle dans le sens indiqué. Lorsque l’examen s’arrête avant l’horaire, il reste aussi à fournir les deux courses de la même date, heures aux appels et temps pour les joindre. Un blocage dans le calculateur ne prouve pas que le voyage est impossible sur place.

[Enquête ciblée, fiches sources et demande aux exploitants](enquete-correspondances.md). Régénérer : `node scripts/audit_passenger_transfers.mjs --at 2026-11-19T19:00 --markdown`.

## thiaroye-218-73

### Descendre : Dépôt Thiaroye · descente de la 218 depuis Aéroport LSS → monter : Poste Thiaroye · montée dans la 73 vers Lac Rose

Départ marqué de la 73 à 1,7 m du poteau 217/218. Les deux dessins quittent le dépôt. Les bornes de départ à Aéroport LSS (07:00 / 20:30, annonce DDD du 25 juin 2025) ne donnent pas l’arrivée à Thiaroye. Ni la descente datée de la 218 depuis Aéroport LSS, ni le passage jusqu’à la 73 ne sont confirmés.

- **DDD → AFTU** · `survey:thiaroye:218:arrivee` → `survey:thiaroye:73:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:thiaroye:218:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:thiaroye:218:arrivee.
  - Identifier et sourcer le quai de montée de survey:thiaroye:73:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:thiaroye:73:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Dépôt Thiaroye · descente de la 73 depuis Lac Rose → monter : Dépôt Thiaroye · montée dans la 218 vers Aéroport LSS

Depuis Lac Rose, A_586 était l’avant-dernier appel ; le terminus A_266 était à 99,9 m du poteau. Près de cet ancien terminus, une autre voie de service et une chaussée à sens unique. La 218 est dessinée depuis le point 539 à 29,7 m du poteau. 05:30 et 19:30 sont des bornes annoncées à Thiaroye en 2025, pas une course datée après la descente de la 73. Ni marche autorisée ni départ daté au dépôt établis.

- **AFTU → DDD** · `survey:thiaroye:73:arrivee` → `survey:thiaroye:218:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:thiaroye:73:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:thiaroye:73:arrivee.
  - Identifier et sourcer le quai de montée de survey:thiaroye:218:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:thiaroye:218:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/terminus-correspondances.md) · [2](../data/bus-review/terminal-occurrences.json) · [3](../data/bus-review/terminus-quays-2026-11-19.json) · [4](../docs/depot-thiaroye.md) · [5](../data/bus-review/thiaroye-site.json) · [6](https://www.openstreetmap.org/node/4419421889) · [7](https://aftu-senegal.org/map/dakar-urbain-ligne-73/) · [8](https://demdikk.sn/reseau-urbain-dakar/) · [9](https://x.com/dakardemdikk1/status/1937979929007702515) · [10](https://x.com/dakardemdikk1/status/1937979936272162819).

## thiaroye-218-73-niague

### Descendre : Poste Thiaroye · descente de la 218 depuis terminus 7218/219 → monter : Station Ciel Oil/Thiaroye · départ de la 73 vers Niague

05:28 est un départ de la 218, pas son arrivée à Poste Thiaroye. La 73 est signalée à 05:31 à son origine. La différence de trois minutes ne mesure pas une correspondance.

- **DDD → AFTU** · `survey:nouveau:218:arrivee-poste` → `survey:nouveau:73:depart-ciel-oil` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:nouveau:218:arrivee-poste, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:nouveau:218:arrivee-poste.
  - Identifier et sourcer le quai de montée de survey:nouveau:73:depart-ciel-oil, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:nouveau:73:depart-ciel-oil.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Station Ciel Oil/Thiaroye · arrivée de la 73 depuis Niague → monter : Poste Thiaroye · départ de la 218 vers terminus 7218/219

Pas d’arrivée fournie pour la 73 depuis Niague. Ne pas y reporter 06:54 depuis Lac Rose, ni générer des 218 toutes les 16 minutes.

- **AFTU → DDD** · `survey:nouveau:73:arrivee-ciel-oil` → `survey:nouveau:218:depart-poste` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:nouveau:73:arrivee-ciel-oil, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:nouveau:73:arrivee-ciel-oil.
  - Identifier et sourcer le quai de montée de survey:nouveau:218:depart-poste, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:nouveau:218:depart-poste.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/releve-218-73.md) · [2](../data/bus-review/reported-218-73.json) · [3](../docs/depot-thiaroye.md).

## ponty-ddd-1-7

### Descendre : Ponty · descente de la 1 vers Leclerc → monter : Ponty · montée dans la 7 vers Palais 1

Même objet OSM 4666430941, rang 36/38 dans la 1 et 30/34 dans la 7 vers Palais 1. L’ancien appel D_128 (Cbao Ponty) était commun, mais la fiche DDD nomme Palais 2. CBAO rang 44/47 de la 1, entre Plaza et Place de l’indépendance ; aucune occurrence nommée Ponty sur la 7 de Gare Palais. Identifier les portes et deux appels datés avant de proposer de rester sur place.

- **DDD → DDD** · `survey:ponty:1:leclerc` → `survey:ponty:7:palais` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:ponty:1:leclerc, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:ponty:1:leclerc.
  - Identifier et sourcer le quai de montée de survey:ponty:7:palais, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:ponty:7:palais.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Ponty · descente de la 7 vers Ouakam → monter : Ponty · montée dans la 1 vers les Parcelles

Dans ce sens, les deux anciennes lignes appelaient D_122 (Poste Ponty), pas D_128. Poste (Avenue Ponty), rang 4/43 de l’extrait DDD, est à 305,2 m du symbole OSM 711879280 sans relation et à 305,3 m de D_122. Cercle Mess des Officiers et Imm Yoro Lam Ponty encadrent ce rang, sans heure de passage. Écart entre coordonnées de sources, pas un chemin : ne pas placer la porte à cet ancien ID.

- **DDD → DDD** · `survey:ponty:7:ouakam` → `survey:ponty:1:parcelles` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:ponty:7:ouakam, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:ponty:7:ouakam.
  - Identifier et sourcer le quai de montée de survey:ponty:1:parcelles, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:ponty:1:parcelles.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/enquete-correspondances.md) · [2](../data/bus-review/exchange-call-comparison.json) · [3](../docs/releve-218-73.md) · [4](../data/bus-review/within-bus-families.json) · [5](../data/bus-review/reference-archives.json) · [6](https://www.openstreetmap.org/node/4666430941/history/3) · [7](https://api.openstreetmap.org/api/0.6/node/4666430941/relations.json) · [8](https://demdikk.sn/chatbot-arrets/) · [9](https://demdikk.sn/reseau-urbain-dakar/).

## colobane-aftu-75-65

### Descendre : Colobane · descente de la 75 depuis Malika → monter : Colobane · montée dans la 65 vers Jaxaay 2

Les symboles fin 75 / début 65 sont à 0,4 m ; les extrémités des traits à 1,4 m. L’ancienne 65 depuis A_1564 allait vers Kounoune École Mbaba. 75 r52/52 à 04:33, 65 r1/57 à 04:42 : 9 min entre cellules de semaine, pas le temps pour passer d’une porte à l’autre. La fiche d’arrêt 37702002 associe ces deux minutes, pas les deux portes.

- **AFTU → AFTU** · `survey:colobane:75:arrivee` → `survey:colobane:65:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:colobane:75:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:colobane:75:arrivee.
  - Identifier et sourcer le quai de montée de survey:colobane:65:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:colobane:65:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Colobane · descente de la 65 depuis Jaxaay 2 → monter : Colobane · montée dans la 75 vers Malika

Les dessins mesurés ne montrent pas cette arrivée de la 65 ni ce départ de la 75. 65 r56/56 à 05:11 et 75 r1/51 à 05:16 : 5 min entre cellules de semaine. La fiche d’arrêt 37702003 associe 05:11 et 05:16 et nomme Yeumbeul ; confirmer la variante de Malika, les quais et la permission de monter.

- **AFTU → AFTU** · `survey:colobane:65:arrivee` → `survey:colobane:75:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:colobane:65:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:colobane:65:arrivee.
  - Identifier et sourcer le quai de montée de survey:colobane:75:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:colobane:75:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/enquete-correspondances.md) · [2](../data/bus-review/exchange-call-comparison.json) · [3](../docs/releve-218-73.md) · [4](../data/bus-review/within-bus-families.json) · [5](../data/bus-review/reference-archives.json) · [6](../data/bus-review/friday-stop-excerpts.json) · [7](https://moovitapp.com/index/fr/transport_en_commun-Gare_De_Colobane-Dakar-stop_37702002-5996) · [8](https://moovitapp.com/index/fr/transport_en_commun-Gare_De_Colobane-Dakar-stop_37702003-5996) · [9](https://aftu-senegal.org/map/dakar-urbain-ligne-75/) · [10](https://aftu-senegal.org/map/dakar-urbain-ligne-65/).

## colobane-aftu-75-60

### Descendre : Gare De Colobane · 75 depuis Yeumbeul, rang 52/52 → monter : Gare De Colobane · 60 vers Bargny, rang 1/50

75 depuis 03:50, arrivée 04:33 après Av. Mbacké / Rue 231 ; 60 à 04:40 avant deux occurrences Rue Gib 71, 18. Sept minutes entre cellules, pas un délai de marche. Fin 75 / début 60 : 0,5 m entre symboles, 1,6 m entre bouts des traits. La carte nomme Malika, la grille Yeumbeul : confirmer la variante, la dépose et la file pour Bargny.

- **AFTU → AFTU** · `survey:colobane:75:yeumbeul:arrivee` → `survey:colobane:60:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:colobane:75:yeumbeul:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:colobane:75:yeumbeul:arrivee.
  - Identifier et sourcer le quai de montée de survey:colobane:60:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:colobane:60:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Gare De Colobane · 60 depuis Bargny, rang 48/48 → monter : Gare De Colobane · 75 vers Yeumbeul, rang 1/51

60 depuis 04:20, arrivée 05:17 après Hlm V. La 75 à 05:16 est déjà partie sur la grille ; prochaine origine imprimée 05:25, huit minutes après 05:17. Aucune des deux cartes sortantes ne décrit ces portes dans le sens inverse. Dans l’archive 2023, A_990 → A_1564 pour la 60 et A_1564 → A_1868 pour la 75. Aucun droit d’attendre au même quai.

- **AFTU → AFTU** · `survey:colobane:60:arrivee` → `survey:colobane:75:yeumbeul:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:colobane:60:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:colobane:60:arrivee.
  - Identifier et sourcer le quai de montée de survey:colobane:75:yeumbeul:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:colobane:75:yeumbeul:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/enquete-correspondances.md) · [2](../data/bus-review/exchange-call-comparison.json) · [3](https://aftu-senegal.org/map/dakar-urbain-ligne-60/) · [4](../src/data/bus-sheets/aftu-60-outbound.json) · [5](../src/data/bus-sheets/aftu-60-inbound.json) · [6](../data/bus-review/within-bus-families.json) · [7](../data/bus-review/reference-archives.json) · [8](https://aftu-senegal.org/map/dakar-urbain-ligne-75/) · [9](../src/data/weekly-cells/aftu-75-colobane.json) · [10](../src/data/weekly-cells/aftu-75-yeumbeul.json).

## colobane-aftu-60-ter

### Descendre : Gare De Colobane · 60 depuis Bargny, rang 48/48 → monter : Colobane

La première arrivée imprimée est 05:17 (04:20 de Bargny) ; ce n’est ni l’ouverture de la gare ni un départ de train. Identifier le quai de dépose, la sortie de la gare routière, le contrôle Nord ou Sud et la voie du TER dans le sens voulu. La fin historique A_1564 r46/46 n’est pas une porte.

- **AFTU → TER** · `survey:colobane:60:arrivee` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:colobane:60:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:colobane:60:arrivee.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Colobane → monter : Gare De Colobane · 60 vers Bargny, rang 1/50

04:40 est le premier départ de la grille de bus, pas l’arrivée du TER. La carte AFTU ne dessine que le départ vers Bargny ; relever la sortie du train et le passage public vers la bonne file. Ne pas utiliser les deux minutes de la DDD 18 ni la cadence TER pour dater cette paire.

- **TER → AFTU** · `ter-colobane` → `survey:colobane:60:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de survey:colobane:60:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:colobane:60:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/enquete-correspondances.md) · [2](../data/bus-review/exchange-call-comparison.json) · [3](https://aftu-senegal.org/map/dakar-urbain-ligne-60/) · [4](../src/data/bus-sheets/aftu-60-outbound.json) · [5](../src/data/bus-sheets/aftu-60-inbound.json) · [6](https://www.terdakar.sn/gare-de-colobane-nord-tout-ce-qu-il-faut-savoir/) · [7](https://www.terdakar.sn/gare-de-colobane-sud-tout-ce-qu-il-faut-savoir/) · [8](../docs/colobane-walking-transfer-audit-2026-11-16.md).

## colobane-tata-60-ter

### Descendre : Colobane · TATA 60 depuis Bargny → monter : Colobane

SETER nomme « Bus TATA : Gare de Colobane : 60 » au Nord et au Sud ; MoMove Dakar nomme Bargny → Colobane. Le dernier secteur après Patte d’Oie ne situe pas la dépose. Identifier côté, accès de gare et horaire du bus par appel ; pas de durée de marche fournie pour la 60.

- **TATA → TER** · `survey:colobane:tata60:arrivee` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:colobane:tata60:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:colobane:tata60:arrivee.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Colobane → monter : Colobane · TATA 60 vers Bargny

Colobane → Autoroute → Route Nationale est un ordre de repères. Le sens sortant du bus ne précise pas où monter après la sortie du train. Relever porte, traversées, contrôle, durée dans ce sens et les deux courses datées. Les 50/48 rangs de la provenance AFTU ne sont pas une grille TATA.

- **TER → TATA** · `ter-colobane` → `survey:colobane:tata60:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de survey:colobane:tata60:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:colobane:tata60:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://www.terdakar.sn/gare-de-colobane-nord-tout-ce-qu-il-faut-savoir/) · [2](https://www.terdakar.sn/gare-de-colobane-sud-tout-ce-qu-il-faut-savoir/) · [3](../docs/colobane-walking-transfer-audit-2026-11-16.md) · [4](https://momove.app/guide) · [5](https://www.covoiturage.sn/bus-tata-itineraire/ligne/60/colobane/bargny/) · [6](https://www.xibaaru.sn/bus-tata-voici-les-nouveaux-tarifs-document/).

## colobane-16b-ter

### Descendre : SCOA / Police Bel Air · 16B vers Palais 1 → monter : Colobane

DDD ordonne Place Bakou → SCOA → Police Bel Air → Bel Air (r11 à r14/27 de repères). SETER indique ESCOA / Police Bel-Air à six minutes à pied. Identifier la dépose précise de la 16B et la porte TER : aucune de ces deux appellations ne désigne une colonne de la grille à 83 appels vers Gare Palais.

- **DDD → TER** · `survey:colobane:16b:vers-palais` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:colobane:16b:vers-palais, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:colobane:16b:vers-palais.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Colobane → monter : ESCOA / Police Bel-Air · montée 16B vers Malika à localiser

La liste à 82 appels depuis Gare Palais ne nomme pas Police Bel Air. Ne pas retourner les r12/r13 de l’autre variante ni choisir un Arrêt De Bus anonyme. Confirmer le quai de descente du train, le côté de montée vers Malika, les traversées, le contrôle et la durée porte à porte.

- **TER → DDD** · `ter-colobane` → `survey:colobane:16b:vers-malika` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de survey:colobane:16b:vers-malika, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:colobane:16b:vers-malika.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://www.terdakar.sn/gare-de-colobane-nord-tout-ce-qu-il-faut-savoir/) · [2](https://www.terdakar.sn/gare-de-colobane-sud-tout-ce-qu-il-faut-savoir/) · [3](../docs/colobane-walking-transfer-audit-2026-11-16.md) · [4](https://demdikk.sn/reseau-urbain-dakar/) · [5](../src/data/weekly-cells/ddd-16B-outbound.json) · [6](../src/data/weekly-cells/ddd-16B-inbound.json).

## ouakam-7-42

### Descendre : Rue Okm 60, 67 · 7 depuis Palais, rang 29/29 → monter : Rue Okm 60, 67 · 42 depuis Ouakam, rang 3/68

Semaine : 7 depuis Palais à 05:23, r29 à 05:53 ; 42 depuis Stade Municipal à 06:05, r3 à 06:06. Ni côté de rue ni quai commun établis. Dans les archives, Boutique Diallo devant Shell (D_45) et en face (A_13) sont deux repères différents.

- **DDD → AFTU** · `survey:okm:7:fin` → `survey:okm:42:vers-gadaye` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:okm:7:fin, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:okm:7:fin.
  - Identifier et sourcer le quai de montée de survey:okm:42:vers-gadaye, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:okm:42:vers-gadaye.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Rue Okm 60, 67 · 42 vers Ouakam, rang 68/70 → monter : Rue Okm 60, 67 · 7 vers Gare Palais, rang 1/27

42 depuis 05:30, r68 à 06:20 ; la 7 commence aussi à 06:20. Même minute imprimée, pas une marge, ni une permission de rester. A_12 et D_48 sont des repères historiques de côtés différents. Relever séparément ce sens.

- **AFTU → DDD** · `survey:okm:42:vers-ouakam` → `survey:okm:7:vers-palais` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:okm:42:vers-ouakam, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:okm:42:vers-ouakam.
  - Identifier et sourcer le quai de montée de survey:okm:7:vers-palais, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:okm:7:vers-palais.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/enquete-correspondances.md) · [2](../data/bus-review/exchange-call-comparison.json) · [3](https://aftu-senegal.org/map/dakar-urbain-ligne-42/) · [4](../src/data/bus-sheets/aftu-42-outbound.json) · [5](../src/data/bus-sheets/aftu-42-inbound.json) · [6](../src/data/bus-sheets/ddd-7-outbound.json) · [7](../src/data/bus-sheets/ddd-7-inbound.json).

## dakar-ddd-16a-23

### Descendre : Gare De Dakar · 16A vers Malika, rang 10/64 → monter : Gare De Dakar · 23 vers les Parcelles, rang 10/56

Les deux services depuis Gare Palais citent Allees Delmas, 1 → Gare De Dakar → Avenue Faidherbe, 7. La fiche 37701983 du vendredi donne 16A à 05:22 puis 23 à 05:27. Même fiche, cinq minutes : ni attente autorisée au même point ni délai entre deux portes établis.

- **DDD → DDD** · `survey:dakar:16a:alight-malika` → `survey:dakar:23:board-parcelles` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:dakar:16a:alight-malika, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:dakar:16a:alight-malika.
  - Identifier et sourcer le quai de montée de survey:dakar:23:board-parcelles, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:dakar:23:board-parcelles.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Gare De Dakar · descente de la 23 vers les Parcelles → monter : Gare De Dakar · montée dans la 16A vers Malika

Pour changer de la 23 de 05:37 à la 16A de 05:39, vérifier le temps de descente et la position de la porte de montée. Cet ordre de changement utilise encore les deux bus sortant de Palais. Les deux grilles vers Palais ne nomment pas Gare De Dakar. Dans le ZIP de 2023 le r10/56 de la 23 était D_803, Crédit Mutuel, pas une preuve de quai à la gare.

- **DDD → DDD** · `survey:dakar:23:alight-parcelles` → `survey:dakar:16a:board-malika` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:dakar:23:alight-parcelles, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:dakar:23:alight-parcelles.
  - Identifier et sourcer le quai de montée de survey:dakar:16a:board-malika, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:dakar:16a:board-malika.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../data/bus-review/friday-stop-excerpts.json) · [2](https://moovitapp.com/index/fr/transport_en_commun-Gare_De_Dakar-Dakar-stop_37701983-5996) · [3](../data/bus-review/exchange-call-comparison.json) · [4](../src/data/weekly-cells/ddd-23-inbound.json) · [5](../src/data/weekly-cells/ddd-16A-inbound.json).

## dakar-ter-16a

### Descendre : Dakar → monter : Gare De Dakar · 16A vers Malika, rang 10/64

La grille donne 05:22 en semaine et 05:47 le week-end au premier bus. SETER indique une ouverture de la gare à 06:00 le week-end ; le 05:47 ne peut servir de départ après cette ouverture. Localiser la sortie du quai, la traversée du parvis et la montée du bus. Le hall n’est pas le point d’arrêt Allées Delmas.

- **TER → DDD** · `ter-dakar` → `survey:dakar:16a:board-malika` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-dakar, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à ter-dakar.
  - Identifier et sourcer le quai de montée de survey:dakar:16a:board-malika, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:dakar:16a:board-malika.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Dépose de la 16A depuis Malika près du TER à identifier → monter : Dakar

Le tableau des 65 appels vers Palais ne nomme pas Gare De Dakar. Ne pas lui attribuer l’arrêt 37701983 ni retourner le rang 10. Mesurer le chemin de la véritable dépose à la porte, au contrôle puis au quai de départ pour une course TER datée.

- **DDD → TER** · `survey:dakar:16a:alight-palais` → `ter-dakar` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:dakar:16a:alight-palais, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:dakar:16a:alight-palais.
  - Identifier et sourcer le quai de montée de ter-dakar, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://www.terdakar.sn/gare-de-dakar-tout-ce-qu-il-faut-savoir/) · [2](https://moovitapp.com/index/fr/transport_en_commun-Gare_De_Dakar-Dakar-stop_37701983-5996) · [3](../src/data/weekly-cells/ddd-16A-outbound.json) · [4](../src/data/weekly-cells/ddd-16A-inbound.json).

## pikine-16a-65

### Descendre : Route De Rufisque, 7432 · 16A vers Palais, rang 33/65 → monter : Route De Rufisque, 7432 · 65 vers Colobane, rang 38/56

Après Sips, la fiche 37702867 du vendredi donne 16A 05:28, 65 05:32. Quatre minutes entre cellules. Confirmer que les deux portes ouvrent du même côté et au même point, les droits de descendre puis monter et le délai minimal ; aucune course datée admise.

- **DDD → AFTU** · `survey:pikine:16a:palais` → `survey:pikine:65:colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:pikine:16a:palais, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:pikine:16a:palais.
  - Identifier et sourcer le quai de montée de survey:pikine:65:colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:pikine:65:colobane.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Route De Rufisque, 7432 · 65 vers Jaxaay, rang 18/57 → monter : Route De Rufisque, 7432 · 16A vers Malika, rang 34/64

Avant Sips cette fois : à 05:45 pour la 65 issue de 05:27, à 05:48 pour la 16A issue de 05:15. Ne pas réutiliser la fiche d’arrêt du sens vers Colobane. Relever le côté et la position des portes ou une traversée autorisée dans ce sens, et son temps.

- **AFTU → DDD** · `survey:pikine:65:jaxaay` → `survey:pikine:16a:malika` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:pikine:65:jaxaay, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:pikine:65:jaxaay.
  - Identifier et sourcer le quai de montée de survey:pikine:16a:malika, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:pikine:16a:malika.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../data/bus-review/friday-stop-excerpts.json) · [2](https://moovitapp.com/index/fr/transport_en_commun-Route_De_Rufisque_7432-Dakar-stop_37702867-5996) · [3](../src/data/weekly-cells/ddd-16A-outbound.json) · [4](../src/data/weekly-cells/ddd-16A-inbound.json) · [5](../src/data/weekly-cells/aftu-65-colobane.json) · [6](../src/data/weekly-cells/aftu-65-jaxaay.json).

## rufisque-66-ter

### Descendre : Gare De Rufisque · 66 vers Gorom, rang 44/77 → monter : Rufisque

La 66 de 04:50 passe à Gare Routiere De Rufisque r41 à 05:40 puis à Gare De Rufisque r44 à 05:43. La fiche 37703748 cite la 66 vers Gorom, pas une arrivée sur le quai du train. Identifier trottoir de dépose, accès ferroviaire, traversées autorisées et contrôle.

- **AFTU → TER** · `survey:rufisque:66:gorom` → `ter-rufisque` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:rufisque:66:gorom, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:rufisque:66:gorom.
  - Identifier et sourcer le quai de montée de ter-rufisque, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Rufisque → monter : Gare De Rufisque · 66 vers Yoff, rang 34/77

La 66 de 04:45 passe à 05:20 au r34. La fiche 37703749 vers Yoff renvoie à un autre arrêt homonyme, 37703748. Les 17 mètres annoncés entre points ne sont pas le trajet du quai TER à la porte du bus. Ni PNR, ni gare maritime, ni centre de la gare routière ne remplace ces portes.

- **TER → AFTU** · `ter-rufisque` → `survey:rufisque:66:yoff` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-rufisque, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de survey:rufisque:66:yoff, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:rufisque:66:yoff.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/audit-geographique-rufisque-bargny-keur-massar-sangalkam-2026-11-16.md) · [2](../data/bus-review/friday-stop-excerpts.json) · [3](https://moovitapp.com/index/fr/transport_en_commun-Gare_De_Rufisque-Dakar-stop_37703748-5996) · [4](https://moovitapp.com/index/fr/transport_en_commun-Gare_De_Rufisque-Dakar-stop_37703749-5996) · [5](../src/data/weekly-cells/aftu-66-outbound.json) · [6](../src/data/weekly-cells/aftu-66-inbound.json).

## petersen-tata-55-brt

### Descendre : Petersen · dépose TATA 55 depuis Rufisque SONADIS → monter : Petersen – Papa Gueye Fall

Rond-point Petersen est cité par SETER pour la 55. Les Allées Papa Gueye Fall précèdent Petersen dans la description depuis SONADIS. Ni cette suite ni le mot « rond-point » ne localisent la dépose pour rejoindre le valideur et le départ du B1. Relever la porte et une course TATA datée.

- **TATA → BRT** · `survey:petersen:55:alight` → `brt-petersen` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:petersen:55:alight, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:petersen:55:alight.
  - Identifier et sourcer le quai de montée de brt-petersen, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Petersen – Papa Gueye Fall → monter : Petersen · montée TATA 55 vers Rufisque à identifier

Depuis le quai B1 d’arrivée, relever sortie, traversées et file TATA vers Rufisque, puis la durée de cette marche. SETER ne donne ni sens, ni minute de départ ni temps de marche pour la 55. Ne pas réutiliser le chemin de la R01A, ni un arrêt AFTU 55.

- **BRT → TATA** · `brt-petersen` → `survey:petersen:55:board` · `BLOCKED_BEFORE_TIMETABLE`.
  - Déjà identifié (descente) : brt-petersen-quai-arrivee, Préfecture de Guédiawaye → Petersen · © OpenStreetMap · B1 19961937 v4 · stop 13376764678 / platform 13376766987.
  - Identifier et sourcer le quai de montée de survey:petersen:55:board, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:petersen:55:board.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/audit-pole-petersen-acces-correspondances-2026-11-16.md) · [2](../data/bus-sections/acces-scat-urbam.md) · [3](https://www.terdakar.sn/gare-de-colobane-nord-tout-ce-qu-il-faut-savoir/) · [4](https://www.terdakar.sn/gare-de-colobane-sud-tout-ce-qu-il-faut-savoir/) · [5](../docs/colobane-walking-transfer-audit-2026-11-16.md) · [6](../src/data/tataNamedStops.json) · [7](https://www.covoiturage.sn/bus-tata-itineraire/ligne/55/terminus-rufisque-sonadis/petersen/).

## dakar-12-ter

### Descendre : Gare De Dakar · 12 depuis Gare Palais, rang 10/67 → monter : Dakar

19:53 à Gare Palais, 20:01 à la cellule Gare De Dakar. Le hall et le guichet place du Tirailleur ne localisent ni la descente du bus ni la montée dans le train. Relever porte, traversée du parvis, contrôle des titres, voie et délai.

- **DDD → TER** · `survey:gare:12:depuis-palais` → `ter-dakar` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:gare:12:depuis-palais, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:gare:12:depuis-palais.
  - Identifier et sourcer le quai de montée de ter-dakar, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Dakar → monter : Gare de Dakar · montée à localiser, 12 vers Palais

La feuille des 63 appels vers Palais ne nomme pas Gare De Dakar. Ne pas inverser le rang 10/67, ni utiliser Avenue Faidherbe comme porte. Il manque la descente du train dans ce sens, sa sortie et le vrai point de montée de la 12.

- **TER → DDD** · `ter-dakar` → `survey:gare:12:vers-palais` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-dakar, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à ter-dakar.
  - Identifier et sourcer le quai de montée de survey:gare:12:vers-palais, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:gare:12:vers-palais.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/enquete-correspondances.md) · [2](https://www.terdakar.sn/gare-de-dakar-tout-ce-qu-il-faut-savoir/) · [3](../src/data/ddd12DirectionSheets.ts) · [4](../src/data/weekly-cells/ddd-12-guediawaye.json).

## colobane-18-ter

### Descendre : Colobane après CSS · descente sur le circuit 18 → monter : Colobane

Les deux fiches TER Nord et Sud disent « en face de la gare (2 minutes à pied) : 18 ». Elles ne distinguent pas la porte desservie, le sens de marche, le contrôle ni la voie. Aucun chrono porte bus → quai train.

- **DDD → TER** · `survey:colobane:18:descente` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:colobane:18:descente, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:colobane:18:descente.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Colobane → monter : Colobane avant Service des mines · montée sur le circuit 18

Localiser la sortie du quai TER et le côté à rejoindre pour monter vers Service des mines, sans retourner le circuit Dieuppeul. D_700 Terrain Colobane r14/43 dans l’archive ne désigne pas la porte. Les deux fiches de gare donnent le même texte.

- **TER → DDD** · `ter-colobane` → `survey:colobane:18:montee` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de survey:colobane:18:montee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:colobane:18:montee.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/enquete-correspondances.md) · [2](../data/bus-review/exchange-call-comparison.json) · [3](https://www.terdakar.sn/gare-de-colobane-nord-tout-ce-qu-il-faut-savoir/) · [4](https://www.terdakar.sn/gare-de-colobane-sud-tout-ce-qu-il-faut-savoir/) · [5](https://demdikk.sn/reseau-urbain-dakar/).

## ouakam-67-7

### Descendre : Boutique Diallo · descente de la 67 depuis Thiawlène → monter : Arrêt Pharmacie · montée dans la 7 vers Palais

Le poteau 4363242525 est le huitième quai de la relation 7500475 vers Palais 1. La 67 approche en sens opposé et sa fin marquée est à 1,7 m du poteau. Ni le dessin ni la grille Espi → Poste de Santé ne prouvent une descente au même point.

- **AFTU → DDD** · `survey:ouakam:67:arrivee` → `survey:ouakam:7:palais` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:ouakam:67:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:ouakam:67:arrivee.
  - Identifier et sourcer le quai de montée de survey:ouakam:7:palais, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:ouakam:7:palais.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Ouakam · descente de la 7 depuis Palais → monter : Ouakam · montée dans la 67 vers Thiawlène

Le rôle de la 7 vers Palais ne vaut pas pour la 7 depuis Palais. Le retour de la 67 n’est pas dessiné ; ne pas retourner le marqueur de fin ni la marche.

- **DDD → AFTU** · `survey:ouakam:7:ouakam` → `survey:ouakam:67:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:ouakam:7:ouakam, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:ouakam:7:ouakam.
  - Identifier et sourcer le quai de montée de survey:ouakam:67:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:ouakam:67:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/terminus-correspondances.md) · [2](../data/bus-review/terminal-occurrences.json) · [3](../data/bus-review/terminus-quays-2026-11-19.json) · [4](https://www.openstreetmap.org/relation/7500475) · [5](https://aftu-senegal.org/map/dakar-urbain-ligne-67/) · [6](https://demdikk.sn/reseau-urbain-dakar/).

## guediawaye-26-5

### Descendre : Guédiawaye · descente de la 26 depuis les Parcelles → monter : Guédiawaye · montée dans la 5 vers Palais

Fin marquée de la 26 à 2,5 m du poteau L5;L12. L’ancien D_406 était le troisième appel de la 5 depuis Guédiawaye, pas le terminus. La grille de la 26 finit à Thiaroye.

- **AFTU → DDD** · `survey:guediawaye:26:arrivee` → `survey:guediawaye:5:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:guediawaye:26:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:guediawaye:26:arrivee.
  - Identifier et sourcer le quai de montée de survey:guediawaye:5:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:guediawaye:5:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Guédiawaye · descente de la 5 depuis Palais → monter : Guédiawaye · départ à vérifier de la 26 vers les Parcelles

Le dessin de la 26 ne montre pas ce départ ; sa grille depuis Thiaroye ne le situe pas à Guédiawaye. Identifier séparément la descente de la 5 depuis Palais.

- **DDD → AFTU** · `survey:guediawaye:5:arrivee` → `survey:guediawaye:26:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:guediawaye:5:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:guediawaye:5:arrivee.
  - Identifier et sourcer le quai de montée de survey:guediawaye:26:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:guediawaye:26:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/terminus-correspondances.md) · [2](../data/bus-review/terminal-occurrences.json) · [3](../data/bus-review/terminus-quays-2026-11-19.json) · [4](https://www.openstreetmap.org/node/5038866775) · [5](https://aftu-senegal.org/map/dakar-urbain-ligne-26/) · [6](https://demdikk.sn/reseau-urbain-dakar/).

## patte-doie-ddd-tata

### Descendre : Patte d’Oie · 218 depuis Thiaroye vers Aéroport LSS, à confirmer → monter : Patte d’Oie · 60 depuis Bargny vers Colobane, à confirmer

23,7 m sur le chemin 639363334 entre les poteaux DDD et TATA dans chaque sens. Ni numéro ni rôle de ligne sur les poteaux. L’arrêt historique AFTU 60 est même plus proche du poteau DDD ; il ne localise pas la montée TATA. Aucun départ du jour attribué.

- **DDD → TATA** · `survey:patte-doie:218:lss` → `survey:patte-doie:60:colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:patte-doie:218:lss, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:patte-doie:218:lss.
  - Identifier et sourcer le quai de montée de survey:patte-doie:60:colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:patte-doie:60:colobane.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Patte d’Oie · 60 depuis Bargny vers Colobane, à confirmer → monter : Patte d’Oie · 218 depuis Thiaroye vers Aéroport LSS, à confirmer

23,7 m sur le chemin 639363334 entre les poteaux DDD et TATA dans chaque sens. Ni numéro ni rôle de ligne sur les poteaux. L’arrêt historique AFTU 60 est même plus proche du poteau DDD ; il ne localise pas la montée TATA. Aucun départ du jour attribué.

- **TATA → DDD** · `survey:patte-doie:60:colobane` → `survey:patte-doie:218:lss` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:patte-doie:60:colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:patte-doie:60:colobane.
  - Identifier et sourcer le quai de montée de survey:patte-doie:218:lss, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:patte-doie:218:lss.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/patte-doie.md) · [2](../data/bus-review/interchange-region-2026-11-19.json) · [3](../data/bus-review/patte-doie-occurrences.json) · [4](https://www.openstreetmap.org/way/639363334) · [5](https://demdikk.sn/reseau-urbain-dakar/) · [6](https://www.covoiturage.sn/bus-tata-itineraire/ligne/60/colobane/bargny/).

## gt54-18-39

### Descendre : Rue GT-54 · 18 sur le circuit par le lycée Delafosse → monter : Rue GT-54 · 39 depuis Lat Dior vers Diamalaye

Poteau 2175197258 et appels réguliers dans les deux archives, du même côté vers GT-73. Le retour de la 39 n’y est pas. Ni droits du jour ni prochaine montée atteignable établis.

- **DDD → AFTU** · `survey:gt54:18:delafosse` → `survey:gt54:39:diamalaye` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:gt54:18:delafosse, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:gt54:18:delafosse.
  - Identifier et sourcer le quai de montée de survey:gt54:39:diamalaye, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:gt54:39:diamalaye.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Rue GT-54 · 39 depuis Lat Dior vers Diamalaye → monter : Rue GT-54 · 18 sur le circuit par le lycée Delafosse

Poteau 2175197258 et appels réguliers dans les deux archives, du même côté vers GT-73. Le retour de la 39 n’y est pas. Ni droits du jour ni prochaine montée atteignable établis.

- **AFTU → DDD** · `survey:gt54:39:diamalaye` → `survey:gt54:18:delafosse` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:gt54:39:diamalaye, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:gt54:39:diamalaye.
  - Identifier et sourcer le quai de montée de survey:gt54:18:delafosse, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:gt54:18:delafosse.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/validation-physique.md) · [2](https://www.openstreetmap.org/node/2175197258) · [3](https://demdikk.sn/reseau-urbain-dakar/) · [4](https://aftu-senegal.org/map/dakar-urbain-ligne-39/).

## maristes-12-75

### Descendre : Fiche 37702688 · 12 vers Gare Palais → monter : Fiche 37702688 · 75 vers Colobane

Les deux fiches de sens et les heures à l’appel 37 ne prouvent pas un même point d’attente. Aucune distance réelle ni traversée établie entre ces deux appels.

- **DDD → AFTU** · `survey:maristes:12:palais` → `survey:maristes:75:colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:maristes:12:palais, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:maristes:12:palais.
  - Identifier et sourcer le quai de montée de survey:maristes:75:colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:maristes:75:colobane.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Fiche 37702688 · 75 vers Colobane → monter : Fiche 37702688 · 12 vers Gare Palais

Les deux fiches de sens et les heures à l’appel 37 ne prouvent pas un même point d’attente. Aucune distance réelle ni traversée établie entre ces deux appels.

- **AFTU → DDD** · `survey:maristes:75:colobane` → `survey:maristes:12:palais` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:maristes:75:colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:maristes:75:colobane.
  - Identifier et sourcer le quai de montée de survey:maristes:12:palais, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:maristes:12:palais.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/validation-physique.md) · [2](../docs/trajets-bus-medina-maristes.md) · [3](https://moovitapp.com/index/fr/transport_en_commun-Route_Des_Maristes_141-Dakar-stop_37702688-5996).

## dakar-petersen

### Descendre : Dakar → monter : Petersen – Papa Gueye Fall

Le quai B1 de descente est identifié. Le quai de montée vers Guédiawaye est distinct et hors du seuil du point de référence. Les 1 km historiques ne décrivent pas un chemin entre gares.

- **TER → BRT** · `ter-dakar` → `brt-petersen` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-dakar, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à ter-dakar.
  - Identifier et sourcer le quai de montée de brt-petersen, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Petersen – Papa Gueye Fall → monter : Dakar

Le quai B1 de descente est identifié. Le quai de montée vers Guédiawaye est distinct et hors du seuil du point de référence. Les 1 km historiques ne décrivent pas un chemin entre gares.

- **BRT → TER** · `brt-petersen` → `ter-dakar` · `BLOCKED_BEFORE_TIMETABLE`.
  - Déjà identifié (descente) : brt-petersen-quai-arrivee, Préfecture de Guédiawaye → Petersen · © OpenStreetMap · B1 19961937 v4 · stop 13376764678 / platform 13376766987.
  - Identifier et sourcer le quai de montée de ter-dakar, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/audit-connexions-graphe-multimodal-2026-11-18.md) · [2](../docs/audit-pole-petersen-acces-correspondances-2026-11-16.md) · [3](../data/bus-sections/acces-scat-urbam.md).

## colobane-place-nation

### Descendre : Colobane → monter : Place de la Nation

Les 1,4 km historiques ne constituent pas une mesure sur des voies piétonnes identifiées.

- **TER → BRT** · `ter-colobane` → `brt-place-nation` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de brt-place-nation, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Place de la Nation → monter : Colobane

Les 1,4 km historiques ne constituent pas une mesure sur des voies piétonnes identifiées.

- **BRT → TER** · `brt-place-nation` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de brt-place-nation, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/audit-connexions-graphe-multimodal-2026-11-18.md) · [2](https://www.openstreetmap.org/node/10245681535).

## petersen-brt-ddd

### Descendre : Petersen – Papa Gueye Fall → monter : Petersen

SunuBRT indique la R01A au pôle en face pour le centre-ville. Le chemin 1458575519 atteint un passage zébré, pas un point de montée R01A. Relever les portes, le quai et le départ de ce sens. Ne pas lui attribuer la desserte des 13 ou 121.

- **BRT → DDD** · `brt-petersen` → `ddd-petersen` · `BLOCKED_BEFORE_TIMETABLE`.
  - Déjà identifié (descente) : brt-petersen-quai-arrivee, Préfecture de Guédiawaye → Petersen · © OpenStreetMap · B1 19961937 v4 · stop 13376764678 / platform 13376766987.
  - Identifier et sourcer le quai de montée de ddd-petersen, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à ddd-petersen.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Petersen → monter : Petersen – Papa Gueye Fall

Confirmer la dépose de la R01A depuis le centre-ville et sa sortie. Le zébra ne désigne pas la porte de dépose. Relever le chemin autorisé jusqu’au valideur et au quai de départ B1 vers Guédiawaye ; le quai B1 d’arrivée ne prouve pas ce rôle.

- **DDD → BRT** · `ddd-petersen` → `brt-petersen` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ddd-petersen, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à ddd-petersen.
  - Identifier et sourcer le quai de montée de brt-petersen, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/audit-pole-petersen-acces-correspondances-2026-11-16.md) · [2](../data/bus-sections/acces-scat-urbam.md) · [3](https://cetud.sn/wp-content/uploads/2025/09/plan-dengagement-des-parties-prenantes-du-BRT-mis-a-jour.pdf) · [4](https://demdikk.sn/reseau-urbain-dakar/) · [5](https://www.sunubrt.sn/) · [6](https://www.openstreetmap.org/way/1458575519).

## petersen-brt-aftu

### Descendre : Petersen – Papa Gueye Fall → monter : Petersen

AFTU 4, 25, 29 notamment : vérifier le quai de la ligne et du sens retenus, puis suivre la marche interne jusqu’au BRT.

- **BRT → AFTU** · `brt-petersen` → `aftu-petersen` · `BLOCKED_BEFORE_TIMETABLE`.
  - Déjà identifié (descente) : brt-petersen-quai-arrivee, Préfecture de Guédiawaye → Petersen · © OpenStreetMap · B1 19961937 v4 · stop 13376764678 / platform 13376766987.
  - Identifier et sourcer le quai de montée de aftu-petersen, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à aftu-petersen.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Petersen → monter : Petersen – Papa Gueye Fall

AFTU 4, 25, 29 notamment : vérifier le quai de la ligne et du sens retenus, puis suivre la marche interne jusqu’au BRT.

- **AFTU → BRT** · `aftu-petersen` → `brt-petersen` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de aftu-petersen, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à aftu-petersen.
  - Identifier et sourcer le quai de montée de brt-petersen, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/audit-pole-petersen-acces-correspondances-2026-11-16.md) · [2](../data/bus-sections/acces-scat-urbam.md) · [3](https://cetud.sn/wp-content/uploads/2025/09/plan-dengagement-des-parties-prenantes-du-BRT-mis-a-jour.pdf) · [4](https://aftu-senegal.org/infos-pratiques/).

## petersen-ddd-aftu

### Descendre : Petersen → monter : Petersen

Le même point de catalogue ne prouve pas un quai commun ou une marche nulle.

- **DDD → AFTU** · `ddd-petersen` → `aftu-petersen` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ddd-petersen, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à ddd-petersen.
  - Identifier et sourcer le quai de montée de aftu-petersen, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à aftu-petersen.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Petersen → monter : Petersen

Le même point de catalogue ne prouve pas un quai commun ou une marche nulle.

- **AFTU → DDD** · `aftu-petersen` → `ddd-petersen` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de aftu-petersen, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à aftu-petersen.
  - Identifier et sourcer le quai de montée de ddd-petersen, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à ddd-petersen.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/audit-connexions-graphe-multimodal-2026-11-18.md) · [2](../docs/audit-pole-petersen-acces-correspondances-2026-11-16.md).

## guediawaye-brt-ddd

### Descendre : Préfecture de Guédiawaye → monter : Guédiawaye

Le passage zébré 13376903816 traverse la boucle de bus mais ne rejoint pas le poteau 6440488778. Relever le chemin quai à quai et les points de montée/descente DDD 5 ou 12 dans chaque sens.

- **BRT → DDD** · `brt-prefecture-guediawaye` → `ddd-guediawaye` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de brt-prefecture-guediawaye, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à brt-prefecture-guediawaye.
  - Identifier et sourcer le quai de montée de ddd-guediawaye, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à ddd-guediawaye.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

### Descendre : Guédiawaye → monter : Préfecture de Guédiawaye

Le passage zébré 13376903816 traverse la boucle de bus mais ne rejoint pas le poteau 6440488778. Relever le chemin quai à quai et les points de montée/descente DDD 5 ou 12 dans chaque sens.

- **DDD → BRT** · `ddd-guediawaye` → `brt-prefecture-guediawaye` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ddd-guediawaye, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à ddd-guediawaye.
  - Identifier et sourcer le quai de montée de brt-prefecture-guediawaye, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.

Sources : [1](../docs/audit-poles-correspondance-2026-11-16.md) · [2](https://cetud.sn/wp-content/uploads/2025/09/plan-dengagement-des-parties-prenantes-du-BRT-mis-a-jour.pdf) · [3](https://www.openstreetmap.org/node/6440488778) · [4](https://www.openstreetmap.org/way/1458592779).

## colobane-ter-ddd

### Descendre : Colobane → monter : Colobane

Le polygone OSM représente la gare routière ; son point représentatif n’est pas le quai DDD.

- **TER → DDD** · `ter-colobane` → `ddd-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de ddd-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à ddd-colobane.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Colobane → monter : Colobane

Le polygone OSM représente la gare routière ; son point représentatif n’est pas le quai DDD.

- **DDD → TER** · `ddd-colobane` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ddd-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à ddd-colobane.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/colobane-walking-transfer-audit-2026-11-16.md) · [2](https://www.openstreetmap.org/node/10245681535) · [3](https://www.openstreetmap.org/way/599927187).

## colobane-ter-aftu

### Descendre : Colobane → monter : Gare De Colobane · 30 vers Guédiawaye, rang 1/74

La 30 part à 05:20 puis 05:35, avant Rue Hlm 225, 23. Confirmer la sortie du train, le contrôle et la file de montée pour Gadaye. A_1564 → A_1394 appartient à une ancienne liste de 68 appels ; les 6 minutes de SETER pour le rond-point DDD ne concernent pas ce départ.

- **TER → AFTU** · `ter-colobane` → `survey:colobane:30:depart` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de survey:colobane:30:depart, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à survey:colobane:30:depart.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Gare De Colobane · 30 depuis Guédiawaye, rang 77/77 → monter : Colobane

05:15 → 06:01, après Av. Mbacké / Rue 231. A_1869 → A_1564 terminait une ancienne liste de 67 appels. Aucune correspondance établie entre la dépose et une porte TER Nord ou Sud. Les fiches 30 et 33 confirment le terminus, pas les quais ni les accès ; ne pas attribuer les heures de la 30 à la 33.

- **AFTU → TER** · `survey:colobane:30:arrivee` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de survey:colobane:30:arrivee, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à survey:colobane:30:arrivee.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://www.terdakar.sn/gare-de-colobane-nord-tout-ce-qu-il-faut-savoir/) · [2](https://www.terdakar.sn/gare-de-colobane-sud-tout-ce-qu-il-faut-savoir/) · [3](../docs/colobane-walking-transfer-audit-2026-11-16.md) · [4](https://www.openstreetmap.org/node/10245681535) · [5](../data/bus-review/exchange-call-comparison.json) · [6](../src/data/weekly-cells/aftu-30-outbound.json) · [7](../src/data/weekly-cells/aftu-30-inbound.json) · [8](https://aftu-senegal.org/map/dakar-urbain-ligne-30/) · [9](https://aftu-senegal.org/map/dakar-urbain-ligne-33/).

## scat-brt-121

### Descendre : Scat Urbam → monter : Terminus Scat Urbam · DDD 121

Les accès depuis les deux îlots atteignent le quai central B1. Ils ne mènent pas au terminus 121. Le texte DDD ne donne ni son quai par sens, ni ses départs depuis ce point.

- **BRT → DDD** · `brt-scat-urbam` → `sheet:ddd-121-scat` · `BLOCKED_BEFORE_TIMETABLE`.
  - Déjà identifié (descente) : brt-scat-quai-central, Préfecture de Guédiawaye → Petersen · © OpenStreetMap · B1 19961937 v4 · stop 11738664176 / platform 11739915373 v2 · © OpenStreetMap · Scat Urbam · stop_area 17357331 v4 · quai 11739915373 v2 repéré sur 1458592675 v3.
  - Identifier et sourcer le quai de montée de sheet:ddd-121-scat, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:ddd-121-scat.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.
- **BRT → DDD** · `brt-scat-urbam` → `sheet:ddd-121-scat` · `BLOCKED_BEFORE_TIMETABLE`.
  - Déjà identifié (descente) : brt-scat-quai-central, Vers Guédiawaye · portion Petersen → Gueule Tapée · © OpenStreetMap · B1 19961993 v3 · stop 11739915374 / platform 11739915373 v2 · © OpenStreetMap · Scat Urbam · stop_area 17357331 v4 · quai 11739915373 v2 repéré sur 1458592675 v3.
  - Identifier et sourcer le quai de montée de sheet:ddd-121-scat, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:ddd-121-scat.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Terminus Scat Urbam · DDD 121 → monter : Scat Urbam

Les accès depuis les deux îlots atteignent le quai central B1. Ils ne mènent pas au terminus 121. Le texte DDD ne donne ni son quai par sens, ni ses départs depuis ce point.

- **DDD → BRT** · `sheet:ddd-121-scat` → `brt-scat-urbam` · `BLOCKED_BEFORE_TIMETABLE`.
  - Déjà identifié (montée) : brt-scat-quai-central, Préfecture de Guédiawaye → Petersen · © OpenStreetMap · B1 19961937 v4 · stop 11738664176 / platform 11739915373 v2 · © OpenStreetMap · Scat Urbam · stop_area 17357331 v4 · quai 11739915373 v2 repéré sur 1458592675 v3.
  - Identifier et sourcer le quai de descente de sheet:ddd-121-scat, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:ddd-121-scat.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.
- **DDD → BRT** · `sheet:ddd-121-scat` → `brt-scat-urbam` · `BLOCKED_BEFORE_TIMETABLE`.
  - Déjà identifié (montée) : brt-scat-quai-central, Vers Guédiawaye · portion Petersen → Gueule Tapée · © OpenStreetMap · B1 19961993 v3 · stop 11739915374 / platform 11739915373 v2 · © OpenStreetMap · Scat Urbam · stop_area 17357331 v4 · quai 11739915373 v2 repéré sur 1458592675 v3.
  - Identifier et sourcer le quai de descente de sheet:ddd-121-scat, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:ddd-121-scat.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../data/bus-sections/acces-scat-urbam.md) · [2](https://demdikk.sn/reseau-urbain-dakar/).

## bargny-ter-74

### Descendre : Bargny → monter : Bargny gare ferroviaire · AFTU 74

Deux quais TER (1016285873/874) dans la station. Affectation au train à confirmer. La fiche 74 cite Bargny gare ; le quai routier et les accès manquent. Ne pas utiliser les horaires Rufisque–Tivaouane Peul.

- **TER → AFTU** · `ter-bargny` → `sheet:aftu-74-bargny` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-bargny, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de sheet:aftu-74-bargny, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:aftu-74-bargny.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Bargny gare ferroviaire · AFTU 74 → monter : Bargny

Deux quais TER (1016285873/874) dans la station. Affectation au train à confirmer. La fiche 74 cite Bargny gare ; le quai routier et les accès manquent. Ne pas utiliser les horaires Rufisque–Tivaouane Peul.

- **AFTU → TER** · `sheet:aftu-74-bargny` → `ter-bargny` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de sheet:aftu-74-bargny, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:aftu-74-bargny.
  - Identifier et sourcer le quai de montée de ter-bargny, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/audit-geographique-rufisque-bargny-keur-massar-sangalkam-2026-11-16.md) · [2](https://api.openstreetmap.org/api/0.6/relation/13607602/2.json) · [3](https://aftu-senegal.org/map/dakar-urbain-ligne-74/).

## pnr-ddd-rufisque

### Descendre : PNR → monter : Rufisque

PNR possède deux quais TER (1016285877/878). L’emprise de gare routière 178908478 n’est ni la gare TER Rufisque ni le point de montée DDD 213. Vérifier d’abord quelle gare désigne le bus.

- **TER → DDD** · `ter-pnr` → `ddd-rufisque` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-pnr, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de ddd-rufisque, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à ddd-rufisque.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Rufisque → monter : PNR

PNR possède deux quais TER (1016285877/878). L’emprise de gare routière 178908478 n’est ni la gare TER Rufisque ni le point de montée DDD 213. Vérifier d’abord quelle gare désigne le bus.

- **DDD → TER** · `ddd-rufisque` → `ter-pnr` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ddd-rufisque, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à ddd-rufisque.
  - Identifier et sourcer le quai de montée de ter-pnr, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/audit-geographique-rufisque-bargny-keur-massar-sangalkam-2026-11-16.md) · [2](https://api.openstreetmap.org/api/0.6/relation/13607604/1.json) · [3](https://www.openstreetmap.org/way/178908478).

## rufisque-ter-83

### Descendre : Rufisque → monter : Rufisque

La fiche de la 83 cite le secteur de Sonadis, pas le quai de la gare TER. Identifier les occurrences et les côtés de chaussée. Ne pas rattacher cet arrêt à PNR.

- **TER → AFTU** · `ter-rufisque` → `aftu-rufisque` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-rufisque, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de aftu-rufisque, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à aftu-rufisque.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Rufisque → monter : Rufisque

La fiche de la 83 cite le secteur de Sonadis, pas le quai de la gare TER. Identifier les occurrences et les côtés de chaussée. Ne pas rattacher cet arrêt à PNR.

- **AFTU → TER** · `aftu-rufisque` → `ter-rufisque` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de aftu-rufisque, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à aftu-rufisque.
  - Identifier et sourcer le quai de montée de ter-rufisque, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/audit-geographique-rufisque-bargny-keur-massar-sangalkam-2026-11-16.md) · [2](../src/data/aftu-83-directions.json).

## keur-massar-ddd-tata

### Descendre : Keur Massar → monter : Keur Massar

Distinguer le terminus TATA 52, la gare routière et la mention « Terminus Keur Massar » de la 74. Une commune ou le libellé « Station » ne désigne pas le quai où changer.

- **DDD → TATA** · `ddd-keur-massar` → `tata-keur-massar` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ddd-keur-massar, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à ddd-keur-massar.
  - Identifier et sourcer le quai de montée de tata-keur-massar, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à tata-keur-massar.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Keur Massar → monter : Keur Massar

Distinguer le terminus TATA 52, la gare routière et la mention « Terminus Keur Massar » de la 74. Une commune ou le libellé « Station » ne désigne pas le quai où changer.

- **TATA → DDD** · `tata-keur-massar` → `ddd-keur-massar` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de tata-keur-massar, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à tata-keur-massar.
  - Identifier et sourcer le quai de montée de ddd-keur-massar, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à ddd-keur-massar.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/audit-geographique-rufisque-bargny-keur-massar-sangalkam-2026-11-16.md) · [2](https://www.openstreetmap.org/node/5286379847) · [3](https://aftu-senegal.org/map/dakar-urbain-ligne-74/).

## colobane-ter-tata

### Descendre : Colobane → monter : Colobane

La fiche TATA 33 et la fiche AFTU 33 ont des provenances distinctes. Aucune ne donne une marche entre quais, ni deux services à enchaîner.

- **TER → TATA** · `ter-colobane` → `tata-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de tata-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à tata-colobane.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Colobane → monter : Colobane

La fiche TATA 33 et la fiche AFTU 33 ont des provenances distinctes. Aucune ne donne une marche entre quais, ni deux services à enchaîner.

- **TATA → TER** · `tata-colobane` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de tata-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à tata-colobane.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../docs/colobane-walking-transfer-audit-2026-11-16.md) · [2](https://www.openstreetmap.org/way/599927187) · [3](https://www.covoiturage.sn/bus-tata-itineraire/ligne/33/colobane/serigne-assane/).

## dakar-ter-501

### Descendre : Dakar → monter : Desserte gare · DDD 501 (Palais 2)

Gare de Dakar, Port et Leclerc figurent dans des sources différentes. Ne pas déplacer le terminus au quai du TER.

- **TER → DDD** · `ter-dakar` → `sheet:ddd-501-dakar` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-dakar, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à ter-dakar.
  - Identifier et sourcer le quai de montée de sheet:ddd-501-dakar, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:ddd-501-dakar.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Desserte gare · DDD 501 (Palais 2) → monter : Dakar

Gare de Dakar, Port et Leclerc figurent dans des sources différentes. Ne pas déplacer le terminus au quai du TER.

- **DDD → TER** · `sheet:ddd-501-dakar` → `ter-dakar` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de sheet:ddd-501-dakar, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:ddd-501-dakar.
  - Identifier et sourcer le quai de montée de ter-dakar, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://demdikk.sn/info-voyageurs/) · [2](https://demdikk.sn/reseau-urbain-dakar/) · [3](../docs/revue-bus-2026-11-19.md).

## colobane-ter-502a

### Descendre : Colobane → monter : Desserte gare · DDD 502A (UCAD)

La boucle 502 ne répartit pas ses arrêts par branche 502A/502B.

- **TER → DDD** · `ter-colobane` → `sheet:ddd-502a-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de sheet:ddd-502a-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:ddd-502a-colobane.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Desserte gare · DDD 502A (UCAD) → monter : Colobane

La boucle 502 ne répartit pas ses arrêts par branche 502A/502B.

- **DDD → TER** · `sheet:ddd-502a-colobane` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de sheet:ddd-502a-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:ddd-502a-colobane.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://demdikk.sn/info-voyageurs/) · [2](https://demdikk.sn/reseau-urbain-dakar/) · [3](../docs/revue-bus-2026-11-19.md).

## colobane-ter-502b

### Descendre : Colobane → monter : Desserte gare · DDD 502B (Abass Ndao)

La boucle 502 ne répartit pas ses arrêts par branche 502A/502B.

- **TER → DDD** · `ter-colobane` → `sheet:ddd-502b-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de sheet:ddd-502b-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:ddd-502b-colobane.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Desserte gare · DDD 502B (Abass Ndao) → monter : Colobane

La boucle 502 ne répartit pas ses arrêts par branche 502A/502B.

- **DDD → TER** · `sheet:ddd-502b-colobane` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de sheet:ddd-502b-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:ddd-502b-colobane.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://demdikk.sn/info-voyageurs/) · [2](https://demdikk.sn/reseau-urbain-dakar/) · [3](../docs/revue-bus-2026-11-19.md).

## colobane-ter-503a

### Descendre : Colobane → monter : Desserte gare · DDD 503A (Môle 8)

La boucle 503 ne répartit pas ses arrêts par branche 503A/503B.

- **TER → DDD** · `ter-colobane` → `sheet:ddd-503a-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de sheet:ddd-503a-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:ddd-503a-colobane.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Desserte gare · DDD 503A (Môle 8) → monter : Colobane

La boucle 503 ne répartit pas ses arrêts par branche 503A/503B.

- **DDD → TER** · `sheet:ddd-503a-colobane` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de sheet:ddd-503a-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:ddd-503a-colobane.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://demdikk.sn/info-voyageurs/) · [2](https://demdikk.sn/reseau-urbain-dakar/) · [3](../docs/revue-bus-2026-11-19.md).

## colobane-ter-503b

### Descendre : Colobane → monter : Desserte gare · DDD 503B (Hydrocarbure)

La boucle 503 ne répartit pas ses arrêts par branche 503A/503B.

- **TER → DDD** · `ter-colobane` → `sheet:ddd-503b-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-colobane, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de sheet:ddd-503b-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:ddd-503b-colobane.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Desserte gare · DDD 503B (Hydrocarbure) → monter : Colobane

La boucle 503 ne répartit pas ses arrêts par branche 503A/503B.

- **DDD → TER** · `sheet:ddd-503b-colobane` → `ter-colobane` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de sheet:ddd-503b-colobane, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:ddd-503b-colobane.
  - Identifier et sourcer le quai de montée de ter-colobane, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://demdikk.sn/info-voyageurs/) · [2](https://demdikk.sn/reseau-urbain-dakar/) · [3](../docs/revue-bus-2026-11-19.md).

## diamniadio-ter-504a

### Descendre : Diamniadio → monter : Desserte gare · DDD 504A (Sphère ministérielle)

Terminus publiés, mais ni l’ordre intermédiaire ni le quai du bus par sens ne sont établis.

- **TER → DDD** · `ter-diamniadio` → `sheet:ddd-504a-diamniadio` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-diamniadio, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de sheet:ddd-504a-diamniadio, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:ddd-504a-diamniadio.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Desserte gare · DDD 504A (Sphère ministérielle) → monter : Diamniadio

Terminus publiés, mais ni l’ordre intermédiaire ni le quai du bus par sens ne sont établis.

- **DDD → TER** · `sheet:ddd-504a-diamniadio` → `ter-diamniadio` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de sheet:ddd-504a-diamniadio, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:ddd-504a-diamniadio.
  - Identifier et sourcer le quai de montée de ter-diamniadio, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à ter-diamniadio.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://demdikk.sn/info-voyageurs/) · [2](https://demdikk.sn/reseau-urbain-dakar/) · [3](../docs/revue-bus-2026-11-19.md).

## diamniadio-ter-504b

### Descendre : Diamniadio → monter : Desserte gare · DDD 504B (Sébikotane)

Ni le quai de la 504B ni le parcours jusqu’à la voie du train ne se déduisent de l’intitulé de gare.

- **TER → DDD** · `ter-diamniadio` → `sheet:ddd-504b-diamniadio` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-diamniadio, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de sheet:ddd-504b-diamniadio, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:ddd-504b-diamniadio.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Desserte gare · DDD 504B (Sébikotane) → monter : Diamniadio

Ni le quai de la 504B ni le parcours jusqu’à la voie du train ne se déduisent de l’intitulé de gare.

- **DDD → TER** · `sheet:ddd-504b-diamniadio` → `ter-diamniadio` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de sheet:ddd-504b-diamniadio, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:ddd-504b-diamniadio.
  - Identifier et sourcer le quai de montée de ter-diamniadio, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à ter-diamniadio.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](https://demdikk.sn/info-voyageurs/) · [2](https://demdikk.sn/reseau-urbain-dakar/) · [3](../docs/revue-bus-2026-11-19.md).

## bargny-ter-89

### Descendre : Bargny → monter : Poste Courant Bargny près de la gare TER · AFTU 89

Le repère de la 89 près de la gare ne désigne ni le terminus de la 74 ni le quai TER. Relever les deux côtés et les accès séparément.

- **TER → AFTU** · `ter-bargny` → `sheet:aftu-89-bargny` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de ter-bargny, pour la ligne et le sens concernés.
  - Identifier et sourcer le quai de montée de sheet:aftu-89-bargny, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la montée à sheet:aftu-89-bargny.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

### Descendre : Poste Courant Bargny près de la gare TER · AFTU 89 → monter : Bargny

Le repère de la 89 près de la gare ne désigne ni le terminus de la 74 ni le quai TER. Relever les deux côtés et les accès séparément.

- **AFTU → TER** · `sheet:aftu-89-bargny` → `ter-bargny` · `BLOCKED_BEFORE_TIMETABLE`.
  - Identifier et sourcer le quai de descente de sheet:aftu-89-bargny, pour la ligne et le sens concernés.
  - Valider une desserte orientée permettant la descente à sheet:aftu-89-bargny.
  - Identifier et sourcer le quai de montée de ter-bargny, pour la ligne et le sens concernés.
  - Fournir une revue datée et les identifiants ordonnés des voies publiques praticables, traversées et obstacles contrôlés, dans ce sens.
  - Relever la sortie du premier site et l’entrée du second ; le centre d’une gare ne remplace pas une porte.

Sources : [1](../src/data/aftu-89-directions.json) · [2](../docs/audit-geographique-rufisque-bargny-keur-massar-sangalkam-2026-11-16.md) · [3](../docs/revue-bus-2026-11-19.md).
