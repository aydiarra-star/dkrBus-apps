# AFTU 84–91 — contrôle croisé des artefacts existants

Date : 14 novembre 2026  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Commit audité : `e57db5c6901860f6840fc1a75191e4047edc3fae`

## Résultat synthétique

Les trois contrôles demandés ont été exécutés sur les artefacts AFTU, OSM et ArcGIS du commit audité. Ils ne permettent pas d'attribuer une séquence d'arrêts aux lignes 86, 87, 88, 89 ou 91. Les recoupements de terminus avec d'autres lignes sont des intersections/corridors communs possibles, pas une preuve de fusion ou de renumérotation.

Les lignes 84 et 85 disposent déjà de fichiers de parcours dans le dépôt, provenant de références transmises au projet ; elles ne doivent donc pas être effacées ni reclassées comme absentes.

## 1. Variantes de nommage et liens internes

Artefact AFTU : `aftu-official-route-pages.json`, run GitHub Actions `43561685704`, généré le 14 novembre 2026 à 05:28:56 UTC.

- L'index officiel traité par l'extracteur est `https://aftu-senegal.org/infos-pratiques/`.
- 63 liens de fiches ont été extraits de l'index ; les pages additionnelles 27 et 36 ont été ajoutées séparément.
- Les sept URL canoniques testées pour 84, 85, 86, 87, 88, 89 et 91 ont renvoyé HTTP 404.
- La liste des slugs effectivement récupérés ne contient ni variante 84A/84B, ni 84-bis, ni variante équivalente pour 85–89 ou 91.

**Limite à conserver :** l'artefact ne contient ni copie du sitemap XML, ni HTML brut de l'index. Le script de collecte extrait les liens internes `/map/dakar-urbain-ligne-…/`, mais ne télécharge pas les sitemaps. On ne peut donc pas affirmer qu'un sitemap a été exhaustivement contrôlé. Aucun slug alternatif vérifiable n'a été trouvé dans les données déjà récupérées.

## 2. Croisement inverse OSM / ArcGIS

### OpenStreetMap

Artefact : `dakar-osm-route-candidates.json`, run `43561685622`.

- 6 610 éléments OSM ont été examinés.
- Aucune relation de bus avec `ref=84`, `85`, `86`, `87`, `88`, `89` ou `91` n'est présente.
- La seule relation AFTU/Tata identifiée dans cet extrait est la relation 3982642, `ref=40`, `network=Tata`, `operator=Aftu`. Elle ne concerne pas les sept numéros recherchés.
- Quelques nœuds portent `network=AFTU` ou un nom générique d'arrêt Tata/AFTU, sans numéro de ligne exploitable. Ils ne peuvent pas être affectés aux lignes 84–91.

### ArcGIS

Artefact : `ddd-updated-service-candidates.json`, run `43561685593`.

- Le service extrait est explicitement un service DDD : `Dem_dikk_mise_a_jour`, avec 777 entités d'arrêts et 25 entités de lignes.
- Les valeurs `Nom_Ligne` des arrêts sont des références DDD (par exemple 1, 2, 6, 9, 12, 16A/16B, 217, 218, 232), pas un catalogue AFTU.
- Aucune ligne 84–89 ou 91 n'est identifiable dans les attributs de lignes DDD comme preuve d'un tracé AFTU correspondant.

**Conclusion du croisement :** aucun tracé/arrêt OSM numéroté 84–89 ou 91, ni couche ArcGIS AFTU correspondante, n'est présent dans les artefacts audités.

## 3. Recherche de fusion ou renumérotation dans les 65 fiches AFTU

Comparaison textuelle des terminus/corridors officiels indexés pour les sept lignes avec les textes d'itinéraire des 65 fiches récupérées.

