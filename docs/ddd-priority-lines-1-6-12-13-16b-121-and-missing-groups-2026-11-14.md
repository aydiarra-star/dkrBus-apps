# DDD — consolidation prioritaire des lignes 1, 6, 12, 13, 16B et 121

Date : 14 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Artefact ArcGIS actualisé : workflow `43562090702`, artefact `14100866920`  
Comparaison des séquences publiées : artefact `14100520531`  
Service : `Dem_dikk_mise_a_jour`, édition source indiquée au 24 septembre 2024

## 1. Résumé

Les six lignes prioritaires ont toutes un groupe de points ArcGIS et une géométrie de ligne identifiée dans ce service. Le rapprochement de noms et l'ordre de réponse ArcGIS produisent les correspondances suivantes :

| Ligne | Parcours publié | Points ArcGIS | Repères publiés | Correspondances ordonnées | Géométrie de ligne |
|---|---|---:|---:|---:|---|
| 1 | Parcelles Assainies → Place Leclerc | 44 | 22 | 5 | OBJECTID 25 |
| 6 | Cambérène 2 → Palais 2 | 60 | 24 | 5 | OBJECTID 17 |
| 12 | Guédiawaye → Palais 1 | 40 | 20 | 4 | OBJECTID 2 |
| 13 | Liberté 5 → Palais 2 | 45, en deux groupes distincts | 24 | 4 au total dans le rapprochement agrégé ; voir revue séparée ci-dessous | OBJECTID 22 |
| 16B | Malika → Palais 1 | 30 | 27 | 5 | OBJECTID 4 |
| 121 | Scat Urbam → Leclerc | 31 | 25 | 5 | OBJECTID 23 |

Les six géométries et les groupes de points correspondants sont présents dans le même service ArcGIS. Les points sont pratiquement superposés à leurs polylignes (écarts calculés inférieurs au millimètre) et l'ordre de réponse des points suit le chaînage des polylignes. Cette concordance constitue une cohérence interne du service, pas une validation indépendante : points et lignes proviennent de la même source cartographique, dont la dernière édition annoncée remonte à 2024.

**Aucune de ces six lignes n'est pour autant validée dans les deux sens.** La séquence DDD publiée est conservée comme un seul ordre de repères. Aucun retour n'est fabriqué par inversion et aucune séquence ArcGIS n'est publiée comme séquence voyageurs.

## 2. Correspondances détaillées avec les séquences DDD publiées

Les positions ci-dessous sont les indices de réponse ArcGIS et les indices de repères de la page DDD ; ils ne sont pas des numéros d'arrêt opérationnels.

### Ligne 1 — Parcelles Assainies → Place Leclerc

5 correspondances ordonnées sur 22 repères publiés et 44 points ArcGIS :

| ArcGIS | Repère publié |
|---|---|
| #1 Terminus Parcelles Assainies | #1 Terminus Parcelles Assainies |
| #9 Terrain Acapes | #5 Terrain Acapes |
| #30 UCAD | #12 UCAD |
| #35 Marché Tilène | #14 Marché Tilène |
| #42 Place de l'Indépendance | #19 Place de l'Indépendance |

Les noms répétés (par exemple Rue PA-11-14, U.25, VDN, UCAD, Avenue Cheikh Anta Diop, Avenue Blaise Diagne) restent des occurrences séparées. La présence de deux occurrences UCAD côté ArcGIS pour un seul repère publié interdit toute déduplication automatique.

### Ligne 6 — Cambérène 2 → Palais 2

5 correspondances ordonnées sur 24 repères publiés et 60 points ArcGIS :

| ArcGIS | Repère publié |
|---|---|
| #2 Cambérène 2 | #1 Terminus Cambérène 2 |
| #33 Liberté 5 | #10 Terminus Liberté 5 |
| #51 Allées Papa Guèye Fall | #17 Allées Papa Guèye Fall |
| #52 Avenue Faidherbe | #18 Avenue Faidherbe |
| #54 Avenue Jean Jaurès | #21 Avenue Jean Jaurès |

Le service contient 60 points codés `ligne_6`, mais son entité d'itinéraire n'a pas de corridor textuel renseigné dans le champ principal. La géométrie existe néanmoins (OBJECTID 17). Les correspondances de noms ne suffisent pas à valider les 60 points ni leur exhaustivité.

