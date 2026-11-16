# Solutions de correspondance multimodale — audit des pôles

Date : 16 novembre 2026  
Branche : `docs/audit-poles-correspondance-2026-11-16`

## Décision générale

Le calculateur ne doit pas confondre « même quartier » et « même pôle ». Une liaison est activée uniquement lorsqu'une source décrit un terminus ou pôle commun, que les deux arrêts du référentiel représentent bien ce pôle, et que le cheminement piéton est établi. Les correspondances au sein d'un même terminal peuvent être codées avec `walkM: 0` comme **surcoût inter-pôle nul** ; cela ne signifie pas que le voyageur ne marche pas entre les quais.

## Solutions par pôle

### 1. Guédiawaye — correspondance BRT ↔ DDD activée

**Éléments confirmés**
- Le CETUD situe le pôle d'échange BRT devant la mosquée Souleymane BAAL / Grande Mosquée de Guédiawaye.
- Le document CETUD décrit un terminus de rabattement facilitant les transferts entre BRT et les modes de capacité plus faible, explicitement AFTU et DDD.
- Dakar Dem Dikk publie le « Terminus Guédiawaye » comme terminus des lignes 5 et 12.
- Le référentiel contient les points `brt-prefecture-guediawaye` et `ddd-guediawaye` au même pôle terminal de référence.

**Modification réalisée dans cette PR**
- Activation de `brt-prefecture-guediawaye ↔ ddd-guediawaye`, avec `walkM: 0` au niveau du pôle terminal commun.
- Test dédié ajouté.
- Les dessertes TER/BRT existantes restent inchangées.

**AFTU : à confirmer avant activation**
Le CETUD décrit bien l'accueil des minibus AFTU dans le dispositif de rabattement. Toutefois, le point AFTU générique du référentiel ne suffit pas à prouver qu'une ligne actuellement modélisée dessert précisément le quai du pôle. Il faut faire correspondre une ligne AFTU active et son arrêt réel avant d'ajouter le lien BRT ↔ AFTU.

### 2. Grand Médine — créer un véritable pôle de rabattement DDD ↔ BRT, après calage des accès

**Éléments confirmés**
- Le CETUD identifie un pôle d'échange BRT à Grand Médine, à proximité de la route de l'aéroport et de l'échangeur.
- La page DDD publie « Marché Grand Médine » sur la ligne 1 et « HLM Grand Médine » sur la ligne 23 ; la ligne 6 mentionne également le secteur du Marché Grand Médine.
- Les documents CETUD évoquent les lignes de rabattement et le pôle de Grand Médine.

**Solution idéale**
- Distinguer dans le référentiel la station BRT « Grand Médine » et les arrêts DDD « Marché Grand Médine » / « HLM Grand Médine » si leurs accès sont distincts.
- Relever les entrées et quais réels, puis calculer le parcours piéton entre chaque arrêt DDD et l'entrée voyageurs BRT.
- N'ajouter que les liens correspondant aux arrêts DDD effectivement desservis et au cheminement vérifié ; ne pas utiliser une distance nulle par défaut.
- Vérifier les dessertes AFTU ligne par ligne avant de les connecter.

**Décision actuelle :** candidat prioritaire, pas de liaison automatique tant que le cheminement entre les arrêts DDD et le terminal BRT n'est pas mesuré.

### 3. Colobane — organiser un pôle bus DDD/AFTU et une liaison piétonne vers TER

**Éléments confirmés**
- Le CETUD décrit une gare dédiée à DDD et une autre aux taxis / lignes AFTU à Colobane.
- Le même document précise que des investissements complémentaires étaient prévus pour une intégration physique avec le TER.
- La gare TER de Colobane est confirmée par le site TER Sénégal.
- Les lignes DDD 18 et 20 desservent Colobane ; la page d'information voyageurs liste également les lignes 502A/502B/503A/503B au départ de Colobane.

**Solution idéale**
- Traiter les gares DDD et AFTU comme deux accès distincts du complexe routier, et non comme un seul point fictif.
- Cartographier les entrées piétonnes et traversées sécurisées entre les gares routières et l'entrée de la gare TER.
- Une fois la liaison piétonne actuelle confirmée, activer DDD ↔ AFTU et les transferts vers TER avec les distances de cheminement réelles.
- Tant que l'intégration physique TER n'est pas confirmée sur le terrain, ne pas déclarer un transfert TER ↔ bus à marche nulle.

**Décision actuelle :** pôle multimodal prioritaire pour la prochaine mesure piétonne ; pas de nouvelle liaison codée dans cette PR.

### 4. UCAD — correspondance bus de surface à construire autour des accès universitaires

