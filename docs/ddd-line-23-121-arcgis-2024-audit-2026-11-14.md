# DDD — audit complémentaire des lignes 23 et 121 dans ArcGIS 2024

Date : 14 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Source : service public ArcGIS `Dem_dikk_mise_a_jour`, édition annoncée au 24 septembre 2024  
Artefact source : `14100520531` — extraction et rapprochement en lecture seule

## Ligne 23 — conflit de terminus confirmé, séquence non corrigée

### Page DDD publiée

La fiche détaillée conserve :
- en-tête : Parcelles Assainies → Palais 1 ;
- liste : 40 repères ;
- dernier repère de la liste : « Terminus Palais 2 ».

Il existe donc un conflit interne à la publication : le terminus annoncé dans l'en-tête n'est pas celui de la dernière occurrence de la liste.

### Couche des arrêts ArcGIS

- Champ de ligne : `Nom_Ligne = LIgne_23`.
- 54 entités, toutes nommées et géométrisées.
- Première occurrence : « Terminus Parcelles Assainies ».
- Dernière occurrence dans l'ordre de réponse : « Terminus Palais de JUSTICE ».
- Les noms communs avec les 40 repères publiés sont ACAPES, UCAD, Avenue Cheikh Anta Diop et Hôpital Principal.
- Le rapprochement de sous-séquence sur l'ordre de réponse ArcGIS ne donne que 3 correspondances : ACAPES, UCAD et Hôpital Principal. Avenue Cheikh Anta Diop est commune, mais n'entre pas dans cette sous-séquence ordonnée.

Les répétitions ArcGIS restent des enregistrements séparés : « Arret PA » (2), « Arret Rue Mame Abdou Aziz SY » (2), « Arret Route des Ndiayes » (8), « Arret du Roi Fahd ben Abdel Aziz » (2), « Arret Avenue du président Bourguiba » (13), « Arret Boulevard Gueule Tapée » (2), « Arret Boulevard du Docteur Samba Gueye » (4) et « Arret Avenue Jean Jaurès » (2). Aucun doublon n'est supprimé.

### Couche de l'itinéraire ArcGIS

Une entité explicitement nommée « Ligne 23 » décrit notamment :
- « Terminus des Parcelles – Ecole Dior » ;
- « Cités Diamalaye – Hlm Grand Médine » ;
- les corridors du Front de Terre, de l'avenue Bourguiba et de l'avenue Cheikh Anta Diop ;
- « Hôpital Principal – Avenue Nelson Mandela – Hôpital Le Dantec – Palais de Justice ».

Cette géométrie soutient l'existence d'un corridor Ligne 23 jusqu'au secteur du Palais de Justice. Elle ne permet pas d'assimiler automatiquement Palais 1, Palais 2 et Palais de Justice, ni de valider la liste des 40 repères comme parcours voyageurs actuel.

### Décision ligne 23

- Conserver l'en-tête DDD « Palais 1 » et le dernier repère « Palais 2 » comme deux champs contradictoires.
- Conserver les 54 points ArcGIS et la géométrie ArcGIS dans leurs propres registres.
- Ne pas fusionner les 54 points et les 40 repères.
- Ne pas renommer le terminus en Palais de Justice, Palais 1 ou Palais 2.
- Ne pas déduire un sens retour de la géométrie ou de l'ordre de réponse ArcGIS.

## Ligne 121 — origine Scat Urbam corroborée dans le service 2024

### Sources DDD et guide CETUD

Les deux pages DDD consultées affichent Scat Urbam → Leclerc. Le guide CETUD des JOJ 2026 mentionne HLM Grand Yoff → Leclerc. Ces déclarations sont conservées séparément ; le guide des JOJ décrit un dispositif opérationnel daté et ne remplace pas automatiquement la fiche permanente.

### Couche des arrêts ArcGIS

- Champ de ligne : `Nom_Ligne = LIgne_121`.
- 31 entités, toutes nommées et géométrisées.
- La couche contient quatre occurrences nommées « Arret Scat Urbam » ainsi qu'un terminus « Scat Urban ».
- Cinq correspondances ordonnées avec la liste DDD : Scat Urbam, Allées Papa Guèye Fall, Avenue Faidherbe, Place de l’Indépendance et Leclerc.
- Les répétitions restent des entités indépendantes, avec leurs identifiants source propres.

### Couche de l'itinéraire ArcGIS

Une entité « Ligne 121 » décrit le corridor :
- « Terminus Scat Urban – Mairie grand Yoff » ;
- « Cité CSE – Les deux voies de Sipres » ;
- « Les deux voies de Liberté 6 – Collège Sacré Cœur » ;
- « Sicap rue 10 – Lycée Blaise Diagne » ;
- « Place ONU – Canal 4 » ;
- « HLM Fass – Travaux communaux » ;
- « rue 22 prolongée – RTS » ;
- « Allées Papa Guèye Fall – Avenue Faidherbe » ;
- « Place de l’indépendance – Albert Sarraut – Terminus Leclerc ».

### Décision ligne 121

La page DDD et le service ArcGIS 2024 corroborent le corridor Scat Urbam/Scat Urban → Leclerc, avec Mairie Grand Yoff comme repère de passage dans les attributs du tracé. Le guide JOJ indique un autre point de départ, HLM Grand Yoff. Ces deux noms ne sont pas assimilés.

Les cinq correspondances ordonnées sont un rapprochement de noms et de l'ordre de réponse des entités, pas une preuve que cet ordre correspond à l'ordre réel des arrêts. Les quatre occurrences Scat Urbam et les autres répétitions restent distinctes.

## Portée et limites

Le service ArcGIS est une source cartographique distincte des pages DDD, mais son édition indiquée date du 24 septembre 2024. Il peut conforter un corridor historique et aider à prioriser les vérifications ; il ne certifie pas l'exploitation actuelle, les deux sens, l'exhaustivité des arrêts ou les horaires.

- Aucun arrêt n'est ajouté, supprimé, fusionné ou réattribué.
- Aucun retour n'est fabriqué par inversion.
- Aucun horaire ou intervalle n'est inféré.
- Aucun changement du catalogue passager n'est effectué.
- Aucune écriture Supabase, fusion ou publication n'est effectuée.
- Les données TER/BRT restent strictement inchangées.
- GTFS reste hors périmètre bloquant.
