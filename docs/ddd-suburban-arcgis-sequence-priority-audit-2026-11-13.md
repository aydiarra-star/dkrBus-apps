# Priorisation du rapprochement DDD suburbain / ArcGIS — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Sources : service ArcGIS public « Dem_dikk_mise_a_jour » et séquences publiées conservées dans `src/data/dddSuburbanPublishedRoutesB.ts`.

## Résultat du contrôle

Le service ArcGIS contient 777 entités d'arrêts, dont 775 avec géométrie, et 25 entités d'itinéraires, dont 24 avec géométrie. Le contrôle ciblé des six séquences suburbaines compare les noms normalisés et leur ordre apparent dans la réponse ArcGIS ; il ne suppose pas que l'ordre de réponse est l'ordre opérationnel.

| Ligne | Entités ArcGIS | Arrêts publiés | Correspondances ordonnées | Décision |
|---|---:|---:|---:|---|
| 217 | 30 | 15 | 0 | Conflit de terminus déjà documenté ; ne pas valider |
| 218 | 103 | 15 | 5 | Priorité haute pour audit géographique |
| 219 | 0 | 19 | 0 | Aucune entité d'arrêt retrouvée dans cette couche |
| 227 | 8 | 16 | 1 | Couverture partielle seulement |
| 228 | 4 | 4 | 0 | Noms différents ; vérifier les coordonnées |
| 232 | 23 | 15 | 1 | Couverture partielle et noms répétés |

Total : 168 entités ArcGIS nommées et 7 correspondances ordonnées sur les six comparaisons. Ces correspondances sont des diagnostics textuels, pas des validations de séquence.

## Ligne 218 — priorité géographique

La séquence publiée contient 15 arrêts. La couche ArcGIS contient 103 entités associées à `ligne_218`. Parmi les noms récurrents figurent notamment :
- VDN ;
- Ancienne Piste ;
- Avenue Cheikh Anta Diop ;
- Route de Ouakam ;
- Ouakam ;
- 2 voies Sacré-Cœur ;
- Route des Ndiayes ;
- Route Corniche Ouest ;
- Route de l'Aéroport.

Plusieurs noms apparaissent sur de nombreuses entités géographiquement distinctes. Cela peut représenter plusieurs positions ou points associés à un même corridor nommé ; cela ne prouve pas que ces 103 enregistrements sont 103 arrêts voyageurs distincts, ni qu'ils doivent être réduits à 15. Le contrôle textuel retrouve cinq correspondances dans l'ordre de réponse ArcGIS : VDN, Ancienne Piste, Ouakam, Marché Ouakam et le libellé de terminus Ouakam.

La séquence publiée continue ensuite vers « route des mamelles », « route des Almadies », « Ngor » et « Terminus aéroport LSS ». Il faut rapprocher ces noms de la géométrie de l'itinéraire et des entités d'arrêt avant toute décision. Ne pas supprimer les occurrences répétées et ne pas substituer automatiquement le terminus Aéroport LSS à la séquence publiée.

## Ligne 219 — lacune ArcGIS

La séquence publiée comporte 19 arrêts, de Daroukhane à Ouakam. Aucune entité d'arrêt `ligne_219` n'a été retournée par la couche d'arrêts contrôlée. L'itinéraire ligne 219 apparaît dans les données de couche d'itinéraires, mais cela ne remplace pas les points d'arrêt.

Décision : conserver la séquence publiée comme source distincte ; ne pas considérer l'absence de points ArcGIS comme une absence de ligne.

## Lignes 217, 227, 228 et 232

- **217** : la séquence publiée comporte une note de conflit entre le terminus Ouakam annoncé et la continuation jusqu'à Aéroport LSS. Aucun rapprochement de nom ordonné n'a été obtenu avec la couche ArcGIS contrôlée. Ne pas affecter les derniers arrêts sans validation.
- **227** : une seule correspondance de nom est obtenue sur 16 arrêts publiés. La présence de huit entités ArcGIS ne suffit pas à reconstruire la séquence.
- **228** : quatre entités ArcGIS existent, mais aucun nom normalisé ne correspond aux quatre arrêts publiés. Les terminus et les géométries doivent être rapprochés avant de conclure à une divergence réelle.
- **232** : une seule correspondance de nom ordonnée sur 15 arrêts publiés. Plusieurs noms ArcGIS sont répétés sur des positions distinctes. Les répétitions sont conservées et ne sont pas fusionnées.

## Suite technique prioritaire

1. Ligne 218 : calculer la distance de chaque entité d'arrêt à la géométrie de l'itinéraire 218 et grouper les noms répétés par proximité, tout en conservant les enregistrements sources.
2. Ligne 219 : vérifier les autres couches ArcGIS et les relations OSM, sans créer de points artificiels.
3. Lignes 217, 227, 228 et 232 : rapprocher les extrémités, les géométries et les noms sans traiter l'ordre de réponse comme un ordre d'exploitation.
4. Réconcilier ensuite les résultats avec les fiches DDD publiées, en gardant les variantes et les contradictions visibles.

## Garde-fous

Les géométries ArcGIS et les noms sont des preuves de rapprochement, pas une validation automatique du sens, de l'exploitation actuelle ou des horaires. Aucun arrêt n'est supprimé ou fusionné. Aucun sens retour n'est fabriqué. Aucune fréquence n'est déduite. Aucun GTFS utilisé. Aucune écriture Supabase, aucun déploiement, aucun changement des données TER/BRT ni de l'affichage passager.
