# Réconciliation des migrations Supabase — Dakar Bus

Date de l'inventaire : 2026-11-12  
Projet Supabase : `mdmuxzaewqzqutkqdylo`  
Dépôt : `aydiarra-star/dkrBus-apps`

## Résultat vérifié

- L'historique distant Supabase contient **33 migrations**.
- La branche `main` du dépôt contient actuellement **un seul fichier SQL** dans `supabase/migrations/` :
  `20261112070502_repair_ddd_reverse_sequences_v1.sql`.
- Ce fichier correspond bien à l'entrée distante de version `20261112070502`.
- Les **32 autres entrées** sont présentes dans l'historique Supabase, mais leurs fichiers SQL ne sont pas présents dans le dossier de migrations de `main`.

Cette divergence signifie que l'historique distant ne peut pas être reproduit à partir du seul dossier de migrations actuellement versionné.

## Inventaire de l'historique distant

| Version | Nom enregistré dans Supabase | Fichier SQL sur `main` |
|---|---|---|
| 20261112061808 | dakar_bus_persistent_mobility_memory_v1 | absent |
| 20261112061931 | dakar_bus_catalogue_staging_v1 | absent |
| 20261112061954 | catalogue_records_network_scoped_identity | absent |
| 20261112062046 | preserve_existing_reference_snapshots_v1 | absent |
| 20261112062205 | ter_brt_reference_stop_identity_v1 | absent |
| 20261112062324 | traffic_sources_and_community_reports_v1 | absent |
| 20261112062338 | index_mobility_foreign_keys_v1 | absent |
| 20261112062558 | candidate_route_waypoint_sequences_v1 | absent |
| 20261112062738 | scheduled_traffic_incident_expiry_v1 | absent |
| 20261112062741 | candidate_waypoint_source_index_v1 | absent |
| 20261112062813 | traffic_source_registry_metadata_v1 | absent |
| 20261112062843 | traffic_press_feed_deduplication_v1 | absent |
| 20261112062855 | index_candidate_waypoint_source_fk_v1 | absent |
| 20261112062857 | aps_rss_ingestion_support_v1 | absent |
| 20261112062928 | schedule_aps_traffic_rss_ingestion_v1 | absent |
| 20261112063026 | grant_backend_service_role_access_v1 | absent |
| 20261112063236 | complete_knowledge_graph_metadata_v1 | absent |
| 20261112063415 | remove_redundant_candidate_waypoint_source_index_v1 | absent |
| 20261112063500 | service_pattern_ranges_and_wait_estimates_v1 | absent |
| 20261112063609 | traffic_incident_rejection_status_v1 | absent |
| 20261112063659 | schedule_dakar_bus_rss_traffic_ingestion_v1 | absent |
| 20261112063751 | schedule_local_news_traffic_monitors_v1 | absent |
| 20261112063759 | traffic_source_freshness_monitor_v1 | absent |
| 20261112063926 | lock_down_pg_net_schema_v1 | absent |
| 20261112064358 | remove_unused_rss_cron_wrapper_v1 | absent |
| 20261112064515 | add_brt_b2_validated_weekday_reference_v1 | absent |
| 20261112064717 | complete_ddd_502_503_loop_sequences_v1 | absent |
| 20261112070502 | repair_ddd_reverse_sequences_v1 | présent |
| 20261112070508 | mobility_osm_candidate_layer_and_search_functions_v1 | absent |
| 20261112071637 | restrict_pg_net_client_access_v1 | absent |
| 20261112081744 | harden_pg_net_and_private_sequence_backups_v1 | absent |
| 20261112081821 | ensure_pg_net_public_grants_revoked_v1 | absent |
| 20261112081841 | revoke_public_net_http_post_execution_v1 | absent |

## Mesures de prudence

1. **Ne pas rejouer** les migrations manquantes sur la base actuelle : elles sont déjà enregistrées comme appliquées et certaines ont pu modifier des données, des fonctions, des tâches planifiées ou des droits.
2. **Ne pas fabriquer** les fichiers SQL historiques à partir de leurs seuls noms. Un nom ne permet pas de reconstituer le SQL exact ni son effet.
3. Ne pas modifier les horaires, arrêts ou séquences TER/BRT validés dans le cadre de cette réconciliation.
4. Conserver les trois tentatives de correction des droits `pg_net` comme opérations historiques distinctes. Les droits effectifs doivent être vérifiés dans PostgreSQL ; l'inscription d'une migration dans le journal ne prouve pas à elle seule que les privilèges ont changé.
5. Garder actives les tâches `dakar-bus-dakaractu-rss-ingest` et `dakar-bus-senenews-rss-ingest`. Lors du contrôle du 2026-11-12, elles étaient actives, planifiées toutes les 15 minutes et leur dernière exécution était `succeeded`.

## Plan de remise en cohérence

1. Faire un inventaire en lecture seule de l'état réel : tables, colonnes, contraintes, index, fonctions, déclencheurs, politiques RLS, extensions, privilèges, tâches Cron et fonctions Edge.
2. Récupérer les SQL d'origine depuis les journaux de travail ou les commits qui les ont réellement appliqués, quand ils sont disponibles. Les comparer aux objets présents dans la base.
3. Pour chaque migration sans source retrouvée, documenter explicitement « source SQL introuvable » plutôt que de reconstituer une fausse migration.
4. Construire une procédure de référence pour une **nouvelle base vide** (baseline/schéma initial), distincte de l'historique de production. La valider sur une base de test avant toute utilisation.
5. Ajouter ensuite les migrations futures au dépôt avant leur application, avec vérification des effets et des droits après exécution.

## Statut

Ce document est un inventaire et un plan de réconciliation. Il ne modifie pas la base Supabase, ne rejoue aucune migration et ne constitue pas une baseline exécutable.
