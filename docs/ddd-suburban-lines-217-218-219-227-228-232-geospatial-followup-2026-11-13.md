# DDD — contrôle géospatial approfondi des lignes suburbaines 217/218/219/227/228/232 — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Commit d'extraction : `c03ab074192c7ffd03c157a51d0fd586f78b3e84`  
Workflow ArcGIS : `43490066005` — `Audit updated DDD ArcGIS service (read only)`  
Artefact : `ddd-updated-service-and-sequence-audit`, ID `14068632395`, SHA-256 `142d9efcf937054d835466db7de1e172015ab3bc6a419346e3a129e1c0af0edd`.

## Découverte prioritaire : la ligne 219 est probablement masquée dans les points étiquetés 218

La couche ArcGIS d'arrêts ne renvoie aucun point avec `Nom_Ligne=ligne_219`, alors qu'elle contient bien une géométrie d'itinéraire nommée Ligne 219. L'analyse des 103 enregistrements étiquetés ligne 218 permet de séparer deux ensembles géographiques distincts :

### Ensemble A — candidat ligne 219 : Daroukhane → Ouakam

- 33 points sources, OBJECTID 54 à 86.
- Une seconde série de 33 enregistrements, OBJECTID 293 à 325, reproduit exactement les mêmes noms et coordonnées : 33 paires de positions identiques, à conserver individuellement.
- Pour chacun des 33 points uniques, la distance minimale à la polyligne ArcGIS Ligne 219 est inférieure ou égale à 9,8 m ; médiane 7,3 m (33/33 à 25 m ou moins).
- Le chaînage projeté sur la géométrie Ligne 219 progresse de Daroukhane (0 m) à Ouakam (20 815 m), dans le même sens général que la séquence DDD publiée pour la ligne 219.
- Les repères ArcGIS comprennent notamment Daroukhane, Stade de Ndiarème, Marché Jeudi, Cité des Enseignements, Route des Ndiayes, Liberté 6, 2 voies Sacré-Cœur, Ancienne Piste, Ouakam et Marché Ouakam.

**Conclusion :** preuve géographique très forte d'un bloc de 33 positions candidat de la ligne 219, stocké deux fois sous l'étiquette source 218. C'est une hypothèse d'attribution, pas une correction autorisée de `Nom_Ligne`. Les deux séries et leurs GlobalID doivent rester intactes jusqu'à confirmation de la source DDD.

### Ensemble B — candidat ligne 218 : Dépôt Thiaroye → Aéroport LSS

- 37 points sources, OBJECTID 87 à 123.
- 37/37 à 25 m ou moins de la géométrie Ligne 218 ; médiane 6,9 m ; maximum 16,1 m.
- La séquence géographique va du terminus Dépôt Thiaroye vers les repères de la RN1/Pikine, Cambérène, Patte d'Oie, VDN, Ancienne Piste, Ouakam/Mamelles, la route de l'Aéroport et le terminus Aéroport LSS.
- Cette séquence correspond au corridor publié pour la ligne 218.

**Conclusion :** la séparation spatiale des deux ensembles est robuste : les 37 points sont proches de la géométrie 218, tandis que les 33 positions uniques du premier ensemble sont proches de la géométrie 219. Les 103 enregistrements de la couche ne forment donc pas une seule séquence continue de la ligne 218.

## Contrôle des six lignes

| Ligne | Résultat géospatial | Qualification |
|---|---|---|
| 217 | 29/30 points à ≤25 m de son tracé ; médiane 6,2 m ; maximum 62,3 m. 24 points ont la ligne 217 comme tracé le plus proche ; quelques points sont plus proches des tracés 227/232. | Corrélation de corridor forte ; un point à revoir et séquence/direction non certifiées. |
| 218 | 37/37 points du bloc Thiaroye–Aéroport à ≤25 m de la géométrie 218 ; les 33 positions du bloc Daroukhane–Ouakam correspondent à la géométrie 219. | Deux ensembles distincts ; attribution des 33 points à 219 à confirmer. |
| 219 | 0 point directement étiqueté 219 dans le champ source ; 33 positions uniques du bloc étiqueté 218 à ≤9,8 m de la géométrie 219, répétées deux fois. | Candidate géographique forte, pas de réécriture de l'attribut source. |
| 227 | 8/8 points à ≤25 m de son tracé ; médiane 6,1 m ; maximum 9,1 m. Quatre points ont toutefois le tracé 217 comme tracé le plus proche. | Couverture partielle et corridor partagé ; ne pas extrapoler les arrêts manquants. |
| 228 | Quatre points seulement ; le rapport spatial antérieur les rapproche d'un tracé anonyme de 28,70 km : 3/4 à ≤25 m, maximum 85,5 m. | Identité du tracé candidate, couverture trop faible pour valider la séquence. |
| 232 | 23/23 points à ≤25 m du tracé 232 ; médiane 5,9 m ; maximum 9,8 m. 22 ont le tracé 232 comme plus proche ; un point est légèrement plus proche du 217. | Très forte cohérence géographique du groupe de points ; ordre voyageurs et retour non certifiés par cette seule projection. |

