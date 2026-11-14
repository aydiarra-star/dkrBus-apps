# Audit croisé OSM / ArcGIS / pages officielles AFTU — 13 novembre 2026

Branche auditée : `feat/admin-stop-sequence-audit-phase-a`
Commit source : `59730d737e5cf138ccc6a84df198a74bb50f9814`
Périmètre : extraction OSM en lecture seule, couches ArcGIS DDD publiques et pages d'itinéraires AFTU publiques.

## 1. OpenStreetMap : extraction terminée

Artefact : `dakar-osm-route-candidates`, workflow 43488411135.

- 6 610 éléments OSM récupérés.
- 25 relations de lignes et 2 relations route_master.
- 23 candidates dans le périmètre Dakar ; 0 candidate hors périmètre ; 2 conflits de périmètre à conserver comme diagnostics.
- 18 relations possèdent des membres d'arrêts ordonnés, soit 522 membres.
- 7 relations n'ont pas de membres d'arrêts ordonnés.
- 4 relations sont liées à un route_master.
- 13 relations restent non appariées.
- 5 paires directionnelles candidates : lignes 4, 9, 10, B1 et 7.
- 4 paires ont des terminus inversés ; la paire 7 est associée à un route_master commun.
- 50 candidats de rapprochement stop/platform entre les deux directions.

Les relations et leurs séquences restent séparées. Une paire est une hypothèse de rapprochement, pas une validation d'itinéraire opérateur. Les membres ordonnés OSM ne sont pas réécrits et aucune direction manquante n'est fabriquée.

## 2. Rapprochement spatial des arrêts DDD OSM vers les couches ArcGIS

Artefacts : `dakar-osm-route-candidates` et `ddd-arcgis-route-stop-candidates`.
Les distances ci-dessous sont calculées entre chaque membre OSM géolocalisé d'une relation et le point ArcGIS le plus proche dans la couche d'arrêts de la même référence de ligne. Les points ArcGIS sont des candidats non ordonnés : ce calcul mesure la proximité spatiale, pas l'ordre de desserte ni l'identité certaine d'un arrêt.

| Réf. | Relation OSM | Sens indiqué par OSM | Membres OSM géolocalisés | Points ArcGIS | Plus proche à ≤30 m | Plus proche à ≤100 m |
|---|---:|---|---:|---:|---:|---:|
| 1 | 6951328 | Parcelles assainies → Leclerc | 38 | 44 | 34 | 36 |
| 4 | 6990830 | Leclerc → Liberté 5 | 34 | 30 | 2 | 14 |
| 4 | 7203970 | Liberté 5 → Leclerc | 32 | 30 | 24 | 24 |
| 7 | 6990669 | Palais → Ouakam | 31 | 33 | 7 | 17 |
| 7 | 7500475 | Ouakam → Palais 1 | 34 | 33 | 29 | 31 |
| 9 | 6996431 | Palais 1 → Liberté 6 | 32 | 36 | 8 | 23 |
| 9 | 7487218 | Liberté 6 → Palais 1 | 29 | 36 | 27 | 28 |
| 10 | 6990845 | Palais 1 → Liberté 5 | 30 | 26 | 6 | 21 |
| 10 | 7488283 | Liberté 5 → Palais 1 | 25 | 26 | 18 | 22 |
| 121 | 2792903 | terminus non renseignés | 3 | 31 | 3 | 3 |
| 121 | 6990794 | HLM Grand Yoff → Leclerc | 27 | 31 | 24 | 26 |
| 121 | 6999013 | Leclerc → HLM Grand Médine | 7 | 31 | 2 | 5 |

### Lecture prudente

