# Dépôt de Thiaroye : peut-on passer de la 218 à la 73 ?

**La carte situe le départ de la 73 vers Lac Rose, mais pas le quai de descente de la 218 depuis Aéroport LSS.** Les deux dessins disponibles montrent des bus qui **quittent** le site. Aucun ne montre où la 218 entrante ouvre ses portes. Le calculateur ne propose donc ni marche, ni changement à zéro mètre, ni heure de correspondance. Sur place, demander au régulateur où attendre la 73 ; ne pas suivre un tracé de véhicule à pied dans le dépôt.

## Ce que changent les horaires dans Explorer

Dans **Explorer → Prochains passages → AFTU / TATA → AFTU → 73**, choisir le sens par sa destination. Les deux listes de 75 arrêts étaient déjà dans le bon sens. C’est la durée uniforme de **69 ou 68 min**, et non l’ordre des arrêts, qui décalait le compteur à l’arrivée.

| Grille hebdomadaire relue (heure de Dakar) | Départs en semaine | Samedi et dimanche | Exemple de colonne : origine → CEM Thiaroye → terminus |
|---|---|---|---|
| [Lac Rose → Thiaroye](https://moovitapp.com/index/fr/transport_en_commun-time-73-Dakar-5996-1618038-18051511-4256342-0), CEM au rang 74 | 37, de 05:55 à 22:43, toutes les 28 min | 27, de 06:05 à 22:33, toutes les 38 min | En semaine : **05:55 → 06:53 → 06:54** ; dernière : **22:43 → 23:37 → 23:38**. Le samedi, la première arrive à **07:05**, pas à 06:54. |
| [Thiaroye → Lac Rose](https://moovitapp.com/index/fr/transport_en_commun-time-73-Dakar-5996-1618038-18051511-4256343-0), CEM au rang 2 | 42, de 05:50 à 22:55, toutes les 25 min | 30, de 06:00 à 22:55, toutes les 35 min | En semaine : **07:05 → 07:06 → 08:22** ; dernière : **22:55 → 22:56 → 23:50**. |

Chaque colonne de ces fiches Moovit (mise à jour indiquée : 16 novembre 2026) fournit les heures à **trois** rangs. Les 72 autres sont interpolés entre ces repères, pour cette colonne seulement. Durée d’un bout à l’autre : **55 à 77 min**. À 19 h le jeudi d’essai, le panneau vers Thiaroye indique **20 min** jusqu’à l’arrivée, contre 12 auparavant ; vers Lac Rose, **12 min** au lieu de 3. À l’origine : respectivement 27 et 10 min, inchangées. [Tableau par ligne](passages-bus-par-ligne.md) · [méthode et limites](modeles-passages-bus.md). Ces estimations ne sont ni du temps réel ni des courses certifiées à une date. Elles ne passent pas dans le routeur.

Dans **DDD → 218 → Aéroport LSS → Thiaroye**, le panneau ne donne qu’un **départ à LSS**, pas une arrivée au dépôt. Le [réseau DDD](https://demdikk.sn/reseau-urbain-dakar/) confirme le corridor. Le [fil DDD](https://x.com/dakardemdikk1/status/1937979936272162819) donne des bornes aux origines ; la [grille secondaire 218](https://appassets.mvtdev.com/map/48/l/5996/18051488.pdf) dessert **Rufisque**. Même « Dépot Thiaroye » sur deux grilles ne suffit pas : le départ de **07:00** face à la 73 arrivant à **06:54** est celui de la **324 vers Bargny**, pas de la 218.

## Deux sorties de bus ne désignent pas un quai commun

| Sens de changement | Ce que montrent la voirie, les dessins et les appels | Ce que cela ne montre pas |
|---|---|---|
| **218 depuis LSS → 73 vers Lac Rose** | Le début du [dessin AFTU 73](https://aftu-senegal.org/map/dakar-urbain-ligne-73/) est près du poteau [« Terminus 217 et 218 »](https://www.openstreetmap.org/node/4419421889/history/2) : **1,7 m au symbole**, 1,8 m au trait. Le poteau et les anciens appels `D_686` (dernier de la 218) et `A_586` (premier de la 73) sont à **1,5 / 5,1 / 1,8 m de l’axe** de la voie de service `178798267`. | Le poteau n’est **pas un sommet** de cette voie. Ni la position de la porte de la 218 entrante, ni le droit d’attendre la 73 au même point ne sont établis. |
| **73 depuis Lac Rose → 218 vers LSS** | Dans les **111 retours archivés** de la 73, `A_586` était l’avant-dernier arrêt ; le dernier, `A_266`, autre « Station Ciel Oil », est à **99,9 m du poteau**. Il est à **8,1 m** de la chaussée à sens unique `246856568` et à **9,9 m** d’une [autre voie de service](https://www.openstreetmap.org/way/1158060768/history/1). Le [dessin 218 vers LSS](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/1/query?objectIds=7&outFields=OBJECTID_12,Nom_Ligne&outSR=4326&geometryPrecision=7&f=json) commence au [point 539](https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0/query?objectIds=539,576&outFields=OBJECTID_12,Nom_Ligne,Nom_Arret&outSR=4326&f=json), à **29,7 m du poteau**, non au point 576 de la 217. | Ni le côté de descente actuel de la 73 ni la porte de montée de la 218. Les 99,9 m et 29,7 m ne s’additionnent pas pour obtenir une marche. |

Les 75 premiers mètres des deux tracés rejoignent l’axe de `392392834` (écarts à cette abscisse : 0,4 m sur la 73, 0,3 m sur la 218). Au nœud `3956188298`, le plan distingue [l’entrée depuis le giratoire](https://api.openstreetmap.org/api/0.6/node/6039744390/ways.json) `435850234` et [la sortie vers le giratoire](https://api.openstreetmap.org/api/0.6/node/1247815427/ways.json) `435850236`. À 150 m sur la 73, l’axe le plus proche est celui de la sortie (0,1 m) ; à 150 m sur la 218, c’est la bretelle `516261899` (3,0 m). **Ni rapprochement par axe, ni inversion de ces dessins** pour attribuer une course entrante. [Les sept anciens appels encadrants, leurs rangs et leurs variantes](terminus-correspondances.md#les-deux-sens-ne-sont-pas-symétriques) sont un moyen de retrouver les lieux, pas un service de 2026.

Le [document de voirie AGEROUTE de 2014](https://www.miga.org/sites/default/files/archive/Documents/PAR_%20PROJET_DE_LA_ROUTE_DES_NIAYES_AGEROUTE_VF-.pdf) distingue « Dépôt DDD » (PK 2+715) et « Poste » (PK 2+869) le long de la route projetée. Ce ne sont pas les positions de deux portes. La [visite du dépôt décrite par DDD en 2024](https://demdikk.sn/wp-json/wp/v2/posts/6539?_fields=date,link,content.rendered) décrit des sorties techniques vers 04 h **pour gagner les terminus**, pas le premier départ commercial de la 218.

### Et à pied ?

Dans le rayon de **600 m** autour du poteau de Thiaroye, **4 objets OSM de quai**, aucun en contact par nœud commun avec un chemin piéton retenu ; à **Ouakam Boutique Diallo**, **14 / 0** dans un rayon de **650 m**. Aucun parcours entre deux de ces objets dans l’un ou l’autre secteur. Dans la fenêtre rectangulaire distincte de l’audit de voirie, l’axe piéton cartographié le plus proche du poteau est à **345 m** : c’est une distance **vers** une géométrie, pas la longueur d’un passage à suivre. Un trottoir non dessiné ou une règle d’accès inconnue restent possibles.

[Résultats des dix fenêtres](validation-physique.md#chemins-entre-quais--lecture-du-pbf-pas-un-rayon-de-correspondance) · [reçu des mesures et empreintes](../data/bus-review/thiaroye-site.json). Le balayage régional trouve **967 objets**, 57 touchant des chemins, 52 paires orientées connectées dans la limite de 1 200 m. Aucun objet partagé ni chemin entre deux rôles de réseaux différents **identifiés dans les relations examinées**. Cela ne démontre pas l’absence de correspondances à Dakar. © [contributeurs OpenStreetMap, ODbL](https://www.openstreetmap.org/copyright).

## Pièce à demander à l’exploitation

**Demande prête à transmettre** (aucun envoi ni relevé sur place effectué) :

> Pour une même date de service à Dakar, pouvez-vous fournir le plan voyageurs en vigueur au dépôt/Poste de Thiaroye et la feuille de marche de la **218 depuis Aéroport LSS** et de la **73 vers Lac Rose** ? Sur le plan, où descend-on de la 218 et où monte-t-on dans la 73 ? Peut-on attendre au même point, ou quel chemin public faut-il prendre, par quel accès et avec quel délai ? Merci d’indiquer le titulaire de la 73, la date ou période de validité et les conditions de réutilisation.

- **DDD** : [service voyageurs](https://demdikk.sn/v2appmobile/), `serviceclient@demdikk.sn`, +221 33 824 10 10. Demander l’exploitation du dépôt et l’heure de **descente** de la course identifiée, avec l’appel précédent ; les horaires du service clients ne sont pas des horaires de bus.
- **AFTU / CAPTRANS** : [AFTU](https://aftu-senegal.org/map/dakar-urbain-ligne-73/), +221 33 859 02 88 ; demander l’agent de régulation et le **GIE titulaire** de la 73. La [liste de 14 GIE](https://cetud.sn/reseaux-de-transport/aftu/) n’attribue pas cette ligne. Faire identifier la **montée**, son heure et l’appel suivant ; demander séparément les deux autres positions pour le sens retour.
- **Observatoire du CETUD** : `observatoire@cetud.sn` ; le [système de données](https://cetud.sn/observatoire/systeme-de-donnees/) décrit GTFS, CAPTRANS et enquêtes d’exploitation. Demander l’édition applicable, les identifiants de courses et de quais et leurs droits de réutilisation. L’[annonce de CETUD Mobilités](https://cetud.sn/cetud-mobilites-une-application-pour-simplifier-vos-deplacements/) décrit un calcul multimodal ; elle ne fournit pas ce plan et nous n’avons pas testé cet itinéraire dans l’application.

Un relevé daté peut être joint à la place d’un plan : identifier séparément les deux points d’attente, mesurer le passage **de porte à porte** (traversées, barrières, escaliers, sens autorisé), ou attester explicitement le **même point** et son délai minimal. Ne pas fournir de données personnelles de voyageurs. Avec une édition réutilisable, [tester le changement hors production](preparer-une-correspondance.md#contrôle-daté-dun-dossier-de-correspondance) : arrivée réelle ou programmée → marche vérifiée → marge → première montée compatible → arrivée suivante. Tant que la première heure, le passage ou la seconde course manque, la marge restante est **inconnue**.

<details><summary>Reproduire le reçu, sans importer de géométrie opérateur</summary>

Le [job AFTU](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44674337021/job/136082454703) a ouvert les deux ZIP épinglés, le PBF national et les deux dessins sortants. Le [job régional](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44674337062/job/136082456008) a mesuré les chemins sur sa découpe Dakar du même PBF. Le seuil de 12 m dans `roadsWithin12m` sert à lister **tous** les axes proches, pas à choisir un quai. Le [script de mesure](../scripts/audit_thiaroye_site.py) ne relie pas les sommets séparés par une sortie de la fenêtre. Voir `boundsWSEN`, les versions des voies et les empreintes distinctes dans le reçu. Rejouer depuis les annotations :

```sh
set -e
rev=bab2c86f35e7d7451d9c0200c0ddd263fe343cfa
repo=aydiarra-star/dkrBus-apps
base=https://github.com/$repo/actions/runs
a=136082454703; r=136082456008
for job in "$a" "$r"; do
  api=repos/$repo/check-runs/$job
  test "$(gh api "$api" --jq '[.head_sha,.conclusion]|join(" ")')" = "$rev success"
  gh api "$api/annotations?per_page=100" > "/tmp/$job.json"
done
python -m scripts.freeze_thiaroye_site "/tmp/$a.json" "/tmp/$r.json" "$rev" \
  "$base/44674337021/job/$a" "$base/44674337062/job/$r" > /tmp/depot.json
cmp /tmp/depot.json data/bus-review/thiaroye-site.json
```

Pour refaire les mesures sur les **entrées** de ces jobs (ZIP, PBF, extraits de dessin conservés hors Git) :

```sh
python -m scripts.audit_thiaroye_site "$PBF" "$DDD_ZIP" "$AFTU_ZIP" "$AFTU_73_JSON" "$ARCGIS_218_JSON" /tmp/site.json
python -m scripts.audit_interchange_sites "$DAKAR_PBF" /tmp/quais.json --regional /tmp/region.json --ci-summary
node scripts/audit_passenger_transfers.mjs --at 2026-11-20T06:52 --json | jq '.directions[] | select(.dossier=="thiaroye-218-73") | [.from.name,.to.name,.meters,.timed.status]'
```

</details>
