# Audit de la sémantique des couches ArcGIS DDD — lignes 8 et 18 — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Source : anciennes couches publiques ArcGIS DDD extraites en lecture seule.

## Pourquoi ce contrôle est important

Certaines couches portent un nom commençant par `Arret_`, mais leur contenu ne correspond pas nécessairement à une liste d'arrêts voyageurs distincts. Avant de les utiliser pour remplir les séquences passager, il faut vérifier les champs et la distribution géographique.

## Ligne 8 : 49 points sans nom

La couche `Arret_ligne_8_Dem_Dikk` contient 49 géométries ponctuelles. Ses seuls champs attributaires sont :
- OBJECTID ;
- Id ;
- GlobalID.

Aucun champ de nom d'arrêt, de ligne ou de direction n'est disponible dans cette couche. La séquence DDD publiée de la ligne 8 comporte 28 repères, tandis que la relation OSM 7495137 ne fournit aucun membre d'arrêt ordonné.

Décision : les 49 points sont conservés comme indices géographiques à rapprocher de la géométrie de la ligne 8. Ils ne sont pas renommés ni convertis en 49 arrêts voyageurs. Les 28 repères publiés ne sont pas remplacés par des points anonymes.

## Ligne 18 : 44 points et des libellés de corridor répétés

La couche `Arrets_LIgne_18_Dakar_Dem_Dikk` contient 44 points :
- 43 ont un texte dans `Nom_Arret` ;
- 21 libellés distincts ;
- 10 occurrences de « Arret Avenue Cheikh Ahmadou Bamba Mbacké » ;
- 6 occurrences de « Arret Avenue Bourguiba » ;
- 3 occurrences de « Arret Boulevard du Docteur Samba Gueye ».

Les répétitions sont géographiquement éloignées. Par exemple, les dix points portant le libellé « Avenue Cheikh Ahmadou Bamba Mbacké » s'étendent sur environ 2,85 km entre le premier et le dernier point. Les six points « Avenue Bourguiba » s'étendent sur environ 1,69 km.

Ces distances montrent que le même texte est utilisé sur plusieurs positions du corridor. Il serait donc dangereux de fusionner ces points sur le seul nom, ou de considérer chaque point comme un arrêt physique validé. La séquence publiée de la ligne 18 est un circuit de 42 repères, et non une simple liste de 44 points ArcGIS.

La relation OSM 7499475 portant la référence 18 ne fournit aucun membre d'arrêt ordonné et ses terminus sont génériques (« Terminus 1 » / « Terminus 2 »). Elle ne résout pas cette ambiguïté.

Décision : conserver les 44 entités et leurs géométries comme couche de corroboration du corridor ; ne pas les transformer automatiquement en arrêts voyageurs et ne pas fusionner les libellés répétés.

## Conséquence pour l'import

Les couches ArcGIS doivent être classées selon leur contenu réel, pas seulement leur nom de couche :
- points sans nom : géométrie candidate uniquement ;
- points avec libellés de route répétés : repères de corridor possibles, pas nécessairement arrêts physiques ;
- arrêts avec nom, coordonnées et corroboration opérateur : candidats à validation individuelle ;
- séquences publiées DDD : restent la référence textuelle indépendante.

## Garde-fous

Aucun point n'est supprimé ou fusionné. Aucun nom n'est inventé. Aucun sens retour n'est fabriqué. Aucune fréquence ou heure n'est déduite. Aucun GTFS utilisé. Aucune écriture Supabase, aucun déploiement et aucune modification TER/BRT ou de l'affichage passager.
