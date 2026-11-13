# Ligne DDD 1 — recontrôle sur l'extraction OSM rafraîchie

Date : 13 novembre 2026.

## Source utilisée

Nouvelle archive OSM `dakar-osm-route-candidates`, produite par le workflow `43442349218` (succès), branche `feat/admin-stop-sequence-audit-phase-a`, commit source `850a9616c0a16cb54795b603de82ac630a5e48a5`.

L'inventaire contient 6 610 éléments OSM, 25 relations de lignes, 2 relations maîtres, 18 relations avec arrêts ordonnés et 522 occurrences d'arrêts. Trois erreurs de requête Overpass ont été consignées avant la réussite finale du workflow ; elles sont conservées dans les métadonnées de l'archive.

## 1. Relation de la ligne 1

Relation OSM `6951328` :
- `ref=1`, opérateur et réseau Dakar Dem Dikk ;
- origine OSM : Parcelles assainies ;
- destination OSM : Terminus Leclerc ;
- 38 membres d'arrêt ordonnés, tous de rôle `platform` ;
- 14 membres portent un nom ; 24 sont sans nom ;
- aucune relation maître n'est référencée.

La séquence reste un candidat OSM dans un seul sens. L'absence de relation maître associée ne permet pas de confirmer une direction retour.

## 2. Concordance avec la séquence publiée DDD

La séquence DDD publiée comporte 22 arrêts, de Terminus Parcelles Assainies à Terminus Leclerc.

En comparant les 14 noms OSM aux noms publiés dans leur ordre, avec normalisation des accents, de la casse, de la ponctuation et du préfixe générique « Arrêt », cinq correspondances ordonnées ressortent :

| Ordre OSM | Libellé OSM | Libellé DDD correspondant |
|---:|---|---|
| 1 | Terminus Parcelles-Assainies | Terminus Parcelles Assainies |
| 9 | Arrêt Terrain-Acapes | Terrain Acapes |
| 23 | UCAD | Ucad |
| 28 | Marché Tilène | Marché Tilène |
| 37 | Place de l’Indépendance | Place de l’Indépendance |

Ces cinq correspondances renforcent l'identification du corridor, mais ne valident pas les 38 membres comme transcription des 22 arrêts DDD. Les autres noms OSM (PA U19, Arrêt Bus Aftu, Manguiers, Eglise Saint Joseph, Medina, deuxième Marché Tilène, Stade, Ville, Patisen) ne sont pas des correspondances nominales strictes avec la séquence publiée.

## 3. Contrôle de continuité géographique

La mesure à vol d'oiseau entre coordonnées successives des membres d'arrêt fait ressortir plusieurs sauts inhabituels pour une séquence d'arrêts consécutifs :

| Membres OSM | Distance approximative |
|---|---:|
| 8 → 9 | 507 m |
| 15 → 16 | 2 295 m |
| 16 → 17 | 513 m |
| 17 → 18 | 739 m |
| 18 → 19 | 753 m |
| 19 → 20 | 1 201 m |
| 21 → 22 | 502 m |
| 22 → 23 | 1 551 m |
| 30 → 31 | 572 m |
| 31 → 32 | 583 m |

Les sauts de 2 295 m, 1 551 m et 1 201 m méritent une revue géographique prioritaire. Une distance à vol d'oiseau n'établit pas à elle seule une erreur de tracé : elle signale un segment à examiner, sans proposer de nouvel arrêt ni de raccourci.

## 4. Décision

- Garder la relation 6951328 comme candidat OSM directionnel, non comme itinéraire officiel confirmé.
- Conserver les 38 membres dans leur ordre source et leurs identifiants OSM.
- Garder les 24 membres anonymes sans leur attribuer de nom par proximité seule.
- Traiter les cinq correspondances nominales comme points d'ancrage pour la revue ArcGIS.
- Examiner en priorité les grands sauts géographiques entre les membres 15–16, 22–23 et 19–20.
- Ne pas créer de retour par inversion, ni de fréquence, horaire ou temps de passage à partir de cette relation.
- Aucun import automatique dans les données voyageurs.

## Périmètre

Rapport d'audit en lecture seule. Pas de modification de la production, de Supabase, des données TER/BRT ni de déploiement. Aucun GTFS utilisé.


## Contrôle complémentaire sur la polyligne ArcGIS de la ligne 1

Sur la nouvelle extraction ArcGIS, la relation OSM 6951328 a été projetée sur la polyligne de l'itinéraire DDD ligne 1.

- 38/38 arrêts géolocalisés à moins de 25 m du tracé.
- Distance médiane au tracé : 5,9 m ; maximum : 12,5 m.
- Corrélation entre l'ordre des membres OSM et le chaînage du tracé : +0,9879.
- Le premier et le dernier arrêt OSM se projettent respectivement près du début et de la fin de la géométrie ArcGIS.

Ce contrôle confirme une très forte cohérence spatiale et directionnelle de la relation 6951328 avec le corridor ArcGIS de la ligne 1. Il complète les alertes de continuité entre coordonnées successives : les grands sauts à vol d'oiseau signalent des segments à examiner dans la séquence OSM, mais ne signifient pas que les points sont hors du corridor.

La relation ne documente toujours qu'un seul sens et ne possède pas de relation maître associée. **Le retour reste absent de la preuve disponible** : il ne doit pas être fabriqué par inversion. Les 24 membres anonymes restent anonymes et les 38 membres ne sont pas automatiquement assimilés aux 22 repères voyageurs publiés.
