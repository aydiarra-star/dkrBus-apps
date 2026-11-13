# Revue ArcGIS DDD — lignes 8 et 18 après extraction rafraîchie

Date : 13 novembre 2026.

## Source et couverture de l'extraction

Archive : `ddd-arcgis-route-stop-candidates`, workflow GitHub Actions `43445237186`, commit audité `0d21b39892e5e2b3cd4313e73bb76cf8a0551462`.

Le contrôle de l'extraction indique :
- 24 couches d'itinéraires attendues et 24 récupérées ;
- 12 couches d'arrêts attendues et 12 récupérées ;
- 25 entités d'itinéraire et 455 points d'arrêt ;
- aucune couche avec limite de transfert dépassée ;
- aucune erreur d'extraction.

Les géométries ArcGIS constituent des éléments de comparaison géographique. Elles ne prouvent pas à elles seules l'ordre des arrêts, les deux sens exploités ou les horaires.

## Ligne 8 — géométrie exploitable, identifiants d'arrêts insuffisants

Couche d'itinéraire `Itinéraire_ligne_8_Dem_Dikk` :
- une entité renseignée, identifiée « Ligne 8 » ;
- corridor décrit dans les attributs : Terminus Aéroport – Cité Asecna, avec plusieurs repères intermédiaires ;
- une géométrie continue de 232 sommets ;
- longueur géométrique déclarée : environ 21,16 km.

La même couche contient une seconde entité entièrement vide (nom, itinéraire, type et longueur nuls ou blancs, sans géométrie). Elle doit être ignorée comme enregistrement vide, sans être interprétée comme une variante ou un deuxième sens.

Couche de points `Arret_ligne_8_Dem_Dikk` :
- 49 points géolocalisés ;
- attribut `Id=0` sur les 49 enregistrements ;
- aucun champ de nom d'arrêt disponible dans cette couche ;
- les GlobalID restent distincts, mais ne remplacent pas un identifiant métier ni un libellé.

**Décision :** la ligne 8 dispose d'un corridor ArcGIS utile et de 49 points candidats, mais cette couche ne permet pas de reconstruire une liste d'arrêts nommés ni de séparer Aller et Retour. Garder les points comme candidats géographiques, sans leur inventer de noms, d'ordre, de direction ou de correspondance avec la fiche DDD.

## Ligne 18 — corridor riche, mais libellés répétés et ordre à confirmer

Couche d'itinéraire `Itinéraire_ligne_18_Dakar_Dem_Dikk` :
- une entité renseignée, identifiée « Ligne 18 » ;
- longueur déclarée : environ 18,59 km ;
- une géométrie de 247 sommets ;
- attributs décrivant plusieurs repères de corridor, notamment Dieuppeul / Cité Derklé, Khar Yalla / Cité Marine, Port de Dakar, Place de l'Indépendance, Gueule Tapée, UCAD, Bourguiba et le retour vers Dieuppeul.

Couche de points `Arrets_LIgne_18_Dakar_Dem_Dikk` :
- 44 points géolocalisés ;
- libellé de terminus « Terminus liberté 5 » présent au début et à la fin des enregistrements ;
- 10 points portent le même libellé « Avenue Cheikh Ahmadou Bamba Mbacké » ;
- 6 points portent « Avenue Bourguiba » ;
- 3 points portent « Boulevard du Docteur Samba Gueye » ;
- plusieurs autres libellés sont également répétés ;
- un point a un libellé vide.

Ces répétitions ne doivent pas être supprimées automatiquement : des points différents peuvent se trouver sur une même avenue. Inversement, leur présence ne suffit pas à prouver qu'il s'agit de 10 arrêts voyageurs distincts. Le champ `OBJECTID` et l'ordre de retour de la couche ne sont pas considérés comme une séquence opérationnelle validée sans métadonnée explicite de séquencement.

**Décision :** la géométrie confirme un corridor ArcGIS riche pour la ligne 18 et les points offrent des candidats à rapprocher de la liste publiée DDD. Conserver les 44 enregistrements, leurs GlobalID et leurs coordonnées ; contrôler les doublons spatiaux et les libellés répétés avant toute association aux arrêts voyageurs. Ne pas fabriquer un retour par inversion ni convertir automatiquement les 44 points en séquence validée.

## Suites techniques

1. Apparier les points ligne 18 à la séquence DDD publiée en utilisant nom normalisé, distance géographique et cohérence du corridor, en gardant chaque preuve séparée.
2. Examiner les 49 points anonymes de la ligne 8 par rapprochement géographique avec la géométrie et les sources officielles, sans attribuer de nom par simple proximité.
3. Ajouter une séquence Aller/Retour uniquement si une source distincte permet de l'établir.
4. Maintenir ces résultats dans le registre d'audit, sans import automatique dans le catalogue passager.

## Garde-fous

Aucune écriture Supabase, aucun déploiement, aucune modification de la production et aucun changement des données TER/BRT. Aucun GTFS utilisé. Cette revue ne valide ni fréquence ni horaire.
