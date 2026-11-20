# Téléversement privé GTFS par URL signée

**Statut : implémentation côté dépôt, non déployée et non activée sur le projet Supabase.**

Cette étape remplace la réception du ZIP dans le corps multipart de l'Edge Function. Le navigateur ne transmet plus les 100 Mio à l'Edge Function : il reçoit une autorisation Storage limitée à un chemin calculé par le serveur, puis envoie directement le fichier au bucket privé.

## Parcours

1. Un reviewer authentifié appelle `dakar-gtfs-ingest` avec `action: "create_upload"`, un `dataset_id` et le manifeste.
2. L'Edge Function vérifie le JWT avec `auth.getUser`, la confirmation du compte et le rôle `reviewer` actif. Elle borne le flux JSON réel à 1 Mio + 16 Kio, valide le manifeste, recalcule l'heure d'ingestion et l'état de validité, puis conserve uniquement les champs de provenance autorisés, fixe elle-même les états de quarantaine et calcule le SHA-256 du manifeste stocké. Les champs inconnus, les attestations de validation, les comptes de lignes et les métadonnées d'approbation fournis par l'importateur sont supprimés.
3. Elle crée une session privée à durée limitée et construit exclusivement le chemin `<dataset_id>/<sha256>/feed.zip`. Elle demande un token Storage signé avec `upsert: false`.
4. Le navigateur envoie l'archive au point d'accès TUS direct `https://mdmuxzaewqzqutkqdylo.storage.supabase.co/storage/v1/upload/resumable`, avec le token dans l'en-tête `x-signature` (aucun en-tête `x-upsert` n'est envoyé : le droit signé impose déjà `upsert: false`) et les métadonnées `bucketName`, `objectName`, `contentType` et `cacheControl`. Les blocs font 6 Mio ; les interruptions réseau peuvent reprendre le transfert. Le token de création est valide deux heures et une session TUS créée avant son expiration peut rester valide jusqu'à 24 heures supplémentaires. Le nettoyage attend donc 26 h 15 après l'émission du token, marge de quinze minutes comprise. Avant l'appel Storage, la session réserve aussi dix minutes supplémentaires pour couvrir la durée maximale d'une requête Edge et un éventuel échec de mise à jour de l'expiration en base ; cette réserve préventive n'est conservée que si la mise à jour post-émission échoue. Le bucket privé limite chaque objet à 100 Mio et n'accepte que ZIP/JSON.
5. Le reviewer appelle `dakar-gtfs-ingest` avec `action: "finalize_upload"` et l'identifiant de session. Le serveur revérifie l'identité et la propriété de la session, lit les métadonnées Storage réelles, exige la taille exacte annoncée et écrit lui-même le manifeste privé. Avant tout téléchargement de manifeste déjà présent (cas de finalisation concurrente), il contrôle aussi sa taille Storage réelle pour ne jamais matérialiser un objet surdimensionné en mémoire Edge.
6. Le serveur insère ensuite le dossier dans `dakar_admin_staged_datasets`, qui reçoit ses valeurs de quarantaine par défaut : `PENDING_SERVER_CHECK`, `PENDING_REVIEW`, `NOT_PUBLISHED`.
7. Le worker Auth dédié télécharge l'objet, recalcule SHA-256 et taille, vérifie le manifeste, puis exécute `scripts/validate_gtfs.py`. Seul son RPC peut enregistrer `OK` ou `INVALID`. Une erreur opérationnelle remet le dossier en attente ; elle ne l'atteste jamais valide.

## Contrat API

Création :

```json
{
  "action": "create_upload",
  "dataset_id": "<identifiant canonique>",
  "manifest": { "...": "manifeste de provenance et d'archive" }
}
```

La réponse contient `upload_id`, `bucket`, `path`, `tus_endpoint`, `tus_headers`, `tus_metadata`, `chunk_size_bytes`, `expires_at`, la taille maximale et l'empreinte attendue. Le navigateur ne choisit jamais le chemin Storage et ne reçoit aucune clé `service_role`.

