# À Thiaroye, où descendre de la 218 et où prendre la 73 ?

**Premier relevé à faire : 218 depuis Aéroport LSS → 73 vers Lac Rose, au dépôt de Thiaroye.** La carte officielle de la 73 place son **départ** à 1,7 m d’un poteau nommé « Terminus 217 et 218 ». Elle ne place pas la porte d’arrivée de la 218. Pour le jeudi d’essai, le **19 novembre 2026**, on ne peut confirmer ni la marche nécessaire, ni la prochaine montée réalisable. Le calculateur ne propose donc pas cette correspondance, pas même à 0 m.

Dans **Explorer → AFTU → 73**, ouvrir une direction : la note depuis Thiaroye indique où demander la montée ; celle depuis Lac Rose distingue la descente et le départ de la 218. Ces notes ne s’appliquent pas à la fiche TATA portant le même numéro. Les minutes du panneau ne chronomètrent pas le changement. [Examen du dépôt : deux sorties de véhicules, grille corrigée de la 73 et demande prête à transmettre](depot-thiaroye.md).

## Les deux sens ne sont pas symétriques

Le [poteau OSM `4419421889 v2`](https://www.openstreetmap.org/node/4419421889/history/2) porte le nom des deux lignes DDD, mais n’a ni rôle de ligne ni chemin parent. Sur la [carte AFTU publiée le 13 juillet 2026](https://aftu-senegal.org/map/dakar-urbain-ligne-73/), le symbole *start* est à **1,7 m**, le début du trait à **1,8 m** du poteau. La couche DDD situe [les points de la 218 et de la 217](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0/query?objectIds=539,576&outFields=OBJECTID_12,Nom_Ligne,Nom_Arret&outSR=4326&f=json) à **29,7 et 28,9 m** du même poteau (identifiants de couche 539/576). Ces écarts entre sources ne sont pas des distances à marcher.

| Changement demandé | Appels des deux archives, vérifiés sur **toutes** les courses de chaque variante | Ce qui manque aujourd’hui |
|---|---|---|
| **DDD 218 entrante → AFTU 73 sortante** | 218 depuis Aéroport : `D_529 → D_686`, rang **35/35** sur **66** courses. 73 vers Lac Rose : `A_586 → A_585`, rang **1/78** sur **119**. `D_686` et `A_586` sont à **3,7 et 0,4 m** du poteau. | Heure et position de la **descente de la 218** au dépôt ; confirmation du lieu et de l’heure de **montée dans la 73**, et du passage entre les deux. |
| **AFTU 73 entrante → DDD 218 sortante** | 73 depuis Lac Rose : `A_265 → A_586 → A_266`. Sur **111** courses, `A_586` est le **78ᵉ/79** ; le **dernier**, `A_266`, est à **99,9 m** du poteau. Tous deux s’appellent « Station Ciel Oil ». 218 vers Aéroport : `D_686 → D_545`, rang **1/34** sur **87** courses. | Le quai d’arrivée de la 73 n’est pas son symbole de départ. Il faut le point de descente réellement utilisé (y compris pour une descente avant le terminus), puis le départ de la 218 **depuis Thiaroye**. |

Les codes `pickup_type=0`, `drop_off_type=0` sont conservés tels quels. Ils n’autorisent ni une descente au premier appel, ni une montée au dernier. Les quatre rôles ont des identifiants distincts dans l’[audit directionnel hors graphe](../src/admin/dakarTransferDossiers.ts).

**Horaires.** Le [fil de DDD du 25 juin 2025](https://x.com/dakardemdikk1/status/1937979929007702515) donne [05:30–19:30 depuis Thiaroye et 07:00–20:30 depuis Aéroport](https://x.com/dakardemdikk1/status/1937979936272162819). La [fiche de réseau](https://demdikk.sn/reseau-urbain-dakar/) corrobore le corridor. Ni ce fil ni ces quatre bornes ne donnent l’arrivée au dépôt d’une course de novembre 2026. La [grille secondaire 218](https://appassets.mvtdev.com/map/48/l/5996/18051488.pdf) **commence ou finit à Rufisque**, avec 69/67 appels ; ne pas lui substituer Thiaroye. La [73 vers Lac Rose](https://moovitapp.com/index/fr/transport_en_commun-time-73-Dakar-5996-1618038-18051511-4256343-0) a bien une colonne pour le dépôt puis le CEM (ex. **07:05 / 07:06** en semaine). Une seule des deux courses à l’heure voulue ne suffit pas.

**La 324 n’est pas la 218.** Sur les grilles de semaine de l’[AFTU 73 arrivant de Lac Rose](https://moovitapp.com/index/fr/transport_en_commun-time-73-Dakar-5996-1618038-18051511-4256342-0) puis de la [DDD 324 vers Bargny](https://moovitapp.com/index/fr/transport_en_commun-time-324-Dakar-5996-1618037-18051500-4256320-0) : **06:54 → 07:00**, soit six minutes entre libellés « Dépot Thiaroye ». Dans l’autre ordre, la [324 depuis Bargny](https://moovitapp.com/index/fr/transport_en_commun-time-324-Dakar-5996-1618037-18051500-4256321-0) arrive à **06:43** ; la 73 de 06:40 est déjà partie et sa suivante est à **07:05**. Ces écarts ne sont **ni un battement réalisable, ni un itinéraire**. La [fiche Ciel Oil](https://moovitapp.com/index/fr/transport_en_commun-Ciel_Oil-Dakar-site_148199287-5996) associe le dépôt aux 26/73/324, mais sa minute de marche part du lieu Ciel Oil, pas de la porte d’un bus. Le poteau OSM désigne la 217/218, **pas la 324**. Le ZIP DDD examiné ne contient pas de ligne 324. Les pistes 324 et 315 restent documentaires, hors des 48 codes DDD du formulaire de lignes. La 217 a elle aussi une [grille depuis Rufisque](https://moovitapp.com/index/fr/transport_en_commun-map-217-Dakar-5996-1618037-18051502-0) ; la [402](https://transitbycity.com/fr/senegal/dakar/operators/dakar-dem-dikk/routes/402/) indique le centre commercial, pas le dépôt.

## À Ouakam : un vrai quai de la 7, mais de quel côté descend-on de la 67 ?

La [carte officielle 67 du 8 juillet](https://aftu-senegal.org/map/dakar-urbain-ligne-67/) se termine à **Boutique Diallo** après Cité Avion. Le symbole *finish* est à **1,7 m** du poteau [« Arret Pharmacie » `4363242525 v3`](https://www.openstreetmap.org/node/4363242525/history/3), le bout du trait à **4,1 m**. Ce poteau est un membre **`platform` 8/34** de la [relation DDD 7 vers Palais 1](https://api.openstreetmap.org/api/0.6/relation/7500475/14.json), entre `4323807979` et `4363242516`. Il n’est pas pour autant un membre de la 67. La rue est à double sens.

Sur les deux tronçons de chaussée OSM [336377010 v9](https://www.openstreetmap.org/way/336377010/history/9) et [643340906 v2](https://www.openstreetmap.org/way/643340906/history/2), lues vers Palais, les deux extraits se rejoignent au **même nœud `60879475`**. Les projections sont intérieures à un segment, pas aux bouts d’une corde entre arrêts. Distances en mètres dans ce repère local :

| En suivant la 7 vers Palais | Rang 7 | Rang 8 | Rang 9 |
|---|---:|---:|---:|
| Abscisse des trois poteaux OSM / écart à droite de l’axe | 34,7 / 2,6 | **232,5 / 5,9** | 422,5 / 5,9 |
| [Points DDD OID 342–344](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0/query?objectIds=342,343,344&outFields=Nom_Ligne,Nom_Arret&outSR=4326&f=json) : abscisse / à droite | 34,6 / 5,3 | **233,2 / 6,7** | 421,6 / 5,4 |
| `D_58 → D_60 → D_62`, 160 courses de `DDD_07_OUAKAM` : abscisse / à droite | 20,8 / 6,8 | **224,1 / 1,7** | 412,8 / 6,6 |

Le point DDD le plus proche (OID 343, **1,1 m** du poteau) s’appelle « Arret Ouakam » ; le point DDD intitulé « Arret Pharmacie » est **le précédent**, OID 342. Le raccord par le nom aurait déplacé la montée d’un rang.

**Sens d’arrivée de la 67.** À 75 m, à 25 m et au bout de son dessin marqué, ses abscisses sur le même axe de la 7 sont **311,1 → 261,1 → 236,4 m** : la 67 approche **dans le sens opposé** à la 7 vers Palais. Ses écarts signés à gauche valent **+1,1 → −2,6 → −4,5 m** ; le symbole de fin est à −6,4 m. Le trait finit du côté du poteau DDD, mais traverse l’axe sur le dessin. Ce n’est ni une observation du côté d’ouverture des portes, ni un chemin de traversée. [Mesures de l’approche, distinctes de la position du symbole](../data/bus-review/terminus-quays-2026-11-19.json).

- **67 → 7** : dans les **62** courses historiques depuis Thiawlène, `A_25` est au rang **72/75** à **7,9 m à gauche** de cet axe ; le poteau DDD est à **5,9 m à droite**. Le terminus `A_378` se trouve à **565,2 m du poteau**. La [grille actuelle lue pour la 67](https://moovitapp.com/index/fr/transport_en_commun-map-67-Dakar-5996-1618038-18051510-0) finit à **Poste de Santé** après 71 appels depuis Espi. Pas de preuve que ce soit la porte de Boutique Diallo. Une traversée n’est pas établie non plus.
- **7 → 67** : `A_26` de l’autre 67 se trouve à **1,6 m à droite** de l’axe ; c’était le **4ᵉ/77** appel sur **53** courses, pas le départ. Les **138** courses historiques de la 7 depuis Palais n’ont pas le triplet de la 7 vers Palais. La [grille 7 vers Palais](https://moovitapp.com/index/fr/transport_en_commun-time-7-Dakar-5996-1618037-18051422-4256167-0) donne, en semaine, **07:00** à Rue Okm 60, 67 et **07:06** au rang 8 **Quartier Geille**, pas au poteau Pharmacie. Les 27 appels de cette fiche ne sont pas les 34 membres de la relation. [Palais 1, Palais 2 et Gare Palais sont documentés séparément](ddd-lines-7-9-10-moovit-osm-arcgis-directions-2026-11-15.md).

## Guédiawaye et Sébikotane : deux autres vérifications

- **Guédiawaye, 26 → 5 ou 12.** [Fin de la carte AFTU](https://aftu-senegal.org/map/dakar-urbain-ligne-26/) à **2,5 m** du [poteau DDD `5038866775` marqué `L5;L12`](https://www.openstreetmap.org/node/5038866775/history/3), bout du trait à **5,7 m**, [OID 453 de la 5](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0/query?objectIds=453&outFields=*&outSR=4326&f=json) à **12,0 m**. L’ancien `D_406` était le troisième appel des 5/12 depuis Guédiawaye (111/101 courses), à **6,7 m**, et non leur terminus `D_1082` à **68,8 m**. Les [38 appels de la 26](https://moovitapp.com/index/fr/transport_en_commun-line-26-Dakar-5996-1618038-18051462-1) finissent au dépôt Thiaroye ; les **94** courses historiques depuis les Parcelles y finissent aussi, à **3 111,1 m** du poteau étudié. Le départ en sens inverse depuis Guédiawaye n’est pas documenté par cette grille.
- **Sébikotane, 315 → 53.** Deux fiches du jeudi, mises à jour le 16 novembre : [315 arrivant à 06:52](https://moovitapp.com/index/fr/transport_en_commun-Terminus_53_315-Dakar-stop_37703724-5996) puis [53 vers Lac Rose à 06:58](https://moovitapp.com/index/fr/transport_en_commun-Terminus_53_315-Dakar-stop_37703725-5996). À l’inverse : 53 arrivant à **07:35** et 315 vers Rufisque à **07:40**. Ce sont **deux identifiants**, annoncés à 47 m l’un de l’autre ; le chemin praticable et les portes ne figurent pas sur les grilles. La [carte AFTU](https://aftu-senegal.org/map/dakar-urbain-ligne-53/) arrive de **Keur Massar**, pas de Lac Rose. L’arrivée `D_1210` de la 315 (22/22, 144 courses) et `A_1572` de la 53 (87/87, 87 courses) sont à **1 996,2 m l’une de l’autre** dans les archives. Les **89** trips de retour de la 53 n’ont aucun appel joint par leur `trip_id` littéral. Cela ne prouve pas qu’aucun bus n’y circule.

## Ce que couvre la mesure

- [Criblage des terminus, poteaux et appartenances aux relations](../data/bus-review/terminus-quays-2026-11-19.json). Dans l’emprise de Dakar : **879 nœuds de quai** dont 649 avec mention DDD, BRT ou TER. Sur **65 dessins**, **128 extrémités orientées** ; la carte de la **ligne 55** n’a pas les deux marqueurs univoques. Comparer séparément le symbole et l’extrémité du trait à chaque nœud. **19 couples** dans lesquels au moins l’un est à ≤20 m, dont **17** où les deux le sont. Ce rayon ne qualifie ni le quai, ni la marche. **10 occurrences `platform`** sur ces nœuds, dont les rangs 3, 6 et 8 de la DDD 7. À Sahm, les dessins des 32, 38 et 58 sont près du même quai de la 4 ; à Ouakam les dessins 42/43 sont près du troisième de la 7. Aucun de ces symboles n’attribue les deux rôles voyageurs.
- **42 inscriptions** de plusieurs numéros reconnues sur les 879 nœuds (et non 42 correspondances). Le parseur conserve « Mini Bus 24-33-46-70-27-41 », « Arrêt bus DDD (220, 12, 5, 6) » et `L5;L12`. Un numéro de rue, un `ref` numérique non qualifié ou deux variantes d’un même réseau ne sont pas une preuve interréseaux. Le [balayage piéton](patte-doie.md) concerne aussi des objets *ways* ; ses 52 parcours ne sont pas ce décompte de poteaux.
- [Appels archivés et écarts géométriques](../data/bus-review/terminal-occurrences.json) : **2 193 trips** de 7 lignes DDD et 4 AFTU dans les [deux ZIP PassBi épinglés](https://github.com/impactsolutionsas/passbi_core/tree/7a2b99824699cb10daf69852c8fbecb746200d77/gtfs_folder). 1 962 avec un appel ciblé, 138 avec appels sans cet identifiant, 93 sans aucun appel joint (89 de la 53, 4 de la 217). Rang en base 1, tri par `stop_sequence` et contrôle des ex æquo ; une jonction manquante reste distincte d’un arrêt absent. Calendriers terminés le **31/12/2023**, dernière exception des services examinés le **25/12/2023** côté DDD, aucune côté AFTU. Aucun horaire de ces ZIP n’est repris. OSM : [© contributeurs, ODbL 1.0](https://www.openstreetmap.org/copyright) ; [voirie de contrôle](../data/bus-review/ouakam-road.json). Les dessins opérateurs, les grilles complètes et les ZIP ne sont pas redistribués.

## Pour débloquer une première correspondance

Au **dépôt de Thiaroye**, demander à DDD et à l’AFTU un plan des **positions de descente et de montée par sens**, et **deux courses applicables à la même date**, avec leurs appels encadrants. À défaut, consigner sur place, pour **218 entrante → 73 sortante** :

| À relever | Observation à rapporter (heure de Dakar) |
|---|---|
| Descente | Date, ligne 218 depuis Aéroport, appel précédent, repère ou coordonnées de la porte et heure de descente. |
| Passage | Même lieu d’attente explicitement autorisé avec délai minimal, **ou** chemin public porte à porte, avec côtés, traversées, accès, obstacles et durée mesurée. Ne pas remplacer l’inconnu par zéro. |
| Montée et suite | Ligne 73 vers Lac Rose, repère de sa porte, départ au dépôt, heure à l’appel suivant. Source, période de validité et droit de réutilisation. |

Relever le sens **73 entrante → 218 sortante** à part. Ni un contact opérateur ni un déplacement sur place n’ont été effectués. L’[Observatoire du CETUD](https://cetud.sn/observatoire/systeme-de-donnees/) est une piste pour une édition GTFS datée ; aucune n’a été reçue. Le contrôle d’une édition réutilisable se fait en [staging](preparer-une-correspondance.md), pas dans les données publiques. Vérifier le premier départ après **descente + déplacement réel + marge demandée**, puis l’arrivée à destination. Sans ces pièces, heure de montée atteignable et marge restante sont **inconnues**.

### Rejouer sans modifier le graphe

```sh
python -m scripts.audit_terminal_calls /chemin/Dem_Dikk.zip /chemin/AFTU.zip | cmp - data/bus-review/terminal-occurrences.json
# Le JSON compact se reproduit depuis les annotations du job (pas ses géométries) :
check=135985186515
rev=e1b2c1ac608c3364bdb78a3bec65654b1e258f78
api=repos/aydiarra-star/dkrBus-apps/check-runs/$check
test "$(gh api "$api" --jq '[.head_sha,.conclusion]|join(" ")')" = "$rev success"
gh api "$api/annotations?per_page=100" > /tmp/notes-terminus.json
python -m scripts.freeze_terminus_checks /tmp/notes-terminus.json "$rev" \
  "https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44644992678/job/$check" | cmp - data/bus-review/terminus-quays-2026-11-19.json
# Même PBF et mêmes extraits Waymark temporaires que le job de mesure (pyosmium) :
python -m scripts.audit_terminus_quays /chemin/senegal.osm.pbf /chemin/aftu-maps /tmp/terminus.json --ci-summary
node scripts/audit_passenger_transfers.mjs --at 2026-11-19T19:00 --json | jq '.directions[] | select(.dossier=="thiaroye-218-73" or .dossier=="ouakam-67-7" or .dossier=="guediawaye-26-5") | [.from.name,.to.name,.meters,.timed.status]'
```

Les six lignes du dernier contrôle sont bloquées **avant** l’horaire ; `meters: null` n’est pas une marche nulle. Au rejeu du formulaire à **19 h**, toujours **745 voyages directs sur 23 562 couples**, dont 29 pour DDD 1, aucun changement. Les **6 950 décomptes** d’Explorer et les comparaisons d’horaires aux Maristes restent des résultats distincts.
