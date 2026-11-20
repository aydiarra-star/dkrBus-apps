# Carte de Dakar : quels points peut-on réellement ouvrir ?

**À Petersen, toucher le marqueur puis choisir BRT, DDD ou AFTU.** À Colobane, la gare TER, les références DDD et AFTU, et le point TATA voisin ont chacun leur entrée. `+n` signifie « n autres points à ce zoom », pas « n correspondances ». Dans un groupe, **Zoomer ici** détaille le secteur ; **Centrer** ou **Situer ce point** vise les coordonnées de l’entrée choisie. Le losange repère une information géographique, pas un départ de bus.

## Avant / après sur le dépôt officiel

Avant : bundle de la branche Arena synchronisée (`0fb3013`), avec les mêmes règles de masquage que sur sa tête entrante `f1f6685` et sur `main` `35a7186`. Chromium, 393 × 852 et 1366 × 900, couches locales actives, sans fond de tuiles ni réponse opérateur. Le nombre de marqueurs dans le DOM **ne prouve pas** qu’on puisse les toucher.

| Identités du fonds local | Avant : représentées | Après : ouvrables |
|---|---:|---:|
| Gares TER | 14 / 14 | 14 / 14 |
| Stations BRT | 23 / 23 | 23 / 23 |
| Arrêts de référence DDD | 5 / 14 | 14 / 14 |
| Arrêts de référence AFTU | 6 / 13 | 13 / 13 |
| Points de référence TATA | 0 / 6 | 6 / 6 |
| Repères de couverture (certains multi-réseaux) | 23 / 24 | 24 / 24 |
| Repères des portions bus déjà relues | 0 / 43 dans Explorer | 43 / 43, sans horaire |

- À **35 m d’une voie** TER/BRT, l’ancienne carte supprimait les réseaux autres que celui de la voie. Cela effaçait 16 arrêts de référence, dont les deux bus de Petersen, et le repère de couverture Guédiawaye (DDD 220 / AFTU 79). L’AFTU Lat Dior disparaissait près de la voie TER, même sans gare à 300 m. Le filtre s’appliquait aussi aux arrêts publiés et aux points ArcGIS.
- Une deuxième règle supprimait les homonymes AFTU/TATA à **150 m** : les six points TATA disparaissaient, y compris Keur Massar. Le libellé générique AFTU ne permettait pas de les distinguer. Aucune règle de ce type ne subsiste dans le rendu. Le commutateur AFTU / TATA reste commun, les identités restent distinctes.
- Parmi les **71 marqueurs** alors dessinés, le centre de **38** était sous un *autre marqueur* à l’ouverture, sur chacune des deux tailles. Aujourd’hui une seule cible occupe chaque emplacement d’écran en conflit ; sa liste conserve **chaque identifiant**, y compris au zoom maximal. Une position non déclarée ne devient pas pour autant cartographiable.
- Avec DDD **et** AFTU/TATA désactivés, les 23 repères de couverture restaient à l’écran. Les filtres portent maintenant aussi sur les entrées multi-réseaux (et leur texte), les données publiées de réseau identifiable et la couche historique. Le bouton Couches a un nom accessible sur téléphone ; la liste défile dans l’espace disponible, et les boutons de la légende reçoivent le toucher au lieu de le laisser traverser la carte.
- Le build bloquait ses propres lectures historiques DDD (`connect-src 'self'`). La politique du bundle autorise, en plus de la même origine, **uniquement les 37 URL `/query`** du registre ArcGIS de géométrie. Pas de joker ni d’autre service ; la carte n’envoie ni position voyageur, ni identifiants de connexion, ni référent. Les enregistrements restent séparés par couche, ligne et identifiant source, non par latitude/longitude arrondies. Leur disponibilité distante n’est pas garantie.

## Les 37 sites, y compris ceux sans point bus voisin dans le fonds local

**300 m est une fenêtre d’inventaire**, jamais un seuil de rendu, une distance à pied, un temps de trajet ou une règle de correspondance. Les distances sont mesurées entre les coordonnées du dépôt, arrondies au mètre ; `0` ne prouve pas un quai commun. Sont examinés ici les 33 points bus de référence, 24 repères de couverture et 43 repères de portions, pas un inventaire exhaustif de la rue, un flux publié ou des lectures ArcGIS variables.

