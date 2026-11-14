# GPS, capteurs et intelligence de mobilité — architecture cible

Date : 12 novembre 2026  
Statut : proposition d'architecture, non déployée  
Périmètre : détection de perturbations, alertes voyageurs, copilote IA.

## Objectif

Faire évoluer Dakar Bus vers un assistant de mobilité capable de comprendre le réseau réel, d'observer les perturbations, d'anticiper leurs conséquences et de conseiller les voyageurs. La fiabilité prime sur le volume d'alertes : aucune position, aucun incident, aucun retard et aucun itinéraire ne doit être inventé.

Cette proposition complète les mécanismes existants décrits dans `docs/alertes-trafic-2026-10-11.md` et `docs/veille-direct-rue-2026-10-11.md`. Elle ne les remplace pas et ne prétend pas qu'un flux GPS opérateur ou capteur routier est déjà connecté.

## 1. Sources d'observation : quatre familles distinctes

### A. GPS du téléphone du voyageur (opt-in)

- La géolocalisation reste désactivée tant que la personne ne l'autorise pas.
- Le partage d'une observation de circulation doit être un choix séparé, explicite et révocable ; autoriser le GPS pour trouver un arrêt ne vaut pas consentement à contribuer au trafic.
- Aucun suivi continu en arrière-plan par défaut. Collecte ponctuelle pendant l'usage, avec durée, précision et finalité affichées.
- Réduire les données au strict nécessaire : position arrondie/segment routier, vitesse dérivée si la précision le permet, horodatage, précision GPS et identifiant de session éphémère.
- Ne pas conserver de trajectoire individuelle, d'identifiant publicitaire, de numéro de téléphone ou de profil de déplacement.
- Écarter les positions imprécises, impossibles, anciennes, hors zone ou manifestement aberrantes.

### B. GPS des véhicules de transport

Source à privilégier pour les positions de bus et véhicules opérateurs, sous réserve d'un accord et d'un flux autorisé avec DDD, AFTU/GIE, opérateurs TATA, TER et SunuBRT.

Chaque point doit porter : opérateur, véhicule pseudonymisé, réseau/ligne si confirmé, coordonnées, heure de mesure par l'appareil, heure de réception serveur, précision, vitesse, cap, statut du dispositif et provenance contractuelle.

Ne jamais associer un véhicule à une ligne uniquement par proximité géographique. L'association doit venir d'un identifiant opérateur ou d'une règle explicitement validée.

### C. Capteurs routiers et infrastructure

Intégrations possibles après accord d'accès : boucles inductives, caméras avec comptage anonymisé, capteurs de vitesse, données de feux, postes de péage et plateformes publiques d'exploitation routière.

Dakar Bus ne doit pas aspirer de vidéo brute ni reconnaître des plaques ou des visages. Utiliser des agrégats (volume, vitesse moyenne, occupation, état) et des métadonnées minimales.

### D. Signalements « Direct rue »

Les témoignages restent une source communautaire non vérifiée. Ils peuvent déclencher une vérification ou augmenter la priorité d'une enquête, mais ne deviennent pas seuls une alerte officielle.

Dakaractu et SeneNews ne font pas partie des sources automatiques cibles ; leurs collectes doivent rester désactivées et ne pas être réactivées.

## 2. Modèle de qualité et de confiance

Chaque observation doit contenir au minimum :

- `source_type` : `PHONE_GPS`, `FLEET_GPS`, `ROAD_SENSOR`, `OPERATOR_FEED`, `COMMUNITY_REPORT` ;
- `observed_at` et `received_at` en UTC ;
- coordonnées ou segment routier, précision et méthode de géolocalisation ;
- vitesse mesurée ou valeur agrégée, avec unité ;
- `source_id` et référence de provenance ;
- durée de conservation et politique de consentement ;
- indicateurs de qualité (âge, précision, plausibilité, doublon, cohérence spatiale).

Les observations sont classées comme suit :

1. **Brute** : reçue, non interprétée.
2. **Qualifiée** : fraîche, géolocalisée, plausible et suffisamment précise.
3. **Convergente** : corroborée par plusieurs observations indépendantes ou une source opérateur.
4. **Confirmée** : validée par un flux opérateur/institutionnel fiable ou un processus de vérification documenté.
5. **Résolue / expirée** : fin confirmée ou durée de validité dépassée.

Ne pas utiliser un score numérique seul pour transformer une rumeur en fait. L'écran doit distinguer clairement « signalement », « ralentissement détecté », « perturbation probable » et « incident confirmé ».

## 3. Détection prudente des ralentissements

Le traitement s'effectue sur des segments routiers, jamais sur des trajectoires personnelles.

- Faire correspondre les observations GPS à une route uniquement si la précision le permet.
- Comparer la vitesse observée à une référence locale comparable (même segment et période), pas à une vitesse générique supposée.
- Exiger plusieurs appareils ou véhicules indépendants, sur une fenêtre temporelle courte, avant de produire « ralentissement détecté ».
- Pondérer selon la précision, la fraîcheur, l'indépendance des sources et la densité d'observations.
- Détecter les anomalies : GPS qui saute, vitesse impossible, points répétés, appareils concentrés artificiellement, sens de circulation incohérent.
- Fusionner les observations proches en un événement unique ; ne pas envoyer une notification par point GPS.
- Ne conclure à une route fluide que si la couverture est suffisante, fraîche et documentée. L'absence de données n'est jamais une preuve de fluidité.

