# DDD — plan de rapprochement prioritaire des lignes 8, 13 et 18

Date : 13 novembre 2026.

## Objet

Consolider les constats déjà établis sur les lignes 8, 13 et 18 afin de définir les prochaines vérifications reproductibles. Ce document ne valide aucune séquence d'exploitation et ne crée aucun arrêt, sens, horaire ou fréquence.

Sources internes :
- `docs/ddd-lines-13-18-arcgis-stop-layer-review-2026-11-13.md`
- `docs/ddd-lines-8-18-osm-way-geometry-review-2026-11-13.md`
- `docs/ddd-lines-8-18-osm-stop-node-candidates-2026-11-13.md`
- `docs/ddd-osm-arcgis-consolidation-2026-11-13.md`
- Séquences publiées dans `src/data/dddOfficialUrbanPublishedRoutes.ts`

Sources opérateur :
- https://demdikk.sn/reseau-urbain-dakar/
- https://demdikk.sn/info-voyageurs/

## Ligne 8 — Aéroport LSS ↔ Palais 2

### Éléments concordants
- La page DDD publie 28 arrêts nommés entre Aéroport LSS et Palais 2.
- La relation OSM 7495137 est explicitement référencée L8, opérateur Dakar Dem Dikk, et contient 80 voies ordonnées.
- La comparaison géométrique ArcGIS/OSM donne 41/49 points ArcGIS à 25 m ou moins de la géométrie OSM, 44/49 à 100 m ou moins, avec une médiane d'environ 7,6 m.
- 46 des 48 transitions successives entre points ArcGIS ont un indice de tronçon OSM non décroissant.

### Limites et décision
- La relation OSM ne contient aucun membre d'arrêt ordonné.
- Les 49 points ArcGIS ont des libellés vides ; cinq dépassent 100 m de la géométrie OSM, dont un à environ 611 m.
- Trois nœuds OSM portent explicitement une référence L8/8 ; deux sont des positions d'arrêt « Ligne 8 », pas des noms de stations voyageurs. « Arrêt Echangeur Foire » est un candidat d'arrêt, à conserver comme tel.
- Les autres arrêts proches sans référence de ligne restent des candidats partagés. Les objets explicitement référencés à une autre ligne sont exclus du rapprochement L8 automatique.

**Statut :** corridor fortement corroboré, séquence d'arrêts non établie. Ne pas convertir les 49 points ArcGIS en 28 arrêts officiels et ne pas déduire le retour.

**Prochaine vérification :** extraire les attributs complets et identifiants stables des 49 points ArcGIS, puis comparer individuellement leur position à la liste officielle des 28 noms. Chercher une seconde relation directionnelle ou une carte DDD explicite ; en son absence, conserver le sens manquant comme manquant.

## Ligne 13 — Liberté 5 ↔ Palais 2

### Éléments concordants
- La page DDD publie une séquence de 24 arrêts nommés, de Liberté 5 / Dieuppeul à Palais 2.
- La couche ArcGIS nommée contient 23 points et suit globalement le corridor annoncé : Cheikh Ahmadou Bamba, Général de Gaulle, Allées Papa Gueye Fall, Faidherbe, Hôpital Principal, Pasteur et Aristide Le Dantec.

### Limites et décision
- Le dernier point ArcGIS est « Terminus DDD Palais 1 », contrairement au terminus officiel publié « Palais 2 ».
- Une seconde couche ArcGIS contient 22 géométries sans nom qui dupliquent étroitement la couche nommée ; elle ne constitue pas une confirmation indépendante ni une seconde direction.
- L'écart de cardinalité (23 points ArcGIS contre 24 arrêts publiés) n'autorise ni ajout ni suppression d'arrêt.

**Statut :** corridor cartographique candidat ; conflit de terminus et différence de cardinalité non résolus. Conserver les deux jeux sans substitution.

**Prochaine vérification :** examiner les identifiants OBJECTID, coordonnées, dates de mise à jour et attributs des deux couches pour établir leur relation technique ; rechercher une source DDD explicite qui distingue Palais 1 et Palais 2. Ne pas assimiler ces terminus sur la seule base de leur proximité.

## Ligne 18 — boucle Dieuppeul / centre-ville

### Éléments concordants
- La page DDD publie 41 arrêts et décrit un parcours qui part de Liberté 5 / Dieuppeul et y revient.
- La couche ArcGIS contient 44 points, également de Liberté 5 à Liberté 5, avec une succession de secteurs cohérente avec une boucle.
- La relation OSM 7499475 contient 54 voies ordonnées. Sa proximité avec ArcGIS est bonne sur certains secteurs (médiane d'environ 7,4 m), mais elle ne couvre pas le centre-ville.
- 31/44 points ArcGIS sont à 25 m ou moins de la géométrie OSM ; 34/44 à 100 m ou moins.

### Limites et décision
- La relation OSM n'a aucun membre d'arrêt ordonné et ne constitue pas la boucle complète.
- Les points ArcGIS 18 à 24 (Port, Hôtel de Ville, Place de l'Indépendance, George Pompidou) sont à environ 1,47–1,94 km de la géométrie OSM.
- Les deux candidats OSM proches de la géométrie mais explicitement référencés L23 sont exclus de toute attribution à la ligne 18.
- La séquence publiée est circulaire, mais cela ne prouve pas deux variantes d'exploitation séparées ni un horaire aller/retour distinct.

**Statut :** boucle officielle publiée candidate, avec géométrie OSM fragmentaire. Ne pas compléter le segment centre-ville par une ligne droite, une inversion ou une autre ligne.

**Prochaine vérification :** rechercher des voies OSM alternatives dans le secteur Port–Hôtel de Ville–Place de l'Indépendance–Pompidou, en contrôlant leurs tags d'opérateur, de référence et leur continuité topologique. Conserver chaque fragment avec son identifiant et son statut, sans l'ajouter à la boucle avant corroboration.

## Ordre de travail recommandé

1. Terminer l'extraction OSM fraîche déjà lancée ; comparer son inventaire et ses membres à l'artefact précédent avant de réutiliser les relations.
2. Ligne 18 : rechercher en priorité le segment centre-ville manquant, sans réaffecter les arrêts L23.
3. Ligne 8 : établir l'inventaire des points ArcGIS et les correspondances candidates avec les 28 noms officiels.
4. Ligne 13 : documenter le conflit Palais 1 / Palais 2 et la différence 23 / 24.
5. Rejouer les tests et contrôles CI après ajout de ce rapport.

## Garde-fous

- Les pages DDD restent la référence des noms et ordres publiés ; ArcGIS et OSM sont des éléments de corroboration distincts.
- Une distance courte ne prouve pas l'identité d'un arrêt ni sa desserte.
- Les sens aller/retour restent séparés ; aucune inversion automatique.
- Aucun horaire ou fréquence n'est déduit des géométries.
- GTFS n'est pas un prérequis.
- Aucune écriture Supabase, aucun déploiement, aucune modification de production, aucune fusion de PR.
- Les données et affichages TER/BRT validés restent intouchables.
