# GTFS server-side validation architecture

## Decision

Keep `scripts/validate_gtfs.py` as the reference validator and execute it only in a trusted server-side worker. Do not duplicate its rules in the browser and do not trust any validation status supplied by the uploaded manifest.

The current `dakar-gtfs-ingest` Edge Function is an intake-only control plane: authenticate an active reviewer, accept bounded JSON commands, issue a short-lived signed upload token for a server-generated canonical path in the private bucket, and finalize only after checking the actual Storage object size. It never receives or materializes the archive bytes. The declared archive SHA-256 is recomputed by the dedicated worker after download. A successful intake must remain `PENDING_SERVER_CHECK`, `PENDING_REVIEW`, and `NOT_PUBLISHED`.

## Why validation must not run inside the intake Edge Function

The reference validator is not a lightweight header check. It reads the ZIP central directory, checks every archive entry, streams several CSV tables, maintains cross-reference indexes in SQLite, validates IDs/sequences/times/calendars/coordinates, and computes a SHA-256 digest. Its default limits permit a 100 MiB archive, 500 MiB uncompressed content, and up to two million rows per table.

Running that complete operation inside the upload request would couple upload reliability to expensive decompression and CSV processing. Supabase Edge Functions document a 2-second CPU limit per request, alongside memory and wall-clock limits. A single request is therefore not an appropriate execution boundary for this workload.

References:
- https://supabase.com/docs/guides/functions/limits
- https://supabase.com/docs/guides/functions/background-tasks

## Required worker contract

A future worker must:

1. Claim one staged dataset atomically, with a lease/timeout so abandoned work can be retried safely.
2. Download only the object path recorded in the private `dakar-gtfs-staging` bucket.
3. Verify the downloaded byte count and SHA-256 against the immutable staged metadata before parsing.
4. Run the existing Python validator with explicit production limits; never accept a caller-provided limit increase.
5. Persist the complete structured report, including issue counts, bounded issue details, table row counts, validator version, and archive hash.
6. Set `integrity_status = OK` only when the trusted validator reports `structure_valid = true`; otherwise set it to `INVALID`.
7. Leave `review_status = PENDING_REVIEW` and `publication_status = NOT_PUBLISHED` in both cases. Structural validity is not source authority, licence approval, freshness, or permission to publish.
8. Be idempotent: retrying the same archive hash must not create a second dataset or overwrite an existing report with a report for different bytes.
9. Never write to the live transport catalogue. Human review and the separate publication workflow remain mandatory.

## Execution boundary and credentials

A dedicated worker on a managed runner is the simplest way to reuse the existing Python validator without reimplementing ZIP/CSV/SQLite behavior. A GitHub-hosted Actions runner is a candidate because the repository already uses Actions and its CI installs Python 3.11.

The worker must not reuse the intake Edge Function's `service_role` credential. It signs in through Supabase Auth with a dedicated, confirmed technical user whose server-managed `app_metadata` contains `dakar_gtfs_worker=true`. The worker receives only an anon/publishable API key plus that user's email/password through protected GitHub environment secrets. It never receives the service-role key.

A new migration grants the three worker RPCs only to `authenticated` and checks the signed JWT claim inside each `SECURITY DEFINER` function. The private Storage policy grants that identity read access to `dakar-gtfs-staging` only, while restrictive policies deny writes and deny access to other buckets. The intake Edge Function's `service_role` token is rejected by the worker RPCs even though it remains capable of its separate intake duties.

The dedicated Auth user, server-managed app_metadata claim, GitHub secrets, and environment approvers must be provisioned separately. This repository change does not create a user, change a secret, apply a live migration, deploy a function, or run a worker. Until those steps are explicitly authorized and verified, keep all staged rows pending. Render is not part of this design.

## Acceptance tests before enabling the worker

