# Migration de la gouvernance de la console vers Supabase

**Statut : conception vérifiée, aucune activation opérationnelle.**  
Projet Supabase cible : `mdmuxzaewqzqutkqdylo` (compte « Dakar Bus »).  
Branche : `feat/supabase-admin-foundation`.

## 1. Constat vérifié dans le code existant

La console ne se limite pas à enregistrer un statut. Les décisions passent aujourd'hui par les fonctions métier Python :

- `approve_dataset`, `reject_dataset` et `revert_decision` dans `scripts/review_gtfs.py` ;
- `publish_dataset` et `revert_publication` dans `scripts/publish_gtfs.py` ;
- les journaux `review/journal.jsonl` et `publication.jsonl`, vérifiés comme chaînes SHA-256 ;
- les manifests et archives du staging local, inspectés avant toute décision ;
- les snapshots de publication, construits à partir des archives et vérifiés avant d'être servis.

L'interface React (`src/domain/session.ts`) appelle encore `/api/session` et les routes locales `/api/datasets/...`. La fonction Supabase `dakar-admin` vérifie aujourd'hui une identité et son rôle, mais ne remplace pas ces fonctions métier.

## 2. Incompatibilité à ne pas masquer

La base Supabase Dakar Bus possède déjà `mobility_catalog_imports`, `mobility_catalog_records` et `mobility_dataset_versions`. Leurs colonnes décrivent des imports de catalogue (réseau, code de ligne, origine/destination, source, enregistrement brut). Elles ne contiennent pas les archives GTFS stagées, leurs manifests, leurs empreintes SHA-256 ni les dossiers de snapshots produits par le pipeline local.

Les enregistrements de catalogue candidats ne sont donc **pas** des dossiers GTFS prêts à approuver ou publier. Les transformer directement en décisions serait incorrect.

## 3. Règles métier à conserver à l'identique

### Revue

- L'archive et le manifeste doivent être intègres ; la somme SHA-256 doit être présente.
- La version doit être dans sa période de validité (`CURRENT`), sa source connue, son opérateur confirmé et son service déclaré `ACTIVE`.
- Les cinq attestations obligatoires sont : `source_identity`, `reuse_rights`, `operator_confirmed`, `service_operational`, `freshness_confirmed`.
- Chaque preuve textuelle doit être nettoyée et comprise entre 12 et 600 caractères ; les références doivent être des URL HTTP(S) absolues sans identifiants d'accès.
- Une approbation ne publie jamais.
- Un refus exige un motif ; une annulation ajoute une nouvelle entrée et ne supprime aucune décision.
- Le relecteur doit être un compte humain actif avec le rôle `reviewer`.

### Publication

- Seul un compte humain actif avec le rôle `publisher` peut publier ou annuler une publication.
- Le publieur doit être différent du relecteur ayant approuvé la même version.
- Le snapshot doit être construit et vérifié à partir de l'archive réellement importée ; son empreinte et celle de la base produite sont enregistrées.
- Une publication et son annulation sont deux entrées distinctes ; les fichiers snapshot restent conservés après annulation.
- Si la construction ou la vérification échoue, aucune publication active ne doit être enregistrée.

### Journaux

- Les journaux sont append-only, chaînés par SHA-256, séquencés et vérifiés avant chaque écriture.
- Les écritures concurrentes doivent être sérialisées par transaction/verrou de base, pas par un verrou JavaScript côté navigateur.
- Le navigateur ne reçoit jamais la clé service-role et n'écrit jamais directement dans les tables de journal.

## 4. Architecture cible avant d'activer les boutons

1. **Import privé du staging** : importer l'archive et son manifeste dans un stockage privé Supabase, avec une table de versions stagées contenant identifiant, provenance, période de validité, statut du service, empreinte SHA-256, nombre d'enregistrements et état d'intégrité. Le serveur vérifie l'archive après import ; le navigateur ne peut pas déclarer une empreinte comme vérifiée.
2. **Revue transactionnelle** : RPC serveur atomique qui verrouille la version, relit son état, valide les attestations et la période, vérifie le rôle via `auth.uid()`, applique les transitions autorisées et ajoute l'entrée à la chaîne de revue.
3. **Publication côté serveur** : construire le snapshot depuis l'archive privée dans un environnement serveur contrôlé, vérifier le résultat, vérifier la séparation des devoirs, puis enregistrer la publication et son empreinte dans une transaction. Ne pas faire construire un snapshot au navigateur.
4. **Annulations** : RPC séparées qui ciblent uniquement la dernière décision ou publication active et ajoutent une entrée de compensation ; aucune suppression.
5. **Console** : remplacer les appels `/api/session` par Supabase Auth et les routes locales par des appels Edge Function/RPC. Conserver les mêmes codes de refus, bloqueurs et états affichés.
6. **Tests** : comptes reviewer et publisher distincts, compte désactivé, rôle incorrect, version corrompue, attestation absente, période expirée, double clic/concurrence, relecteur qui tente de publier, annulations, chaîne d'audit altérée et reconstruction de snapshot.

## 5. Barrières de sécurité

- Aucun bouton de décision ou de publication ne doit être activé tant que les étapes 1 à 6 ne sont pas terminées.
- Ne pas créer un rôle publisher sans personne désignée et compte Auth confirmé.
- Ne pas copier les anciens journaux locaux dans les nouveaux journaux sans procédure d'import vérifiable préservant chaque entrée, son ordre, son hash et son origine.
- Ne pas modifier les tables mobilité, les horaires TER/BRT, les arrêts ou les lignes dans le cadre de cette migration.
- Aucun déploiement Render et aucune fusion automatique du PR.

## 6. Prochaine unité de travail

Construire d'abord l'import privé des archives/manifests et les tests d'intégrité. Tant que les données sources ne sont pas disponibles côté serveur, l'implémentation des RPC de revue/publication ne doit pas accepter les simples identifiants du catalogue mobilité comme preuve d'un dataset vérifié.