Les seuils opérationnels (nombre minimal de contributeurs, fenêtre, seuil de vitesse, précision, rayon de fusion) doivent être calibrés sur des données terrain de Dakar et validés avant activation. Aucun seuil arbitraire ne doit être présenté comme une mesure déjà testée.

## 4. Cycle de vie d'une alerte

Une alerte comporte : identifiant stable, type, niveau de sévérité, géométrie ou segment, sens concerné si connu, réseaux/lignes affectés si confirmés, première et dernière observation, sources, niveau de confiance explicable, statut, date d'expiration et date de dernière vérification.

Cycle :
`DETECTED → QUALIFYING → PROBABLE → CONFIRMED → RESOLVED / EXPIRED`

- Une alerte non confirmée est explicitement étiquetée.
- Une alerte confirmée doit citer sa source et son heure de vérification.
- Une alerte sans mise à jour perd automatiquement son statut actif à l'expiration.
- Une résolution récente supplante une observation ancienne.
- Les événements identiques sont fusionnés et les notifications dédupliquées.
- Les notifications sont ciblées par zone/itinéraire choisi, et non envoyées à tous les voyageurs par défaut.
- L'utilisateur contrôle les catégories, zones, horaires silencieux et autorisations de notification.

## 5. Assistant IA : un copilote fondé sur les preuves

L'IA ne doit pas être un simple chatbot généraliste. Elle doit orchestrer des outils bornés autour d'un référentiel de mobilité versionné.

### Capacités attendues

- Comprendre le français, le wolof et les formulations mixtes ; demander une précision lorsque le lieu ou le réseau est ambigu.
- Mémoriser le contexte utile d'un trajet dans les limites du consentement : départ, destination, réseau préféré, contraintes et dernier résultat vérifiable.
- Rechercher lignes, arrêts, directions, horaires, correspondances et état des données dans le référentiel Supabase publié.
- Calculer les itinéraires avec un moteur déterministe ; l'IA explique et compare les résultats, mais ne crée jamais elle-même une séquence d'arrêts.
- Utiliser la position GPS uniquement si l'utilisateur l'a autorisée pour la fonction concernée.
- Expliquer les alertes proches, leur source, leur fraîcheur, leur statut et leur impact connu sur un trajet.
- Proposer des alternatives seulement si le calculateur peut les établir à partir de lignes et correspondances publiées.
- Répondre aux questions de suivi (« et le retour ? », « où descendre ? », « est-ce toujours bloqué ? ») en revalidant les données temporelles.
- Reconnaître explicitement les limites : données absentes, source indisponible, horaire théorique, estimation ou absence de couverture.

### Règles absolues

