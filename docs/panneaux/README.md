# Couverture des panneaux bus par occurrence

Recette hors ligne, heure de Dakar : jeudi 19 novembre 2026, vendredi 20 (grilles distinctes), samedi 21 et dimanche 22. Elle porte sur le catalogue de l’application, **pas sur tous les arrêts physiques du Sénégal**. Pas d’édition opérateur datée chargée dans cette recette. Une minute de grille hebdomadaire est une heure **imprimée**, pas une observation du véhicule ni une course certifiée pour la date. Les observations CETUD par site ne sont pas attribuées aux lignes.

| Famille | Identités | Fiches hors alias (vides incluses) | Sans liste | Rangs d’arrêt | Avec heure fournie¹ | Décomptables en semaine² | % des rangs d’arrêt | Actifs à 19 h | Repères / secteurs exclus | Origines seules exclues |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| DDD | 48 | 111 | 4 | 1322 | 752 | 690 | 52,19 % | 374 | 600 | 53 |
| AFTU | 73 | 159 | 56 | 3584 | 1175 | 1102 | 30,75 % | 487 | 736 | 0 |
| TATA | 65 | 149 | 9 | 0 | 0 | 0 | non défini | 0 | 1458 | 0 |

**1792 / 4906 = 36,53 %** des occurrences classées « arrêts » ont au moins un décompte de semaine vérifiable. Tous types de rangs affichables inclus, le dénominateur est **7753**. Un même nom ou un même arrêt dans deux fiches conserve ses rangs. Les listes inconnues ne sont pas des arrêts de dénominateur zéro : les sens sans liste figurent ci-dessous. Un alias n’est pas une deuxième fiche. Une liste partielle n’est pas un trajet complet.

¹ Au moins une cellule sur fiche, y compris un échantillon non récurrent. ² Au moins un instant après ouverture auquel le panneau peut compter jusqu’à une cellule du rang sans franchir de lacune. Ce n’est pas une couverture de toute la journée. À 19 h, la colonne compte uniquement les temporisations actives par défaut. Une cadence ou le temps interpolé d’un rang ne satisfont pas ce critère. Pour TATA le pourcentage sur les seuls arrêts est indéfini, pas 100 %.

**Lire la matrice** : [DDD](ddd.csv), [AFTU](aftu.csv), [TATA](tata.csv). Chaque ligne donne le nom original, le rang, la variante, la provenance horaire, le nombre de cellules par jour, les secondes actives à 19 h et la raison du tiret. Par la clé `fiche`, consulter [les deux terminus, sources, portée et anomalies d’ordre](fiches.csv), puis [toutes les heures fournies, rangs et courses compris](heures.csv). La borne de transcription est la prochaine origine non recopiée : aucune promesse de dernier bus. Les 6 950 rangs des anciens modèles restent inventoriés [à part](../passages-bus-par-ligne.md). Les [quatre références 218/73](../releve-218-73.md), sans jour confirmé, restent hors voyageurs.

Reproduire sans réseau : `node scripts/audit_bus_signs.mjs --dir /tmp/panneaux` puis `diff -ru docs/panneaux /tmp/panneaux`. Le contrôle sonde chaque cellule utilisable à −1 s et à l’instant du passage, toutes les occurrences à 19 h et les fichiers non raccordés. `npm run audit:bus-screen` ouvre le composant React de chaque fiche en rendu HTML et vérifie les libellés ordonnés, les minutes et secondes de chaque rang, sans et avec les estimations. Le CSV distingue le nombre de cellules du vendredi effectivement applicable du total des grilles distinctes. Quand le libellé horaire diffère de la liste locale, les deux libellés, les rangs concernés et les deux empreintes d’ordre restent consultables.

### Cellules par type de source

| Famille | Grille semaine | Samedi | Dimanche | Vendredi distinct³ | Références isolées¹ | Observations véhicule | Courses datées | Cellules du modèle jeudi² | Dont proposées avec l’option |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| DDD | 23507 | 11312 | 9608 | 1872 | 262 | 0 | 0 | 145608 | 86508 |
| AFTU | 38429 | 21142 | 21142 | 0 | 91 | 0 | 0 | 253767 | 186981 |
| TATA | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 65400 | 65400 |

¹ Échantillons et bornes : ils peuvent recouper une colonne de la grille. Ne pas additionner ces catégories pour annoncer des passages uniques. ² Nombre de créneaux × nombre d’occurrences dans chaque variante, y compris les repères. Le choix « estimés » ne remplace jamais une grille épuisée ; le CSV par fiche distingue le modèle brut des estimations effectivement proposées. ³ Uniquement les cellules d’une grille de vendredi explicitement distincte ; ailleurs la grille « semaine » inclut le vendredi. Dans `heures.csv`, `monday-thursday` ne vaut jamais pour `friday`. Les heures de service 24:xx et 25:xx tombent le lendemain civil. Une case vide à 19 h n’est pas zéro minute.

Les 68 heures de la transcription invalidée AFTU 86 ne sont ni des heures fournies utilisables ni des observations. Voir `src/data/aftu-86-directions.json` : départ inconnu et axe à confirmer. Aucune n’est affichée ou employée pour estimer un passage.

[Inventaire de toutes les sources, y compris hors attribution](../couverture-sources-bus.md) : notamment 26 noms opérateur à la fin du tableau de la 1, et 89 / 95 rangs d’une variante 85 non appariée. Les archives PassBi (calendrier régulier terminé en 2023) et les index secondaires ne sont pas une liste actuelle des services. [19 codes DDD uniquement dans ces ZIP, terminus et rangs par variante, dont les deux groupes de la 323 sans appels joints](../../data/bus-review/exchange-call-comparison.json). Les libellés génériques sont comptés au rang imprimé, pas comme des quais localisés.

## DDD

Deux listes avec au moins deux appels (inclut variantes et listes partielles) : **1, 6, 7, 12, 16A, 16B, 23, 311, 319, 501**. Deux sens avec au moins un rang décomptable en semaine : **6, 7, 12, 16A, 16B, 23, 311, 319**.

Rangs d’arrêt exclus : Liste de l’opérateur · aucune heure par arrêt : 47 ; Extrait après Leclerc · terminus et heures non renseignés : 43 ; heures isolées sans continuité : 62 ; rang non transcrit : 118 ; aucune heure source au rang : 362.

