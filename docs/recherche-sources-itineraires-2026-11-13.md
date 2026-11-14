# Recherche de sources d’itinéraires DDD / AFTU / TATA

Date de consultation : 13 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`

Ce relevé identifie des sources consultables pour poursuivre la qualification des parcours. Il ne transforme aucune information candidate en itinéraire passager validé.

## 1. Dakar Dem Dikk (DDD)

**Source opérateur consultée :** https://demdikk.sn/reseau-urbain-dakar/

La page officielle « Réseau urbain de Dakar » publie des listes de repères dans un ordre terminus-à-terminus pour plusieurs lignes, par exemple :

- Ligne 1 : Parcelles Assainies → Place Leclerc ;
- Ligne 4 : Liberté 5 → Place Leclerc ;
- Ligne 7 : Ouakam → Palais 2 ;
- Ligne 8 : Aéroport LSS → Palais 2 ;
- Ligne 9 : Liberté 6 → Palais 2 ;
- Ligne 10 : Liberté 5 → Palais 2 ;
- Ligne 13 : Liberté 5 → Palais 2 ;
- Ligne 23 : Parcelles Assainies → Palais 1 ;
- Ligne 121 : Scat Urbam → Leclerc.

Les lignes 1, 4, 7, 8, 9, 10, 13, 18, 20, 23, 121 et d’autres parcours sont déjà transcrits dans `src/data/dddPublishedRoutes.ts` avec l’URL de la page opérateur et la date de collecte.

**Limite importante :** la page donne un ordre de repères et des terminus, mais ne fournit pas pour chaque ligne deux séquences détaillées indépendantes Aller et Retour. Les flèches entre terminus ne prouvent pas que le retour suit exactement l’ordre inverse. Les noms ne prouvent pas non plus que chaque repère a déjà été rapproché du bon identifiant d’arrêt et de ses coordonnées.

La ligne 18 apparaît deux fois dans le contenu de la page avec un parcours de type boucle. Elle doit rester un circuit documentaire et faire l’objet d’une vérification avant toute interprétation.

### Point de vigilance : lignes DDD 217 / 218 / 233 et dessertes TER

La page opérateur « Réseau urbain de Dakar », relue le 13 novembre 2026, donne pour la ligne 217 le titre **Thiaroye ↔ Ouakam**, mais sa séquence se poursuit après « Terminus Ouakam » par la route des Mamelles, la route des Almadies, Ngor et « Terminus Aéroport LSS ». La ligne 218, intitulée **Thiaroye ↔ Aéroport LSS**, publie presque la même séquence. C'est un conflit interne à la source opérateur : le registre conserve le texte publié et ajoute maintenant une note de conflit explicite ; il ne tronque pas la séquence et ne la réattribue pas à la ligne 218.

La ligne 233 est intitulée **Baux Maraîchers ↔ Palais 1**, mais la séquence détaillée publiée sur la même page finit à « Terminus Aéroport LSS ». La page officielle « Info voyageurs » confirme également le titre Baux Maraîchers ↔ Palais 1, sans donner de séquence détaillée permettant de résoudre la divergence. Le registre conserve donc les repères tels que publiés et signale le conflit dans le champ sourceConflict. Aucun terminus n'est corrigé par supposition.

La page « Info voyageurs » liste aussi les dessertes des gares TER et les lignes 501, 502A, 502B, 503A, 503B, 504A et 504B avec leurs terminus. Elles restent dans un périmètre DDD distinct ; cette recherche ne modifie ni les données ni les horaires TER.


### Complément de transcription DDD — lignes 311 et 327

La relecture de la page opérateur a également permis de transcrire deux parcours supplémentaires dans le registre officiel :

- **Ligne 311 — Lac Rose ↔ Croisement Keur Massar :** la page publie Lac Rose / Croisement Niague, Croisement Tivaouane Peulh, Terminus Keur Massar, Station Keur Massar, Croisement Keur Massar, puis « Retour vers Lac Rose ». Cette dernière mention décrit un retour sans en donner les arrêts intermédiaires : la séquence est conservée comme circuit publié, pas comme deux sens détaillés.
- **Ligne 327 — Keur Massar → Terminus Parcelles :** la page publie 11 repères ordonnés, de Terminus Keur Massar à Terminus Parcelles. Cette transcription reste un ordre publié par l'opérateur, pas deux séquences indépendantes Aller/Retour.

Les deux entrées sont ajoutées à `src/data/dddPublishedRoutes.ts`, avec date de relecture du 13 novembre 2026. Les tests vérifient leurs séquences et leur type documentaire. Aucun retour inverse n'est généré.

### Sources géographiques ArcGIS DDD retrouvées

Un service ArcGIS public distinct recense **12 couches de géométrie de lignes DDD de banlieue** : 227, 219, 218, 217, 2, 16B, 16A, 12, 232, 5, 11 et 228. Les couches sont des polylignes en EPSG:3857 ; elles permettent de comparer des corridors géographiques, mais ne sont pas des listes d'arrêts ordonnées et ne prouvent pas à elles seules le sens de circulation.

Service : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Itin%C3%A9raire_ligne_de_Banlieue_Dakar_Dem_Dikk/FeatureServer

Les métadonnées consultées indiquent notamment des données de géométrie mises à jour le 6 décembre 2017 pour les lignes 217, 218, 228 et 232, et le 25 mars 2019 pour la ligne 227. Ces couches sont donc conservées comme références historiques, pas comme preuve d'exploitation actuelle. Les couches 217 et 218 sont distinctes dans le SIG : elles pourront être comparées géométriquement sans supposer que leurs séquences textuelles sont identiques.

Le registre technique est conservé dans `src/data/dddBanlieueArcgisRegistry.ts` et ses tests dans `src/data/dddBanlieueArcgisRegistry.test.ts`. Il inventorie les 12 couches et leurs métadonnées vérifiées ; il ne télécharge pas encore les géométries et n'importe aucun arrêt dans le catalogue.

## 2. AFTU

**Source institutionnelle consultée :** https://cetud.sn/reseaux-de-transport/aftu/

Le CETUD confirme sur cette page la structure AFTU (14 GIE, 2 300 bus et 72 lignes) et met à disposition un plan cartographique officiel :

https://cetud.sn/wp-content/uploads/2024/11/plan-lignes-aftu.jpeg

La page présente ce fichier sous « Télécharger le plan des lignes ». Le lien mène à une image JPEG du plan, pas à un tableau d'horaires, pas à une liste détaillée d'arrêts et pas au fichier GTFS. La carte est une preuve visuelle des corridors et des identifiants de lignes ; elle ne fournit pas à elle seule l'ordre complet des arrêts de chaque sens. Elle sert donc au recoupement cartographique, pas à inventer les séquences Aller/Retour.


## 3. AFTU — fiches détaillées récupérées

Le site officiel AFTU ne se limite pas à une carte : les liens « Voir itinéraire » ouvrent des fiches individuelles datées. La première collecte a porté sur sept fiches ; leurs descriptions candidates sont conservées dans `src/data/aftuPublishedRouteCandidates.ts` :

| Ligne | Date affichée sur la fiche | Référence |
|---|---|---|
| 2 | 19 mai 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-2/ |
| 5 | 21 mai 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-5/ |
| 29 | 27 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-29/ |
| 30 | 27 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-30/ |
| 37 | 29 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-37/ |
| 57 | 7 juillet 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-57/ |
| 72 | 13 juillet 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-72/ |

Ces fiches décrivent des axes et repères dans un seul texte d’itinéraire. Certaines mentionnent explicitement des variantes de retour (par exemple les rues 17 et 37 sur les lignes 2 et 5), mais aucune ne suffit à elle seule à établir une séquence complète indépendante de chaque sens. Les descriptions restent donc `NEEDS_HUMAN_REVIEW` avec `SINGLE_DESCRIPTION_ONLY`. Elles ne sont pas ajoutées au catalogue passager ni transformées en horaires.

La console authentifiée affiche maintenant l’ensemble du registre AFTU dans une rubrique repliable « Fiches AFTU récupérées », avec un lien vers chaque source. Les liens permettent au relecteur humain d’ouvrir les fiches d’origine.


### Complément — huit fiches AFTU supplémentaires consultées

La page « Infos pratiques » de l'opérateur AFTU a permis d'ouvrir huit fiches supplémentaires. Les descriptions ci-dessous sont transcrites dans le registre candidat, avec la date de publication affichée par chaque fiche :

| Ligne | Date affichée | Référence |
|---|---|---|
| 24 | 21 mai 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-24/ |
| 26 | 21 mai 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-26/ |
| 31 | 27 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-31/ |
| 32 | 27 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-32/ |
| 33 | 27 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-33/ |
| 38 | 29 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-38/ |
| 39 | 29 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-39/ |
| 40 | 29 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-40/ |

Le registre contient maintenant **15 fiches AFTU** (lignes 2, 5, 24, 26, 29, 30, 31, 32, 33, 37, 38, 39, 40, 57 et 72). Une fiche de la ligne 25 n'a pas pu être récupérée pendant cette consultation ; elle n'est pas reconstituée.

Comme pour les sept premières fiches, chaque description reste `NEEDS_HUMAN_REVIEW` et `SINGLE_DESCRIPTION_ONLY`. Une description publiée dans un seul ordre ne prouve pas la séquence indépendante du retour. Les huit nouvelles fiches sont affichées dans la rubrique repliable de la console via le registre commun ; elles ne sont pas injectées dans le catalogue voyageur et ne génèrent aucun horaire.


### Complément — huit fiches AFTU supplémentaires (lignes 41 à 48)

Huit nouvelles fiches individuelles ont été consultées sur le site officiel AFTU et ajoutées au registre candidat :

| Ligne | Date affichée | Référence |
|---|---|---|
| 41 | 30 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-41/ |
| 42 | 30 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-42/ |
| 43 | 30 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-43/ |
| 44 | 30 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-44/ |
| 45 | 1 juillet 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-45/ |
| 46 | 1 juillet 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-46/ |
| 47 | 2 juillet 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-47/ |
| 48 | 2 juillet 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-48/ |

Le registre comprend désormais **23 fiches AFTU distinctes** : lignes 2, 5, 24, 26, 29, 30, 31, 32, 33, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 57 et 72.

Les fiches donnent une description d'itinéraire publiée dans un seul ordre. Elles ne constituent pas deux séquences indépendantes Aller et Retour. Elles restent toutes marquées `NEEDS_HUMAN_REVIEW` / `SINGLE_DESCRIPTION_ONLY`, séparées du catalogue voyageur et sans horaires calculés.


### Complément — fiches AFTU officielles des lignes 53 à 56

Quatre fiches supplémentaires ont été ouvertes directement sur le site AFTU. Elles portent toutes la date de publication affichée du **6 juillet 2026** :

| Ligne | Terminus affichés par la source | Référence |
|---|---|---|
| 53 | Keur Massar (marché) – Sébikotane | https://aftu-senegal.org/map/dakar-urbain-ligne-53/ |
| 54 | Keur Massar (MTOA) – UCAD | https://aftu-senegal.org/map/dakar-urbain-ligne-54/ |
| 55 | Rufisque Sonadis – Petersen | https://aftu-senegal.org/map/dakar-urbain-ligne-55/ |
| 56 | Jaxaay 1 – Petersen | https://aftu-senegal.org/map/dakar-urbain-ligne-56/ |

Le registre contient maintenant **27 fiches officielles AFTU** : lignes 2, 5, 24, 26, 29 à 33, 37 à 48 et 53 à 57, ainsi que 72. Les lignes 49 à 52 ne sont pas ajoutées à ce stade : les sources secondaires disponibles ne remplacent pas une fiche primaire AFTU.

Comme les autres fiches, ces quatre descriptions restent candidates, en statut `NEEDS_HUMAN_REVIEW` et `SINGLE_DESCRIPTION_ONLY`. Elles ne sont pas injectées dans le catalogue voyageur et ne produisent aucun horaire.


### Complément — récupération des fiches AFTU 49 à 52

La liste officielle « Infos pratiques » de l'AFTU relie désormais directement aux quatre fiches individuelles suivantes. Les dates et les descriptions ont été relevées sur ces fiches :

| Ligne | Date affichée | Terminus décrits | Référence |
|---|---|---|---|
| 49 | 3 juillet 2026 | Gadaye – Ngor | https://aftu-senegal.org/map/dakar-urbain-ligne-49/ |
| 50 | 4 juillet 2026 | Petersen – Malika Plage | https://aftu-senegal.org/map/dakar-urbain-ligne-50/ |
| 51 | 6 juillet 2026 | Jaxaay – Gare des Baux Maraîchers | https://aftu-senegal.org/map/dakar-urbain-ligne-51/ |
| 52 | 6 juillet 2026 | Beaux Maraîchers – Jaxaay | https://aftu-senegal.org/map/dakar-urbain-ligne-52/ |

Ces quatre fiches portent le registre à **31 lignes AFTU documentées**. Les lignes 49 à 52 sont ajoutées comme fiches primaires AFTU, et non à partir des horaires ou listes secondaires de transit. Elles restent néanmoins `NEEDS_HUMAN_REVIEW` et `SINGLE_DESCRIPTION_ONLY` : elles ne prouvent pas deux séquences complètes indépendantes Aller/Retour.


### Complément — fiches AFTU officielles des lignes 58 à 63

La page officielle « Infos pratiques » a permis d'ouvrir les fiches des lignes 58 à 63. Les dates et descriptions ci-dessous proviennent des fiches AFTU :

| Ligne | Date affichée | Terminus affichés | Référence |
|---|---|---|---|
| 58 | 7 juillet 2026 | Fass Mbao (Rail-Ba) – SHAM | https://aftu-senegal.org/map/dakar-urbain-ligne-58/ |
| 59 | 7 juillet 2026 | Diamalaye – Cité Gendarmerie | https://aftu-senegal.org/map/dakar-urbain-ligne-59/ |
| 60 | 7 juillet 2026 | Colobane – Bargny | https://aftu-senegal.org/map/dakar-urbain-ligne-60/ |
| 61 | 7 juillet 2026 | Keur Massar – Almadies | https://aftu-senegal.org/map/dakar-urbain-ligne-61/ |
| 62 | 7 juillet 2026 | Arrêt Chérif (Rufisque) – Penc Mi (Gueule Tapée) | https://aftu-senegal.org/map/dakar-urbain-ligne-62/ |
| 63 | 8 juillet 2026 | Parcelles Dior – Camp Marchand Rufisque | https://aftu-senegal.org/map/dakar-urbain-ligne-63/ |

Le registre contient désormais **37 fiches officielles AFTU distinctes**. Ces fiches décrivent un seul ordre d'itinéraire ; elles ne constituent pas deux séquences indépendantes Aller/Retour. Elles restent hors du catalogue voyageurs.


### Complément — fiches AFTU officielles des lignes 64 à 69

Six nouvelles fiches ont été ouvertes depuis les liens de la page officielle « Infos pratiques » :

| Ligne | Date affichée | Terminus affichés | Référence |
|---|---|---|---|
| 64 | 8 juillet 2026 | Diamniadio – Notaire | https://aftu-senegal.org/map/dakar-urbain-ligne-64/ |
| 65 | 8 juillet 2026 | Gare routière de Colobane – Jaxaay 2 | https://aftu-senegal.org/map/dakar-urbain-ligne-65/ |
| 66 | 8 juillet 2026 | Yoff – Gorom 1 | https://aftu-senegal.org/map/dakar-urbain-ligne-66/ |
| 67 | 8 juillet 2026 | Thiawlène – Boutique Diallo (Ouakam) | https://aftu-senegal.org/map/dakar-urbain-ligne-67/ |
| 68 | 9 juillet 2026 | Sébikhotane – station Yeumbeul | https://aftu-senegal.org/map/dakar-urbain-ligne-68/ |
| 69 | 9 juillet 2026 | Diamalaye – Namora | https://aftu-senegal.org/map/dakar-urbain-ligne-69/ |

Le registre compte désormais **43 fiches officielles AFTU**. Les six nouvelles descriptions sont enregistrées comme candidates avec leur source et date. Elles ne constituent pas des séquences Aller et Retour vérifiées.


### Complément — fiches AFTU officielles des lignes 70, 71 et 73 à 75

Cinq nouvelles fiches individuelles ont été ouvertes depuis la page officielle de l'AFTU :

| Ligne | Date affichée | Terminus affichés | Référence |
|---|---|---|---|
| 70 | 12 juillet 2026 | Daroukhane Keur Serigne Assane – Jaxaay 2 | https://aftu-senegal.org/map/dakar-urbain-ligne-70/ |
| 71 | 13 juillet 2026 | Keur Massar Extension – Claudel | https://aftu-senegal.org/map/dakar-urbain-ligne-71/ |
| 73 | 13 juillet 2026 | Poste Thiaroye – Lac Rose | https://aftu-senegal.org/map/dakar-urbain-ligne-73/ |
| 74 | 13 juillet 2026 | Bargny (gare ferroviaire) – cité Cocehas | https://aftu-senegal.org/map/dakar-urbain-ligne-74/ |
| 75 | 13 juillet 2026 | Malika (cité Sonatel) – Gare routière Colobane | https://aftu-senegal.org/map/dakar-urbain-ligne-75/ |

Le registre contient désormais **48 fiches officielles AFTU**. La ligne 72 était déjà présente. Les nouvelles fiches restent des descriptions à sens unique documentaire, sans validation de séquence retour.


### Complément — fiches AFTU officielles des lignes 76 à 83

Huit fiches supplémentaires ont été ouvertes directement depuis la page AFTU :

| Ligne | Date affichée | Terminus affichés | Référence |
|---|---|---|---|
| 76 | 14 juillet 2026 | SIPRES – Cité Assurance | https://aftu-senegal.org/map/dakar-urbain-ligne-76/ |
| 77 | 14 juillet 2026 | Rufisque Cité Tacco – Liberté 5 | https://aftu-senegal.org/map/dakar-urbain-ligne-77/ |
| 78 | 14 juillet 2026 | Diamaguène – Liberté 5 | https://aftu-senegal.org/map/dakar-urbain-ligne-78/ |
| 79 | 14 juillet 2026 | Sangalkam – Cambérène | https://aftu-senegal.org/map/dakar-urbain-ligne-79/ |
| 80 | 14 juillet 2026 | Diamalaye – Darou Thioub | https://aftu-senegal.org/map/dakar-urbain-ligne-80/ |
| 81 | 14 juillet 2026 | Tawfeex – Gare des Baux Maraîchers | https://aftu-senegal.org/map/dakar-urbain-ligne-81/ |
| 82 | 14 juillet 2026 | Comico – Lat-Dior | https://aftu-senegal.org/map/dakar-urbain-ligne-82/ |
| 83 | 14 juillet 2026 | Rufisque Arafat – Zone de Captage | https://aftu-senegal.org/map/dakar-urbain-ligne-83/ |

Le registre compte désormais **56 fiches AFTU distinctes**. Elles restent des descriptions candidates à sens unique documentaire, pas des séquences Aller/Retour validées.


### Complément — neuf fiches AFTU officielles supplémentaires

Les fiches des lignes 1, 3, 4, 25, 27, 28, 34, 35 et 36 ont été récupérées via les liens « Voir itinéraire » de la page AFTU :

| Ligne | Date affichée | Référence |
|---|---|---|
| 1 | 18 mai 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-1/ |
| 3 | 21 mai 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-3/ |
| 4 | 21 mai 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-4/ |
| 25 | 21 mai 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-25/ |
| 27 | 24 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-27/ |
| 28 | 25 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-28/ |
| 34 | 27 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-34/ |
| 35 | 28 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-35/ |
| 36 | 29 juin 2026 | https://aftu-senegal.org/map/dakar-urbain-ligne-36/ |

Le registre compte désormais **65 fiches AFTU**. La fiche de la ligne 1 reproduit deux fois « rue 34 » dans son texte publié : cette répétition est conservée comme dans la source, sans suppression automatique. Elle devra être examinée par le validateur humain.

## 3. TATA

**Source secondaire consultée :** https://www.covoiturage.sn/bus-tata-itineraire/

Cette plateforme présente un répertoire de lignes TATA et des pages de détails par ligne. Deux exemples consultés :

- Ligne 1, Lat-Dior ⇔ HLM Grand Yoff : https://www.covoiturage.sn/bus-tata-itineraire/ligne/1/lat-dior/hlm-grand-yoff/
- Ligne 2, Route Principale des Parcelles Assainies ⇔ Gare Petersen : https://www.covoiturage.sn/bus-tata-itineraire/ligne/2/route-principale-des-parcelles-assainies/gare-petersen/

Ces pages contiennent des repères intermédiaires utiles pour préparer une revue. La page de la ligne 2 mentionne notamment des variantes de retour sur certaines rues. Cela confirme qu’il ne faut pas fabriquer le sens retour en inversant mécaniquement une liste.

**Limite importante :** il s’agit d’une source secondaire, non d’une publication de l’opérateur ou d’une validation CETUD. Les séquences TATA relevées doivent rester des candidates non vérifiées, avec leur URL et leur date, jusqu’à confirmation par une source primaire ou par une revue terrain documentée.


### Fiches TATA détaillées — registre séparé de l'AFTU

Deux fiches ont été ouvertes sur Covoiturage.sn, qui se présente comme un répertoire d'itinéraires TATA. Elles sont conservées dans `src/data/tataPublishedRouteCandidates.ts`, dans un registre distinct de l'AFTU :

| Réseau | Ligne | Terminus affichés | Source |
|---|---:|---|---|
| TATA | 1 | Lat-Dior – HLM Grand Yoff | https://www.covoiturage.sn/bus-tata-itineraire/ligne/1/lat-dior/hlm-grand-yoff/ |
| TATA | 2 | Route Principale des Parcelles Assainies – Gare Petersen | https://www.covoiturage.sn/bus-tata-itineraire/ligne/2/route-principale-des-parcelles-assainies/gare-petersen/ |

La fiche TATA 2 mentionne explicitement des variantes : retour par rue 17 au lieu de rue 39, et par rue 37 au lieu de rue 25. Cela confirme qu'une inversion mécanique de la liste ne suffit pas pour reconstruire le sens retour. La fiche TATA 1 décrit un seul ordre de repères et ne détaille pas de séquence retour indépendante.

**Statut :** source secondaire, `NEEDS_HUMAN_REVIEW`. Les numéros de ligne TATA ne sont jamais fusionnés avec les mêmes numéros AFTU. Les deux fiches sont affichées séparément dans la console d'administration, sans ajout au catalogue voyageurs et sans calcul d'horaires.

## 4. Décision de qualification

| Réseau | Résultat utile | Statut de travail |
|---|---|---|
| DDD | Source opérateur avec des listes ordonnées pour plusieurs lignes | Référence publiée ; sens opposé et rapprochement des arrêts à vérifier |
| AFTU | Page CETUD et carte de réseau numérotée | Référence cartographique ; ordre des arrêts et sens non établis |
| TATA | Catalogue secondaire et pages de détails de certaines lignes | Candidats secondaires ; confirmation opérateur nécessaire |

Aucune séquence nouvellement repérée dans cette recherche n’est injectée dans le catalogue voyageur par ce document.

## 5. Étapes suivantes

1. Demander au CETUD / AFTU un export ou des fiches par ligne avec les arrêts ordonnés dans les deux sens et la date d’effet.
2. Demander à Dakar Dem Dikk de confirmer les variantes et les deux sens des lignes dont la page publique ne donne qu’un ordre.
3. Demander aux responsables TATA / GIE concernés de confirmer les listes secondaires et les variantes.
4. Conserver chaque preuve, URL, date, auteur et statut dans un espace candidat distinct.
5. Rapprocher les repères textuels des identifiants d’arrêts uniquement avec preuves suffisantes.
6. Faire valider séparément chaque sens par un humain avant toute activation du calculateur ou affichage de passages.

Les horaires TER/BRT protégés restent hors périmètre. Le GTFS CETUD n’a pas été reçu et n’est pas requis pour continuer cette collecte documentaire.


## 6. Source géographique complémentaire — service ArcGIS DDD

Un service ArcGIS public intitulé **« Dem_dikk_mise_a_jour »** a été retrouvé :
https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer

Il expose deux couches utiles :
- `Arrets_Ligne_Dakar_Dem_Dikk` : points d'arrêts, avec notamment les champs `Nom_Arret`, `Nom_Ligne` et `Id`. La couche indique une dernière mise à jour des données au 24 septembre 2024.
- `Itinéraire_lignes_Dakar_Dem_Dikk` : lignes géographiques (polylignes), avec plusieurs champs de description d'itinéraire. La couche indique une dernière mise à jour des données au 11 janvier 2019.

Cette ressource est un **recoupement géographique complémentaire**, pas une preuve suffisante de l'exploitation actuelle : les dates de données sont anciennes et la page de service consultée ne suffit pas à certifier les deux sens ni les fréquences. Il faut comparer les attributs et géométries à la page opérateur actuelle et à des preuves plus récentes avant toute validation. Le service est en lecture seule dans ce chantier ; aucune opération d'édition n'est utilisée.

## 7. Lecture structurée des fiches DDD : distinguer le titre et la séquence publiée

La page officielle DDD « Réseau urbain de Dakar » publie pour chaque ligne un titre avec deux terminus et une liste ordonnée de repères. Pour certaines lignes, la liste continue après un repère nommé « Terminus » : cela peut correspondre à la description enchaînée des deux sens, à une variante ou à une incohérence de la fiche. Il ne faut donc ni tronquer automatiquement la liste au premier « Terminus », ni supposer que tout ce qui suit appartient au même sens. La séquence doit être segmentée en Aller et Retour à partir des repères et recoupements disponibles.

### Ligne 217

Le titre officiel indique **Thiaroye ↔ Ouakam**. La liste détaillée publiée sur la même page commence à Dépôt Thiaroye, passe par Sipses, Bountou Pikine, Patte d'Oie, Foire, VDN, Sipres, Ancienne Piste, Ouakam et Marché Ouakam, puis mentionne « Terminus Ouakam ». Elle continue ensuite par Route des Mamelles, Route des Almadies, Ngor et « Terminus aéroport LSS ».

La page officielle contient donc à la fois le terminus Ouakam du titre et une continuation de repères jusqu'à l'aéroport. Cette continuation ne doit pas être supprimée : elle constitue une donnée officielle publiée à structurer et à interpréter. Elle peut documenter le sens retour ou une extension/variante, mais la segmentation exacte des deux sens doit être recoupée avant de transformer cette séquence en deux listes d'arrêts définitives.

### Ligne 218

Le titre officiel indique **Thiaroye ↔ Aéroport LSS** et la liste détaillée reprend les mêmes repères jusqu'à Ngor puis Aéroport LSS. La proximité des descriptions 217 et 218 est un élément de recoupement à exploiter, et non une raison de fusionner les deux lignes.

### Ligne 233

Le titre officiel indique **Baux Maraîchers ↔ Palais 1**, tandis que la liste détaillée publiée sur la page « Réseau urbain » reprend les repères de Baux Maraîchers jusqu'à Yoff puis mentionne « Terminus Aéroport LSS ». Le titre et la séquence de la fiche ne concordent donc pas entièrement. La ligne 232 est également décrite Baux Maraîchers ↔ Aéroport LSS avec une séquence proche.

La bonne démarche consiste à conserver les deux informations officielles, à rechercher la fiche horaire/téléchargeable et les autres documents DDD/CETUD, puis à déterminer si la ligne 233 comporte une variante, un retour distinct, une ancienne erreur de titre ou une erreur de transcription. Ne pas remplacer les repères publiés et ne pas inventer une fin de parcours.

### Carte officielle CETUD

Le CETUD publie également un plan des lignes DDD :
https://cetud.sn/wp-content/uploads/2024/11/plan-lignes-ddd.jpeg

Cette carte constitue une preuve institutionnelle supplémentaire des corridors et numéros de lignes. Elle doit être rapprochée des listes textuelles DDD, sans tenter d'extraire à elle seule une séquence complète d'arrêts ou une fréquence.

La page CETUD « Dem Dikk » comporte un bouton intitulé « Télécharger les lignes et horaires », mais le lien consulté ouvre actuellement le plan cartographique JPEG ci-dessus. Il faut conserver ce constat et poursuivre la recherche d'un fichier horaire distinct.

La page officielle CETUD confirme une référence de 38 lignes DDD et une amplitude générale de 6 h à 21 h. Cette amplitude générale ne doit pas être recopiée comme un horaire précis identique à chaque ligne.

## 8. Complément AFTU — lignes officiellement listées sans fiche détaillée accessible

La page officielle AFTU « Infos pratiques » liste également les lignes suivantes, mais contrairement aux fiches 1 à 83, les entrées de ces lignes ne présentaient pas de lien individuel exploitable lors de la consultation (le texte « Voir itinéraire » apparaît sans URL) :

| Ligne | Terminus affichés sur la page officielle | Ce qui est confirmé |
|---|---|---|
| 84 | UCAD – Jaxaay | Existence de la ligne et terminus seulement |
| 85 | Banoba – Liberté 5 | Existence de la ligne et terminus seulement |
| 86 | Tournalou Boune – Toubab Dialaw | Existence de la ligne et terminus seulement |
| 87 | Bambilor – Mosquée Massalikou Djinane | Existence de la ligne et terminus seulement |
| 88 | MTOA – Liberté 5 | Existence de la ligne et terminus seulement |
| 89 | Bargny – Croisement Niague (Cité SICAP) | Existence de la ligne et terminus seulement |
| 91 | APIX – Dougar | Existence de la ligne et terminus seulement |

Source primaire : https://aftu-senegal.org/infos-pratiques/

Ces sept lignes sont désormais repérées dans la liste officielle, mais elles ne sont **pas** ajoutées au registre des fiches détaillées : aucune séquence d'arrêts ni source individuelle vérifiable n'a été récupérée. Les données secondaires parfois trouvées pour la ligne 84 (horaires et nombreux arrêts génériques) ne remplacent pas une fiche AFTU exploitable et ne permettent pas de valider la ligne. Le numéro 90 n'apparaît pas dans la liste consultée ; aucune ligne 90 n'est inventée.

## 9. Recoupement documentaire DDD — cahier des charges historique

Une copie consultable sur Scribd d'un document intitulé « Cahier des charges – Dakar Dem Dikk Mars 2017/2022 » porte les mentions institutionnelles République du Sénégal, Ministère chargé des transports, CETUD et Dakar Dem Dikk. La copie est hébergée par un tiers et son authenticité/version applicable aujourd'hui n'a pas été confirmée ; elle est donc traitée comme **document historique secondaire à authentifier**, pas comme source actuelle opérateur.

Elle contient néanmoins deux recoupements intéressants :
- À la page de l'annexe réseau, la ligne 217 est décrite comme « Dépôt Thiaroye – Terminus Ouakam » avec un parcours se terminant à Ouakam.
- La ligne 218 est décrite séparément comme « Dépôt Thiaroye – Terminus Aéroport ».
- La même annexe décrit la ligne 233 comme « Baux Maraîchers – Palais 1 », ce qui concorde avec la page actuelle « Info voyageurs » DDD et contredit la séquence locale du dépôt qui finit à Aéroport LSS.
- Une annexe présente un tableau d'intervalles minimaux/maximaux pour plusieurs lignes DDD, par sens et plages horaires, ainsi que les périodes de pointe du matin (6 h 30–9 h 30) et du soir (17 h–20 h).

Référence consultée : https://fr.scribd.com/document/809401752/Cahier-Des-Charges-projet-2022

Ce document renforce l'identification des incohérences des lignes 217 et 233, mais il ne suffit pas à valider les parcours actuels ni à importer ses fréquences historiques. Il faudra obtenir la version officielle applicable ou un horaire récent DDD avant d'utiliser ces intervalles dans l'application.

## 10. Recoupement indépendant pour la ligne DDD 233

Une fiche d'itinéraire tierce (TransitRun) décrit la ligne DDD 233 comme « Gare Palais – Gare Baux Maraîchers », avec 39 arrêts et un calendrier de service. Cette source secondaire concorde sur les terminus avec la page officielle DDD « Info voyageurs », mais ne remplace pas la source opérateur pour valider l'ordre complet ni les fréquences actuelles.

Référence : https://transitrun.com/fr/public-transit-line_233_226860

**Décision provisoire :** l'identité et les terminus actuels de la ligne 233 sont corroborés par la page opérateur et une source indépendante, et confortés par le document historique. La séquence actuellement stockée dans le dépôt, qui finit à Aéroport LSS, reste néanmoins en conflit et ne peut pas être validée. Les 39 arrêts tiers ne seront pas importés tant qu'ils n'auront pas été recoupés avec une source officielle actuelle.


## 11. Référentiel institutionnel GTFS du CETUD

La page officielle du système de données du CETUD confirme que le CETUD a créé des fichiers GTFS pour le réseau de transport collectif de Dakar. Le CETUD indique que ces fichiers contiennent les horaires, arrêts, itinéraires, trajets, tarifs et services :
https://cetud.sn/observatoire/systeme-de-donnees/

La même page précise que les données d'exploitation des réseaux classiques AFTU et DDD proviennent de plateformes dédiées (CAPTRANS) et/ou d'enquêtes auprès des opérateurs. Cela confirme l'existence d'un référentiel GTFS institutionnel, mais la page consultée ne donne pas de lien direct de téléchargement du fichier GTFS.

**Contrôle des boutons « Je télécharge » sur les pages réseau du CETUD (13 novembre 2026) :**
- AFTU : https://cetud.sn/reseaux-de-transport/aftu/ → le bouton « Je télécharge » ouvre le plan cartographique JPEG https://cetud.sn/wp-content/uploads/2024/11/plan-lignes-aftu.jpeg.
- DDD : https://cetud.sn/reseaux-de-transport/ddd/ → le bouton « Je télécharge » ouvre le plan cartographique JPEG https://cetud.sn/wp-content/uploads/2024/11/plan-lignes-ddd.jpeg.

Ces deux téléchargements sont des cartes de lignes, pas le GTFS. Il ne faut donc pas les enregistrer ni les annoncer comme des fichiers horaires GTFS. Les cartes sont néanmoins des sources institutionnelles utiles pour le contrôle visuel des corridors et des identifiants de lignes.

**État de récupération :** l'existence du GTFS est confirmée par le CETUD ; le fichier lui-même n'est pas encore récupéré dans le dépôt. La recherche continue sur les espaces de données, publications et canaux institutionnels du CETUD. Ne pas dire que le GTFS n'existe pas ; dire uniquement qu'il n'a pas encore été obtenu.

## 12. Vérification complémentaire des fiches AFTU 84 à 91

La page officielle AFTU « Infos pratiques » confirme les entrées et terminus suivants : 84 (UCAD – Jaxaay), 85 (Banoba – Liberté 5), 86 (Tournalou Boune – Toubab Dialaw), 87 (Bambilor – Mosquée Massalikou Djinane), 88 (MTOA – Liberté 5), 89 (Bargny – Croisement Niague / Cité SICAP) et 91 (APIX – Dougar).

Sur la page consultée, ces entrées affichent « Voir itinéraire » sans lien individuel cliquable. La page confirme donc les identités publiées et les terminus, mais pas à elle seule les séquences intermédiaires ni les fréquences propres à chaque ligne.

Source primaire : https://aftu-senegal.org/infos-pratiques/

### Contrôle des lignes 84 et 85 dans le dépôt

- **AFTU 84 :** le responsable du projet a transmis les données de parcours issues du CETUD pour les deux sens. Le fichier src/data/aftu-84-directions.json conserve désormais deux séquences distinctes de **73 arrêts à l'aller et 73 arrêts au retour**. Le retour, de Delafosse Commerce à Jaxaay2 Route Du 84, contient 73 horaires fournis de 05:49 à 07:09. La fréquence de 14 minutes est également attribuée aux données CETUD transmises par le responsable du projet. Les tests vérifient les deux décomptes, les horaires et la provenance. Aucun arrêt ni horaire n'est fabriqué.
- **AFTU 85 :** le fichier src/data/aftu-85-directions.json contient 89 repères à l'aller et 95 au retour, avec des listes distinctes transmises par le responsable du projet. Ces séquences restent des candidates à recouper avec les informations publiées. La fréquence affichée (10–15 min en pointe, 15–25 min en creuse) ne doit pas être généralisée à d'autres lignes.

La fiche officielle AFTU de chaque ligne reste à exploiter lorsqu'un lien détaillé est disponible. Les données déjà fournies par le responsable du projet sont conservées et structurées ; l'absence de lien public cliquable sur la page de liste ne justifie pas de les effacer ni de les marquer comme inexistantes.

## 13. Rôle opérationnel de l'IA dans la revue

L'IA doit effectuer elle-même la recherche documentaire, ouvrir les sources primaires et historiques, transcrire fidèlement les informations, comparer les variantes, vérifier séparément les deux sens et attribuer un statut traçable lorsque les critères sont remplis. Elle ne doit pas se limiter à produire une liste de tâches pour une revue humaine.

La séparation de sécurité porte sur les écritures : l'analyse et la qualification documentaire par l'IA sont autorisées dans le périmètre du chantier ; elles n'autorisent pas une correction automatique des arrêts, une modification des données voyageurs, une écriture Supabase ou une publication. Toute donnée insuffisamment prouvée reste candidate ou en conflit.

## 14. Complément utilisateur — retour AFTU 84

Le responsable du projet a transmis le parcours retour de la ligne 84, de Delafosse Commerce à Jaxaay2 Route Du 84, avec **73 arrêts et 73 horaires**, de 05:49 à 07:09. Le parcours aller comporte également 73 arrêts.

Le référentiel conserve donc exactement **73 arrêts à l'aller et 73 arrêts au retour**. Deux noms de points qui avaient été ajoutés après le 73e arrêt retour, sans horaire associé, ont été retirés du décompte et de la séquence : ils ne font pas partie des 73 arrêts confirmés pour ce sens. Aucune heure n'est extrapolée.

### Recoupement secondaire à conserver séparément

Deux agrégateurs de transport consultés donnent pour la ligne 84 un décompte de 86 arrêts, alors que le jeu CETUD transmis pour le projet contient 73 arrêts dans chacun des deux sens : TransitByCity (données traitées le 28 mai 2026) et Moovit. TransitByCity affiche aussi 14 minutes en semaine, mais 18 minutes le samedi et le dimanche. Ces pages sont des sources secondaires et leurs décomptes peuvent inclure des points d'arrêt supplémentaires ou une autre version du parcours.

Références secondaires :
- https://transitbycity.com/fr/senegal/dakar/operators/aftu/routes/84/
- https://moovitapp.com/index/fr/transport_en_commun-line-84-Dakar-5996-1618038-18051515-0

**Décision :** ne pas remplacer les 73 arrêts CETUD fournis par le responsable du projet et ne pas modifier la fréquence de 14 minutes. Conserver le chiffre secondaire de 86 comme piste de comparaison future (noms, variantes et granularité des arrêts), sans l'importer dans le parcours validé par la source CETUD.

## 15. Fréquence AFTU 84 — source CETUD transmise

La fréquence de la ligne AFTU 84 est **un passage toutes les 14 minutes**, selon les données CETUD transmises par le responsable du projet. Elle est enregistrée dans `src/data/aftu-84-directions.json` avec `intervalMinutes: 14`, l'affichage `14 min` et le statut `CETUD_SOURCE_USER_SUPPLIED`. Le test de la ligne vérifie explicitement cette valeur et sa provenance.

## 16. Fréquences officielles observées par site et par sens — CETUD/CUREM

Le rapport officiel CETUD/CUREM « Étude de la situation de référence du projet BRT », tome 2, publié en juillet 2020, contient des relevés d'intervalles de passage issus de l'EFOV 2016. Les tableaux 48 et 49 concernent AFTU (lundi–vendredi et samedi) ; les tableaux 52 et 53 concernent DDD (lundi–vendredi et samedi). Chaque tableau distingue les passages « vers ville » et « vers banlieue ».

Ces données ont été transcrites dans `src/data/cetudFrequencyObservations.ts` et sont visibles dans la console d'audit :
- AFTU : 21 sites en semaine et 8 sites le samedi.
- DDD : 22 sites en semaine et 8 sites le samedi.
- Les valeurs sont des intervalles moyens constatés sur un site et un sens, et non des fréquences attribuées à un numéro de ligne. Elles ne doivent donc pas être généralisées à toutes les lignes qui empruntent un secteur.
- Les valeurs « nd » restent nulles ; elles ne sont pas remplacées par une moyenne.
- La source de mesure est conservée comme EFOV 2016, avec le rapport CETUD publié en juillet 2020.

Source primaire : https://cetud.sn/wp-content/uploads/2026/03/10-CETUD-ESRBRT-TOME-2_VF.pdf

Autres informations officielles relevées :
- DDD : une page institutionnelle de l'opérateur, datée du 17 novembre 2021, décrit un intervalle de planification général de 20 à 30 minutes entre deux bus. Cette indication concerne l'organisation générale et ne permet pas d'attribuer 20–30 minutes à chaque ligne. Source : https://portail.demdikk.sn/blog/ddd-1/roles-et-fonctions-des-directions-de-3d-7
- DDD / TAF TAF : la page Info voyageurs publie un parcours et des premiers/derniers départs dans les deux sens entre Ouakam, AIBD et Sphère ministérielle. Elle ne publie pas d'intervalle de fréquence. Source : https://demdikk.sn/info-voyageurs/
- AFTU : la FAQ officielle indique une circulation généralement du matin jusqu'à 21 h, avec des horaires variables selon les lignes et les zones ; elle ne publie pas de fréquence par ligne. Source : https://aftu-senegal.org/faq/
- AFTU 84 : la fréquence de 14 minutes et les 73 arrêts dans chacun des deux sens restent les données CETUD transmises par le responsable du projet, conservées séparément des observations générales de site.

Aucune fréquence observée à un carrefour ou sur un corridor n'est présentée comme une fréquence garantie à chaque arrêt d'une ligne. Pour le compte à rebours, seules les données horaires/fréquences réellement rattachées à la ligne et au sens concernés peuvent alimenter le calcul ; les autres relevés servent au recoupement et à la qualification.

## 17. Détails Aller/Retour explicitement publiés par AFTU — lignes 2 et 5

La consultation directe des fiches individuelles officielles AFTU permet de relever deux variantes de retour sans reconstruire le parcours par inversion :
- **Ligne 2 — Parcelles Assainies ↔ Petersen :** la fiche indique « Rue 39 (retour par Rue 17) » et « Rue 25 (retour par Rue 37) ».
- **Ligne 5 — Gare des Parcelles Assainies ↔ Petersen :** la fiche indique également les retours par Rue 17 et Rue 37, en regard des segments Rue 39 et Rue 25.

Ces variantes sont désormais structurées dans `src/data/aftuPublishedRouteCandidates.ts` et affichées dans la console d'audit. Elles ne constituent pas encore la liste complète de tous les arrêts du retour ; les deux lignes restent donc candidates à la vérification de leur séquence complète.

Sources primaires :
- Ligne 2 : https://aftu-senegal.org/map/dakar-urbain-ligne-2/
- Ligne 5 : https://aftu-senegal.org/map/dakar-urbain-ligne-5/

## 18. Qualification du périmètre TATA

La page officielle AFTU « Mot du Président » distingue le parc de minibus par marque : 505 minibus TATA et 402 King Long dans une phase de renouvellement, au sein du dispositif AFTU. TATA est donc une marque de véhicules présente dans le réseau AFTU, et non une preuve d'un opérateur ou d'un réseau de lignes autonome. Les lignes TATA conservées dans le projet restent un sous-ensemble candidat à rapprocher des lignes AFTU ; elles ne reçoivent pas de fréquence indépendante sans source d'exploitation spécifique.

Source primaire : https://aftu-senegal.org/mot-du-president-2/


## 4. Extraction cartographique vérifiée — ArcGIS DDD et OSM Dakar

### Résultat de l'extraction ArcGIS

Le téléchargement en lecture seule des deux FeatureServer DDD a réussi sans erreur :
- 24 couches de tracés, avec 25 objets géographiques (la couche de la ligne 8 contient deux objets) ;
- 12 couches d'arrêts urbains ;
- 455 objets-arrêts, dont 454 géolocalisés et 384 nommés ;
- aucune couche n'a dépassé la limite de transfert.

Les 455 points ne sont pas 455 arrêts physiques uniques : certains peuvent être doublons, quais opposés ou points répétés entre couches. Ils sont conservés par couche et par identifiant ArcGIS, sans fusion par proximité. Les couches de lignes sont anciennes (principalement 2017, une couche 2019) ; elles servent de base de rapprochement historique.

### Résultat de l'extraction OSM

La première recherche par mots-clés dans l'API GeoJSON n'a rien trouvé. La méthode a été corrigée en interrogeant directement Overpass dans l'emprise de Dakar, avec les relations `type=route + route=bus` et `type=route_master + route_master=bus`.

Résultat récupéré :
- 25 relations de lignes de bus ;
- 2 relations maîtres ;
- 18 relations comportant des membres d'arrêts/quais ordonnés ;
- 522 occurrences de membres d'arrêts/quais ;
- 7 relations sans arrêt/quai renseigné.

Les relations contiennent des données DDD, AFTU et TATA. Certaines étiquettes d'exploitant sont incohérentes (par exemple deux relations locales portent l'étiquette APSRTC) : elles ne sont pas supprimées, mais doivent être recoupées avec leur géométrie et leurs arrêts avant d'attribuer l'exploitant. Une relation AFTU est étiquetée `network=Tata`, ce qui donne une piste cartographique TATA à examiner, pas une preuve de fréquence.

### Rapprochement OSM ↔ arrêts ArcGIS DDD

Un rapprochement spatial de contrôle a été effectué entre les coordonnées des membres OSM et les points d'arrêt ArcGIS de la même ligne. Les résultats ci-dessous comptent les points OSM dont le point ArcGIS le plus proche est à 100 mètres ou moins ; ce sont des correspondances candidates, pas une fusion automatique.

| Ligne / sens OSM | Arrêts OSM ordonnés | Correspondances ArcGIS ≤ 100 m |
|---|---:|---:|
| DDD 1 · Parcelles → Leclerc | 38 | 36 |
| DDD 4 · Leclerc → Liberté 5 | 34 | 14 |
| DDD 4 · Liberté 5 → Leclerc | 32 | 24 |
| DDD 7 · Palais → Ouakam | 31 | 17 |
| DDD 7 · Ouakam → Palais | 34 | 31 |
| DDD 9 · Palais → Liberté 6 | 32 | 23 |
| DDD 9 · Liberté 6 → Palais | 29 | 28 |
| DDD 10 · Palais 1 → Liberté 5 | 30 | 21 |
| DDD 10 · Liberté 5 → Palais 1 | 25 | 22 |
| DDD 23 · Palais 1 → Parcelles | 51 | 32 |
| DDD 121 · HLM Grand Yoff → Leclerc | 27 | 26 |
| DDD 121 · Leclerc → HLM Grand Médine | 7 | 5 |

Le rapprochement est particulièrement fort pour plusieurs retours des lignes 4, 7, 9, 10 et 121. Il est plus faible sur certains sens, notamment DDD 4 Leclerc → Liberté 5 et DDD 7 Palais → Ouakam. Les arrêts au-delà de 100 m restent sans nom rapproché ; on ne force pas une correspondance.

### Conséquence pour le travail

Ces extractions donnent désormais une base concrète pour compléter les deux sens des lignes DDD et retrouver les arrêts géolocalisés. Les séquences OSM conservent leur ordre propre ; les noms ArcGIS ne sont associés qu'en candidats par proximité et seront comparés au texte opérateur. Les directions manquantes ne sont jamais fabriquées.

Les fréquences ne viennent pas d'OSM ni des géométries ArcGIS. Elles sont recherchées séparément dans les documents opérateur/CETUD et les observations de fréquence. Les observations par site restent des observations de site tant qu'une correspondance ligne-arrêt n'est pas établie.
