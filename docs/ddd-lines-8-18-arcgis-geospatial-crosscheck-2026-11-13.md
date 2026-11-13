# Rapprochement géographique ArcGIS — DDD lignes 8 et 18

Date : 13 novembre 2026.

## Sources rapprochées

- Archive `ddd-arcgis-route-stop-candidates`, issue du workflow `43445237186`, commit source `0d21b39892e5e2b3cd4313e73bb76cf8a0551462`.
- Séquence publiée par l'opérateur DDD, fichier `src/data/dddOfficialUrbanPublishedRoutes.ts`, ligne 18.
- Géométries de lignes et couches de points ArcGIS DDD extraites sans modification.

Le système de coordonnées annoncé par les couches est WKID 32628, tandis que les coordonnées retournées sont des longitudes/latitudes en degrés. Les calculs de distance ci-dessous ont donc été réalisés sur les coordonnées géographiques observées, avec une approximation locale en mètres à Dakar. Ils servent au contrôle de cohérence, pas à une mesure cadastrale.

## Ligne 8 — forte cohérence géographique, identité des arrêts absente

Résultats du rapprochement des 49 points avec la géométrie de l'itinéraire :
- 49/49 points à moins de 25 m de la ligne ;
- distance médiane point–ligne : environ 6,0 m ;
- distance maximale : environ 18,5 m ;
- les 49 points, dans l'ordre des OBJECTID de la couche, progressent de façon monotone le long de la géométrie, du début à la fin ;
- géométrie de ligne : environ 20,8 km mesurés sur les coordonnées, contre environ 21,16 km dans l'attribut de longueur.

Cela donne un indice fort que les 49 points sont bien associés au corridor de la ligne 8 et que leur ordre OBJECTID est cohérent avec le sens de la géométrie. Mais le champ `Id` vaut 0 pour les 49 points et aucun nom d'arrêt n'est fourni. Il est donc impossible de les relier sans ambiguïté aux 41 repères ou à une autre séquence voyageurs publiée.

Quelques écarts entre points successifs dépassent 500 m, avec un maximum d'environ 1,23 km. Comme les points restent tous très proches de la géométrie, ces écarts ne démontrent pas une erreur ; ils peuvent simplement refléter une sélection de points peu dense sur le corridor.

**Décision ligne 8 :** classer les 49 points comme candidats géographiques fortement rattachés au tracé, avec ordre géométrique plausible. Ne pas leur attribuer de noms, ni les publier comme arrêts voyageurs. Ne pas conclure que cette liste fournit le retour : elle suit un seul ordre de couche.

## Ligne 18 — 44 points proches du corridor et ordre spatial globalement cohérent

La séquence DDD publiée comporte 41 repères et revient au Terminus Liberté 5. La couche ArcGIS comporte 44 points nommés ou partiellement nommés, dont un libellé vide, et la géométrie de ligne forme un corridor en boucle.

Rapprochement des points avec la géométrie :
- 44/44 points à moins de 25 m de la ligne ;
- distance médiane point–ligne : environ 4,9 m ;
- distance maximale : environ 8,2 m ;
- les points sont donc tous spatialement très proches de la géométrie ArcGIS.

Les libellés ArcGIS offrent plusieurs ancres de rapprochement avec les repères DDD publiés :
- Terminus Liberté 5 ↔ Terminus Liberté 5 (Dieuppeul) ;
- Avenue Cheikh Ahmadou Bamba Mbacké ↔ Avenue Cheikh Ahmadou Bamba ;
- Port de Dakar ↔ Esso Port / secteur du Port, à distinguer des autres repères portuaires ;
- Hôtel de l’Indépendance ↔ Place de l’Indépendance, rapprochement plausible à confirmer ;
- Avenue George Pompidou ↔ Avenue Georges Pompidou ;
- Rue 6 ↔ Rue 6 ;
- Cheikh Anta Diop ↔ Avenue Cheikh Anta Diop ;
- Ecole Normale Supérieure ↔ Ecole Normale Supérieure ;
- Avenue Bourguiba ↔ Avenue Bourguiba ;
- Dieuppeul ↔ terminus / secteur Dieuppeul.

Ces rapprochements sont des ancres de contrôle, pas une validation intégrale des 41 repères. Plusieurs libellés ArcGIS sont des noms d'avenues ou de voies plutôt que des noms d'arrêts voyageurs. Le libellé « Ville » est trop générique et le point sans nom reste anonyme.

### Répétitions de libellés : ne pas dédupliquer par le texte

Les répétitions sont spatialement distinctes :
- « Avenue Cheikh Ahmadou Bamba Mbacké » : 10 points, étendue spatiale maximale entre points d'environ 2,85 km ;
- « Avenue Bourguiba » : 6 points, étendue maximale d'environ 1,69 km ;
- « Boulevard du Docteur Samba Gueye » : 3 points, étendue maximale d'environ 617 m ;
- « Route de Grands Moulins » : 2 points, environ 541 m ;
- « Avenue Félix Eboué » : 2 points, environ 844 m ;
- « Avenue George Pompidou » : 2 points, environ 336 m ;
- « Cheikh Anta Diop » : 2 points, environ 132 m ;
- « Dieuppeul » : 2 points, environ 442 m.

Le doublon textuel ne signifie donc pas doublon géographique. Ces points ne doivent pas être fusionnés sur le seul critère du nom. À l'inverse, leur position sur une même avenue ne prouve pas que chacun est un arrêt voyageurs distinct.

La projection des points sur la géométrie d'une boucle présente une ambiguïté naturelle au point de fermeture et quelques retours locaux. Il ne faut donc pas transformer l'ordre OBJECTID en sens commercial garanti sans confirmation de la séquence par une source opérateur.

**Décision ligne 18 :** conserver les 44 points et leurs GlobalID séparément. Utiliser les ancres ci-dessus pour la revue humaine de la séquence publiée, sans renommer automatiquement les points ni fusionner les répétitions. La géométrie renforce fortement l'association au corridor, mais ne certifie ni chaque arrêt voyageurs, ni le sens commercial Aller/Retour.

## Conclusion opérationnelle

- Ligne 8 : 49 points spatialement confirmés sur le corridor, mais anonymes ; candidat géographique de haute cohérence, non publiable comme liste d'arrêts.
- Ligne 18 : 44 points spatialement confirmés sur le corridor ; plusieurs ancres nominales rapprochables de la séquence DDD, mais les libellés répétés restent distincts et l'ordre doit être revu.
- Aucun retour n'est fabriqué par inversion.
- Aucun horaire ou intervalle n'est déduit de ces couches.
- Aucun candidat n'est injecté dans le catalogue passager.

## Garde-fous

Analyse documentaire uniquement : aucune écriture Supabase, aucun déploiement, aucune modification de la production ni des données TER/BRT. Aucun GTFS utilisé.