- Pour les paires 4, 7, 9 et 10, une relation de chaque paire est nettement plus proche du nuage de points ArcGIS que l'autre. C'est un signal utile pour prioriser la revue géographique, mais cela ne prouve pas que la couche ArcGIS décrit exclusivement ce sens.
- Les relations OSM 1 et 121 montrent également des proximités élevées ; la ligne 121 comporte toutefois plusieurs relations portant la même référence, dont une sans terminus renseignés. Il faut conserver cette ambiguïté.
- Les écarts les plus importants ne doivent pas être forcés dans une correspondance : ils peuvent refléter des arrêts non cartographiés, des décalages, des différences de couverture ou des données OSM/ArcGIS de périodes différentes.
- Les couches de points ArcGIS ne sont pas ordonnées. Leur ordre de retour ne doit jamais devenir l'ordre des arrêts.
- Les couches de tracés ArcGIS fournissent 24 couches récupérées, 25 entités de tracé et 455 points d'arrêt ; aucune erreur d'extraction ni limite de transfert n'a été signalée. Les géométries de tracé sont conservées comme preuves de comparaison, pas comme séquences d'arrêts.

## 3. Pages officielles AFTU

Artefact : `aftu-official-route-pages`, workflow 43488411285.

- 65 pages récupérées et 65 pages avec une description d'itinéraire.
- 63 pages de lignes reliées depuis l'index et 9 pages complémentaires ciblées dans le périmètre de collecte.
- 7 URL candidates (lignes 84 à 89 et 91) ont répondu HTTP 404.
- Les descriptions récupérées sont des corridors/itinéraires textuels publiés ; elles ne fournissent pas automatiquement un ordre détaillé de chaque arrêt dans les deux sens.
- Les pages qui ne décrivent qu'un corridor restent un seul sens documenté ou une description de corridor. Ne pas fabriquer le retour en inversant la liste.

## 4. Suite opérationnelle

1. Prioriser les paires OSM 4, 7, 9 et 10 pour la revue cartographique, en affichant côte à côte les séquences indépendantes et leurs écarts aux points ArcGIS.
2. Vérifier les membres OSM non nommés par leur géométrie et leurs tags, sans leur attribuer un nom d'arrêt non sourcé.
3. Traiter séparément les ambiguïtés des références 121 et les conflits de métadonnées OSM.
4. Continuer la collecte AFTU sur les pages accessibles et garder les 7 erreurs HTTP comme erreurs de source, pas comme lignes inexistantes.
5. Ne publier aucun arrêt ou sens dans le catalogue passager sur la seule base de ces rapprochements ; exiger une validation par source opérateur et cohérence géographique.

## 5. Sécurité et limites

Audit entièrement en lecture seule. Aucune donnée passager, horaire, fréquence, direction ou arrêt n'a été modifiée. Aucun appel d'écriture Supabase et aucun déploiement. TER et BRT restent intacts. GTFS n'est pas requis et ne bloque pas ce chantier.


## 2 bis. Contrôle de l'ordre OSM sur les tracés ArcGIS

Un contrôle géométrique supplémentaire a été effectué sur les tracés polylignes ArcGIS des lignes 4, 7, 9 et 10. Chaque arrêt OSM géolocalisé a été projeté sur la polyligne correspondante ; sa position le long du tracé (chaînage) a ensuite été comparée à l'ordre des membres dans la relation OSM.

| Ligne | Relation OSM | Sens indiqué | Arrêts projetés | Médiane distance au tracé | À ≤50 m | Corrélation ordre / chaînage |
|---|---:|---|---:|---:|---:|---:|
| 4 | 6990830 | Leclerc → Liberté 5 | 34 | 19 m | 21/34 | -1,000 |
| 4 | 7203970 | Liberté 5 → Leclerc | 32 | 6 m | 25/32 | +1,000 |
| 7 | 6990669 | Palais → Ouakam | 31 | 9 m | 30/31 | -1,000 |
| 7 | 7500475 | Ouakam → Palais 1 | 34 | 6 m | 33/34 | +1,000 |
| 9 | 6996431 | Palais 1 → Liberté 6 | 32 | 8 m | 32/32 | -1,000 |
| 9 | 7487218 | Liberté 6 → Palais 1 | 29 | 6 m | 29/29 | +1,000 |
| 10 | 6990845 | Palais 1 → Liberté 5 | 30 | 6 m | 30/30 | -1,000 |
| 10 | 7488283 | Liberté 5 → Palais 1 | 25 | 5 m | 25/25 | +1,000 |

### Ce que ce contrôle établit

