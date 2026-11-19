# Bus à Dakar : ce que le calculateur peut montrer

**À Scat Urbam, on peut désormais calculer la marche depuis l’un des deux îlots jusqu’au quai central B1, puis prendre le bus dans un sens documenté.** Dans le sens inverse, le voyage peut finir sur l’îlot. À Petersen, seul le quai de descente du modèle est rattaché. Aucun trottoir, transfert ou horaire BRT n’a été ajouté. Il s’agit d’une revue cartographique, pas d’un relevé d’accessibilité.

**Pour DDD/AFTU/TATA : 43 repères, 35 attributions de portions à un sens, sur 43 ways OSM. Aucun nouveau départ daté.** Le formulaire peut montrer une carte entre 108 couples de repères exacts, contre 80 précédemment. Le nombre de voyages complets n’a pas augmenté : à 19 h, les mêmes 562 aboutissent sur les 114 sélections de référence, et les mêmes 716 sur le formulaire étendu. Ces voyages utilisent TER ou B1, pas une correspondance bus. Une même rue documentée pour plusieurs lignes n’est pas comptée comme plusieurs services.

## Essayer sans API

| Dans les champs Départ puis Destination | Résultat |
|---|---|
| **Scat Urbam · îlot du passage piéton nord → station BRT de Petersen**, 19 h | 61 m sur les voies piétonnes, 47 s de marche, 4 min 06 s d’attente ; B1 vers 19:04, arrivée au quai de descente vers 19:28. Depuis l’appel BRT Petersen vers l’îlot sud : B1 puis 71 m à pied, arrivée vers 19:24. Aucun de ces chemins ne traverse la chaussée. |
| Chercher « DDD 1 » ; choisir **UCAD · vers Sahm → Stade · avenue Blaise Diagne** | 2 334 m, huit quais cartographiés (DDD 1 et 7 sur cette portion). « Voir cette portion sur la carte » montre seulement cette portion, en tirets, avec des losanges. Pas d’heure ni de symbole de montée. |
| **VDN · secteur Ecobank → Stade · avenue Blaise Diagne** | 3 934 m sur la DDD 1. Depuis **VDN · secteur ENSUP** la portion s’arrête au secteur Sonatel (2 705 m) : un quai intermédiaire à 22,07 m de la chaussée dépasse le seuil de 20 m. **Pas de trajet ENSUP–Stade.** |
| **Avenue Cheikh Anta Diop · voirie côté université → Avenue Blaise Diagne · limite de voirie côté Stade** | 2 064 m par Sahm, sur les descriptifs DDD 8/12 et AFTU/TATA 3/4, avec trois limites routières et **aucun quai** repris des 1/4/7 DDD. |
| **Médina · sens centre-ville → Stade · avenue Blaise Diagne** | DDD 1, 4 et 7 partagent ici 787 m. Choisir une seule carte : ce n’est pas une correspondance. |
| Chercher « AFTU 40 » ; choisir **Carrefour des Civilisations → Route des pères Maristes × Front de Terre** | 938 m vers Petersen ; la limite au carrefour n’est pas un quai où attendre. Pour aller vers Mbao, choisir **Carrefour des Civilisations · entrée depuis Front de Terre** à l’arrivée : **941 m**, par une autre entrée. |
| **Jaxaay · virage côté Shell → Route de Diakhaye · secteur ASECNA**, tous deux « vers Keur Massar » | 1 179 m sur la chaussée des fiches 45, 74, 83, 84, 90 et 91. Pour la 84, la source est le retour, rangs 58–63, pas six départs. La 220 ne figure que sur **441 m** près du lycée. Pour le sens vers Rufisque, sélectionner des points de **l’autre chaussée**, pas les mêmes en sens inverse. |
| **Gorom 2 → Noflaye**, 19 h | La fiche AFTU 90 cite « Croisement Gorom 2 » puis « Noflaye ». Son ordre est consultable, pas la position des quais ni l’heure de passage. Pas de tracé. |
| **Gare TER de Dakar → Keur Massar** (`14.7900,-17.3100`), 18 novembre 2026 à 19 h | Le TER jusqu’à Bargny peut être calculé **à part** ; la [fiche AFTU 74](https://aftu-senegal.org/map/dakar-urbain-ligne-74/) cite ensuite le terminus de Keur Massar. Ni la sortie de gare vers le quai du 74, ni le bus suivant, ni la marche finale ne sont établis. Le point de la capture ne devient pas un terminus. |

Le départ n’est **pas visible** sur la capture de Keur Massar : la gare TER de Dakar et Yoff sont des départs de rejeu, pas des données lues dans l’image.

La carte ne s’affiche pas automatiquement lors d’un refus. Un point GPS à ≤350 m d’un repère (ou moins si le rayon choisi est plus petit) peut faire découvrir une portion. L’écart à vol d’oiseau reste un écart, **même à 0 m**. Un ID de quai publié, une épingle et un repère local ne sont pas interchangeables. Les filtres de modes et sans marches s’appliquent aussi à ces propositions. Le copilote peut expliquer une portion, mais ne la mémorise pas comme un trajet accompli.

## Couverture des sources réellement relues

[Tableau généré pour chaque code](couverture-sources-bus.md) · [preuves OSM, versions, jointures, projections et licence par portion](../data/bus-sections/README.md).

| Famille de **provenance** | Identités locales, union des registres | Dans un catalogue propre à la famille | Avec au moins une liste ordonnée¹ | Avec des listes balisées dans les deux sens¹ | Codes avec fiche consultable dans les résultats | Portions de carte | Sens datés de bus embarqués |
|---|---:|---:|---:|---:|---:|---:|---:|
| DDD | 48 | 41 | 40 | 2 | 33 | 11 sur 7 codes | 0 |
| AFTU | 73 | 73 | 72 | 26 | 31 | 20 sur 12 codes | 0 |
| TATA | 65 | 62 | 62 | 0 | 37 | 4 sur 4 codes, également décrites côté AFTU | 0 |

¹ Comptage des listes de libellés des fichiers et registres (`source-order`, `directional-sheet`, `owner-sequence`, `reader-sheet`, `circuit`) : ni nombre de quais géolocalisés, ni homologation des intitulés « aller/retour ». Une description officielle peut inclure des variantes de retour **sans** publier de seconde liste. Une seule liste figurant sous plusieurs sources ne devient pas plusieurs preuves indépendantes. Les `stopIds` hérités pouvant être des chaînes comme « UCAD » restent non résolus, pas des clés de quai.

* **DDD.** `mobility-lines.json` contient 37 lignes DDD ; les 34 séquences de `dddPublishedRoutes` et les 39 du registre officiel agrégé se recouvrent. Les circuits 18 et 20 restent des circuits. Les variantes 15/15A/15B, 502/502A/502B, 503/503A/503B, TAF TAF et TO1 ne sont pas fusionnées. Les deux ordres 501 Port de Dakar ↔ Palais 2 (9/9) sont lisibles comme **transcription du projet**. Ils ne réconcilient pas la [fiche Palais 2 → Leclerc ni l’intitulé Gare de Dakar](source-audits/ddd-line-501-source-conflict-2026-11-14.md). La couche ArcGIS historique de la 1 et le [chatbot DDD](https://demdikk.sn/chatbot-arrets/) aident à situer des repères, mais ne fournissent pas le calendrier et l’ordre des quais dans chaque sens. Pour la 1, 05:30/20:30 à Parcelles et 06:30/21:00 à Leclerc sont des bornes de départ aux terminus, **pas un intervalle**.
* **AFTU.** 1–5 et 24–91 ; 72 entrées dans `mobility-lines.json`, 28 fichiers directionnels examinés, dont le retour de la 66. Conservation des ordres plats et imbriqués sans dédoubler deux copies identiques **dans le même fichier**. L’[index AFTU](https://aftu-senegal.org/infos-pratiques/) et 65 descriptifs de l’audit de pages apportent des rues et des terminus. Exemple : les rues de retour mentionnées pour la [2](https://aftu-senegal.org/map/dakar-urbain-ligne-2/) ne constituent pas une deuxième séquence de quais. La [40](https://aftu-senegal.org/map/dakar-urbain-ligne-40/) a un ordre textuel Grand Mbao → Petersen, distinct des deux approches cartographiées du giratoire des Maristes. Les paires de fiches 83, 84, 88, 89, 90 et 91 ont des liens vers la transcription précise, pas vers un faux flux officiel. Les anciens horaires invalidés de la 86 ne sont pas publiés.
* **TATA.** 62 fiches détaillées ; 69, 70 et 72 ne sont ici que des entrées de catalogue. « Tata » est aussi une appellation des minibus AFTU ; **186 identités de provenance ne signifient pas 186 services**. Même code ou même rue : pas de fusion d’itinéraires. Exemples : catalogue 40 Jaxaay → Petersen, fiche secondaire via Grand Mbao et fiche officielle AFTU Grand Mbao → Petersen ; [58 Fass Mbao (Rail-Ba) → Sahm](https://aftu-senegal.org/map/dakar-urbain-ligne-58/) et 58 Comico/Yeumbeul. La documentation de chaque variante est conservée ; la grille de Fass Mbao n’est pas appliquée au titre Sahm–Comico par numéro.
* **Affiches et calcul daté sont distincts.** L’affiche Explorer étiquette ses indications de ligne ou de réseau ; ses comptes à rebours de référence ne sont pas importés dans *Trajet*. Les 59 observations CETUD/CUREM du dépôt sont des mesures **par site, sens et période** (enquête 2016), pas des cadences de lignes. Les paramètres réseau AFTU et les profils particuliers sont séparés dans l’inventaire. Le portail [CETUD](https://cetud.sn/observatoire/systeme-de-donnees/) décrit la production de données ; cela ne donne pas au dépôt un GTFS actuel et redistribuable.

## Ce que la comparaison historique confirme — et ne confirme pas

[Archives PassBi épinglées](https://github.com/impactsolutionsas/passbi_core/tree/7a2b99824699cb10daf69852c8fbecb746200d77/gtfs_folder). Le comparateur groupe **tous** les `trip_id`, pas seulement le premier par ligne. Il conserve `direction_id`, `shape_id`, suite des `stop_id`, répétitions et anomalies de rang. Il compare les libellés normalisés par blocs dans l’ordre, jamais les numéros seuls entre familles. Un `direction_id=0` ne signifie pas « aller » dans un autre jeu. Ce contrôle n’est pas une validation GTFS complète.

| ZIP | Routes | Trips lus | Sans appel | Suites distinctes non vides | Suites sans anomalie d’ordre détectée | Dernière fin de calendrier de base |
|---|---:|---:|---:|---:|---:|---|
| Dem Dikk | 53 | 9 529 | 333 | 99 | 99 | 31/12/2023 |
| AFTU | 73 | 11 077 | 738 | 135 | 131 | 31/12/2023 |

Aucun groupe d’appels orphelin. Les 4 suites AFTU avec rangs dupliqués portent sur 289 trips des lignes 43, 59, 80 et 84 ; elles restent comparables **dans l’ordre du fichier** mais ne valident jamais un ordre GTFS univoque. Les 19 codes DDD présents uniquement dans cette archive (dont 16, 301, 323, 504) sont signalés dans `archiveOnlyCodes`, pas ajoutés à la carte ou au catalogue courant. Le dernier jour d’exception lu est le 25/12/2023 ; l’en-tête de `calendar_dates.txt` est séparé par des points-virgules alors que ses lignes de données sont séparées par des virgules. Ni la date du dépôt d’une copie, ni un tableau d’agrégateur ne renouvelle ces services. Aucune licence explicite de redistribution de ces deux ZIP n’a été établie.

| Cas | Constat par occurrence | Décision |
|---|---|---|
| DDD 501 | 9/9 dans chaque sens après normalisation. Les shapes examinées n’ont que 9 points pour 9 appels. | Ordres consultables ; les segments entre positions d’arrêt ne sont pas la voirie. Les quais OSM près du Port ou de Clémenceau ne sont pas attribués à la 501 par proximité. |
| AFTU 83 / 89 | Correspondances ordonnées 93/93 et 90/90 pour la 83 ; 55/55 et 53/53 pour la 89. | Préserver les répétitions. 83 : référence 11 min, pas d’heure par quai. 89 : aucune fréquence dans la fiche. « Près de la gare TER » n’est pas une traversée mesurée. |
| AFTU 84 | Projet **73 aller / 73 retour**. Aller : 71 labels alignés sur 73. Retour : 73 labels projet alignés sur 76 de `AFTU_84_UCAD` (1→1 sur 67 ; 68→69 sur 6), **ex æquo au rang 40**. Même début, autre fin : l’archive poursuit après « Jaxaay2 Route Du 84 ». | Aucun arrêt intercalé, supprimé ou renuméroté. Les **73 heures retour** de 05:49 à 07:09 décrivent les appels d’une même référence ; les rangs 7–9 à 05:54/55/56 ne donnent pas une cadence d’une minute. La référence de fréquence est **14 min**, pas un départ daté. Le guide JOJ et les quais DDD relus sur la VDN ne valident pas la chaussée ou les quais de la 84. |
| AFTU 74 | Fiche AFTU : **14 repères** de Bargny gare à Cité COCEHAS. Archives `AFTU_74_bargny` / `AFTU_74_SOCABECK` : **87 occurrences chacune**. L’agrégateur décrit **51 arrêts par sens** sur Rufisque–Tivaouane Peul. Colobane Rufisque n’est pas Colobane TER. | Retour inversé du fichier conservé en `unconfirmedReturn` ; grilles du corridor court conservées avec leur URL en `otherCorridor`. Dans Explorer : **« Non confirmé »**, pas de compte à rebours pour Bargny. À Jaxaay, les repères délimitent une chaussée, pas des arrêts de bus. |
| AFTU 85 | Fichier `85-unverified` : 89/95 occurrences avec « Terminus De La Ligne 73 » et des repères de Lac Rose. Index : Banoba–Liberté 5. | Hors attribution ; ni renommé 73, ni attaché à 85 par le chargeur d’Explorer. |
| AFTU 58 / 88 / 91 | 58 historique : Yeumbeul/Comico, 41/49 appels ; [PDF 58](https://appassets.mvtdev.com/map/48/l/5996/18051519.pdf) Fass Mbao, 39/43. 88 : 77/78 et 81/81 alignés ; 91 : 69/70 dans chaque sens. | Maintenir les variantes et les deux séquences de chaque source. Les textes, droits et points de quai d’un agrégateur ne sont pas repris comme une nouvelle base géographique. |

Le comparateur signale désormais dans `sharedIdBlocks` les blocs **consécutifs de mêmes identifiants** et leurs rangs dans chaque variante du même réseau. Par exemple, la 233 partage le bloc de la 232 aux Maristes mais sa fiche opérateur est contradictoire : elle n’est pas ajoutée. Le large accord de rangs de la 83 n’est pas une preuve de correspondance à Rufisque. Les [décisions par direction](../data/bus-sections/README.md) distinguent les occurrences de fiche, les nœuds qui bornent la rue et les quais effectivement membres d’une relation.

**Limites de la recherche.** Le [relevé PBF](audit-relations-bus-osm-dakar-2026-11-18.md) donne 25 relations `route=bus`, dont 15 DDD et une AFTU/Tata ; ce n’est pas le dénominateur des lignes de Dakar. Les membres des portions ont été relus directement dans l’API OSM. La CI produit en plus une comparaison par occurrence et par version sur le PBF qu’elle obtient (voir la procédure ci-dessous) ; elle ne transforme pas un nom identique ou un score en droit de monter. Le téléchargement de l’ancien artefact CI complet depuis le poste de recette a échoué ; les chiffres historiques ci-dessus ne sont pas présentés comme une seconde mesure indépendante du jour. Une requête Overpass en échec ne signifie pas « aucun arrêt ». Un trajet **voiture** OSRM n’est pas la preuve d’un sens commercial, d’une traversée ou de sa durée : près de la VDN, certains calculs font jusqu’à près de 3 km pour atteindre l’autre chaussée. Aucun de ces résultats n’est embarqué. Autres pistes explorées (ArcGIS, exports 2017, dépôt `dakar-bus`, Waymark, Moovit/TransitByCity, plans JOJ) : recoupements ou divergences, pas de nouvelle édition datée avec droits et accès validés.

## Mesure avant / après

Rejeu sans API, réglages par défaut, heure de Dakar, **18 novembre 2026**. Les couples sont orientés, départ ≠ arrivée. Un « voyage complet » répond aux deux sélections exactes, pas à deux arrêts proposés à proximité.

| Même sélection qu’avant | Couples | À 08:10 et 19:00 | À 21:10 |
|---|---:|---|---|
| 97 points de #274 | 9 312 | **562 complets**, 1 354 avec tronçon après substitution, 7 396 ni l’un ni l’autre | **288** / 675 / 8 349 |
| 114 points de la première version de #275 (`39517c0`) | 12 882 | **562 complets**, 38 cartes exactes sans horaire ; sinon 2 539 tronçons | **288 complets**, 38 cartes exactes ; sinon 1 126 tronçons |
| 132 points du commit précédent (`3163461`) | 17 292 | **716 complets**, 80 cartes exactes ; sinon 3 645 tronçons | **389 complets**, 80 cartes exactes ; sinon 1 597 tronçons |

**Comparaison à périmètre constant.** Les [114 IDs de `39517c0`](../data/bus-sections/selection-39517c0.json) et les [132 IDs de `3163461`](../data/bus-sections/selection-3163461.json) ont été rejoués avec le même script sur le code de `3163461` et sur cette version, aux trois heures et en mode strict à 19 h. Pour chacune des huit comparaisons, l’empreinte des voyages complets est identique : sélections exactes, variantes, modes, points de montée et de descente, heures, mètres et attente par étape. À 19 h l’empreinte de la cohorte de 132 est `5f889b623b1932126d55b1aa70f9eaa14ef7ce50384597c4973222dcba24b2b5`. Un écran qui propose une autre carte à un même couple ne constitue pas un nouveau voyage.

**Sélection étendue : 144 points, 20 592 couples.** Les douze ajouts à `3163461` sont tous des repères cartographiques, aucun n’est un point de montée. Partition **exclusive**, dans cet ordre :

| Meilleure réponse pour une demande | 08:10 | 19:00 | 21:10 | 19:00 sans marches strict |
|---|---:|---:|---:|---:|
| Voyage complet entre les points choisis | 716 | 716 | 389 | 0 |
| Carte de bus entre les deux repères exacts, sans horaire | 108 | 108 | 108 | 0 |
| Sinon : tronçon entre arrêts de remplacement, avec créneau | 4 746 | 4 746 | 2 097 | 0 |
| Sinon : carte à proximité, sans accès vérifié | 0 | 0 | 0 | 0 |
| Sinon : changement à vérifier | 951 | 951 | 693 | 0 |
| Sinon : fiche de ligne | 274 | 274 | 331 | 0 |
| Autre refus | 13 797 | 13 797 | 16 974 | 20 592 |
| **Total** | **20 592** | **20 592** | **20 592** | **20 592** |

Parmi les **716** couples complets à 19 h, **44** comprennent la marche initiale depuis un îlot de Scat Urbam et **44** la marche finale jusqu’à un îlot, comme à `3163461`. À 21:10 : 44 avec accès et 14 avec marche finale. Aucun voyage n’emprunte DDD, AFTU ou TATA ; **aucun changement de véhicule**, avec ou sans marche. « Aucun résultat sans marches strict » signifie manque de preuve, pas que tous les lieux sont inaccessibles.

Les 108 cartes exactes sont des **couples distincts**, recouvrements déduits. Si on compte tous les refus avec tronçon de remplacement à 19 h, on en trouve 4 825 ; **79** proposent également une carte exacte. Ne pas additionner ces chiffres aux voyages complets.

## Reproduire et débloquer la suite

```sh
D=$(mktemp -d)
npm run audit:bus -- --output "$D/inventaire.json"
# Ajouter --markdown docs/couverture-sources-bus.md pour régénérer le tableau.
# Comparaison facultative, avec les deux ZIP obtenus à la révision PassBi liée plus haut :
python3 scripts/compare_bus_occurrences.py --inventory "$D/inventaire.json" \
  --ddd "$D/gtfs_Dem_Dikk.zip" --aftu "$D/gtfs_AFTU.zip" --output "$D/comparaison.json"
# SHA-256 attendus (autres archives refusées) :
# DDD   578323c9fa4375313d57c4120071da3d0da499eb9216e5a4a22a28ffae707159
# AFTU  7fae6b438de6177ff1d777546684e83c8882927b67efa4645dbecca3d77af428
# Rejouer les sélections antérieures, puis l’ensemble actuel :
sel=data/bus-sections/selection-39517c0.json
node -e 'console.log(JSON.stringify(require("./"+process.argv[1]).filter(id => !id.startsWith("landmark:bus-osm-"))))' "$sel" > "$D/97.json"
for cohort in "$D/97.json" "$sel" data/bus-sections/selection-3163461.json; do
  npm run --silent audit:place-connections -- --at 2026-11-18T19:00 --matrix --points "$cohort"
done
npm run --silent audit:place-connections -- --at 2026-11-18T19:00 --matrix
npm run --silent audit:place-connections -- --at 2026-11-18T19:00 --matrix --step-free
npm run --silent audit:passenger-transfers -- --json
```

**Priorité pour Keur Massar :** obtenir du GIE/CETUD ou d’un relevé autorisé les positions des quais du **74 à Bargny et Keur Massar**, dans le sens concerné ; le chemin de la sortie publique TER au quai de montée et celui de descente à la destination ; le calendrier, le dernier départ atteignable et la durée selon la voirie. Pour la 83 à Rufisque, distinguer les deux occurrences Sonadis et le quai de retour. Pour la 84, lever le désaccord d’occurrences et obtenir les quais par chaussée ; pour la 501, confirmer le service Port/Palais plutôt que résoudre le conflit par le nom. Les [dossiers par pôle](../src/admin/dakarTransferDossiers.ts) distinguent notamment Bargny, PNR, gare TER Rufisque, gare routière, Colobane Rufisque, gare routière de Keur Massar et terminus 52. **14 dossiers, 28 sens de changement bloqués, 4 arcs piétons embarqués réservés à l’accès/sortie de B1**. L’audit sépare le quai de montée ou de descente, la marche et la desserte dans le bon sens. Un cheminement dirigé et sa preuve d’accessibilité ne se déduisent ni de l’identité d’un quartier ni d’une distance courte.

La [procédure d’admission d’une édition opérateur](preparer-une-correspondance.md) existe déjà : snapshot, droits, revue, tracés, appels ordonnés et services datés. Le moteur vérifie aussi le **changement au même emplacement du quai**, sans marche, entre deux dessertes datées : preuves distinctes de descente, de montée et de possibilité de changer dans ce sens. Une preuve absente, une autre ligne au même endroit ou un délai non respecté empêchent la correspondance. Un accès réservé à l’entrée/sortie reste réservé après publication de l’édition. Ce mécanisme a été testé de bout en bout sur une publication temporaire ; **aucune permission de ce type n’est activée à Dakar**.

**Contrôle PBF en CI, en lecture seule.** L’artefact `dakar-bus-occurrence-review` contient l’inventaire et `occurrences.json` : URL et SHA-256 du fichier téléchargé, familles/codes sans relation attribuée, rangs des membres d’arrêt comparés (y compris homonymes et rôles), drapeaux `recheck` sur les extraits figés. Une zone d’arrêt n’est pas une relation de route : à Petersen notamment, l’ordre de ses membres **n’apparie pas** un stop à un quai. Le [job du commit précédent](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44559018198/job/135682850076) donnait 0/11 à relire après correction du rôle `Forward` ; ce résultat ne porte pas sur les 35 attributions ci-dessus. Le nouveau contrôle vérifie également, pour **chaque** portion en limites routières, que les nœuds de début, intermédiaires et de fin appartiennent dans cet ordre à la chaussée orientée. Consulter l’annotation et l’artefact du commit concerné. Une comparaison PBF réussie confirme la cartographie, pas les courses du jour.

Reproduction avec son propre extrait :

```sh
python3 scripts/extract_dakar_bus_route_relations_from_pbf.py "$PBF" "$D/pbf.json" --inventory "$D/inventaire.json"
python3 -m scripts.audit_bus_osm_occurrences "$D/inventaire.json" "$D/pbf.json" "$D/occurrences.json"
```

**Recette locale.** Build TypeScript et bundle statique avec contrôle de montage ; entrée **486 206 / 500 000 octets**. Tests du graphe, de la publication Python → TypeScript, des rangs et des refus. Dans Chromium mobile (393 × 852), sans API : deux branches de la 40, six fiches sur la même chaussée Université–Médina, rangs 58–63 de la 84 à Jaxaay, inversion refusée, aucune jonction ENSUP–Stade, affiche 74 sans grille de Bargny. Le trajet B1 avec marche à Scat Urbam fonctionne toujours dans les deux sens revus ; retrait en profil strict et aucun départ du quai de descente à Petersen. Avec une réponse de publication **fictive** : deux véhicules, descente du premier et montée dans le second au même emplacement, 300 s d’attente, pas de marche dessinée ; départ manqué et mode direct refusés. Voir les [preuves et commandes spécifiques à B1](../data/bus-sections/acces-scat-urbam.md).
