# Veille publique, Direct rue et notifications — 11 octobre 2026

## Ce qui change, sans refonte

Les quatre onglets et les deux vues **Autour de moi / Direct rue** restent à
leur place. La carte, les classes CSS et la structure des formulaires/cartes
sont conservées. Les changements portent sur les données, leur provenance et
les textes d’état ; le toast de notification est celui qui existait déjà.

- Lecture initiale, **horaire**, au réveil et à la reconnexion des alertes
  officielles/routières et du pool partagé Direct rue.
- Expiration stricte à **60 minutes exactement**, même entre deux lectures.
  Résolu, futur, date invalide, cache de veille : aucun affichage actif.
- Relecture GPS horaire après accord, sans recentrer la carte. Filtrage et
  tri local sur la dernière position fraîche, **rayon 1,5 km**.
- Aucun téléchargement, résumé IA ou passage en ligne ne rajeunit un incident.
- Aucun événement officiel ni signalement d’un autre usager n’est mis en cache
  persistant. Les anciennes déclarations locales restent locales : elles ne
  sont jamais téléversées automatiquement.

## 1. Sonde de veille publique conservatrice

`scripts/public_traffic_watch.py` lit les canaux publics enregistrés CETUD,
TER, SunuBRT, DDD et l’état SECAA. HTTPS, 5 secondes par lecture, 1 Mio maximum,
URLs fixes, aucune authentification, aucun cookie, aucune redirection.

Pour les opérateurs :

- CETUD : véritable endpoint WordPress `posts`, avec titre/contenu et `date_gmt` ;
- HTML : uniquement un bulletin `Article` / `NewsArticle` JSON-LD daté,
  jamais la date du site, un pied de page ou le texte « normal » non daté ;
- date de publication explicite, calendrier valide, fuseau connu et âge < 1 h ;
- titre de bulletin trafic et assertion d’incident **au présent** ;
- rejet des actualités génériques, historiques, dates d’un autre jour,
  annonces futures, simulations, rumeurs et négations ;
- réseau concerné explicitement identifié, aucun point GPS ou retard inventé ;
- court extrait attribué à la veille publique ; une fin d’incident explicite
  supplante le bulletin antérieur. Une fin locale à une gare ne résout pas
  arbitrairement une perturbation ailleurs.

La veille reste **PARTIAL**, jamais `LIVE` : lire quelques publications ne
prouve pas une couverture exhaustive. Un adaptateur autorisé configuré prend
priorité ; une panne de cet adaptateur ne déclenche pas un remplacement silencieux
par du scraping. Formats HTML non structurés, images seules, XML/RSS ou langues
non prises en charge : absence de preuve, pas interprétation approximative.

**Accès réel recontrôlé :** la requête CETUD avec contenu a renvoyé notamment
l’article JOJ `16911`, publié le **8 octobre 2026**, donc exclu. Le JSON routier
SECAA lu le 11 octobre reste daté du **9 octobre** et sans GPS d’incident ; il
n’est pas publié comme alerte. Voir l’[audit d’accès](acces-flux-reels-2026-10-11.md).
La CLI exécutée dans cet atelier a produit **zéro alerte et cinq états
UNAVAILABLE** : les sorties réseau directes vers les opérateurs sont restreintes.
Cela ne démontre pas une panne de leurs sites ni une connexion en production.

## 2. Direct rue : partage réel quand le serveur est disponible

Le serveur expose :

```text
GET    /api/traffic/community
POST   /api/traffic/community
DELETE /api/traffic/community/<id>
```

Les nouveaux signalements sont partagés par le formulaire **seulement lorsque
l’API répond correctement**. Le texte du formulaire indique ce partage et que
la position n’est envoyée que si l’auteur choisit **Joindre ma position**.
L’ouverture de l’onglet/GPS ne téléverse pas automatiquement cette position.
Si l’API manque, la publication reste locale et est indiquée comme telle.
Une erreur de POST conserve la déclaration locale et affiche « Partage non
confirmé », pas un faux succès. Une publication dont la réponse est perdue
peut avoir été reçue par le serveur : aucune répétition automatique du POST.

L’Assistant local effectue instantanément des contrôles de formulaire :
catégorie/réseau connus, portion de route 3–80 caractères, commentaire ≤140,
texte simple, cohérence du GPS joint et région Dakar/corridors. Il met en
forme les champs en une description, **sans appel à un LLM externe**.
**Validation de forme ≠ vérification de la réalité.** Toute présentation et
notification communautaire conserve « témoignage non vérifié », sans retard,
ligne touchée ou confirmation officielle inventés.

- **Direct rue** : toutes les déclarations fraîches, proximité d’abord,
  puis distance, puis déclarations sans coordonnées. La synthèse de cette vue
  décrit aussi les déclarations sans GPS, sans prétendre les situer près de vous.
- **Autour de moi / chat / recherche** : les témoignages géolocalisés dans le
  rayon, en plus des incidents officiels pertinents. Sans GPS, aucune proximité
  n’est inventée. Les deux provenances ne se confondent jamais.