- Pour les quatre paires, les deux relations OSM ont des séquences ordonnées indépendantes qui suivent la même géométrie ArcGIS dans des orientations opposées.
- La corrélation de rang parfaite (+1 ou -1) signifie que l'ordre des membres OSM suit de façon monotone le chaînage du tracé dans un sens ou dans l'autre ; elle ne signifie pas que les arrêts sont tous exactement sur la ligne ni que la polyligne porte à elle seule une flèche de circulation.
- Les distances médianes de 5 à 19 m et les proportions à 50 m rendent le rapprochement géographique particulièrement solide pour ces quatre paires.
- Cette preuve croisée est nettement plus forte qu'une simple similitude de terminus ou de noms. Elle justifie de faire passer les paires 4, 7, 9 et 10 en priorité haute dans la revue des séquences directionnelles.
- Elle ne suffit toujours pas à marquer les parcours comme officiellement validés : la correspondance avec les fiches opérateur publiées, les identifiants physiques des arrêts et les éventuelles variantes doit rester documentée séparément.



## 2 ter. Extension du contrôle géométrique aux lignes 1, 23 et 121

Le même calcul de projection des membres OSM sur les polylignes ArcGIS permet de consolider trois dossiers supplémentaires :

| Ligne | Relation OSM | Sens annoncé | Arrêts OSM | Médiane au tracé | Maximum | À ≤25 m | Corrélation ordre / chaînage | Qualification |
|---|---:|---|---:|---:|---:|---:|---:|---|
| 1 | 6951328 | Parcelles → Leclerc | 38 | 5,9 m | 12,5 m | 38/38 | +0,9879 | Un seul sens géographiquement fort |
| 23 | 7108131 | Parcelles → Palais 1 | 47 | 5,8 m | 12,0 m | 47/47 | +0,9926 | Candidat aller, ref OSM mixte L23/L5 |
| 23 | 7495279 | Palais 1 → Parcelles | 51 | 8,1 m | 62,4 m | 50/51 | -0,9988 | Candidat retour, forte corroboration |
| 121 | 6990794 | HLM Grand Yoff → Leclerc | 27 | 5,4 m | 8,9 m | 27/27 | +0,9889 | Candidat partiel, terminus divergent |
| 121 | 6999013 | Leclerc → HLM Grand Medine | 7 | 4,6 m | 70,3 m | 6/7 | -0,9814 | Candidat retour partiel, terminus divergent |
| 121 | 2792903 | Fragment sans terminus | 3 | 5,4 m | 6,8 m | 3/3 | -0,9945 | Fragment partagé avec 6990794, pas une direction indépendante |

### Décisions consolidées

- **Ligne 1 :** le corridor et l'ordre du seul sens cartographié sont fortement corroborés ; le retour n'est pas présent dans les relations OSM disponibles.
- **Ligne 23 :** les deux relations suivent le tracé ArcGIS dans des directions opposées. Les différences de terminus Palais 1 / Palais 2 et la référence mixte L23/L5 restent à résoudre avant validation opérateur.
- **Ligne 121 :** deux relations partiellement ordonnées suivent le corridor en sens opposés, mais la couverture retour est incomplète et le terminus HLM Grand Medine ne correspond pas au terminus officiel Scat Urban. Le fragment 2792903 ne doit pas être compté comme une troisième direction.
- Les corrélations proches de ±1 décrivent l'ordre géométrique le long de la polyligne ; elles ne certifient ni l'identité physique de chaque arrêt, ni le service actuel, ni la validation officielle de la fiche.
- Les séquences publiées DDD restent la référence documentaire. Les membres OSM anonymes restent anonymes, les références partagées restent ambiguës et aucune liste n'est importée automatiquement dans les données passagers.

Rapports détaillés : `ddd-line-1-refreshed-osm-sequence-continuity-review-2026-11-13.md`, `ddd-line-23-two-direction-candidates-review-2026-11-13.md` et `ddd-line-121-osm-official-direction-review-2026-11-13.md`.


## 2 quater. Extension aux lignes de banlieue 217, 218, 219, 227, 228 et 232

