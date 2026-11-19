# Bus à Dakar : ce que le calculateur peut montrer

**Cinq portions de voirie, mais pas cinq nouvelles courses.** Sur la base de la PR #274, *Trajet* permet désormais de chercher **17 repères** et d’afficher un tracé orienté de DDD 1, DDD 4 ou AFTU 40. Les deux sens de la 4 utilisent des chaussées et des quais différents. Le tronçon AFTU 40 est délimité par deux carrefours, **pas par des arrêts**. Aucune marche ni course datée de ces lignes n’a pu être ajoutée au réseau embarqué. Le TER et B1 n’ont pas été modifiés.

## Essayer sans API

| Dans les champs Départ puis Destination | Résultat |
|---|---|
| Chercher « DDD 1 » ; choisir **Manguiers → Stade · avenue Blaise Diagne** | 1 667 m vers Leclerc, six quais cartographiés. « Voir cette portion sur la carte » montre seulement cette portion, en tirets, avec des losanges. Pas d’heure ni de symbole de montée. |
| **Médina · vers Leclerc → Stade · avenue Blaise Diagne** | DDD 1 et DDD 4 partagent ici 787 m. Choisir l’une des deux cartes ; on ne prend pas deux bus. |
| Chercher « AFTU 40 » ; choisir **Carrefour des Civilisations → Route des pères Maristes × Front de Terre** | 938 m vers Petersen ; la limite au carrefour n’est pas un quai où attendre. Inverser : aucun retour de la 40 déduit. |
| **Gorom 2 → Noflaye**, 19 h | La fiche AFTU 90 cite « Croisement Gorom 2 » puis « Noflaye ». Son ordre est consultable, pas la position des quais ni l’heure de passage. Pas de tracé. |
| **Gare TER de Dakar → Keur Massar** (`14.7900,-17.3100`), 18 novembre 2026 à 19 h | Le TER jusqu’à Bargny peut être calculé **à part** ; la [fiche AFTU 74](https://aftu-senegal.org/map/dakar-urbain-ligne-74/) cite ensuite le terminus de Keur Massar. Ni la sortie de gare vers le quai du 74, ni le bus suivant, ni la marche finale ne sont établis. Le point de la capture ne devient pas un terminus. |

La carte ne s’affiche pas automatiquement lors d’un refus. Un point GPS à ≤350 m d’un repère (ou moins si le rayon choisi est plus petit) peut faire découvrir une portion. L’écart à vol d’oiseau reste un écart, **même à 0 m**. Un ID de quai publié, une épingle et un repère local ne sont pas interchangeables. Les filtres de modes et sans marches s’appliquent aussi à ces propositions. Le copilote peut expliquer une portion, mais ne la mémorise pas comme un trajet accompli.

## Couverture des sources réellement relues

[Tableau généré pour chaque code](couverture-sources-bus.md) · [preuves OSM, versions, jointures, projections et licence par portion](../data/bus-sections/README.md).

| Famille de **provenance** | Identités locales, union des registres | Dans un catalogue propre à la famille | Avec au moins une liste ordonnée¹ | Avec des listes balisées dans les deux sens¹ | Codes avec fiche consultable dans les résultats | Portions de carte | Sens datés de bus embarqués |
|---|---:|---:|---:|---:|---:|---:|---:|
| DDD | 48 | 41 | 40 | 2 | 33 | 4 sur 2 lignes | 0 |
| AFTU | 73 | 73 | 72 | 27 | 30 | 1 sur 1 ligne | 0 |
| TATA | 65 | 62 | 62 | 0 | 37 | 0 distincte | 0 |

¹ Comptage des listes de libellés des fichiers et registres (`source-order`, `directional-sheet`, `owner-sequence`, `reader-sheet`, `circuit`) : ni nombre de quais géolocalisés, ni homologation des intitulés « aller/retour ». Une description officielle peut inclure des variantes de retour **sans** publier de seconde liste. Une seule liste figurant sous plusieurs sources ne devient pas plusieurs preuves indépendantes. Les `stopIds` hérités pouvant être des chaînes comme « UCAD » restent non résolus, pas des clés de quai.

* **DDD.** `mobility-lines.json` contient 37 lignes DDD ; les 34 séquences de `dddPublishedRoutes` et les 39 du registre officiel agrégé se recouvrent. Les circuits 18 et 20 restent des circuits. Les variantes 15/15A/15B, 502/502A/502B, 503/503A/503B, TAF TAF et TO1 ne sont pas fusionnées. Les deux ordres 501 Port de Dakar ↔ Palais 2 (9/9) sont lisibles comme **transcription du projet**. Ils ne réconcilient pas la [fiche Palais 2 → Leclerc ni l’intitulé Gare de Dakar](source-audits/ddd-line-501-source-conflict-2026-11-14.md). La couche ArcGIS historique de la 1 et le [chatbot DDD](https://demdikk.sn/chatbot-arrets/) aident à situer des repères, mais ne fournissent pas le calendrier et l’ordre des quais dans chaque sens. Pour la 1, 05:30/20:30 à Parcelles et 06:30/21:00 à Leclerc sont des bornes de départ aux terminus, **pas un intervalle**.
* **AFTU.** 1–5 et 24–91 ; 72 entrées dans `mobility-lines.json`, 28 fichiers directionnels examinés, dont le retour de la 66. Conservation des ordres plats et imbriqués sans dédoubler deux copies identiques **dans le même fichier**. L’[index AFTU](https://aftu-senegal.org/infos-pratiques/) et 65 descriptifs de l’audit de pages apportent des rues et des terminus. Exemple : les rues de retour mentionnées pour la [2](https://aftu-senegal.org/map/dakar-urbain-ligne-2/) ne constituent pas une deuxième séquence de quais. La [40](https://aftu-senegal.org/map/dakar-urbain-ligne-40/) a un ordre textuel Grand Mbao → Petersen, distinct de sa seule portion de carte. Les paires de fiches 83, 84, 88, 89, 90 et 91 ont des liens vers la transcription précise, pas vers un faux flux officiel. Les anciens horaires invalidés de la 86 ne sont pas publiés.
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
| AFTU 85 | Fichier `85-unverified` : 89/95 occurrences avec « Terminus De La Ligne 73 » et des repères de Lac Rose. Index : Banoba–Liberté 5. | Hors attribution ; ni renommé 73, ni attaché à 85 par le chargeur d’Explorer. |
| AFTU 58 / 88 / 91 | 58 historique : Yeumbeul/Comico, 41/49 appels ; [PDF 58](https://appassets.mvtdev.com/map/48/l/5996/18051519.pdf) Fass Mbao, 39/43. 88 : 77/78 et 81/81 alignés ; 91 : 69/70 dans chaque sens. | Maintenir les variantes et les deux séquences de chaque source. Les textes, droits et points de quai d’un agrégateur ne sont pas repris comme une nouvelle base géographique. |

**Limites de la recherche.** Le [relevé PBF](audit-relations-bus-osm-dakar-2026-11-18.md) donne 25 relations `route=bus`, dont 15 DDD et une AFTU/Tata ; ce n’est pas le dénominateur des lignes de Dakar. Le téléchargement de l’artefact CI complet a échoué au stockage distant. Les quatre relations et les voies des cinq portions ont été relues directement par l’API OSM ; les décomptes globaux du PBF demeurent ceux de l’audit versionné. Une requête Overpass en échec ne signifie pas « aucun arrêt ». Un trajet **voiture** OSRM n’est pas la preuve d’un sens commercial, d’une traversée ou de sa durée : près de la VDN, certains calculs font jusqu’à près de 3 km pour atteindre l’autre chaussée. Aucun de ces résultats n’est embarqué. Autres pistes explorées (ArcGIS, exports 2017, dépôt `dakar-bus`, Waymark, Moovit/TransitByCity, plans JOJ) : recoupements ou divergences, pas de nouvelle édition datée avec droits et accès validés.

## Mesure avant / après

Rejeu sans API, avec les réglages par défaut, heure de Dakar, le **18 novembre 2026**. Les 97 points précédents sont toujours présents. Les 17 nouveaux sont des repères de carte : un total sur 114 points n’est pas directement un gain sur les anciennes demandes.

À **périmètre constant** (97 × 96 = 9 312 couples orientés), à 08:10 et 19:00 : **562 voyages complets**, 1 354 couples avec seulement un tronçon calculable après substitution, 7 396 sans l’un ni l’autre, comme en #274. À 21:10 : 288 / 675 / 8 349. **Gain de voyages complets : zéro.** Les fiches offrent néanmoins une indication supplémentaire, par exemple pour Gorom 2 → Noflaye et Liberté 5 → Malika.

À **périmètre étendu** (114 × 113 = 12 882), voici une partition **exclusive**, dans l’ordre de priorité indiqué. Un tronçon calculable à partir d’arrêts de remplacement ne répond pas à la demande initiale. « Autre refus » peut contenir une explication utile, mais aucune des propositions classées ici.

| Meilleure réponse pour une demande | 08:10 | 19:00 | 21:10 | 19:00 sans marches strict |
|---|---:|---:|---:|---:|
| Voyage complet entre les points choisis | 562 | 562 | 288 | 0 |
| Carte bus reliant les deux repères exacts, sans horaire | 38 | 38 | 38 | 0 |
| Sinon : tronçon entre arrêts de remplacement, avec créneau | 2 539 | 2 539 | 1 126 | 0 |
| Sinon : carte bus à proximité, sans accès vérifié | 0 | 0 | 0 | 0 |
| Sinon : piste de changement à vérifier | 951 | 951 | 693 | 0 |
| Sinon : fiche de ligne à vérifier | 274 | 274 | 331 | 0 |
| Autre refus | 8 518 | 8 518 | 10 406 | 12 882 |
| **Total** | **12 882** | **12 882** | **12 882** | **12 882** |

Les 38 couples de repères sont 1 sur la VDN + 15 sur la portion Manguiers–Stade (dont 6 aussi documentés par la 4) + 21 dans l’autre sens sur la 4 + 1 aux Maristes. Aucun des voyages complets ne contient un bus DDD/AFTU/TATA. Sans la priorité à la carte exacte, on compterait **2 571** couples avec tronçon de remplacement à 19 h, dont **32** proposent aussi cette carte. Les 1 221 pistes de changement à 19 h recoupent aussi les autres catégories. **Ne pas additionner ces derniers nombres** aux lignes du tableau.

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
npm run --silent audit:place-connections -- --at 2026-11-18T19:00 --matrix
npm run --silent audit:place-connections -- --at 2026-11-18T19:00 --matrix --step-free
npm run --silent audit:passenger-transfers -- --json
```

**Priorité pour Keur Massar :** obtenir du GIE/CETUD ou d’un relevé autorisé les positions des quais du **74 à Bargny et Keur Massar**, dans le sens concerné ; le chemin de la sortie publique TER au quai de montée et celui de descente à la destination ; le calendrier, le dernier départ atteignable et la durée selon la voirie. Pour la 83 à Rufisque, distinguer les deux occurrences Sonadis et le quai de retour. Pour la 84, lever le désaccord d’occurrences et obtenir les quais par chaussée ; pour la 501, confirmer le service Port/Palais plutôt que résoudre le conflit par le nom. À Petersen, Colobane et Guédiawaye, valider séparément chaque sens de changement : **8 dossiers, 16 sens encore bloqués, 0 liaison piétonne embarquée**. Un cheminement dirigé et sa preuve d’accessibilité ne se déduisent ni de l’identité d’un quartier ni d’une distance courte.

La [procédure d’admission d’une édition opérateur](preparer-une-correspondance.md) existe déjà : snapshot, droits, revue, tracés, appels ordonnés et services datés. Les exemples synthétiques multimodaux dans les tests prouvent le fonctionnement du moteur, **pas la circulation de ces services à Dakar**.

**Recette locale.** `npm run build` (TypeScript, Vite, contrôles de taille et montage du bundle) : entrée 497 991 octets sur la limite de 500 000. `npm run test:all` : 1 046 tests Vitest et 286 Python ; 51 tests Node des scripts et 3 tests d’extraction piétonne PBF. Dans Chromium à 393 × 852, sans API : soumission de la demande aux Maristes, deux losanges et zéro marqueur de montée ; six repères de Manguiers à Stade ; alternance entre 1 et 4 sur la même chaussée avec libellé de ligne actualisé ; masquage, inversion, filtres réseau et sans marches vérifiés sur le bundle construit.
