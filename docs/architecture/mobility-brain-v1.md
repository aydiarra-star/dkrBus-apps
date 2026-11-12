# Architecture cible — cerveau de mobilité Dakar Bus (V1)

**Statut : proposition d'architecture, non déployée.**  
**Date : 12 novembre 2026**  
**Périmètre :** mémoire centrale du réseau, calcul d'itinéraires, assistant conversationnel, wolof et alertes.  
**Règle de sûreté :** ce document ne modifie aucune donnée, aucun horaire, aucune fréquence, aucun tracé TER/BRT et aucun comportement de l'application.

## 1. Décisions structurantes

1. **Une source de vérité structurée, versionnée et traçable.** Les données réseau validées résident dans PostgreSQL. Chaque fait possède une provenance, un statut de validation et des dates de validité.
2. **Le calculateur reste déterministe.** L'IA ne choisit pas elle-même des arrêts, des lignes ou des correspondances. Elle appelle des fonctions serveur autorisées, reçoit des résultats calculés, puis les explique.
3. **Séparer connaissance réseau et mémoire personnelle.** Le référentiel réseau est partagé par tous. Les préférences, lieux favoris et contextes de trajet d'un voyageur sont privés, facultatifs et soumis à une politique de conservation distincte.
4. **Pas de dépendance au GTFS pour démarrer.** Les données actuelles peuvent être importées progressivement. Un import GTFS futur devient un adaptateur d'entrée soumis aux mêmes contrôles, pas une nouvelle architecture.
5. **Aucune migration destructive.** Les JSON, modules TER/BRT, règles de fréquence et tests actuels restent en place jusqu'à comparaison, validation et plan de retour arrière.
6. **Aucune affirmation de temps réel sans preuve fraîche.** Une fréquence théorique, un signalement usager et un incident officiel sont trois types d'information différents.

## 2. Architecture logique

```text
Application web / PWA (GitHub Pages)
              |
        HTTPS, API publique
              |
     API Dakar Bus (Render)
       |        |         |
       |        |         +---- Collecteurs trafic autorisés
       |        |
       |        +-------------- Orchestrateur IA
       |                           |
       |                    outils strictement bornés
       |                           |
       +---------------------------+
                   |
          PostgreSQL / Supabase
          |          |          |
       Réseau     Sources    Conversations
       PostGIS    & preuves  privées/RLS
          |
       pgvector (optionnel, recherche sémantique)
```

- **Frontend :** interface actuelle conservée. Aucun secret fournisseur ou clé privilégiée dans le bundle public.
- **API serveur :** seule porte d'accès à la base et au fournisseur IA. Authentification, validation d'entrées, limitation de débit, journalisation et contrôle des droits.
- **Supabase :** PostgreSQL comme stockage central ; PostGIS pour les recherches géographiques. pgvector uniquement si les tests démontrent un bénéfice pour retrouver les fiches et documents.
- **Render :** hébergement de l'API et des tâches de collecte planifiées. Le serveur ne doit pas exposer la console locale de gouvernance existante au public.
- **IA :** fournisseur interchangeable derrière une interface serveur. Le modèle ne reçoit que les données nécessaires à la question.

## 3. Référentiel de couverture et faits vérifiés (12 novembre 2026)

Les nombres d'opérateurs sont des **indicateurs officiels publiés par le CETUD**, pas un comptage automatique des fiches importées dans l'application.

| Réseau | Nombre de lignes publié | Couverture candidate constatée dans le dépôt | Écart / règle |
|---|---:|---:|---|
| DDD | 38 | 37 fiches | 1 ligne d'écart à identifier ; ne pas fabriquer une fiche |
| AFTU | 72 | 72 fiches | Les fiches ne signifient pas que les 72 parcours aller-retour sont complets |
| **Total DDD + AFTU** | **110** | **109** | **110 lignes annoncées officiellement, 109 fiches candidates actuellement** |

Source DDD : https://cetud.sn/reseaux-de-transport/ddd/  
Source AFTU : https://cetud.sn/reseaux-de-transport/aftu/ (72 lignes, 14 GIE, 2 300 bus).

Le référentiel doit conserver séparément :
- `official_line_count` : nombre publié par l'autorité, avec source et date d'observation ;
- `catalogue_record_count` : nombre de fiches réellement présentes dans une version du catalogue ;
- `verified_route_count` : nombre de lignes dont les parcours ont été contrôlés ;
- `complete_bidirectional_route_count` : nombre de lignes dont les deux directions ont été vérifiées.

Ces indicateurs ne doivent jamais être confondus.

### Mise à jour majeure TER — phase 2 jusqu'à l'AIBD

