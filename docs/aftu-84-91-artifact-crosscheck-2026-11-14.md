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
| 88 | Bargny – Croisement Niague (Cité SICAP) | Terminus/corridor seulement |
| 89 | APIX – Dougar | Terminus/corridor seulement |
| 90 | **Pas de ligne 90** — correction confirmée par le responsable du projet | Numéro inexistant dans le réseau concerné ; aucune recherche de parcours à poursuivre |
| 91 | Le libellé « LIGNE 91 » apparaît, mais aucun corridor lisible après ce titre | Numéro seulement |

Les libellés « Voir itinéraire » des lignes 88, 89 et 91 ne sont pas exposés comme liens de fiche utilisables dans le contenu de la page consultée. Les anciennes URL candidates de fiches détaillées pour les lignes 88, 89 et 91 ont déjà renvoyé HTTP 404 dans les extractions AFTU précédentes. La nouvelle lecture ne fournit donc toujours aucune séquence d'arrêts.

### 2. Résultat Moovit

L'index général Moovit Dakar, dans sa section AFTU, énumère les lignes de 1B à 84 et s'arrête à « 84 – Grand Yoff – Jaxaay ». Il ne répertorie pas les lignes 88, 89, 90 ou 91. La page générale AFTU Moovit annonce 64 lignes et 1 634 arrêts, ce qui montre que son inventaire public n'est pas aligné sur la liste AFTU actuellement affichée sur le site de l'opérateur.

Les recherches ciblées par numéro 88, 89, 90 et 91 n'ont pas fait remonter de fiche Moovit AFTU correspondante. Le résultat Moovit trouvé pour le numéro 90 concerne Casablanca et un autre réseau ; il est explicitement exclu de cet audit. Il ne faut surtout pas le rattacher à Dakar.

**Interprétation :** Moovit ne corrobore pas actuellement les numéros/corridors 88 et 89 du nouvel index AFTU, et ne donne aucun élément pour 90 ou 91. Cette absence peut refléter un décalage de mise à jour de son catalogue ; elle ne prouve pas que les lignes n'existent pas.

### 3. Archives AFTU

Les trois pages publiques de la collection « Dakar lignes urbaines » couvrent les fiches 55 à 83. Aucune fiche 88, 89, 90 ou 91 n'y est publiée. Cette archive ne fournit donc pas de seconde séquence détaillée pour les quatre numéros.

### 4. Autres recoupements et limites

- Les recherches par les corridors « Bargny – Croisement Niague », « APIX – Dougar » et « MTOA – Liberté 5 » n'ont pas identifié de fiche d'itinéraire AFTU indépendante et exploitable pour les lignes 88, 89 ou 91.
- Les occurrences de MTOA, Bargny, Niague, APIX ou Dougar dans des fiches d'autres lignes ne prouvent pas que ces fiches appartiennent aux lignes 88/89/91.
- Les artefacts OSM précédemment audités ne contiennent aucune relation AFTU numérotée 88, 89 ou 91 ; aucun élément de ce jeu ne permet de reconstituer la ligne 90.
- Les couches ArcGIS consultées dans ce chantier sont des services DDD, pas un référentiel géographique AFTU. Elles ne peuvent pas servir à fabriquer les arrêts des lignes recherchées.
- Aucune séquence indépendante Aller/Retour, carte de ligne, horaire de passage ou fréquence propre aux lignes 88, 89 et 91 n'a été trouvée dans les sources consultées. La ligne 90 est exclue du réseau étudié sur confirmation du responsable du projet.

### 5. Décision pour Dakar Bus

1. Conserver pour la ligne 88 le corridor AFTU « Bargny – Croisement Niague (Cité SICAP) » comme métadonnée d'index uniquement.
2. Conserver pour la ligne 89 le corridor AFTU « APIX – Dougar » comme métadonnée d'index uniquement.
3. Retirer la ligne 90 du périmètre de recherche : le responsable du projet confirme qu'il n'existe pas de ligne 90. Ne créer aucune fiche ni numéro fictif.
4. Conserver la ligne 91 comme numéro affiché mais corridor non lisible ; ne pas lui attribuer APIX – Dougar sur la seule base des anciennes transcriptions d'index décalées.
5. Ne créer aucun arrêt, ordre, direction retour, horaire ou fréquence pour 88, 89, 90 ou 91.
6. Ne pas injecter ces métadonnées dans le catalogue passager tant que les deux directions et leurs séquences ne sont pas établies.