La couche ArcGIS publique des itinéraires de banlieue contient six entités polylignes supplémentaires. Les attributs textuels successifs ont été extraits et documentés dans `ddd-suburban-lines-217-218-219-227-228-232-arcgis-corridor-review-2026-11-13.md`.

| Ligne | Segments textuels ArcGIS | Géométrie |
|---|---:|---|
| 217 | 8 | polyligne |
| 218 | 6 | polyligne |
| 219 | 9 | polyligne |
| 227 | 6 | polyligne |
| 228 | 2 | polyligne |
| 232 | 7 | polyligne |

Cette extraction apporte les corridors textuels officiels/cartographiques et leurs géométries. Elle ne constitue pas une séquence exhaustive d'arrêts et ne sépare pas les deux sens. Les champs ArcGIS ne doivent donc pas être transformés en arrêts passagers ni inversés artificiellement pour fabriquer un retour. La ligne 228 est particulièrement incomplète (deux segments seulement). Les six lignes restent en revue documentaire avant toute publication.

## 2 quinquies. Revue ciblée des lignes DDD 1, 6, 12, 13, 16B et 121 — 14 novembre 2026

Une revue croisée de la nouvelle extraction OSM et des couches ArcGIS a été ajoutée dans `docs/ddd-priority-lines-6-12-13-16b-121-arcgis-osm-review-2026-11-14.md`. Elle détaille notamment le conflit de terminus des deux pages officielles pour la ligne 6, les couches de points et de tracés des lignes 6 et 13, les anciens corridors ArcGIS 12 et 16B (métadonnées de tracé de décembre 2017), ainsi que les limites directionnelles des lignes 1 et 121. Aucun de ces rapprochements n'a été promu automatiquement au catalogue passager.

## 2 sexies. Lignes DDD sans groupe ArcGIS de même code — couverture OSM et ambiguïté 18/20 (14 novembre 2026)

La revue des 17 codes sans groupe de points ArcGIS de même code et de l'extraction OSM du 14 novembre est documentée dans `docs/ddd-missing-arcgis-groups-osm-coverage-review-2026-11-14.md`. Elle met en évidence que les tracés ArcGIS 18 et 20 sont presque superposés (distance de Hausdorff ~25,1 m) et que les 44 points de la couche 18 sont proches des deux géométries : ils ne peuvent pas être attribués à la ligne 20 ni utilisés pour distinguer les deux circuits. La relation OSM 18 ne contient aucun arrêt ordonné et aucune relation 20 n'a été trouvée. Les 15 autres lignes de la matrice n'ont ni géométrie/points ArcGIS de même code ni relation OSM de même référence dans cette extraction. Aucune donnée passager n'a été modifiée.

## 2 septies. Revue détaillée des lignes 1, 6, 12, 13, 16B et 121 (14 novembre 2026)

Voir `docs/ddd-priority-lines-6-12-13-16b-121-arcgis-osm-review-2026-11-14.md` pour les mesures de projection et les divergences, notamment le conflit des deux pages officielles DDD pour la ligne 6 et les couches historiques des lignes 12 et 16B.

## 2 octies. Contrôle institutionnel du guide officiel JOJ/CETUD (14 novembre 2026)

Le rapport des lignes prioritaires a été complété après examen du guide officiel de mobilité JOJ Dakar 2026, portant les logos MITTA, Dakar 2026 et CETUD. Pour la ligne DDD 6, cette source ajoute une troisième variante de terminus (Cambérène–Palais 1), en plus des deux pages DDD qui divergent déjà (Cambérène 2–Palais 2 et Guédiawaye–Palais 1). Le conflit est donc confirmé, pas résolu. Le guide liste aussi des sélections AFTU par site de compétition, mais elles ne constituent pas un annuaire exhaustif : l'absence de 88/89/91 ne permet aucune conclusion sur leur existence. Aucune donnée passager n'a été modifiée.

Voir l'addendum dans `docs/ddd-priority-lines-6-12-13-16b-121-arcgis-osm-review-2026-11-14.md`.