Exemple d'intégration cliente (à raccorder séparément au formulaire administratif, sans activer celui-ci dans cette PR) :

```ts
import { Upload } from "tus-js-client";

const transfer = new Upload(file, {
  endpoint: response.tus_endpoint,
  headers: response.tus_headers,
  metadata: response.tus_metadata,
  chunkSize: response.chunk_size_bytes,
  retryDelays: [0, 3000, 5000, 10000, 20000],
  uploadDataDuringCreation: true,
  removeFingerprintOnSuccess: true,
  onSuccess: () => finalizeUpload(response.upload_id),
});
transfer.start();
```

Le client TUS envoie `x-signature` lors de la création de la session et réutilise ensuite l'URL TUS de reprise. Le token n'est jamais placé dans une URL ou un journal applicatif. Le paquet `tus-js-client` sera ajouté au bundle d'administration uniquement lors du raccordement effectif du formulaire ; il n'est pas ajouté au bundle public dans cette PR.

Finalisation :

```json
{
  "action": "finalize_upload",
  "upload_id": "<UUID renvoyé par create_upload>"
}
```

La finalisation est idempotente pour une ligne de staging qui référence exactement les mêmes chemins, tailles et empreintes. Un conflit ou une lecture de base incertaine ne déclenche jamais la suppression d'un objet potentiellement référencé.

## Quarantaine, concurrence et nettoyage

