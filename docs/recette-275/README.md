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
- Le curseur était fixé au montage de `MapContainer`. Il suit à présent le mode de sélection. Les reçus de carte couvrent les vrais clics et touchers, le clavier, les couches filtrées séparément, Petersen et Colobane, les cibles aux différents zooms et les 37 recentrages sur téléphone et ordinateur. [Tableau site par site](../carte-gares-et-stations.md).
- L’aide annonçait encore 13 gares et une ancienne grille de phase 1, en contradiction avec les 14 références et le tableau TER. La réponse horaire lit les périodes et missions existantes : aucune grille, aucun calcul, aucune heure source modifiés. On distingue grille théorique et passage réel. Le panneau d’audit ne simule plus d’imports différés de trois jeux de données déjà chargés par la carte et les panneaux voyageurs.
- Toutes les suites Node sont découvertes en CI. Les cinq recettes navigateur consomment **le même build** ; les tests de parcours interceptent les appels externes. La CI contrôle les dépendances de production **et** l’outillage. Les actions des quatre workflows concernés sont épinglées par SHA. Les tests synthétiques de #276 n’agissent pas sur la production.
- L’ancienne étape Overpass 217/218/219/228 pouvait se terminer en erreur tolérée, sans pièce jointe. Le nouvel essai conserve la réponse, ou exploite **l’extrait PBF du même run**, avec son URL, son SHA-256, sa propre emprise et ses membres ordonnés. Si aucune source ne répond, diagnostic explicite, pas de « zéro ligne » ; une pièce présente mais corrompue fait échouer le job. Les sondes tierces Maristes ne sont pas nécessaires à chaque push : le parseur reste couvert par ses fixtures, sans extraction de données voyageurs.

## Contrats de non-régression

`node scripts/audit_reference_surface.mjs --check` sérialise les **réponses complètes** (succès et refus, identifiants et étapes) pour tous les couples ordonnés de points sélectionnables du formulaire le 19/11/2026 à 19:00 UTC. Les 16 tableaux TER/BRT, aux huit instants documentés dans le script, incluent les deux sens, les missions à Diamniadio, les bornes de service et le dimanche. UTC et heure de Dakar coïncident.

| Arbre témoin | Points | Paires | Itinéraires complets | SHA-256 des réponses |
|---|---:|---:|---:|---|
| `main@077a7a2` avant intégration | 97 | 9 312 | 562 | `962bed20f3b908fd4ab9fde038ebec517a3dc0a38e50100bb5ec3dd320a980f4` |
| Arena `29853eb` avant intégration | 154 | 23 562 | 745 | `507b06642798dfc72d62a475fb90a2b5071cc48d76561db220648149a37d5351` |

Les périmètres des deux graphes sont différents **à dessein**. Il faut préserver la seconde matrice pour cette livraison composite, pas ramener Arena à 97 points. Les deux témoins ont en revanche **le même** SHA-256 pour les 296 lignes de tableaux : `2b0eb944ef8e60b91a5b0c4b0039468d89032dbe9cf129ccc5c174616a9ed5bb`. Les panneaux bus et leur origine par rang sont contrôlés en plus, en régénérant `docs/panneaux` et `docs/lacunes`. Une évolution volontaire ultérieure de ces contrats mérite une revue du diff, pas simplement la mise à jour d’une empreinte.

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