## 2 nonies. Vérification directe du site AFTU-Sénégal pour les lignes 88, 89 et 91 (14 novembre 2026)

La page publique AFTU-Sénégal `https://aftu-senegal.org/infos-pratiques/` confirme désormais les intitulés de corridor **88 Bargny – Croisement Niague (Cité SICAP)** et **89 APIX – Dougar**. Elle affiche aussi le numéro 91, mais sans corridor après son intitulé. Les cartes 84–91 ne donnent pas de lien de détail exploitable pour les trois lignes : aucun arrêt, tracé ordonné, retour, fréquence ou horaire n'a donc été ajouté. Le rapport détaillé a été complété dans `docs/aftu-88-89-91-mobility-apps-and-operational-sources-2026-11-14.md`. Les lignes 88 et 89 ont maintenant une source opérateur directe pour leurs terminus/corridors, mais leurs séquences restent à établir.


## 2 decies. Confirmation des séquences DDD distinctes 18 et 20 — 14 novembre 2026

La page opérateur DDD actuelle publie deux parcours circulaires distincts pour les lignes 18 et 20, avec des repères et un ordre différents. La séquence 18 passe notamment par Cité Derklé, Khar Yalla, Cité Marine, Castors, HLM et Colobane ; la séquence 20 commence par Allées Ababacar Sy, Jet d’Eau et Bourguiba, puis passe par Fann, UCAD, Gueule Tapée, Médina, Rebeuss, le port et Bel Air. Cette publication confirme la distinction des deux circuits textuels. Elle ne résout pas l'attribution géographique des 44 points ArcGIS stockés dans la couche 18 : les tracés 18 et 20 de 2017 sont presque superposés et les mêmes points sont proches des deux géométries. Les points restent donc sous leur identifiant source, sans duplication ni réattribution. Détail : `docs/ddd-priority-lines-6-12-13-16b-121-arcgis-osm-review-2026-11-14.md`.

Source opérateur : https://demdikk.sn/reseau-urbain-dakar/ (consultée le 14 novembre 2026). Aucune donnée passager n'a été modifiée.


## 2 undecies. AFTU ligne 88 — deux séquences directionnelles relevées sur le site source (14 novembre 2026)

Les deux séquences détaillées reprises du site web source indiqué pour ce chantier sont conservées indépendamment : **78 entrées à l'aller, Terminus 88 → Terminus Liberté 5**, et **81 entrées au retour, Terminus Liberté 5 → Terminus 88**. Les libellés et l'ordre affichés par le site sont préservés dans `docs/aftu-line-88-user-provided-directional-stop-lists-2026-11-14.md` ; aucune inversion, suppression ou création d'arrêt n'est appliquée.

La page d'index publique AFTU-Sénégal consultée séparément donne pour la ligne 88 le corridor « Bargny – Croisement Niague (Cité SICAP) ». Cette différence entre l'index AFTU et le site source des séquences est conservée comme divergence documentaire : elle ne conduit pas à écarter ni réécrire les deux listes. Les séquences ne sont pas encore injectées dans le catalogue passager ; le lien exact de la page source doit être rattaché à la fiche pour assurer une traçabilité complète.

**Décision provisoire :** enregistrer les deux sens séparément dans le dossier documentaire ; ne pas les injecter au catalogue passager et ne pas géocoder automatiquement les noms. Aucun horaire ni fréquence n'est associé à ces listes. Les libellés différents entre aller et retour restent distincts jusqu'à vérification.


## 2 duodecies. AFTU ligne 89 — deux séquences directionnelles relevées sur le site source (14 novembre 2026)

Les deux séquences détaillées reprises du site web source communiqué pour le chantier sont conservées séparément : **55 entrées à l'aller, Terminus 89 → Poste Courant Bargny près de la gare TER**, et **53 entrées au retour, Poste Courant Bargny près de la gare TER → Terminus 89**. Les listes complètes et leur ordre d'origine figurent dans `docs/aftu-line-89-site-source-directional-stop-lists-2026-11-14.md`.

