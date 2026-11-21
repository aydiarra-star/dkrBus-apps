# Livraison composite Arena · PR #275

L’objet de la [PR](https://github.com/aydiarra-star/dkrBus-apps/pull/275) est **la branche complète**, pas l’application d’un patch carte à la place des travaux bus. Le reçu des contrôles sur la tête livrée figure dans la PR ; les références ci-dessous servent à les reproduire, pas à attribuer les anciens checks au nouveau code.

## Revue des changements

- [Les 86 commits initiaux](commits-initiaux.tsv) : SHA, objet, lot, chemins touchés par rapport au premier parent, recouvrement avec le diff net et décision. L’ordre est celui du relevé de la PR, pas une suite de patches à rejouer.
- [Les 292 chemins initiaux](fichiers-initiaux.tsv) : statut et volume Git/GitHub, origine, rôle dans la livraison, contrôle associé et empreinte de la section du diff. Le total `35a7186…29853eb` est de **214 ajouts, 78 modifications, 483 blocs, +45 378 / −2 021**. Les 271 chemins antérieurs à la carte, les 13 propres à `29853eb` et les huit mixtes sont tous conservés. Un fichier de preuve ou de diagnostic n’est pas une nouvelle donnée voyageur.
- `077a7a2` est le `main` qui contient #276. Son diff depuis `35a7186` porte sur **20 chemins** ; le seul fichier aussi modifié par Arena est `ci.yml`. `af796f6` intègre ce `main` dans Arena, avec `29853eb` comme premier parent. Son arbre `dd8efd4` correspond au résultat du merge à trois voies, sans résolution manuelle. Le worker privé, l’ingestion, les migrations et les tests de quarantaine sont ceux de `main`. Les deux jobs SQL/Deno restent obligatoires en CI. Ni publication GTFS ni déploiement dans cette recette.

| Lot initial | Décision et validation pertinente |
|---|---|
| Portions, accès B1, inventaires (10 commits) | Fonctionnalité conservée : des portions ont une direction et des bornes. Rejouer les matrices des cohortes et les refus hors portion. Une géométrie n’est pas une course. |
| Médina/Maristes et revues physiques (17) | Conserver les directs qualifiés DDD 1 et la comparaison horaire 12/75, séparée d’un changement praticable. Tester le sens opposé, les arrivées, les accès et les cas refusés. |
| Panneaux, cellules et marche (22) | Changements réels et voulus du moteur et des panneaux, notamment `50ad865`. Conserver leur résultat **Arena** ; vérifier provenance, jours, rangs, origine des minutes, sorties bus et témoins OD complets. |
| Fiches, sites et accès documentaires (11) ; présentation/sources/lacunes (5) | Conserver les variantes, repères, liens et lacunes par sens. Régénérer panneaux et matrices, tester le DOM. Les sections de TATA ne sont pas des quais ni des heures. |
| TER (19), synchronisation historique (1) | Ne pas réappliquer les étapes intermédiaires. Sur les cinq chemins touchés par les 19 commits TER, seuls `App.tsx` et `App.css` contribuent encore au diff net initial ; leur diff agrège aussi les travaux bus/carte. Les tables de fréquence et le calcul des tableaux restent ceux de `main`. |
| Carte (`29853eb`, 1) | Garder le commit et le rendu ; tester chaque choix, et non seulement la présence des marqueurs. Les couches ne transforment pas un voisin en correspondance. |

### Ce que la finalisation corrige

- Deux arrêts DDD et AFTU pouvaient porter **le même nom aux mêmes coordonnées** : la liste transmettait le bon identifiant, mais le formulaire n’indiquait plus lequel avait été choisi. Départ et Destination gardent désormais le réseau de la référence. Un arrêt publié et un point libre restent dans leurs propres espaces d’identifiants.
- Le curseur était fixé au montage de `MapContainer`. Il suit à présent le mode de sélection. Le cadrage des points du trajet et du résultat respecte la préférence de mouvement réduit : la recette à horloge figée attend une carte stabilisée plutôt que de cliquer pendant un regroupement. Les reçus de carte couvrent les vrais clics et touchers, le clavier, les couches filtrées séparément, Petersen et Colobane, les cibles aux différents zooms et les 37 recentrages sur téléphone et ordinateur. [Tableau site par site](../carte-gares-et-stations.md).
- L’aide annonçait encore 13 gares et une ancienne grille de phase 1, en contradiction avec les 14 références et le tableau TER. La réponse horaire lit les périodes et missions existantes : aucune grille, aucun calcul, aucune heure source modifiés. On distingue grille théorique et passage réel ; la fiche opérateur d’octobre reste consultable comme document daté, pas comme dernier départ actuel. Le panneau d’audit ne simule plus d’imports différés de trois jeux de données déjà chargés par la carte et les panneaux voyageurs.
- Toutes les suites Node sont découvertes en CI. Les cinq recettes navigateur consomment **le même build** ; les tests de parcours interceptent les appels externes. La CI contrôle les dépendances de production **et** l’outillage. Les actions des quatre workflows concernés sont épinglées par SHA. Les tests synthétiques de #276 n’agissent pas sur la production.
- L’ancienne étape Overpass 217/218/219/228 pouvait se terminer en erreur tolérée, sans pièce jointe. Le nouvel essai conserve la réponse, ou exploite **l’extrait PBF du même run**, avec son URL, son SHA-256, sa propre emprise et ses membres ordonnés. Si aucune source ne répond, diagnostic explicite, pas de « zéro ligne » ; une pièce présente mais corrompue fait échouer le job. Les sondes tierces Maristes ne sont pas nécessaires à chaque push : le parseur reste couvert par ses fixtures, sans extraction de données voyageurs.

## Contrats de non-régression

`node scripts/audit_reference_surface.mjs --check` sérialise les **réponses complètes** (succès et refus, identifiants et étapes) pour tous les couples ordonnés de points sélectionnables du formulaire le 19/11/2026 à 19:00 UTC. Les 16 tableaux TER/BRT, aux huit instants documentés dans le script, incluent les deux sens, les missions à Diamniadio, les bornes de service et le dimanche. UTC et heure de Dakar coïncident.

| Arbre témoin | Points | Paires | Itinéraires complets | SHA-256 des réponses |
|---|---:|---:|---:|---|
| `main@077a7a2` avant intégration | 97 | 9 312 | 562 | `962bed20f3b908fd4ab9fde038ebec517a3dc0a38e50100bb5ec3dd320a980f4` |
| Arena `29853eb` avant intégration | 154 | 23 562 | 745 | `507b06642798dfc72d62a475fb90a2b5071cc48d76561db220648149a37d5351` |

Les périmètres des deux graphes sont différents **à dessein**. Il faut préserver la seconde matrice pour cette livraison composite, pas ramener Arena à 97 points. Avant `e70921f`, les deux témoins avaient **le même** SHA-256 pour les 296 lignes de tableaux : `2b0eb944ef8e60b91a5b0c4b0039468d89032dbe9cf129ccc5c174616a9ed5bb`. Les panneaux bus et leur origine par rang sont contrôlés en plus, en régénérant `docs/panneaux` et `docs/lacunes`. Une évolution volontaire ultérieure de ces contrats mérite une revue du diff, pas simplement la mise à jour d’une empreinte.

### Intégration de `main@e70921f` dans Arena (PR #275)

Témoins vérifiés **avant résolution** : [Arena `7eed304`](https://github.com/aydiarra-star/dkrBus-apps/commit/7eed3041fa9b6cdf654f7d95a0b3aee57b8b5268), [main `e70921f`](https://github.com/aydiarra-star/dkrBus-apps/commit/e70921fa912aad4cb527506d8fa1818802e2f5ef), ancêtre commun `077a7a2`. Pas de rebase. Les 15 commits propres à `main` incluent les états de service d’Explorer (#279), les bornes et projections TER et le tableau de 13 gares (#283).

- `App.tsx` : le voyant suit l’amplitude du jour à Dakar, même sans créneau. Seul un passage déclaré et en cours décompte. Les bus gardent « Par arrêt » ; la fermeture d’un réseau n’éteint pas une arrivée en cours à un arrêt. Le tableau différé Dakar–Diamniadio (13 gares, inversion du sens) coexiste avec le tableau jusqu’à AIBD (14 gares). Les légendes à Diamniadio lisent la cadence du passage, sans afficher 8/24 le dimanche (20/30).
- `App.css` : conservation des règles `.ter-dd-*` et des panneaux bus ; la couleur d’identité reste sur le badge, elle ne masque plus le voyant de service. La recette Chromium vérifie les trois couleurs effectives, les deux sens et les compteurs dans les deux thèmes.
- **Bundle** : le premier build combiné révélait un import du chunk d’entrée par le tableau TER différé. `vite.config.ts` isole l’horloge de référence partagée (fréquences, passages et calendrier) ; le garde anti-cycle, la CSP et les budgets de taille restent inchangés.
- **Trajets** : le témoin reste celui d’Arena ci-dessus (23 562 réponses complètes, y compris les refus). **BRT** : 8 tableaux / 184 lignes identiques aux deux parents. Pour le **TER**, le diff des objets complets ne change que `outboundAirport` à Diamniadio et `outbound` à AIBD, aux 8 instants : 16 passages sur 296 lignes de tableaux TER/BRT. `main` a corrigé l’origine de cette projection, sans changer la grille (8/24 en semaine). Par exemple, avant l’ouverture le 19/11 à 04:44:59 UTC, la mission aller part à 05:35 de Diamniadio et arrive à 05:47 à AIBD ; l’ancienne projection y ajoutait aussi le trajet depuis Dakar. Les deux sens du BRT, les autres lignes TER et les fréquences sont inchangés.
- Les 16 tableaux TER/BRT résultants correspondent intégralement à `e70921f` (`b3e748f721a3eb8c5700a927c3de0272c375d56d6e301eedb93a273888bffbb9`). Le nouveau tableau des 13 gares est contrôlé séparément : 8 instants × 2 sens × 13 gares, empreinte de `e70921f` `06b4a54d0744b28e427e1ace866f5b5b8eb8722ab89a11aebe964fff32174d49`. `--check` exige ces témoins indépendants, pas seulement des nombres identiques.

### Rejouer sur un checkout propre

```sh
npm ci && npm run build
npm run test:all                         # Vitest, Node, Python
node scripts/audit_reference_surface.mjs --check
node scripts/audit_place_connections.mjs --matrix --at 2026-11-19T19:00 > /tmp/arena-od.json
cmp data/bus-review/replay-calculateur-2026-11-19.json /tmp/arena-od.json
npm install --prefix /tmp/arena-browser --no-save --ignore-scripts playwright-core@1.65.1
BROWSER_TOOLS=/tmp/arena-browser CHROMIUM_PATH="$(command -v google-chrome)" npm run smoke:arena
npm audit --omit=dev && npm audit
```

**Limites métier conservées.** 70 références sur la carte ne signifient pas 70 offres de service datées. Les zones, les repères de voirie et les fixtures ArcGIS ne sont ni des arrêts d’opérateur supplémentaires ni des preuves de changement. AFTU 83 : deux ordres documentaires, pas de feuille de marche fournie, pas de nouveaux horaires officiels. Les tests de cette PR sont possibles sans attendre un GTFS. [Panneaux et lacunes par réseau](../panneaux/README.md).