La mise en service commerciale de la section Diamniadio–AIBD est confirmée le **28 septembre 2026** par l'Agence de Presse Sénégalaise :
- 19 km supplémentaires en double voie électrifiée ;
- 55 km de linéaire total annoncé ;
- nouvelle gare AIBD ;
- fréquence annoncée par le ministre : 8 minutes entre Dakar et Diamniadio, 24 minutes entre Diamniadio et AIBD ;
- gare voyageurs de Sébikotane encore à réaliser à la date de l'annonce ; une navette de bus vers Diamniadio est annoncée en attendant.

Source : https://aps.sn/train-express-regional-la-phase-diamniadio-aibd-inauguree-un-investissement-de-plus-de-300-milliards-fcfa/ (28 septembre 2026, lignes 64–81). Le ministère a également communiqué un temps de parcours Dakar–AIBD d'environ 55 minutes : https://fr.linkedin.com/posts/ministere-des-transports-terrestres-aeriens_ter-aibd-diamniadio-activity-7510463677347717122--lfm.

**Conséquence pour la migration :** l'ancien référentiel de 13 gares Dakar–Diamniadio est une base historique à préserver, mais il ne représente plus à lui seul le périmètre actuel du TER. La phase 2 doit être ajoutée comme nouvelle version de données, sans réécrire l'historique. Ne pas inventer les stations intermédiaires, horaires complets, tarifs, jours de service ou arrêts voyageurs non confirmés. Les tarifs 4 000/7 500 FCFA et l'amplitude 05:40–22:00 fournis dans une information secondaire restent **à vérifier** avant publication.

### Extensibilité de la mémoire

Le modèle doit accepter de nouveaux réseaux et catégories sans modification structurelle du code à chaque ajout : lignes ferroviaires, bus urbains, cars interurbains, navettes aéroport, transport maritime, mobilité partagée, marche et vélo. Il doit également accueillir des entités futures liées aux travaux routiers, arrêts temporaires, pôles d'échange, accessibilité, billettique, parkings, événements et équipements voyageurs.

Ces catégories sont des capacités prévues du modèle, pas l'affirmation que ces services sont déjà exploités ou disponibles dans Dakar Bus.

## 4. Modèle de données cible

Les noms ci-dessous sont conceptuels. Ils ne constituent pas encore une migration SQL.

### Réseau et itinéraires

| Table | Rôle |
|---|---|
| `networks` | TER, BRT, DDD, AFTU, TATA et opérateurs associés |
| `lines` | Identité stable, code, réseau, terminus, statut |
| `directions` | Sens aller/retour explicites, terminus propres à chaque sens |
| `stops` | Arrêts, coordonnées, identifiants et noms alternatifs |
| `line_stops` | Séquence ordonnée des arrêts par ligne et direction |
| `transfers` | Correspondances déclarées, distance, cheminement, accessibilité et preuve |
| `service_calendars` | Jours, périodes, exceptions et dates de validité |
| `service_patterns` | Fréquences et plages de service, avec type théorique ou horaire publié |
| `shapes` | Géométries de parcours avec provenance et statut |

Chaque séquence d'arrêts est propre à une direction. Un retour ne doit jamais être généré automatiquement en inversant l'aller : les variantes de rues, arrêts et terminus peuvent différer.

### Sources, preuves et versions

| Table | Rôle |
|---|---|
| `sources` | Opérateur, URL, type de source, droits et contact |
| `source_observations` | Contenu observé, date de collecte, date de publication, empreinte |
| `data_assertions` | Fait candidat, valeur, provenance, confiance, validateur |
| `dataset_versions` | Versions immuables et état de validation/publication |
| `change_events` | Journal append-only des décisions et corrections |

Statuts minimaux : `CANDIDATE`, `VERIFIED`, `PUBLISHED`, `REJECTED`, `EXPIRED`. Une donnée non vérifiée peut être conservée pour étude mais ne doit pas être présentée comme une desserte confirmée.

Un fait publié doit au minimum porter : source, date de collecte, date d'effet si connue, validité, méthode de vérification, auteur/validateur et version. Les corrections créent une nouvelle version ; elles n'effacent pas l'historique.

### Alertes

`traffic_sources`, `traffic_observations`, `traffic_incidents`, `incident_impacts` et `user_reports`.

Un incident comporte : catégorie (route ou transport), localisation/zone, réseaux et lignes touchés si connus, source, observé à, confirmé à, expire à, statut et niveau de confirmation. Les signalements communautaires restent distincts des confirmations opérateur.

La règle de fraîcheur actuelle d'une heure est conservée comme base initiale, sans empêcher une source d'imposer une durée plus courte. Une observation ancienne ne devient jamais fraîche au seul motif qu'elle vient d'être téléchargée à nouveau.

### Mémoire du voyageur