| Ligne en attente | Corridor affiché par l'index AFTU | Recoupements textuels dans les 65 fiches | Interprétation |
|---|---|---|---|
| 84 | UCAD – Jaxaay | UCAD dans 38, 58, 62 ; Jaxaay dans 45, 51, 52, 56, 65, 70, 74 | Axes partagés ; aucune preuve de fusion |
| 85 | Banoba – Liberté 5 | Liberté 5 dans 77 et 78 ; Banoba non retrouvé | Aucun remplacement démontré |
| 86 | Tournalou Boune – Toubab Dialaw | Aucun des deux terminus retrouvé exactement | Aucun remplacement démontré |
| 87 | Bambilor – Mosquée Massalikou Djinane | Bambilor dans 66 ; Massalikou Djinane non retrouvé | Axe partagé possible ; aucune preuve de fusion |
| 88 | MTOA – Liberté 5 | MTOA dans 37, 54, 73, 76, 81 ; Liberté 5 dans 77 et 78 | Axes partagés ; aucune preuve de fusion |
| 89 | Bargny – Croisement Niague (Cité SICAP) | Bargny dans 53, 60, 64, 68, 74 ; Croisement Niague dans 53, 73, 79 | Axes partagés ; aucune preuve de fusion |
| 91 | APIX – Dougar | APIX dans 37 ; Dougar non retrouvé | Aucun remplacement démontré |

Ces correspondances sont des occurrences de noms de lieux dans des corridors, pas des correspondances complètes de terminus, d'arrêts, d'ordre, d'opérateur ou de service. Elles ne justifient aucune renumérotation ni substitution automatique. Les changements liés au rabattement BRT/TER ne sont pas démontrés par ces seuls artefacts.

## 4. État des données dans le dépôt

- **Ligne 84 :** `src/data/aftu-84-directions.json` existe déjà. Le fichier porte `sourceStatus=user-provided-cetud-reference` et identifie explicitement la référence CETUD transmise au projet. Ce n'est pas une fiche AFTU récupérée via le lien 404.
- **Ligne 85 :** `src/data/aftu-85-directions.json` existe déjà avec `sourceStatus=user-provided-route-reference`. C'est une référence de parcours transmise au projet, distincte de la page officielle 404.
- **Lignes 86, 87, 88, 89 et 91 :** aucun fichier de parcours correspondant n'a été trouvé dans les données de l'extraction AFTU examinée. Conserver leur état `pending_missing_source` pour les détails non documentés. Les corridors affichés par l'index officiel peuvent rester enregistrés comme métadonnées de terminus, sans être transformés en séquences d'arrêts.

## Décision de consolidation

1. Ne créer aucun arrêt, sens retour, horaire ou fréquence pour 86, 87, 88, 89 et 91.
2. Ne pas écraser les données 84 et 85 déjà présentes ni leur provenance.
3. Ne pas assimiler les recoupements de terminus à une fusion ou à une renumérotation.
4. Garder les sept URL en anomalie source distincte ; la vérification sitemap reste non concluante faute de sitemap brut dans les artefacts actuels.
5. Poursuivre la consolidation DDD sur les comparaisons de séquences et géométries déjà auditées, sans modifier le socle TER/BRT.

Aucune écriture Supabase, aucun changement de données opérationnelles TER/BRT, aucun déploiement et aucune fusion de PR n'ont été effectués.


## Mise à jour après le nouvel audit officiel du 14 novembre 2026

Un nouvel audit de la page d'index AFTU et des liens de fiches a été exécuté sur le commit `ba4b2f9affe8b2fbf9df0fbc4f8415ddaa632b31` (workflow `43563127436`, artefact `14101142058`, génération 05:46:55 UTC).

La relecture directe de l'index officiel confirme explicitement les sept corridors suivants :

| Ligne | Corridor affiché dans l'index AFTU |
|---|---|
| 84 | UCAD – Jaxaay |
| 85 | Banoba – Liberté 5 |
| 86 | Tournalou Boune – Toubab Dialaw |
| 87 | Bambilor – Mosquée Massalikou Djinane |
| 88 | MTOA – Liberté 5 |
| 89 | Bargny – Croisement Niague (Cité SICAP) |
| 91 | APIX – Dougar |

