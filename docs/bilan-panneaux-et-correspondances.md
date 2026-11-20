# Panneaux bus et correspondances : résultat de la revue

**À Dakar, au moins un passage de semaine peut être décompté sur 1 792 des 4 906 rangs d’arrêt du catalogue (36,53 %). À 19 h le jeudi d’essai, 861 de ces rangs indiquent un prochain passage. Aucune nouvelle correspondance n’est démontrée.** Ces deux résultats ne portent pas sur le même objet : une suite d’heures hebdomadaires peut alimenter un panneau, mais ne prouve ni le quai ni la deuxième course à la date du voyage.

## Où trouver le détail

| Question | Réponse vérifiable |
|---|---|
| Combien d’arrêts et d’heures dans chaque sens ? | [Inventaire par variante](panneaux/README.md) et [CSV des fiches](panneaux/fiches.csv) : axes, premier/dernier libellés, portée, rangs avec heure, séries de semaine, estimations, source et comparaison des ordres. Les circuits, extraits et retours non fournis ne sont pas inversés. |
| Cet arrêt a-t-il un compteur ? | Une ligne par occurrence : [DDD](panneaux/ddd.csv), [AFTU](panneaux/aftu.csv), [TATA](panneaux/tata.csv). Suivre la clé `fiche` vers les [heures imprimées par colonne](panneaux/heures.csv). Quand il n’y a pas d’heure admissible, la matrice en donne la raison. |
| Quelles lignes sait-on faire emprunter ? | [État par ligne du calculateur](etat-par-ligne-2026-11-19.md). Les listes d’arrêts sur fiche ne sont pas des quais localisés et une archive n’est pas un calendrier d’aujourd’hui. |
| Que manque-t-il pour changer ? | [Enquête à Ponty, Colobane, Ouakam, aux gares et à Petersen](enquete-correspondances.md) ; [toutes les évaluations et pièces par sens](pieces-par-sens.md). Depuis `3e97a99`, cinq nouveaux dossiers portent l’inventaire à **43 dossiers / 86 sens / 88 évaluations**. Les 88 restent bloquées avant horaire. |
| Où sont les quatre tableaux 218/73 ? | [Résumé reçu](releve-218-73.md) et [demande détaillée à transmettre](enquete-correspondances.md#demande-à-transmettre-aux-exploitants-non-envoyée). Aucun original obtenu. Les départs signalés et la grille historique de la 73 restent séparés ; Niague vs Lac Rose non tranché. |

## Lire les nombres sans leur faire dire davantage

| Famille | Codes du catalogue | Fiches sans liste / hors alias | Rangs classés arrêts | Avec ≥ 1 heure sur fiche, même isolée | Avec ≥ 1 décompte en semaine | À 19 h le jeudi |
|---|---:|---:|---:|---:|---:|---:|
| DDD | 48 | 4 / 111 | 1 322 | 752 | 690 (52,19 %) | 374 |
| AFTU | 73 | 56 / 159 | 3 584 | 1 175 | 1 102 (30,75 %) | 487 |
| TATA | 65 | 9 / 149 | 0 | 0 | 0 (pourcentage indéfini) | 0 |

**7 753 rangs affichables** : 4 906 arrêts, 2 287 repères, 507 secteurs et 53 origines seules. Les **69 fiches sans liste** figurent dans les 419 fiches hors alias. **1 927** rangs d’arrêt ont au moins une cellule horaire ; 135 n’ont qu’une référence insuffisante pour un décompte hebdomadaire. Les 2 979 autres n’ont pas d’heure fournie. Les 186 identités *famille/code* ne constituent pas un recensement de toutes les lignes en circulation à Dakar.

**Depuis `3e97a99` : 992 → 1 792 rangs décomptables (+800), 545 → 861 actifs le jeudi à 19 h (+316)**, sur le même dénominateur. Deux sens avec au moins une série : DDD **6, 7, 12, 16A, 16B, 23, 311, 319** ; AFTU **30, 42, 57, 58, 60, 65, 66, 73, 75**. Aucun en TATA. Une série du matin ne couvre pas la soirée.

La [revue des six lignes et des calendriers](mission-couverture-bus.md#résultat-sur-le-même-catalogue) indique les terminus, rangs, colonnes et prochaines origines à saisir. **DDD 16A et AFTU 57** couvrent maintenant les deux sens de leurs fiches de semaine et de week-end. **AFTU 30** est complète depuis Colobane, pas vers Colobane. **DDD 6/23 et AFTU 66** n’ont encore que les débuts de semaine. Les [lacunes de toutes les variantes](lacunes/lacunes-par-sens.csv) distinguent un dimanche sans service indiqué d’un dimanche non transcrit. Les six mentions TATA (SETER et reportage sur la 67) ne sont pas des rangs horaires. Aucune heure de TATA Thiès ou d’un code AFTU homonyme n’est reprise.

Les **6 950** valeurs du [modèle historique](passages-bus-par-ligne.md) restent mesurées à part. Sur demande, une projection se lit **« Vers HH:MM »**, sans secondes, sans arcs verts et sans se substituer à une grille épuisée. Les grilles de panneau sont **hebdomadaires**, ni des observations de véhicule ni des courses opérateur certifiées pour une date. Les pièces indispensables manquent encore : ce n’est pas une livraison complète des dessertes de Dakar.

## Ce qui exige une preuve extérieure

Pour un changement physique, une longueur divisée par une vitesse de marche ne suffit plus. Il faut un chemin autorisé entre les bonnes portes avec un chronométrage revu **dans ce sens**, ou une permission explicite de rester au même point du quai et son délai minimal. S’y ajoutent deux courses du même jour et leurs heures aux bons appels. La [recette synthétique](preparer-une-correspondance.md) peut épingler deux départs précis malgré un direct plus rapide ; elle n’est pas un trajet de Dakar. L’absence de changement dans le calculateur ne signifie pas qu’aucun voyageur ne change sur place.

## Reproduire

```sh
npm run audit:bus-signs -- --dir /tmp/panneaux && diff -ru docs/panneaux /tmp/panneaux
python -m scripts.audit_bus_gaps --boards /tmp/panneaux --output /tmp/lacunes && diff -ru docs/lacunes /tmp/lacunes
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
