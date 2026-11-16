# Audit du moteur multimodal DakarBus — 16 novembre 2026

## Pourquoi ce document existe

L'interface de planification et le moteur de référence sont deux chantiers distincts. L'interface P1–P4 est maintenant branchée sur les préférences de réseaux. Le moteur P5 doit encore gagner en couverture géographique et en précision avant de pouvoir prétendre couvrir l'ensemble du réseau de Dakar.

Ce document distingue les données effectivement présentes dans le dépôt, les sources opérateurs accessibles et les éléments qui ne doivent pas être inventés.

## État constaté dans le dépôt

Fichier de référence : `src/domain/corridors.ts`.

- 9 corridors déclarés dans `CORRIDOR_LINES` : 1 TER, 1 BRT, 3 DDD et 4 AFTU/TATA.
- 70 points d'arrêt déclarés : 14 TER, 23 BRT, 14 DDD, 13 AFTU et 6 TATA.
- 6 correspondances inter-réseaux explicitement déclarées dans `CORRIDOR_TRANSFERS`.
- Les points DDD/AFTU/TATA sont documentés dans le code comme des pôles principaux ou des coordonnées approximatives, pas comme une base exhaustive de quais.
- Les transferts sont des distances manuelles `walkM`. Le moteur ne calcule pas encore un chemin piéton réel sur le graphe de rues pour chaque transfert.
- Le moteur `src/domain/planner.ts` calcule les accès et sorties à partir des distances géographiques entre points, des vitesses configurées et des corridors connus. Les durées de transport sont des estimations de modèle quand les fréquences officielles ne sont pas disponibles.
- Les tarifs inconnus restent inconnus ; le moteur ne doit pas annoncer « le moins cher » si les prix des lignes concernées ne sont pas publiés.

**Conséquence :** le moteur actuel est un prototype multimodal de référence utile pour des corridors connus, mais il ne représente pas encore les 38 lignes DDD et 72 lignes AFTU annoncées par le CETUD. Il ne faut pas présenter sa couverture actuelle comme exhaustive.

## Données de recherche déjà présentes, mais pas encore activées dans le graphe

Le dépôt contient davantage de preuves que les seuls corridors actifs de `CORRIDOR_LINES`. Il faut distinguer ces couches :

- `src/data/dddOfficialPublishedRoutes.ts` et ses modules transcrivent les séquences textuelles publiées par DDD. Elles conservent la source, la date de récupération et le fait que le sens retour et les coordonnées ne sont pas certifiés.
- Les scripts d'audit ArcGIS/OSM produisent des séquences géométriques candidates, mais elles ne sont pas des arrêts commerciaux validés.
- Les fichiers directionnels AFTU contiennent des séquences distinctes aller/retour pour une partie des lignes ; les chaînes d'arrêts ne sont pas encore géocodées.
- Les lignes TATA ont des séquences sources dans un jeu séparé ; les sens retour ne sont pas disponibles pour la totalité des lignes.

### Résultats d'audit automatique disponibles le 16 novembre 2026

Le workflow Dakar Bus CI (run 4685) a produit les artefacts suivants :

| Jeu | Résultat | Interprétation |
|---|---|---|
| DDD ArcGIS | 18 lignes candidates, 593 points d'arrêt candidats, 6 groupes exclus | Candidats géométriques, pas d'activation automatique |
| Recoupement DDD / séquences officielles | 14/18 compatibles avec l'ordre publié, 4 non résolues | Compatibilité de noms et d'ordre seulement ; certification de sens : aucune |
| AFTU | 28 lignes avec les deux sens, 18 avec les horaires des deux sens, 0 point géocodé, 629 libellés génériques | Séquences directionnelles existantes, géocodage et nettoyage requis |
| TATA | 62 lignes, 0 séquence retour, 0 point géocodé | Sens retour et géocodage requis |
| Rapprochement flou des noms AFTU/TATA | 1 373 noms uniques, 16 propositions, 13 propositions multi-clusters | Aide à la revue humaine, jamais fusion automatique |