- `dakar_admin_gtfs_upload_sessions` est une table privée RLS, accessible uniquement au credential serveur de l'intake. Le worker n'a aucun accès direct à cette table. Une contrainte SQL impose une expiration minimale de 26 h 15 après la création (2 h de token + 24 h d'URL TUS + 15 min de marge) ; l'intake réserve dix minutes de plus avant l'émission pour couvrir une mise à jour en base qui échoue.
- L'identifiant de dataset est unique dans les sessions et dans le staging ; les chemins sont canoniques et uniques. L'upload signé n'autorise pas l'écrasement.
- Le token signé peut créer une session TUS pendant deux heures ; cette session TUS peut rester utilisable jusqu'à 24 heures après sa création. La session administrative n'est donc nettoyable qu'après 26 h 15 à compter de l'émission du token (2 h + 24 h + 15 min). Les sessions expirées ou échouées sont nettoyées lors d'un prochain appel d'intake : les références en base sont vérifiées avant toute suppression.
- Après un résultat réseau ambigu, le serveur relit la ligne de staging. Si la base ne permet pas de savoir si l'objet est référencé, il le conserve et renvoie une erreur explicite plutôt que de risquer une référence cassée.
- La finalisation et le nettoyage se réservent désormais mutuellement la session par des transitions SQL atomiques : la finalisation prolonge une session active avec l'horloge PostgreSQL ; le nettoyage réclame une session expirée en la passant à `CLEANUP_PENDING` avec un bail de dix minutes. Si la finalisation gagne, l'expiration repoussée empêche le nettoyage ; si le nettoyage gagne, la finalisation ne peut plus réserver la session. Le nettoyeur relit la session et les références de staging après sa réservation, ne supprime que si aucune ligne ne référence les objets, et compare son bail avant de supprimer la session. Un bail expiré permet de reprendre un nettoyage interrompu ; une référence partielle ou un résultat de base incertain conserve les objets en quarantaine.
- Un ZIP de taille correcte n'est pas déclaré valide : le contrôle complet ZIP/CSV/références/séquences reste exclusivement dans le worker Python. Les erreurs d'intégrité non récupérables (taille, SHA-256, manifeste ou signature ZIP) restent en quarantaine avec `integrity_status=INVALID`; les erreurs réseau et d'exécution sont réessayées sans attestation. Les données de transport ne sont jamais modifiées par l'ingestion ou la validation.

## Vérifications attendues

La CI doit exécuter les tests Deno de limites JSON et de chemins, les tests PostgreSQL isolés de la nouvelle table/limite Storage, les tests du worker et du validateur, les migrations, le build et les tests frontend. Les fixtures sont synthétiques et ne sont jamais envoyées à Supabase.

**Préconditions de production non réalisées :** appliquer la migration au projet Dakar Bus, configurer le CORS Storage si nécessaire, intégrer le nouveau protocole dans l'interface d'administration, provisionner le compte worker et ses secrets, puis déployer explicitement les fonctions. Aucune de ces opérations n'est effectuée par cette PR. L'Edge Function refuse désormais toutes les actions tant que `DAKAR_GTFS_TUS_STORAGE_SECURITY_CONFIRMED` n'est pas exactement `true`. Cette variable non secrète ne doit être définie qu'après confirmation indépendante que le Storage hébergé du projet Dakar Bus utilise au minimum la version corrigée 1.80.2 ; elle n'est ni créée ni configurée par cette PR.

## Limites opérationnelles à confirmer avant activation

- La migration fixe le plafond du bucket à **100 MiB**. Supabase applique aussi un plafond global au projet ; le plafond du bucket ne peut pas le dépasser. Il faut donc vérifier dans *Storage → Settings → Global file size limit* que le projet autorise au moins 100 MiB. La limite maximale d'un projet Free est de 50 MB : dans ce cas, le flux 100 MiB ne pourra pas être utilisé sans modifier explicitement le périmètre ou le plan. Cette PR ne change aucun réglage global ni abonnement. Référence : https://supabase.com/docs/guides/storage/uploads/file-limits
- Un token d'upload signé est une capacité temporaire et Supabase ne permet pas de révoquer individuellement un token déjà émis. En mode TUS, un token valable deux heures peut créer une URL de reprise qui reste valable jusqu'à 24 heures supplémentaires ; une session en échec ne raccourcit donc jamais son expiration et ses objets ne sont nettoyés qu'après 26 h 15 (avec quinze minutes de marge). Les erreurs de finalisation annoncent `cleanup_after` au lieu de supprimer immédiatement un objet encore téléversable. Références : https://supabase.com/docs/guides/storage/uploads/resumable-uploads et https://supabase.com/docs/reference/javascript/file-buckets-createsigneduploadurl
- Le contrôle de taille à la finalisation reste une vérification de métadonnées Storage ; le worker recalcule la taille et le SHA-256 du contenu téléchargé avant d'exécuter le validateur. Le type MIME et l'extension ne constituent jamais une preuve ZIP.
- **Précondition de sécurité Storage avant activation TUS :** vérifier que le service Storage du projet utilise au minimum la version corrigée **1.80.2**. L'avis critique [GHSA-8rrf-w776-x75g](https://github.com/supabase/storage/security/advisories/GHSA-8rrf-w776-x75g) décrit un contournement d'autorisation sur les routes d'upload TUS signé jusqu'à 1.80.1, corrigé en 1.80.2. Les métadonnées du projet consultées en lecture seule ne donnent pas la version du service Storage ; cette précondition reste donc **non vérifiée**. Le code est désormais bloqué par défaut : `DAKAR_GTFS_TUS_STORAGE_SECURITY_CONFIRMED` doit valoir exactement `true` pour répondre aux actions, et ne peut être configuré qu'après confirmation de la version corrigée. Ne pas déployer ni activer le protocole tant que Supabase ne confirme pas la version corrigée ou une protection équivalente sur le projet Dakar Bus.
- Avant activation du formulaire, vérifier le CORS Storage du projet Dakar Bus pour l'origine GitHub Pages et les méthodes TUS `POST`, `HEAD`, `PATCH`, `OPTIONS`, ainsi que les en-têtes `Tus-Resumable`, `Upload-Length`, `Upload-Metadata`, `Upload-Offset` et `x-signature`. Aucun en-tête `x-upsert` ne doit être ajouté ; aucun réglage CORS n'est modifié ici.