| Fiche | Sens / variante | De → vers | Rangs | Avec heure | Décompte semaine | Modèle séparé | Portée / manque |
|---|---|---|---|---:|---:|---:|---|
| ddd:1/1 | Aller | Parcelles Assainies → Place Leclerc | 22 repères | 1 | 0 | 22 | repères / secteurs |
| ddd:1/2 | Retour | Place Leclerc → Parcelles Assainies | 1 départ seul | 1 | 0 | 1 | origine seule |
| ddd:1/3 | Aller · arrêts opérateur | T. Parcelles Assainies → T. Leclerc | 47 arrêts | 0 | 0 | 0 | liste de la fiche · Liste de l’opérateur · aucune heure par arrêt |
| ddd:1/4 | Retour · extrait opérateur | mole 1 → Sapeur Pompier PA | 43 arrêts | 0 | 0 | 0 | liste partielle · Extrait après Leclerc · terminus et heures non renseignés |
| ddd:2/1 | Aller | Terminus Daroukhane → Terminus Leclerc | 35 repères | 0 | 0 | 35 | repères / secteurs |
| ddd:2/2 | Retour | Place Leclerc → Daroukhane | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:4/1 | Aller | Terminus Liberté 5 (Dieuppeul) → Terminus Leclerc | 27 repères | 0 | 0 | 27 | repères / secteurs |
| ddd:4/2 | Retour | Place Leclerc → Liberté 5 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:5/1 | Aller | Terminus Guédiawaye → Palais 1 | 15 repères | 0 | 0 | 15 | repères / secteurs |
| ddd:5/2 | Retour | Palais 1 → Guédiawaye | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:6/1 | Aller | Cambérène 2 → Palais 2 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:6/2 | Retour | Palais 2 → Cambérène 2 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:6/3 | Aller · fiche détaillée | Terminus 6 - 79 → Gare Palais | 69 arrêts | 69 | 69 | 69 | liste de la fiche |
| ddd:6/4 | Retour · fiche détaillée | Gare Palais → Terminus 6 - 79 | 71 arrêts | 71 | 71 | 71 | liste de la fiche |
| ddd:7/1 | Aller | Terminus Ouakam → Terminus Palais 2 | 21 repères | 0 | 0 | 21 | repères / secteurs |
| ddd:7/2 | Retour | Palais 2 → Ouakam | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:7/3 | Aller · fiche hebdomadaire | Ouakam → Gare Palais | 27 arrêts | 27 | 27 | 0 | liste de la fiche |
| ddd:7/4 | Retour · fiche hebdomadaire | Gare Palais → Ouakam | 29 arrêts | 29 | 29 | 0 | liste de la fiche |
| ddd:8/1 | Aller | Terminus Aéroport LSS → Terminus Palais 2 | 28 repères | 1 | 0 | 28 | repères / secteurs |
| ddd:8/2 | Retour | Palais 2 → Aéroport LSS | 1 départ seul | 1 | 0 | 1 | origine seule |
| ddd:9/1 | Aller | Terminus Liberté 6 → Terminus Palais 2 | 24 repères | 0 | 0 | 24 | repères / secteurs |
| ddd:9/2 | Retour | Palais 2 → Liberté 6 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:10/1 | Aller | Terminus Liberté 5 (Dieuppeul) → Terminus Palais 2 | 29 repères | 0 | 0 | 29 | repères / secteurs |
| ddd:10/2 | Retour | Palais 2 → Liberté 5 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:11/1 | Aller | Terminus Keur Massar → Terminus Lat Dior | 16 repères | 0 | 0 | 16 | repères / secteurs |
| ddd:11/2 | Retour | Lat Dior → Keur Massar | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:12/1 | Aller | Terminus Guédiawaye → Palais 1 | 20 repères | 0 | 0 | 20 | repères / secteurs |
| ddd:12/2 | Retour | Palais 1 → Guédiawaye | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:12/3 | Aller · Maristes | Terminus Guédiawaye → Gare Palais | 63 arrêts | 63 | 63 | 63 | liste de la fiche |
| ddd:12/4 | Retour · Maristes | Gare Palais → Terminus De Guédiawaye | 67 arrêts | 67 | 13 | 67 | liste de la fiche |
| ddd:13/1 | Aller | Terminus Liberté 5 (Dieuppeul) → Terminus Palais 2 | 24 repères | 0 | 0 | 24 | repères / secteurs |
| ddd:13/2 | Retour | Palais 2 → Liberté 5 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:15/1 | Aller | Terminus Rufisque → Palais 1 | 18 repères | 0 | 0 | 18 | repères / secteurs |
| ddd:15/2 | Retour | Palais 1 → Terminus Rufisque | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| ddd:15A/1 | Aller | Rufisque → Palais 1 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:15A/2 | Retour | Palais 1 → Rufisque | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:15B/1 | Aller | Rufisque → Palais 1 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:15B/2 | Retour | Palais 1 → Rufisque | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:16A/1 | Aller | Terminus Malika → Palais 1 | 19 repères | 0 | 0 | 19 | repères / secteurs |
| ddd:16A/2 | Retour | Palais 1 → Malika | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:16A/3 | Aller · fiche détaillée | Terminus Malika → Gare Palais | 65 arrêts | 65 | 65 | 65 | liste de la fiche |
| ddd:16A/4 | Retour · fiche détaillée | Gare Palais → Terminus Malika | 64 arrêts | 64 | 64 | 64 | liste de la fiche |
| ddd:16B/1 | Aller | Terminus Malika → Palais 1 | 27 repères | 0 | 0 | 27 | repères / secteurs |
| ddd:16B/2 | Retour | Palais 1 → Malika | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:16B/3 | Aller · fiche détaillée | Terminus Malika → Gare Palais | 83 arrêts | 32 | 24 | 83 | liste de la fiche |
| ddd:16B/4 | Retour · fiche détaillée | Gare Palais → Arrêt De Bus | 82 arrêts | 15 | 15 | 82 | liste de la fiche |
| ddd:18/1 | Circuit | Terminus Liberté 5 (Dieuppeul) → Terminus Liberté 5 (Dieuppeul) | 42 repères | 0 | 0 | 42 | repères / secteurs |
| ddd:20/1 | Circuit | Terminus Dieuppeul → Terminus Dieuppeul | 42 repères | 0 | 0 | 42 | repères / secteurs |
| ddd:23/1 | Aller | Parcelles Assainies → Palais 1 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:23/2 | Retour | Palais 1 → Parcelles Assainies | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:23/3 | Aller · Gare Palais | Terminus Parcelles - Assainies → Gare Palais | 57 arrêts | 57 | 57 | 57 | liste de la fiche |
| ddd:23/4 | Retour · Gare Palais | Gare Palais → Terminus Parcelles - Assainies | 56 arrêts | 56 | 56 | 56 | liste de la fiche |
| ddd:121/1 | Aller | Terminus Scat Urbam → Terminus Leclerc | 25 repères | 0 | 0 | 25 | repères / secteurs |
| ddd:121/2 | Retour | Leclerc → Scat Urbam | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:208/1 | Aller | Bayakh → Rufisque | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:208/2 | Retour | Rufisque → Bayakh | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:213/1 | Aller | Gare de Rufisque → Terminus Dieuppeul | 17 repères | 0 | 0 | 17 | repères / secteurs |
| ddd:213/2 | Retour | Dieuppeul → Rufisque | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:217/1 | Aller | Thiaroye → Ouakam | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:217/2 | Retour | Ouakam → Thiaroye | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:217/3 | Aller · fiche détaillée | Terminus Rufisque → Stade Municipal | 126 arrêts | 0 | 0 | 126 | liste de la fiche |
| ddd:218/1 | Aller | Dépôt Thiaroye → Terminus Aéroport LSS | 15 repères | 1 | 0 | 15 | repères / secteurs |
| ddd:218/2 | Retour | Aéroport LSS → Thiaroye | 1 départ seul | 1 | 0 | 1 | origine seule |
| ddd:218/3 | Aller · fiche détaillée | Terminus Rufisque → Aeroport | 69 arrêts | 0 | 0 | 69 | liste de la fiche |
| ddd:219/1 | Aller | Daroukhane → Terminus Ouakam | 19 repères | 0 | 0 | 19 | repères / secteurs |
| ddd:219/2 | Retour | Ouakam → Daroukhane | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:219/3 | Retour · fiche détaillée | Stade Municipal → Gare Routière Daroukhane | 80 arrêts | 0 | 0 | 80 | liste de la fiche |
| ddd:220/1 | Aller | Terminus Rufisque → Terminus Guédiawaye | 16 repères | 0 | 0 | 16 | repères / secteurs |
| ddd:220/2 | Retour | Guédiawaye → Rufisque | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:221/1 | Aller | Terminus Gadaye (Filaos) → Terminus Almadies | 15 repères | 0 | 0 | 15 | repères / secteurs |
| ddd:221/2 | Retour | Almadies → Gadaye | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:227/1 | Aller | Terminus Keur Massar → Terminus Parcelles | 16 repères | 1 | 0 | 16 | repères / secteurs |
| ddd:227/2 | Retour | Parcelles Assainies → Keur Massar | 1 départ seul | 1 | 0 | 1 | origine seule |
| ddd:227/3 | Retour · fiche détaillée | Terminus Parcelles - Assainies → École Keur Massar | 69 arrêts | 0 | 0 | 69 | liste de la fiche |
| ddd:228/1 | Aller | Terminus Rufisque → Diamniadio Yenne | 4 repères | 0 | 0 | 4 | repères / secteurs |
| ddd:228/2 | Retour | Yenne → Rufisque | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:232/1 | Aller | Baux Maraîchers → Terminus Aéroport LSS | 15 repères | 0 | 0 | 15 | repères / secteurs |
| ddd:232/2 | Retour | Aéroport LSS → Baux Maraîchers | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:233/1 | Aller | Baux Maraîchers → Palais 1 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:233/2 | Retour | Palais 1 → Baux Maraîchers | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:234/1 | Aller | Terminus Jaxaay (Mosquée Niakoul Rab) → Leclerc | 13 repères | 0 | 0 | 13 | repères / secteurs |
| ddd:234/2 | Retour | Leclerc → Jaxaay | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:311/1 | Aller | Lac Rose / Croisement Niague → Croisement Keur Massar | 0 arrêts | 0 | 0 | 0 | sans liste · Circuit incomplet |
| ddd:311/2 | Aller · fiche RN 1 | Lac Rose → RN 1 | 42 arrêts | 42 | 42 | 42 | liste de la fiche |
| ddd:311/3 | Retour · fiche RN 1 | RN 1 → Lac Rose | 42 arrêts | 42 | 42 | 42 | liste de la fiche |
| ddd:319/1 | Aller | Liberté 6 → Ouakam | 27 arrêts | 27 | 27 | 27 | liste de la fiche |
| ddd:319/2 | Retour | Ouakam → Liberté 6 | 26 arrêts | 26 | 26 | 26 | liste de la fiche |
| ddd:327/1 | Aller | Terminus Keur Massar → Terminus Parcelles | 11 repères | 0 | 0 | 11 | repères / secteurs |
| ddd:327/2 | Retour | Terminus Parcelles → Terminus Keur Massar | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| ddd:501/1 | Aller | Port De Dakar → Terminus Palais 2 | 9 arrêts | 0 | 0 | 9 | liste de la fiche |
| ddd:501/2 | Retour | Terminus Palais 2 → Port De Dakar | 9 arrêts | 0 | 0 | 9 | liste de la fiche |
| ddd:502/1 | Circuit | Gare colobane → Gare Colobane | 8 repères | 0 | 0 | 8 | repères / secteurs |
| ddd:502A/1 | Aller | Colobane → UCAD | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:502A/2 | Retour | UCAD → Colobane | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:502B/1 | Aller | Colobane → Abass Ndao | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:502B/2 | Retour | Abass Ndao → Colobane | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:503/1 | Circuit | Gare de Colobane → Gare de Colobane | 7 repères | 0 | 0 | 7 | repères / secteurs |
| ddd:503A/1 | Aller | Colobane → Môle 8 | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:503A/2 | Retour | Môle 8 → Colobane | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:503B/1 | Aller | Colobane → Hydrocarbure | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:503B/2 | Retour | Hydrocarbure → Colobane | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:504A/1 | Aller | Gare Diamniadio → Sphère ministérielle | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:504A/2 | Retour | Sphère ministérielle → Gare Diamniadio | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:504B/1 | Aller | Sébikotane → Gare Diamniadio | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:504B/2 | Retour | Gare Diamniadio → Sébikotane | 1 départ seul | 0 | 0 | 1 | origine seule |
| ddd:TAF_TAF/1 | Aller | Ouakam → AIBD | 1 départ seul | 1 | 0 | 1 | origine seule |
| ddd:TAF_TAF/2 | Aller | Ouakam → Sphère ministérielle | 1 départ seul | 1 | 0 | 1 | origine seule |
| ddd:TAF_TAF/3 | Retour | AIBD → Ouakam | 1 départ seul | 1 | 0 | 1 | origine seule |
| ddd:TAF_TAF/4 | Retour | Sphère ministérielle → Ouakam | 1 départ seul | 1 | 0 | 1 | origine seule |
| ddd:TAF_TAF_TO1/1 | Aller | Terminus Ouakam → Palais 2 | 0 arrêts | 0 | 0 | 0 | alias · Voir la fiche TO1 |
| ddd:TO1/1 | Aller | Terminus Ouakam → Palais 2 | 10 repères | 0 | 0 | 10 | repères / secteurs |
| ddd:TO1/2 | Retour | Palais 2 → Ouakam | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |

