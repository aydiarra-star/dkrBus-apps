# Panneaux bus et correspondances : résultat de la revue

**À Dakar, au moins un passage de semaine peut être décompté sur 992 des 4 906 rangs d’arrêt du catalogue (20,22 %). À 19 h le jeudi d’essai, 545 de ces rangs indiquent un prochain passage. Aucune nouvelle correspondance n’est démontrée.** Ces deux résultats ne portent pas sur le même objet : une cellule d’une fiche hebdomadaire suffit à renseigner le panneau, mais pas à engager un voyageur sur une deuxième course.

## Où trouver le détail

| Question | Réponse vérifiable |
|---|---|
| Combien d’arrêts et d’heures dans chaque sens ? | [Inventaire par variante](panneaux/README.md) et [CSV des fiches](panneaux/fiches.csv) : axes, premier/dernier libellés, portée, rangs avec heure, séries de semaine, estimations, source et comparaison des ordres. Les circuits, extraits et retours non fournis ne sont pas inversés. |
| Cet arrêt a-t-il un compteur ? | Une ligne par occurrence : [DDD](panneaux/ddd.csv), [AFTU](panneaux/aftu.csv), [TATA](panneaux/tata.csv). Suivre la clé `fiche` vers les [heures imprimées par colonne](panneaux/heures.csv). Quand il n’y a pas d’heure admissible, la matrice en donne la raison. |
| Quelles lignes sait-on faire emprunter ? | [État par ligne du calculateur](etat-par-ligne-2026-11-19.md). Les listes d’arrêts sur fiche ne sont pas des quais localisés et une archive n’est pas un calendrier d’aujourd’hui. |
| Que manque-t-il pour changer ? | [Enquête à Ponty, Colobane, Ouakam, aux gares et à Petersen](enquete-correspondances.md) ; [toutes les évaluations et pièces par sens](pieces-par-sens.md). Le contrôle des 31 dossiers précédents reste en place ; les sept dossiers ajoutés depuis `bac6609` portent l’inventaire à **38 dossiers / 76 sens / 78 évaluations**. Les 78 restent bloquées avant horaire. |
| Où sont les quatre tableaux 218/73 ? | [Résumé reçu](releve-218-73.md) et [demande détaillée à transmettre](enquete-correspondances.md#demande-à-transmettre-aux-exploitants-non-envoyée). Aucun original obtenu. Les départs signalés et la grille historique de la 73 restent séparés ; Niague vs Lac Rose non tranché. |

## Lire les nombres sans leur faire dire davantage

| Famille | Codes du catalogue | Fiches sans liste / hors alias | Rangs classés arrêts | Avec ≥ 1 heure sur fiche, même isolée | Avec ≥ 1 décompte en semaine | À 19 h le jeudi |
|---|---:|---:|---:|---:|---:|---:|
| DDD | 48 | 4 / 111 | 1 322 | 370 | 308 (23,30 %) | 245 |
| AFTU | 73 | 56 / 159 | 3 584 | 757 | 684 (19,08 %) | 300 |
| TATA | 65 | 9 / 149 | 0 | 0 | 0 (pourcentage indéfini) | 0 |

**7 753 rangs affichables** : 4 906 arrêts, 2 287 repères, 507 secteurs et 53 origines seules. Les **69 fiches sans liste** figurent dans les 419 fiches hors alias. **1 127** rangs d’arrêt ont au moins une cellule horaire ; 135 n’ont qu’une référence insuffisante pour un décompte hebdomadaire. Les 3 779 autres n’ont pas d’heure fournie. Les 186 identités *famille/code* ne constituent pas un recensement de toutes les lignes en circulation à Dakar.

**Depuis le bilan `37657c1` :** 518 → 992 rangs décomptables (+474). Le dénominateur passe de 4 808 à 4 906 avec les deux fiches AFTU 60. Le nombre d’horloges à 19 h passe de 169 à 545 ; ce n’est pas le nombre de véhicules. Deux sens avec au moins un rang décomptable : DDD **7, 12, 16B, 311, 319** ; AFTU **42, 58, 60, 65, 73, 75** ; aucun TATA. La couverture par heure et par rang varie :

| Ligne / sens | Ce qui alimente réellement le panneau | Limite |
|---|---|---|
| DDD 319 | Liberté 6 → Ouakam : 27 rangs × 48 colonnes en semaine, × 31 le week-end. Autre sens : 26 × 54 et × 34. | Les durées varient selon la colonne ; les arrêts homonymes restent séparés. |
| DDD 16B | Vers Gare Palais : r1–19 et r79–83 sur 83, quatre types de jour, dont 78 départs le vendredi. Vers Malika : r1–14 et r82 sur 82. | Pas de compteur aux rangs intermédiaires non saisis. Dernière arrivée du vendredi vers Palais à 00:53 le samedi civil. |
| AFTU 58 | Mbao → Gueule Tapée : 39 × 88 en semaine, × 57 le week-end. Retour : 43 × 70 et × 51. | Pas sur Sahm/Comico. Les rangs anonymes restent anonymes. |
| AFTU 42 | Vers Guédiawaye : 68 × 65 en semaine, × 39 le week-end. | Vers Ouakam : seulement **4** colonnes matinales de 70 rangs. À 06:22 on ne redémarre pas le timer du terminus. |
| AFTU 60 | Colobane → Bargny : 50 × 16. Bargny → Colobane : 48 × 17. | Matin en semaine ; on ne prolonge pas au-delà de la prochaine origine non transcrite (08:40 / 07:10). Les repères TATA 60 n’héritent d’aucune de ces heures. |
| AFTU 73 **Lac Rose** | **Tous les 75 rangs** des 37/42 départs en semaine et 27/30 le week-end. Les 3 anciens repères par colonne sont conservés à la minute. Voir [le rang d’École Boune et le contrôle par copie de table](releve-218-73.md). | Une heure au Marché De Niaga ne donne pas le départ de la 73 de **Niague**. Aucune course du relevé à 05:31 n’a été ajoutée. |
| TATA | 1 : 12 repères du retour documentaire HLM Grand Yof → Lat Dior ; 53 : 10 repères de Lac Rose → Sébikotane, pas du retour vers Keur Massar. Les sections de 2020 sont isolées pour 1/36/37/50/52/63/78/83/84. | 1 458 repères ou secteurs, aucune grille par arrêt. Les limites tarifaires n’attestent pas la desserte actuelle ni le quai. |

Les **6 950** valeurs du [modèle historique](passages-bus-par-ligne.md) restent mesurées à part. Sur demande, une projection se lit **« Vers HH:MM »**, sans secondes, sans arcs verts et sans se substituer à une grille épuisée. Les grilles de panneau sont **hebdomadaires**, ni des observations de véhicule ni des courses opérateur certifiées pour une date. Les pièces indispensables manquent encore : ce n’est pas une livraison complète des dessertes de Dakar.

## Ce qui exige une preuve extérieure

Pour un changement physique, une longueur divisée par une vitesse de marche ne suffit plus. Il faut un chemin autorisé entre les bonnes portes avec un chronométrage revu **dans ce sens**, ou une permission explicite de rester au même point du quai et son délai minimal. S’y ajoutent deux courses du même jour et leurs heures aux bons appels. La [recette synthétique](preparer-une-correspondance.md) peut épingler deux départs précis malgré un direct plus rapide ; elle n’est pas un trajet de Dakar. L’absence de changement dans le calculateur ne signifie pas qu’aucun voyageur ne change sur place.

## Reproduire

```sh
npm run audit:bus-signs -- --dir /tmp/panneaux && diff -ru docs/panneaux /tmp/panneaux
npm run audit:bus-screen
node scripts/audit_passenger_transfers.mjs --at 2026-11-19T19:00 --markdown | cmp - docs/pieces-par-sens.md
node scripts/audit_place_connections.mjs --matrix --at 2026-11-19T19:00 | cmp - data/bus-review/replay-calculateur-2026-11-19.json
npm run build && npm test
python -m unittest discover -s tests
node --test $(git ls-files '*node-test.mjs')
# Sur la prévisualisation locale du bundle ; Playwright et Chromium hors du dépôt :
node scripts/smoke_bus_boards_mobile.mjs && node scripts/smoke_bus_journeys_mobile.mjs && node scripts/smoke_passenger_change_mobile.mjs
```

Dates des comparaisons : jeudi 19 et vendredi 20 novembre 2026, heure de Dakar. Les 144 sélections historiques, le lot de 150 puis les 154 points du formulaire courant sont comparés séparément ; aucune donnée de service TER/BRT modifiée. La [PR #275](https://github.com/aydiarra-star/dkrBus-apps/pull/275) rassemble le SHA, le diff de livraison et les résultats des contrôles à cette révision.