Sources consultées le 14 novembre 2026 :
- AFTU, index « Infos pratiques » : https://aftu-senegal.org/infos-pratiques/
- AFTU, archive Dakar lignes urbaines : https://aftu-senegal.org/collection/dakar-lignes-urbaines/ (pages 1 à 3)
- Moovit, index des lignes de Dakar : https://moovitapp.com/index/fr/transport_en_commun-linesIndex-Dakar-1-5996
- Moovit, page générale AFTU Dakar : https://moovitapp.com/index/fr/transport_en_commun-lines-Dakar-5996-1618038

Cette mise à jour est documentaire uniquement. Aucun JSON de parcours, horaire ou catalogue passager n'a été modifié. Aucun changement TER/BRT, aucune écriture Supabase, aucun déploiement et aucune fusion de PR.


## Rectification de lecture de l'index AFTU — lignes 88 et 89 (14 novembre 2026)

Une relecture ligne par ligne du HTML rendu de la page AFTU, en tenant compte de l'ordre exact « corridor puis numéro de ligne », confirme sans ambiguïté :
- Ligne 88 : **Bargny – Croisement Niague (Cité SICAP)**.
- Ligne 89 : **APIX – Dougar**.
- Ligne 91 : le titre « LIGNE 91 » est visible, mais aucun corridor n'est affiché après ce titre.

La ligne **MTOA – Liberté 5 appartient à la ligne 87**, et non à la 88. Toute mention antérieure dans ce rapport attribuant MTOA – Liberté 5 à la ligne 88 est erronée et doit être ignorée. Source primaire : page AFTU relue directement, lignes 414–439 du rendu consulté le 14 novembre 2026 : https://aftu-senegal.org/infos-pratiques/.

Cette rectification est documentaire ; elle ne modifie aucune donnée d'itinéraire.


## Rectification définitive de la numérotation — 14 novembre 2026

Cette section remplace les tableaux historiques des sections 3 et « Mise à jour après le nouvel audit officiel » ci-dessus, qui reprenaient une lecture décalée de l'index AFTU.

La relecture directe de l'index officiel AFTU donne la correspondance correcte :

| Ligne | Corridor officiel actuellement affiché |
|---|---|
| 87 | MTOA – Liberté 5 |
| 88 | Bargny – Croisement Niague (Cité SICAP) |
| 89 | APIX – Dougar |
| 90 | Pas de ligne 90 — erreur de numéro corrigée par le responsable du projet |
| 91 | Le titre « LIGNE 91 » est visible, mais aucun corridor n'est lisible |

En conséquence :
- Toute attribution antérieure de « MTOA – Liberté 5 » à la ligne 88 est erronée ; elle concerne la ligne 87.
- Toute attribution antérieure de « Bargny – Croisement Niague » à la ligne 89 est erronée ; elle concerne la ligne 88.
- Toute attribution antérieure de « APIX – Dougar » à la ligne 91 est erronée ; elle concerne la ligne 89.
- La ligne 91 reste sans corridor identifié ; ne pas lui transférer le corridor de la ligne 89.
- La ligne 90 est exclue des recherches et des données : elle n'existe pas dans le périmètre, selon la correction du responsable du projet.

Les sections historiques restent visibles pour la traçabilité de l'erreur, mais ne doivent plus être utilisées comme référence de données. Source primaire : index officiel AFTU, https://aftu-senegal.org/infos-pratiques/, relu directement le 14 novembre 2026. Le rapport détaillé consacré aux applications et aux sources opérationnelles est complémentaire : `docs/aftu-88-89-91-mobility-apps-and-operational-sources-2026-11-14.md`.

Aucune séquence d'arrêts, aucun sens retour, horaire ou intervalle n'est ajouté par cette rectification.


## Mise à jour de recherche indépendante et intégration des listes CETUD 90/91 — 14 novembre 2026

### Index officiel AFTU relu en direct
La page publique AFTU `https://aftu-senegal.org/infos-pratiques/` affiche actuellement :
- 86 : Tournalou Boune – Toubab Dialaw ;
- 87 : Bambilor – Mosquée Massalikou Djinane ;
- 88 : MTOA – Liberté 5 ;
- 89 : Bargny – Croisement Niague (Cité SICAP) ;
- 91 : APIX – Dougar.

