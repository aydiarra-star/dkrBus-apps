# GTFS server-side validation architecture

## Decision

Keep `scripts/validate_gtfs.py` as the reference validator and execute it only in a trusted server-side worker. Do not duplicate its rules in the browser and do not trust any validation status supplied by the uploaded manifest.

The current `dakar-gtfs-ingest` Edge Function remains an intake-only endpoint: authenticate an active reviewer, enforce the actual request-body limit, verify the archive checksum, and store the archive and manifest privately. A successful upload must remain `PENDING_SERVER_CHECK`, `PENDING_REVIEW`, and `NOT_PUBLISHED`.

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

However, the worker would need narrowly scoped access to the Dakar Bus Supabase project to read private staged objects and write validation reports. The service-role key is highly privileged. It must not be copied into source code, workflow files, logs, or chat, and must not be added to a new secret store without explicit authorization. No existing secret availability is assumed.

Until a secure worker identity and credential path are approved, do not deploy a validator, change Supabase secrets, or promote any staged dataset. Keep all existing staged rows pending. Render is not part of this design.

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

The intake function now accepts exactly one `feed`, `manifest`, and `dataset_id` multipart field. If a later upload or staging-row insert fails, it attempts to remove only the objects created by that request and returns a distinct error when Storage reports that cleanup was incomplete. Database error details are not returned to the caller.

The multipart parser enforces the actual request-stream byte count even when `Content-Length` is absent. It still materializes the bounded `FormData` and archive bytes in the Edge Function before hashing; the 100 MiB archive limit is therefore a request cap, not proof that a 100 MiB upload fits the active Edge Function memory/CPU budget. Do not deploy or enable this intake path until its runtime resource behavior is verified in a dedicated non-production Supabase project, or the upload path is changed to a bounded direct-to-private-Storage flow. CI uses only synthetic in-memory multipart tests and does not upload files or write to Supabase.


## Garde-fous complémentaires de réception (13 novembre 2026)

Le formulaire multipart n'accepte que les trois champs contractuels `feed`, `manifest` et `dataset_id`, chacun présent exactement une fois. Le lecteur du flux d'origine est annulé puis libéré aussi bien après dépassement de taille qu'après erreur de parsing.

Après une erreur de réponse lors de l'insertion Postgres, l'Edge Function relit la ligne par `dataset_id` avant tout nettoyage. Si la ligne référence les objets envoyés, ils sont conservés ; si la lecture de vérification échoue ou si la référence est partielle, aucun objet n'est supprimé et l'API renvoie un résultat indéterminé. Le nettoyage compensatoire n'est lancé que lorsque la lecture confirme qu'aucune ligne ne référence les chemins.

Une erreur de téléversement Storage peut elle-même avoir une issue réseau ambiguë. Le chemin reste privé et non publié ; aucun nettoyage destructif n'est tenté sur un chemin dont l'appartenance à la requête n'est pas établie. Une réconciliation des objets privés orphelins reste une opération distincte, à concevoir et tester avant toute activation réelle.

Ces changements sont couverts par des tests Deno synthétiques. Ils ne déclenchent aucune écriture Supabase, migration active ou publication.

## Worker implémenté et garde opérationnel (13 novembre 2026)

Le worker Python décrit ci-dessus est maintenant présent dans `scripts/process_gtfs_staging.py`. Il réutilise le validateur de référence et les fonctions SQL de réservation/finalisation. Son workflow GitHub Actions est manuel uniquement ; le job est désormais conditionné à la branche `main` et à une confirmation booléenne explicite dont la valeur par défaut est `false`.

Les secrets attendus restent exclusivement dans l'environnement GitHub `dakar-bus-private-validation` : `DAKAR_BUS_SUPABASE_URL` et `DAKAR_BUS_SUPABASE_SERVICE_ROLE_KEY`. Leur présence, la protection de cet environnement et l'obtention d'une approbation humaine ne sont pas présumées. Aucun secret n'a été créé ou modifié et le workflow n'a pas été déclenché.

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

## Journal administratif chaîné (14 novembre 2026)

Le journal `dakar_admin_audit_events` conserve maintenant un ordre `chain_sequence` sérialisé par verrouillage de la ligne d'état privée. Chaque événement reçoit automatiquement `previous_hash` et `event_hash` SHA-256 calculés sur son identifiant, sa séquence, son acteur, son action, sa cible, ses détails, son horodatage UTC représenté en microsecondes depuis l'époque Unix et le hash précédent. Les valeurs de chaîne et l'horodatage fournis par un appelant sont écrasés par le déclencheur serveur, qui affecte l'heure UTC courante. L'état de tête est inaccessible directement aux rôles applicatifs ; le journal reste append-only contre UPDATE, DELETE et TRUNCATE.

La migration recalcule les éventuelles anciennes entrées dans l'ordre de leur identifiant avant de rétablir la protection append-only. Les tests SQL isolés vérifient la continuité, le recalcul des empreintes, l'indépendance au fuseau horaire, la tête de chaîne, les privilèges et le rejet des tentatives de modification. Un test PostgreSQL séparé insère aussi 24 événements simultanément et vérifie que la séquence, les liens SHA-256 et la tête restent continus. Cette chaîne rend les altérations détectables ; elle ne remplace ni les droits d'accès, ni une sauvegarde indépendante, ni la revue humaine.