Les artefacts sont des résultats d'audit. Ils ne doivent pas être importés directement dans le calculateur : les 593 points ArcGIS ne sont pas certifiés comme arrêts voyageurs actuels ; les séquences AFTU/TATA ne possèdent pas encore de coordonnées fiables ; un nom générique « Arrêt de bus » ne peut pas devenir un quai GPS.

**Conséquence produit :** le travail de collecte et de rapprochement est déjà avancé. Le goulot d'étranglement n'est plus seulement la découverte des lignes : c'est l'identification fiable des quais, le géocodage, la vérification du sens retour et la validation des cheminements piétons.

## Sources opérateurs et portée

### Dakar Dem Dikk

- Page officielle « Info voyageurs » : liste les lignes urbaines, de banlieue et les dessertes de gares TER, avec terminus et horaires pour certaines dessertes : https://demdikk.sn/info-voyageurs/
- Page officielle « Réseau urbain Dakar » : publie des séquences d'arrêts pour plusieurs lignes urbaines et de banlieue : https://demdikk.sn/reseau-urbain-dakar/
- Page CETUD DDD : annonce 38 lignes et 400 autobus : https://cetud.sn/reseaux-de-transport/ddd/

**Utilisation recommandée :** prendre les séquences d'arrêts publiées par DDD comme référence de ligne, versionner chaque extraction, et ne géocoder que les arrêts nommés. Les arrêts intermédiaires non géocodés ne doivent pas être remplacés par une ligne droite entre les terminus.

### AFTU / TATA

- Page CETUD AFTU : annonce 72 lignes, 2 300 bus et 14 GIE : https://cetud.sn/reseaux-de-transport/aftu/
- Guide officiel de mobilité Dakar 2026 publié par le CETUD/MITTA : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf
- Le guide 2026 nomme des lignes AFTU et leurs terminus et donne une carte de réseau. Il a été conçu pour la période des JOJ du 31 octobre au 13 novembre 2026 : les consignes temporaires, fréquences de navettes et déviations événementielles ne doivent pas être reprises comme service permanent après l'événement.

**Utilisation recommandée :** utiliser les lignes/terminus du guide comme pistes de structuration et de rapprochement, puis confirmer les séquences et le service courant auprès des opérateurs/CETUD avant activation dans le calculateur. Une liste de terminus ne suffit pas à reconstituer une séquence complète de quais.

### TER et BRT

Les tracés et horaires de référence déjà validés dans l'application sont gelés pour ce chantier. Aucune modification de leurs séquences, fréquences ou horaires n'est autorisée dans cette livraison. Toute amélioration doit être additive et testée contre les jeux de référence existants.

## Architecture cible du calculateur

1. **Graphe multimodal versionné** : un arrêt physique, une plateforme/quai et un point d'accès piéton sont des objets distincts. Chaque ligne possède un identifiant stable, un sens, une séquence ordonnée d'arrêts, une source et une période de validité.
2. **Réseaux filtrables** : le graphe de recherche reçoit les réseaux autorisés par l'utilisateur. Le filtre doit agir sur les lignes et les correspondances, pas seulement sur l'affichage.
3. **Accès et sortie piétons** : utiliser un moteur de routage piéton sur voirie (par exemple un service Valhalla/GraphHopper/OSRM piéton approprié) et conserver la géométrie de marche, la distance routée, la durée, les traversées et les restrictions accessibles. La distance à vol d'oiseau sert uniquement à présélectionner des candidats, jamais à certifier un chemin.
4. **Correspondances inter-réseaux** : une liaison est activée seulement après vérification du chemin piéton réel entre les plateformes, du côté de rue, de l'accès, des barrières et du temps de marche. Conserver source, date, précision GPS et niveau de validation.
5. **Temps de trajet** : combiner marche, attente, roulement, arrêt intermédiaire et battement de correspondance. Séparer les horaires publiés, les fréquences officielles et les estimations de fréquence. Ajouter une heure de départ choisie par l'utilisateur avant de promettre un horaire d'arrivée.
6. **Tarification** : appliquer les grilles publiées par opérateur/ligne et classe. Un tarif partiel ou inconnu doit être explicitement présenté comme tel ; aucune comparaison « moins cher » si le prix total n'est pas calculable.
7. **Alternatives** : calculer indépendamment le plus rapide, le moins de marche, le moins de changements et le moins cher quand les données tarifaires le permettent. Dédupliquer les parcours identiques.
8. **Qualité et sécurité** : conserver la provenance par arrêt, ligne, fréquence, tarif et transfert ; tests de non-régression sur TER/BRT ; tests de couverture par quartiers ; aucune correspondance générée à partir d'une simple proximité de coordonnées.

