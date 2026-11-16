# Audit de cohérence des corridors AFTU du calculateur

Date : 16 novembre 2026  
Branche : `docs/audit-aftu-corridor-coherence-2026-11-16`  
Périmètre : comparaison des corridors simplifiés de `src/domain/corridors.ts` avec les fiches détaillées officielles AFTU. Documentation uniquement ; aucun itinéraire actif n'est modifié.

## Résultat principal

Les fiches détaillées de l'opérateur permettent désormais de reconstituer des séquences de desserte pour les lignes 1, 42 et 53. Elles confirment des écarts importants avec les corridors simplifiés actuels.

### Ligne AFTU 1

- Séquence publiée : **Gare Lat Dior – rue Sandiniéry – rue de la Somme – rue de Reims prolongée – rue des Dardanelles – avenue Blaise Diagne – boulevard de la Gueule Tapée – rue 34 – rue 9 bis – rue 11 – rue 9 – rue Abebé Bikila (rue 11 prolongée) – Cheikh Sidaty Aidara (Niary Tally) – avenue Bourguiba – rond-point Jet d’Eau – giratoire Liberté VI – 2 voies de Liberté VI – VDN – route Corniche de HLM Grand Médine – Espace HLM Grand Médine (face autoroute)**.
- Corridor actuel : `aftu-3`, affiché « AFTU 1 », séquence simplifiée `Lat Dior → Petersen → Colobane → Parcelles → Diamalaye`.
- Écart : cette séquence simplifiée ne correspond pas à la fiche détaillée publiée et son terminus HLM Grand Médine manque.
- Décision : ne pas utiliser la séquence actuelle comme tracé fidèle de la ligne 1. Reconstituer les arrêts géolocalisés à partir des rues/repères publiés et vérifier le quai exact du terminus HLM Grand Médine.

### Ligne AFTU 42

- Séquence publiée : **Gadaye – Corniche Guédiawaye – Cité des Enseignants – croisement Béthio – route des Niayes – Case Ba – Police des Parcelles Assainies – route du stade LSS (Taliboubess) – VDN – ancienne piste d'envol – avenue Cheikh Anta Diop – route principale de Ouakam (marché) – Boutikou Diallo – terminus Ouakam Baye**.
- Corridor actuel : `aftu-1`, affiché « AFTU 42 », long nom « Gadaye ↔ Ouakam ».
- Écart : le terminus doit être précisé « Ouakam Baye » ; les arrêts intermédiaires du corridor simplifié ne sont pas la séquence officielle publiée.
- Décision : conserver la ligne 42, mais corriger son référentiel uniquement après géolocalisation des repères et validation du terminus.

### Ligne AFTU 53

- Séquence publiée : **Keur Massar (Marché) – terminus P11 – croisement Tivaouane Peulh – Safco – Niacourab – croisement Niagues – Ndiakhirate – Keur Ndiaye Lo – hôpital Youssou Mbargane – Dangou – Sonadis – Poste Courant – Sococim – Bargny – Diamniadio – terminus Sébikotane**.
- Corridor actuel : `aftu-2`, affiché « AFTU 53 », séquence simplifiée `Keur Massar → Pikine → Rufisque → Lat Dior`.
- Écart majeur : le terminus officiel Sébikotane est absent et Lat Dior est ajouté à la place ; le corridor actuel ne reflète pas la fiche officielle.
- Décision : ne pas utiliser le corridor actuel comme tracé fiable de la ligne 53. Reconstituer les arrêts géolocalisés sur l'axe Keur Massar–Sébikotane avant calcul d'itinéraire.

## Limite importante : sens retour

Les fiches AFTU consultées donnent une séquence de desserte, mais ne publient pas une liste distincte et complète du sens retour. Il ne faut donc pas supposer que le retour reprend exactement les mêmes rues dans l'ordre inverse : sens uniques, boucles et variantes peuvent exister. Le retour doit être vérifié séparément avant activation dans le calculateur.

## Règles de correction

1. Distinguer les repères officiels publiés des arrêts effectivement géolocalisés.
2. Ne pas convertir automatiquement chaque nom de quartier ou de rue en arrêt.
3. Ne pas remplacer un terminus officiel par un quartier voisin.
4. Ne pas présenter les séquences simplifiées actuelles comme des tracés exacts lorsqu'elles contredisent les fiches de l'opérateur.
5. Conserver les anciens points cartographiques comme candidats jusqu'à attribution fiable à une ligne et à un sens.
6. Le nom public reste **AFTU** ; aucune marque TATA distincte ne doit apparaître dans l'interface.
7. Aucun changement ne doit être apporté aux tracés, arrêts, horaires ou fréquences TER/BRT.

## Étapes suivantes

1. Géolocaliser les repères des lignes 1, 42 et 53 sur une carte et contrôler leur ordre.
2. Rechercher des preuves distinctes pour les sens retour.
3. Comparer ces repères avec les arrêts DDD et les points OSM/ArcGIS, sans fusionner automatiquement les arrêts proches.
4. Ajouter des tests de cohérence entre numéro de ligne, terminus officiels et séquences géolocalisées.
5. N'activer les correspondances DDD/AFTU qu'après vérification des quais et du cheminement piéton.

## Sources officielles

- Catalogue des lignes AFTU : https://aftu-senegal.org/infos-pratiques/
- Fiche détaillée AFTU 1 : https://aftu-senegal.org/map/dakar-urbain-ligne-1/
- Fiche détaillée AFTU 42 : https://aftu-senegal.org/map/dakar-urbain-ligne-42/
- Fiche détaillée AFTU 53 : https://aftu-senegal.org/map/dakar-urbain-ligne-53/

## Périmètre de cet ajout

- Documentation seulement ; aucun code ni donnée active modifiés.
- Aucun transfert supplémentaire activé.
- Aucun changement TER/BRT.
- GTFS n'est pas un prérequis.