- Valid synthetic feed: report is structurally valid, but not production-ready.
- Invalid references, duplicate IDs, malformed CSV, bad calendars/times, and invalid coordinates: report is invalid with bounded issue details.
- ZIP traversal, symlink, encrypted entry, duplicate member, oversized member, oversized expanded total, and excessive entry count: reject safely.
- Archive hash mismatch or changed bytes between staging and validation: reject without updating integrity to OK.
- Worker crash/timeout: lease expires and the same job can be retried without duplicate rows.
- Repeated execution: idempotent report for the same dataset/hash.
- No test fixture is ever inserted into the live dataset.


## Hardening follow-up

The private worker is pinned to the dedicated Dakar Bus Supabase project reference mdmuxzaewqzqutkqdylo; it rejects any other host, URL path, credentials, query string, or non-HTTPS endpoint. It accepts only the private dakar-gtfs-staging bucket and the canonical object path <dataset_id>/<sha256>/feed.zip.

Before a report can be stored, the worker verifies the validator schema version, archive filename, exact byte count and SHA-256, fixed production resource limits, non-negative table counts, bounded issue objects, and the consistency rule structure_valid == (errors == 0). A report cannot set production_ready to true. The database RPC independently checks the hash, size, core report shape, fixed limits and status/count consistency; it rejects stale lease tokens and appends a server-validation audit event in the same transaction.

Stop-time chronology is now checked after sorting by trip_id and stop_sequence, independently of the order in which rows appear in stop_times.txt. An unsorted file remains a warning, but it can no longer bypass chronological validation.

The new migration is exercised only against an isolated PostgreSQL 16 service in GitHub Actions. It is not applied to the active Supabase database by CI. The manual worker workflow is not dispatched as part of CI. No real GTFS archive is assumed, no staged row is created, and a structurally valid result still leaves human review pending and publication disabled.


## Intake cleanup and activation boundary

Depuis le 19 novembre 2026, le chemin multipart qui transmettait le ZIP à l'Edge Function est remplacé par un téléversement direct et reprenable TUS vers le bucket privé. L'Edge Function ne matérialise plus les 100 MiB : elle reçoit uniquement un manifeste JSON borné, crée une session serveur et retourne un token limité à un chemin canonique, à utiliser dans `x-signature` sur l'endpoint TUS Storage direct. Le token signé peut créer une URL TUS pendant deux heures ; cette URL de reprise peut rester valable jusqu'à 24 heures supplémentaires. Le nettoyage est donc différé de 26 h 15 après l'émission du token, marge de quinze minutes comprise. La finalisation vérifie les métadonnées Storage réelles et crée une ligne de staging en quarantaine ; le worker reste responsable du SHA-256 réel et de la validation structurelle.

Les anciens tests du parseur multipart sont conservés comme régressions du helper historique, mais `readMultipartWithLimit` n'est plus utilisé pour recevoir les archives. Les tests du nouveau protocole couvrent les limites JSON, les chemins, le manifeste, les empreintes et l'expiration du token. Ils restent synthétiques et ne téléversent aucun fichier vers Supabase.


## Historique des garde-fous multipart (13 novembre 2026)

Le chemin multipart historique exigeait exactement un champ `feed`, `manifest` et `dataset_id`, et annulait/libérait le lecteur du flux après erreur. Cette réception a été retirée le 19 novembre au profit du token Storage signé ; les helpers restent couverts par les tests historiques mais ne reçoivent plus les archives.

Le contrôle des références base/Storage reste applicable à la finalisation : après une issue réseau ambiguë lors de l'insertion Postgres, l'Edge Function relit la ligne par `dataset_id`. Si les objets sont référencés, partiellement référencés ou si la lecture est incertaine, aucun nettoyage destructif n'est tenté.

Les tokens Storage signés ne peuvent pas être révoqués individuellement. En mode TUS, un token de deux heures peut créer une URL de reprise valide jusqu'à 24 heures supplémentaires. Une session en échec conserve donc son expiration calculée à 26 h 15 après l'émission du token (quinze minutes de marge comprises). Un échec de finalisation renvoie `cleanup_after` au lieu de supprimer un objet encore téléversable. Les objets privés orphelins restent hors catalogue et leur réconciliation demeure distincte.

