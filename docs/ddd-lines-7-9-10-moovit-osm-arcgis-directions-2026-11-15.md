# DDD — rapprochement directionnel OSM / ArcGIS / Moovit (lignes 7, 9, 10)

Date : 15 novembre 2026  
Périmètre : lignes DDD 7, 9 et 10. Audit de séquences directionnelles, sans modification des parcours passagers.

## Résultat opérationnel

Le recoupement des pages Moovit consultées en novembre 2026 apporte une preuve directionnelle supplémentaire pour les trois lignes : Moovit publie bien deux séquences distinctes et ordonnées par ligne. Les extrémités et les points d'ancrage permettent de les rapprocher des relations OSM opposées. Toutefois, les noms « Gare Palais », « Palais 1 » et « Palais 2 » ne sont pas interchangeables et les séquences Moovit contiennent plusieurs arrêts génériques ou adresses sans nom de station.

**Décision :** les deux sens peuvent être conservés comme candidats directionnels distincts ; aucune séquence Moovit ne remplace la liste DDD publiée, et aucun arrêt générique n'est promu automatiquement dans l'application.

## Ligne 7 — Ouakam / Palais

### Référence officielle DDD
DDD publie 21 repères dans le sens Terminus Ouakam → Terminus Palais 2.

### Moovit — deux séquences directionnelles
- Page « Ouakam » : 29 arrêts, de **Gare Palais** à **Rue Okm 60, 67**.
- Page « Palais » : 27 arrêts, de **Rue Okm 60, 67** à **Gare Palais**.

Les points d'ancrage intermédiaires de la séquence Palais comprennent Rue Okm 237, École des Officiers, Rue Okm 195, Avenue Cheikh Anta Diop, Quartier Geille, International School, Hôpital Fann, Rue David Diop, Corniche Ouest, Cimetiére, Maison d'Arrêt, Avenue Roosevelt, Avenue Jean Jaurès et Avenue Pasteur.

### OSM / ArcGIS
- OSM 7500475 : 34 membres ordonnés, sens annoncé Ouakam → Palais 1 ; 27/34 à 15 m ou moins des points ArcGIS, 30/34 à 50 m ou moins, ordre OBJECTID non décroissant sur 33/33 transitions.
- OSM 6990669 : 31 membres, sens opposé ; seulement 2/31 à 15 m ou moins et ordre OBJECTID non décroissant sur 4/30 transitions.
- La couche ArcGIS historique corroborée principalement le sens Ouakam → Palais 1 ; elle ne valide pas le retour.
- Le sens Moovit Rue Okm 60,67 → Gare Palais est directionnellement cohérent avec OSM 7500475 et le corridor ArcGIS. Le sens Gare Palais → Rue Okm 60,67 correspond au retour Moovit et au candidat OSM opposé, mais ce dernier reste spatialement faible.

**Décision ligne 7 :** forte preuve convergente du sens Ouakam vers le centre ; le retour est attesté comme séquence Moovit distincte, mais ne dispose pas d'une corroboration ArcGIS équivalente. Le conflit terminal Palais 1 / Palais 2 / Gare Palais reste ouvert.

Sources Moovit :
- https://moovitapp.com/index/fr/transport_en_commun-line-7-Dakar-5996-1618037-18051422-0
- https://moovitapp.com/index/fr/transport_en_commun-line-7-Dakar-5996-1618037-18051422-1

## Ligne 9 — Liberté 6 / Palais

### Référence officielle DDD
DDD publie 24 repères de Terminus Liberté 6 à Terminus Palais 2.

### Moovit — deux séquences directionnelles
- Page « Liberté 6 » : 39 arrêts, de **Gare Palais** à **Ciudad De Los Deporte**.
- Page « Palais » : 38 arrêts, de **Ciudad De Los Deporte** à **Gare Palais**.