- Aucun arrêt, ligne, horaire, tarif, véhicule, incident ou durée inventé.
- Aucun « trafic fluide » à partir d'une réponse vide ou d'une source en panne.
- Aucune alerte périmée réutilisée dans la mémoire conversationnelle.
- Chaque affirmation dynamique doit être liée à une preuve horodatée et expirable.
- L'IA n'écrit pas dans les tables de référence, ne change pas les horaires et ne publie pas de données opérateur.
- Les actions sensibles (partage de position, création d'un signalement, activation de notifications) exigent un geste explicite.
- Si deux sources se contredisent, expliquer le désaccord et privilégier le statut le plus prudent.

## 6. Architecture technique cible

Flux logique :

`GPS / capteurs / opérateurs / Direct rue`
→ `adaptateurs d'ingestion authentifiés`
→ `validation, normalisation et anti-abus`
→ `observations temporaires`
→ `agrégation par segment routier`
→ `moteur de qualification et d'expiration`
→ `événements trafic versionnés`
→ `API de lecture filtrée`
→ `onglet Alertes + copilote IA + notifications ciblées`

Séparer strictement :
- le référentiel durable des lignes, arrêts, directions et horaires ;
- les observations GPS brutes à durée de vie courte ;
- les événements trafic agrégés et leur historique d'audit ;
- les préférences privées et consentements des utilisateurs.

Les clés d'ingestion et secrets opérateurs restent côté serveur / Vault. Aucun secret privilégié dans le navigateur. Les endpoints publics ne livrent que des événements agrégés et les champs nécessaires à l'information voyageur. Les tables privées restent inaccessibles aux rôles publics sans politiques explicitement revues.

## 7. Confidentialité, sécurité et rétention

- Consentement séparé, compréhensible, révocable et journalisé.
- Minimisation des données et pseudonymisation des appareils.
- Pas de suivi individuel des déplacements, ni de profilage publicitaire.
- Pas de vidéo brute, reconnaissance faciale ou plaque d'immatriculation.
- Chiffrement en transit, contrôle d'accès, quotas, anti-rejeu, limitation de débit et détection d'abus.
- Rétention proposée à valider : points GPS individuels éphémères supprimés rapidement après agrégation (par exemple 15 minutes) ; événements agrégés conservés selon leur utilité opérationnelle et la politique de confidentialité.
- Procédure de suppression, export et audit à définir avant ouverture publique.
- Analyse juridique et conformité RGPD à réaliser avant collecte à grande échelle, notamment pour les personnes situées en France ou utilisant l'application depuis l'Union européenne.

## 8. Déploiement progressif sans risque

### Étape 1 — Audit et contrats
Inventorier les tables, fonctions Edge, flux actifs, autorisations et données existantes. Vérifier les contrats d'adaptateurs. Aucun changement aux données de mobilité.

### Étape 2 — GPS volontaire en observation
Créer un mode de contribution ponctuelle, désactivé par défaut. Mesurer la qualité sans afficher de nouvelles alertes publiques.

### Étape 3 — Détection en mode silencieux
Calculer les ralentissements en parallèle, sans notifications. Comparer les résultats aux observations terrain et mesurer les faux positifs.

### Étape 4 — Pilote limité
Activer les alertes « ralentissement détecté » dans une zone pilote, avec étiquettes de confiance, expiration et possibilité de retour arrière.

### Étape 5 — Intégrations opérateurs et capteurs
Raccorder uniquement les sources autorisées, tester les écarts d'horloge, les trous de couverture et les résolutions.

### Étape 6 — Copilote enrichi
Brancher les outils de consultation et de calcul sur les données publiées, tester les réponses FR/WO, les questions de suivi, les contradictions et les cas sans données.

## 9. Critères d'acceptation

- Aucun point GPS n'est transmis sans consentement explicite.
- Refuser le GPS ne bloque pas la consultation manuelle des lignes et itinéraires.
- Une mauvaise précision ou une observation périmée ne crée pas d'alerte.
- Plusieurs observations d'une même source ne sont pas comptées comme plusieurs témoins indépendants.
- Les témoignages communautaires ne deviennent jamais automatiquement des incidents confirmés.
- Les alertes fusionnées sont dédupliquées, horodatées et expirent correctement.
- Une panne de source ne produit jamais un état « trafic fluide ».
- Chaque réponse IA sur le trafic expose source, statut et heure de vérification.
- Chaque itinéraire proposé correspond à des données publiées et à un résultat du moteur de calcul.
- Les tests prouvent qu'aucune donnée TER/BRT validée n'est modifiée par l'ingestion GPS ou l'IA.
- Les tests de charge, sécurité, confidentialité et faux positifs passent avant l'activation publique.

## 10. Hors périmètre de cette proposition

Ce document ne crée aucun flux opérateur, ne déploie aucun capteur, n'active aucune collecte GPS serveur, ne modifie aucune table Supabase, n'installe aucune dépendance et ne change aucun écran ou horaire. C'est une spécification destinée à être revue avant implémentation.

## 11. État opérationnel vérifié — 12 novembre 2026

Cette section distingue les capacités préparées des sources réellement raccordées.

- Aucun fournisseur GPS de flotte, capteur routier ou flux partenaire Waze for Cities n'est actuellement configuré dans le projet.
- Le serveur possède un adaptateur JSON générique pour le canal routier, mais aucune URL de fournisseur ni aucun secret partenaire ne sont activés. Cela ne constitue donc pas une couverture trafic en direct.
- Les sources institutionnelles sans API publique vérifiée restent en état « non configuré » ; les publications APS ne constituent pas un flux temps réel.
- Les collectes automatiques Dakaractu et SeneNews sont désactivées : leurs tâches planifiées 7 et 8 sont inactives, leurs endpoints historiques répondent désormais avec un statut de source désactivée, et leurs archives restent conservées.
- Les deux fiches de source correspondantes dans Supabase sont marquées « non configuré » avec une trace de désactivation par politique. Aucune observation ni archive n'a été supprimée.
- Le contrôle de la base ne relève actuellement aucun incident routier actif confirmé ni candidat actif.

**Conséquence produit :** Dakar Bus ne doit pas annoncer une surveillance GPS ou capteurs opérationnelle, ni afficher « trafic fluide » sur la seule base de l'absence de données. L'application doit continuer à présenter clairement une veille partielle ou indisponible tant qu'une source réelle n'a pas été raccordée et vérifiée.

### Conditions avant raccordement d'un fournisseur

1. Obtenir l'accord écrit du fournisseur ou de l'exploitant et documenter les finalités, champs, fréquence et durée de conservation.
2. Recevoir un flux de test avec identifiants de véhicules pseudonymisés, horodatages, précision, vitesse, cap et identifiant de ligne uniquement si fourni par l'opérateur.
3. Valider l'authentification serveur, la rotation des secrets, les quotas, l'anti-rejeu, les limites de taille et les journaux sans coordonnées personnelles.
4. Tester le décalage d'horloge, les pertes de signal, les points aberrants, les doublons et les trajets hors réseau.
5. Exécuter l'agrégation en mode silencieux et comparer les résultats à des observations terrain avant toute alerte publique.

Aucun de ces prérequis ne doit être remplacé par une simulation ou des données inventées.
