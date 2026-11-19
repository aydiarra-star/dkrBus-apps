# Téléversement privé GTFS par URL signée

**Statut : implémentation côté dépôt, non déployée et non activée sur le projet Supabase.**

Cette étape remplace la réception du ZIP dans le corps multipart de l'Edge Function. Le navigateur ne transmet plus les 100 Mio à l'Edge Function : il reçoit une autorisation Storage limitée à un chemin calculé par le serveur, puis envoie directement le fichier au bucket privé.

## Parcours

1. Un reviewer authentifié appelle `dakar-gtfs-ingest` avec `action: "create_upload"`, un `dataset_id` et le manifeste.
2. L'Edge Function vérifie le JWT avec `auth.getUser`, la confirmation du compte et le rôle `reviewer` actif. Elle borne le flux JSON réel à 1 Mio + 16 Kio, valide le manifeste, puis calcule elle-même son SHA-256.
3. Elle crée une session privée à durée limitée et construit exclusivement le chemin `<dataset_id>/<sha256>/feed.zip`. Elle demande une URL signée Storage avec `upsert: false`.
4. Le navigateur utilise `storage.from("dakar-gtfs-staging").uploadToSignedUrl(path, token, file, { contentType: "application/zip" })`. Le token Storage est valide deux heures. Le bucket privé limite chaque objet à 100 Mio et n'accepte que ZIP/JSON.
5. Le reviewer appelle `dakar-gtfs-ingest` avec `action: "finalize_upload"` et l'identifiant de session. Le serveur revérifie l'identité et la propriété de la session, lit les métadonnées Storage réelles, exige la taille exacte annoncée et écrit lui-même le manifeste privé.
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

La réponse contient `upload_id`, `bucket`, `path`, `token`, `expires_at`, la taille maximale et l'empreinte attendue. Le navigateur ne choisit jamais le chemin Storage et ne reçoit aucune clé `service_role`.

Finalisation :

```json
{
  "action": "finalize_upload",
  "upload_id": "<UUID renvoyé par create_upload>"
}
```

La finalisation est idempotente pour une ligne de staging qui référence exactement les mêmes chemins, tailles et empreintes. Un conflit ou une lecture de base incertaine ne déclenche jamais la suppression d'un objet potentiellement référencé.

## Quarantaine, concurrence et nettoyage

- `dakar_admin_gtfs_upload_sessions` est une table privée RLS, accessible uniquement au credential serveur de l'intake. Le worker n'a aucun accès direct à cette table.
- L'identifiant de dataset est unique dans les sessions et dans le staging ; les chemins sont canoniques et uniques. L'upload signé n'autorise pas l'écrasement.
- Les deux heures de validité Storage sont suivies d'une marge de 15 minutes avant expiration de session. Les sessions expirées ou échouées sont nettoyées lors d'un prochain appel d'intake : les références en base sont vérifiées avant toute suppression.
- Après un résultat réseau ambigu, le serveur relit la ligne de staging. Si la base ne permet pas de savoir si l'objet est référencé, il le conserve et renvoie une erreur explicite plutôt que de risquer une référence cassée.
- Un ZIP de taille correcte n'est pas déclaré valide : le contrôle complet ZIP/CSV/références/séquences reste exclusivement dans le worker Python. Les données de transport ne sont jamais modifiées par l'ingestion ou la validation.

## Vérifications attendues

La CI doit exécuter les tests Deno de limites JSON et de chemins, les tests PostgreSQL isolés de la nouvelle table/limite Storage, les tests du worker et du validateur, les migrations, le build et les tests frontend. Les fixtures sont synthétiques et ne sont jamais envoyées à Supabase.

**Préconditions de production non réalisées :** appliquer la migration au projet Dakar Bus, configurer le CORS Storage si nécessaire, intégrer le nouveau protocole dans l'interface d'administration, provisionner le compte worker et ses secrets, puis déployer explicitement les fonctions. Aucune de ces opérations n'est effectuée par cette PR.