Repères identifiables de la séquence « Palais » : Ciudad De Los Deporte, Rue Lib 139, École Liberté, plusieurs arrêts génériques, Rue Lib 160, Cour Privée, Rue Lib 287, Rue Lib 311, Rue Nair, Rue Nient, Rue Pe 20, rues 99/110/44/23, Rue 1, Rue Ziguinchor, Avenue Cheikh Anta Diop, Université Cheikh Anta Diop, Boulevard de la Tapée, Rue FN 48, Cimetiére, Maison d'Arrêt, Avenue Roosevelt, Avenue Jean Jaurès, Avenue Pasteur et Gare Palais.

### OSM / ArcGIS
- OSM 7487218 : 29 membres ordonnés, sens Liberté 6 → Palais 1 ; 27/29 à 15 m ou moins, 27/29 à 50 m ou moins, ordre OBJECTID non décroissant sur 28/28 transitions.
- OSM 6996431 : 32 membres, sens Palais 1 → Liberté 6 ; 6/32 à 15 m ou moins, ordre OBJECTID non décroissant sur 2/31 transitions.
- ArcGIS possède une description de corridor et 36 points de ligne 9 ; la relation OSM 7487218 suit fortement la couche de points, tandis que la relation opposée ne la suit pas.
- Moovit confirme deux séquences distinctes avec des extrémités compatibles au niveau du corridor : Ciudad De Los Deporte ↔ Gare Palais. « Ciudad De Los Deporte » n'est pas une preuve d'identité exacte avec le terminus DDD Liberté 6 ; « Gare Palais » ne prouve pas Palais 2.

**Décision ligne 9 :** convergence forte pour le sens Liberté 6 vers Palais sur le corridor, avec OSM 7487218 et Moovit « Palais ». Le retour est explicitement listé par Moovit et a un candidat OSM distinct, mais la couche ArcGIS disponible ne le corroborre pas spatialement. Garder les 24 repères DDD comme référence et les deux séquences secondaires séparées.

Sources Moovit :
- https://moovitapp.com/index/fr/transport_en_commun-line-9-Dakar-5996-1618037-18051504-0
- https://moovitapp.com/index/fr/transport_en_commun-line-9-Dakar-5996-1618037-18051504-1

## Ligne 10 — Liberté 5 / Palais

### Référence officielle DDD
DDD publie 29 repères de Terminus Liberté 5 (Dieuppeul) à Terminus Palais 2.

### Moovit — deux séquences directionnelles
- Page « Liberté 5 » : 36 arrêts, de **Gare Palais** à **Terminus Liberté 5**.
- Page « Palais » : 35 arrêts, de **Terminus Liberté 5** à **Gare Palais**.

Repères identifiables de la séquence « Palais » : Terminus Liberté 5, Rue Dd 109, Rue Dd 33, Rue Sc 168, Rue Lib 194, Rue Lib 287, Rue Lib 311, Boulevard Habib Bourguiba, Rue Pe 05, Hôpital Fann, Rue FN 20, Rue David Diop, Corniche Ouest, Rue FN 48, Cimetiére, Maison d'Arrêt, Avenue Roosevelt, Avenue Jean Jaurès, Boulevard de la République, Avenue Nelson Mandela, Avenue Pasteur et Gare Palais. Plusieurs entrées restent libellées « Arrêt De Bus ».

### OSM / ArcGIS
- OSM 7488283 : 25 membres ordonnés, sens Liberté 5 → Palais 1 ; 17/25 à 15 m ou moins, 20/25 à 50 m ou moins, ordre OBJECTID non décroissant sur 24/24 transitions.
- OSM 6990845 : 30 membres, sens Palais 1 → Liberté 5 ; 4/30 à 15 m ou moins et ordre OBJECTID non décroissant sur 5/29 transitions.
- ArcGIS fournit une route Ligne 10 et 26 points ; son descriptif textuel concorde avec le corridor DDD et le terminus Palais 2.
- Moovit confirme le sens Liberté 5 → Gare Palais avec une liste distincte et un retour Gare Palais → Liberté 5. La séquence retour OSM existe, mais la couche ArcGIS disponible ne la corroborre pas spatialement.
- Les libellés Moovit de rue et les entrées génériques ne sont pas des noms officiels DDD ; aucun remplacement des 29 repères n'est justifié.