Tables séparées : `conversations`, `conversation_messages`, `journey_contexts`, `user_preferences` et, si nécessaire, `saved_places`.

- Un contexte de trajet peut mémoriser départ, destination, étapes calculées et heure de calcul pour répondre à « et le retour ? ».
- La mémoire personnelle est liée à un compte ou à une session privée ; elle n'est jamais mélangée au référentiel public.
- Durée de conservation configurable, suppression/export possibles et collecte minimale.
- Ne pas conserver l'audio brut par défaut.
- Une session anonyme ne doit pas être transformée en profil durable sans information claire et consentement approprié.

## 5. Recherche et calcul d'itinéraires

Le serveur expose des outils métiers limités, par exemple :

- `search_stops(text, location, radius)`
- `get_line(line_id, direction)`
- `get_stop_board(stop_id, direction, at)`
- `plan_journey(origin, destination, preferences, departure_time)`
- `reverse_last_journey(conversation_id)`
- `get_transfer_details(from_stop, to_stop)`
- `get_current_alerts(area, network_ids)`

Ces outils lisent les données publiées et renvoient aussi leurs sources, limites et horodatages.

Le moteur d'itinéraires existant est conservé comme référence fonctionnelle pendant la transition. Les nouveaux parcours sont comparés à ses résultats sur un jeu de tests de référence. Une correspondance n'est utilisable que si elle est déclarée ou explicitement qualifiée comme estimation géographique ; le cheminement piéton réel et l'accessibilité ne sont jamais déduits d'une simple distance à vol d'oiseau.

Le modèle IA ne peut pas :
- écrire ou modifier le réseau ;
- exécuter du SQL arbitraire ;
- inventer une ligne ou compléter un sens retour manquant ;
- transformer une fréquence en heure exacte de passage ;
- annoncer « trafic fluide » lorsque la couverture des sources est partielle.

En cas d'absence de preuve, l'assistant répond qu'il ne sait pas et indique ce qui manque.

## 6. Recherche documentaire et mémoire sémantique

