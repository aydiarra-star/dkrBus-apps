# DDD — candidats directionnels Moovit pour les lignes 7 et 13

Date de consultation : 17 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`  
Statut : **sources secondaires récentes, à rapprocher de la référence officielle DDD**. Aucun arrêt n'est activé automatiquement.

## Pourquoi cette source est ajoutée

Les pages cartographiques Moovit consultées publient des listes ordonnées distinctes selon le sens, avec une date de mise à jour affichée. Elles apportent donc une preuve directionnelle complémentaire, plus récente que la couche géographique ArcGIS DDD modifiée le 24 septembre 2024. Moovit reste une source secondaire : ses noms génériques, ses arrêts adressés et ses terminus doivent être recoupés avec DDD, ArcGIS et les autres références avant intégration.

## Ligne 7 — deux séquences distinctes trouvées

| Sens indiqué par Moovit | Départ → arrivée affichés | Occurrences | Mise à jour affichée |
|---|---|---:|---|
| Ouakam | Gare Palais → Rue Okm 60, 67 | 29 | 7 novembre 2026 |
| Palais | Rue Okm 60, 67 → Gare Palais | 27 | 14 novembre 2026 |

Pages sources :
- Sens Ouakam : https://moovitapp.com/index/fr/transport_en_commun-map-7-Dakar-5996-1618037-18051422-0
- Sens Palais : https://moovitapp.com/index/fr/transport_en_commun-map-7-Dakar-5996-1618037-18051422-1

**Contrôle à effectuer :** DDD publie la ligne 7 entre Ouakam et Palais 2, tandis que Moovit emploie « Gare Palais » et des arrêts de rue. Les deux séquences Moovit comptent 29 et 27 occurrences ; elles ne doivent pas être forcées en miroir ni fusionnées avec les 21 repères de la fiche officielle DDD. Les libellés génériques « Arrêt de bus » nécessitent une identification géographique indépendante.

## Ligne 13 — deux séquences distinctes trouvées

| Sens indiqué par Moovit | Départ → arrivée affichés | Occurrences | Mise à jour affichée |
|---|---|---:|---|
| Palais | Terminus Liberté 5 → Gare Palais | 30 | 14 novembre 2026 |
| Liberté 5 | Gare Palais → Terminus Liberté 5 | 30 | 14 novembre 2026 |

Pages sources :
- Sens Palais : https://moovitapp.com/index/fr/transport_en_commun-map-13-Dakar-5996-1618037-18051475-1
- Sens Liberté 5 : https://moovitapp.com/index/fr/transport_en_commun-map-13-Dakar-5996-1618037-18051475-0

**Contrôle à effectuer :** la fiche officielle DDD publie une séquence Liberté 5 → Palais 2 de 24 repères. Moovit publie 30 occurrences dans chaque sens, dont plusieurs libellés de rues ou arrêts génériques. Il s'agit d'une différence de granularité et possiblement de périmètre ; ne pas remplacer la liste officielle par la liste Moovit sans rapprochement arrêt par arrêt. Les deux sens Moovit restent des candidats distincts.

## Décisions de données

1. Conserver la séquence officielle DDD comme référence de parcours publiée.
2. Enregistrer Moovit comme source secondaire directionnelle récente pour les lignes 7 et 13.
3. Ne pas importer directement les libellés génériques, les arrêts de rue ou les terminus Moovit dans le catalogue passager.
4. Ne pas inverser les listes pour fabriquer un retour : conserver les pages de chaque sens comme preuves séparées.
5. Ne pas convertir les heures ou fréquences affichées par Moovit en référence DDD sans validation de l'opérateur.
6. Avant calcul de compte à rebours, identifier les arrêts communs, les écarts, les coordonnées et les temps cumulés pour chaque sens indépendamment.
7. Aucun changement aux données TER/BRT, aux horaires de production ou à Supabase.

## Prochaine étape technique

Faire le rapprochement ligne 7 et 13 entre les repères DDD officiels, les deux listes directionnelles Moovit et les couches cartographiques ArcGIS/OSM. Produire un tableau de correspondance avec le nom source, le candidat géographique, le sens, l'ordre, la méthode de correspondance et le statut. Seuls les arrêts non ambigus pourront alimenter les séquences de calcul du compte à rebours.


## Durées globales publiées par Moovit

Les pages de détail associées donnent aussi une durée totale de parcours :
- Ligne 7 vers Ouakam : environ 35 minutes ; vers Palais : environ 34 minutes.
- Ligne 13 vers Palais : environ 31 minutes ; vers Liberté 5 : environ 30 minutes.

Ces durées sont enregistrées dans `publishedJourneyDurationMinutes` pour préparer le calcul des temps cumulés. Elles ne fournissent pas les temps de passage intermédiaires à chaque arrêt. Une interpolation uniforme entre arrêts ne doit pas être présentée comme un horaire réel : il faut d'abord exploiter les horaires par arrêt disponibles sur les pages Moovit ou une source opérateur, puis qualifier la méthode et la marge d'erreur en métadonnées internes.


## Découverte importante — horaires à chaque arrêt pour la ligne 13

Les pages Moovit ne se limitent pas aux durées globales : elles possèdent des pages horaires séparées qui exposent une grille **départ par départ et arrêt par arrêt** pour les deux sens de la ligne 13.

- Liberté 5 → Palais : https://moovitapp.com/index/fr/transport_en_commun-time-13-Dakar-5996-1618037-18051475-4256271-0
  - semaine : premiers départs affichés à 06:00, derniers à 20:30 ;
  - samedi : 06:30 à 20:35.
- Palais → Liberté 5 : https://moovitapp.com/index/fr/transport_en_commun-time-13-Dakar-5996-1618037-18051475-4256270-0
  - semaine : premiers départs affichés à 06:45, derniers à 21:00 ;
  - samedi : 07:00 à 21:00.
- Les deux pages contiennent les colonnes de passage de chaque arrêt pour chaque départ programmé ; les pages consultées ne fournissent pas de grille dimanche ; aucune conclusion sur le service dominical ne doit en être déduite.

Les URL des deux grilles sont maintenant reliées aux candidats de la ligne 13 dans `src/data/dddMoovitDirectionalCandidates.ts`. C'est la première source repérée dans ce lot qui peut fournir directement des heures de passage par arrêt, au lieu de devoir interpoler une durée globale.

**Étape suivante :** extraire les deux grilles complètes, contrôler que chaque colonne correspond exactement à la séquence directionnelle, convertir les heures en minutes cumulées par arrêt et tester le prochain passage pour plusieurs heures de la journée. Ne pas substituer ces valeurs à une référence DDD officielle sans garder la provenance Moovit et vérifier les éventuelles divergences.


## Vérification technique des grilles — 17 novembre 2026

Lecture directe des deux pages horaires :
- chaque tableau présente **30 colonnes**, dans le même ordre que la séquence directionnelle candidate correspondante ;
- les premières lignes du tableau samedi ont été contrôlées : Liberté 5 → Palais commence à 06:30 et atteint le dernier arrêt à 06:55 ; Palais → Liberté 5 commence à 07:00 et atteint Liberté 5 à 07:32 ;
- les pages séparent les sections samedi et semaine ; elles ne donnent pas un intervalle uniforme, et certaines lignes présentent des départs espacés de 10, 12, 15, 17, 20 ou 25 minutes.

Les exemples des deux premières lignes sont utilisés dans les tests de non-régression du parseur nextTimetableStopPassageCountdown afin de vérifier les 30 colonnes, les terminus, les arrêts intermédiaires et l'indépendance des deux sens.

**Extraction exhaustive des tableaux consultés — 17 novembre 2026 :**
- Liberté 5 → Palais : samedi, 37 lignes de départ (06:30 à 20:35) ; semaine, 53 lignes (06:00 à 20:30).
- Palais → Liberté 5 : samedi, 43 lignes de départ (07:00 à 21:00) ; semaine, 49 lignes (06:45 à 21:00).
- Les quatre sections ont été relues jusqu'à leur dernière ligne visible ; chaque ligne de passage expose 30 colonnes, dans l'ordre des 30 occurrences de la séquence correspondante.
- Les grilles ont des cadences variables et des heures propres à chaque arrêt. Le calcul doit donc sélectionner la prochaine heure de la colonne de l'arrêt concerné, sans interpolation uniforme.
- Les pages ne fournissent pas de grille dimanche : ne pas déduire un service dominical ni fabriquer des horaires ce jour-là.

**Couverture structurée enregistrée dans le code :** les métadonnées des deux sens de la ligne 13 conservent maintenant séparément le nombre de départs et les bornes de service par jour : Liberté 5 → Palais (semaine 53, 06:00–20:30 ; samedi 37, 06:30–20:35) ; Palais → Liberté 5 (semaine 49, 06:45–21:00 ; samedi 43, 07:00–21:00). Des tests vérifient ces quatre couvertures et leur rattachement au bon sens. Ces métadonnées ne sont pas les matrices de passage elles-mêmes.

**Limite avant activation :** l'extraction exhaustive a été vérifiée dans les pages sources, mais les quatre matrices complètes ne sont pas encore intégrées comme données structurées versionnées dans le dépôt. Les tests actuels ne couvrent que des lignes d'exemple. Aucune grille ne doit donc être présentée comme intégrée ni activée dans l'application passager avant sa transcription contrôlée, ses tests de cohérence et le rapprochement de chaque colonne avec les arrêts de la séquence.


## Date de mise à jour des grilles horaires

Les deux pages horaires de la ligne 13 indiquent une dernière mise à jour le **16 novembre 2026**. Cette date est distincte de la date de mise à jour des pages cartographiques des itinéraires (14 novembre 2026). La métadonnée `timetableUpdatedOn: '2026-11-16'` est enregistrée séparément pour chacun des deux sens. Elle date la publication Moovit, pas une validation officielle par DDD.


## Renforcement des tests de passage — semaine et samedi

Les tests de non-régression couvrent désormais des lignes d'exemple distinctes pour les deux sens et pour les deux types de journée :
- Liberté 5 → Palais : première ligne samedi (06:30) et première ligne semaine (06:00), chacune sur 30 colonnes ;
- Palais → Liberté 5 : première ligne samedi (07:00) et première ligne semaine (06:45), chacune sur 30 colonnes.

Les assertions contrôlent les deux terminus et le nombre de colonnes. Cela sécurise le parseur sur les quatre combinaisons sens/jour, mais ne remplace toujours pas l'intégration des 182 lignes complètes (53 + 37 + 49 + 43) dans des matrices versionnées.


## Nouvelle découverte — grilles horaires par arrêt pour la ligne 7

Deux pages horaires Moovit distinctes ont été retrouvées pour la ligne 7. Elles présentent chacune une grille avec les heures de passage aux arrêts, dans l'ordre propre à la direction :

- Gare Palais → Ouakam : https://moovitapp.com/index/fr/transport_en_commun-time-7-Dakar-5996-1618037-18051422-4256166-0
  - dernière mise à jour affichée : **14 septembre 2026** ;
  - semaine : 05:00–22:38 ;
  - samedi : 05:00–22:44 ;
  - dimanche : 06:00–21:57 ;
  - 29 colonnes, correspondant aux 29 occurrences de la séquence candidate.
- Rue Okm 60, 67 → Gare Palais : https://moovitapp.com/index/fr/transport_en_commun-time-7-Dakar-5996-1618037-18051422-4256167-0
  - dernière mise à jour affichée : **31 août 2026** ;
  - semaine : 04:00–22:00 ;
  - samedi : 04:00–21:55 ;
  - dimanche : 05:00–22:00 ;
  - 27 colonnes, correspondant aux 27 occurrences de la séquence candidate.

Les URL, dates de publication et plages horaires sont maintenant enregistrées dans les métadonnées des deux candidats de la ligne 7, avec des tests dédiés. Les plages sont les heures de service publiées ; aucun nombre de départs n'est inventé. Les grilles montrent des heures propres à chaque arrêt, ce qui évite de répartir artificiellement la durée totale du trajet.

**Limite actuelle :** les pages sources ont des dates différentes (août et septembre 2026) et restent secondaires. Les matrices complètes de la ligne 7 ne sont pas encore transcrites dans le dépôt. Il faut les extraire par type de journée, vérifier les 29/27 colonnes et rapprocher les arrêts génériques avant tout usage passager.
