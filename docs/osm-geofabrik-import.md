# Import OSM des arrêts de Dakar depuis Geofabrik

## Pourquoi cette voie

L'accès Overpass depuis l'Edge Function a échoué avec des délais d'attente et un refus HTTP 406. Le chantier utilise donc un extrait PBF public Geofabrik Sénégal-Gambie, puis filtre localement les objets OSM dans une emprise élargie couvrant la région de Dakar, y compris les secteurs de Sangalkam, Bambilor, Yène et Diamniadio. Cela évite de multiplier les requêtes sur des serveurs Overpass bénévoles.

Source : https://download.geofabrik.de/africa/senegal-and-gambia-latest.osm.pbf

Attribution obligatoire : © OpenStreetMap contributors, licence ODbL 1.0.

## Garde-fous

- Seuls les arrêts de bus, plateformes et positions d'arrêt bus OSM sont retenus.
- L'emprise est limitée à Dakar : latitude 14.60–14.91, longitude -17.56–-17.12.
- Les objets sont envoyés par lots de 100 à la fonction Supabase protégée par le jeton d'ingestion.
- Les coordonnées restent dans `mobility_osm_stops` comme candidates.
- Le rapprochement crée des propositions ; aucune coordonnée de `mobility_stops` n'est remplacée.
- Le workflow est manuel uniquement. Aucun cron n'est activé avant un premier import et une vérification humaine.
- Les relances sont idempotentes grâce à la clé OSM (type + identifiant). Un échec en cours de traitement peut laisser des lots déjà importés ; relancer le même import met à jour les mêmes objets au lieu de les dupliquer.

## Préparer le premier lancement

Dans GitHub, ouvrir le dépôt **Settings → Secrets and variables → Actions → New repository secret** et créer les trois secrets suivants :

| Nom du secret | Valeur |
|---|---|
| `DAKAR_BUS_SUPABASE_URL` | URL du projet Supabase Dakar Bus |
| `DAKAR_BUS_SUPABASE_PUBLISHABLE_KEY` | Clé publique `sb_publishable_` du même projet |
| `DAKAR_BUS_INGEST_TOKEN` | Valeur du jeton d'ingestion OSM déjà conservé dans Supabase Vault |

Ne jamais mettre ces valeurs dans un fichier du dépôt, un commit, un journal ou un message. Ne pas utiliser la clé `service_role`.

Le workflow est en mode manuel uniquement. GitHub ne permet de lancer `workflow_dispatch` que lorsque le fichier du workflow existe aussi sur la branche par défaut. Il sera donc disponible après intégration contrôlée de cette modification dans `main`. Avant le premier lancement, la fonction Edge Supabase doit également être déployée avec le nouveau mode `ingest_pbf_batch`.\n\nAprès intégration, déploiement de la fonction et ajout des secrets : **Actions → Dakar Bus OSM import (Geofabrik) → Run workflow**. Le premier lancement doit être examiné avant toute programmation récurrente.

## Critères d'acceptation

1. Le workflow termine avec succès et indique un nombre d'objets importés supérieur à zéro.
2. Les noms, types, coordonnées et liens OSM sont contrôlés sur un échantillon.
3. Les propositions de rapprochement sont limitées et pertinentes.
4. Les coordonnées officielles préexistantes restent strictement identiques.
5. Aucun arrêt OSM candidat n'est présenté comme arrêt officiel avant validation.