Ces changements sont couverts par des tests Deno synthétiques. Ils ne déclenchent aucune écriture Supabase, migration active ou publication.

## Worker implémenté et garde opérationnel (13 novembre 2026)

Le worker Python décrit ci-dessus est maintenant présent dans `scripts/process_gtfs_staging.py`. Il réutilise le validateur de référence et les fonctions SQL de réservation/finalisation. Son workflow GitHub Actions est manuel uniquement ; le job est désormais conditionné à la branche `main` et à une confirmation booléenne explicite dont la valeur par défaut est `false`.

Les secrets attendus restent exclusivement dans l'environnement GitHub `dakar-bus-private-validation` : `DAKAR_BUS_SUPABASE_URL`, `DAKAR_BUS_SUPABASE_ANON_KEY`, `DAKAR_BUS_GTFS_WORKER_EMAIL` et `DAKAR_BUS_GTFS_WORKER_PASSWORD`. Le worker n'utilise pas de credential `service_role`. Leur présence, la protection de cet environnement et l'obtention d'une approbation humaine ne sont pas présumées. Aucun secret n'a été créé ou modifié et le workflow n'a pas été déclenché.

La CI teste uniquement le code du worker, le validateur et les migrations dans un PostgreSQL isolé avec des fixtures synthétiques. Elle ne lance jamais le worker opérationnel et n'écrit pas dans le projet Supabase Dakar Bus actif. L'activation réelle reste bloquée tant que l'accès sécurisé, la protection de l'environnement et les limites d'exécution ne sont pas vérifiés séparément.

## Compléments de validation structurelle (14 novembre 2026)

Le validateur refuse les plages `frequencies.txt` qui se chevauchent pour un même `trip_id` ; deux plages adjacentes sont admises lorsque la suivante commence exactement à la fin de la précédente. La valeur `exact_times` doit rester identique pour toutes les lignes d'un même trajet.

Pour `shapes.txt`, l'ordre sémantique est porté par `shape_pt_sequence`, qui doit être non négatif et unique pour chaque forme ; l'ordre physique des lignes CSV n'est pas interprété comme un ordre de trajet. Lorsque `shape_dist_traveled` est fourni, il doit être numérique, fini, non négatif et strictement croissant lorsque les points sont ordonnés par `shape_pt_sequence`.

Les tests restent synthétiques et couvrent les chevauchements, les frontières adjacentes, la cohérence de `exact_times`, les distances de forme et l'ordre de lignes CSV. Ces contrôles sont structurels : ils ne valident ni l'autorité de la source, ni les droits de réutilisation, ni l'actualité d'un service.

## Couverture stricte et refus des tables non contrôlées (14 novembre 2026)

Le validateur échoue maintenant de façon conservatrice lorsqu'une table optionnelle GTFS reconnue est présente mais n'est pas encore prise en charge (`OPTIONAL_TABLE_NOT_VALIDATED`). Un fichier `.txt` inconnu placé à la racine du flux est également refusé (`UNRECOGNIZED_TEXT_TABLE`) au lieu d'être ignoré. Une archive contenant des tables non contrôlées ne peut donc plus recevoir `structure_valid = true` par simple absence d'erreur dans les tables connues. Il faut étendre le validateur et ses tests avant d'accepter ces tables.

Dans `stop_times.txt`, si `arrival_time` et `departure_time` sont tous deux vides, `timepoint=0` est désormais obligatoire ; sinon la structure est invalide. Les valeurs renseignées de `pickup_type` et `drop_off_type` sont limitées aux codes GTFS 0 à 3. La version du worker est passée à `dakar-gtfs-validator-v2` afin que le rapport enregistré identifie cette nouvelle règle. La compression ZIP LZMA est refusée : le décodeur standard `zipfile` ne permet pas de fixer ici une limite mémoire fiable sur le dictionnaire LZMA. Les méthodes STORED, DEFLATED et BZIP2 restent acceptées sous les limites d'archive et de décompression déclarées.

