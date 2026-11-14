# Audit réel Supabase — Dakar Bus

**Date de contrôle : 14 novembre 2026**  
**Type : lecture seule.** Aucune table, ligne, migration, fonction ou clé n'a été modifiée pendant cet audit.

## État réellement observé

Le projet Supabase Dakar Bus est déjà initialisé et contient un référentiel de mobilité. Les comptages ci-dessous proviennent de requêtes SQL en lecture seule, regroupées par réseau et statut des lignes.

| Réseau | Lignes candidates | Directions | Occurrences d'arrêts ordonnées |
|---|---:|---:|---:|
| AFTU | 72 | 144 | 1 972 |
| DDD | 38 | 76 | 1 360 |
| TATA | 62 | 124 | 1 500 |
| BRT | 2 | 3 | 46 |
| TER | 1 | 2 | 26 |

Autres constats :
- 433 modèles de service sont enregistrés.
- 10 sources trafic sont répertoriées.
- 0 source n'est actuellement qualifiée comme source de circulation temps réel vérifiée.
- 36 migrations sont enregistrées dans le projet.
- Les Edge Functions `dakar-bus-knowledge` et `dakar-bus-mobility-search` sont actives ; la première est en version 27 et la seconde en version 2 au moment du contrôle.

## Statut de validation des données

Les lignes AFTU, DDD, TATA, TER et BRT remontées dans le regroupement sont au statut `candidate`. Les lignes archivées apparaissent séparément et ne sont pas à présenter comme actives.

Conséquence pour le copilote :
- il peut consulter et expliquer les fiches candidates en indiquant leur statut réel ;
- il ne doit pas présenter une fiche candidate comme une validation officielle ou comme une preuve d'horaire en direct ;
- les séquences explicitement validées dans le projet doivent être rapprochées de leurs enregistrements Supabase avant toute promotion de statut ;
- aucun horaire exact de passage ne doit être inventé à partir des seuls modèles de fréquence.

## Sécurité observée

- RLS est activé sur les tables examinées.
- La requête sur les privilèges de toutes les tables du schéma `public` retourne **0 privilège de table accordé à `anon` ou `authenticated`**. Les tables ne sont donc pas directement exposées à ces rôles via des grants.
- Les avis Supabase signalent 36 tables avec RLS sans politique. Dans le modèle actuel, cela bloque les rôles clients tant qu'aucune politique/grant n'est défini ; ce signal est à documenter, pas à corriger en ouvrant l'accès.
- Deux avertissements supplémentaires ont été observés : `pg_net` installé dans le schéma `public`, et protection des mots de passe compromis désactivée dans Auth. Ils sont préexistants et ne sont pas modifiés par cette PR.

## Écart avec l'ancienne PR #109

La PR #109 contient une archive de migrations présentée comme l'historique appliqué au 12 novembre, mais l'état réel consulté le 14 novembre contient 36 migrations, dont des migrations plus récentes liées à l'administration et au staging GTFS privé.

**Décision : ne pas recopier ni rejouer l'archive SQL de #109, ni remplacer en bloc `supabase/config.toml` à partir de cette branche.** Il faut comparer chaque fichier à l'état réel avant toute reprise. L'archive est documentaire, pas une migration à exécuter.

## État réel de l'IA côté application

- Sur `main`, l'assistant visible est encore piloté par le moteur local de règles et le référentiel local.
- Le branchement du navigateur sur les Edge Functions Supabase apparaît dans la PR #109, pas dans `main`.
- Les fonctions serveur sont donc actives dans Supabase, mais cela ne prouve pas que l'application publiée les interroge.
- Aucun GPS de flotte, capteur routier ou flux temps réel opérateur n'a été vérifié comme actif.

## Correctif de compatibilité des clés

L'ancienne branche #109 envoyait la clé `sb_publishable_` à la fois dans `apikey` et dans `Authorization: Bearer`. La documentation Supabase actuelle précise que les nouvelles clés publishable/secret ne sont pas des JWT et ne doivent pas être envoyées dans `Authorization`. Le client repris dans la PR #154 n'envoie désormais que l'en-tête `apikey`. Aucun secret `service_role` n'est embarqué dans le navigateur.

## Décision pour la PR de référence #154

1. Reprendre sélectivement le client de lecture Supabase de #109, après comparaison de son contrat JSON avec la fonction déjà déployée.
2. Garder les appels en lecture seule et le repli local si Supabase est indisponible.
3. Ne jamais envoyer au serveur la question, le texte de conversation, la position GPS ou les préférences personnelles.
4. Ne faire aucune migration et aucun changement de données pendant cette phase de connexion.
5. Avant de dire « IA connectée », vérifier un appel réel depuis l'application et l'affichage d'une réponse fondée sur le snapshot.