La page ne présente pas de ligne 90 dans cette liste, mais l'application CETUD fournie en capture par le responsable du projet affiche explicitement « AFTU », « Ligne 90 », « Terminus 90 → Deni Birame Ndao Nord » et 82 arrêts pour le sens affiché. La présence de la ligne 90 dans l'application est donc consignée séparément de l'index public AFTU, qui ne la reprend pas dans son affichage actuel.

### Recherche de sources secondaires pour 86–89
- Une fiche pratique indépendante publiée en janvier 2026 indique qu'un Tata 86 circule de Pikine vers Toubab Dialaw, avec des arrêts à Rufisque, Bargny et Diamniadio. Elle corrobore le corridor vers Toubab Dialaw, mais ne confirme pas le terminus Tournalou Boune ni les 68/64 arrêts déjà transcrits dans `src/data/aftu-86-directions.json`. La divergence de point de départ reste donc ouverte.
- La recherche publique ciblée n'a pas retrouvé de séquence indépendante suffisamment documentée pour les lignes 87, 88 ou 89. Moovit indique 64 lignes AFTU dans son inventaire public et n'affiche pas de page exploitable 86–89 dans les résultats examinés ; cette absence de résultat n'est pas une preuve d'inexistence.
- L'index officiel confirme les corridors des lignes 86–89, mais les liens « Voir itinéraire » de ces numéros ne fournissent pas de fiche détaillée exploitable dans l'extraction existante.

### Ligne 91 — contradiction à conserver, pas à corriger
L'index public officiel AFTU affiche pour la ligne 91 le corridor **APIX – DOUGAR**. Le responsable du projet a transmis depuis l'application CETUD deux séquences complètes et les a validées : 70 occurrences Losso → Terminus 91 et 70 occurrences Chez Lo électricien → Losso. Ces listes sont conservées intégralement dans `docs/aftu-line-91-cetud-app-directional-stop-lists-2026-11-14.md`.

La divergence entre le corridor de l'index AFTU (APIX–Dougar) et les terminus/libellés de la fiche CETUD transmise (Losso / Terminus 91 / Chez Lo électricien) est un conflit de publications à tracer. Elle ne justifie ni d'écarter les 140 occurrences validées par le responsable du projet, ni de les réécrire ou de les rattacher arbitrairement à un autre numéro. La validation des séquences par le responsable du projet reste distincte d'une résolution institutionnelle de ce conflit de corridor.

### Limites de recherche
La fiche App Store décrit CETUD Mobilités comme l'application officielle du CETUD, permettant de consulter lignes, arrêts et horaires ; elle ne fournit pas dans sa fiche publique les détails des lignes 86–91. PassBi déclare intégrer progressivement les opérateurs et utiliser des données GTFS publiques centralisées par CETUD, mais aucune séquence publique spécifique 86–91 n'a été extraite. Aucune API privée ni route non publique n'a été appelée.

Sources publiques consultées :
- AFTU-Sénégal, index officiel : https://aftu-senegal.org/infos-pratiques/
- CETUD, présentation AFTU : https://cetud.sn/reseaux-de-transport/aftu/
- CETUD Mobilités, fiche App Store : https://apps.apple.com/fr/app/cetud-mobilit%C3%A9s/id6814449080
- Moovit, inventaire public AFTU (64 lignes affichées) : https://moovitapp.com/index/fr/transport_en_commun-lines-Dakar-5996-1618038
- Guide pratique indépendant mentionnant le Tata 86 vers Toubab Dialaw : https://anafonio.sn/wp-content/uploads/2026/01/Itineraire_Detaillee_2.pdf
- PassBi, fiche publique : https://play.google.com/store/apps/details?id=com.senpassbi.app

Aucun horaire ou intervalle n'est validé par ces recherches. Les listes CETUD 90/91 sont conservées selon les validations explicites du responsable du projet. Aucune donnée passager, TER/BRT, Supabase ou production n'est modifiée.


## Rapprochement séquentiel ligne 86 / ligne 91 — contrôle exact du 14 novembre 2026

Un contrôle programmatique des libellés exacts a été réalisé entre les 64 arrêts du retour de la ligne 86 déjà stockés dans `src/data/aftu-86-directions.json` et les 70 arrêts de l'aller de la ligne 91 validés par le responsable du projet dans `docs/aftu-line-91-cetud-app-directional-stop-lists-2026-11-14.md`.