## Méthode et limites

- Les distances sont calculées par projection des points sur les polylignes ArcGIS ; le chaînage indique une position le long de la géométrie, pas une direction commerciale garantie.
- Les séquences officielles DDD servent de référence de comparaison, mais les noms de repères ArcGIS ne sont pas toujours des noms d'arrêts voyageurs normalisés.
- Les doublons exacts sont conservés : aucun GlobalID, OBJECTID, nom ou point n'est supprimé.
- Les points ne sont ni réattribués ni injectés dans le catalogue passager.
- Une polyligne unique et un ordre de chaînage ne prouvent pas à eux seuls l'existence du service dans les deux sens. Aucun retour n'est fabriqué.

## Décision opérationnelle

1. Traiter en priorité le conflit d'attribution 218/219 avec la source DDD : demander confirmation que les 33 positions Daroukhane–Ouakam sont bien la ligne 219.
2. Garder séparément le bloc de 37 positions Thiaroye–Aéroport comme candidat de la ligne 218.
3. Pour 217, contrôler le point à 62,3 m et les voisinages partagés avec 227/232.
4. Pour 227 et 228, rechercher une couverture complémentaire avant de compléter les séquences.
5. Pour 232, rapprocher les 23 positions géographiques des repères publiés et rechercher une preuve indépendante du sens retour.

## Garde-fous

Audit documentaire en lecture seule. Aucun changement de données passagers, aucun import ni écriture Supabase, aucun déploiement. TER et BRT restent intacts. Aucun GTFS utilisé ou attendu.


## Actualisation sur le service ArcGIS actualisé — 14 novembre 2026

Le workflow en lecture seule du 14 novembre (run `43556069073`, artefact `ddd-updated-service-and-sequence-audit`) a recalculé les projections à partir du service actualisé. Il confirme le découpage géographique, tout en montrant que les corridors se rapprochent localement et que le classement par « tracé le plus proche » ne doit pas être confondu avec l'appartenance métier.

### Résultats recalculés pour les 103 points étiquetés 218

| Groupe source | Nombre | Distance au tracé 219 | Distance au tracé 218 | Lecture |
|---|---:|---:|---:|---|
| OBJECTID 54–86 | 33 | 33/33 à ≤25 m ; médiane 7,29 m ; maximum 9,82 m | 7/33 à ≤25 m | Bloc spatial candidat 219 |
| OBJECTID 293–325 | 33 | 33/33 à ≤25 m ; mêmes coordonnées et noms que 54–86 | 7/33 à ≤25 m | Copie exacte du premier bloc, à conserver |
| OBJECTID 87–123 | 37 | 7/37 à ≤25 m | 37/37 à ≤25 m ; médiane 6,89 m ; maximum 16,09 m | Bloc spatial candidat 218 |

Sur les 103 points, le tracé le plus proche à moins de 25 m est le 219 pour 69 points, le 218 pour 27, le 217 pour 4 et le 232 pour 3. Ce classement est un diagnostic géométrique : il ne remplace pas l'attribut source et ne doit pas déclencher de réaffectation automatique. Les corridors se chevauchent près de certains arrêts ; par exemple, deux positions du bloc 219 sont plus proches du tracé 217 malgré leur proximité de moins de 10 m avec le tracé 219.

La géométrie ArcGIS 219 porte le nom « Daroukhane – marché Ndiarème », tandis que la séquence publiée DDD comparée indique Daroukhane → Ouakam. Le chaînage des 33 positions atteint le secteur d'Ouakam, mais le libellé de la géométrie constitue une divergence documentaire à faire confirmer par DDD, pas une preuve suffisante pour renommer le terminus.

### Décision actualisée

- Le découpage géospatial des 33 positions uniques 219 et des 37 positions 218 reste fortement corroboré.
- Les 33 enregistrements dupliqués ne sont pas dédupliqués dans les données sources.
- Le classement du tracé le plus proche est conservé uniquement comme diagnostic.
- L'attribution officielle des 33 positions à la ligne 219 et le libellé exact de son terminus restent à confirmer auprès de DDD.
- Aucun arrêt n'est réaffecté, aucune séquence de retour n'est créée et aucune donnée passager n'est modifiée.