Ces refus maintiennent le dataset en quarantaine (`integrity_status = INVALID` après exécution du worker) et ne constituent ni une approbation humaine, ni une publication, ni une validation de provenance.

## Protection contre le nettoyage d'une archive déjà référencée (14 novembre 2026)

Si le téléversement du manifeste échoue après celui de l'archive, l'Edge Function relit maintenant la ligne de staging par `dataset_id` avant toute suppression. Elle ne retire l'archive que si la lecture réussit et confirme qu'aucune ligne ne référence le chemin. Une référence complète renvoie un conflit ; une référence partielle ou une erreur de lecture conserve l'objet et renvoie un état indéterminé. Ce choix privilégie l'intégrité des données privées : un objet orphelin éventuel est préférable à la suppression d'une archive déjà référencée.

Les tests Deno couvrent les quatre décisions (aucune référence, référence complète, référence partielle et lecture SQL incertaine). Ils restent synthétiques et n'effectuent aucun accès ou écriture Supabase.

## Règles conditionnelles supplémentaires GTFS (15 novembre 2026)

Le validateur vérifie maintenant les règles conditionnelles de `stop_times.txt` : `arrival_time` doit être présent au premier et au dernier arrêt de chaque trajet ; lorsque `timepoint=1`, `arrival_time` et `departure_time` doivent tous deux être renseignés. Un `stop_id` de `stop_times.txt` doit désigner un arrêt ou une plateforme (`location_type=0` ou absent), et non une station parente, entrée, sortie ou generic node.

Pour `transfers.txt`, les références facultatives `from_route_id`, `to_route_id`, `from_trip_id` et `to_trip_id` sont vérifiées. Lorsqu'un trip et sa route sont tous deux fournis, leur association doit correspondre à `trips.txt`. `min_transfer_time` est requis pour `transfer_type=2` et doit être un entier non négatif lorsqu'il est présent. Les transferts de type 4 et 5 doivent référencer les deux trajets.

Les tests ajoutés utilisent uniquement des archives synthétiques en mémoire/temporaires. Ils ne chargent aucun flux réel, n'écrivent pas dans Supabase et ne modifient aucune donnée de transport. Une structure valide reste distincte de la provenance, de l'autorisation de réutilisation, de la revue humaine et de toute publication. La version du worker passe à `dakar-gtfs-validator-v3` pour distinguer ces règles des rapports produits par la version v2.

## Journal administratif chaîné (14 novembre 2026)

Le journal `dakar_admin_audit_events` conserve maintenant un ordre `chain_sequence` sérialisé par verrouillage de la ligne d'état privée. Chaque événement reçoit automatiquement `previous_hash` et `event_hash` SHA-256 calculés sur son identifiant, sa séquence, son acteur, son action, sa cible, ses détails, son horodatage UTC représenté en microsecondes depuis l'époque Unix et le hash précédent. Les valeurs de chaîne et l'horodatage fournis par un appelant sont écrasés par le déclencheur serveur, qui affecte l'heure UTC courante. L'état de tête est inaccessible directement aux rôles applicatifs ; le journal reste append-only contre UPDATE, DELETE et TRUNCATE.

La migration recalcule les éventuelles anciennes entrées dans l'ordre de leur identifiant avant de rétablir la protection append-only. Les tests SQL isolés vérifient la continuité, le recalcul des empreintes, l'indépendance au fuseau horaire, la tête de chaîne, les privilèges et le rejet des tentatives de modification. Un test PostgreSQL séparé insère aussi 24 événements simultanément et vérifie que la séquence, les liens SHA-256 et la tête restent continus. Cette chaîne rend les altérations détectables ; elle ne remplace ni les droits d'accès, ni une sauvegarde indépendante, ni la revue humaine.

## Limiter les privilèges directs du service_role (14 novembre 2026)

La migration `20261114190000_dakar_gtfs_staging_least_privilege.sql` réduit les droits SQL du credential `service_role` utilisé par l'intake :

