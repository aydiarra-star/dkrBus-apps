# Mémoire de mobilités Supabase — Dakar Bus

## Objectif

Supabase conserve un référentiel durable et versionné pour les cinq réseaux TER, BRT, DDD, AFTU et TATA. L'assistant le consulte en lecture seule. Ce référentiel complète les données locales sans remplacer les panneaux TER/BRT déjà validés dans l'application.

## API utilisée par l'assistant

- Lecture complète : `GET /functions/v1/dakar-bus-knowledge`
- Recherche ciblée préparée pour les appels directs : `GET /functions/v1/dakar-bus-mobility-search?q=Colobane&network=ter` (endpoint distinct, non utilisé par le client dans cette PR).
- Le client web utilise uniquement la clé publique `sb_publishable_`. La clé `service_role` n'est jamais intégrée au navigateur.
- Le client télécharge le référentiel complet au premier échange mobilité, le conserve en mémoire et le rafraîchit au plus toutes les cinq minutes.
- La question, la conversation, la position GPS et les préférences de l'utilisateur ne sont pas envoyées à Supabase par cette intégration.
- Si Supabase ne répond pas, le moteur local continue de fonctionner.

## Référentiel présent

| Réseau | Lignes / unités de référence | Directions | Séquences d'arrêts |
|---|---:|---:|---:|
| DDD | 38 lignes | 76 | 1 344 |
| AFTU | 72 lignes | 144 | 1 972 |
| TATA | 62 lignes | 124 | 1 500 |
| BRT B1 | 23 stations | 2 sens | 46 |
| TER | 13 gares | 2 sens | 26 |

Les séquences sont enregistrées par sens. Les sens retour reconstruits sont identifiés comme tels et ne sont pas promus automatiquement. TATA reste un catalogue distinct d'AFTU.

### Fréquences

- TER et BRT : les références validées sont conservées sans modification et rattachées à leurs versions. Leurs références de fréquence sont disponibles dans les deux sens.
- BRT B2 : une référence de fréquence du lundi au samedi est enregistrée ; le dimanche reste inconnu.
- DDD : repères de service et intervalles de référence stockés séparément des horaires exacts.
- AFTU : référence moyenne de 11,6 minutes et attente de référence de 8 minutes ; les lignes ayant des horaires particuliers gardent leurs propres fiches.
- TATA : repère partagé AFTU/TATA de 12 minutes et attente de 8 minutes, clairement noté comme référence partagée, pas comme mesure TATA autonome.

Aucune fréquence ne constitue l'heure du prochain véhicule. Aucun temps réel n'est fabriqué.

## Limites connues

- Le GTFS reste hors du chemin critique, conformément à la décision du projet. Les tables de courses et de passages exacts restent vides tant qu'une source fiable n'est pas disponible.
- Les tracés géométriques complets des lignes ne sont pas encore importés.
- La couverture géographique des arrêts DDD/AFTU/TATA est incomplète. Les coordonnées existantes ne sont pas remplacées par des suppositions.
- Deux correspondances piétonnes sont enregistrées ; elles ne représentent pas encore toutes les correspondances possibles.
- Les tables `mobility_osm_stops` et `mobility_stop_geocode_matches` préparent une couche de propositions OpenStreetMap. Une proposition ne modifie jamais directement la coordonnée canonique d'un arrêt.

## Alertes et circulation

- Dakaractu et SeneNews sont interrogés périodiquement comme sources de presse.
- Les articles restent des candidats non vérifiés. Ils ne deviennent jamais automatiquement des alertes confirmées.
- L'APS RSS a refusé l'accès automatisé ; Google News n'a pas fourni de réponse exploitable.
- Waze for Cities nécessite un accès partenaire. Les applications ADS Mobilité et Sunu Autoroute ne fournissent pas, à ce stade, de flux public développeur vérifié.
- Le système ne prétend donc pas disposer d'un capteur de circulation en direct. Aucune alerte confirmée n'est publiée sans preuve suffisante.

## Sécurité

- Les tables du référentiel ont RLS activé et ne sont pas lisibles directement par les rôles `anon` et `authenticated`.
- Les opérations d'ingestion utilisent les fonctions Edge et le rôle serveur.
- Le jeton d'ingestion est conservé dans Supabase Vault et vérifié côté serveur.
- Les données brutes du dépôt ne sont pas exposées par l'API publique de connaissance.
- Les fonctions de lecture publique ne donnent aucun droit d'écriture sur les tables.

## Règles de préservation

1. Ne jamais modifier les valeurs TER/BRT validées sans accord explicite.
2. Ne jamais fusionner TATA dans AFTU.
3. Ne jamais transformer une séquence candidate ou un sens retour dérivé en donnée publiée sans validation.
4. Ne jamais déduire un horaire exact d'un intervalle de fréquence.
5. Ne jamais publier une position de véhicule ou une alerte trafic sans source horodatée et fraîche.
6. Conserver les versions précédentes pour permettre l'audit et le retour arrière.