## AFTU

Deux listes avec au moins deux appels (inclut variantes et listes partielles) : **30, 42, 57, 58, 60, 62, 64, 65, 66, 67, 68, 70, 71, 72, 73, 75, 79, 81, 82, 83, 84, 90, 86, 87, 88, 89, 91**. Deux sens avec au moins un rang décomptable en semaine : **30, 42, 57, 58, 60, 65, 66, 73, 75**.

Rangs d’arrêt exclus : aucune heure source au rang : 2138 ; heures isolées sans continuité : 73 ; Variante à confirmer : 271.

| Fiche | Sens / variante | De → vers | Rangs | Avec heure | Décompte semaine | Modèle séparé | Portée / manque |
|---|---|---|---|---:|---:|---:|---|
| aftu:1/1 | Aller | Lat Dior → HLM Grand Yoff | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:1/2 | Retour | HLM Grand Yoff → Lat Dior | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:1/3 | Aller · fiche détaillée | Gare Lat Dior → Terminus Espace HLM Grand Médine (face autoroute) | 21 repères | 0 | 0 | 21 | repères / secteurs |
| aftu:2/1 | Aller | Terminus Route principale des Parcelles Assainies → Terminus Gare Petersen | 18 repères | 0 | 0 | 18 | repères / secteurs |
| aftu:2/2 | Retour | Terminus Gare Petersen → Terminus Route principale des Parcelles Assainies | 4 repères | 0 | 0 | 4 | repères / secteurs |
| aftu:3/1 | Aller | Terminus Yoff-Village → Terminus Gare Petersen | 15 repères | 0 | 0 | 15 | repères / secteurs |
| aftu:3/2 | Retour | Petersen → Yoff | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:4/1 | Aller | Terminus Yoff-Village → Terminus Petersen | 10 repères | 0 | 0 | 10 | repères / secteurs |
| aftu:4/2 | Retour | Petersen → Yoff Village | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:5/1 | Aller | Terminus Gare des Parcelles Assainies → Terminus Petersen | 17 repères | 0 | 0 | 17 | repères / secteurs |
| aftu:5/2 | Retour | Terminus Petersen → Terminus Gare des Parcelles Assainies | 4 repères | 0 | 0 | 4 | repères / secteurs |
| aftu:24/1 | Aller | UCAD → Notaire Guédiawaye | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:24/2 | Retour | Terminus Notaire (Guédiawaye) → Terminus Université Cheikh Anta Diop | 14 repères | 0 | 0 | 14 | repères / secteurs |
| aftu:25/1 | Aller | Terminus Gare des Parcelles Assainies → Terminus Gare Petersen | 13 repères | 0 | 0 | 13 | repères / secteurs |
| aftu:25/2 | Retour | Petersen → Parcelles Assainies | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:26/1 | Aller | Parcelles Assainies → Poste Thiaroye | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:26/2 | Retour | Poste Thiaroye → Parcelles Assainies | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:26/3 | Aller · fiche détaillée | Terminus Gare des Parcelles Assainies → Terminus Guédiawaye | 8 repères | 0 | 0 | 8 | repères / secteurs |
| aftu:27/1 | Aller | Terminus Marché Boubess → Terminus Gare Petersen | 20 repères | 0 | 0 | 20 | repères / secteurs |
| aftu:27/2 | Retour | Petersen → Marché Boubess | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:28/1 | Aller | Terminus Hamo V/VI → Terminus Gare Petersen | 16 repères | 0 | 0 | 16 | repères / secteurs |
| aftu:28/2 | Retour | Petersen → Hamo V/VI | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:29/1 | Aller | Terminus Cité Nations Unies (Cambérène) → Terminus Gare Petersen | 16 repères | 0 | 0 | 16 | repères / secteurs |
| aftu:29/2 | Retour | Petersen → Cité Nations Unies (Cambérène) | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:30/1 | Aller | Guédiawaye → Gare de Colobane | 77 arrêts | 77 | 77 | 77 | liste de la fiche |
| aftu:30/2 | Retour | Gare de Colobane → Guédiawaye | 74 arrêts | 74 | 74 | 74 | liste de la fiche |
| aftu:31/1 | Aller | Terminus Tally Icotaf × Route des Niayes (Pikine) → Terminus Hôpital Abass Ndao | 15 repères | 0 | 0 | 15 | repères / secteurs |
| aftu:31/2 | Retour | Hôpital Abass Ndao → Tally Icotaf × Route des Niayes | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:32/1 | Aller | Terminus Sahm → Terminus Serigne Assane | 13 repères | 0 | 0 | 13 | repères / secteurs |
| aftu:32/2 | Retour | Serigne Assane → Sahm | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:33/1 | Aller | Terminus Colobane → Terminus Serigne Assane | 18 repères | 0 | 0 | 18 | repères / secteurs |
| aftu:33/2 | Retour | Serigne Assane → Colobane | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:34/1 | Aller | Terminus Nord Foire → Terminus Lat-Dior | 10 repères | 0 | 0 | 10 | repères / secteurs |
| aftu:34/2 | Retour | Lat Dior → Nord Foire | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:35/1 | Aller | Ngor → Pikine Texaco | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:35/2 | Retour | Terminus Pikine Texaco → Terminus Ngor | 10 repères | 0 | 0 | 10 | repères / secteurs |
| aftu:36/1 | Aller | Terminus Marché Ndiarème → Terminus Ngor | 18 repères | 0 | 0 | 18 | repères / secteurs |
| aftu:36/2 | Retour | Ngor → Marché Ndiarème | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:37/1 | Aller | Cité APIX → UCAD (Claudel) | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:37/2 | Retour | UCAD (Claudel) → Cité APIX | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:37/3 | Aller · fiche détaillée | Terminus APIX → Terminus UCAD (Claudel) | 35 repères | 0 | 0 | 35 | repères / secteurs |
| aftu:38/1 | Aller | Cité Enseignants → Terminus Sahm | 13 repères | 0 | 0 | 13 | repères / secteurs |
| aftu:38/2 | Retour | Sahm → Cité des Enseignants | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:39/1 | Aller | Terminus Lat-Dior → Terminus Diamalaye | 15 repères | 0 | 0 | 15 | repères / secteurs |
| aftu:39/2 | Retour | Diamalaye → Lat Dior | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:40/1 | Aller | Terminus Grand Mbao → Terminus Petersen | 11 repères | 0 | 0 | 11 | repères / secteurs |
| aftu:40/2 | Retour | Petersen → Grand Mbao | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:41/1 | Aller | Terminus Petersen → Terminus Étage Madiale | 21 repères | 0 | 0 | 21 | repères / secteurs |
| aftu:41/2 | Retour | Étage Madiale → Petersen | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:42/1 | Aller | Terminus Gadaye → Terminus Ouakam Baye | 14 repères | 0 | 0 | 14 | repères / secteurs |
| aftu:42/2 | Retour | Ouakam Baye → Gadaye (Guédiawaye) | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:42/3 | Aller · fiche hebdomadaire | Guédiawaye → Ouakam | 70 arrêts | 70 | 70 | 0 | liste de la fiche |
| aftu:42/4 | Retour · fiche hebdomadaire | Ouakam → Guédiawaye | 68 arrêts | 68 | 68 | 0 | liste de la fiche |
| aftu:43/1 | Aller | Terminus Ouakam → Terminus Thierno Ndiaye | 15 repères | 0 | 0 | 15 | repères / secteurs |
| aftu:43/2 | Retour | Thierno Ndiaye → Ouakam | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:44/1 | Aller | Terminus Grand Mbao → Terminus Ouakam | 13 repères | 0 | 0 | 13 | repères / secteurs |
| aftu:44/2 | Retour | Ouakam → Grand Mbao | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:45/1 | Aller | Kounoune Ngalam → Parcelles Église | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:45/2 | Retour | Parcelles Église → Kounoune Ngalam | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:45/3 | Aller · fiche détaillée | Terminus Kounoune Ngalam → Terminus 63 | 34 repères | 0 | 0 | 34 | repères / secteurs |
| aftu:46/1 | Aller | Terminus SDE Serigne Assane → Terminus Lat-Dior | 20 repères | 0 | 0 | 20 | repères / secteurs |
| aftu:46/2 | Retour | Lat Dior → SDE Serigne Assane | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:47/1 | Aller | Terminus Gare Lat-Dior → Terminus Almadies | 15 repères | 0 | 0 | 15 | repères / secteurs |
| aftu:47/2 | Retour | Almadies → Lat Dior | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:48/1 | Aller | Terminus Cité Serigne Mansour → Terminus Lat-Dior | 12 repères | 0 | 0 | 12 | repères / secteurs |
| aftu:48/2 | Retour | Lat Dior → Cité Serigne Mansour | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:49/1 | Aller | Terminus Gadaye → Terminus Ngor | 22 repères | 0 | 0 | 22 | repères / secteurs |
| aftu:49/2 | Retour | Ngor → Gadaye | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:50/1 | Aller | Petersen → Malika Cimetière | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:50/2 | Retour | Malika Cimetière → Petersen | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:50/3 | Aller · fiche détaillée | Terminus Petersen → Terminus Malika Plage | 20 repères | 0 | 0 | 20 | repères / secteurs |
| aftu:51/1 | Aller | Terminus Jaxaay → Terminus Gare des Baux Maraîchers | 10 repères | 0 | 0 | 10 | repères / secteurs |
| aftu:51/2 | Retour | Gare des Baux Maraîchers → Jaxaay | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:52/1 | Aller | Bountou Pikine → Keur Massar | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:52/2 | Retour | Keur Massar → Bountou Pikine | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:52/3 | Aller · fiche détaillée | Terminus Baux Maraîchers → Terminus Jaxaay | 13 repères | 0 | 0 | 13 | repères / secteurs |
| aftu:53/1 | Aller | Terminus Keur Massar (Marché) → Terminus Sébikotane | 16 repères | 0 | 0 | 16 | repères / secteurs |
| aftu:53/2 | Retour | SébiKotane → Keur Massar | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:54/1 | Aller | Terminus Keur Massar (MTOA) → Terminus Université Cheikh Anta Diop | 14 repères | 0 | 0 | 14 | repères / secteurs |
| aftu:54/2 | Retour | UCAD → Keur Massar (Cité MTOA) | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:55/1 | Aller | Terminus Rufisque Sonadis → Terminus Petersen | 13 repères | 0 | 0 | 13 | repères / secteurs |
| aftu:55/2 | Retour | Petersen → Rufisque Sonadis | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:56/1 | Aller | Jaxaay 2 → Petersen | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:56/2 | Retour | Petersen → Jaxaay 2 | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:56/3 | Aller · fiche détaillée | Terminus Jaxaay 1 → Terminus Petersen | 12 repères | 0 | 0 | 12 | repères / secteurs |
| aftu:57/1 | Aller | Rufisque → Liberté 6 | 56 arrêts | 56 | 56 | 56 | liste de la fiche |
| aftu:57/2 | Retour | Liberté 6 → Rufisque | 57 arrêts | 57 | 57 | 57 | liste de la fiche |
| aftu:58/1 | Aller | Sahm → Comico | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:58/2 | Retour | Comico → Sahm | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:58/3 | Aller | Fass Mbao → Gueule Tapée | 39 arrêts | 39 | 39 | 39 | liste de la fiche |
| aftu:58/4 | Retour | Gueule Tapée → Fass Mbao | 43 arrêts | 43 | 43 | 43 | liste de la fiche |
| aftu:59/1 | Aller | Terminus Diamalaye → Terminus Cité Gendarmerie | 15 repères | 0 | 0 | 15 | repères / secteurs |
| aftu:59/2 | Retour | Cité Gendarmerie (Jaxaay) → Diamalaye | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:60/1 | Aller | Terminus Colobane → Terminus Bargny | 11 repères | 0 | 0 | 11 | repères / secteurs |
| aftu:60/2 | Retour · fiche hebdomadaire | Bargny → Colobane | 48 arrêts | 48 | 48 | 0 | liste de la fiche |
| aftu:60/3 | Aller · fiche hebdomadaire | Colobane → Bargny | 50 arrêts | 50 | 50 | 0 | liste de la fiche |
| aftu:61/1 | Aller | Almadies → Keur Massar | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:61/2 | Retour | Terminus Keur Massar → Terminus Almadies | 10 repères | 0 | 0 | 10 | repères / secteurs |
| aftu:62/1 | Aller | Rufisque → Penc Mi | 72 arrêts | 0 | 0 | 72 | liste de la fiche |
| aftu:62/2 | Retour | Penc Mi → Rufisque | 68 arrêts | 0 | 0 | 68 | liste de la fiche |
| aftu:63/1 | Aller | Terminus Camp Marchand Rufisque → Stade LSS | 18 repères | 0 | 0 | 18 | repères / secteurs |
| aftu:63/2 | Retour | Stade LSS → Camp Marchand Rufisque | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:64/1 | Aller | Guédiawaye → Rufisque | 61 arrêts | 0 | 0 | 61 | liste de la fiche |
| aftu:64/2 | Retour | Rufisque → Guédiawaye | 61 arrêts | 0 | 0 | 61 | liste de la fiche |
| aftu:65/1 | Aller | Colobane → Jaxaay | 57 arrêts | 57 | 57 | 57 | liste de la fiche |
| aftu:65/2 | Retour | Jaxaay → Colobane | 56 arrêts | 56 | 56 | 56 | liste de la fiche |
| aftu:66/1 | Aller | Yoff → Gorom | 77 arrêts | 77 | 77 | 77 | liste de la fiche |
| aftu:66/2 | Retour | Gorom → Yoff | 77 arrêts | 77 | 77 | 77 | liste de la fiche |
| aftu:67/1 | Aller | Rufisque → Ouakam | 71 arrêts | 0 | 0 | 71 | liste de la fiche |
| aftu:67/2 | Retour | Ouakam → Rufisque | 71 arrêts | 0 | 0 | 71 | liste de la fiche |
| aftu:68/1 | Aller | Bargny → Yeumbeul | 50 arrêts | 0 | 0 | 50 | liste de la fiche |
| aftu:68/2 | Retour | Yeumbeul → Bargny | 50 arrêts | 0 | 0 | 50 | liste de la fiche |
| aftu:69/1 | Aller | Diamalaye → Terminus Tivaouane Peul | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:69/2 | Retour | Terminus Tivaouane Peul → Diamalaye | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:69/3 | Aller · fiche détaillée | Terminus Diamalaye → Terminus Namora | 15 repères | 0 | 0 | 15 | repères / secteurs |
| aftu:70/1 | Aller | Guédiawaye → Jaxaay | 58 arrêts | 0 | 0 | 58 | liste de la fiche |
| aftu:70/2 | Retour | Jaxaay → Guédiawaye | 57 arrêts | 0 | 0 | 57 | liste de la fiche |
| aftu:71/1 | Aller | Keur Massar → Fann Hock / Claudel | 54 arrêts | 0 | 0 | 54 | liste de la fiche |
| aftu:71/2 | Retour | Fann Hock / Claudel → Keur Massar | 55 arrêts | 0 | 0 | 55 | liste de la fiche |
| aftu:72/1 | Aller | Guédiawaye → Kounoune | 78 arrêts | 0 | 0 | 78 | liste de la fiche |
| aftu:72/2 | Retour | Kounoune → Guédiawaye | 78 arrêts | 0 | 0 | 78 | liste de la fiche |
| aftu:73/1 | Aller | Lac Rose → Thiaroye | 75 arrêts | 75 | 75 | 75 | liste de la fiche |
| aftu:73/2 | Retour | Thiaroye → Lac Rose | 75 arrêts | 75 | 75 | 75 | liste de la fiche |
| aftu:74/1 | Aller | Terminus Bargny (Gare ferroviaire) → Terminus Cité COCEHAS | 14 repères | 0 | 0 | 14 | repères / secteurs |
| aftu:74/2 | Retour | Terminus Cité COCEHAS → Terminus Bargny (Gare ferroviaire) | 0 arrêts | 0 | 0 | 0 | sans liste · Retour non confirmé |
| aftu:75/1 | Aller | Yeumbeul → Gare de Colobane | 52 arrêts | 52 | 52 | 52 | liste de la fiche |
| aftu:75/2 | Retour | Gare de Colobane → Yeumbeul | 51 arrêts | 51 | 51 | 51 | liste de la fiche |
| aftu:76/1 | Aller | Terminus Sipres → Terminus Cité Assurance | 12 repères | 0 | 0 | 12 | repères / secteurs |
| aftu:76/2 | Retour | Cité Assurance → Sipres | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:77/1 | Aller | Terminus Rufisque Cité Tacco → Terminus Liberté 5 | 14 repères | 0 | 0 | 14 | repères / secteurs |
| aftu:77/2 | Retour | Liberté 5 → Rufisque | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:78/1 | Aller | Terminus Diamaguène → Terminus Liberté 5 | 12 repères | 0 | 0 | 12 | repères / secteurs |
| aftu:78/2 | Retour | Liberté 5 → Diamaguène | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:79/1 | Aller | Sangalkam → Cambérène | 92 arrêts | 0 | 0 | 92 | liste de la fiche |
| aftu:79/2 | Retour | Cambérène → Sangalkam | 93 arrêts | 0 | 0 | 93 | liste de la fiche |
| aftu:80/1 | Aller | Terminus Diamalaye → Terminus Darou Thioub | 17 repères | 0 | 0 | 17 | repères / secteurs |
| aftu:80/2 | Retour | Terminus Darou Thioub → Terminus Diamalaye | 0 arrêts | 0 | 0 | 0 | sans liste · Retour non confirmé |
| aftu:81/1 | Aller | Cité Tawfekh → Baux Maraîchers | 71 arrêts | 0 | 0 | 71 | liste de la fiche |
| aftu:81/2 | Retour | Baux Maraîchers → Cité Tawfekh | 71 arrêts | 0 | 0 | 71 | liste de la fiche |
| aftu:82/1 | Aller | Rebeuss → Yeumbeul | 51 arrêts | 0 | 0 | 51 | liste de la fiche |
| aftu:82/2 | Retour | Yeumbeul → Rebeuss | 49 arrêts | 0 | 0 | 49 | liste de la fiche |
| aftu:83/1 | Aller | Sonadis près du Jardin En Face Hôtel De Ville (Départ) → Zone De Captage (Terminus) | 93 arrêts | 0 | 0 | 93 | liste de la fiche |
| aftu:83/2 | Retour | Zone De Captage (Départ) → Rufisque Ville Devant La Boutique Orange À Coté De La Mairie (Terminus) | 90 arrêts | 0 | 0 | 90 | liste de la fiche |
| aftu:84/1 | Aller | Jaxaay 2 Pénitence → Terminus 84_54Derrière Ucad En Face Canal 4 | 73 arrêts | 0 | 0 | 73 | liste de la fiche |
| aftu:84/2 | Retour | Delafosse Commerce → Jaxaay2 Route Du 84 | 73 arrêts | 73 | 0 | 73 | liste de la fiche |
| aftu:90/1 | Aller | Terminus 90 (Départ) → Deni Birame Ndao Nord (Terminus) | 82 arrêts | 0 | 0 | 82 | liste de la fiche |
| aftu:90/2 | Retour | Deni Birame Ndao Nord (Départ) → Terminus 90 (Terminus) | 82 arrêts | 0 | 0 | 82 | liste de la fiche |
| aftu:85/1 | Aller | Banoba → Liberté 5 | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:85/2 | Retour | Liberté 5 → Banoba | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| aftu:86/1 | Aller | Yeumbeul (Départ) → Terminus 86 (Terminus) | 68 arrêts | 0 | 0 | 0 | variante à confirmer · Variante à confirmer |
| aftu:86/2 | Retour | Terminus 86 (Départ) → Route De Malika En Face Mairie Yeumbel Sud Et Sgbs (Terminus) | 64 arrêts | 0 | 0 | 0 | variante à confirmer · Variante à confirmer |
| aftu:87/1 | Aller | Terminus 79 87 → Maristes Terminus 87 | 68 arrêts | 0 | 0 | 0 | variante à confirmer · Variante à confirmer |
| aftu:87/2 | Retour | Maristes Terminus 87 → Terminus 79 87 | 71 arrêts | 0 | 0 | 0 | variante à confirmer · Variante à confirmer |
| aftu:88/1 | Aller | Terminus 88 → Terminus Liberté 5 | 78 arrêts | 0 | 0 | 78 | liste de la fiche |
| aftu:88/2 | Retour | Terminus Liberté 5 → Terminus 88 | 81 arrêts | 0 | 0 | 81 | liste de la fiche |
| aftu:89/1 | Aller | Terminus 89 → Poste Courant Bargny Près De La Gare Ter | 55 arrêts | 0 | 0 | 55 | liste de la fiche |
| aftu:89/2 | Retour | Poste Courant Bargny Près De La Gare Ter → Terminus 89 | 53 arrêts | 0 | 0 | 53 | liste de la fiche |
| aftu:91/1 | Aller | Losso (Départ) → Terminus 91 (Terminus) | 70 arrêts | 0 | 0 | 70 | liste de la fiche |
| aftu:91/2 | Retour | Chez Lo électricien (Départ) → Losso (Terminus) | 70 arrêts | 0 | 0 | 70 | liste de la fiche |