- `dakar_admin_staged_datasets` : lecture et insertion limitée aux colonnes de réception ; aucun UPDATE, DELETE, TRUNCATE, ni insertion directe des compteurs, rapports, statuts, leases ou métadonnées du validateur.
- `dakar_admin_actors` : lecture seule ; le credential applicatif ne peut pas activer, désactiver ou promouvoir un acteur.
- `dakar_admin_audit_events` : aucun accès direct ; les événements sont ajoutés par les fonctions serveur de confiance et leurs triggers.
- Les nouveaux enregistrements reçoivent leurs états de quarantaine depuis les valeurs par défaut SQL : `PENDING_SERVER_CHECK`, `PENDING_REVIEW`, `NOT_PUBLISHED`, avec un rapport `PENDING_SERVER_VALIDATION`.

Dans la migration du 14 novembre, les RPC étaient encore attribuées à `service_role`. Cette configuration historique a été remplacée par `20261116200000_dakar_gtfs_worker_identity_isolation.sql` : les RPC de claim/finalisation/reprise sont désormais accordées à `authenticated` et vérifient le claim JWT serveur `app_metadata.dakar_gtfs_worker=true`. Le credential `service_role` de l'intake est refusé par ces RPC. La protection effective de l'environnement GitHub et le provisionnement du compte dédié restent des prérequis avant activation réelle.

Les tests de privilèges utilisent uniquement un PostgreSQL isolé et des lignes synthétiques. Aucune migration n'est appliquée à la base Supabase active ; aucun secret, import, dataset, horaire ou catalogue n'est modifié.

## Isolation stricte du bucket privé (14 novembre 2026)

La migration `20261114193000_dakar_gtfs_storage_isolation.sql` active explicitement RLS sur `storage.objects` et ajoute une politique restrictive `dakar_gtfs_staging_deny_non_bypass_roles`. Elle refuse l'accès au bucket `dakar-gtfs-staging` à tout rôle soumis à RLS, même si une autre politique permissive générale est ajoutée ultérieurement pour d'autres buckets. Le `service_role` conserve l'accès serveur attendu via son attribut BYPASSRLS et les droits limités définis par la migration précédente.

La migration retire aussi explicitement les ACL héritées de `PUBLIC` sur les trois tables administratives, en plus des rôles `anon` et `authenticated`. Les tests isolés simulent volontairement une politique Storage permissive globale, puis vérifient que les rôles applicatifs ne peuvent ni lire ni écrire le bucket GTFS, tandis que le rôle serveur le voit. Aucun objet réel n'est créé ; les seules lignes Storage du test sont synthétiques et locales à PostgreSQL CI.


## Refus des colonnes non contrôlées (15 novembre 2026)

Pour chaque table prise en charge, le validateur maintient une liste explicite des colonnes dont les règles sont effectivement contrôlées. Toute colonne supplémentaire — y compris une colonne GTFS standard optionnelle dont les règles conditionnelles ne sont pas encore implémentées — produit `UNVALIDATED_COLUMN` et empêche `structure_valid=true`. Cela peut refuser temporairement un flux GTFS valide, mais évite d'ignorer silencieusement des champs qui changent la sémantique du service (par exemple les fenêtres de prise en charge à la demande). Une nouvelle colonne ne doit être ajoutée à la liste qu'avec ses contrôles et ses tests positifs/négatifs correspondants. Les fixtures restent synthétiques ; aucun flux réel ni aucune base active n'est utilisé.


## Racine ZIP conforme au GTFS (15 novembre 2026)

La référence GTFS exige que les fichiers du dataset soient directement à la racine de l'archive ZIP, et non dans un sous-dossier. Le validateur n'accepte donc plus les dossiers enveloppes de fournisseur. Il refuse également les tables texte imbriquées même si les tables principales sont présentes à la racine, afin qu'une seconde copie ou une table non contrôlée ne soit pas ignorée. Les tests positifs et négatifs utilisent uniquement des archives synthétiques. Référence : https://gtfs.org/documentation/schedule/reference/ (section « File Requirements »).


