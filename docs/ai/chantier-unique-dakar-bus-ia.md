# Chantier unique — intelligence artificielle Dakar Bus

**Référence de travail :** PR unique « Dakar Bus IA — chantier consolidé »  
**État de ce commit :** phase 1 implémentée sur branche de travail ; non fusionnée, non déployée.  
**Branche :** `feat/dakar-bus-ai-single-workstream`

## Objectif

Faire évoluer l'assistant existant en copilote de mobilité fiable. Le copilote doit s'appuyer sur les données réellement disponibles dans Dakar Bus, expliquer leur provenance et signaler clairement ce qu'il ne sait pas. Il ne doit jamais inventer un horaire, un arrêt, une position de véhicule, une perturbation ou une correspondance.

## État réel de l'application sur la branche principale avant ce chantier

- Un assistant conversationnel local existe déjà dans `src/components/AssistantChat.tsx`.
- Son moteur local s'appuie sur le référentiel de mobilité, les fonctions de connaissance, le calculateur et les alertes transmises par l'application.
- Les réponses vocales et la dictée sont prises en charge selon les capacités du navigateur et les réglages de confidentialité.
- Le contexte de conversation est conservé en mémoire vive pendant la session.
- La mémoire persistante entre deux ouvertures n'était pas encore branchée dans l'assistant.
- Il n'y a pas de preuve dans le code principal que le copilote soit déjà connecté à une source GPS de flotte, à des capteurs routiers ou à un flux temps réel opérateur.

## Phases du chantier unique

### Phase 1 — mémoire de trajet locale (implémentée dans cette PR)

- Restaurer uniquement les lieux et le dernier trajet explicitement connus, sur le même appareil.
- Respecter le réglage existant « conserver l'historique des lieux ».
- Effacer la mémoire persistante et la mémoire vive quand ce réglage est désactivé.
- Limiter la conservation à 30 jours.
- Ne jamais restaurer les anciennes réponses, alertes ou horaires : ces informations peuvent avoir expiré.
- Valider les coordonnées et les données relues avant de les réutiliser.

### Phase 2 — connaissance réseau consolidée

- [x] Client Supabase en lecture seule, cache cinq minutes et repli sur le moteur local si indisponible.
- [x] Réponses du copilote branchées sur le snapshot central ; TATA reste séparé d'AFTU.
- [x] Les réponses indiquent les statuts candidat/vérifié/publié et ne présentent pas une fiche candidate comme une fiche validée.
- [x] État trafic distant lu séparément ; incidents expirés exclus et ancien snapshot non réutilisé si la lecture échoue.
- [x] Sources des Edge Functions actives et configuration des accès versionnées dans le dépôt.
- Une seule couche de lecture pour les fiches DDD, AFTU, TATA, TER et BRT.
- Conserver les statuts de validation, les sources, les dates et les deux directions.
- Ne jamais présenter une donnée candidate comme une donnée validée.
- Conserver le moteur et les panneaux TER/BRT existants sans les remplacer.
- Pas de dépendance au GTFS pour commencer.

### Phase 3 — itinéraires et correspondances

- Le calcul reste déterministe et séparé du modèle conversationnel.
- L'IA demande un calcul au moteur et reformule son résultat ; elle ne fabrique pas de trajet.
- Ajouter les lignes bus uniquement quand les deux sens et les arrêts nécessaires sont validés.

### Phase 4 — alertes et observation

- Distinguer signalement communautaire, observation qualifiée et incident confirmé.
- GPS du voyageur uniquement avec consentement explicite, limité à l'usage nécessaire.
- Aucun suivi caché en arrière-plan.
- Le suivi de proximité du téléphone est suspendu en arrière-plan et lorsque le réglage GPS est « Jamais » ; il reprend au premier plan si la géolocalisation reste autorisée.
- Aucun GPS de véhicule ou capteur prétendu actif sans flux partenaire réel et autorisé.

### Phase 5 — voix et langues

- Consolider français et wolof sans annoncer une couverture wolof qui n'est pas validée.
- Toute transcription ou réponse vocale doit garder un mode texte accessible.

## Documents techniques récupérés

Les documents de conception et de couverture ont été regroupés sous `docs/ai/` :
- `architecture-mobility-brain-v1.md` : architecture du cerveau de mobilité et principes de séparation.
- `schema-proposal-v1.sql` : proposition de schéma uniquement ; ce fichier n'est pas une migration et ne doit pas être exécuté tel quel.
- `network-coverage-2026-11-12.md` : inventaire et limites de couverture des réseaux.
- `gps-capteurs-alertes-ia.md` : cadrage de la collecte GPS, des capteurs et des alertes.
- `audit-supabase-2026-11-14.md` : état réel des tables, statuts, fonctions Edge, privilèges et alertes de sécurité.

## Règles de livraison

1. Cette PR est l'unique PR de référence du chantier IA ; les changements IA suivants doivent être intégrés à cette branche avant fusion, pas dispersés en PR concurrentes.
2. Ne pas fusionner en bloc les anciennes PR #106, #107, #109, #112, #114 et #115 : elles contiennent des périmètres différents, des recouvrements et des éléments qui nécessitent une revue technique et de sécurité.
3. Les anciennes propositions sont reprises sélectivement dans cette PR ; leurs PR sources sont fermées après récupération ou décision documentée.
4. Aucune migration Supabase, fonction serveur, clé, collecte externe ou modification de données réseau ne sera activée sans vérification de son schéma, de ses droits, de ses secrets et de ses tests.
5. La PR n'est pas considérée terminée tant que CI n'est pas verte, que les fonctions sont vérifiées et que le déploiement de production n'a pas été contrôlé.

## Suivi

- [x] Phase 1 : mémoire locale, durée maximale, validation des données et effacement sur désactivation.
- [x] Protection GPS : arrêt du suivi en arrière-plan, reprise au premier plan et arrêt si le GPS est interdit.
- [x] Correctif du parseur wolof « joge … dem … » récupéré de l'ancienne PR #107.
- [ ] Phase 2 : rapprocher les validations propriétaires et les sources ligne par ligne dans Supabase ; les fiches candidates restent candidates jusqu'à preuve.
- [ ] Phase 3 : calcul d'itinéraires bus et multimodaux basé uniquement sur les données validées.
- [x] Phase 4 (lecture) : consulter l'état des alertes et distinguer confirmé/candidat/expiré.
- [ ] Phase 4 (observation) : connecter une vraie source opérateur/capteur après preuve d'accès ; aucune n'est vérifiée aujourd'hui.
- [ ] Phase 5 : consolidation voix et wolof.
- [ ] CI complète et revue finale.
- [ ] Test réel de l'appel Edge Function depuis l'application publiée.
- [ ] Fusion et vérification du déploiement.