- Un témoignage pertinent empêche une synthèse verte « trafic fluide », même
  si les flux officiels ne signalent pas de perturbation.
- Seul l’auteur peut retirer son signalement partagé. Les autres boutons de
  retrait restent présents mais désactivés. Le serveur exige une capacité de
  retrait opaque ; seule son empreinte est stockée, jamais exposée en GET.
- Un retrait demandé pendant un POST est réconcilié dès réception de son
  accusé, sans réinstaller le signalement local supprimé.
- Limites : 4 Kio par POST, 500 déclarations actives, 5 publications/minute
  par adresse de connexion (empreinte salée temporaire, non stockée en SQLite).
  Derrière un reverse proxy, prévoir aussi une limitation/modération à l’entrée :
  l’API ne fait pas confiance à un `X-Forwarded-For` fourni par le client.

SQLite `data/traffic/community/reports.sqlite` est **hors Git**, mode fichier
0600, dates UTC attribuées par le serveur, suppression des lignes périmées lors
des lectures/écritures (`secure_delete`). Si aucun client n’interroge le service,
la purge physique a lieu à la prochaine lecture/écriture ; l’API, l’écran et
les notifications ne rendent jamais ces lignes périmées. Les reçus auteur du
navigateur sont également purgés à leur expiration. Pas de compte voyageur,
profil stable ni transmission des signalements aux opérateurs.

Ce service anonyme n’offre pas de vérification humaine, consensus multi-auteurs
ni protection complète contre les abus coordonnés. Les quotas ne sont pas du
fact checking ; une modération opérateur et une infrastructure d’exploitation
restent nécessaires pour une ouverture publique à grande échelle.

## 3. Notifications et état vide

Les notifications suivent les mêmes dates et le même GPS que les panneaux.
Une preuve identique n’est pas notifiée plusieurs fois. Résolution, perte de
source, sortie du rayon et expiration retirent la notification concernée.

- Toast existant : durée habituelle 3,6 s, bornée par l’expiration de l’alerte.
- Notifications navigateur : uniquement si la permission est **déjà accordée**,
  au maximum trois par lot, fermées à l’expiration/résolution. Aucune demande de
  permission surprise ni notification système forcée ; le toast fonctionne
  même si le navigateur refuse les notifications.
- Pas de push serveur ni garantie d’exécution lorsque la PWA est fermée.
  Un navigateur suspendu peut différer une temporisation ; au réveil, les
  observations sont revalidées avant affichage. Voir les limites navigateur
  dans la [documentation de fraîcheur](alertes-trafic-2026-10-11.md).

Sans incident récent pertinent : **« Aucune perturbation récente signalée
 dans votre zone »** (ou « dans l’application » sans GPS). La réserve précise
que cela ne concerne que les données recueillies si la veille est partielle
ou indisponible. **« Trafic fluide / Aucune perturbation en cours »** demeure
réservé à cinq preuves complètes fraîches, zéro incident pertinent et aucun
témoignage pertinent ; une réponse vide ou une panne ne suffit pas.

## 4. Démarrage

```sh
# Active la veille enregistrée et le service partagé ; données/secrets hors Git.
npm run admin:api
# Autre terminal : UI existante, appels relatifs /api via le proxy Vite.
npm run dev

# Diagnostic ponctuel, sans stockage ni vieux fallback :
npm run traffic:watch
```

Le lanceur API passe `--traffic-public-watch` et
`--community-reports-root data/traffic/community`. Un appel direct à
`create_server` sans ces options garde les deux services optionnels désactivés
(compatible avec les usages et tests d’administration existants).
Le serveur doit pouvoir joindre les domaines des opérateurs pour la veille.
Un hébergement statique GitHub Pages seul ne fournit **ni collecte serveur
ni partage** : exposer `/api` sur la même origine via un serveur/reverse proxy.
En production : HTTPS, host autorisé, droits de réutilisation des sources,
quotas/modération, gestion des données et supervision doivent être vérifiés.

Aucun compte opérateur, habilitation privée ni flux exhaustif supplémentaire
n’a été obtenu. Cette évolution est une logique de veille/partage dans le dépôt,
pas un déploiement ni une promesse que les cinq flux temps réel sont raccordés.

## 5. Validation effectuée

- **545 tests frontend / 45 fichiers réussis** (dont les parcours App, les
  cycles horaires, GPS, communautés, résolution et notifications).
- **189 tests Python réussis** : contrats de flux, scraping conservateur,
  stockage communautaire et vrais échanges HTTP sur serveur local de test.
- **Build TypeScript/Vite et deux tests smoke de production réussis**.
- `git diff --check` et liens locaux de documentation vérifiés.
- Aucun test n’a créé d’incident de démonstration dans l’application ou
  téléversé de fixture à un opérateur ; les données de test restent isolées.
- Pas de validation visuelle par navigateur réel pour cette évolution ; les
  tests DOM et le smoke du bundle ne remplacent pas une capture multi-écrans.