Les sept URL canoniques de fiches détaillées ont encore renvoyé HTTP 404 dans l'exécution automatisée. L'index confirme donc les numéros et les corridors, mais pas les étapes intermédiaires, les arrêts nommés, l'ordre de passage, le sens retour ni les horaires. Le nouvel artefact recense 63 liens de fiches issus de l'index, 9 pages officielles additionnelles testées, 65 fiches avec texte d'itinéraire récupéré et 7 erreurs HTTP 404. Le statut global reste `PARTIAL_SOURCE_RESPONSE`.

**Correction de portée :** il ne faut plus dire que les sept lignes sont absentes de l'index officiel. Elles y figurent bien. Ce sont leurs pages détaillées qui restent indisponibles. Les corridors du tableau ci-dessus sont des métadonnées officielles confirmées ; ils ne constituent pas des séquences d'arrêts.

Les recoupements de terminus observés dans les 65 autres fiches ne prouvent toujours aucune fusion ou renumérotation. Les lignes 84 et 85 conservent leurs fichiers de parcours et leurs provenances déjà présentes dans le dépôt. Pour 86, 87, 88, 89 et 91, conserver `pending_missing_source` pour les détails non documentés, sans supprimer les corridors officiels affichés dans l'index.

Source primaire consultée : https://aftu-senegal.org/infos-pratiques/ (index officiel AFTU, vérifié le 14 novembre 2026).


### Piste complémentaire — ancienne communication officielle sur la ligne 87

Une publication du compte LinkedIn officiel AFTU Sénégal indique que l'itinéraire de la ligne 87 avait subi des changements et renvoie vers un « nouvel itinéraire » : https://sn.linkedin.com/posts/aftu-senegal_weekend-ligne87-diam-activity-6954111887911325696-_ZrF

La publication est ancienne (environ quatre ans) et le visuel accessible dans la page consultée ne fournit pas de carte ou de séquence exploitable. Elle confirme qu'une version antérieure de l'itinéraire a existé, mais ne permet pas de reconstruire le tracé actuel. À conserver comme piste de recherche historique uniquement ; la ligne 87 reste `pending_missing_source` pour ses détails d'itinéraire.


## Vérification de répétition sur le commit 619fe9e — 14 novembre 2026

Les workflows du commit `619fe9e08d6fbc679389c0455e0e1954300827c1` sont terminés avec succès. Les artefacts les plus récents confirment les limites suivantes :

- Audit AFTU (run `43563546428`, artefact `14101292135`) : 63 fiches liées à l'index, 9 pages officielles additionnelles testées, 65 fiches récupérées avec texte d'itinéraire, 7 erreurs. Les sept erreurs correspondent exactement aux URL canoniques des lignes 84, 85, 86, 87, 88, 89 et 91, toutes en HTTP 404.
- Aucun itinéraire détaillé pour les sept numéros n'est présent dans le tableau des fiches récupérées. Les 84/85 gardent donc leurs fichiers de parcours déjà présents dans le dépôt ; les 86/87/88/89/91 restent sans détails d'arrêts publiables.
- L'extracteur ne télécharge toujours pas le sitemap XML. Il ne fournit pas de preuve d'une variante de slug alternative ; cela ne permet pas de conclure qu'aucune variante n'existe sur le site.
- Audit OSM (run `43563546406`, artefact `14101875001`) : 6 610 éléments, 25 relations de bus, 23 candidates dans le périmètre de Dakar, 18 relations avec arrêts ordonnés, 522 membres d'arrêts ordonnés. Aucune relation portant `ref=84`, `85`, `86`, `87`, `88`, `89` ou `91` n'est présente. La seule relation AFTU/Tata numérotée visible dans cet extrait est `ref=40` ; elle ne permet pas de déduire les parcours recherchés.
- Les artefacts ArcGIS utilisés ici concernent exclusivement les services DDD. Le service DDD mis à jour renvoie 777 entités d'arrêts et 25 de lignes ; le second inventaire DDD renvoie 455 entités d'arrêts et 25 de lignes. Ils ne constituent pas une source ArcGIS AFTU et ne peuvent pas confirmer les sept numéros AFTU.

