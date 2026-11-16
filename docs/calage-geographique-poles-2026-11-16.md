# Calage géographique des pôles de correspondance — Dakar

Date : 16 novembre 2026  
Branche : `docs/calage-geographique-poles-2026-11-16`  
Périmètre : recherche documentaire et contrôle des points OSM ; aucune nouvelle correspondance n'est activée dans cette étape.

## Décisions de sécurité du calculateur

- Un arrêt de quartier ou un terminus nommé ne suffit pas à prouver une correspondance physique.
- Les distances ci-dessous sont des distances géographiques en ligne droite calculées entre objets cartographiques, jamais des distances piétonnes.
- Aucun transfert ne doit être activé sur la seule base d'une proximité à vol d'oiseau.
- Les arrêts génériques existants de DDD/AFTU ne doivent pas être déplacés vers un nouveau point sans preuve de desserte par la ligne correspondante.
- Les données et horaires TER/BRT ne sont pas concernés.

## 1. Grand Médine — BRT et DDD : deux arrêts à distinguer

### Éléments localisés

- La station BRT Grand Médine est représentée dans OpenStreetMap par les objets `node 11739848234` (14.74819, -17.44443) et `node 11738664082` (14.74744, -17.44489), correspondant à des éléments de position/plateforme du même arrêt.
- Le site officiel DDD cite « Marché Grand Médine » sur les lignes 1 et 6 ; la ligne 23 dessert « HLM Grand Médine ».
- Un arrêt DDD intitulé « Arrêt croisement Diamalaye-HLM Grand Médine » est cartographié au nœud OSM `4323839251` (14.76135, -17.45056). Il est nettement distinct de la station BRT Grand Médine : environ 1,5 km en ligne droite. Il ne faut donc surtout pas le raccorder automatiquement à cette station.
- L'arrêt DDD « Marché Grand Médine » est référencé par un fournisseur d'horaires à l'adresse « Village Grand Médine », mais les coordonnées exactes de son quai n'ont pas été établies par une source cartographique suffisamment précise dans cette recherche.

### Décision

**Aucune nouvelle liaison BRT ↔ DDD n'est activée à Grand Médine.** La prochaine opération utile est de localiser le quai DDD « Marché Grand Médine » sur le terrain ou dans une source géographique vérifiable, puis de mesurer l'itinéraire piéton réel jusqu'à l'entrée voyageurs BRT. L'arrêt DDD HLM Grand Médine reste séparé.

## 2. Colobane — gare TER et gare routière : cheminement à mesurer

### Éléments localisés

- Gare TER Colobane : nœud OSM `10245681535`, environ 14.70035, -17.44165.
- Gare routière de Colobane : objet OSM `way 599927187`, environ 14.69793, -17.44303.
- Les deux objets sont séparés d'environ **307 m en ligne droite**. Cette valeur est un minimum géométrique, pas la longueur d'un trajet piéton.
- DDD publie les dessertes de Colobane, notamment lignes 18 et 20 ; AFTU publie la ligne 29 « Gadaye – Gare de Colobane » et la ligne 74 « Terminus Malika – Terminus Gare routière Colobane ».
- Le CETUD décrit des espaces routiers dédiés distincts pour DDD et pour AFTU/taxis. L'intégration physique avec le TER était présentée comme un aménagement complémentaire ; il ne faut donc pas représenter un transfert à marche nulle.

### Décision

Colobane est le meilleur candidat pour un **pôle bus DDD ↔ AFTU** et pour une liaison piétonne vers le TER, mais les accès et traversées exacts restent à tracer. Ne pas activer de lien TER ↔ DDD/AFTU à `walkM: 0`. Le calculateur devra utiliser une distance de marche réelle et un temps de cheminement une fois l'accès piéton confirmé.

## 3. UCAD — desserte DDD confirmée, arrêts AFTU à caler

### Éléments localisés

- Deux plateformes DDD nommées « UCAD » figurent dans OpenStreetMap : `node 4666430963` (14.69324, -17.46207) et `node 4666430964` (14.69308, -17.46216), séparées d'environ 20 m en ligne droite. Elles correspondent à des plateformes opposées ou distinctes ; ne pas les fusionner sans contrôler les sens.
- DDD confirme UCAD sur ses lignes 1, 7, 8 et 20.
- AFTU confirme les dessertes UCAD sur ses lignes 24 (« UCAD – Notaire Guédiawaye ») et 83 (« UCAD – Jaxaay »).
- Un objet cartographique nommé « Arret Bus Aftu » existe au nœud `4666430962` (14.69106, -17.45971), à environ **351 m en ligne droite** de la plateforme DDD `4666430963`. Toutefois, les métadonnées visibles de cet objet ne permettent pas d'établir sans ambiguïté son opérateur ni de l'associer à la ligne AFTU 24 ou 83.

