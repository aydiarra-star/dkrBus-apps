# Chercher une correspondance à Dakar

## Ce que voit le voyageur

**Un trajet tracé** relie exactement les deux points choisis. Il peut enchaîner des véhicules TER, BRT, DDD, AFTU ou TATA et de la marche. Pour changer de véhicule, il faut pouvoir descendre, marcher dans le bon sens, puis monter à temps. Les heures sont théoriques ou projetées selon la fréquence ; ce n’est pas du temps réel. Dans *Trajet*, choisir l’heure de Dakar, les réseaux, « direct uniquement » ou jusqu’à cinq changements. Le filtre sans marches écarte aussi les accès d’accessibilité inconnue et les suggestions documentaires.

**Un tronçon seul** suppose que le voyageur se trouve déjà au départ de ce tronçon. Il faut le choisir explicitement pour changer les points et l’afficher sur la carte.

**Un changement à confirmer** donne le secteur, le libellé de descente de la première source, celui de montée de la seconde, et la question à poser sur place. Par exemple, **gare TER de Dakar → localité de Keur Massar, 18/11/2026 à 19 h** :

1. Le tronçon **TER Dakar → Bargny** peut être demandé et tracé séparément.
2. La [fiche officielle AFTU 74](https://aftu-senegal.org/map/dakar-urbain-ligne-74/) cite **« Terminus Bargny (Gare ferroviaire) »** puis **« Terminus Keur Massar »**. Elle ne place ni le quai à la sortie du TER, ni le terminus bus au repère de destination.
3. Demander au réseau l’accès entre les deux quais, si cet arrêt est desservi dans le sens voulu et l’heure du dernier bus. **Aucune heure de montée sur le 74, durée totale, marche ou arrivée à Keur Massar** n’est calculée avec cette fiche. Le copilote ne mémorise pas ce changement comme un voyage accompli.

L’index utilise les positions **dans l’ordre d’une même fiche** et des libellés de secteurs explicites : Petersen, Colobane, Bargny gare, Guédiawaye, Grand Médine, UCAD, Lat Dior, ainsi que les deux paires de gares Dakar/Petersen et Colobane/Place de la Nation. Il ne joint pas les deux réseaux par toutes les rues homonymes. Deux fiches de même numéro AFTU/TATA ne constituent pas un changement. Les circuits DDD sont lus dans l’ordre, sans boucler artificiellement sur le terminus ; les fiches TATA indépendantes gardent leur provenance. On ne déduit ni quai DDD de la station BRT du même nom, ni correspondance à la gare TER Rufisque d’une mention de SONADIS. Voir les [dossiers des pôles](audit-poles-correspondance-2026-11-16.md), [Petersen](audit-pole-petersen-acces-correspondances-2026-11-16.md), [Colobane](colobane-walking-transfer-audit-2026-11-16.md) et [Bargny/Rufisque](audit-geographique-rufisque-bargny-keur-massar-sangalkam-2026-11-16.md).

Pour deux points sans résultat, l’utilisateur peut également **choisir** de les ouvrir dans Google Maps (transports ou marche). Seules les coordonnées sont inscrites dans ce lien externe, pas l’heure et les filtres. Il n’y a ni appel en arrière-plan à ce calculateur, ni import de ses résultats. Cette option n’est pas une validation d’accessibilité.

## Couverture réellement livrée sur Pages, sans API

Les mêmes **97 sélections**, **9 312 couples orientés distincts**, à 19 h le 18 novembre à Dakar, avec les valeurs par défaut :

| Résultat entre les sélections initiales | #273 | Cette version |
|---|---:|---:|
| Trajet complet entre les points demandés | 331 | **562** |
| Tronçon entre arrêts seulement, après substitution | 849 | **1 354** |
| Ni trajet complet ni tronçon entre arrêts | 8 132 | **7 396** |

**1 221 recherches non abouties** présentent aussi au moins un changement à vérifier ; ce nombre recoupe les deux dernières lignes. Aucun de ces rapprochements n’est compté comme trajet complet. Les 16 sens de l’inventaire terrain restent bloqués, zéro arc piéton admis dans le réseau embarqué.

Avec la même sélection à **08:10**, on retrouve 562 trajets complets. À **21:10**, il en reste **288** (un départ antérieur du terminus peut encore passer à un arrêt intermédiaire). À 19 h en **sans marches strict**, zéro complet, zéro tronçon et zéro piste documentaire ; c’est une absence de preuve d’accessibilité, pas l’affirmation que tous les quais sont inaccessibles.

Les **231 couples complets supplémentaires** sont les couples dans l’ordre des **22 appels** de B1 **Petersen → Gueule Tapée**. Ce n’est pas un nouveau terminus d’exploitation. La [relation OSM 19961993](https://www.openstreetmap.org/relation/19961993) a son propre tracé (60 voies, raccord maximal déclaré 0 m, extraction du 14/11). Les 22 appels se projettent dans l’ordre à environ 10–15 m. Le dernier appel de la ligne complète, Préfecture, est à **93,4 m**, hors du seuil de 80 m : il n’est pas admis. Le tracé utilisé est découpé à la projection de Gueule Tapée ; aucun point n’a été déplacé ni aucun seuil assoupli. La grille B1 du projet s’applique au départ de Petersen, origine réelle de cette direction ; la durée à bord est modélisée sur **sa** voie. Le nombre de stations du modèle omnibus n’est pas une attestation de desserte de chaque quai le jour du voyage. Les [deux relations](brt-b1-directional-geometry-audit-2026-11-15.md) et les [paires arrêt/quai OSM](osm-b1-stop-platform-pair-audit-2026-11-13.md) restent distinctes. Aucun TER inverse, B2 ou raccordement rue/quai n’est ajouté par symétrie.

```sh
npm run audit:place-connections -- --matrix --at 2026-11-18T19:00
npm run audit:place-connections -- --from ref:ter-dakar --to landmark:keur-massar --at 2026-11-18T19:00
npm run audit:place-connections -- --from ref:brt-petersen --to ref:brt-gueule-tapee --at 2026-11-18T20:54
npm run audit:passenger-transfers -- --json
```

## Raccorder un réseau daté sur un hébergement avec API

GitHub Pages ne sert pas l’API Python. **Aucune donnée de test ou nouvelle publication opérateur n’est embarquée.** Sur un serveur disposant d’un GTFS réellement publiable :

1. Passer par la procédure **existante** de validation, staging, revue et publication. Seul le snapshot actif, courant et conforme à l’empreinte du journal est utilisable. Pour un changement entre opérateurs GTFS, les services concernés doivent coexister dans le snapshot publié. Le service `/api/journeys` reste le service séparé de **courses directes** ; ses raccords par proximité ne sont jamais importés.
2. Préparer **hors du dépôt** un JSON de revue pour la diffusion publique. Ne pas y inclure de notes privées. Champs d’en-tête : `version: 1`, `public: true`, `attribution`, `snapshot_id`, `database_sha256`, `first_day`, `last_day` (dates ISO inclusives). Une simple copie d’une vieille revue sur une nouvelle base est refusée.
3. Pour chaque entrée de `directions`, renseigner `id` unique, `mode` (`ter`, `brt`, `ddd`, `aftu`, `tata`), `agency_id`, `route_id`, `direction_id` (`"0"` ou `"1"`), `direction` lisible, `shape_id`, **tous** les `stop_ids` dans l’ordre revu et `evidence: {status: "reviewed", reference, date}`. L’attribution et la référence doivent remonter à une source réutilisable vérifiée pour ce sens. L’accessibilité `stepFree` est `unknown` par défaut ; `yes` exige une revue de toute la desserte. Une interdiction fauteuil explicite dans le GTFS prime sur cette revue.
4. Ne fournir des `platformBindings` directionnels que pour des observations de **montée ou descente** : `{stopId, role: "board" | "alight", platformId, stepFree, evidence}`. Dans `links.places`, décrire les lieux physiques avec identifiant, nom, coordonnées, `kind` (`platform`, `entrance` ou `path`) et preuve. Dans `links.footways`, renseigner **chaque arc dirigé** avec `id, from, to, name, kind, access: "public", crossingsAndBarriersChecked: true, stepFree, evidence, positions: [{lat, lon}, …]`. Relever les accès publics et traversées entre sites. Ne pas fabriquer le retour ni une droite entre centroïdes. Les identités physiques sont isolées par snapshot, sauf un `landmark:` explicitement relevé. `links.platformBindings` peut relier un tel quai à une desserte locale existante en précisant en plus son `mode, lineId, direction` exacts. Le [modèle](../src/routing/model.ts) et la [fixture entièrement fictive](../tests/passenger_edition_fixture.py) montrent les champs et leurs relations.
5. **Avant activation**, tester la revue contre le vrai snapshot et le moteur du navigateur, pour chaque sens et jour d’intérêt. Par exemple, avec des variables pointant vers ses propres fichiers et arrêts :

   ```sh
   edition=$(mktemp)
   python3 -m scripts.passenger_network --root "$PUBLISHED_ROOT" --review "$REVIEW" --date "$DAY" > "$edition" &&
   npm run audit:place-connections -- --edition "$edition" --at "${DAY}T08:00" \
      --from "published:$ORIGIN_ID" --to "published:$DESTINATION_ID" --max-changes 2
   ```

   Rejouer après le dernier départ, en sens inverse et avec `--step-free`. Ces commandes **n’activent rien**. Après revue et autorisation, l’exploitant installe le JSON de revue par remplacement atomique dans `$PUBLISHED_ROOT/.passenger-reviews/<snapshot_id>.json` (pas le fichier `edition.json`). Retirer ce fichier désactive le complément. Ni dépôt HTTP de revue ni promotion de données candidates depuis le navigateur.

**Contrat de lecture.** `/api/network` annonce la présence facultative de la revue. `GET /api/passenger-network?snapshot=…&date=AAAA-MM-JJ` compile les courses du jour à Dakar depuis SQLite : `calendar_dates` prime sur `calendar`, les appels, tracés et horaires doivent correspondre. Les profils de temps de parcours distincts restent séparés. Les fréquences GTFS `exact_times=1` sont dépliées jusqu’à la borne de fin **exclue**. Cette première version refuse notamment les fréquences inexactes, les règles particulières de transfert/minimum/interdiction, les restrictions intermédiaires de prise en charge et les heures à partir de 24:00 ; elle ne les interprète pas comme des permissions. Les `pathways` GTFS ne sont pas importés. Un arrêt publié et un appel du modèle local gardent des identités distinctes, même s’ils portent le même nom : cette édition ne remplace pas les horaires locaux par homonymie. Édition bornée en octets et en travail de projection. Le navigateur vérifie de nouveau géométries, directions et continuité ; une entrée invalide fait refuser tout le complément.

La réponse n’est pas stockée dans le service worker. Revalidation de la révision à la reprise de l’onglet et toutes les minutes quand il est visible, sans renvoyer la géométrie inchangée. Annulation d’une requête dépassée, retour au réseau local si la revue est retirée, la date change ou la réponse échoue. Aucune coordonnée du voyageur n’est envoyée à cet endpoint. Le moteur compare les arrêts candidats par un balayage daté multi-destination par point de montée, pas par une requête HTTP par couple. Comparaison à données constantes (36 points du graphe, 1 260 couples distincts, 19 h) : mêmes **562 identifiants de parcours**. Médiane de 17 répétitions à chaud sur Node 22 dans l’environnement de test : **19,2 ms** en relançant la recherche pour chaque paire, **7,6 ms** en balayant toutes les destinations. Ce n’est pas un temps de réponse garanti sur téléphone.

**Preuve fonctionnelle, pas preuve de terrain.** Le test inter-langages construit une publication SQLite temporaire et passe la vraie réponse Python à TypeScript : cinq modes, quatre traversées dirigées, départs de 08:00 à 08:40, arrivée 08:45. Le changement DDD → AFTU de cette fixture est aussi vérifié sur le bundle mobile : deux tracés véhicule et un chemin de marche, arrivée 08:35, aucun tracé en mode direct ou si le dernier départ est manqué. Sur le même navigateur (390 × 844), le retrait du dossier de revue enlève les tracés ; après une seconde publication au même nom d’arrêt, il faut **resélectionner** les arrêts. Le test statique utilise le service worker actif, sans API. Ces horaires et ces quais de recette n’existent que dans le test.