**Éléments confirmés**
- Les itinéraires officiels DDD 1, 7, 8 et 20 citent UCAD.
- La desserte de UCAD par DDD est donc confirmée, mais cela ne prouve pas que tous ces arrêts se trouvent au même portail ou au même quai.

**Solution idéale**
- Créer un arrêt de référence distinct pour chaque accès UCAD réellement utilisé (par exemple entrée principale / avenue Cheikh Anta Diop), sans fusionner des points éloignés.
- Rechercher les arrêts AFTU qui desservent effectivement le même accès, puis relier uniquement les couples validés.
- Proposer à défaut une correspondance par marche vers l'arrêt de surface le plus proche, avec cheminement piéton cartographié et traversées sûres.

**Décision actuelle :** DDD confirmé ; pas de correspondance inter-réseaux activée faute de point AFTU précis.

### 5. Lat Dior — pôle de rabattement DDD/AFTU à vérifier, sans lien TER/BRT artificiel

**Éléments confirmés**
- DDD publie Lat Dior comme terminus de la ligne 11 et comme arrêt sur les lignes 18 et 20.
- Le référentiel AFTU contient un point Lat Dior, mais sa position est un point de référence simplifié et non un quai confirmé.

**Solution idéale**
- Vérifier le terminus réel de la ligne AFTU associée et son accès piéton par rapport à l'arrêt DDD Lat Dior.
- Si les deux arrêts sont dans le même terminus, créer une correspondance locale ; sinon, tracer une liaison piétonne mesurée.
- Ne pas relier Lat Dior au TER ou au BRT : aucun pôle commun n'est établi par les sources consultées.

**Décision actuelle :** candidat DDD ↔ AFTU à vérifier ; aucune liaison ajoutée.

## Règles de calcul recommandées

1. Utiliser un point d'accès réel par quai ou terminal, pas une coordonnée de quartier partagée artificiellement.
2. Mesurer la marche sur le réseau piéton (trottoirs, passages piétons, entrées accessibles), pas à vol d'oiseau.
3. Ajouter le temps de marche au temps total de l'itinéraire multimodal ; ajouter un temps de transfert opérationnel seulement s'il est justifié.
4. Prévoir les correspondances dans le bon sens de desserte ; ne jamais inverser automatiquement une séquence de ligne explicitement directionnelle.
5. Pour les personnes à mobilité réduite, privilégier les cheminements sans marche, avec traversées protégées et rampes confirmées.
6. Garder les transferts non vérifiés comme candidats internes, sans les présenter comme disponibles à l'usager.

## Sources officielles

1. CETUD — [Les caractéristiques techniques du Projet BRT](https://cetud.sn/les-caracteristiques-techniques-du-projet-brt/) : pôles de Guédiawaye et Grand Médine, terminus et lignes de rabattement, principes de cheminements piétons.
2. CETUD — [Plan d'engagement des parties prenantes du BRT](https://cetud.sn/wp-content/uploads/2025/09/plan-dengagement-des-parties-prenantes-du-BRT-mis-a-jour.pdf) : pôle de Guédiawaye devant la mosquée Souleymane BAAL et transfert BRT ↔ AFTU / DDD.
3. CETUD — [Mise en service de la nouvelle gare routière de Colobane](https://cetud.sn/transport-mise-en-service-de-la-nouvelle-gare-routiere-de-colobane-financee-par-le-cetud/) : gares DDD et AFTU distinctes et intégration TER envisagée.
4. CETUD — [Plan de Mobilité Urbaine Durable de Dakar](https://cetud.sn/wp-content/uploads/2026/03/1-CETUD-PMUD-DK_RAPPORT-1.pdf) : pôle d'échange multimodal Grand Médine.
5. Dakar Dem Dikk — [Réseau urbain Dakar](https://demdikk.sn/reseau-urbain-dakar/) : dessertes DDD de Grand Médine, UCAD, Colobane et Lat Dior.
6. Dakar Dem Dikk — [Information voyageurs](https://demdikk.sn/info-voyageurs/) : liste publiée des lignes urbaines, banlieue et services au départ de Colobane.
7. TER Sénégal — [Gare de Colobane](https://ter-senegal.sn/colobane/) : informations voyageurs de la gare TER.

## Périmètre préservé

- Aucun tracé, arrêt, horaire ou intervalle TER/BRT n'a été modifié.
- Les correspondances TER ↔ BRT déjà présentes et les trois transferts Petersen restent inchangés.
- Le nom public des minibus reste **AFTU** ; TATA n'est pas présenté comme un réseau distinct.
- GTFS n'est pas requis pour ce chantier.