La recherche exacte (code de ligne, nom d'arrêt, alias, numéro) passe d'abord par PostgreSQL et ses index classiques. La recherche géographique passe par PostGIS.

pgvector est une couche secondaire pour retrouver des documents par leur sens, pas une source de vérité. Chaque résultat vectoriel doit pointer vers un document et une assertion sourcés. Les résultats sémantiques ne doivent pas pouvoir remplacer une recherche exacte de numéro de ligne ou d'identifiant d'arrêt.

Les documents sources sont conservés avec leur empreinte, leur date et leurs droits de réutilisation. Le contenu de pages web ou de documents importés est traité comme une donnée non fiable, jamais comme une instruction adressée au modèle.

## 7. Wolof et voix

La V1 doit d'abord améliorer la compréhension écrite français/wolof/mixte, avec un corpus validé par des locuteurs natifs :

- phrase originale, variante orthographique/phonétique et traduction française ;
- intention, entités transport, lieux et direction ;
- réponses de référence relues ;
- cas ambigus et formulation de clarification.

Le calcul d'itinéraire reste identique quelle que soit la langue : seule la compréhension et l'explication changent. Les noms officiels des lignes et arrêts restent inchangés, avec alias de recherche validés.

La reconnaissance vocale wolof et la synthèse vocale wolof sont des capacités séparées. Elles ne seront annoncées comme disponibles qu'après choix d'un moteur qui prend réellement en charge le wolof et tests avec locuteurs natifs. Aucun faux repli « wolof vocal » ne doit masquer une transcription française approximative.

## 8. Alertes et collecte

Ordre de priorité :

1. Flux/API opérateur autorisés et contractuellement réutilisables.
2. Flux publics explicitement documentés, sous réserve de leurs limites.
3. Signalements voyageurs, affichés comme non vérifiés jusqu'à corroboration.
4. Veille éditoriale conservatrice, qui peut signaler un bulletin mais ne constitue pas un flux exhaustif de trafic.

Chaque connecteur a un état indépendant : `LIVE`, `PARTIAL`, `STALE`, `UNAVAILABLE`, `NOT_CONFIGURED`. Le statut global est calculé à partir de la couverture réellement requise. Une panne, une réponse vide ou une absence d'incident ne prouve pas que les routes sont fluides.

Les collecteurs sont exécutés côté serveur, avec liste d'hôtes autorisés, délais, taille maximale, validation de schéma, absence de redirections vers des hôtes non approuvés et secrets dans les variables d'environnement. Les données périmées sont exclues des réponses actives.

## 9. Sécurité et confidentialité

- Clés privilégiées Supabase et clés IA uniquement côté serveur.
- RLS activé sur toutes les tables privées ; tests négatifs entre deux comptes.
- Le frontend public n'accède qu'aux vues/données publiées et aux fonctions API nécessaires.
- Les fonctions serveur utilisent des requêtes paramétrées et des outils métier en liste blanche.
- Limites de débit, quotas, validation stricte, protection contre prompt injection et filtrage des sorties.
- Journalisation sans secrets, jetons, audio brut ni coordonnées précises non nécessaires.
- Sauvegardes chiffrées et test de restauration avant toute migration importante.
- Les actions d'administration du réseau exigent un rôle nominatif, une revue et un historique non destructif.

## 10. Migration sans perte

### Phase 0 — gel et inventaire
- Épingler le commit de référence.
- Exporter et hacher les fichiers de données actuels.
- Inventorier les tests TER/BRT, horaires, fréquences, stations, panneaux et règles de compte à rebours.
- Identifier les PR de données encore ouvertes et ne pas les intégrer implicitement.

### Phase 1 — environnement central vide
- Créer un projet Supabase dédié à Dakar Bus.
- Activer PostGIS ; activer pgvector seulement si retenu après test.
- Créer les schémas et politiques de sécurité dans une branche de migration.
- Ne pas connecter l'application de production à cette base à ce stade.

### Phase 2 — import en parallèle
- Importer les 109 fiches documentaires et le référentiel TER/BRT en zone candidate.
- Préserver chaque identifiant, ordre, direction, source et note.
- Comparer les enregistrements importés aux fichiers d'origine par comptages, empreintes et échantillons.
- Ne publier aucun candidat automatiquement.

### Phase 3 — lecture parallèle
- Exécuter les recherches et calculs sur l'ancien moteur et le nouveau référentiel.
- Comparer résultats, directions, correspondances, distances et explications.
- Résoudre les écarts avec validation humaine ; aucun écart TER/BRT n'est accepté silencieusement.

### Phase 4 — API et assistant
- Déployer une API de lecture seule.
- Ajouter ensuite les outils IA autorisés.
- Garder un repli vers le moteur local en cas d'indisponibilité, sans prétendre que la mémoire distante a répondu.

### Phase 5 — activation progressive
- Activer derrière un indicateur de fonctionnalité pour les tests.
- Mesurer erreurs, latence, coût, réponses sans preuve et qualité des itinéraires.
- Prévoir retour immédiat à l'ancien moteur tant que les critères ne sont pas satisfaits.

### Phase 6 — trafic et wolof
- Raccorder séparément chaque source autorisée et tester son expiration.
- Valider le corpus wolof et la voix indépendamment.
- Étendre la couverture seulement après preuves et tests.

## 11. Tests et critères de sortie

**Non-régression réseau**
- Les 13 gares TER historiques restent conservées comme version antérieure ; la phase 2 jusqu'à l'AIBD est intégrée en version distincte après validation des arrêts voyageurs.
- Les 23 stations BRT de référence restent inchangées.
- Les indicateurs CETUD 38 DDD / 72 AFTU sont stockés séparément des fiches candidates (37 DDD / 72 AFTU).
- Aucun changement non autorisé des horaires, fréquences, séquences ou comptes à rebours.
- Les tests actuels TER/BRT continuent de passer.

**Qualité des itinéraires**
- Grand Yoff → UCAD, Grand Yoff → Diamniadio et sens inverse, avec départ et destination explicitement résolus.
- Étapes, lignes, arrêts de montée/descente et correspondances traçables.
- Aucun trajet proposé si les données ne permettent pas de l'établir.

**Mémoire**
- Un contexte de trajet est retrouvé après fermeture/réouverture selon la politique de session choisie.
- Les données privées d'un compte ne sont jamais visibles par un autre.
- Les préférences réseau partagées restent séparées des conversations personnelles.

**Alertes**
- Source, horodatage, zone, statut et expiration présents.
- Test d'incident frais, périmé, résolu, contradictoire et non géolocalisé.
- Une couverture partielle ne peut jamais produire un état « trafic fluide ».

**Wolof**
- Jeu de tests relu par des locuteurs natifs.
- Questions wolof, mixtes, variantes phonétiques, noms propres et demandes de retour.
- La voix n'est activée que sur un moteur réellement compatible.

**Exploitation**
- Build, tests frontend, tests de données, contrôles sécurité et restauration réussis.
- Coûts et quotas mesurés avant activation générale.
- Aucun secret dans les artefacts frontend.

## 12. État de ce document

Ce document décrit la cible et l'ordre de réalisation. Il n'a créé ni base Supabase, ni table, ni service Render, ni clé, ni migration, ni connexion IA. Il n'a modifié aucune donnée de transport.

La prochaine étape technique, après revue de cette architecture, est de préparer les migrations SQL et leurs tests dans une branche dédiée, sans les appliquer à une base de production.