**Décision ligne 10 :** convergence forte sur le sens Liberté 5 vers le centre ; retour présent dans Moovit et dans une relation OSM distincte, mais confiance géospatiale plus faible. Conserver les deux sens séparément et le terminus officiel Palais 2 tant que l'opérateur ne confirme pas l'équivalence avec Gare Palais.

Sources Moovit :
- https://moovitapp.com/index/fr/transport_en_commun-line-10-Dakar-5996-1618037-18051525-0
- https://moovitapp.com/index/fr/transport_en_commun-line-10-Dakar-5996-1618037-18051525-1

## Conclusion transversale

| Ligne | Sens officiel/corridor fortement recoupé | Sens opposé | Limite déterminante |
|---|---|---|---|
| 7 | Ouakam → centre : OSM + ArcGIS + Moovit | Moovit distinct + candidat OSM | candidat OSM retour faible ; terminus Palais 1/2/Gare Palais |
| 9 | Liberté 6 → centre : OSM + ArcGIS + Moovit | Moovit distinct + candidat OSM | candidat OSM retour faible ; Liberté 6/Ciudad De Los Deporte et Palais 1/2/Gare Palais |
| 10 | Liberté 5 → centre : OSM + ArcGIS + Moovit | Moovit distinct + candidat OSM | candidat OSM retour faible ; Palais 1/2/Gare Palais |

## Décisions de sécurité

- Les séquences DDD officielles restent la référence de catalogue.
- Les deux sens Moovit sont stockés comme observations directionnelles secondaires, pas comme arrêts DDD certifiés.
- Les relations OSM gardent leurs identifiants, leur ordre original et leur niveau de confiance.
- Les points ArcGIS restent des preuves de géométrie et de proximité, pas des validations automatiques d'arrêt.
- Aucune inversion de séquence, aucun arrêt générique renommé, aucun terminus fusionné.
- Aucun horaire ou fréquence Moovit n'est importé.
- Aucun code de production, TER/BRT, donnée Supabase ou déploiement modifié dans cet audit.


## Contrôle complémentaire — séquences officielles DDD et fraîcheur ArcGIS

Source officielle de référence : https://demdikk.sn/reseau-urbain-dakar/ (page « Réseau urbain Dakar », consultée le 15 novembre 2026). Elle donne les séquences commerciales suivantes, dans le sens terminus de départ → terminus d'arrivée.

### Ligne 7 — séquence officielle publiée
Ouakam → Palais 2 :
1. Terminus Ouakam
2. Cité Assemblée
3. Cité Comico
4. Sortie Ouakam
5. Hôpital IHO
6. Mermoz
7. ENEA
8. École Normale
9. UCAD
10. Rond-point Sham
11. Marché Tilène
12. Poste Médina
13. Difoncé
14. Sandaga
15. Avenue George Pompidou
16. Place de l’Indépendance
17. Avenue Léopold Sédar Senghor
18. Hôpital Principal
19. Rond-point Assemblée nationale
20. Institut Pasteur
21. Terminus Palais 2

### Ligne 9 — séquence officielle publiée
Liberté 6 → Palais 2 :
1. Terminus Liberté 6
2. Rond-point JVC
3. Sacré Cœur
4. IPG
5. Terminus Dieuppeul
6. Allées Ababacar Sy
7. Rond-point Jet d’Eau
8. Niary Tally
9. Église Sainte-Thérèse
10. Lycée Blaise Diagne
11. Lycée Kennedy
12. Obélisque
13. Centenaire
14. Rond-point RTS
15. Poste Médina
16. Difoncé
17. Sandaga
18. Avenue George Pompidou
19. Place de l’Indépendance
20. Avenue Léopold Sédar Senghor
21. Hôpital Principal
22. Rond-point Assemblée nationale
23. Institut Pasteur
24. Terminus Palais 2

