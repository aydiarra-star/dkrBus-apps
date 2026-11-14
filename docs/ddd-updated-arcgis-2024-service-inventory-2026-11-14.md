# Inventaire du service ArcGIS DDD mis à jour — 14 novembre 2026

## Périmètre et précautions

Audit en lecture seule du service public ArcGIS `Dem_dikk_mise_a_jour` :
`https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer`

Le service est daté d'une dernière édition du 24 septembre 2024 dans les métadonnées de ses couches. Il est conservé séparément des anciens services ArcGIS DDD. L'extraction ne valide à elle seule ni l'identité opérationnelle des arrêts, ni leur ordre, ni le sens, ni les horaires/fréquences. Aucun enregistrement de l'application ou de la base n'a été modifié.

## Volume extrait

- Couche arrêts : 777 entités ; 775 avec géométrie ; 750 avec nom ; 775 avec un code de ligne.
- Couche itinéraires : 25 entités ; 24 avec géométrie ; 22 avec un nom de ligne.
- Les champs de la couche itinéraires contiennent des tronçons/corridors textuels successifs, mais ne constituent pas automatiquement une liste ordonnée d'arrêts par direction.
- Deux enregistrements d'arrêts portent un code de ligne vide/blanc ; les codes source et doublons éventuels sont conservés tels quels.

## Comptages des arrêts par code source

| Code source | Entités |
|---|---:|
| LIgne_1 | 44 |
| LIgne_4 | 29 |
| LIgne_10 | 26 |
| LIgne_13 | 22 |
| ligne_13 | 23 |
| LIgne_18 | 44 |
| LIgne_23 | 54 |
| LIgne_121 | 31 |
| Ligne_11 | 23 |
| Ligne_12 | 40 |
| ligne_16A | 13 |
| ligne_16B | 30 |
| ligne_2 | 32 |
| ligne_5 | 18 |
| ligne_6 | 60 |
| ligne_7 | 33 |
| ligne_8 | 49 |
| ligne_9 | 36 |
| ligne_217 | 30 |
| ligne_218 | 103 |
| ligne_227 | 8 |
| ligne_228 | 4 |
| ligne_232 | 23 |

Attention : les deux graphies de la ligne 13 sont des groupes distincts dans la source. Ne pas les fusionner sans rapprochement documenté.

## Apports et anomalies à traiter séparément

- **Ligne 219** : la couche itinéraires porte le corridor « Daroukhane – marché Ndiarème » et détaille des secteurs jusqu'à « Terminus Ouakam ». La page officielle DDD publie le terminus Ouakam et 19 repères. La géométrie/couche d'arrêts de ce service ne fournit toutefois pas de groupe d'arrêts explicitement codé 219. Ne pas transformer les tronçons textuels en arrêts ni réaffecter des points d'une autre ligne.
- **Lignes 217 et 218** : les métadonnées de corridor de la couche itinéraires sont plus riches que les groupes d'arrêts et restent à rapprocher des séquences officielles. La page réseau DDD publie actuellement les mêmes 15 repères sous les deux en-têtes ; cette incohérence éditoriale reste ouverte. L'audit des noms donne 0 correspondance ordonnée stricte pour le groupe 217 et 5 pour 218 ; cela ne prouve pas l'absence d'arrêts.
- **Ligne 227** : 8 arrêts codés dans la couche ; 1 correspondance stricte de nom dans le rapprochement de séquence. À compléter, sans extrapolation.
- **Ligne 228** : 4 arrêts codés ; la couche itinéraires a un corridor Rufisque–Yenne mais aucun nom de ligne exploitable sur l'entité correspondante. À vérifier.
- **Ligne 232** : 23 arrêts codés ; 1 correspondance stricte de nom dans le rapprochement. La page officielle associe 232 à Baux Maraîchers–Aéroport LSS.
- **Ligne 6** : 60 arrêts codés, mais l'entité d'itinéraire correspondante ne porte pas de corridor textuel exploitable.
- **Lignes 502A/B, 503A/B, 504A/B** : elles figurent sur la page officielle « Info voyageurs » avec leurs terminus, mais ne sont pas identifiées comme telles dans les codes d'arrêts de cet inventaire. Les anciennes lignes circulaires 502/503 ne doivent pas être automatiquement éclatées en variantes A/B.

## Décision de traitement

1. Conserver les données ArcGIS comme preuves candidates séparées, avec attribution, identifiants source et géométries.
2. Rapprocher les points par proximité spatiale et noms, en conservant les ambiguïtés, doublons et codes originaux.
3. Ne pas déduire l'ordre aller/retour de l'ordre de réponse ArcGIS ou de la seule géométrie.
4. Ne pas créer de fréquence ou d'horaire à partir de ce service.
5. Ne pas publier un arrêt ou une direction tant que son rattachement à la ligne et son ordre ne sont pas validés par une source indépendante.

## Sources

- Service ArcGIS public DDD mis à jour : lien ci-dessus (couches 0 et 1).
- DDD, « Info voyageurs » : https://demdikk.sn/info-voyageurs/
- DDD, « Réseau urbain Dakar » : https://demdikk.sn/reseau-urbain-dakar/
- Résultat du rapprochement de noms produit dans l'audit du 14 novembre 2026 : 6 groupes comparés, 168 arrêts sources, 7 correspondances ordonnées strictes.
