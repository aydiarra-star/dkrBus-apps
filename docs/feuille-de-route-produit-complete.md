# Feuille de route produit complète — Dakar Bus

Date de consolidation : 13 novembre 2026  
Dépôt de référence : `aydiarra-star/dkrBus-apps`  
Cette feuille de route rassemble les décisions produit et les garde-fous déjà établis. Elle complète les spécifications techniques sans les remplacer.

## 1. Vision

Dakar Bus doit être un véritable assistant de mobilité pour Dakar : aider à choisir un trajet, comprendre les passages, suivre les perturbations, trouver les arrêts et améliorer continuellement la qualité des données. L'assistant IA n'est pas un simple chatbot : il aide les voyageurs et, dans un espace privé distinct, les administrateurs à contrôler les données.

L'application reste mobile-first, en français et avec une voie d'évolution Wolof. Les quatre espaces déjà définis restent cohérents : Explorer, Trajet, Alertes et Paramètres.

## 2. Deux IA séparées et complémentaires

### 2.1 Assistant voyageurs

L'assistant public doit :
- comprendre une demande en langage naturel et demander une précision lorsqu'un départ ou une destination est ambigu ;
- trouver les arrêts explicitement connus et les lignes réellement présentes dans le référentiel ;
- construire et comparer des itinéraires selon la durée, la marche et le nombre de correspondances ;
- présenter distinctement aller et retour, les arrêts intermédiaires et les correspondances ;
- expliquer les horaires, créneaux et comptes à rebours avec leur statut réel ;
- résumer les alertes à partir du même instantané frais que l'onglet Alertes ;
- signaler clairement ce qui est indisponible plutôt que compléter les trous par invention ;
- évoluer vers une expérience française et wolof cohérente.

Il ne doit jamais prétendre connaître la position d'un véhicule, un retard ou un passage temps réel sans flux opérateur correspondant.

### 2.2 Copilote privé de gouvernance

Le copilote de la console doit analyser les arrêts, lignes, séquences, coordonnées, horaires, sources et anomalies ; expliquer ses constats ; proposer des corrections documentées ; afficher les preuves, la provenance et le niveau de confiance ; apprendre des décisions humaines validées au sens d'une amélioration contrôlée des règles et évaluations.

Il ne crée, ne modifie, ne valide et ne publie jamais seul une donnée officielle. Les détails sont définis dans `spec-copilote-ia-gouvernance-donnees.md`.

## 3. Enrichissement du réseau et des lignes

Objectif : couvrir progressivement les réseaux TER, BRT, Dakar Dem Dikk (DDD), AFTU et TATA, sans confondre une donnée de référence, une estimation documentée et une donnée opérateur officielle.

Pour chaque ligne, constituer une fiche structurée :
- identifiant stable, réseau/opérateur, numéro et nom de ligne ;
- terminus de chaque sens, arrêts dans leur ordre réel connu et variantes/branches ;
- séquences aller et retour indépendantes, sans supposer que le retour est toujours l'inverse exact ;
- arrêts intermédiaires, arrêts communs, pôles d'échange et correspondances ;
- premier et dernier départ, jours de service, périodes et intervalles lorsqu'ils sont connus ;
- temps de parcours et temps d'attente uniquement avec méthode, hypothèses et provenance ;
- source, date de collecte, date de vérification, statut et confiance conservés dans les données ;
- lacunes et contradictions explicitement enregistrées.

Les 1 133 arrêts environ sans GPS doivent être rapprochés des lignes, sens, séquences, arrêts précédents/suivants, autres lignes et candidats OSM. Un nom identique ne suffit jamais à fusionner deux arrêts : quais opposés, plateformes et arrêts homonymes peuvent être distincts.

### Données de travail déjà communiquées pour les réseaux bus

Ces valeurs sont des hypothèses de travail communiquées pour préparer les lignes en attendant les données officielles complètes. Elles ne doivent pas être présentées dans la base comme des horaires opérateur certifiés :
- DDD : premiers départs généralement entre 05:30 et 06:00 ; derniers entre 20:30 et 21:00 ; intervalles de travail 7–10 min en pointe et 10–15 min hors pointe.
- AFTU : intervalle moyen de travail 11,6 min et attente de référence 8 min.
- Exemples de fiches/horaires déjà communiqués : 2B (04:00–22:09, 11 min), AFTU 5 (06:00–23:00, 10 min), AFTU 29 (05:10–22:58, 12 min), AFTU 30 (05:15–21:51, 12 min).

Les 38 lignes DDD, 72 lignes AFTU / 14 GIE / 2 300 bus sont des repères de couverture à contrôler contre une source actuelle avant de les qualifier d'exhaustifs. Les lignes TATA doivent également être enrichies individuellement, sans extrapoler une fréquence unique à tout le réseau.

## 4. Itinéraires : aller, retour et correspondances