### Ligne 12 — Guédiawaye → Palais 1

4 correspondances ordonnées sur 20 repères publiés et 40 points ArcGIS :

| ArcGIS | Repère publié |
|---|---|
| #11 Avenue Bourguiba | #11 Avenue Bourguiba |
| #32 Avenue Blaise Diagne | #15 Avenue Blaise Diagne |
| #33 Avenue Jean Jaurès | #16 Avenue Jean Jaurès |
| #40 Terminus Palais 1 | #20 Palais 1 |

Le nom « Avenue Bourguiba » apparaît 12 fois dans le groupe ArcGIS ; une seule occurrence est appariée au repère publié. Les répétitions restent distinctes et non dédupliquées.

### Ligne 13 — Liberté 5 → Palais 2 : deux groupes à ne pas fusionner

Le champ source contient deux valeurs distinctes : `LIgne_13` (22 points, OBJECTID 128–149) et `ligne_13` (23 points, OBJECTID 430–452). Elles ne sont pas une seule séquence homogène.

- Le groupe `LIgne_13` donne 2 correspondances ordonnées avec la séquence publiée : Avenue Cheikh Ahmadou Bamba (#2) et Avenue Faidherbe (#16).
- Le groupe `ligne_13` donne 4 correspondances ordonnées : Avenue Cheikh Ahmadou Bamba (#2), Allées Papa Guèye Fall (#14), Avenue Faidherbe (#16) et Hôpital Principal (#21).
- Les 22 points du premier groupe ont chacun un voisin dans le second à 3 m ou moins : 12 paires à 1 m ou moins, distance médiane 0,90 m, maximum 2,90 m. Il s'agit de rapprochements géographiques entre deux groupes, pas d'une autorisation de fusion : les GlobalID et OBJECTID restent distincts.
- Le second groupe comporte un point supplémentaire « Terminus DDD Palais 1 ». Le premier termine sur « Terminus DDD Palais ». Or la séquence DDD publiée et le corridor de la géométrie ArcGIS indiquent Palais 2.

Le rapprochement global agrégé de 45 points ne doit donc pas être interprété comme une seule séquence validée : les deux groupes ont des correspondances différentes et un conflit de terminus. Conserver les deux groupes, leur casse source et leurs identifiants. Demander une clarification DDD sur l'extrémité avant toute attribution métier.

### Ligne 16B — Malika → Palais 1

5 correspondances ordonnées sur 27 repères publiés et 30 points ArcGIS :

| ArcGIS | Repère publié |
|---|---|
| #1 Terminus Malika | #1 Terminus Malika |
| #24 Avenue Jean Jaurès | #21 Avenue Jean Jaurès |
| #27 Hôpital Principal | #24 Hôpital Principal |
| #29 Hôpital Le Dantec | #26 Hôpital Le Dantec |
| #30 Palais 1 | #27 Palais 1 |

La couche contient des noms répétés sur Malika, Route de Rufisque, Route des Grands Moulins et Avenue Félix Éboué. Ils restent des occurrences séparées.

### Ligne 121 — Scat Urbam → Leclerc

5 correspondances ordonnées sur 25 repères publiés et 31 points ArcGIS :

| ArcGIS | Repère publié |
|---|---|
| #2 Scat Urbam | #1 Terminus Scat Urbam |
| #25 Allées Papa Guèye Fall | #19 Allées Papa Guèye Fall |
| #26 Avenue Faidherbe | #21 Avenue Faidherbe |
| #30 Place de l'Indépendance | #22 Place de l'Indépendance |
| #31 Terminus Leclerc | #25 Terminus Leclerc |

Les répétitions Scat Urbam, 2 voies Liberté 6, Liberté 5, Boulevard Dial Diop, Rue FA-22 et Rue du Champ de Course sont conservées comme enregistrements distincts.

## 3. Cohérence géométrique interne du service

Projection des points sur la polyligne correspondante dans le système métrique de la source. L'ordre de réponse est comparé au chaînage de la géométrie ; la corrélation de rang vaut 1,000 pour chacun des groupes pris séparément.

| Groupe source | Points | Points à ≤25 m | Médiane de distance | Maximum | Corrélation ordre / chaînage |
|---|---:|---:|---:|---:|---:|
| `LIgne_1` | 44 | 44 | <0,001 m | <0,001 m | 1,000 |
| `ligne_6` | 60 | 60 | <0,001 m | <0,001 m | 1,000 |
| `Ligne_12` | 40 | 40 | <0,001 m | <0,001 m | 1,000 |
| `LIgne_13` | 22 | 22 | <0,001 m | <0,001 m | 1,000 |
| `ligne_13` | 23 | 23 | <0,001 m | <0,001 m | 1,000 |
| `ligne_16B` | 30 | 30 | <0,001 m | <0,001 m | 1,000 |
| `LIgne_121` | 31 | 31 | <0,001 m | <0,001 m | 1,000 |

Ces distances presque nulles montrent que les points et les polylignes sont géométriquement cohérents dans ce service. Elles ne sont pas une preuve externe de la position réelle des arrêts, puisque les deux couches appartiennent à la même source et peuvent avoir été construites ensemble. La corrélation de chaînage décrit l'ordre cartographique source, pas le sens commercial aller ou retour.

## 4. Séquences publiées sans groupe de points ArcGIS

Le rapprochement global recense 17 séquences publiées sans groupe d'arrêts portant leur référence dans la couche de points de ce service. Une absence de groupe signifie uniquement qu'aucun code correspondant n'a été trouvé dans cette couche.

| Ligne | Couverture repérée dans le service | Décision |
|---|---|---|
| 20 | Une polyligne anonyme, OBJECTID 20, corridor « Terminus Dieuppeul – Allées Ababacar Sy » | Candidat de corridor compatible avec la fiche circuit 20 ; identité non attribuée car `Nom_Ligne` est vide |
| 219 | Polyligne nommée Ligne 219, OBJECTID 8, corridor Daroukhane – marché Ndiarème ; aucun point codé 219 | Géométrie de corridor présente ; garder les 33 points codés 218 et spatialement associés comme candidat 219 distinct, sans réécriture |
| 15 | Polyligne anonyme, OBJECTID 10, corridor « Terminus Rufisque – ville de Rufisque » | Candidat non attribué ; ne pas choisir entre les lignes possibles à partir du seul terminus |
| 208, 213, 220, 221, 233, 234, 311, 327, 319, TO1, 501, 502, 503, TAF_TAF | Aucun groupe de points ni polyligne identifiée sans ambiguïté par référence dans cet inventaire | Conserver les séquences publiées ; rechercher une autre source géographique indépendante, sans extrapoler |

La couche des itinéraires comporte 25 entités : 24 géométries et 22 noms de ligne renseignés. Les deux corridors anonymes mentionnés ci-dessus restent anonymes dans la source. Une ressemblance de terminus ou de corridor n'autorise pas à leur attribuer un numéro de ligne.

## 5. Suite de consolidation

Priorités suivantes :

1. Faire confirmer par DDD la distinction des deux groupes ligne 13 et le terminus Palais / Palais 1 / Palais 2.
2. Pour la ligne 6, rapprocher les 60 points et les repères publiés un par un, en gardant les répétitions et sans transformer le chaînage en sens commercial.
3. Poursuivre la recherche de géométries indépendantes pour 208, 213, 220, 221, 233, 234, 311, 327, 319, TO1, 501, 502, 503 et TAF TAF.
4. Garder les géométries anonymes des lignes 15 et 20 en candidats non attribués jusqu'à corroboration.
5. Pour chaque ligne, maintenir séparément la séquence publiée, les points ArcGIS, la géométrie, l'aller et le retour. Aucun retour ne doit être généré par inversion.

## Garde-fous

- Aucun point n'est ajouté, supprimé, fusionné ou réattribué.
- Les deux groupes de ligne 13 et leurs identifiants sont conservés.
- Aucun retour, horaire, intervalle ou fréquence n'est inventé.
- Aucune écriture Supabase, aucune modification du catalogue passager, aucun déploiement.
- Les données et horaires TER/BRT restent strictement inchangés.
- GTFS n'est pas requis et ne bloque pas cette consolidation.