## TATA

Deux listes avec au moins deux appels (inclut variantes et listes partielles) : **aucune**. Deux sens avec au moins un rang décomptable en semaine : **aucun**.

Rangs d’arrêt exclus : aucun rang classé arrêt.

| Fiche | Sens / variante | De → vers | Rangs | Avec heure | Décompte semaine | Modèle séparé | Portée / manque |
|---|---|---|---|---:|---:|---:|---|
| tata:1/1 | Aller | Lat-Dior → HLM Grand Yoff | 20 repères | 0 | 0 | 20 | repères / secteurs |
| tata:1/2 | Retour · itinéraire documentaire | Terminus HLM Grand Yof (Face Autoroute) → Terminus Lat Dior | 12 repères | 0 | 0 | 0 | repères / secteurs · Repères du document · validité et heures non indiquées |
| tata:1/3 | Aller · sections 2020 | LAT DIOR → GOUYE – GA | 4 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:1/4 | Retour · sections 2020 | GOUYE – GA → LAT DIOR | 4 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:2/1 | Aller | Route Principale des Parcelles Assainies → Gare Petersen | 18 repères | 0 | 0 | 18 | repères / secteurs |
| tata:2/2 | Retour · secteurs 2020 | Petersen → Gare Parcelles | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:3/1 | Aller | Yoff-Village → Petersen | 15 repères | 0 | 0 | 15 | repères / secteurs |
| tata:3/2 | Retour · secteurs 2020 | Petersen → Yoff | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:4/1 | Aller | Yoff-Village → Petersen | 10 repères | 0 | 0 | 10 | repères / secteurs |
| tata:4/2 | Retour · secteurs 2020 | Petersen → Yoff | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:5/1 | Aller | Gare des Parcelles Assainies → Petersen | 17 repères | 0 | 0 | 17 | repères / secteurs |
| tata:5/2 | Retour · secteurs 2020 | Petersen → Terminus Parcelles | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:24/1 | Aller | Notaire Guédiawaye → Université Cheikh Anta Diop | 14 repères | 0 | 0 | 14 | repères / secteurs |
| tata:24/2 | Retour · secteurs 2020 | Fann → Guédiawaye | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:25/1 | Aller | Gare des Parcelles Assainies → Gare Petersen | 7 repères | 0 | 0 | 7 | repères / secteurs |
| tata:25/2 | Retour · secteurs 2020 | Petersen → Parcelles Assainies | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:26/1 | Aller | Gare des Parcelles Assainies → Poste Thiaroye | 13 repères | 0 | 0 | 13 | repères / secteurs |
| tata:26/2 | Retour · secteurs 2020 | Poste Thiaroye → Gare Parcelles | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:27/1 | Aller | Marché Boubess → Gare Petersen | 12 repères | 0 | 0 | 12 | repères / secteurs |
| tata:27/2 | Retour · secteurs 2020 | Petersen → Terminus Guédiawaye | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:28/1 | Aller | Hamo V/VI → Gare Petersen | 16 repères | 0 | 0 | 16 | repères / secteurs |
| tata:28/2 | Retour · secteurs 2020 | Petersen → Guédiawaye (Hamo 6) | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:29/1 | Aller | Cité Nations Unies (Cambérène) → Gare Petersen | 13 repères | 0 | 0 | 13 | repères / secteurs |
| tata:29/2 | Retour · secteurs 2020 | Petersen → Cambérène | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:30/1 | Aller | Gadaye (Guédiawaye) → Gare de Colobane | 7 repères | 0 | 0 | 7 | repères / secteurs |
| tata:30/2 | Retour · secteurs 2020 | Colobane → Gadaye Guédiawaye | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:31/1 | Aller | Tally Icotaf × Route des Niayes (Pikine) → Hôpital Abass Ndao | 15 repères | 0 | 0 | 15 | repères / secteurs |
| tata:31/2 | Retour · secteurs 2020 | Sahm → Pikine Texaco | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:32/1 | Aller | SHAM → Serigne Assane | 10 repères | 0 | 0 | 10 | repères / secteurs |
| tata:32/2 | Retour · secteurs 2020 | Serigne Assane → Sahm | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:33/1 | Aller | Colobane → Serigne Assane | 18 repères | 0 | 0 | 18 | repères / secteurs |
| tata:33/2 | Retour · secteurs 2020 | Serigne Assane → Colobane | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:34/1 | Aller | Nord-Foire → Lat-Dior | 9 repères | 0 | 0 | 9 | repères / secteurs |
| tata:34/2 | Retour · secteurs 2020 | Lat-Dior → Nord Foire | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:35/1 | Aller | Pikine Texaco → Ngor | 10 repères | 0 | 0 | 10 | repères / secteurs |
| tata:35/2 | Retour · secteurs 2020 | Ngor → Station Icotaf | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:36/1 | Aller | Marché Ndiarème → Ngor | 16 repères | 0 | 0 | 16 | repères / secteurs |
| tata:36/2 | Retour | Ngor → Marché Ndiarème | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| tata:36/3 | Aller · sections 2020 | SERIGNE ASSANE → NGOR VILLAGE | 6 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:36/4 | Retour · sections 2020 | NGOR VILLAGE → SERIGNE ASSANE | 6 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:37/1 | Aller | Diamalaye → Claudel | 29 repères | 0 | 0 | 29 | repères / secteurs |
| tata:37/2 | Retour | Claudel → Diamalaye | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| tata:37/3 | Aller · sections 2020 | APIX → CLAUDEL | 10 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:37/4 | Retour · sections 2020 | UCAD CLAUDEL → APIX | 10 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:38/1 | Aller | Cité Enseignants → SHAM | 13 repères | 0 | 0 | 13 | repères / secteurs |
| tata:38/2 | Retour · secteurs 2020 | SHAM → Cité des Enseignants | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:39/1 | Aller | Lat-Dior → Diamalaye | 13 repères | 0 | 0 | 13 | repères / secteurs |
| tata:39/2 | Retour · secteurs 2020 | Diamalaye → Lat Dior | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:40/1 | Aller | Grand Mbao → Petersen | 11 repères | 0 | 0 | 11 | repères / secteurs |
| tata:40/2 | Retour · secteurs 2020 | Petersen → SIPRES | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:41/1 | Aller | Petersen → Étage Madialé | 20 repères | 0 | 0 | 20 | repères / secteurs |
| tata:41/2 | Retour · secteurs 2020 | Guédiawaye → Petersen | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:42/1 | Aller | Gadaye → Ouakam Bayé | 15 repères | 0 | 0 | 15 | repères / secteurs |
| tata:42/2 | Retour · secteurs 2020 | Ouakam → Guédiawaye | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:43/1 | Aller | Ouakam → Thierno Ndiaye | 14 repères | 0 | 0 | 14 | repères / secteurs |
| tata:43/2 | Retour · secteurs 2020 | Thierno Ndiaye → Ouakam | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:44/1 | Aller | Grand Mbao → Ouakam | 10 repères | 0 | 0 | 10 | repères / secteurs |
| tata:44/2 | Retour · secteurs 2020 | Ouakam → Grand Mbao | 8 secteurs | 0 | 0 | 8 | repères / secteurs |
| tata:45/1 | Aller | Kounoune Ngalam → Parcelles Église | 33 repères | 0 | 0 | 33 | repères / secteurs |
| tata:45/2 | Retour · secteurs 2020 | Parcelles Église → Kounoune Ngalam | 10 secteurs | 0 | 0 | 10 | repères / secteurs |
| tata:46/1 | Aller | SDE Serigne Assane → Lat Dior | 17 repères | 0 | 0 | 17 | repères / secteurs |
| tata:46/2 | Retour · secteurs 2020 | Lat Dior → Serigne Assane | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:47/1 | Aller | Gare Lat Dior → Almadies | 15 repères | 0 | 0 | 15 | repères / secteurs |
| tata:47/2 | Retour · secteurs 2020 | Almadies → Lat Dior | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:48/1 | Aller | Cité Serigne Mansour → Lat Dior | 11 repères | 0 | 0 | 11 | repères / secteurs |
| tata:48/2 | Retour · secteurs 2020 | Lat Dior → Cité Serigne Mansour | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:49/1 | Aller | Gadaye → Ngor | 21 repères | 0 | 0 | 21 | repères / secteurs |
| tata:49/2 | Retour · secteurs 2020 | Ngor → Gadaye | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:50/1 | Aller | Petersen → Malika Cimetière | 19 repères | 0 | 0 | 19 | repères / secteurs |
| tata:50/2 | Retour | Malika Cimetière → Petersen | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| tata:50/3 | Aller · sections 2020 | PETERSEN → MALIKA | 7 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:50/4 | Retour · sections 2020 | MALIKA → PETERSEN | 7 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:51/1 | Aller | Jaxaay → Gare des Baux Maraîchers | 9 repères | 0 | 0 | 9 | repères / secteurs |
| tata:51/2 | Retour · secteurs 2020 | Gare Baux Maraîchers → Jaxaay | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:52/1 | Aller | Église Bountou Pikine → Keur Massar | 10 repères | 0 | 0 | 10 | repères / secteurs |
| tata:52/2 | Retour | Keur Massar → Église Bountou Pikine | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| tata:52/3 | Aller · sections 2020 | BAUX-MARAICHERS → JAXAAY 2 | 6 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:52/4 | Retour · sections 2020 | JAXAAY 2 → BAUX-MARAICHERS | 6 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:53/1 | Aller | Keur Massar → Sébikhotane | 16 repères | 0 | 0 | 16 | repères / secteurs |
| tata:53/2 | Retour · secteurs 2020 | Sébikhotane → Keur Massar | 9 secteurs | 0 | 0 | 9 | repères / secteurs |
| tata:53/3 | Aller · itinéraire documentaire | Lac Rose → Sébikotane | 10 repères | 0 | 0 | 0 | repères / secteurs · Repères du document · validité et heures non indiquées |
| tata:54/1 | Aller | Terminus Keur Massar (Cité MTOA) → Université Cheikh Anta Diop | 12 repères | 0 | 0 | 12 | repères / secteurs |
| tata:54/2 | Retour · secteurs 2020 | UCAD → Keur Massar MTOA | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:55/1 | Aller | Terminus Rufisque SONADIS → Petersen | 13 repères | 0 | 0 | 13 | repères / secteurs |
| tata:55/2 | Retour · secteurs 2020 | Petersen → Rufisque | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:56/1 | Aller | Jaxaay 2 → Petersen | 12 repères | 0 | 0 | 12 | repères / secteurs |
| tata:56/2 | Retour · secteurs 2020 | Petersen → Keur Massar U 11 | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:57/1 | Aller | Terminus Rufisque Gouye Mouride → Giratoire Liberté 6 | 13 repères | 0 | 0 | 13 | repères / secteurs |
| tata:57/2 | Retour · secteurs 2020 | Liberté 6 → Gouye Mouride Rufisque | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:58/1 | Aller | Fass Mbao → SHAM | 9 repères | 0 | 0 | 9 | repères / secteurs |
| tata:58/2 | Retour · secteurs 2020 | SHAM → Fass Mbao | 5 secteurs | 0 | 0 | 5 | repères / secteurs |
| tata:59/1 | Aller | Stade L.S.S → Mbarou Samba Dème (Mbeubeuss) | 14 repères | 0 | 0 | 14 | repères / secteurs |
| tata:59/2 | Retour · secteurs 2020 | Zone de recasement → Stade Amitié | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:60/1 | Aller | Colobane → Bargny | 8 repères | 0 | 0 | 8 | repères / secteurs |
| tata:60/2 | Retour · secteurs 2020 | Bargny → Colobane | 8 secteurs | 0 | 0 | 8 | repères / secteurs |
| tata:61/1 | Aller · tracé 2020 | Keur Massar → Almadies | 10 repères | 0 | 0 | 10 | repères / secteurs |
| tata:61/2 | Retour · secteurs 2020 | Almadies → Keur Massar | 8 secteurs | 0 | 0 | 8 | repères / secteurs |
| tata:62/1 | Aller · tracé 2020 | Arrêt Chérif (Rufisque) → Penc Mi | 18 repères | 0 | 0 | 18 | repères / secteurs |
| tata:62/2 | Retour · secteurs 2020 | Penc Mi → Arrêt Chérif | 8 secteurs | 0 | 0 | 8 | repères / secteurs |
| tata:63/1 | Aller · tracé 2020 | Stade LSS → Camp Marchand Rufisque | 18 repères | 0 | 0 | 18 | repères / secteurs |
| tata:63/2 | Retour | Camp Marchand Rufisque → Stade LSS | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| tata:63/3 | Aller · sections 2020 | STADE AMITIE → RUFISQUE ARAFAT | 7 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:63/4 | Retour · sections 2020 | RUFISQUE ARAFAT → STADE AMITIE | 7 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:65/1 | Aller · tracé 2020 | Gare routière de Colobane → Jaxaay 2 | 12 repères | 0 | 0 | 12 | repères / secteurs |
| tata:65/2 | Retour · secteurs 2020 | Jaxaay → Colobane | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:66/1 | Aller · tracé 2020 | Yoff → Gorom 1 | 23 repères | 0 | 0 | 23 | repères / secteurs |
| tata:66/2 | Retour · secteurs 2020 | Gorom → Yoff | 11 secteurs | 0 | 0 | 11 | repères / secteurs |
| tata:67/1 | Aller · tracé 2020 | Thiawlène → Boutique Diallo (Ouakam) | 22 repères | 0 | 0 | 22 | repères / secteurs |
| tata:67/2 | Retour · secteurs 2020 | Ouakam → Rufisque Bata | 9 secteurs | 0 | 0 | 9 | repères / secteurs |
| tata:68/1 | Aller · tracé 2020 | Sébikotane → Station Yeumbeul | 9 repères | 0 | 0 | 9 | repères / secteurs |
| tata:68/2 | Retour · secteurs 2020 | Yeumbeul → Sébikhotane | 8 secteurs | 0 | 0 | 8 | repères / secteurs |
| tata:69/1 | Aller · tracé 2020 | Terminus Diamalaye → Terminus Tivaouane Peulh | 14 repères | 0 | 0 | 14 | repères / secteurs |
| tata:69/2 | Retour · secteurs 2020 | Namora → Diamalaye | 8 secteurs | 0 | 0 | 8 | repères / secteurs |
| tata:70/1 | Aller · tracé 2020 | Terminus Daroukhane Keur Serigne Assane → Terminus Jaxaay 2 | 14 repères | 0 | 0 | 14 | repères / secteurs |
| tata:70/2 | Retour · secteurs 2020 | Jaxaay → Guédiawaye (Serigne Assane) | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:71/1 | Aller · tracé 2020 | Keur Massar Extension → Claudel | 18 repères | 0 | 0 | 18 | repères / secteurs |
| tata:71/2 | Retour · secteurs 2020 | Claudel → Maison de la Femme Keur Massar | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:72/1 | Aller · tracé 2020 | Terminus Guédiawaye Cité des Enseignants → Terminus Kounoune (Cité Cardinal Thiandoum) | 22 repères | 0 | 0 | 22 | repères / secteurs |
| tata:72/2 | Retour · secteurs 2020 | Kounoune → Cité Enseignants | 10 secteurs | 0 | 0 | 10 | repères / secteurs |
| tata:73/1 | Aller · tracé 2020 | Poste Thiaroye → Lac Rose | 10 repères | 0 | 0 | 10 | repères / secteurs |
| tata:73/2 | Retour · secteurs 2020 | Lac Rose → Poste Thiaroye | 8 secteurs | 0 | 0 | 8 | repères / secteurs |
| tata:74/1 | Aller · tracé 2020 | Bargny (Gare ferroviaire) → Cité Tawfeex | 13 repères | 0 | 0 | 13 | repères / secteurs |
| tata:74/2 | Retour · secteurs 2020 | Tawfeex → Bargny | 8 secteurs | 0 | 0 | 8 | repères / secteurs |
| tata:75/1 | Aller · tracé 2020 | Malika (Cité Sonatel) → Gare routière Colobane | 15 repères | 0 | 0 | 15 | repères / secteurs |
| tata:75/2 | Retour · secteurs 2020 | Colobane → Malika | 6 secteurs | 0 | 0 | 6 | repères / secteurs |
| tata:76/1 | Aller · tracé 2020 | SIPRES → Cité Assurance | 12 repères | 0 | 0 | 12 | repères / secteurs |
| tata:76/2 | Retour · secteurs 2020 | Cité Assurance → SIPRES | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:77/1 | Aller · tracé 2020 | Rufisque Cité Tacco → Liberté 5 | 14 repères | 0 | 0 | 14 | repères / secteurs |
| tata:77/2 | Retour · secteurs 2020 | Liberté V → Tacco | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:78/1 | Aller · tracé 2020 | Diamaguène → Liberté 5 | 12 repères | 0 | 0 | 12 | repères / secteurs |
| tata:78/2 | Retour | Liberté 5 → Diamaguène | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| tata:78/3 | Aller · sections 2020 | DIAMAGUENE → LIBERTE VI | 6 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:78/4 | Retour · sections 2020 | LIBERTE VI → DIAMAGUENE | 6 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:79/1 | Aller · tracé 2020 | Sangalkam → Cambérène | 15 repères | 0 | 0 | 15 | repères / secteurs |
| tata:79/2 | Retour · secteurs 2020 | Cambérène → Sangalkam | 8 secteurs | 0 | 0 | 8 | repères / secteurs |
| tata:80/1 | Aller · tracé 2020 | Diamalaye → Darou Thioub | 17 repères | 0 | 0 | 17 | repères / secteurs |
| tata:80/2 | Retour · secteurs 2020 | Darou Thioub → Diamalaye | 9 secteurs | 0 | 0 | 9 | repères / secteurs |
| tata:81/1 | Aller · tracé 2020 | Tawfeex (Cité SOCABEG) → Gare des Baux Maraîchers | 16 repères | 0 | 0 | 16 | repères / secteurs |
| tata:81/2 | Retour · secteurs 2020 | Gare des Baux Maraîchers → Tawfeex | 9 secteurs | 0 | 0 | 9 | repères / secteurs |
| tata:82/1 | Aller · tracé 2020 | Comico → Lat-Dior | 14 repères | 0 | 0 | 14 | repères / secteurs |
| tata:82/2 | Retour · secteurs 2020 | Lat Dior → Comico | 7 secteurs | 0 | 0 | 7 | repères / secteurs |
| tata:83/1 | Aller · tracé 2020 | Rufisque Arafat → Zone de Captage | 14 repères | 0 | 0 | 14 | repères / secteurs |
| tata:83/2 | Retour | Zone de Captage → Rufisque Arafat | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| tata:83/3 | Retour · sections 2020 | ZONE DE CAPTAGE → JAXAAY | 8 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:83/4 | Aller · sections 2020 | ARAFAT → ZONE DE CAPTAGE | 8 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:84/1 | Aller | Jaxaay → UCAD | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| tata:84/2 | Retour | UCAD → Jaxaay | 0 arrêts | 0 | 0 | 0 | sans liste · Sens non documenté |
| tata:84/3 | Aller · sections 2020 | JAXAAY → UCAD | 10 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
| tata:84/4 | Retour · sections 2020 | UCAD → JAXAAY | 10 secteurs | 0 | 0 | 0 | repères / secteurs · Sections tarifaires de 2020 · aucun horaire |