La page d'index AFTU-Sénégal consultée séparément publie pour la ligne 89 le corridor « APIX – Dougar ». La séquence détaillée du site source communiquée ici décrit un parcours différent, passant notamment par Niague, Tivaoune Peulh, Keur Massar, Keur Mbaye Fall, Zac Mbao, Rufisque et Bargny. Les deux publications sont conservées comme sources distinctes : la différence ne justifie ni d'écarter ni de réécrire les 55 et 53 entrées. L'URL exacte de la page source doit être rattachée à la fiche pour compléter la traçabilité.

Les répétitions et variantes de noms sont préservées. Aucun arrêt, sens, horaire, fréquence ou coordonnée n'est généré à partir de l'autre direction ; aucune donnée n'est injectée dans le catalogue passager.


## Validation directionnelle AFTU 86–89 — 14 novembre 2026

Un contrôle dédié confronte les séquences capturées des lignes 86 et 87 et les listes détaillées fournies pour 88 et 89 aux corridors de l'index AFTU actuel. La règle de revue est explicite : les noms répétés sont conservés comme occurrences distinctes ; aucune suppression ou fusion sur la seule identité du libellé.

Résultat : les séquences sont conservées, mais le rattachement complet aux numéros 86, 87, 88 et 89 reste **CONFLICTING_SOURCES** :
- 86 : fichier Yeumbeul–Touba Ngayame, index AFTU Tournalou Boune–Toubab Dialaw.
- 87 : captures Bambilor–Maristes, index AFTU Bambilor–Mosquée Massalikou Djinane.
- 88 : liste détaillée Terminus 88–Liberté 5, index AFTU MTOA–Liberté 5.
- 89 : liste détaillée Terminus 89–Bargny Gare TER, index AFTU Bargny–Croisement Niague (Cité SICAP).

L'index AFTU affiche aussi désormais la ligne 91 comme APIX–Dougar. Il s'agit d'un corridor publié, pas d'une séquence détaillée validée.

Rapport détaillé : `docs/aftu-lines-86-87-88-89-validation-audit-2026-11-14.md`.

Les transcriptions et les répétitions ne sont pas supprimées. Aucun horaire/fréquence n'est validé par ce rapprochement. Pas d'écriture Supabase, pas de déploiement, pas de changement TER/BRT.


## Complément AFTU 86–89 — recoupement directionnel approfondi (14 novembre 2026)

La relecture de l'index AFTU actuel fixe les corridors de référence : 86 Tournalou Boune–Toubab Dialaw ; 87 Bambilor–Mosquée Massalikou Djinane ; 88 MTOA–Liberté 5 ; 89 Bargny–Croisement Niague (Cité SICAP). Les notes documentaires des fichiers JSON 86/87 ont été corrigées pour retirer des affectations de corridors décalées ; aucun waypoint ni horaire n'a été changé.

- **86 :** un guide indépendant d'accès à Toubab Dialaw (janvier 2026) mentionne un Tata 86 au départ de Pikine, via Rufisque, Bargny et Diamniadio. Cela renforce l'arrivée Toubab Dialaw, mais ne valide ni le départ Tournalou Boune ni la transcription Yeumbeul–Touba Ngayame (68/64). Statut de rattachement : conflit ouvert.
- **87 :** Bambilor est confirmé comme extrémité officielle et correspond à la référence des captures ; Massalikou Djinane ne correspond pas au terminus Maristes de la liste. Statut : cohérence partielle, terminus à résoudre.
- **88 :** MTOA est présent dans les deux séquences détaillées (aller rang 12 ; retour rang 71), mais les listes vont de « Terminus 88 » à Liberté 5 et ne commencent pas à MTOA. L'index officiel confirme le corridor MTOA–Liberté 5 sans expliquer cette différence. Statut : repère MTOA corroboré dans la liste, terminus exact à résoudre.
- **89 :** les listes couvrent explicitement Niague → Tivaoune Peulh → Keur Massar → Keur Mbaye Fall → Zac Mbao → Rufisque → Bargny Gare TER. C'est globalement compatible avec Bargny–Croisement Niague ; l'équivalence exacte entre « Terminus 89 » et « Croisement Niague (Cité SICAP) » reste à confirmer.