**Décision maintenue :** aucun arrêt, sens retour, horaire, fréquence, fusion ou renumérotation n'est ajouté sur la base de ces résultats. Les corridors officiels de l'index restent des métadonnées de terminus, pas des listes d'arrêts. La recherche sitemap et les variantes de slugs restent ouvertes faute d'artefact sitemap brut.



## Nouvelle source transmise — ligne AFTU 86 (14 novembre 2026)

Le responsable du projet a transmis deux captures/transcriptions attribuées au CETUD : 68 arrêts dans le sens Yeumbeul → Terminus 86 / Touba Ngayame, et 64 arrêts dans le sens retour. Cette source utilisateur apporte désormais une séquence détaillée pour la ligne 86, malgré le HTTP 404 de sa fiche AFTU. Le statut de la fiche web reste 404 ; le statut des données de parcours dans le dépôt devient toutefois `user-provided-cetud-reference`.

Les données ont été enregistrées séparément dans `src/data/aftu-86-directions.json` et contrôlées par `src/data/aftu-86-directions.test.ts` : 68 arrêts et 68 horaires à l'aller ; 64 arrêts au retour, sans horaires fournis. L'ordre, les libellés, les horaires et les répétitions ont été conservés tels que transmis. Aucun retour n'a été fabriqué par inversion de l'aller.

**Anomalie horaire conservée, non corrigée :** les premiers horaires aller progressent de 05:47 à 05:50, puis les arrêts 9 à 11 reviennent à 05:38. La transcription contient ensuite des horaires qui reprennent leur progression. Cette rupture peut provenir d'une erreur de lecture/capture ou de source ; sans revoir les captures originales, il ne faut ni trier les arrêts ni corriger les heures. Le libellé « Kà«R Yaye » est également conservé exactement tel que fourni ; « Keur Yaye » n'est indiqué que dans la note de transcription.

La ligne 86 ne doit donc plus être présentée comme entièrement sans parcours. Elle dispose maintenant d'une séquence aller/retour transmise par l'utilisateur comme provenant du CETUD, mais les horaires du retour et la validation indépendante de la séquence restent absents. Les lignes 87, 88, 89 et 91 restent `pending_missing_source` pour leurs détails d'arrêts ; 84 et 85 conservent leurs sources et fichiers précédents.


### Conflit de terminus à résoudre avant intégration au catalogue public

Le catalogue officiel AFTU extrait de l'index associe actuellement le numéro 86 au corridor **Tournalou Boune → Toubab Dialaw**. La nouvelle transcription de captures attribuées au CETUD porte, elle, **Yeumbeul → Terminus 86 / Touba Ngayame**. Ce n'est pas une petite différence de libellé : les deux couples de terminus sont distincts. La nouvelle séquence est donc enregistrée comme preuve de parcours fournie par l'utilisateur, mais le catalogue public officiel n'est pas réécrit tant que l'index CETUD/la capture de l'en-tête de ligne ne permet pas d'établir s'il s'agit d'une mise à jour, d'une variante, ou d'une attribution de numéro différente.

Les horaires aller présentent en outre un retour de 05:50 à 05:38 entre les arrêts 8 et 9. Cette valeur est conservée à l'identique ; il faut vérifier la capture correspondante avant toute correction ou affichage horaire.

## Rectification — heures de la ligne AFTU 86 invalidées (14 novembre 2026)

Le responsable du projet précise que l'heure réelle de départ n'est pas connue et que l'horaire précédemment transcrit n'est pas valide. En conséquence, les 68 heures relevées dans la transcription ne sont **pas des horaires fiables** et ne doivent pas être affichées ni utilisées pour calculer des passages, des fréquences ou des départs.

Le fichier `src/data/aftu-86-directions.json` a été corrigé :
- les 68 arrêts aller et les 64 arrêts retour sont conservés dans leurs sens respectifs ;
- la propriété opérationnelle `times` a été retirée du sens aller ;
- les valeurs de la transcription sont conservées sous `transcribedTimesUnvalidated`, uniquement pour traçabilité et explicitement hors usage voyageur ;
- `timeStatus` vaut `invalid-unverified` ;
- aucun horaire n'est ajouté au sens retour.