**Résultat : 26 libellés exactement identiques** apparaissent dans les deux séquences. Ils couvrent notamment Diamniadio (garage Modou Talibé Cheikh, Talli Boune, Oil Libya, Incco, Baye Peul, gendarmerie), puis Sendou/Bargny, Sococim, Rufisque, P15, Sonadis, Dioutiba, Auberge L'Oustal, Avisen et Layousse. L'ordre général de ces arrêts est compatible avec un tronçon commun, mais le contrôle effectué ici porte sur l'appartenance des libellés aux listes et non sur une preuve GPS indépendante ni sur une correspondance complète de ligne.

Le recoupement peut s'expliquer par un tronc commun, des variantes de desserte ou une différence de version/source. Il ne prouve ni fusion, ni renumérotation, ni erreur de numéro. Les deux séquences sont issues de références CETUD transmises au projet, mais les terminus publics AFTU affichés restent différents : ligne 86 Tournalou Boune–Toubab Dialaw et ligne 91 APIX–Dougar. **Aucune correction ou suppression n'est faite** dans les deux fichiers. À faire confirmer par une source opérateur/CETUD : le partage de tronçon, les arrêts propres à chaque ligne et les terminus réellement exploités.

La fiche publique AFTU continue d'afficher les corridors 86 Tournalou Boune–Toubab Dialaw, 87 Bambilor–Mosquée Massalikou Djinane et 91 APIX–Dougar, sans séquences détaillées. La fiche App Store de CETUD Mobilités confirme que l'application officielle donne accès aux lignes, arrêts et horaires, mais sa description publique ne publie pas le détail de ces trois lignes. Sources : https://aftu-senegal.org/infos-pratiques/ ; https://apps.apple.com/sn/app/cetud-mobilit%C3%A9s/id6814449080.

## Ligne 87 — état après recherche complémentaire

Le fichier `src/data/aftu-87-directions.json` contient toujours 68 arrêts à l'aller et 71 au retour, terminus transcrits « Terminus 79 87 » et « Maristes Terminus 87 », avec départs théoriques 06:30 Bambilor et 06:35 Maristes transmis par le responsable du projet. L'index AFTU public donne Bambilor–Mosquée Massalikou Djinane. Une ancienne publication LinkedIn du compte AFTU mentionne un changement d'itinéraire de la ligne 87, mais le contenu accessible ne donne pas de séquence lisible : https://sn.linkedin.com/posts/aftu-senegal_weekend-ligne87-diam-activity-6954111887911325696-_ZrF. Cette piste confirme seulement qu'il y a eu une évolution d'itinéraire ; elle ne résout pas la divergence Maristes / Mosquée Massalikou Djinane. Ne pas réécrire les 68/71 arrêts ni les repères théoriques.

## Décision de chantier

1. Conserver sans modification les séquences 86 (68/64) et 87 (68/71).
2. Consigner les 26 libellés communs entre retour 86 et aller 91 comme tronc commun potentiel à confirmer, sans fusion.
3. Ne pas afficher les anciennes heures transcrites invalidées de la ligne 86 ; ne pas extrapoler de temps de passage.
4. Maintenir la ligne 87 en divergence de terminus jusqu'à preuve institutionnelle plus précise.
5. Poursuivre le contrôle des autres lignes AFTU et les audits DDD ; aucune donnée TER/BRT n'est touchée.


## Comparaison séquentielle complémentaire des listes AFTU 88/89/91 — 14 novembre 2026

Un contrôle programmatique a été effectué sur les listes directionnelles déjà archivées, sans modifier les séquences sources. Méthode : extraction des occurrences numérotées dans chaque direction, comparaison des libellés après normalisation technique minimale (casse, accents et espaces), sans fusion ni suppression des occurrences. Le nombre de libellés communs indique uniquement un partage textuel potentiel ; il ne prouve ni un arrêt physique identique, ni une correspondance de ligne, ni un tronc commun exploité.

| Comparaison | Entrées | Libellés communs exacts après normalisation |
|---|---:|---:|
| 88 aller (78) ↔ 89 aller (55) | 78 / 55 | 0 |
| 88 aller (78) ↔ 89 retour (53) | 78 / 53 | 0 |
| 88 retour (81) ↔ 89 aller (55) | 81 / 55 | 0 |
| 88 retour (81) ↔ 89 retour (53) | 81 / 53 | 0 |
| 89 aller (55) ↔ 89 retour (53) | 55 / 53 | 20 |
| 91 aller (70) ↔ 89 aller (55) | 70 / 55 | 5 |
| 91 aller (70) ↔ 89 retour (53) | 70 / 53 | 4 |

