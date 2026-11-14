# Audit spatial de l'ordre ArcGIS — DDD 217, 218 et candidate 219

Date : 14 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Source : service ArcGIS public `Dem_dikk_mise_a_jour`, couches 0 (arrêts) et 1 (itinéraires)  
Extraction : workflow `43558246901`, artefact `ddd-updated-arcgis-sequence-audit` (ID `14098996156`)

## Résultat accéléré

La projection métrique des points ArcGIS sur les polylignes correspondantes révèle trois groupes dont l'ordre de réponse des points suit strictement le chaînage de la géométrie. C'est une preuve supplémentaire de cohérence spatiale et d'ordre cartographique de la source, mais pas une validation des noms voyageurs, du sens commercial, de l'exhaustivité ou de l'exploitation actuelle.

| Groupe source | Polyligne comparée | Points | À ≤25 m | Médiane | Maximum | Corrélation de rang avec le chaînage |
|---|---|---:|---:|---:|---:|---:|
| `ligne_217`, OBJECTID 124–153 | Ligne 217 | 30 | 29/30 | 6,13 m | 62,18 m | Spearman 1,000 |
| `ligne_218`, OBJECTID 54–86 | Ligne 219 (candidat) | 33 | 33/33 | 7,28 m | 9,80 m | Spearman 1,000 |
| `ligne_218`, OBJECTID 87–123 | Ligne 218 | 37 | 37/37 | 6,86 m | 16,05 m | Spearman 1,000 |

Les longueurs des géométries utilisées sont respectivement 23,88 km (217), 20,77 km (219) et 25,60 km (218).

## Ligne 217 — ordre spatial fort, noms non rapprochés

- Les 30 points sources codés `ligne_217` suivent le chaînage de la polyligne 217 dans le même ordre que la réponse ArcGIS (corrélation de rang 1,000).
- 29/30 sont à 25 m ou moins ; le point OBJECTID 124 (« Terminus 2017 2018 ») est à 62,18 m.
- Les autres positions sont proches de la géométrie, avec une distance médiane de 6,13 m.
- Le contrôle strict des noms avec la séquence DDD publiée 217 donne 0 correspondance exacte ordonnée sur les 15 repères publiés.
- La géométrie ArcGIS est nommée « Dépôt Thiaroye – police Thiaroye », tandis que la page officielle DDD présente sous 217 une liste de 15 repères également affichée sous 218, et dont le texte continue jusqu'à Aéroport LSS malgré l'en-tête 217 « Ouakam ».

**Qualification :** groupe ArcGIS 217 spatialement ordonné et bien calé sur sa polyligne, mais conflit non résolu entre noms/terminus de la fiche officielle, libellé de géométrie et noms des points. Ne pas remplacer la séquence officielle ni publier les 30 points comme arrêts voyageurs validés.

## Ligne 218 — deux blocs spatiaux distincts

### Bloc Thiaroye–Aéroport LSS

- Les 37 points OBJECTID 87–123 sont tous à 25 m ou moins de la polyligne 218.
- La distance médiane est de 6,86 m et le maximum de 16,05 m.
- Leur ordre source suit strictement le chaînage de la polyligne (Spearman 1,000).
- Les noms correspondent au corridor RN, Pikine, Cambérène, Patte d'Oie, VDN, Ancienne Piste, Ouakam/Mamelles, route de l'Aéroport et Aéroport LSS.

**Qualification :** bloc spatial 218 fortement corroboré. Cela confirme l'ordre géographique de la couche, pas l'intégralité des arrêts voyageurs publiés ni un retour indépendant.

### Bloc Daroukhane–Ouakam étiqueté 218 : candidat 219

- Les 33 points OBJECTID 54–86 sont tous à 25 m ou moins de la polyligne 219 ; médiane 7,28 m ; maximum 9,80 m.
- Leur ordre source suit strictement le chaînage de la polyligne 219 (Spearman 1,000).
- Les mêmes 33 noms et coordonnées sont reproduits dans un second bloc, OBJECTID 293–325 : 33 doublons exacts à conserver individuellement.
- Le contrôle strict des noms avec la séquence officielle 219 (19 repères) ne donne que 3 correspondances ordonnées exactes : Daroukhane, Ancienne Piste et Ouakam. Les ressemblances de libellés restent des hypothèses.

**Qualification :** attribution géographique candidate à la ligne 219 très fortement corroborée, mais l'attribut source reste `ligne_218`. Aucun renommage, réaffectation ou dédoublonnage automatique.

## Décisions de traitement

1. Conserver les trois groupes et tous les identifiants source, y compris les 33 doublons exacts.
2. Ajouter le chaînage spatial comme indicateur de qualité de l'audit, jamais comme preuve autonome du sens commercial.
3. Garder le conflit de publication 217/218 ouvert : la page DDD actuelle affiche la même liste de 15 repères pour les deux lignes, avec des en-têtes de terminus différents.
4. Garder le bloc 54–86 comme candidat 219 et le bloc 87–123 comme candidat 218 ; demander une confirmation DDD avant toute réattribution.
5. Ne pas convertir ces résultats en séquences aller/retour, horaires ou fréquences voyageurs.

## Sources

- ArcGIS DDD actualisé : service `Dem_dikk_mise_a_jour`, couches 0 et 1, dernière édition indiquée au 24 septembre 2024.
- DDD, « Réseau urbain de Dakar » : https://demdikk.sn/reseau-urbain-dakar/
- Rapport d'inventaire du service : `docs/ddd-updated-arcgis-2024-service-inventory-2026-11-14.md`
- Rapport de suivi géospatial 217/218/219 : `docs/ddd-suburban-lines-217-218-219-227-228-232-geospatial-followup-2026-11-13.md`

Audit en lecture seule. Aucun changement du catalogue passager, aucune écriture Supabase, aucun déploiement, aucun changement TER/BRT. Aucun GTFS utilisé ou attendu.