**Règle de publication :** la ligne AFTU 86 ne possède actuellement aucun horaire de départ ou de passage validé. Afficher les arrêts sans heure, jusqu'à obtention d'une source horaire fiable. Cette rectification ne modifie ni les parcours TER/BRT ni les autres lignes.

## Ligne AFTU 87 — parcours transcrits depuis l’application CETUD (14 novembre 2026)

Les captures CETUD transmises par l’utilisateur fournissent désormais les deux séquences directionnelles de la ligne 87 : 68 arrêts dans le sens Terminus 79 87 → Maristes Terminus 87 et 71 arrêts dans le sens Maristes Terminus 87 → Terminus 79 87.

Les séquences sont enregistrées dans `src/data/aftu-87-directions.json`, séparément et dans l’ordre exact communiqué. Les répétitions, les variantes de libellés et l’encodage brut « Cité Fayà§Al » sont préservés. Les tests dédiés contrôlent les effectifs, les terminus, des répétitions et l’absence d’horaires.

Aucun horaire de départ, horaire de passage ou fréquence n’a été fourni pour la ligne 87. Aucun n’est donc créé. Les données restent des parcours transcrits à partir des captures de l’application CETUD, sans prétendre à une validation indépendante des arrêts.


## Mise à jour — fonctionnement et repères horaires AFTU 86/87 (14 novembre 2026)

Le responsable du projet précise que les lignes AFTU fonctionnent en régulation continue selon le remplissage des véhicules et le trafic, contrairement à un horaire rigide de premier/dernier départ. Les repères généraux transmis pour le réseau sont :
- premier départ généralement entre **05:30 et 06:30**, selon le terminus ;
- dernier départ autour de **21:00**, avec variations ;
- pointe du matin : **06:30–09:30** ;
- pointe du soir : **16:30–20:00** ;
- passages en pointe : intervalle variable de **5 à 15 minutes** depuis les terminus périphériques.

Ces repères sont enregistrés dans les profils de fonctionnement des lignes 86 et 87 comme références générales AFTU/CETUD et données de terrain communiquées au projet. Ils ne sont pas transformés en horaires garantis, et aucun horaire de passage aux arrêts n'est calculé à partir d'eux.

### Ligne 86
La plage générale AFTU est conservée : départ initial dans la fenêtre 05:30–06:30 selon le terminus, dernier départ autour de 21:00. L'heure exacte du premier départ de la ligne 86 reste **inconnue**. Les anciennes heures transcrites restent invalidées et non utilisables ; les 68 arrêts aller et 64 arrêts retour sont inchangés.

### Ligne 87
Les départs théoriques communiqués sont enregistrés séparément :
- aller depuis Bambilor : **06:30** ;
- retour depuis les Maristes : **06:35**.

Ils sont marqués comme repères théoriques et non comme départs fixes garantis. Aucun temps de passage aux arrêts n'est déduit. Les séquences de captures restent 68 arrêts aller et 71 arrêts retour, avec les libellés exacts « Terminus 79 87 » et « Maristes Terminus 87 ».

### Divergence de corridor de la ligne 87
L'index AFTU précédemment audité affichait **Bambilor – Mosquée Massalikou Djinane**. La référence plus récente transmise au projet décrit **Bambilor – Maristes**. Les captures détaillées enregistrées dans le dépôt relient « Terminus 79 87 » aux « Maristes Terminus 87 ». Cette différence est conservée comme évolution possible de version ou divergence de source ; l'ancien index n'est pas réécrit silencieusement.

Les deux fichiers JSON et leurs tests sont mis à jour pour séparer amplitude générale, pointes, intervalle variable et départs théoriques. Aucun horaire de passage n'est créé. Aucune donnée TER/BRT, écriture Supabase, mise en production ou fusion de PR n'est effectuée.


