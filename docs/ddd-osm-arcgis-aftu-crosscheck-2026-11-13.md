# Audit croisé OSM / ArcGIS / pages officielles AFTU — 13 novembre 2026

Branche auditée : `feat/admin-stop-sequence-audit-phase-a`
Commit source : `59730d737e5cf138ccc6a84df198a74bb50f9814`
Périmètre : extraction OSM en lecture seule, couches ArcGIS DDD publiques et pages d'itinéraires AFTU publiques.

## 1. OpenStreetMap : extraction terminée

Artefact : `dakar-osm-route-candidates`, workflow 43488411135.

- 6 610 éléments OSM récupérés.
- 25 relations de lignes et 2 relations route_master.
- 23 candidates dans le périmètre Dakar ; 0 candidate hors périmètre ; 2 conflits de périmètre à conserver comme diagnostics.
- 18 relations possèdent des membres d'arrêts ordonnés, soit 522 membres.
- 7 relations n'ont pas de membres d'arrêts ordonnés.
- 4 relations sont liées à un route_master.
- 13 relations restent non appariées.
- 5 paires directionnelles candidates : lignes 4, 9, 10, B1 et 7.
- 4 paires ont des terminus inversés ; la paire 7 est associée à un route_master commun.
- 50 candidats de rapprochement stop/platform entre les deux directions.

Les relations et leurs séquences restent séparées. Une paire est une hypothèse de rapprochement, pas une validation d'itinéraire opérateur. Les membres ordonnés OSM ne sont pas réécrits et aucune direction manquante n'est fabriquée.

## 2. Rapprochement spatial des arrêts DDD OSM vers les couches ArcGIS

Artefacts : `dakar-osm-route-candidates` et `ddd-arcgis-route-stop-candidates`.
Les distances ci-dessous sont calculées entre chaque membre OSM géolocalisé d'une relation et le point ArcGIS le plus proche dans la couche d'arrêts de la même référence de ligne. Les points ArcGIS sont des candidats non ordonnés : ce calcul mesure la proximité spatiale, pas l'ordre de desserte ni l'identité certaine d'un arrêt.

| Réf. | Relation OSM | Sens indiqué par OSM | Membres OSM géolocalisés | Points ArcGIS | Plus proche à ≤30 m | Plus proche à ≤100 m |
|---|---:|---|---:|---:|---:|---:|
| 1 | 6951328 | Parcelles assainies → Leclerc | 38 | 44 | 34 | 36 |
| 4 | 6990830 | Leclerc → Liberté 5 | 34 | 30 | 2 | 14 |
| 4 | 7203970 | Liberté 5 → Leclerc | 32 | 30 | 24 | 24 |
| 7 | 6990669 | Palais → Ouakam | 31 | 33 | 7 | 17 |
| 7 | 7500475 | Ouakam → Palais 1 | 34 | 33 | 29 | 31 |
| 9 | 6996431 | Palais 1 → Liberté 6 | 32 | 36 | 8 | 23 |
| 9 | 7487218 | Liberté 6 → Palais 1 | 29 | 36 | 27 | 28 |
| 10 | 6990845 | Palais 1 → Liberté 5 | 30 | 26 | 6 | 21 |
| 10 | 7488283 | Liberté 5 → Palais 1 | 25 | 26 | 18 | 22 |
| 121 | 2792903 | terminus non renseignés | 3 | 31 | 3 | 3 |
| 121 | 6990794 | HLM Grand Yoff → Leclerc | 27 | 31 | 24 | 26 |
| 121 | 6999013 | Leclerc → HLM Grand Médine | 7 | 31 | 2 | 5 |

### Lecture prudente

- Pour les paires 4, 7, 9 et 10, une relation de chaque paire est nettement plus proche du nuage de points ArcGIS que l'autre. C'est un signal utile pour prioriser la revue géographique, mais cela ne prouve pas que la couche ArcGIS décrit exclusivement ce sens.
- Les relations OSM 1 et 121 montrent également des proximités élevées ; la ligne 121 comporte toutefois plusieurs relations portant la même référence, dont une sans terminus renseignés. Il faut conserver cette ambiguïté.
- Les écarts les plus importants ne doivent pas être forcés dans une correspondance : ils peuvent refléter des arrêts non cartographiés, des décalages, des différences de couverture ou des données OSM/ArcGIS de périodes différentes.
- Les couches de points ArcGIS ne sont pas ordonnées. Leur ordre de retour ne doit jamais devenir l'ordre des arrêts.
- Les couches de tracés ArcGIS fournissent 24 couches récupérées, 25 entités de tracé et 455 points d'arrêt ; aucune erreur d'extraction ni limite de transfert n'a été signalée. Les géométries de tracé sont conservées comme preuves de comparaison, pas comme séquences d'arrêts.

## 3. Pages officielles AFTU

Artefact : `aftu-official-route-pages`, workflow 43488411285.

- 65 pages récupérées et 65 pages avec une description d'itinéraire.
- 63 pages de lignes reliées depuis l'index et 9 pages complémentaires ciblées dans le périmètre de collecte.
- 7 URL candidates (lignes 84 à 89 et 91) ont répondu HTTP 404.
- Les descriptions récupérées sont des corridors/itinéraires textuels publiés ; elles ne fournissent pas automatiquement un ordre détaillé de chaque arrêt dans les deux sens.
- Les pages qui ne décrivent qu'un corridor restent un seul sens documenté ou une description de corridor. Ne pas fabriquer le retour en inversant la liste.

## 4. Suite opérationnelle

1. Prioriser les paires OSM 4, 7, 9 et 10 pour la revue cartographique, en affichant côte à côte les séquences indépendantes et leurs écarts aux points ArcGIS.
2. Vérifier les membres OSM non nommés par leur géométrie et leurs tags, sans leur attribuer un nom d'arrêt non sourcé.
3. Traiter séparément les ambiguïtés des références 121 et les conflits de métadonnées OSM.
4. Continuer la collecte AFTU sur les pages accessibles et garder les 7 erreurs HTTP comme erreurs de source, pas comme lignes inexistantes.
5. Ne publier aucun arrêt ou sens dans le catalogue passager sur la seule base de ces rapprochements ; exiger une validation par source opérateur et cohérence géographique.

## 5. Sécurité et limites

Audit entièrement en lecture seule. Aucune donnée passager, horaire, fréquence, direction ou arrêt n'a été modifiée. Aucun appel d'écriture Supabase et aucun déploiement. TER et BRT restent intacts. GTFS n'est pas requis et ne bloque pas ce chantier.
