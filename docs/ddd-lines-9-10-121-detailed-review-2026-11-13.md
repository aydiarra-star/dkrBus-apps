# Revue détaillée DDD — lignes 9, 10 et 121

Date : 13 novembre 2026. Sources rapprochées : pages officielles DDD, couches ArcGIS DDD et relations OSM extraites en lecture seule.

## Ligne 9 — Liberté 6 ↔ Palais 2

Ordre officiel publié : 24 arrêts, de Terminus Liberté 6 à Terminus Palais 2.

La couche ArcGIS dédiée comporte 36 points. Son premier point est « terminus terrain joot Liberté 6 » et son dernier « Arret Termibus DD Palais 1 ». Le rapprochement de noms strict avec la liste officielle ne retrouve que deux points ordonnés : Liberté 6 (ArcGIS 2 → officiel 1) et Dieuppeul (ArcGIS 12 → officiel 5). Les libellés intermédiaires ArcGIS sont parfois des noms de rues, pas les noms de stations publiés.

| Relation OSM | Sens déclaré | Membres | ≤25 m | Médiane | Lecture |
|---|---|---:|---:|---:|---|
| 7487218 | Liberté 6 → Palais 1 | 29 | 27 | 1,7 m | Très forte cohérence géographique, direction alignée sur l'ordre officiel, terminus à clarifier |
| 6996431 | Palais 1 → Liberté 6 | 32 | 7 | 55,6 m | Direction opposée déclarée, géométrie moins proche de la couche de référence |

La relation 7487218 a 28/29 membres à 100 m ou moins ; son point le plus éloigné est le membre 10, à environ 254 m du point ArcGIS le plus proche. Elle porte 8 membres nommés, dont Liberté 6, JVC et Hôpital Principal. Seul le premier nom est une concordance normalisée stricte avec la séquence DDD publiée. Son terminus OSM « Palais1 » ne correspond pas exactement au terminus officiel « Palais 2 » et au point ArcGIS « Palais 1 ».

La relation 6996431 commence à Palais 1 et se termine à Liberté 6. Elle peut représenter la direction opposée, mais sa distance médiane plus élevée et ses écarts de plus de 100 m sur plusieurs membres ne permettent pas de la confirmer comme retour.

**Décision ligne 9 :** priorité élevée à la relation 7487218 pour une revue d'arrêts, sans la promouvoir en itinéraire validé. Conserver 6996431 séparément comme candidate de sens opposé. Clarifier les variantes Palais 1 / Palais 2 à partir d'une preuve opérateur explicite.

## Ligne 10 — Liberté 5 ↔ Palais 2

Ordre officiel publié : 29 arrêts, de Terminus Liberté 5 (Dieuppeul) à Terminus Palais 2.

La couche ArcGIS dédiée comporte 26 points. Les concordances nominales strictes avec l'ordre officiel sont limitées à Avenue Bourguiba (ArcGIS 9 → officiel 11) et Rue Aimé Césaire (ArcGIS 14 → officiel 14). Les autres libellés ArcGIS décrivent surtout des voies ou des quartiers.

| Relation OSM | Sens déclaré | Membres | ≤25 m | Médiane | Lecture |
|---|---|---:|---:|---:|---|
| 7488283 | Liberté 5 → Palais 1 | 25 | 18 | 2,1 m | Géométrie généralement proche et sens aligné, terminus à clarifier |
| 6990845 | Palais 1 → Liberté 5 | 30 | 5 | 74,7 m | Direction opposée déclarée, géométrie dispersée |

La relation 7488283 a 20/25 membres à 50 m ou moins et 22/25 à 100 m ou moins. Ses deux membres nommés en fin de séquence sont « Hôpital Principal » et « Clémenceau » ; ils ne suffisent pas à établir une correspondance de noms ordonnée avec les 29 arrêts officiels. Son dernier membre est à environ 193 m du point ArcGIS le plus proche « Terminus Palais de Justice » : le terminus annoncé « Palais 1 » n'est donc pas équivalent à « Palais 2 » par simple proximité.

