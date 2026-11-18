# PR #270 — décision de livraison du moteur voyageurs

18 novembre 2026. **Ne pas fusionner ni déployer cette révision : l’audit npm complet signale toujours une vulnérabilité haute, sans version corrigée publiée.** L’audit de production est distinct et propre. La [PR officielle](https://github.com/aydiarra-star/dkrBus-apps/pull/270) conserve le moteur de `88b062b`, son historique, ses démonstrations et ses tests. La synchronisation a intégré `main` (`ff337f7`) **dans la branche de la PR**, pas l’inverse. Le [rapport initial](moteur-voyageurs-dakar-2026-11-18.md) reste le point de comparaison.

## Correspondances : où relever quoi ?

L’inventaire hors ligne comprend **huit dossiers, seize sens examinés séparément, zéro cheminement admis**. Les identifiants de catalogue désignent les extrémités à *instruire*, pas de nouveaux quais. Les coordonnées TER/BRT fournies dans `referenceCall` sont des repères de desserte. Les centres représentatifs des gares routières ne sont pas exportés comme des observations de quai.

| Couples à instruire (aller et retour indépendants) | Preuve disponible et prochaine vérification |
|---|---|
| TER Dakar / BRT Petersen ; TER Colobane / BRT Place de la Nation | [Deux distances historiques de référence](audit-connexions-graphe-multimodal-2026-11-18.md), pas des marches. Relever le quai de descente, sa sortie publique, les trottoirs et traversées continus, l’entrée et le quai de montée. À Dakar → Petersen il manque **aussi** une arrivée ferroviaire à Dakar et un départ B1 de Petersen dans les sens admis. À Petersen → Dakar, les deux dessertes ont le bon rôle ; la marche manque toujours. |
| BRT / DDD, BRT / AFTU et DDD / AFTU à Petersen | [Pôle CETUD, dessertes DDD et terminus AFTU documentés](audit-pole-petersen-acces-correspondances-2026-11-16.md). Identifier le quai **de la ligne et du sens** (ex. DDD 13/18, AFTU 4/25/29) et relever la circulation interne actuelle. Pas de `walkM: 0` voyageurs. |
| BRT / DDD à Guédiawaye | [Pôle documenté ; DDD 5 et 12](audit-poles-correspondance-2026-11-16.md). Localiser montée et descente DDD, contrôles d’accès et éventuelles traversées. La Préfecture est aujourd’hui une **origine**, pas une arrivée B1 admise. |
| TER / DDD et TER / AFTU à Colobane | [Station TER OSM 10245681535, position ferroviaire 9373889212, gare routière way 599927187 / nœud 560521498](colobane-walking-transfer-audit-2026-11-16.md). Les ~307 m entre repères sont à vol d’oiseau. Relever les **deux sites et leurs portes**, les quais DDD de la ligne concernée et, séparément, ceux d’AFTU 30 ou 33. Les conflits 59/64/74 ne sont pas résolus par le nom « Colobane ». |

À Grand Médine, « Marché » et « HLM » ne suffisent pas à identifier le même arrêt DDD ou la même entrée BRT. Aucune nouvelle desserte TATA n’est déduite du catalogue AFTU. Le [graphe piéton candidat](audit-graphe-pieton-candidat-2026-11-17.md) reste fragmenté (935 composantes) ; un chemin dans un extrait OSM n’est pas à lui seul une preuve d’accès public au quai.

### Mode d’emploi pour la revue

```sh
npm ci
npm run audit:passenger-transfers
npm run --silent audit:passenger-transfers -- --json > /tmp/inventaire.json
npm run --silent audit:passenger-transfers -- --packet releve.json --json
```

Un paquet correspond à **un seul sens**. Exemple de dossier volontairement vide (il **doit échouer**, sans distance calculée) :

```json
{
  "dossier": "petersen-brt-ddd",
  "fromStopId": "brt-petersen",
  "toStopId": "ddd-petersen",
  "dataset": { "places": [], "patterns": [], "footways": [] },
  "proof": {}
}
```

1. Fournir un sous-graphe de **revue isolé**, au [format `Dataset`](../src/routing/model.ts). Pour les deux services : arrêts ordonnés, sens, géométrie propre, temps et calendrier sourcés. Pour la marche : points et voies identifiés, géométries publiques orientées, obstacles/traversées contrôlés. Les nœuds de quai sont des `platform`, pas des `call`.
2. Renseigner `proof.alight` et `proof.board` avec `stopId`, `mode`, `platformId`, `lineId`, `direction` et la preuve datée liant le quai à cette desserte. `proof.path` indique `scope` (`internal` ou `via-street`), `wayIds` **en ordre de parcours**, `evidence` et, pour un chemin via la rue, `gates: [sortie, entrée]`. Chaque `evidence` comporte statut, référence précise (objet, plan ou relevé identifiable) et date. Produire une autre observation pour le retour ; ne pas retourner la liste des sommets.
3. L’[évaluateur](../src/routing/transferReview.ts) rejette les objets non admis, vérifie chaque extrémité, le rôle réel du quai dans la direction, la chaîne exacte et l’ordre des accès. Une chaîne incomplète n’a **ni mètres ni durée**. `ALIGHT_PLATFORM`, `BOARD_DIRECTION`, `DIRECTED_CHAIN`, `PUBLIC_GATES`, etc. indiquent le relevé à corriger. L’inventaire documentaire ne constitue pas un test de publication ; pour un paquet, code de sortie **0** = qualifié pour revue, **1** = bloqué, **2** = paquet illisible/invalide.
4. Même `qualified-for-review` n’atteste pas la véracité d’un relevé : examiner sa date, ses droits de réutilisation, les restrictions actuelles et la desserte auprès de la source. La mesure additionne les voies ; `walkStepFree` décrit **la marche seulement**, pas l’accessibilité des véhicules. La compatibilité des passages, le temps de marche et la marge restent calculés pour une **requête datée**. L’outil n’écrit rien dans le graphe voyageurs, Supabase ou Pages. Une activation demanderait une revue des données et des tests explicites dans les deux sens. Aucun GTFS public requis.

## Contrôles du moteur et corrections reproduites

- **Variante du copilote.** Sur deux options synthétiques calculées, la réponse « moins de marche » décrivait la ligne directe, mais « Ouvrir dans Trajet » dessinait le TER, la marche et le BRT de l’option la plus rapide. L’identifiant exact (services, sens, créneaux, voies) accompagne maintenant la réponse, les suivis et l’ouverture. Si l’option n’existe plus, aucune autre n’est dessinée à sa place sans sélection. Le résumé et la carte utilisent les mêmes étapes ; la durée totale affichée a le même arrondi que la réponse. Le test d’intégration compare **tous les sommets** avant/après changement de variante, puis après changement de profil et d’heure.
- **Origine du point.** Un point explicitement marqué `map` qui conservait par erreur l’identifiant et les coordonnées exactes d’un arrêt pouvait être traité comme un arrêt sélectionné. Il est maintenant refusé, comme les points de snapshot `stop`. Aucune projection GPS ou conversion d’identifiant.
- **Réseau réel.** Contrôle des **1 296 couples ordonnés** des 36 dessertes à 08:01 : 331 parcours dans le sens vérifié ; 965 refus (331 retours, 598 inter-réseaux, 36 points identiques). Les distances sont vérifiées par différence de chaînage sur **la source directionnelle** (écart < 0,1 m), avec contrôle des arrêts ordonnés, des sommets affichés et des secondes d’attente/roulage. Les sept exemples du rapport initial sont inchangés. Ex. Dakar → Pikine : 08:07–08:23, 11 305 m ; Préfecture → Petersen : 08:06–08:58, 17 500 m ; Préfecture → Rufisque reste refusé.
- **Séparation.** Ni les nouvelles fixtures ni les dossiers de revue n’entrent dans le bundle public. Aucun changement aux GeoJSON, voies, arrêts, tables, fréquences, jours fériés, migrations ou politiques privées par rapport à `main`. Les résultats multiples, changements de quai et correspondances manquées sont démontrés en test, **pas annoncés à Dakar**. TER phase 2, B2, DDD, AFTU/TATA, retours non certifiés et accès sans marches non documentés restent hors calcul.

## Sécurité : six entrées, une seule CVE

[GHSA-fc5q-39xc-vjpf / CVE-2026-112366](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) : déni de service par complexité excessive du traitement de certains motifs, sévérité haute (CVSS 7,5). Plage affectée `<=4.0.7`, `first_patched_version: null`, avis non retiré. Le [registre npm](https://registry.npmjs.org/picomatch/latest) et les [releases amont](https://github.com/micromatch/picomatch/releases) donnent **4.0.7** au contrôle du 18 novembre. Les six entrées concernent l’outillage de développement/build ; cela explique l’audit de production à zéro, **pas une dérogation**.

| Entrée `npm audit` | Installée | Chemin atteint ; constat |
|---|---:|---|
| `picomatch` | 4.0.7 | Seule instance résolue, vulnérabilité directe du paquet ; aucune version publiée hors plage. |
| `fdir` | 6.5.0 | Utilisé par `tinyglobby`, pair optionnel `picomatch` en version 3 ou 4 satisfait par 4.0.7. L’indication npm `fixAvailable: true` pour cette entrée ne supprime pas les autres chemins. |
| `tinyglobby` | 0.2.17 | Dernière version examinée : dépend de `fdir ^6.5.0` **et** de `picomatch ^4.0.4`. |
| `vite` | 8.3.3 | Dépend directement de `picomatch` et de `tinyglobby` ; même en 8.3.8 : `^4.0.7` et `^0.2.17`. |
| `vitest` | 5.0.3 | Dépend de `picomatch`, `tinyglobby` et de Vite ; même en 5.1.1, les deux premiers restent imposés et Vite 8 est dans la plage de pair. |
| `@vitejs/plugin-react` | 6.1.2 | Entrée indirectement affectée par son pair Vite ; 6.3.0 accepte Vite 8, sans éliminer la dépendance de celui-ci. |

**Essais matérialisés dans trois scénarios jetables, sans toucher au lockfile du projet :**

- `npm audit fix` **sans** `--force`, sur copie du lock seul puis avec arbre installé : npm 10.9.8 échoue dans son résolveur (`edgesOut`), sans proposer d’arbre sain. Ce défaut de npm n’est pas la preuve d’absence de correctif : la plage de l’avis, les versions publiées et les deux essais suivants le sont.
- Installation explicite dans le lock de Vite **8.3.8**, Vitest **5.1.1**, plugin React **6.3.0** : résolution réussie sous Node **22.22.3** (les deux premiers admettent cette version ; le plugin a pour pair Vite 8). TypeScript reste **5.6.3**. Audit de cet arbre : **les mêmes six hautes**, `picomatch@4.0.7`. Pas de modification inutile de la chaîne testée.
- Résolution isolée des rétrogradations proposées, Vite **6.2.7**, Vitest **3.1.4**, plugin **5.2.0** : **1 modérée, 4 hautes, 2 critiques** ; `picomatch` reste affecté. `tinypool` et `vitest` sont signalés critiques. Vite 6 ne préserve pas non plus la configuration de découpage Rolldown de Vite 8 telle quelle. **Aucune** de ces versions n’a été installée dans le projet.

**Condition de reprise.** Suivre l’avis et les [travaux amont](https://github.com/micromatch/picomatch/pull/260), pas un numéro de version supposé ni un fork non revu. Après publication d’une version explicitement corrigée : vérifier `npm view`, actualiser sur cette branche la résolution et, si les plages l’exigent, les consommateurs compatibles ; contrôler **toutes** les instances (`npm ls picomatch --all`), le diff du lock, les deux audits, les tests et le build sous Node 22, puis la CI du nouveau SHA. Autre voie : une chaîne Vite/Vitest maintenue qui **élimine réellement tous les chemins** et conserve les tests et le découpage, à valider avant substitution. Aucun renommage, override de camouflage, seuil abaissé, audit retiré ou fusion forcée. **Zéro CVE corrigée, zéro nouvel avis dans l’arbre livré ; un blocage réel.**

## Vérification reproductible

`npm ci` ; `npm run test:all` ; `npm run test:routing` ; `npm run demo:routing` ; `npm run audit:passenger-transfers` ; `npm run build` (TypeScript, Vite, intégrité des chunks et montage du bundle) ; `npm audit` ; `npm audit --omit=dev --audit-level=moderate` ; `git diff --check`. En complément : `node --test $(git ls-files '*node-test.mjs')`, filtre piéton Python et suites du validateur/worker GTFS. Les **workflows existants** vérifient aussi les migrations sur PostgreSQL 16 avec tests de concurrence, les contrôles Deno d’ingestion privée et la vérification de types des Edge Functions. Aucun flux externe ajouté au chemin critique du calcul. Les résultats de la révision poussée et les liens vers ses jobs sont consignés dans la PR, distincts de ceux de `main`.

| Contrôle local | Première révision de la PR | Révision de finalisation |
|---|---|---|
| Tests front / données Python | 979 / 247 | **1 000** (106 fichiers) / **264** ; les suites amont sont conservées |
| Routage ciblé ; démonstration | 39 ; 4 acceptations + 3 refus | **59** ; mêmes sept résultats, mêmes mètres, temps et sommets |
| Suites Node ; filtre piéton Python | 47 ; 3 | **47 ; 3**. Sous-ensemble Python validateur/worker/PBF/croisement ArcGIS : **89** réussis (inclus dans les 264) |
| Installation, TypeScript, build et smokes | réussis | réussis, aucun identifiant de fixture/dossier dans les chunks publics ; même avertissement d’import du registre ArcGIS |
| Audit complet ; audit production | 6 hautes ; 0 | **6 hautes** (sortie 1) ; **0**. Même avis, mêmes chemins et sévérités. Lockfile identique à `main`. |

Ingestion privée : les **15 tests multipart + 3 tests de garde projet** passent aussi localement sous Deno 2.9.6, sur copie isolée. Le `deno check` local ne peut pas charger les types de `jsr.io` dans cet environnement ; le job GitHub l’exécute sans cette restriction. La validation SQL de référence est celle du job PostgreSQL de la révision, et non une simulation sur SQLite. Ni migration sur une base de production ni import d’un flux voyageur n’ont été effectués.