## Chantiers de données à exécuter ensuite

### A. DDD — priorité haute

- Extraire les lignes et séquences publiées sur les deux pages officielles DDD.
- Comparer les lignes urbaines, banlieue et dessertes TER pour éliminer les doublons de nom et distinguer les services.
- Géocoder chaque arrêt nommé et stocker sa source ; contrôler les points terminus et les quais réels.
- Compléter d'abord les corridors utiles vers Ngor, Yoff, Ouakam, Mermoz, Sangalkam, Pikine, Rufisque, Bargny, Keur Massar et Diamniadio.
- N'activer une ligne dans le graphe que lorsque sa séquence et ses points essentiels sont suffisamment étayés.

### B. AFTU/TATA — priorité haute

- Transformer la liste de lignes/terminus du guide CETUD 2026 en registre de lignes à vérifier.
- Récupérer les séquences complètes auprès de CETUD/AFTU ou des sources cartographiques opérateurs.
- Distinguer clairement le numéro de ligne, le GIE, le terminus et les arrêts desservis.
- Ne pas considérer la carte image comme une séquence de quais exacte sans géoréférencement et contrôle.

### C. Correspondances piétonnes — priorité critique

- Auditer en premier les pôles Petersen, Colobane, Place de la Nation, Guédiawaye, Rufisque, Bargny, Keur Massar et Diamniadio.
- Remplacer les distances manuelles non confirmées par des chemins piétons calculés et vérifiés.
- Enregistrer les entrées de gare/station, quais, traversées, accès PMR lorsqu'ils sont connus et points de montée effectifs.
- Garder les liaisons non vérifiées hors du graphe actif ; les afficher seulement comme candidates d'audit.

### D. Tests de recette

- Cas directs TER et BRT : mêmes horaires, séquences et résultats de référence qu'avant.
- Cas directs DDD/AFTU avec séquences opérateur vérifiées.
- Cas combinés TER+BRT, BRT+DDD, BRT+AFTU, DDD+AFTU seulement si le transfert piéton est validé.
- Cas origine/destination à plus de 1 km d'un arrêt, pour contrôler accès et sortie.
- Cas réseau désactivé, sens inverse, service fermé, absence de tarif et absence de chemin piéton.
- Comparer chaque résultat avec un calcul manuel et conserver un jeu de tests géographiques.

## Critère de sortie P5

La partie moteur ne sera considérée comme fiable que lorsque :
- les lignes affichées ont une séquence traçable et une source datée ;
- les transferts ont un chemin piéton réel validé ;
- les temps et tarifs indiquent leur niveau de preuve ;
- les alternatives sont réellement distinctes ;
- les cas de recette des pôles et corridors sont passés ;
- les tracés et horaires TER/BRT de référence restent inchangés.

Aucun GTFS n'est requis pour commencer ces travaux ; lorsqu'un GTFS officiel sera reçu, il pourra remplacer les séquences estimées après validation et tests de régression.