Aucun arrêt répété n'est supprimé ou fusionné. Les deux sens restent indépendants. Pas de modification du catalogue passager, des données TER/BRT, de Supabase ou de la production.


## AFTU ligne 90 — listes directionnelles transmises (14 novembre 2026)

Une transcription dédiée a été ajoutée dans [aftu-line-90-site-source-directional-stop-lists-2026-11-14.md](aftu-line-90-site-source-directional-stop-lists-2026-11-14.md). Elle conserve les deux sens indépendamment : **82 occurrences à l'aller** de Terminus 90 vers Deni Birame Ndao Nord et **82 au retour**, soit **164 occurrences directionnelles**. Les noms, répétitions, graphies et positions ont été conservés ; aucun arrêt n'a été fusionné ou supprimé.

La séquence dessine, par ses seuls libellés, un corridor général Thiaroye/Fass Mbao – Keur Massar/Jaxaay – Keur Ndiaye Lô/Sangalkam/Noflaye – Bambilor/Deni Birame Ndao. C'est un constat géographique initial, pas une validation officielle du numéro 90, des terminus ou des deux itinéraires. L'URL de la page détaillée d'origine n'est pas encore disponible dans le dossier. Aucun horaire, fréquence ou coordonnée n'a été inventé ; aucune donnée TER/BRT ni donnée passager n'a été modifiée.


## AFTU ligne 90 — validation complète des deux séquences par le responsable du projet (14 novembre 2026)

Le responsable du projet valide explicitement tous les arrêts des deux sens de la ligne 90 : 82 occurrences à l'aller (Terminus 90 → Deni Birame Ndao Nord) et 82 au retour (Deni Birame Ndao Nord → Terminus 90), soit 164 occurrences directionnelles. La capture de l'application confirme le rattachement de la ligne au réseau AFTU et affiche 82 arrêts pour le sens présenté. Les listes intégrales sont conservées dans `docs/aftu-line-90-site-source-directional-stop-lists-2026-11-14.md`. Les répétitions et variantes de noms restent intactes. Il s'agit d'une validation explicite du responsable du projet, distincte d'une certification indépendante AFTU/CETUD ; aucun horaire ou intervalle de fréquence n'est validé par cette confirmation. Aucun changement TER/BRT ni donnée passager n'est effectué.


## AFTU ligne 91 — transcription des deux sens depuis l'application CETUD (14 novembre 2026)

Le responsable du projet confirme que les deux listes sont complètes et valide explicitement toutes les occurrences transmises depuis l'application CETUD : 70 à l'aller (Losso → Terminus 91) et 70 au retour (Chez Lo électricien → Losso), soit 140 occurrences directionnelles. Elles sont conservées dans `docs/aftu-line-91-cetud-app-directional-stop-lists-2026-11-14.md`. Chaque libellé et chaque position sont conservés ; aucun dédoublonnage ni rapprochement automatique n'est effectué. La fiche ou son URL exacte n'a pas été jointe ; cette réserve de traçabilité n'annule pas la validation explicite des séquences par le responsable du projet. Le corridor dessiné par les noms passe par Dougar Peulh, Diamniadio, Bargny, Rufisque, Zac Mbao, Jaxaay et Keur Massar. Aucun horaire, fréquence ou coordonnée n'est ajouté. Aucune donnée passager ni TER/BRT n'est modifiée.


## Recherche AFTU complémentaire — lignes 86 à 91 (14 novembre 2026)

La relecture directe de l'index AFTU confirme les corridors 86 Tournalou Boune–Toubab Dialaw, 87 Bambilor–Mosquée Massalikou Djinane, 88 MTOA–Liberté 5, 89 Bargny–Croisement Niague (Cité SICAP) et 91 APIX–Dougar. L'index ne présente pas la ligne 90, tandis que la capture de l'application CETUD fournie par le responsable du projet montre explicitement « AFTU — Ligne 90 », Terminus 90 → Deni Birame Ndao Nord, 82 arrêts. Ces publications sont consignées séparément ; l'absence de la 90 dans l'index n'annule pas la preuve d'application.