Pour la ligne 89, les 20 libellés communs entre les deux sens comprennent notamment les deux terminus, Mosquée Tawfekh Niague, Franco-Arabe La Voie du Savoir, Groupe scolaire El Hadji Bara Mbacke Falilou, Lotissement Alassane, Croisement Tivaoune Peulh, La Maison des Reporters, plusieurs repères de Keur Massar, Dioutiba, Poste Courant Rufisque et Thiawlène devant Station Total Energie. Les deux listes restent indépendantes : les autres points et leurs différences d'ordre ne sont pas corrigés par ce contrôle.

Le rapprochement avec la ligne 91 fait ressortir cinq libellés textuellement communs entre son aller et l'aller de la 89 : Poste Courant Bargny près de la gare TER, Thiawlène devant Station Total Energie, Poste Courant Rufisque, Dioutiba et Arrêt Mame Awa Faye. Quatre sont communs entre le retour 91 et le retour 89 : Arrêt Mame Awa Faye, Dioutiba, Poste Courant Rufisque et Thiawlène devant Station Total Energie. Ce résultat peut signaler des repères partagés dans la zone de Rufisque/Bargny, mais ne suffit pas à confirmer une desserte commune ou à réattribuer les séquences. Les 70 occurrences validées par le responsable du projet pour chacun des sens 91 restent inchangées.

Aucun libellé exact n'est partagé entre les listes 88 et 89 dans les quatre comparaisons directionnelles effectuées. Cela n'invalide pas les listes : les corridors publics AFTU actuellement affichés et les terminus du site source peuvent relever de publications/version différentes. La divergence officielle de corridor de la 88/89 demeure ouverte et doit être clarifiée auprès de l'opérateur/CETUD.

Limites : cette comparaison est textuelle, pas géographique ; elle n'utilise ni géocodage, ni tracé GPS, ni validation terrain. Les variantes orthographiques et les arrêts homonymes peuvent produire des faux négatifs ou faux positifs. Aucun horaire, fréquence, coordonnée, arrêt ou retour n'est ajouté. Aucun catalogue passager, donnée TER/BRT, Supabase ou production n'est modifié.


## Vérification web indépendante ciblée AFTU 88/89 — 14 novembre 2026

Nouvelle recherche publique ciblée sur les numéros, les terminus, les listes d'arrêts et les applications de mobilité :

- **Index primaire AFTU relu le 14 novembre** : il affiche 87 MTOA–Liberté 5, 88 Bargny–Croisement Niague (Cité SICAP), 89 APIX–Dougar et 91 APIX–Dougar. Aucun détail d'arrêts n'est exposé dans le contenu indexé pour 88/89/91 ; les liens « Voir itinéraire » ne livrent pas de fiche détaillée exploitable dans cette vérification. Source : https://aftu-senegal.org/infos-pratiques/.
- **TransitByCity** : son inventaire public AFTU Dakar indique 28 lignes et liste notamment 84, mais ne contient ni 88 ni 89. Sa page de réseau indique une dernière actualisation au 28 mai 2026. Cette absence, dans un catalogue incomplet par rapport à l'index AFTU, ne réfute pas les corridors officiels et ne permet pas de confirmer les listes détaillées. Source : https://transitbycity.com/fr/senegal/dakar/operators/aftu/.
- **Moovit** : l'index AFTU Dakar décrit les zones générales desservies et certaines lignes populaires, mais la recherche ciblée n'a pas fait apparaître de fiche exploitable 88 ou 89 ni de séquence indépendante pour ces deux numéros. Source : https://moovitapp.com/index/fr/transport_en_commun-lines-Dakar-5996-1618038.
- Les recherches ciblées sur les intitulés « Terminus 88 » / « Liberté 5 » et « Terminus 89 » / « Poste Courant Bargny » n'ont pas retrouvé de publication opérateur, fiche Moovit ou page de mobilité indépendante qui confirme les listes détaillées fournies. Aucun résultat ne permet de résoudre la différence entre les corridors actuels de l'index AFTU et les terminus des listes du site source communiquées au projet.