## Références calendar_dates.txt (15 novembre 2026)

Lorsque `calendar.txt` est présent, chaque `calendar_dates.service_id` doit référencer un `calendar.service_id`. Le validateur refuse maintenant les exceptions orphelines avec `UNKNOWN_CALENDAR_DATE_SERVICE_REFERENCE`. Le mode alternatif `calendar_dates.txt` seul reste accepté, conformément à la spécification. Les tests utilisent une archive synthétique avec une référence inconnue et conservent le test positif du calendrier par dates seul. La version du worker est passée à `dakar-gtfs-validator-v5` pour identifier les nouveaux contrôles de structure, de racine ZIP et de colonnes.


## Contrôles URL et fuseau horaire en échec fermé (16 novembre 2026)

Les champs obligatoires `agency_url` et `feed_publisher_url` doivent désormais être des URL HTTP(S) absolues avec une autorité valide. Les schémas non HTTP, les URL relatives, les autorités absentes, les identifiants intégrés, les ports invalides, les espaces et les antislashs sont refusés.

Si la base IANA des fuseaux horaires n'est pas disponible sur le runner, le validateur émet `TIMEZONE_DATABASE_UNAVAILABLE` en erreur et ne peut plus déclarer le flux structurellement valide par défaut. La version du validateur passe à `dakar-gtfs-validator-v5`.

Les tests couvrent les URL invalides et l'absence de base IANA avec des archives synthétiques uniquement. Aucun flux réel, stockage ou service Supabase n'est utilisé.


## Verrouillage strict du projet Supabase de réception (16 novembre 2026)

La fonction `dakar-gtfs-ingest` n'accepte que les valeurs exactes de l'URL HTTPS canonique du projet Dakar Bus dédié `mdmuxzaewqzqutkqdylo` (avec ou sans barre finale, et avec le port HTTPS explicite 443). La comparaison stricte de chaînes refuse les espaces périphériques, les hôtes alternatifs, les identifiants, les ports non canoniques, les chemins, paramètres, fragments et formes que le parseur URL pourrait normaliser. Cette garde concerne uniquement la configuration de destination de l'intake ; elle ne lit ni ne modifie aucun secret ou projet actif.

Les tests Deno positifs et négatifs utilisent des chaînes synthétiques, y compris l'identifiant du projet YÉRÉ uniquement comme cas de refus. Aucun déploiement, appel réseau Supabase, upload ou import n'est effectué.

## Bornage du rapport de validation (19 novembre 2026)

Les valeurs d'identifiants, d'en-têtes et de chemins présentes dans un ZIP peuvent être contrôlées par l'importateur. Pour éviter qu'elles gonflent le journal de revue ou la requête RPC, chaque détail d'anomalie est limité à 512 caractères et le nom de table à 64 caractères. Le worker refuse en défense supplémentaire tout rapport JSON supérieur à 1 Mio avant l'appel de finalisation. Cette évolution de bornage est identifiée par `dakar-gtfs-validator-v7` ; elle ne change pas les critères structurels ni les statuts de revue/publication.

## Noms d'entrées ZIP tronqués et octets NUL (19 novembre 2026)

Le lecteur `zipfile` de Python conserve le nom central-directory original dans `ZipInfo.orig_filename`, mais tronque `ZipInfo.filename` au premier octet NUL. Le validateur comparait auparavant uniquement la valeur tronquée ; une entrée contenant un NUL pouvait donc échapper au contrôle explicite des noms dangereux et être interprétée sous un autre nom. Le validateur compare maintenant le nom brut à la valeur exposée pour l'ouverture, refuse tout écart ou octet NUL avant le contrôle des chemins, et ajoute une régression synthétique qui reproduit précisément cette troncature. La version passe à `dakar-gtfs-validator-v7`. Aucun ZIP réel ni aucune donnée Supabase n'est utilisé.