L'expérience Trajet doit permettre :
- de rechercher entre deux lieux ou arrêts connus ;
- de présenter le parcours complet, dans le bon ordre, pour le sens demandé ;
- d'afficher séparément les propositions aller et retour lorsqu'elles sont consultées ;
- de lister tous les arrêts intermédiaires de chaque tronçon ;
- de montrer les changements de ligne, les points de correspondance et les marches de liaison ;
- de distinguer trajet direct, trajet avec correspondance et trajet non calculable ;
- de comparer les options : plus rapide, moins de marche, moins de correspondances ;
- de ne proposer que les itinéraires supportés par le graphe de données disponible ;
- de conserver le lien entre chaque tronçon, la ligne, le sens, les arrêts et la source.

Ne jamais inverser mécaniquement une séquence pour fabriquer le retour. Les boucles, branches, terminus différents et arrêts non desservis dans un sens doivent être représentés comme tels. Si le sens retour n'est pas connu, l'indiquer et ne pas l'inventer.

## 5. Horaires, prochains passages et compte à rebours

L'affichage des prochains passages doit être simple et homogène :
- compte à rebours lisible en minutes, qui diminue automatiquement ;
- décompte jamais égal à « 0 min » ni « moins d'une minute » ;
- couleur verte pour les minutes restantes dans les panneaux de lignes ;
- affichage station par station et pour les deux sens aller/retour ;
- aux terminus, indiquer le terminus dans le sens non desservi ;
- actualiser le décompte sans recharger toute la page ;
- distinguer un horaire théorique calculé d'un départ exact issu d'un horaire publié ou d'un flux temps réel autorisé.

### Règles d'affichage produit à respecter

- Les panneaux de détails DDD/AFTU/TATA doivent reprendre exactement la présentation visuelle des panneaux TER/BRT : créneaux, heures de passage et compte à rebours.
- Les détails de chaque arrêt doivent montrer les passages aller et retour quand ils sont connus.
- Ne pas ajouter de petits paragraphes explicatifs ou de mention « estimation indicative » dans les panneaux de passage ; les statuts, provenance, hypothèses et niveaux de confiance restent dans les données et les écrans d'information appropriés.
- Ne jamais afficher une valeur de compte à rebours fabriquée pour masquer une donnée absente.
- La fréquence ne doit pas encombrer les cartes principales.
- Aucun « 0 min », aucun montant de tarif non vérifié et aucun faux badge LIVE.
- Les horaires TER/BRT validés par les utilisateurs et conformes aux affichages en station sont une référence protégée : ne pas les recalculer, les déplacer, les remplacer ou les retoucher pendant l'enrichissement des bus.

### Références TER/BRT protégées

- BRT : 23 stations ; B1 06:00–21:00, intervalle de référence 6 min du lundi au samedi ; dimanche/jours fériés : 10 min de 06:00 à 11:00 puis 7 min de 11:00 à 21:00. Toute autre ligne/sens doit rester limité à ce qui est effectivement confirmé.
- TER : périmètre de référence des 13 gares Dakar–Diamniadio ; intervalle de référence de 10 min en journée puis 20 min le soir en semaine selon les données communiquées ; dimanche/jours fériés 20 min de 06:25 à 22:05. Ne pas étendre à la phase AIBD sans source et validation.
- Ces valeurs sont des données protégées de référence et ne sont pas une autorisation de modifier les implémentations existantes.

## 6. Alertes circulation et perturbations

L'onglet Alertes doit être un service d'information fiable, pas un flux de rumeurs :
- collecter les informations disponibles auprès des canaux CETUD, TER/SETER, SunuBRT, DDD et sources routières autorisées ;
- intégrer les incidents routiers géolocalisés, les perturbations opérateur, travaux, interruptions, déviations et fins d'incident quand ils sont explicitement documentés ;
- actualiser au démarrage, toutes les heures, au retour de veille, à la reconnexion et après actualisation GPS autorisée ;
- expirer les données après 60 minutes maximum, ou plus tôt selon la source ;
- aligner les notifications, le panneau, la carte et le résumé IA sur le même instantané ;
- géofiltrer les incidents routiers autour de l'utilisateur (rayon déjà défini : 1,5 km) quand un GPS frais et autorisé existe ;
- présenter séparément les alertes officielles et les témoignages communautaires « Direct rue » non vérifiés ;
- empêcher un témoignage non vérifié de devenir une alerte officielle ou une affirmation de trafic fluide ;
- ne dire « trafic fluide » que lorsque les cinq preuves complètes et fraîches requises sont présentes, sans incident ni témoignage pertinent ;
- en cas de couverture partielle, panne ou absence de flux, indiquer seulement qu'aucune perturbation récente n'a été signalée dans les données recueillies ;
- ne pas promettre de notifications push lorsque la PWA est fermée ou que le navigateur suspend l'exécution.