**Conclusion renforcée :** les listes directionnelles détaillées 88 et 89 restent archivées comme relevés de leur site source, avec leur provenance et leur ordre conservés ; les corridors officiels AFTU sont des métadonnées distinctes. La recherche publique actuelle ne fournit pas de corroboration indépendante suffisante pour valider, renuméroter ou remplacer ces séquences. Les listes de l'utilisateur ne sont ni supprimées ni réécrites. Aucune fréquence ni horaire n'est validé.

Sources web consultées le 14 novembre 2026 :
- AFTU-Sénégal, index officiel : https://aftu-senegal.org/infos-pratiques/.
- TransitByCity, inventaire AFTU Dakar : https://transitbycity.com/fr/senegal/dakar/operators/aftu/.
- Moovit, index AFTU Dakar : https://moovitapp.com/index/fr/transport_en_commun-lines-Dakar-5996-1618038.

Cette recherche est documentaire uniquement : aucune donnée passager, aucun fichier JSON d'arrêts, aucune fréquence, TER/BRT, Supabase ou production n'est modifié.


## Décision de méthode — adoption des listes d'étude fournies au projet (14 novembre 2026)

**Cette décision remplace les formulations antérieures qui maintenaient les listes 88/89/90/91 en attente d'une corroboration publique externe.** Le chantier ne doit plus être bloqué par l'absence de fiches détaillées sur les sites web publics.

### Référence de travail
Les séquences aller et retour transmises au projet par le responsable, issues de ses études et relevés, sont adoptées comme **référentiel de travail** pour la reconstruction des lignes concernées. Leur ordre, leurs occurrences, leurs noms et les répétitions sont conservés. Une répétition de nom n'est pas, à elle seule, une erreur ou un doublon à supprimer.

### Contrôles à effectuer pour les consolider
1. Contrôle de structure : nombre d'occurrences, sens, premier et dernier arrêt, champs manquants et intégrité de la séquence.
2. Contrôle de cohérence interne : continuité géographique, voisinage des repères, sens de progression et éventuelles ruptures manifestes.
3. Contrôle de correspondance : rapprochement des libellés et tronçons partagés entre lignes, sans fusionner les lignes ni mélanger les directions.
4. Contrôle des variantes : normalisation technique des accents/casse/espaces pour comparer, tout en préservant le libellé original affiché.
5. Correction uniquement lorsqu'une anomalie est démontrée par les éléments de l'étude, une incohérence interne certaine ou une preuve géographique suffisamment forte. Sinon, conserver et annoter sans bloquer.

### Place des sources externes
Les pages AFTU, CETUD, les applications de mobilité, OSM et ArcGIS servent désormais à enrichir les métadonnées, à repérer des correspondances et à signaler des anomalies précises. Elles ne constituent plus un préalable obligatoire à l'adoption des séquences fournies au projet. Une différence de terminus publiée sur une page externe est notée à part ; elle ne déclenche pas la mise en attente ou la suppression de la séquence d'étude.

La page AFTU consultée le 14 novembre 2026 affiche notamment 88 MTOA–Liberté 5 et 89 Bargny–Croisement Niague (Cité SICAP). Ces intitulés sont conservés comme métadonnées externes de référence, sans invalider les séquences directionnelles détaillées issues des études du projet. Source : https://aftu-senegal.org/infos-pratiques/.

### Décision opérationnelle
- Les listes 88, 89, 90 et 91 déjà archivées sont **adoptées comme base de travail** ; ne pas les renvoyer en statut bloquant uniquement faute de confirmation web indépendante.
- Les 70 arrêts de chacun des sens de la ligne 91, déjà validés par le responsable du projet, restent validés.
- Les comparaisons de libellés réalisées sur les lignes 88/89/91 sont des contrôles qualité utiles, pas des conditions de validation.
- Les prochaines étapes sont l'exploitation, la consolidation géographique et la préparation des données, puis la poursuite des autres lignes DDD/AFTU.
- Ne créer aucun arrêt, aucune coordonnée, aucun horaire ni aucune fréquence par supposition.
- Ne modifier ni TER/BRT, ni les données de production, ni Supabase ; aucune fusion du PR ni aucun déploiement.

**Statut de chantier : étape de mise en attente externe clôturée. Les listes d'étude sont la référence de travail et le chantier continue.**