### Décision

La desserte des deux réseaux est confirmée, mais **aucune correspondance UCAD ↔ AFTU n'est activée**. Il faut vérifier que le nœud candidat est bien desservi par la ligne AFTU concernée, puis tracer le parcours piéton entre les quais dans chaque sens. Les deux plateformes DDD UCAD doivent rester distinctes.

## 4. Lat Dior — terminus partagé dans les fiches, accès exact non établi

### Éléments confirmés

- DDD publie la ligne 11 « Keur Massar ↔ Lat Dior » avec terminus Lat Dior.
- AFTU publie plusieurs lignes ayant Lat Dior comme terminus ou origine : ligne 1 « Lat Dior – HLM Grand Yoff », ligne 34 « Terminus Nord – Foire – VDN – … – Terminus Lat Dior », ainsi que d'autres lignes indiquées dans son catalogue.
- Les fiches de lignes confirment donc une convergence de réseaux sur le secteur Lat Dior, mais les positions exactes des quais DDD et AFTU ne sont pas établies par les sources géographiques consultées.

### Décision

Lat Dior reste un candidat prioritaire DDD ↔ AFTU, mais aucun lien n'est activé tant que les entrées et quais ne sont pas identifiés. Le point générique `aftu-lat-dior` du référentiel ne doit pas être pris pour une coordonnée vérifiée de quai.

## 5. Ordre opérationnel recommandé

1. **Colobane** : lever le cheminement entre gare TER et gare routière, puis entre les espaces DDD et AFTU.
2. **UCAD** : associer les plateformes DDD à leurs sens et vérifier l'objet AFTU candidat auprès des lignes 24/83.
3. **Lat Dior** : localiser les quais des lignes DDD 11 et AFTU avant de créer un nœud d'échange.
4. **Grand Médine** : obtenir le point exact du quai DDD « Marché Grand Médine » ; maintenir « HLM Grand Médine » comme arrêt distinct.

## Sources

### Sources officielles transport

- DDD, réseau urbain et fiches de lignes : https://demdikk.sn/reseau-urbain-dakar/
- DDD, information voyageurs : https://demdikk.sn/info-voyageurs/
- AFTU, catalogue des lignes : https://aftu-senegal.org/infos-pratiques/
- AFTU, itinéraire de la ligne 34 : https://aftu-senegal.org/map/dakar-urbain-ligne-34/
- CETUD, gare routière de Colobane : https://cetud.sn/transport-mise-en-service-de-la-nouvelle-gare-routiere-de-colobane-financee-par-le-cetud/
- TER Sénégal, gare de Colobane : https://ter-senegal.sn/colobane/

### Références cartographiques OSM consultées via Mapcarta

- BRT Grand Médine, nœuds 11739848234 et 11738664082 : https://mapcarta.com/fr/N11739848234 et https://mapcarta.com/fr/N11738664082
- DDD HLM Grand Médine, nœud 4323839251 : https://mapcarta.com/fr/N4323839251
- Gare routière de Colobane, way 599927187 : https://mapcarta.com/W599927187
- Gare TER Colobane, nœud 10245681535 : https://mapcarta.com/fr/N10245681535
- Plateformes DDD UCAD, nœuds 4666430963 et 4666430964 : https://mapcarta.com/fr/N4666430963 et https://mapcarta.com/fr/N4666430964
- Arrêt candidat « Arret Bus Aftu », nœud 4666430962 : https://mapcarta.com/N4666430962

## Périmètre préservé

- Aucun transfert supplémentaire n'est activé dans le graphe à cette étape.
- Les transferts déjà documentés de Petersen et Guédiawaye restent inchangés.
- Aucun tracé, arrêt, horaire ou intervalle TER/BRT n'est modifié.
- L'identité publique des minibus reste **AFTU** ; aucune marque TATA distincte n'est affichée.
- GTFS n'est pas requis pour poursuivre ce travail.
