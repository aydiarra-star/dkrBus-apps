# Audit croisé DDD — OSM + ArcGIS + Moovit

Date : 15 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`  
Portée : consolidation documentaire des preuves disponibles ; aucune modification du catalogue passager.

## Méthode et hiérarchie des preuves

- **DDD** reste la référence primaire pour l'identifiant commercial, les terminus et les séquences explicitement publiées.
- **ArcGIS DDD** sert à contrôler les corridors, les points géographiques et les éventuels doublons. Un point proche d'une polyligne ou un ordre de chaînage ne prouve pas à lui seul un arrêt exploité ni le sens commercial.
- **OSM** apporte les relations directionnelles et les membres d'arrêts ordonnés. Les relations restent candidates tant que les terminus, noms, continuités et correspondances géographiques ne concordent pas.
- **Moovit** apporte une comparaison indépendante utile pour repérer deux sens, des arrêts supplémentaires et des variantes. Le nombre d'arrêts seul n'est jamais une preuve d'identité ; l'opérateur et les terminus doivent être contrôlés avant rapprochement.

Aucune source secondaire n'est fusionnée automatiquement dans les séquences DDD. Les deux sens restent des jeux de données distincts. Aucun retour n'est fabriqué par inversion.

## Résultats du croisement par ligne

| Ligne DDD | OSM | ArcGIS | Moovit | Décision |
|---|---|---|---|---|
| 1 | Relation 6951328 : 38 arrêts ordonnés ; un seul sens trouvé ; 5 correspondances nominales ordonnées avec DDD | Très forte proximité : 38/38 à 25 m ou moins dans l'audit actualisé ; ordre spatial cohérent | Pas de fiche Moovit directionnelle vérifiée dans les audits consultés | Meilleur candidat géospatial du lot, mais retour non prouvé ; ne pas publier un aller-retour complet |
| 4 | Deux relations opposées ; la relation 7203970 est la plus proche de la couche ArcGIS | Une candidate à médiane proche de 2 m ; l'autre nettement plus éloignée | La fiche Moovit « Liberté 5 – Leclerc » est attribuée à AFTU 4, pas à DDD | Exclure Moovit 4 de la preuve DDD ; garder les relations OSM candidates et vérifier les terminus |
| 7 | Deux relations distinctes ; relation 7500475 géographiquement forte, l'autre plus éloignée | Relation 7500475 : 31/34 à 100 m ou moins ; relation opposée 6990669 moins cohérente | Deux directions affichées, 29 et 27 arrêts ; terminus « Gare Palais » / « Rue Okm 60, 67 » | Trois sources utiles mais pas de correspondance arrêt-à-arrêt exhaustive ; ne pas confondre Gare Palais et Palais 2 |
| 9 | Relation 7487218 : 29 membres, 27 à 25 m ou moins ; relation 6996431 opposée mais plus dispersée | Les deux relations ont des qualités spatiales différentes ; la meilleure candidate OSM ne résout pas Palais 1 / Palais 2 | Deux directions affichées, 39 et 38 arrêts ; terminus « Ciudad De Los Deporte » / « Gare Palais » | Conserver les deux candidates OSM ; aucun remplacement de la séquence DDD de 24 repères |
| 10 | Relation 7488283 : 25 membres, 18 à 25 m ou moins ; relation 6990845 opposée et plus dispersée | Le corridor ArcGIS est proche mais les terminus et noms intermédiaires ne sont pas entièrement concordants | Deux directions affichées, 35 et 36 arrêts ; « Gare Palais » diffère de « Palais 2 » | Conserver les deux candidates OSM ; pas d'import des écarts Moovit sans correspondance point par point |
| 121 | Relation 6990794 partielle (27 arrêts) et 6999013 partielle (7 arrêts) ; terminus incompatibles avec le parcours complet | 31 points sur le corridor ; 5 noms ordonnés communs avec la séquence DDD | Pas de fiche Moovit directionnelle vérifiée dans les audits consultés | ArcGIS est la meilleure base géographique ; OSM reste fragmentaire ; ne pas concaténer ni inverser les fragments |

## Contrôles Moovit complémentaires déjà effectués

Les audits documentaires existants identifient aussi les cas suivants :

- **DDD 2 / Moovit 2A :** Moovit présente 2A Daroukhane–Leclerc (83 arrêts dans un sens). Ne pas convertir 2A en DDD 2 sans preuve de nomenclature.
- **DDD 5 / Moovit 5 :** la fiche Moovit 5 consultée est opérée par AFTU. Elle ne valide donc pas DDD 5.
- **DDD 11 :** DDD publie Keur Massar–Lat Dior ; Moovit DDD 11 affiche Keur Massar–Leclerc (36/34 arrêts). Conflit à résoudre, ne pas remplacer Lat Dior.
- **DDD 15 :** Moovit présente DDD 15 Rufisque–Palais (69 arrêts par sens), tandis que la nomenclature Info voyageurs mentionne 15A/15B. La séquence générique DDD 15 ne doit pas être attribuée aux variantes 15A et 15B.
- **DDD 8 :** Moovit expose 52 arrêts dans chaque sens ; « Gare Palais » n'est pas assimilé à « Palais 2 ».
- **DDD 18 et 20 :** DDD publie des boucles de 41 et 42 entrées ; Moovit affiche des boucles de 45 et 47 arrêts. Les différences de volume ne justifient aucun ajout automatique.
- **DDD 16A :** Moovit affiche 64/65 arrêts ; le terminus « Gare Palais » n'est pas assimilé à « Palais 1 ».
- **DDD 233 :** DDD publie une séquence vers Aéroport LSS mais Info voyageurs indique Palais 1 ; Moovit affiche 39/41 arrêts vers Gare Palais. Aucune source consultée ne résout ce conflit.
- **DDD 234 :** Moovit affiche 53/54 arrêts entre Jaxaay et Gare Palais ; DDD publie 13 repères vers Leclerc. Les arrêts supplémentaires ne sont pas identifiés par le seul comptage.

## Ordre de traitement recommandé

1. **Ligne 7** : comparer les listes directionnelles Moovit avec les deux relations OSM et les points ArcGIS, en conservant chaque sens distinct.
2. **Ligne 9** : vérifier les deux relations OSM, en particulier les points éloignés et les terminus ; contrôler chaque arrêt Moovit avant toute correspondance.
3. **Ligne 10** : même méthode, avec contrôle particulier de la fin de parcours et de la différence Palais 1 / Palais 2.
4. **Ligne 1** : conserver le sens OSM géographiquement fort et rechercher une preuve indépendante du retour.
5. **Ligne 4** : ne pas utiliser la fiche Moovit AFTU comme preuve DDD ; contrôler les deux relations OSM contre les arrêts publiés.
6. **Ligne 121** : rechercher les portions manquantes et l'origine des fragments OSM avant toute intégration.

## Règles de sécurité des données

- Aucun arrêt Moovit n'est ajouté sur la seule base d'un écart de comptage.
- Aucun identifiant de ligne n'est réattribué entre DDD et AFTU.
- Aucun terminus n'est déclaré équivalent sur la seule base d'une proximité géographique ou d'un nom ressemblant.
- Les boucles restent des boucles ; les variantes 15, 15A et 15B restent séparées.
- Aucun sens retour n'est créé par inversion mécanique.
- Aucun horaire, fréquence ou temps de passage n'est déduit de Moovit.
- Les panneaux et données TER/BRT restent strictement inchangés.
- Aucune écriture Supabase n'est effectuée.

## Rapports sources

- `docs/ddd-osm-arcgis-consolidation-2026-11-13.md`
- `docs/ddd-priority-lines-6-12-13-16b-121-arcgis-osm-review-2026-11-14.md`
- `docs/ddd-osm-official-sequence-name-crosscheck-2026-11-13.md`
- `docs/ddd-lines-7-9-10-source-crosscheck-2026-11-14.md`
- `docs/ddd-lines-2-5-11-source-crosscheck-2026-11-14.md`
- `docs/ddd-lines-4-15-source-crosscheck-2026-11-14.md`
- `docs/ddd-lines-8-18-20-source-crosscheck-2026-11-14.md`
- `docs/ddd-lines-16a-233-234-source-crosscheck-2026-11-14.md`
- `docs/ddd-lines-9-10-121-detailed-review-2026-11-13.md`

## Liens de sources externes

- DDD — réseau urbain : https://demdikk.sn/reseau-urbain-dakar/
- DDD — info voyageurs : https://demdikk.sn/info-voyageurs/
- ArcGIS DDD urbain : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer/
- ArcGIS DDD banlieue : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Itin%C3%A9raire_ligne_de_Banlieue_Dakar_Dem_Dikk/FeatureServer/
- OSM : relations et membres extraits via Overpass, voir les rapports de consolidation ci-dessus.
- Moovit : fiches directionnelles citées dans les rapports de lignes correspondants.

## Statut

Rapport de consolidation des preuves, sans modification des données passagers. Les résultats restent des candidats de vérification et ne valent pas validation d'exploitation.
