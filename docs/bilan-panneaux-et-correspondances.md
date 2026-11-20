# Panneaux bus et correspondances : résultat de la revue

**À Dakar, au moins un passage de semaine peut être décompté sur 518 des 4 808 rangs d’arrêt du catalogue (10,77 %). À 19 h il en reste 169. Aucune nouvelle correspondance n’est démontrée.** Ces deux résultats ne portent pas sur le même objet : une cellule d’une fiche hebdomadaire suffit à renseigner le panneau, mais pas à engager un voyageur sur une deuxième course.

## Où trouver le détail

| Question | Réponse vérifiable |
|---|---|
| Combien d’arrêts et d’heures dans chaque sens ? | [Inventaire par variante](panneaux/README.md) et [CSV des fiches](panneaux/fiches.csv) : axes, premier/dernier libellés, portée, rangs avec heure, séries de semaine, estimations, source et comparaison des ordres. Les circuits, extraits et retours non fournis ne sont pas inversés. |
| Cet arrêt a-t-il un compteur ? | Une ligne par occurrence : [DDD](panneaux/ddd.csv), [AFTU](panneaux/aftu.csv), [TATA](panneaux/tata.csv). Suivre la clé `fiche` vers les [heures imprimées par colonne](panneaux/heures.csv). Quand il n’y a pas d’heure admissible, la matrice en donne la raison. |
| Quelles lignes sait-on faire emprunter ? | [État par ligne du calculateur](etat-par-ligne-2026-11-19.md). Les listes d’arrêts sur fiche ne sont pas des quais localisés et une archive n’est pas un calendrier d’aujourd’hui. |
| Que manque-t-il pour changer ? | [Enquête à Ponty, Colobane, Ouakam, aux gares et à Petersen](enquete-correspondances.md) ; [toutes les évaluations et pièces par sens](pieces-par-sens.md). Le contrôle des 31 dossiers précédents reste en place ; trois pistes supplémentaires portent l’inventaire à **34 dossiers / 68 sens / 70 évaluations**. |
| Où sont les quatre tableaux 218/73 ? | [Résumé reçu](releve-218-73.md) et [demande détaillée à transmettre](enquete-correspondances.md#demande-à-transmettre-aux-exploitants-non-envoyée). Aucun original obtenu. Les départs signalés et la grille historique de la 73 restent séparés ; Niague vs Lac Rose non tranché. |

## Lire les nombres sans leur faire dire davantage

| Famille | Codes du catalogue | Fiches sans liste / hors alias | Rangs classés arrêts | Avec ≥ 1 heure sur fiche, même isolée | Avec ≥ 1 décompte en semaine | À 19 h le jeudi |
|---|---:|---:|---:|---:|---:|---:|
| DDD | 48 | 4 / 111 | 1 322 | 344 | 216 (16,34 %) | 153 |
| AFTU | 73 | 57 / 158 | 3 486 | 375 | 302 (8,66 %) | 16 |
| TATA | 65 | 10 / 133 | 0 | 0 | 0 (pourcentage indéfini) | 0 |

- **7 533 rangs affichables** : 4 808 arrêts, 2 265 repères de parcours, 407 secteurs et 53 origines seules. Les **71 sens/variantes sans liste** n’ajoutent aucun rang mais restent visibles dans l’inventaire. Les 1 336 repères et secteurs TATA ne sont pas des arrêts vérifiés. Les **186 identités** sont des couples *famille/code* trouvés dans le projet, pas un recensement terrain de toutes les lignes en exploitation.
- **719** rangs d’arrêt ont au moins une heure sur fiche ; **201** n’ont qu’un échantillon ou une référence insuffisante pour compter en semaine. Les **4 089 autres** n’ont pas d’heure utilisable. Aucun horaire d’édition opérateur du jour ni observation de véhicule attribuable à ces rangs dans la recette.
- Depuis `bac6609` : dix transcriptions de semaine DDD **7/12** et AFTU **42/65/75**, soit **7 717 cellules**. Ne pas confondre nombre de cellules, nombre de rangs et nombre de prochains passages disponibles à une heure donnée. Les **deux** directions de la 7 ont leur tableau de semaine complet ; plusieurs autres transcriptions s’arrêtent le matin ou ne couvrent que les premiers rangs. La 311 reprend explicitement les 28/27 colonnes de semaine et 18/17 du samedi ; son circuit non apparié n’en hérite pas. La 1 gagne deux listes opérateur dont une partielle, **pas** des heures à Ponty.
- Deux sens avec au moins **un** rang décomptable en semaine : DDD **7, 12, 311** ; AFTU **42, 65, 73, 75** ; **aucun TATA**. Cela ne signifie pas deux sens complets. Par exemple, sur la 73 Lac Rose, l’heure est fournie pour **3 rangs sur 75** par sens. Les autres ne reçoivent pas le compteur du terminus.
- En ouvrant un panneau, seules des heures sourcées font apparaître les minutes vertes et leur détail à la seconde. Les **6 950** valeurs de l’[ancien modèle](passages-bus-par-ligne.md) restent calculables à part. Sur demande, la projection est affichée comme **« Vers HH:MM »**, sans horloge, sans arcs verts et sans se substituer à une fin de grille. Les résumés DDD et AFTU/TATA invitent à choisir l’arrêt ; la moyenne d’un réseau n’est plus un faux prochain départ.

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
