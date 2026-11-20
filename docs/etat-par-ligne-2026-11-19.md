# Peut-on calculer un trajet sur chaque ligne de bus ?

**2026-11-19 à 19:00 (Dakar)** · 154 sélections, 23562 couples orientés effectivement essayés. 745 voyages complets, dont **29 avec DDD/AFTU/TATA** et **0 avec changement**. Application embarquée, sans édition opérateur.

Une ligne du tableau est un **couple provenance/code**, pas forcément un service distinct. Sept questions : quais ordonnés A/R, tracé entier A/R, correspondance, départ du jour et résultat du calcul. **A** est orienté par la fiche directionnelle, sinon les marqueurs de la carte, l’ordre du texte ou le titre ; **R** est évalué indépendamment. Le titre n’atteste ni A ni R. Les variantes non équivalentes restent à part.

**Lecture.** « Non · 93 noms » = une liste de 93 occurrences, pas 93 quais validés. « Carte » = dessin de l’opérateur ; « voirie candidate » = au moins une chaîne possible au contrôle géométrique, pas un sens homologué. L’absence de tracé *entier* n’efface pas une portion. Les départs sont ceux à l’origine d’une direction admise pour cette date ; une fenêtre, une cadence de référence ou les heures successives aux arrêts ne les remplacent pas. « Aucun dossier ciblé » ne signifie pas « aucune correspondance dans la ville ». Les témoins proviennent uniquement des **étapes d’un voyage complet** ; un changement à vérifier ou un tronçon de remplacement n’est pas compté. « 0/2 suites » signifie que, parmi deux variantes de l’archive essayées sur le seul dessin marqué, aucune ne passe tous les contrôles ; ce n’est pas un nombre de courses.

[Essayer les deux portions DDD 1 et vérifier les correspondances étudiées](validation-physique.md) · [Comparer les horaires 12/75](trajets-bus-medina-maristes.md) · [Passages estimés par ligne, distincts des voyages](passages-bus-par-ligne.md) · [Méthode, cas concrets et reproduction](revue-bus-2026-11-19.md) · [Tableau détaillé des pièces locales](couverture-sources-bus.md) · [Mesures par page, variante historique et relation](../data/bus-review/sources-2026-11-19.json).

## DDD — 48 identités

| Code · sens de lecture A | Quais A | Quais R | Tracé entier A | Tracé entier R | Changement | Départs du jour | Calcul |
|---|---|---|---|---|---|---|---|
| **1** · T. Parcelles Assainies → T. Leclerc | 8/8 sur portion | 2/2 sur portion | Portion seulement | Portion seulement | 2 sens étudiés · aucun témoin | fréquence modélisée / fréquence modélisée | 28 couple(s) · ref:ddd-1-medina-4666430960 → ref:ddd-1-medina-4666430958 ; 1 couple(s) · ref:ddd-1-medina-retour-4666430956 → ref:ddd-1-medina-retour-4666430957 |
| **2** · Terminus Daroukhane → Terminus Leclerc | Non · 35 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **4** · Terminus Liberté 5 (Dieuppeul) → Terminus Leclerc | Non · 27 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 2 relation(s) sans desserte entière validée |
| **5** · Terminus Guédiawaye → Palais 1 | Non · 15 noms | Non | Non établi | Non établi | 4 sens étudiés · aucun témoin | 0 | Non · libellés sans quais validés |
| **6** · Terminus Cambérène 2 → Palais 2 | Non · 24 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 1 relation(s) sans desserte entière validée |
| **7** · Rue Okm 60, 67 → Gare Palais | Non · 21/27 noms | Non · 29 noms | Non établi | Non établi | 6 sens étudiés · aucun témoin | 0 | Non · 2 relation(s) sans desserte entière validée |
| **8** · Terminus Aéroport LSS → Terminus Palais 2 | Non · 28 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 1 portion(s) seulement |
| **9** · Terminus Liberté 6 → Terminus Palais 2 | Non · 24 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 2 relation(s) sans desserte entière validée |
| **10** · Terminus Liberté 5 (Dieuppeul) → Terminus Palais 2 | Non · 29 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 2 relation(s) sans desserte entière validée |
| **11** · Terminus Keur Massar → Terminus Lat Dior | Non · 16 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **12** · Terminus Guédiawaye → Palais 1 | Non · 20 noms | Non | Non établi | Non établi | 6 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 1 portion(s) seulement |
| **13** · Terminus Liberté 5 (Dieuppeul) → Terminus Palais 2 | Non · 24 noms | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · libellés sans quais validés |
| **15** · Terminus Rufisque → Palais 1 | Non · 18 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **15A** · Rufisque → Palais 1 | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · pas de séquence physique attribuée |
| **15B** · Rufisque → Palais 1 | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · pas de séquence physique attribuée |
| **16A** · Terminus Malika → Palais 1 | Non · 19 noms | Non | Non établi | Non établi | 6 sens étudiés · aucun témoin | 0 · indicatif seul | Non · libellés sans quais validés |
| **16B** · Terminus Malika → Palais 1 | Non · 27 noms | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 · indicatif seul | Non · libellés sans quais validés |
| **18** · Terminus Liberté 5 (Dieuppeul) → Terminus Liberté 5 (Dieuppeul) | Non | Non | Non établi | Non établi | 4 sens étudiés · aucun témoin | 0 | Non · 1 relation(s) sans desserte entière validée |
| **20** · Terminus Dieuppeul → Terminus Dieuppeul | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · circuit non ventilé |
| **23** · Terminus des Parcelles → Terminus Palais 2 | Non · 40 noms | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · libellés sans quais validés |
| **121** · Terminus Scat Urbam → Terminus Leclerc | Non · 25 noms | Non | Non établi | Non établi | 4 sens étudiés · aucun témoin | 0 | Non · 1 relation(s) sans desserte entière validée |
| **208** · Gorom 01 → Rufisque | Non · 7 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **213** · Gare de Rufisque → Terminus Dieuppeul | Non · 17 noms | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · libellés sans quais validés |
| **217** · Dépôt Thiaroye → Terminus Aéroport LSS | Non · 15 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · libellés sans quais validés |
| **218** · Dépôt Thiaroye → Terminus Aéroport LSS | Non · 15 noms | Non | Non établi | Non établi | 6 sens étudiés · aucun témoin | 0 · indicatif seul | Non · libellés sans quais validés |
| **219** · Daroukhane → Terminus Ouakam | Non · 19 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · libellés sans quais validés |
| **220** · Terminus Rufisque → Terminus Guédiawaye | Non · 16 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 1 portion(s) seulement |
| **221** · Terminus Gadaye (Filaos) → Terminus Almadies | Non · 15 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **227** · Terminus Keur Massar → Terminus Parcelles | Non · 16 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · libellés sans quais validés |
| **228** · Terminus Rufisque → Diamniadio Yenne | Non · 4 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **232** · Baux Maraîchers → Terminus Aéroport LSS | Non · 15 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 1 portion(s) seulement |
| **233** · Baux Maraîchers → Terminus Aéroport LSS | Non · 15 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **234** · Terminus Jaxaay (Mosquée Niakoul Rab) → Leclerc | Non · 13 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **311** · Lac Rose Croisement Niague → Croisement Keur Massar | Non · 5 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · circuit non ventilé |
| **319** · Terminus Liberté 6 → Terminus Ouakam | Non · 17 noms | Non · 26 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · libellés sans quais validés |
| **327** · Terminus Keur Massar → Terminus Parcelles | Non · 11 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **501** · Port De Dakar → Terminus Palais 2 | Non · 9 noms | Non · 9 noms | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · ordre publié (6 noms) à rattacher au sens |
| **502** · Gare colobane → Gare Colobane | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (8 noms) à rattacher au sens |
| **502A** · Colobane → UCAD | Non | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · pas de séquence physique attribuée |
| **502B** · Colobane → Abass Ndao | Non | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · pas de séquence physique attribuée |
| **503** · Gare de Colobane → Gare de Colobane | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · circuit non ventilé |
| **503A** · Colobane → Môle 8 | Non | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · pas de séquence physique attribuée |
| **503B** · Colobane → Hydrocarbure | Non | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · pas de séquence physique attribuée |
| **504A** · Gare Diamniadio → Sphère ministérielle | Non | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · pas de séquence physique attribuée |
| **504B** · Sébikotane → Gare Diamniadio | Non | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · pas de séquence physique attribuée |
| **TAF_TAF** · Terminus Ouakam → AIBD | Non · 17 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 · bornes seules | Non · libellés sans quais validés |
| **TAF_TAF_TO1** · Terminus Ouakam → Palais 2 | Non · 10 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **TO1** · Terminus Ouakam → Palais 2 | Non · 10 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |

**Pièces avec leur orientation propre.** Pas de rapprochement sur le seul numéro : un terminus différent peut désigner une variante. Les écarts portent sur le dessin dans son sens marqué ; aucune archive n’est utilisée comme service du jour.

- **DDD 1** : [6951328 v28](https://www.openstreetmap.org/relation/6951328/history/28), Parcelles assainies → Terminus Leclerc. 38 membres d’arrêt, 66 ways ; 7 rupture(s) de nœuds, 4 conflit(s) orienté(s), 1 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 4** : [6990830 v16](https://www.openstreetmap.org/relation/6990830/history/16), Terminus Leclerc → Terminus Liberté 5. 34 membres d’arrêt, 56 ways ; 3 rupture(s) de nœuds, 0 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 4** : [7203970 v10](https://www.openstreetmap.org/relation/7203970/history/10), Termibus Liberté 5 → Terminus Leclerc. 32 membres d’arrêt, 61 ways ; 2 rupture(s) de nœuds, 0 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 6** : [7499433 v29](https://www.openstreetmap.org/relation/7499433/history/29), Palais 1 → Parcelles-Assainies. 1 membres d’arrêt, 91 ways ; 7 rupture(s) de nœuds, 4 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 7** : [6990669 v19](https://www.openstreetmap.org/relation/6990669/history/19), Terminus Palais → Terminus Ouakam. 31 membres d’arrêt, 64 ways ; 3 rupture(s) de nœuds, 2 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 7** : [7500475 v14](https://www.openstreetmap.org/relation/7500475/history/14), Terminus Ouakam → Terminus Palais 1. 34 membres d’arrêt, 57 ways ; 3 rupture(s) de nœuds, 0 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 9** : [6996431 v27](https://www.openstreetmap.org/relation/6996431/history/27), palais 1 → terminus Liberté 6. 32 membres d’arrêt, 73 ways ; 8 rupture(s) de nœuds, 8 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 9** : [7487218 v24](https://www.openstreetmap.org/relation/7487218/history/24), Termibus Liberté 6 → Palais1. 29 membres d’arrêt, 67 ways ; 4 rupture(s) de nœuds, 6 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 10** : [6990845 v12](https://www.openstreetmap.org/relation/6990845/history/12), Terminus Palais 1 → Terminus Liberté5. 30 membres d’arrêt, 64 ways ; 4 rupture(s) de nœuds, 0 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 10** : [7488283 v11](https://www.openstreetmap.org/relation/7488283/history/11), Terminus Liberté 5 → Terminus Palais 1. 25 membres d’arrêt, 72 ways ; 3 rupture(s) de nœuds, 0 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 18** : [7499475 v18](https://www.openstreetmap.org/relation/7499475/history/18), Terminus 1 → Terminus 2. 0 membres d’arrêt, 54 ways ; 5 rupture(s) de nœuds, 2 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **DDD 121** : [2792903 v6](https://www.openstreetmap.org/relation/2792903/history/6), ? → ?. 3 membres d’arrêt, 4 ways ; 0 rupture(s) de nœuds, 0 conflit(s) orienté(s), 1 occurrence(s) à plus de 20 m. Chaîne possible, étendue commerciale non établie.

## AFTU — 73 identités

| Code · sens de lecture A | Quais A | Quais R | Tracé entier A | Tracé entier R | Changement | Départs du jour | Calcul |
|---|---|---|---|---|---|---|---|
| **1** · Terminus Gare de Lat-Dior → TERMINUS ESPACE HLM GD MEDINE (FACE AUTOROUTE) | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **2** · ROUTE PRINCIPALE DES PARCELLES ASSAINIES → TERMINUS GARE PETERSEN | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **3** · TERMINUS YOFF-VILLAGE → TERMINUS GARE PETERSEN | Non · 15 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **4** · TERMINUS YOFF-VILLAGE → TERMINUS PETERSEN | Non · 10 noms | Non | Carte · écarts de voirie | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **5** · TERMINUS GARE DES PARCELLES ASSAINIES → TERMINUS PETERSEN | Non · 17 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **24** · Terminus Notaire (Guédiawaye) → Terminus Université Cheikh Anta Diop | Non · 14 noms | Non | Carte · voirie candidate | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **25** · TERMINUS GARE DES PARCELLES ASSAINIES → TERMINUS GARE PETERSEN | Non · 13 noms | Non | Carte · écarts de voirie | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **26** · TERMINUS GARE DES PARCELLES ASSAINIES → TERMINUS GUEDIAWAYE | Non · 8 noms | Non | Carte · écarts de voirie | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **27** · LIGNE 27 → TERMINUS GARE PETERSEN | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **28** · TERMINUS HAMO V/VI → TERMINUS GARE PETERSEN | Non · 16 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **29** · TERMINUS CITE NATIONS UNIES (CAMBERENE) → TERMINUS GARE DE PETERSEN | Non | Non | Carte · écarts de voirie | Non établi | 2 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **30** · Arrêt De Bus → Gare De Colobane | Non · 77 noms | Non · 74 noms | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **31** · TERMINUS TALLY ICOTAF X RTE DES NIAYES → TERMINUS HOPITAL ABASS NDAO | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/1 suites historiques sur le dessin à 20 m |
| **32** · TERMINUS SAHM → TERMINUS SERIGNE ASSANE | Non · 13 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **33** · Terminus Colobane → Terminus Serigne Assane | Non · 18 noms | Non | Carte · voirie candidate | Non établi | 2 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **34** · TERMINUS PLAGE BCEAO → TERMINUS LAT-DIOR | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **35** · TERMINUS PIKINE TEXACO → TERMINUS NGOR | Non · 10 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **36** · TERMINUS MARCHE NDIAREME → TERMINUS NGOR | Non · 18 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **37** · TERMINUS APIX → TERMINUS UCAD (CLAUDEL) | Non · 35 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **38** · Cité Enseignants → Terminus Sahm | Non · 13 noms | Non | Carte · voirie candidate | Non établi | Aucun dossier ciblé | 0 | Non · 0/1 suites historiques sur le dessin à 20 m |
| **39** · TERMINUS LAT - DIOR → TERMINUS DIAMALAYE | Non | Non | Carte · écarts de voirie | Non établi | 2 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **40** · TERMINUS GRAND MBAO → TERMINUS PETERSEN | Non · 11 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **41** · TERMINUS PETERSEN → TERMINUS ETAGE MADIALE | Non · 21 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/1 suites historiques sur le dessin à 20 m |
| **42** · Arrêt De Bus → Rue Okm 282, 222 | Non · 70 noms | Non · 68 noms | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **43** · TERMINUS OUAKAME → TERMINUS THIERNO | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **44** · Terminus Grand Mbao → Terminus Ouakam | Non · 13 noms | Non | Carte · voirie candidate | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **45** · TERMINUS KOUNOUNE NGALAM → TERMINUS PARCELLES ASSAINIES | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **46** · TERMINUS SERIGNE ASSANGE → TERMINUS LAT-DIOR | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/1 suites historiques sur le dessin à 20 m |
| **47** · TERMINUS LAT-DIOR → TERMINUS ALMADIES | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · ordre publié (15 noms) à rattacher au sens |
| **48** · TERMINUS CITE SERIGNE MANSOUR → TERMINUS LAT-DIOR | Non · 12 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **49** · TERMINUS GADAYE → TERMINUS NGOR | Non · 22 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **50** · TERMINUS PETERSEN → TERMINUS MALIKA PLAGE | Non · 20 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **51** · TERMINUS JAXAAY → TERMINUS GARE DES BEAUX MARAÎCHERS | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **52** · TERMINUS BEAUX MARAÎCHERS → TERMINUS JAXAAY | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (13 noms) à rattacher au sens |
| **53** · TERMINUS KEUR-MASSAR (MARCHÉ) → TERMINUS SEBIKOTANE | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/1 suites historiques sur le dessin à 20 m |
| **54** · TERMINUS KEUR MASSAR (MTOA) → TERMINUS UNIVERSITE CHEIKH ANTA DIOP | Non · 14 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **55** · Terminus Rufisque Sonadis → Terminus Petersen | Non · 13 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · sens de la carte indéterminé |
| **56** · TERMINUS JAXAAY → TERMINUS PETERSEN | Non | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **57** · Terminus 57 → Route Des Niayes / Av. Abdel Aziz | Non · 56 noms | Non · 57 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/1 suites historiques sur le dessin à 20 m |
| **58** · Terminus Fass Mbao → Terminus Bvar. Tapée / Rue 18 | Non · 39 noms | Non · 43 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **59** · TERMINUS DIAMALAYE → TERMINUS CITE GENDARMERIE | Non · 15 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **60** · Gare De Colobane → Terminus 60 | Non · 50 noms | Non · 48 noms | Non établi | Non établi | 4 sens étudiés · aucun témoin | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **61** · TERMINUS KEUR MASSAR → TERMINUS ALMADIES | Non · 10 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **62** · Terminus 62 → Bvar. Tapée / Rue 59 | Non · 72 noms | Non · 68 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **63** · TERMINUS DIOR PARCELLES → TERMINUS CAMP MARCHAND RUFISQUE | Non | Non | Carte · voirie candidate | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **64** · Arrêt De Bus → Espi | Non · 61 noms | Non · 61 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **65** · Gare De Colobane → Terminus Jaxaay | Non · 2/57 noms | Non · 56 noms | Non établi | Non établi | 4 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **66** · Terminus → Gorom | Non · 77 noms | Non · 77 noms | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **67** · Espi → Poste De Sante | Non · 71 noms | Non · 71 noms | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **68** · Terminus 68 → Complexe Islamique | Non · 50 noms | Non · 50 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **69** · Terminus Diamalaye → Terminus Namora | Non · 15 noms | Non | Carte · voirie candidate | Non établi | Aucun dossier ciblé | 0 | Non · 0/1 suites historiques sur le dessin à 20 m |
| **70** · Arrêt De Bus → Terminus Jaxaay | Non · 58 noms | Non · 57 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **71** · Terminus 71 → Bvard. Canal 4 / Rue Fn-32 | Non · 54 noms | Non · 55 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **72** · Terminus 38 - 72 → Terminus 72 | Non · 78 noms | Non · 78 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **73** · Terminus 73 → Dépot Thiaroye | Non · 75 noms | Non · 75 noms | Non établi | Non établi | 4 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **74** · Terminus Bargny (Gare ferroviaire) → Terminus Cité COCEHAS | Non · 14 noms | Non · inversion écartée | Carte · écarts de voirie | Non établi | 2 sens étudiés · aucun témoin | 0 · autre grille écartée | Non · 0/2 suites historiques sur le dessin à 20 m |
| **75** · Marché → Gare De Colobane | Non · 52 noms | Non · 51 noms | Non établi | Non établi | 6 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **76** · TERMINUS SIPRES → TERMINUS CITE ASSURANCE | Non · 12 noms | Non | Carte · écarts de voirie | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **77** · Terminus Rufisque Cité Tacco → Terminus Liberté 5 | Non · 14 noms | Non | Carte · voirie candidate | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **78** · Terminus Diamaguène → Terminus Liberté 5 | Non · 12 noms | Non | Carte · voirie candidate | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **79** · Arrêt De Bus → Terminus 6 - 79 | Non · 92 noms | Non · 93 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **80** · Terminus Diamalaye → Terminus Darou Thioub | Non · 17 noms | Non · inversion écartée | Carte · voirie candidate | Non établi | Aucun dossier ciblé | 0 | Non · 0/2 suites historiques sur le dessin à 20 m |
| **81** · Mosquée Faye → Gare Baux Maraichers | Non · 71 noms | Non · 71 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **82** · Avenue Pl 52, 122 → Arrêt de bus | Non · 51 noms | Non · 49 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **83** · Sonadis près du Jardin En Face Hôtel De Ville (Départ) → Zone De Captage (Terminus) | Non · 93 noms | Non · 90 noms | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 · indicatif seul | Non · 0/2 suites historiques sur le dessin à 20 m |
| **84** · Jaxaay 2 Pénitence → Terminus 84_54Derrière Ucad En Face Canal 4 | Non · 73 noms | Non · 73 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · 73 heures aux arrêts | Non · 2 portion(s) seulement |
| **85** · Banoba → Liberté 5 | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · pas de séquence physique attribuée |
| **86** · Yeumbeul (Départ) → Terminus 86 (Terminus) | Non · 68 noms | Non · 64 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · libellés sans quais validés |
| **87** · Terminus 79 87 → Maristes Terminus 87 | Non · 68 noms | Non · 71 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · libellés sans quais validés |
| **88** · Terminus 88 → Terminus Liberté 5 | Non · 78 noms | Non · 81 noms | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · libellés sans quais validés |
| **89** · Terminus 89 → Poste Courant Bargny Près De La Gare Ter | Non · 55 noms | Non · 53 noms | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · libellés sans quais validés |
| **90** · Terminus 90 (Départ) → Deni Birame Ndao Nord (Terminus) | Non · 82 noms | Non · 82 noms | Non établi | Non établi | Aucun dossier ciblé | 0 · indicatif seul | Non · 2 portion(s) seulement |
| **91** · Losso (Départ) → Terminus 91 (Terminus) | Non · 70 noms | Non · 70 noms | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 2 portion(s) seulement |

**Pièces avec leur orientation propre.** Pas de rapprochement sur le seul numéro : un terminus différent peut désigner une variante. Les écarts portent sur le dessin dans son sens marqué ; aucune archive n’est utilisée comme service du jour.

- **AFTU 1** : start « Terminus Gare de Lat-Dior », finish « TERMINUS ESPACE HLM GD MEDINE (FACE AUTOROUTE) ». 139 sommets, 14490 m ; sans chaussée compatible : 39 segment(s), rang(s) 1, 20, 21, 22, 23… ; rupture : 14 segment(s), rang(s) 69, 79, 80, 81, 89…. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 2** : start « ROUTE PRINCIPALE DES PARCELLES ASSAINIES », finish « TERMINUS GARE PETERSEN ». 169 sommets, 15357 m ; sans chaussée compatible : 3 segment(s), rang(s) 1, 90, 91. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 3** : start « TERMINUS YOFF-VILLAGE », finish « TERMINUS GARE PETERSEN ». 310 sommets, 17947 m ; rupture : 2 segment(s), rang(s) 162, 294 ; sans chaussée compatible : 3 segment(s), rang(s) 295, 296, 297. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 4** : start « TERMINUS YOFF-VILLAGE », finish « TERMINUS PETERSEN ». 245 sommets, 12776 m ; rupture : 1 segment(s), rang(s) 230 ; sans chaussée compatible : 3 segment(s), rang(s) 230, 231, 244. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 5** : start « TERMINUS GARE DES PARCELLES ASSAINIES », finish « TERMINUS PETERSEN ». 218 sommets, 15447 m ; sans chaussée compatible : 16 segment(s), rang(s) 106, 107, 108, 109, 110… ; rupture : 1 segment(s), rang(s) 116. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 24** : start « TERMINUS NOTAIRE (GUEDIAWAYE) », finish « TERMINUS UNIVERSITE CHEIKH ANTA DIOP ». 282 sommets, 17032 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 25** : start « TERMINUS GARE DES PARCELLES ASSAINIES », finish « TERMINUS GARE PETERSEN ». 274 sommets, 14369 m ; sans chaussée compatible : 2 segment(s), rang(s) 1, 273. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 26** : start « TERMINUS GARE DES PARCELLES ASSAINIES », finish « TERMINUS GUEDIAWAYE ». 79 sommets, 6974 m ; sans chaussée compatible : 1 segment(s), rang(s) 1. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 27** : start « LIGNE 27 », finish « TERMINUS GARE PETERSEN ». 202 sommets, 19138 m ; sans chaussée compatible : 5 segment(s), rang(s) 1, 2, 14, 163, 164 ; rupture : 6 segment(s), rang(s) 11, 12, 42, 87, 135…. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 28** : start « TERMINUS HAMO V/VI », finish « TERMINUS GARE PETERSEN ». 286 sommets, 17191 m ; rupture : 1 segment(s), rang(s) 281. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 29** : start « TERMINUS CITE NATIONS UNIES (CAMBERENE) », finish « TERMINUS GARE DE PETERSEN ». 157 sommets, 15898 m ; sans chaussée compatible : 1 segment(s), rang(s) 1. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 30** : start « TERMINUS GADAYE (GUÉDIAWAYE) », finish « TERMINUS GARE DE COLOBANE ». 207 sommets, 18562 m ; rupture : 1 segment(s), rang(s) 1 ; sans chaussée compatible : 5 segment(s), rang(s) 180, 181, 182, 183, 206. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 31** : start « TERMINUS TALLY ICOTAF X RTE DES NIAYES », finish « TERMINUS HOPITAL ABASS NDAO ». 130 sommets, 16218 m ; rupture : 1 segment(s), rang(s) 55. 0/1 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 32** : start « TERMINUS SAHM », finish « TERMINUS SERIGNE ASSANE ». 217 sommets, 19739 m ; rupture : 2 segment(s), rang(s) 51, 73 ; sans chaussée compatible : 2 segment(s), rang(s) 52, 53. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 33** : start « TERMINUS COLOBANE », finish « TERMINUS SERIGNE ASSANE ». 218 sommets, 17999 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 34** : start « TERMINUS PLAGE BCEAO », finish « TERMINUS LAT-DIOR ». 173 sommets, 15367 m ; sans chaussée compatible : 1 segment(s), rang(s) 1 ; rupture : 1 segment(s), rang(s) 2. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 35** : start « TERMINUS PIKINE TEXACO », finish « TERMINUS NGOR ». 192 sommets, 17719 m ; sans chaussée compatible : 1 segment(s), rang(s) 1. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 36** : start « TERMINUS MARCHE NDIAREME », finish « TERMINUS NGOR ». 217 sommets, 19985 m ; sans chaussée compatible : 4 segment(s), rang(s) 20, 21, 22, 23. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 37** : start « TERMINUS APIX », finish « TERMINUS UCAD (CLAUDEL) ». 550 sommets, 39766 m ; rupture : 4 segment(s), rang(s) 188, 336, 365, 513 ; sans chaussée compatible : 3 segment(s), rang(s) 514, 515, 516. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 38** : start « TERMINUS CITÉ ENSEIGNANTS », finish « TERMINUS SAHM ». 132 sommets, 16725 m ; chaîne possible. 0/1 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 39** : start « TERMINUS LAT - DIOR », finish « TERMINUS DIAMALAYE ». 138 sommets, 17040 m ; sans chaussée compatible : 5 segment(s), rang(s) 8, 9, 10, 11, 12 ; rupture : 3 segment(s), rang(s) 44, 72, 96. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 40** : start « TERMINUS GRAND MBAO », finish « TERMINUS PETERSEN ». 175 sommets, 24218 m ; sans chaussée compatible : 1 segment(s), rang(s) 1 ; rupture : 2 segment(s), rang(s) 2, 97. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 40** : [3982642 v25](https://www.openstreetmap.org/relation/3982642/history/25), ? → ?. 0 membres d’arrêt, 35 ways ; 3 rupture(s) de nœuds, 5 conflit(s) orienté(s), 0 occurrence(s) à plus de 20 m. Chaîne entière non établie.
- **AFTU 41** : start « TERMINUS PETERSEN », finish « TERMINUS ETAGE MADIALE ». 204 sommets, 19556 m ; sans chaussée compatible : 1 segment(s), rang(s) 1. 0/1 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 42** : start « TERMINUS GADAYE », finish « TERMINUS OUAKAM BAYE ». 189 sommets, 21086 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 43** : start « TERMINUS OUAKAME », finish « TERMINUS THIERNO ». 176 sommets, 26321 m ; sans chaussée compatible : 3 segment(s), rang(s) 83, 84, 166 ; rupture : 2 segment(s), rang(s) 98, 133. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 44** : start « TERMINUS GRAND MBAO », finish « TERMINUS OUAKAM ». 224 sommets, 26922 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 45** : start « TERMINUS KOUNOUNE NGALAM », finish « TERMINUS PARCELLES ASSAINIES ». 298 sommets, 34803 m ; sans chaussée compatible : 9 segment(s), rang(s) 26, 82, 84, 212, 213… ; rupture : 5 segment(s), rang(s) 86, 88, 134, 193, 241. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 46** : start « TERMINUS SERIGNE ASSANGE », finish « TERMINUS LAT-DIOR ». 174 sommets, 22310 m ; sans chaussée compatible : 1 segment(s), rang(s) 173. 0/1 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 47** : start « TERMINUS LAT-DIOR », finish « TERMINUS ALMADIES ». 196 sommets, 23591 m ; sans chaussée compatible : 9 segment(s), rang(s) 1, 9, 10, 11, 12…. Pas de suite historique testée pour ce dessin.
- **AFTU 48** : start « TERMINUS CITE SERIGNE MANSOUR », finish « TERMINUS LAT-DIOR ». 202 sommets, 31677 m ; sans chaussée compatible : 1 segment(s), rang(s) 201. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 49** : start « TERMINUS GADAYE », finish « TERMINUS NGOR ». 378 sommets, 28347 m ; rupture : 2 segment(s), rang(s) 116, 326. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 50** : start « TERMINUS PETERSEN », finish « TERMINUS MALIKA PLAGE ». 148 sommets, 24164 m ; rupture : 2 segment(s), rang(s) 58, 83. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 51** : start « TERMINUS JAXAAY », finish « TERMINUS GARE DES BEAUX MARAÎCHERS ». 138 sommets, 17861 m ; sans chaussée compatible : 1 segment(s), rang(s) 1 ; rupture : 2 segment(s), rang(s) 130, 133. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 52** : start « TERMINUS BEAUX MARAÎCHERS », finish « TERMINUS JAXAAY ». 156 sommets, 19886 m ; rupture : 2 segment(s), rang(s) 13, 155 ; sans chaussée compatible : 1 segment(s), rang(s) 155. Pas de suite historique testée pour ce dessin.
- **AFTU 53** : start « TERMINUS KEUR-MASSAR (MARCHÉ) », finish « TERMINUS SEBIKOTANE ». 295 sommets, 35700 m ; rupture : 1 segment(s), rang(s) 294 ; sans chaussée compatible : 1 segment(s), rang(s) 294. 0/1 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 54** : start « TERMINUS KEUR MASSAR (MTOA) », finish « TERMINUS UNIVERSITE CHEIKH ANTA DIOP ». 220 sommets, 25388 m ; rupture : 1 segment(s), rang(s) 219. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 55** : start « TERMINUS RUFISQUE SONADIS », start « TERMINUS PETERSEN ». 259 sommets, 28679 m ; sens non résolu, voirie non testée. Pas de suite historique testée pour ce dessin.
- **AFTU 56** : start « TERMINUS JAXAAY », finish « TERMINUS PETERSEN ». 219 sommets, 29258 m ; sans chaussée compatible : 2 segment(s), rang(s) 1, 218 ; rupture : 1 segment(s), rang(s) 2. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 57** : start « TERMINUS RUFISQUE GOUYE MOURIDE », finish « TERMINUS ROND-POINT LIBERTE 6 ». 383 sommets, 28186 m ; sans chaussée compatible : 10 segment(s), rang(s) 1, 2, 3, 4, 5…. 0/1 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 58** : start « TERMINUS FASS MBAO (RAIL-BA) », finish « TERMINUS SAHM ». 200 sommets, 23782 m ; rupture : 1 segment(s), rang(s) 69. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 59** : start « TERMINUS DIAMALAYE », finish « TERMINUS CITE GENDARMERIE ». 291 sommets, 26499 m ; sans chaussée compatible : 1 segment(s), rang(s) 290. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 60** : start « TERMINUS COLOBANE », finish « TERMINUS BARGNY ». 340 sommets, 33424 m ; sans chaussée compatible : 4 segment(s), rang(s) 7, 8, 9, 339 ; rupture : 2 segment(s), rang(s) 16, 39. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 61** : start « TERMINUS KEUR MASSAR », finish « TERMINUS ALMADIES ». 247 sommets, 29172 m ; sans chaussée compatible : 1 segment(s), rang(s) 246. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 62** : start « ARRÊT CHERIF », finish « TERMINUS PENC MI (GUEULE TAPEE) ». 346 sommets, 31354 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 63** : start « TERMINUS DIOR PARCELLES », finish « TERMINUS CAMP MARCHAND RUFISQUE ». 427 sommets, 26909 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 64** : start « TERMINUS DIAMNIADIO », finish « TERMINUS NOTAIRE (GUEDIAWAYE) ». 380 sommets, 33485 m ; rupture : 1 segment(s), rang(s) 5 ; sans chaussée compatible : 1 segment(s), rang(s) 379. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 65** : start « TERMINUS GARE COLOBANE », finish « TERMINUS JAXAAY 2 ». 272 sommets, 24647 m ; sans chaussée compatible : 5 segment(s), rang(s) 1, 10, 11, 12, 271 ; rupture : 1 segment(s), rang(s) 271. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 66** : start « TERMINUS YOFF », finish « TERMINUS GOROM 1 ». 424 sommets, 44772 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 67** : start « TERMINUS THIAWLÈNE », finish « TERMINUS BOUTIQUE DIALLO (OUAKAM) ». 373 sommets, 31031 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 68** : start « TERMINNUS SEBIKOTANE », finish « TERMINUS STATION YEUMBEUL ». 227 sommets, 34928 m ; rupture : 1 segment(s), rang(s) 226. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 69** : start « TERMINUS DIAMALAYE », finish « TERMINUS NAMORA ». 269 sommets, 24785 m ; chaîne possible. 0/1 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 70** : start « TERMINUS DAROUKHANE KEUR SERIGNE ASSANE », finish « TERMINUS JAXAAY 2 ». 263 sommets, 22739 m ; sans chaussée compatible : 1 segment(s), rang(s) 262. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 71** : start « sans nom », finish « TERMINUS CLAUDEL ». 267 sommets, 29943 m ; sans chaussée compatible : 1 segment(s), rang(s) 1 ; rupture : 1 segment(s), rang(s) 2. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 72** : start « TERMINUS GUEDIAWAYE CITE DES ENSEIGNANTS », finish « TERMINUS KOUNOUNE (CITE CARDINAL THIANDOUM) ». 366 sommets, 31445 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 73** : start « TERMINUS POSTE THIAROYE », finish « TERMINUS LAC ROSE ». 281 sommets, 24367 m ; sans chaussée compatible : 2 segment(s), rang(s) 279, 280. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 74** : start « TERMINUS BARGNY (GARE FERROVIAIRE) », finish « TERMINUS CITE COCEHAS ». 379 sommets, 27455 m ; sans chaussée compatible : 1 segment(s), rang(s) 1. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 75** : start « TERMINUS MALIKA (CITE SONATEL) », finish « TERMINUS GARE ROUTIERE COLOBANE ». 373 sommets, 23105 m ; rupture : 2 segment(s), rang(s) 102, 354 ; sans chaussée compatible : 1 segment(s), rang(s) 372. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 76** : start « TERMINUS SIPRES », finish « TERMINUS CITE ASSURANCE ». 316 sommets, 29023 m ; sans chaussée compatible : 1 segment(s), rang(s) 315. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 77** : start « TERMINUS RUFISQUE CITE TACKO », finish « TERMINUS LIBERTE 5 ». 344 sommets, 25911 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 78** : start « TERMINUS DIAMAGUENE », finish « TERMINUS LIBERTÉ 5 ». 301 sommets, 15973 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 79** : start « TERMINUS SANGALKAM », finish « TERMINUS CAMBÉRÈNE ». 405 sommets, 38908 m ; sans chaussée compatible : 1 segment(s), rang(s) 1. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 80** : start « TERMINUS DIAMALAYE », finish « TERMINUS DAROU THIOUB ». 261 sommets, 32885 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 81** : start « TERMINUS TAWFEKH », finish « TERMINUS GARE DES BAUXMARAICHERS ». 256 sommets, 27518 m ; rupture : 1 segment(s), rang(s) 235. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 82** : start « TERMINUS COMICO », finish « TERMINUS LAT-DIOR ». 199 sommets, 24290 m ; rupture : 1 segment(s), rang(s) 170. 0/2 suites historiques compatibles à 20 m (de bout en bout).
- **AFTU 83** : start « TERMINUS RUFISQUE ARAFAT », finish « TERMINUS ZONE DE CAPTAGE ». 379 sommets, 33507 m ; chaîne possible. 0/2 suites historiques compatibles à 20 m (de bout en bout).

## TATA — 65 identités

| Code · sens de lecture A | Quais A | Quais R | Tracé entier A | Tracé entier R | Changement | Départs du jour | Calcul |
|---|---|---|---|---|---|---|---|
| **1** · Lat-Dior → HLM Grand Yoff | Non · 20 noms | Non · 12 noms | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 1 portion(s) seulement |
| **2** · Route Principale des Parcelles Assainies → Gare Petersen | Non · 18 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (16 noms) à rattacher au sens |
| **3** · Yoff-Village → Petersen | Non · 15 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 1 portion(s) seulement |
| **4** · Yoff-Village → Petersen | Non · 10 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 1 portion(s) seulement |
| **5** · Gare des Parcelles Assainies → Petersen | Non · 19 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (17 noms) à rattacher au sens |
| **24** · Notaire Guédiawaye → Université Cheikh Anta Diop | Non · 14 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (12 noms) à rattacher au sens |
| **25** · Gare des Parcelles Assainies → Gare Petersen | Non · 7 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (5 noms) à rattacher au sens |
| **26** · Gare des Parcelles Assainies → Poste Thiaroye | Non · 13 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (11 noms) à rattacher au sens |
| **27** · Marché Boubess → Gare Petersen | Non · 12 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (10 noms) à rattacher au sens |
| **28** · Hamo V/VI → Gare Petersen | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (14 noms) à rattacher au sens |
| **29** · Cité Nations Unies (Cambérène) → Gare Petersen | Non · 13 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (11 noms) à rattacher au sens |
| **30** · Gadaye (Guédiawaye) → Gare de Colobane | Non · 8 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (6 noms) à rattacher au sens |
| **31** · Tally Icotaf × Route des Niayes (Pikine) → Hôpital Abass Ndao | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (13 noms) à rattacher au sens |
| **32** · SHAM → Serigne Assane | Non · 10 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (8 noms) à rattacher au sens |
| **33** · Colobane → Serigne Assane | Non · 18 noms | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · ordre publié (16 noms) à rattacher au sens |
| **34** · Nord-Foire → Lat-Dior | Non · 9 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (7 noms) à rattacher au sens |
| **35** · Pikine Texaco → Ngor | Non · 10 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (8 noms) à rattacher au sens |
| **36** · Marché Ndiarème → Ngor | Non · 16 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (14 noms) à rattacher au sens |
| **37** · Diamalaye → Claudel | Non · 29 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (27 noms) à rattacher au sens |
| **38** · Cité Enseignants → SHAM | Non · 13 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (11 noms) à rattacher au sens |
| **39** · Lat-Dior → Diamalaye | Non · 13 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (11 noms) à rattacher au sens |
| **40** · Grand Mbao → Petersen | Non · 11 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (9 noms) à rattacher au sens |
| **41** · Petersen → Étage Madialé | Non · 20 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (18 noms) à rattacher au sens |
| **42** · Gadaye → Ouakam Bayé | Non · 15 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (13 noms) à rattacher au sens |
| **43** · Ouakam → Thierno Ndiaye | Non · 14 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (12 noms) à rattacher au sens |
| **44** · Grand Mbao → Ouakam | Non · 10 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (8 noms) à rattacher au sens |
| **45** · Kounoune Ngalam → Parcelles Église | Non · 33 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · 1 portion(s) seulement |
| **46** · SDE Serigne Assane → Lat Dior | Non · 17 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (15 noms) à rattacher au sens |
| **47** · Gare Lat Dior → Almadies | Non · 15 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (13 noms) à rattacher au sens |
| **48** · Cité Serigne Mansour → Lat Dior | Non · 11 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (9 noms) à rattacher au sens |
| **49** · Gadaye → Ngor | Non · 21 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (19 noms) à rattacher au sens |
| **50** · Petersen → Malika Cimetière | Non · 19 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (17 noms) à rattacher au sens |
| **51** · Jaxaay → Gare des Baux Maraîchers | Non · 9 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (7 noms) à rattacher au sens |
| **52** · Église Bountou Pikine → Keur Massar | Non · 10 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (8 noms) à rattacher au sens |
| **53** · Keur Massar → Sébikhotane | Non · 16 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (14 noms) à rattacher au sens |
| **54** · Terminus Keur Massar (Cité MTOA) → Université Cheikh Anta Diop | Non · 12 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (10 noms) à rattacher au sens |
| **55** · Terminus Rufisque SONADIS → Petersen | Non · 13 noms | Non | Non établi | Non établi | 2 sens étudiés · aucun témoin | 0 | Non · ordre publié (11 noms) à rattacher au sens |
| **56** · Jaxaay 2 → Petersen | Non · 12 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (10 noms) à rattacher au sens |
| **57** · Terminus Rufisque Gouye Mouride → Giratoire Liberté 6 | Non · 13 noms | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (11 noms) à rattacher au sens |
| **58** · Fass Mbao → SHAM | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (7 noms) à rattacher au sens |
| **59** · Stade L.S.S → Mbarou Samba Dème (Mbeubeuss) | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (12 noms) à rattacher au sens |
| **60** · Colobane → Bargny | Non · 8 noms | Non | Non établi | Non établi | 4 sens étudiés · aucun témoin | 0 | Non · ordre publié (6 noms) à rattacher au sens |
| **61** · Keur Massar → Almadies | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (9 noms) à rattacher au sens |
| **62** · Arrêt Chérif (Rufisque) → Penc Mi (Gueule Tapée) | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (17 noms) à rattacher au sens |
| **63** · Stade LSS → Camp Marchand Rufisque | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (16 noms) à rattacher au sens |
| **65** · Gare routière de Colobane → Jaxaay 2 | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (10 noms) à rattacher au sens |
| **66** · Yoff → Gorom 1 | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (21 noms) à rattacher au sens |
| **67** · Thiawlène → Boutique Diallo (Ouakam) | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (20 noms) à rattacher au sens |
| **68** · Sébikotane → Station Yeumbeul | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (7 noms) à rattacher au sens |
| **69** · Parcelles Assainies → Terminus non précisé | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · pas de séquence physique attribuée |
| **70** · Diakhaye → Guédiawaye | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · pas de séquence physique attribuée |
| **71** · Keur Massar Extension → Claudel | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (16 noms) à rattacher au sens |
| **72** · Guédiawaye → Kounoune | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · pas de séquence physique attribuée |
| **73** · Poste Thiaroye → Lac Rose | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (8 noms) à rattacher au sens |
| **74** · Bargny (Gare ferroviaire) → Tivaouane Peulh | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (12 noms) à rattacher au sens |
| **75** · Malika (Cité Sonatel) → Gare routière Colobane | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (13 noms) à rattacher au sens |
| **76** · SIPRES → Cité Assurance | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (10 noms) à rattacher au sens |
| **77** · Rufisque Cité Tacco → Liberté 5 | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (12 noms) à rattacher au sens |
| **78** · Diamaguène → Liberté 5 | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (10 noms) à rattacher au sens |
| **79** · Sangalkam → Cambérène | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (4 noms) à rattacher au sens |
| **80** · Diamalaye → Darou Thioub | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (15 noms) à rattacher au sens |
| **81** · Tawfeex (Cité SOCABEG) → Gare des Baux Maraîchers | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (14 noms) à rattacher au sens |
| **82** · Comico → Lat-Dior | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (12 noms) à rattacher au sens |
| **83** · Rufisque Arafat → Zone de Captage | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (12 noms) à rattacher au sens |
| **84** · Jaxaay → UCAD | Non | Non | Non établi | Non établi | Aucun dossier ciblé | 0 | Non · ordre publié (8 noms) à rattacher au sens |

- **TATA 53 — autre axe non compté sous l’axe du tableau :** [Lac Rose → Sébikotane](https://fr.scribd.com/document/840812776/ligne-tata), 10 repères documentaires sans horaires.
