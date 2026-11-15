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