### Ligne 10 — séquence officielle publiée
Liberté 5 (Dieuppeul) → Palais 2 :
1. Terminus Liberté 5 (Dieuppeul)
2. Cité Derklé
3. Rond-point Liberté 6
4. Khar Yalla
5. Cité Marine
6. CEM Ousmane Socé Diop
7. Église Martyrs de l’Ouganda
8. SDE
9. Dakar Sacré Cœur
10. Stade Demba Diop
11. Avenue Bourguiba
12. École Normale
13. Poste Fann
14. Rue Aimé Césaire
15. Ministère de la Santé
16. Corniche Ouest
17. IFAN
18. Hôtel Terrou
19. Tunnel de Soumbédioune
20. Village artisanal de Soumbédioune
21. Prison Rebeus
22. Tribunal de Dakar
23. Boulevard de la République
24. Sorano
25. Avenue Léopold Sédar Senghor
26. Hôpital Principal
27. Rond-point Assemblée nationale
28. Institut Pasteur
29. Terminus Palais 2

### Alerte de fraîcheur des couches ArcGIS historiques

Les couches route spécifiques consultées dans le service `Ligne_inter_urbain` sont bien des polylignes, mais leurs métadonnées indiquent toutes une dernière modification des données au **13 décembre 2017** :
- ligne 7 : polyligne couche 19 ; référence spatiale EPSG:32628 ; HasM=true ;
- ligne 9 : polyligne couche 21 ; EPSG:32628 ; HasM=false ;
- ligne 10 : polyligne couche 22 ; EPSG:32628 ; HasM=false.
Les couches de points associées sont respectivement 2, 4 et 6 (34, 36 et 26 points selon les estimations du service).

**Conséquence :** ces couches de 2017 ne peuvent pas être présentées comme une validation géographique actuelle à elles seules. Elles constituent un témoin historique utile pour confronter les corridors, pas une vérité terrain 2026. Le service séparé `Dem_dikk_mise_a_jour` expose une couche unifiée d'arrêts et une couche unifiée d'itinéraires, avec des données éditées le 24 septembre 2024 pour la couche d'arrêts ; cependant, les enregistrements et géométries individuels n'ont pas été extraits et contrôlés ici. Aucun rapprochement géométrique récent ne doit donc être déclaré terminé sur cette seule base.

Sources ArcGIS :
- https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer/19
- https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer/21
- https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer/22
- https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0

## Décision après ce contrôle

- Les listes de la page DDD sont la référence commerciale pour les terminus et l'ordre publié des repères.
- Moovit demeure une source secondaire pour les listes détaillées par sens ; ses noms de rue et arrêts génériques ne remplacent pas les repères DDD.
- Les couches ArcGIS spécifiques 2017 ne doivent pas être utilisées comme preuve d'un tracé actuel sans validation complémentaire.
- Le service ArcGIS unifié doit être interrogé et ses géométries réelles extraites avant de produire un crosswalk géographique arrêt par arrêt. Attention : la couche d'arrêts affiche une dernière modification des données au 24 septembre 2024, mais la couche unifiée des itinéraires affiche une dernière modification des données au 11 janvier 2019 (même si les métadonnées de la couche ont été modifiées en 2024).
- Aucune géométrie, aucun arrêt, aucun horaire et aucune fréquence n'a été modifié dans l'application à la suite de cet audit.


### Précision de date — couche unifiée des itinéraires
L'inspection directe de la couche 1 de `Dem_dikk_mise_a_jour` confirme qu'il s'agit d'une polyligne EPSG:32628 avec mesures M et plusieurs champs d'itinéraire directionnels. Sa métadonnée distingue :
- dernière modification de la couche / schéma : 24 septembre 2024 ;
- **dernière modification des données géométriques : 11 janvier 2019**.

Il ne faut donc pas qualifier la géométrie du réseau de « géométrie 2024 ». La couche d'arrêts 0 a, elle, une date de données au 24 septembre 2024. Cette différence de fraîcheur est déterminante : les arrêts peuvent être plus récents que les itinéraires associés.

Source : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/1