La relation 6990845 a plusieurs écarts majeurs : le membre 11 nommé « Arrêt autobus DDD 10 » est à environ 406 m du point ArcGIS le plus proche, et les membres 14, 27 et 28 dépassent également 100 m. Son premier membre « Gare Palais 2 » est à environ 205 m du point ArcGIS « Terminus Palais de Justice ».

**Décision ligne 10 :** conserver les deux directions candidates. La relation 7488283 est la meilleure candidate géographique, mais le terminus et les arrêts non nommés nécessitent une vérification. Ne pas reconstruire le retour par inversion.

## Ligne 121 — Scat Urbam ↔ Leclerc

Ordre officiel publié : 25 arrêts, de Terminus Scat Urban à Terminus Leclerc.

La couche ArcGIS dédiée comporte 31 points et fournit cinq concordances nominales ordonnées avec la séquence publiée :

| Rang ArcGIS | Nom ArcGIS | Rang DDD publié | Nom officiel |
|---:|---|---:|---|
| 1 | Terminus Scat Urban | 1 | Terminus Scat Urban |
| 25 | Allées Papa Gueye Fall | 19 | Allées Papa Guèye Fall |
| 26 | Avenue Faidherbe | 21 | Avenue Faidherbe |
| 30 | Place de l'Indépendance | 22 | Place de l'indépendance |
| 31 | Terminus Leclerc | 25 | Terminus Leclerc |

La couche ArcGIS fournit donc une séquence cartographique continue entre les deux terminus publiés, mais ses 31 points ne sont pas identiques aux 25 arrêts nommés sur la page officielle.

| Relation OSM | Sens déclaré | Membres | ≤25 m | Médiane | Lecture |
|---|---|---:|---:|---:|---|
| 6990794 | HLM Grand Yoff → Leclerc | 27 | 24 | 1,6 m | Proximité très forte sur la partie capturée, mais la séquence se termine à Place de l'Indépendance et non au terminus Leclerc |
| 6999013 | Leclerc → HLM Grand Medine | 7 | 2 | 45,8 m | Séquence courte, terminus final différent du libellé officiel |
| 2792903 | Sens non renseigné | 3 | 3 | 1,3 m | Trois plateformes sans noms, segment incomplet |

La relation 6990794 contient sept membres nommés, dont « 2 voies Sacré Cœur », « Sacré Cœur - BEM », « Tata », « DDD 121 », « 121 », « Hôtel de ville » et « Place de l'Indépendance ». Une seule concordance stricte ordonnée est obtenue avec la séquence officielle : Place de l'Indépendance (OSM 27 → officiel 22). Le membre nommé « Tata » est à environ 379 m du point ArcGIS le plus proche ; il doit rester non rapproché.

La relation 6999013 ne contient qu'un seul membre nommé (« Hôtel de ville de Dakar ») et ne compte que sept arrêts. La relation 2792903 partage trois plateformes avec la zone initiale de la ligne, mais ne fournit ni nom ni direction.

**Décision ligne 121 :** la couche ArcGIS est la meilleure référence géographique actuellement disponible pour cette ligne. Les trois relations OSM sont des fragments distincts et ne doivent pas être concaténées ni inversées pour fabriquer un itinéraire complet.

## Synthèse des priorités

1. Ligne 9 : relation 7487218, revue prioritaire des terminus et du membre OSM 10 éloigné.
2. Ligne 10 : relation 7488283, revue prioritaire du terminus Palais et des trois membres éloignés ; relation 6990845 reste séparée.
3. Ligne 121 : exploiter la séquence ArcGIS comme base de comparaison, puis rechercher les preuves permettant d'expliquer les fragments OSM et le membre « Tata » éloigné.

## Règles conservées

- Les listes DDD publiées restent la référence textuelle officielle.
- Les couches ArcGIS apportent des noms et coordonnées, mais leur ordre d'enregistrement n'est pas automatiquement un horaire ni un ordre certifié d'exploitation.
- Les relations OSM restent des candidats communautaires.
- Les directions restent séparées ; aucun retour n'est reconstruit par inversion.
- Aucun horaire ni fréquence n'est déduit de ces rapprochements.
- Aucune modification TER/BRT, aucune écriture Supabase, aucun déploiement et aucune fusion de PR.
