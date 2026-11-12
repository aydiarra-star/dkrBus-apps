# Supabase Edge Functions

Les sources de toutes les fonctions Edge actuellement déployées sont versionnées dans ce dossier.

## Fonctions

| Fonction | Accès | Rôle |
|---|---|---|
| `dakar-bus-knowledge` | GET public, lecture seule | Référentiel des cinq mobilités et état trafic ; les métadonnées publiques sont filtrées. |
| `dakar-bus-mobility-search` | GET public, lecture seule | Recherche ciblée DDD/AFTU/TATA uniquement ; TER/BRT sont exclus pour préserver le référentiel local validé. |
| `dakar-bus-traffic-ingest` | JWT Supabase requis + jeton d'ingestion | Entrée d'administration pour l'ingestion trafic. |
| `dakar-bus-traffic-ingest-senenews` | Jeton d'ingestion privé | Collecte périodique du flux RSS SeneNews. |
| `dakar-bus-traffic-ingest-dakaractu` | Jeton d'ingestion privé | Collecte périodique du flux RSS Dakaractu. |
| `dakar-bus-osm-stops-sync` | Jeton d'ingestion privé | Propositions OpenStreetMap pour les arrêts ; aucun cron n'est activé. |

## Secrets

Les secrets d'exécution restent dans Supabase Vault et ne doivent jamais être copiés dans GitHub :

- `dakar_bus_ingest_token` : jeton privé des collecteurs.
- Les clés serveur Supabase ne doivent jamais être exposées dans le navigateur.
- Le client web utilise uniquement la clé publique `sb_publishable_`.

Les collecteurs RSS et OSM utilisent le jeton privé côté serveur. Les endpoints de connaissance et de recherche ne permettent aucune écriture directe.

## Déploiement

Après validation du code et des migrations, une fonction peut être déployée avec :

```bash
supabase functions deploy dakar-bus-knowledge --project-ref mdmuxzaewqzqutkqdylo
```

Ne pas déployer une fonction d'ingestion sans vérifier la présence du secret Vault et les droits du rôle serveur.

## Limite importante sur les migrations

L'historique SQL déjà appliqué est conservé dans `docs/archives/supabase-migrations-2026-11-12.sql` pour audit. Cette archive n'est pas une chaîne locale complète de migrations Supabase CLI. **Ne pas lancer `supabase db push`** sur le projet existant tant que l'historique complet n'a pas été reconstitué en fichiers `supabase/migrations` et comparé au schéma distant.
