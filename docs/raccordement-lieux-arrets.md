# Raccorder un lieu à un trajet voyageur

**État du 18 novembre 2026.** Dans Trajet, un quartier sélectionné reste un quartier ; il ne devient pas la gare ou le terminus le plus proche. Le calcul distingue trois réponses : le trajet complet depuis les points demandés ; à défaut, un tronçon calculé que l’usager peut choisir **à la place** de ce trajet ; enfin, une fiche qui cite les lieux mais ne permet pas de calculer un déplacement. Seul un itinéraire complet pour la sélection courante est tracé.

## Rejouer le cas Yoff → Keur Massar

```sh
npm ci
npm run audit:place-connections -- --at 2026-11-18T19:00 --from landmark:yoff --to 14.7900,-17.3100
npm run audit:place-connections -- --at 2026-11-18T19:00 --from landmark:guediawaye-ddd-220 --to ref:brt-petersen
npm run --silent audit:place-connections -- --at 2026-11-18T19:00 --matrix
```

L’heure est celle de Dakar (UTC+0). Ces commandes interrogent le même moteur que le formulaire, hors ligne, sans GTFS de démonstration. `--step-free` applique le filtre « sans marches » ; un état inconnu n’y est pas admis.

| Étape demandée le mercredi à 19 h | Ce que les sources permettent de dire |
|---|---|
| Partir de Yoff | Le [repère Yoff](https://www.openstreetmap.org/way/369004272) (`14.7619, -17.4807`) n’est ni le pôle `aftu-yoff` (`14.764, -17.47`), ni Grand Yoff, ni l’aéroport. Il n’y a pas d’accès piéton vérifié de ce repère à un quai de montée. |
| Aller vers Keur Massar | La [description AFTU 66](https://aftu-senegal.org/map/dakar-urbain-ligne-66/) publiée le 8 juillet cite Terminus Yoff, croisement Keur Massar, Keur Mbaye Fall, puis Gorom. Dans la [fiche détaillée Yoff → Gorom](https://moovitapp.com/index/fr/transport_en_commun-line-66-Dakar-5996-1618038-18051499-0) transcrite [dans le dépôt](../src/data/aftu-66-return.json), « Marche De Yoff » est le 3ᵉ libellé et « Carrefour Keur Massar » le 32ᵉ. **04:50–20:50** est la plage indicative de la ligne en semaine ; ce n’est pas un passage à 19 h à l’un de ces arrêts. Le [sens opposé](https://moovitapp.com/index/fr/transport_en_commun-line-66-Dakar-5996-1618038-18051499-1) a sa propre séquence et sa propre grille. Aucune de ces fiches ne fournit ici un trajet géolocalisé admis. |
| Arriver au point demandé | `14.7900, -17.3100` est le point choisi, pas un nouveau nom pour le Carrefour de la 66 ou la gare TER de Keur Mbaye Fall. Il est à environ 2,4 km **à vol d’oiseau** de la [gare routière](https://www.openstreetmap.org/way/335756472), elle-même distincte du [Terminus 52](https://www.openstreetmap.org/node/5286379847). Pas de quai de descente et de marche vérifiée jusqu’à ce point. |
| Essayer d’autres arrêts / une correspondance | Dans le rayon de présélection de 1 200 m, le graphe voyageurs donne **0 point de montée** près du départ et **0 point de descente** près de l’arrivée, donc aucun tronçon. C’est un défaut de couverture du calculateur, pas une affirmation qu’aucun bus ne circule. |

**Contre-exemple utile :** de la *localité* Guédiawaye à la station BRT Petersen, la première marche manque aussi. Deux départs B1 sont néanmoins calculables à l’heure demandée : Préfecture de Guédiawaye (écart géographique 115 m) et Gueule Tapée (585 m). Le premier tronçon part vers 19:00 et arrive vers 19:52 à Petersen, si le voyageur est **déjà à la station**. Les 115 m ne sont pas ajoutés à son parcours. La carte reste sans tracé de voyage tant qu’il n’a pas remplacé ses points.

## Combien de points sont effectivement raccordés ?

Matrice `--matrix` à cette date et heure, réglages par défaut, paires **orientées de points distincts**, sans snapshot externe. Les 97 points sélectionnables se décomposent en 27 repères cartographiques, 36 points de desserte du graphe (13 TER + 23 B1) et 34 autres références du catalogue (dont AIBD hors périmètre). Les libellés des fiches sans position ne sont pas des points. Chercher « Carrefour Keur Massar » ou « Marché de Yoff » renvoie au libellé documentaire, pas aux coordonnées du quartier qu’il contient. Le champ permet, en plus, de chercher par nom les arrêts géolocalisés d’un snapshot courant sans être à proximité ; ils gardent leur identité publiée, séparée du graphe local.

| Sélections | Couples | Trajet complet | Tronçon(s) seulement | Ni trajet ni tronçon |
|---|---:|---:|---:|---:|
| Deux points de desserte du graphe | 1 260 | 331 | 0 | 929 |
| Deux repères cartographiques | 702 | 0 | 2 | 700 |
| Un repère et un point de desserte, les deux ordres | 1 944 | 0 | 71 | 1 873 |
| Au moins une autre référence du catalogue | 5 406 | 0 | 776 | 4 630 |
| **Total** | **9 312** | **331** | **849** | **8 132** |

Les **331** sont les relations déjà calculables entre arrêts TER **Dakar → Diamniadio** ou B1 **Préfecture → Petersen**. Les **849** comptent des *couples de sélections* pour lesquels il existe au moins une proposition de remplacement, **pas** 849 nouveaux trajets porte-à-porte. Les fiches de ligne ne sont comptées dans aucune colonne de succès. Aucun quai physique lié, arc piéton ou sens de bus n’a été ajouté aux données voyageurs. Les [huit dossiers de correspondance](finalisation-pr270-moteur-voyageurs.md) restent à instruire dans leurs seize sens.

## Indice historique à utiliser pour le relevé, pas pour les horaires

L’[archive AFTU PassBi](https://github.com/impactsolutionsas/passbi_core/blob/7a2b99824699cb10daf69852c8fbecb746200d77/gtfs_folder/gtfs_AFTU.zip) contient des identifiants, des coordonnées et des `stop_times`. Empreinte SHA-256 du ZIP examiné : `7fae6b438de6177ff1d777546684e83c8882927b67efa4645dbecca3d77af428`. Les quatre calendriers de base vont du **1ᵉʳ janvier 2022 au 31 décembre 2023** ; les exceptions observées sont dans cet intervalle. Une copie en 2026 ne renouvelle pas le service. Aucun import dans le dépôt ni dans un snapshot publié ; les droits de réutilisation des données restent à vérifier.

Contrôle reproductible dans le ZIP : joindre `trips.route_id` (`AFTU_61` / `AFTU_66`) à `stop_times.trip_id`, trier `stop_sequence` numériquement, joindre `stops.stop_id`. Ne pas déduire le sens du nom de shape : les headsigns de ces exemples sont vides.

- **61 historique** : `AFTU_61_mamelles_1`, 64 appels. Le 19ᵉ (`A_688`, Passerelle Tonghor En Face Sous Préfecture) est à environ 378 m du repère Yoff ; le 64ᵉ (`A_522`, Keur Massar Terminus 61, `14.785378, -17.309138`) est à environ 522 m du point demandé. L’autre course examinée, `AFTU_61_KEUR MASSAR_1`, commence à `A_522`. La [fiche AFTU de juillet 2026](https://aftu-senegal.org/map/dakar-urbain-ligne-61/) décrit **Keur Massar → Almadies** par l’aéroport, pas une course confirmée au départ de Yoff vers le point choisi. Ni inversion de la fiche, ni fusion avec une TATA 61.
- **66 historique** : `AFTU_66_Yoff_1`, 105 appels, commence à `A_1250`, Yoff (`14.761809, -17.474486`), à environ 668 m du repère Yoff. Son appel le plus proche du point d’arrivée est `A_435`, à environ **4,97 km**. Sur `AFTU_66_gorom_1`, 104 appels, le minimum est d’environ 4,95 km. Ces distances droites servent à distinguer des objets homonymes ; elles ne prouvent ni une marche, ni l’absence d’une desserte actuelle. **Ne pas joindre** la géométrie et les arrêts de 2022–23 à une fréquence de 2026.

## Admettre le premier raccordement réel

1. **Choisir le lieu physique exact.** Relever l’entrée ou le nœud public où le voyageur commence/finit réellement. Documenter la source géolocalisée, la date et les droits. Ne pas déplacer un centre de quartier sur un trottoir pour réussir le calcul. Si les coordonnées sont différentes, créer un point distinct, avec un nom explicite dans le sélecteur.
2. **Vérifier la desserte dans le sens demandé.** Pour la 66, identifier auprès de l’opérateur le quai qui monte vers Gorom à Yoff et le quai précis où descendre ; vérifier l’ordre, le tracé continu sur les voies du bus, le calendrier et les temps ou fréquences applicables. Vérifier la distance réelle au point final : une autre ligne et un changement peuvent être nécessaires. Pour la 61, établir d’abord le sens actuel et la paire de terminus. Refaire le contrôle pour le retour ; ne pas inverser une liste.
3. **Raccorder les positions physiques.** Le [modèle `PlatformBinding`](../src/routing/model.ts) lie explicitement `mode + lineId + direction + stopId + role` à un `platformId` revu. `board` et `alight` sont deux observations. Le contrôle à 80 m du point d’appel **et** de l’extrémité du segment est un garde-fou sur cette observation, jamais un algorithme de sélection. L’arrêt commercial, ses horaires et la géométrie du véhicule ne bougent pas.
4. **Suivre chaque marche, dans son sens de parcours.** Relever les voies publiques et leurs sommets, entrées/sorties, traversées, escaliers, barrières et accès sans marches. Chaque `FootwayInput` lie deux identités et les extrémités exactes de la géométrie. Pour une correspondance entre sites, relever la descente, la sortie, le chemin de rue, l’entrée et la montée. `npm run audit:passenger-transfers` détaille les preuves manquantes ; son mode `--packet` évalue un relevé isolé sans le publier. Le [graphe OSM candidat](audit-graphe-pieton-candidat-2026-11-17.md) contient 2 246 ways dédiés mais 935 composantes : le nœud le plus proche ne démontre pas cet accès.
5. **Tester avant d’activer.** Après revue des sources, inscrire seulement les objets qualifiés dans [la liste d’admission](../src/data/reviewedPassengerLinks.ts). Rejouer `npm run test:routing`, les deux sens de l’OD aux heures demandées et hors service, les filtres réseau/accessibilité, le délai de correspondance, puis la matrice et l’écran Trajet. Le [test de chaîne complète](../src/routing/placeConnections.test.ts) montre le format sur des données **synthétiques** : marche initiale → montée → descente → marche de correspondance → deuxième course → marche finale. Il n’autorise aucun de ces déplacements à Dakar.

Le calcul de section utilise les mêmes services datés, marches admises et réglages que le calcul complet. Il examine les couples admissibles avant de limiter l’affichage à trois. L’[API des horaires directs](../README.md#api-de-lecture-des-données-publiées) d’un snapshot, les [fiches documentaires bus](etat-activation-calculateur-bus-2026-11-18.md) et le simulateur historique ne fournissent pas de raccordement piéton à ce moteur.