Les règles techniques détaillées et les limites des accès sont dans :
- `alertes-trafic-2026-10-11.md`
- `veille-direct-rue-2026-10-11.md`
- `acces-flux-reels-2026-10-11.md`

## 7. Carte, recherche et expérience voyageur

Continuer à enrichir sans refonte arbitraire :
- carte de Dakar couvrant les zones utiles et les réseaux réellement documentés ;
- recherche « On va où ? » sur les lieux et arrêts connus ;
- choix explicite du départ et de la destination, sans inventer une adresse à partir d'un simple point carte ;
- affichage des lignes, arrêts, terminus, directions et correspondances ;
- accès aux prochains passages depuis une station ;
- couches de réseau activables et lisibles ;
- favoris Maison, Boulot et Adresse avec consentement et contrôle utilisateur ;
- PWA et mode hors connexion clairement limités aux données effectivement mises en cache et datées ;
- assistant français et wolof, avec refus explicite lorsqu'une traduction ou une donnée n'est pas fiable.

## 8. GTFS et sources

Le GTFS réel du CETUD n'a pas été reçu. Il ne doit pas être déclaré disponible ni être simulé comme un jeu officiel. Le GTFS de référence généré dans le dépôt est un outil de test/staging uniquement, jamais un substitut au GTFS opérateur.

Quand un GTFS réel sera obtenu :
- vérifier l'identité de l'éditeur, les droits de réutilisation, l'opérateur, le service exploité et la fraîcheur ;
- préserver le ZIP original, son checksum et le manifeste de provenance ;
- faire tourner l'auditeur dans le staging privé ;
- comparer les arrêts, lignes, séquences, horaires et calendriers au catalogue existant ;
- exiger les attestations et décisions humaines prévues ;
- publier séparément un snapshot immuable après approbation.

OSM est une source communautaire utile pour les candidats et la géographie, jamais une validation officielle par défaut. Toute information conserve sa provenance et sa date.

## 9. Console d'administration et qualité

La console doit réunir :
- tableau de bord de couverture par réseau et zone ;
- arrêts sans GPS, coordonnées invalides et candidats de rapprochement ;
- doublons possibles et noms ambigus ;
- séquences aller/retour, ruptures, références inconnues et répétitions ;
- lignes incomplètes, arrêts non desservis dans un sens et variantes ;
- horaires expirés, calendriers incohérents et données contradictoires ;
- provenance, preuve, confiance, version de l'analyse et historique ;
- file de revue priorisée, avec acceptation/rejet/correction motivés ;
- journal append-only et séparation relecteur/publieur ;
- statistiques de qualité et suivi des décisions humaines.

Les décisions humaines validées servent à évaluer les faux positifs/faux négatifs et à améliorer les règles et prompts par versions, tests et approbation. Aucune modification automatique des poids, du modèle ou du catalogue n'est autorisée.

## 10. Ordre d'exécution

1. Terminer la CI et les tests du validateur/worker privé, sans l'activer sur des données réelles tant que l'accès Supabase et les secrets ne sont pas vérifiés.
2. Finaliser le moteur déterministe de contrôle des arrêts et séquences, puis brancher ses rapports à la console privée.
3. Construire le tableau de bord qualité et la file de revue humaine.
4. Enrichir progressivement les lignes DDD, AFTU et TATA, chaque ligne avec ses deux sens, ses arrêts et ses créneaux documentés.
5. Étendre le tableau de passages et les comptes à rebours aux lignes bus, en conservant strictement l'affichage TER/BRT.
6. Renforcer le calculateur multimodal avec les lignes et correspondances validées, et vérifier les itinéraires aller/retour.
7. Fiabiliser les adaptateurs d'alertes et les notifications, sans déclarer LIVE une couverture partielle.
8. Ajouter l'IA explicative à la gouvernance et améliorer l'assistant voyageurs à partir des données réelles.
9. Effectuer une recette complète sur un environnement isolé, puis une publication séparée et autorisée.

## 11. Interdictions et critères de réussite

- Ne pas modifier les horaires TER/BRT validés.
- Ne pas inventer un arrêt, un GPS, une ligne, un sens, un trajet, un horaire, un retard ou un incident.
- Ne pas transformer une estimation interne en fait officiel.
- Ne pas fusionner des arrêts sur le seul critère du nom.
- Ne pas publier automatiquement une suggestion IA.
- Ne pas injecter de données de test dans le catalogue réel.
- Ne pas exposer les secrets ni contourner les accès Supabase refusés.
- Ne pas déployer sur Render dans le cadre du chantier actuel.
- Ne pas traiter le GTFS CETUD comme reçu.

Le chantier est terminé uniquement lorsque les tests automatisés, la vérification des sources, les décisions humaines, la séparation des environnements et la recette voyageur sont documentés. Une PR fusionnée ou une compilation réussie ne suffit pas.
