# Worker de validation GTFS privé — Dakar Bus

**État :** code et tests présents dans le dépôt ; aucun worker exécuté sur un dataset réel et aucun déploiement effectué.

## Parcours de réception

1. `dakar-gtfs-ingest` exige un JWT Supabase valide, un compte confirmé et un acteur administratif actif avec le rôle `reviewer`.
2. Le corps multipart est limité sur le flux réellement lu, même sans `Content-Length`. La limite de requête est de 102 MiB ; l'archive est limitée à 100 MiB et le manifeste à 1 MiB.
3. Le serveur vérifie le manifeste, recalcule le SHA-256 de l'archive et compare la taille et l'empreinte déclarées.
4. Les objets sont stockés dans le bucket privé `dakar-gtfs-staging`, sous un chemin canonique lié à l'identifiant et au SHA-256. Les téléversements utilisent `upsert: false`.
5. L'enregistrement reste en `PENDING_SERVER_CHECK`, `PENDING_REVIEW` et `NOT_PUBLISHED`. Le navigateur ne peut pas déclarer l'intégrité structurelle.

## Validation structurelle

Le workflow manuel `.github/workflows/dakar-gtfs-validation-worker.yml` lance au plus un dossier en attente, uniquement sur `main`, après confirmation explicite `confirm_process=true` et passage par l'environnement GitHub `dakar-bus-private-validation`.

Le worker `scripts/process_gtfs_staging.py` :
- réclame un seul dossier avec un lease SQL atomique ;
- vérifie le bucket, le chemin, l'identifiant, le lease, la taille et le SHA-256 ;
- télécharge au plus 100 MiB + 1 octet et refuse tout dépassement ;
- exécute `scripts/validate_gtfs.py` dans un répertoire temporaire, sans transmettre le credential Supabase au sous-processus ;
- lie le rapport au SHA-256, à la taille et aux limites du validateur ;
- enregistre seulement le résultat d'intégrité via le RPC serveur.

Le validateur contrôle les tables GTFS prises en charge, les en-têtes CSV, les identifiants et références, les séquences, les heures, les calendriers, les coordonnées, les fréquences, les chemins ZIP, les entrées dupliquées ou dangereuses, les liens symboliques, les méthodes de compression et les limites de ressources. Les tables optionnelles non prises en charge ou non validées sont refusées plutôt que considérées valides.

Limites appliquées : archive 100 MiB, 1 000 entrées ZIP, 200 MiB par membre, 500 MiB décompressés au total, 2 000 000 lignes par table et 200 détails d'anomalie dans le rapport.

Une structure valide signifie uniquement **GTFS Static structurellement valide**. Le rapport conserve `production_ready=false`. Il ne certifie ni la provenance, ni les droits de réutilisation, ni l'autorité de l'opérateur, ni l'actualité du service. La revue humaine reste `PENDING_REVIEW` et la publication reste `NOT_PUBLISHED`.

## Échecs opérationnels et reprise

Un échec réseau, téléchargement, exécution ou rapport ne doit pas être confondu avec un GTFS structurellement invalide. Le RPC `fail_dakar_gtfs_validation` :
- vérifie le rôle serveur et le lease courant non expiré ;
- accepte uniquement un code d'erreur borné ;
- remet le dossier en `PENDING_SERVER_CHECK` ;
- efface le lease ;
- enregistre le dernier code et son horodatage ;
- ajoute un événement à la chaîne d'audit.

Un ancien worker ne peut pas libérer le lease d'une nouvelle tentative. Si le RPC de reprise est indisponible ou si le lease a expiré, le mécanisme existant de récupération des leases expirés reste le filet de sécurité. Aucun échec opérationnel ne marque le dataset `OK` ou `INVALID`.

## Frontières de sécurité et limites restantes

- Les migrations et tests SQL de ce chantier s'exécutent uniquement dans le PostgreSQL isolé de GitHub Actions.
- Le bucket GTFS est privé et une politique restrictive interdit l'accès aux rôles applicatifs soumis à RLS.
- `service_role` ne peut pas modifier directement les statuts, rapports, leases ou champs d'erreur ; les transitions passent par les RPC `SECURITY DEFINER`.
- Le worker n'utilise jamais le credential `service_role` de l'intake. Il ouvre une session Supabase Auth avec un compte technique dédié, confirmé, dont le seul droit spécial est le claim serveur `app_metadata.dakar_gtfs_worker=true`.
- Les RPC de claim/finalisation/reprise refusent `service_role`, `anon` et les utilisateurs authentifiés sans ce claim. Le worker peut lire uniquement le bucket privé GTFS ; les politiques restrictives interdisent ses INSERT, UPDATE et DELETE Storage et lui bloquent les autres buckets même si une politique permissive générale existe.
- Le worker est exécuté avec les secrets d'environnement `DAKAR_BUS_SUPABASE_URL`, `DAKAR_BUS_SUPABASE_ANON_KEY`, `DAKAR_BUS_GTFS_WORKER_EMAIL` et `DAKAR_BUS_GTFS_WORKER_PASSWORD`. Le compte doit être provisionné séparément par un administrateur Supabase ; le claim doit être placé dans `app_metadata`, jamais dans `user_metadata`.
- Aucun compte, secret ou claim n'est créé ou modifié dans ce chantier. Tant que ce provisionnement et les approbateurs de l'environnement GitHub ne sont pas vérifiés, le worker reste inactif.
- La configuration réelle des approbateurs de l'environnement GitHub n'est pas vérifiée par les tests du dépôt ; elle doit rester un prérequis d'activation, jamais être contournée.
- Aucun dataset réel n'a été fourni. Les fixtures synthétiques servent uniquement aux tests et ne sont jamais envoyées à Supabase.

## Barrières de production

Aucun déploiement Edge Function, aucune migration active, aucun secret modifié, aucun import Supabase, aucune approbation humaine, aucune publication et aucune écriture dans le catalogue transport. TER/BRT, leurs horaires, arrêts, lignes et associations restent hors périmètre.