| Gare ou station | Points bus locaux à 300 m ou moins (écart géographique) |
|---|---|
| TER · Dakar | — |
| TER · Colobane | DDD (0 m), AFTU (0 m), TATA (63 m) |
| TER · Hann | — |
| TER · Dalifort | — |
| TER · Baux Maraîchers | — |
| TER · Pikine | DDD (0 m), AFTU (0 m), TATA (36 m) |
| TER · Thiaroye | — |
| TER · Yeumbeul | — |
| TER · Keur Mbaye Fall | — |
| TER · PNR | — |
| TER · Rufisque | DDD (0 m), AFTU (0 m), TATA (80 m) |
| TER · Bargny | — |
| TER · Diamniadio | — |
| TER · Aéroport de Dakar – AIBD | — |
| BRT · Petersen – Papa Gueye Fall | DDD (0 m), AFTU (0 m) |
| BRT · Grande Mosquée | — |
| BRT · Place de la Nation | — |
| BRT · Dial Diop | — |
| BRT · Grand Dakar | — |
| BRT · Liberté 1 | — |
| BRT · Sacré-Cœur | — |
| BRT · Liberté 5 | DDD (0 m) |
| BRT · Liberté 6 | DDD (0 m) |
| BRT · Khar Yalla | DDD (0 m) |
| BRT · Scat Urbam | — |
| BRT · Cardinal Hyacinthe Thiandoum | — |
| BRT · Grand Médine | — |
| BRT · Police des Parcelles | — |
| BRT · Croisement 22 | — |
| BRT · Parcelles | DDD (1 m), AFTU (1 m), TATA (83 m) |
| BRT · Ndingala | — |
| BRT · Golf Sud | — |
| BRT · Dalal Jamm | — |
| BRT · Fith Mith | — |
| BRT · Golf Nord | — |
| BRT · Gueule Tapée | — |
| BRT · Préfecture de Guédiawaye | DDD (0 m), AFTU (0 m), TATA (90 m), repère de couverture DDD 220 / AFTU 79 (115 m) |

### Ce que « correspondance » veut dire ici

Les fiches des points de référence relisent les **six liaisons existantes**, depuis l’une **ou** l’autre extrémité : trois paires de réseaux à Petersen, BRT–DDD à Guédiawaye, et deux marches *de référence* Dakar–Petersen et Colobane–Place de la Nation. Les fiches distinguent pôle déclaré et marche de référence non vérifiée. Aucune de ces mentions n’est une promesse de parcours daté. À Colobane, en particulier, on ne crée pas de liaison TER–DDD en affichant les deux points aux mêmes coordonnées. En mode Trajet, seuls les changements renvoyés par le calculateur portent la mention « Correspondance du trajet sélectionné » ; montée, descente et position choisie restent consultables même au même endroit.

### Reproduire la recette

```sh
npm ci && npm run build
# Utiliser Chrome installé ou le binaire Chromium de recette (hors du bundle).
npm install --prefix /tmp/dakar-map-browser --no-save --ignore-scripts playwright-core@1.65.1
BROWSER_TOOLS=/tmp/dakar-map-browser CHROMIUM_PATH="$(command -v google-chrome)" node scripts/smoke_map_points.mjs
npm run test:all
```

Le script sert le **bundle construit** sur un port éphémère (ou utilise `PREVIEW_URL`), puis ferme le serveur. Sur **360 × 640, 393 × 852, 768 × 1024, 1366 × 900**, il ouvre les listes avec un vrai toucher/clic, mesure leurs rectangles, vérifie les 137 identités locales, les 12 mentions d’extrémité, les interrupteurs et le clavier. Il atteint Petersen et Colobane au zoom maximal. Sur téléphone et ordinateur, il parcourt aussi les tableaux TER/BRT pour recentrer les 37 sites à l’échelle du quartier et ouvrir leurs points voisins. Les quatre points et le trait ArcGIS injectés testent uniquement le traitement d’une réponse historique ; **ils ne sont pas des données de Dakar**. Le fond de tuiles et le réseau public ne sont pas nécessaires au test. Il s’agit d’une recette du bundle, pas d’un test sur téléphone physique ni d’une mise en production.

Les modèles de desserte et les horaires ne font pas partie du correctif. Les deux ordres d’arrêts de l’AFTU 83 sont conservés ; il manque toujours une feuille de service actuelle indiquant passages, sens, jours et période de validité. **Aucune heure n’a été ajoutée.**