Une fiche pratique indépendante de janvier 2026 mentionne un Tata 86 au départ de Pikine vers Toubab Dialaw via Rufisque, Bargny et Diamniadio. Elle corrobore l'axe vers Toubab Dialaw, mais pas le terminus Tournalou Boune ni la séquence détaillée actuellement présente dans `src/data/aftu-86-directions.json` (Yeumbeul–Touba Ngayame). Cette divergence reste ouverte et les données existantes ne sont pas réécrites.

Aucune séquence indépendante exploitable n'a été retrouvée publiquement pour les lignes 87–89 au cours de cette recherche. L'inventaire Moovit public consulté indique 64 lignes AFTU et ne livre pas de fiche vérifiable 86–89 dans les résultats examinés ; cette couverture partielle ne prouve pas l'inexistence de ces lignes.

Pour la ligne 91, l'index AFTU affiche APIX–Dougar, alors que les listes transmises depuis l'application CETUD et validées par le responsable du projet décrivent 70 occurrences Losso → Terminus 91 et 70 occurrences Chez Lo électricien → Losso. Les 140 occurrences restent validées et conservées dans leur ordre d'origine ; la divergence de terminus avec l'index officiel est enregistrée comme conflit de publications, sans réécriture ni rattachement arbitraire.

Rapport détaillé actualisé : `docs/aftu-84-91-artifact-crosscheck-2026-11-14.md`. Sources publiques consultées : index AFTU https://aftu-senegal.org/infos-pratiques/ ; CETUD AFTU https://cetud.sn/reseaux-de-transport/aftu/ ; fiche App Store CETUD Mobilités https://apps.apple.com/fr/app/cetud-mobilit%C3%A9s/id6814449080 ; inventaire Moovit https://moovitapp.com/index/fr/transport_en_commun-lines-Dakar-5996-1618038 ; fiche indépendante mentionnant Tata 86 vers Toubab Dialaw https://anafonio.sn/wp-content/uploads/2026/01/Itineraire_Detaillee_2.pdf ; fiche PassBi https://play.google.com/store/apps/details?id=com.senpassbi.app. Aucune fréquence ni aucun horaire n'est ajouté ; aucun endpoint privé n'est consulté. Aucun changement TER/BRT, passager, Supabase ou production.


## AFTU 88–91 — comparaison directionnelle des séquences (14 novembre 2026)

Le contrôle croisé exact des listes conservées dans les fiches AFTU 88, 89, 90 et 91 est détaillé dans `docs/aftu-88-91-directional-sequence-crosscheck-2026-11-14.md`.

Résultats principaux :
- **89 / 91 :** 18 libellés communs dans le même ordre relatif entre l'aller 89 et le retour 91, et les mêmes 18 dans l'autre paire de sens. Le segment commun couvre notamment Bargny, Sococim, Rufisque, P15, Sonadis, Dioutiba, Auberge L'Oustal, Avisen et Layousse. Cela ne prouve ni fusion ni renumérotation.
- **88 / 90 :** 9 libellés communs en sous-séquence entre le retour 88 et l'aller 90 ; 7 entre l'aller 88 et le retour 90. Le recoupement est concentré sur Fass Mbao / Boune / LGI Mbao. Il ne valide pas une identité de ligne.
- Aucun libellé exact normalisé commun entre 88 et 89, 88 et 91, ni 89 et 90.
- Comptages conservés : 88 = 78/81 ; 89 = 55/53 ; 90 = 82/82 ; 91 = 70/70.

La page officielle AFTU consultée directement affiche 88 = Bargny–Croisement Niague (Cité SICAP) et 89 = APIX–Dougar ; les listes détaillées 88 et 89 transmises au projet présentent d'autres terminus. Ces conflits restent ouverts et les listes ne sont ni supprimées ni réaffectées. Source : https://aftu-senegal.org/infos-pratiques/.

Aucune séquence n'est modifiée ou fusionnée. Aucun arrêt, horaire, fréquence, coordonnée ou temps de passage n'est inféré. Aucun changement TER/BRT, aucune écriture Supabase, aucun déploiement et aucune fusion.