## Rectification majeure de numérotation — relecture directe de l’index AFTU (14 novembre 2026)

La page officielle [AFTU — Infos pratiques](https://aftu-senegal.org/infos-pratiques/) a été rouverte directement après les mises à jour précédentes. Les lignes 84 à 91 y sont affichées ainsi (lecture des lignes 402 à 439 de la page) :

| Numéro affiché actuellement | Corridor affiché par l’index officiel |
|---|---|
| 84 | Banoba – Liberté 5 |
| 85 | Tournalou Boune – Toubab Dialaw |
| 86 | Bambilor – Mosquée Massalikou Djinane |
| 87 | MTOA – Liberté 5 |
| 88 | Bargny – Croisement Niague (Cité SICAP) |
| 89 | APIX – Dougar |
| 91 | Aucun corridor lisible dans le contenu de la page après le libellé « LIGNE 91 » |

**Correction de l’audit antérieur :** les tableaux précédents attribuant Tournalou–Toubab à 86 et Bambilor–Massalikou à 87 étaient décalés d’un numéro par rapport à la page officielle actuellement publiée. Il faut les considérer comme une ancienne transcription erronée de l’index et non comme la référence actuelle.

### Conséquence pour les données CETUD transmises au projet

- **Fichier 86 :** les captures enregistrées dans le dépôt décrivent Yeumbeul → Touba Ngayame et le retour. Le responsable du projet a également décrit la ligne 86 comme Tournalou Boune → Toubab Dialaw. L’index officiel actuel affiche pourtant Bambilor → Mosquée Massalikou Djinane pour 86. Ces trois références ne sont pas compatibles à ce stade.
- **Fichier 87 :** les captures enregistrées décrivent Terminus 79 87 → Maristes Terminus 87 et le retour ; la référence de fonctionnement transmise indique Bambilor → Maristes. L’index officiel actuel affiche MTOA → Liberté 5 pour 87.

Les séquences capturées, les profils de fonctionnement et les corridors de l’index sont conservés comme sources distinctes. **Aucun parcours n’est supprimé, renuméroté ou réattribué automatiquement.** En revanche, tant que le CETUD n’a pas confirmé la correspondance des numéros, les fiches 86 et 87 doivent rester en statut de rapprochement à résoudre et ne doivent pas être présentées comme une correspondance officielle définitivement établie.

Source primaire : index officiel AFTU, consulté directement le 14 novembre 2026 : https://aftu-senegal.org/infos-pratiques/ (sections lignes 84–91). Cette relecture confirme aussi que le contenu indexé ne fournit pas de corridor lisible pour le numéro 91.


## Recherche approfondie AFTU / Moovit — lignes 88, 89, 90 et 91 (14 novembre 2026)

Nouvelle vérification croisée des pages AFTU, des trois pages de l'archive AFTU, de l'index général Moovit Dakar et des recherches ciblées Moovit par numéro et par terminus.

### 1. Résultat de l'index officiel AFTU

La page officielle « Infos pratiques » affiche actuellement :

| Ligne | Corridor visible dans l'index AFTU | Niveau de preuve |
|---|---|---|
| 88 | MTOA – Liberté 5 | Terminus/corridor seulement |
| 89 | Bargny – Croisement Niague (Cité SICAP) | Terminus/corridor seulement |
| 90 | Aucun numéro 90 affiché entre 89 et 91 | Non documenté |
| 91 | Le libellé « LIGNE 91 » apparaît, mais aucun corridor lisible après ce titre | Numéro seulement |

Les libellés « Voir itinéraire » des lignes 88, 89 et 91 ne sont pas exposés comme liens de fiche utilisables dans le contenu de la page consultée. Les anciennes URL candidates de fiches détaillées pour les lignes 88, 89 et 91 ont déjà renvoyé HTTP 404 dans les extractions AFTU précédentes. La nouvelle lecture ne fournit donc toujours aucune séquence d'arrêts.

### 2. Résultat Moovit

L'index général Moovit Dakar, dans sa section AFTU, énumère les lignes de 1B à 84 et s'arrête à « 84 – Grand Yoff – Jaxaay ». Il ne répertorie pas les lignes 88, 89, 90 ou 91. La page générale AFTU Moovit annonce 64 lignes et 1 634 arrêts, ce qui montre que son inventaire public n'est pas aligné sur la liste AFTU actuellement affichée sur le site de l'opérateur.

Les recherches ciblées par numéro 88, 89, 90 et 91 n'ont pas fait remonter de fiche Moovit AFTU correspondante. Le résultat Moovit trouvé pour le numéro 90 concerne Casablanca et un autre réseau ; il est explicitement exclu de cet audit. Il ne faut surtout pas le rattacher à Dakar.

**Interprétation :** Moovit ne corrobore pas actuellement les numéros/corridors 88 et 89 du nouvel index AFTU, et ne donne aucun élément pour 90 ou 91. Cette absence peut refléter un décalage de mise à jour de son catalogue ; elle ne prouve pas que les lignes n'existent pas.

### 3. Archives AFTU

Les trois pages publiques de la collection « Dakar lignes urbaines » couvrent les fiches 55 à 83. Aucune fiche 88, 89, 90 ou 91 n'y est publiée. Cette archive ne fournit donc pas de seconde séquence détaillée pour les quatre numéros.

### 4. Autres recoupements et limites

- Les recherches par les corridors « MTOA – Liberté 5 », « Bargny – Croisement Niague » et « APIX – Dougar » n'ont pas identifié de fiche d'itinéraire AFTU indépendante et exploitable pour les lignes 88, 89 ou 91.
- Les occurrences de MTOA, Bargny, Niague, APIX ou Dougar dans des fiches d'autres lignes ne prouvent pas que ces fiches appartiennent aux lignes 88/89/91.
- Les artefacts OSM précédemment audités ne contiennent aucune relation AFTU numérotée 88, 89 ou 91 ; aucun élément de ce jeu ne permet de reconstituer la ligne 90.
- Les couches ArcGIS consultées dans ce chantier sont des services DDD, pas un référentiel géographique AFTU. Elles ne peuvent pas servir à fabriquer les arrêts des lignes recherchées.
- Aucune séquence indépendante Aller/Retour, carte de ligne, horaire de passage ou fréquence propre à ces quatre numéros n'a été trouvée dans les sources consultées.

### 5. Décision pour Dakar Bus

1. Conserver pour la ligne 88 le corridor AFTU « MTOA – Liberté 5 » comme métadonnée d'index uniquement.
2. Conserver pour la ligne 89 le corridor AFTU « Bargny – Croisement Niague (Cité SICAP) » comme métadonnée d'index uniquement.
3. Conserver la ligne 90 en attente de source : ne pas lui attribuer un corridor ni supposer qu'elle est supprimée.
4. Conserver la ligne 91 comme numéro affiché mais corridor non lisible ; ne pas lui attribuer APIX – Dougar sur la seule base des anciennes transcriptions d'index décalées.
5. Ne créer aucun arrêt, ordre, direction retour, horaire ou fréquence pour 88, 89, 90 ou 91.
6. Ne pas injecter ces métadonnées dans le catalogue passager tant que les deux directions et leurs séquences ne sont pas établies.

Sources consultées le 14 novembre 2026 :
- AFTU, index « Infos pratiques » : https://aftu-senegal.org/infos-pratiques/
- AFTU, archive Dakar lignes urbaines : https://aftu-senegal.org/collection/dakar-lignes-urbaines/ (pages 1 à 3)
- Moovit, index des lignes de Dakar : https://moovitapp.com/index/fr/transport_en_commun-linesIndex-Dakar-1-5996
- Moovit, page générale AFTU Dakar : https://moovitapp.com/index/fr/transport_en_commun-lines-Dakar-5996-1618038

Cette mise à jour est documentaire uniquement. Aucun JSON de parcours, horaire ou catalogue passager n'a été modifié. Aucun changement TER/BRT, aucune écriture Supabase, aucun déploiement et aucune fusion de PR.
