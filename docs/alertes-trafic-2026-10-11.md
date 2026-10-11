# Alertes trafic — actualisation et purge horaire

Date : 11 octobre 2026. Périmètre : logique des flux, GPS, synthèse IA et cache.
La structure DOM des panneaux, les classes CSS, la navigation et la carte ne
changent pas. Seuls les contenus et états liés aux données sont actualisés.

## 1. Correction livrée

- Suppression des incidents `AI_SAMPLE` de la liste active : aucun exemple
  horodaté au démarrage n'est utilisé comme information trafic.
- `GET /api/traffic/alerts` au démarrage et **toutes les 3 600 000 ms**, quel que
  soit l'onglet ouvert. L'horloge est indépendante des horaires de transport.
- Revalidation à la reprise (`visibilitychange`, `pageshow`, `focus`), à la
  reconnexion et après déplacement GPS. Les petits déplacements sont regroupés
  (80 m / 30 s) ; le géofiltrage local utilise immédiatement la dernière position.
- Relecture GPS horaire/après veille avec `maximumAge: 0`, uniquement après
  autorisation de localisation, sans recentrer la carte ni modifier les contrôles.
- Expiration exacte, également **entre deux récupérations** : `updatedAt` et
  `confirmedAt` doivent être non futurs et strictement âgés de moins d'une heure.
  Un `expiresAt` plus court est respecté. Les dates exigent un fuseau explicite.
- Une résolution/retrait de confirmation plus récent supplante l'ancien état,
  même s'il provient d'une autre source. À égalité, une résolution gagne.
- Chaque réponse remplace le snapshot précédent. Les réponses tardives et les
  requêtes annulées ne peuvent pas réinstaller un ancien jeu d'alertes.
- Les réponses trafic de la recherche et du chat suivent le snapshot courant,
  y compris « répète ». Une date limite interdit aussi la réutilisation d'une
  synthèse périmée conservée dans un ancien contexte IA ; les autres échanges
  et la structure de la conversation sont inchangés.
- Aucun snapshot d'incidents officiels n'est écrit dans `localStorage` ou sur
  disque. Requêtes et réponses HTTP : `no-store`, API exclue du service worker.
  Le cache de shell **v7** renouvelle la logique de veille/partage et retire les anciens bundles ; toutes les API restent hors cache.
- « Direct rue » reste un témoignage **non vérifié**, jamais une confirmation
  officielle. Les nouveaux signalements sont partagés si l'API est disponible,
  sinon locaux, avec contrôle de forme par l'Assistant, tri GPS, synthèse et
  notifications explicitement communautaires. Durée maximale : **60 minutes**.
  Les anciennes déclarations locales ne sont pas téléversées ; les caches de
  90 minutes sont plafonnés depuis leur date de création, sans rajeunissement.
  Voir la [veille, le partage et les notifications](veille-direct-rue-2026-10-11.md).

**Limite navigateur :** un navigateur peut suspendre les temporisations d'un
onglet en arrière-plan ou d'une PWA fermée. Aucun rafraîchissement en arrière-plan
fermé n'est promis : au retour, la purge et une récupération se font immédiatement,
sans afficher les données périmées pendant l'attente.

## 2. Sources et statut « fluide »

Le proxy serveur interroge en parallèle les adaptateurs autorisés :

| Identifiant | Provenance | Canal documentaire (ce n'est pas une API) |
| --- | --- | --- |
| `cetud` | OFFICIAL | https://cetud.sn |
| `ter` | OFFICIAL | https://sentersa.sn — SENTER / SETER (TER) |
| `sunubrt` | OFFICIAL | https://sunubrt.sn |
| `ddd` | OFFICIAL | https://demdikk.sn — Dakar Dem Dikk |
| `road` | TRAFFIC | Fournisseur d'incidents routiers géolocalisés autorisé |

**Des accès publics réels ont maintenant été identifiés et lus** : API trafic
SECAA/Autoroute de l'Avenir et API éditoriale CETUD. Voir l'[audit des accès,
preuves et contacts techniques](acces-flux-reels-2026-10-11.md).
**Cela ne fournit pas encore cinq flux d'incidents complets, frais, géolocalisés
et autorisés.** Le lanceur API active désormais une veille publique conservatrice,
jamais un raccordement exhaustif `LIVE` ; les adaptateurs privés restent à obtenir. La réponse SECAA
vérifiée est périmée, ne couvre qu'un corridor et ne donne pas de coordonnées
d'incidents ; les actualités CETUD ne sont pas des états d'incidents actifs.
Une page HTML, une carte OpenStreetMap ou un lien documentaire ne valent pas
flux de perturbations. Les formats GTFS-RT bruts/protobuf et les API natives
propres aux fournisseurs doivent être convertis par un adaptateur autorisé au
contrat ci-dessous. La sonde d'accès reste un diagnostic séparé ; la nouvelle
veille ne publie que de courts extraits de bulletins explicites, datés et frais,
avec couverture partielle. Elle n'accorde aucun droit de redistribution ni accès
opérateur privé. Voir [ses critères et limites](veille-direct-rue-2026-10-11.md).

État de chaque source :

- `LIVE` : snapshot régional complet, vérifié depuis moins d'une heure ;
- `PARTIAL` : snapshot incomplet ou contenant une observation active non
  confirmée/périmée ; ses incidents individuellement confirmés restent utilisables ;
- `NOT_CONFIGURED` : aucun adaptateur renseigné ;
- `UNAVAILABLE` : erreur réseau, format invalide, secret manquant ;
- `STALE` : date de vérification périmée ou future.

Le statut **« Trafic fluide / Aucune perturbation en cours »** exige les cinq
sources `LIVE`, leurs dates et l'enveloppe encore valides, ainsi qu'aucun incident
actif pertinent et aucun témoignage communautaire pertinent. Une réponse vide 404/HTML, un téléchargement récent de données
anciennes ou une panne ne sont **jamais** une preuve de trafic fluide.
En vérification incomplète et sans incident/témoignage pertinent, le panneau existant
indique « Aucune perturbation récente signalée », avec réserve explicite sur la
couverture ; cela ne certifie pas un trafic fluide.

Les incidents routiers sont géofiltrés à **1,5 km** du GPS. Les perturbations
confirmées d'un réseau de Dakar restent pertinentes même hors du rayon ou sans
coordonnées. Sans GPS frais, les incidents de toute la région restent consultables,
mais aucune proximité n'est inventée. Les synthèses FR/WO résument le même
snapshot que le panneau : pas de retard, recommandation ou incident inventé par l'IA.

## 3. Configuration serveur

Configuration JSON exclusivement administrateur, hors Git : `data/traffic/feeds.json`.
Démarrage avec veille publique partielle et partage Direct rue (pas de données de démonstration) :

```sh
mkdir -p data/traffic
printf '{}\n' > data/traffic/feeds.json
chmod 600 data/traffic/feeds.json
npm run admin:api -- --traffic-feeds-file data/traffic/feeds.json
# Dans un autre terminal :
npm run dev
```

Pour désactiver veille/partage : appeler directement `scripts/serve_admin_api.py`
sans `--traffic-public-watch` et sans `--community-reports-root` ; sans adaptateurs,
les sources restent `NOT_CONFIGURED`. Ou passer le chemin via `DAKAR_TRAFFIC_FEEDS_FILE`. Configuration illustrative à
**remplacer par les véritables URL d'adaptateurs autorisés**, jamais par les sites
documentaires ni par ces domaines d'exemple :

```json
{
  "cetud": { "url": "https://adaptateur-autorise.example/cetud" },
  "ter": { "url": "https://adaptateur-autorise.example/ter", "tokenEnv": "TER_TRAFFIC_TOKEN" },
  "sunubrt": { "url": "https://adaptateur-autorise.example/sunubrt" },
  "ddd": { "url": "https://adaptateur-autorise.example/ddd" },
  "road": { "url": "https://adaptateur-autorise.example/road", "tokenEnv": "ROAD_TRAFFIC_TOKEN" }
}
```

Les secrets restent dans les variables d'environnement du serveur, pas dans le
JSON, le navigateur, Git ou les réponses publiques. Les URL sont HTTPS, ne portent
pas d'identifiants intégrés et ne suivent pas les redirections. La configuration
est une frontière de confiance : n'utiliser que des hôtes approuvés par
l'administrateur (ne jamais accepter une URL fournisseur provenant d'un voyageur).
Le transport demande du JSON, sans cache, avec délai réseau de 5 s et corps limité
à 1 Mio ; le navigateur annule sa requête entière au bout de 12 s.

**Déploiement :** GitHub Pages sert du statique et ne peut pas exécuter ce proxy
Python. Pour des alertes réelles, déployer l'API derrière un reverse proxy de
**même origine**, montant `/api/traffic/alerts`, et configurer les cinq accès.
Ne pas mettre un appel navigateur vers `localhost`, ni ouvrir la console de
gouvernance au public. Le proxy Vite existant est utilisé en développement ; la
politique CSP de production reste `connect-src 'self'`. Aucun déploiement ou accès
opérateur n'a été effectué par cette correction.

## 4. Contrat d'un adaptateur amont

Chaque source fournit un **snapshot complet de la région de Dakar**, pas un
historique incrémental. Exemple de structure (valeurs illustratives, pas un
incident réel ni un flux à publier) :

```json
{
  "region": "Dakar",
  "observedAt": "2026-10-11T12:00:00.000Z",
  "complete": true,
  "incidents": [
    {
      "id": "identifiant-canonique-partage",
      "status": "ACTIVE",
      "severity": "warning",
      "headlineFr": "Titre fourni par la source",
      "summaryFr": "Description fournie par la source",
      "updatedAt": "2026-10-11T11:58:00.000Z",
      "confirmedAt": "2026-10-11T11:58:00.000Z",
      "expiresAt": null,
      "lat": 14.7051,
      "lon": -17.4602,
      "affectedNetworks": ["ddd"],
      "affectedLines": ["10"],
      "affectedStopIds": [],
      "delayMinutes": null,
      "recommendationFr": null
    }
  ]
}
```

- `observedAt` est l'instant d'une **vérification effective** du snapshot par la
  source. `updatedAt` et `confirmedAt` décrivent une observation effective de
  l'incident actif, jamais la date de téléchargement/réémission d'un bulletin.
  Une ancienne perturbation encore active exige une nouvelle confirmation réelle.
- Dates ISO avec fuseau, pas futures ; preuves d'incident au plus à `observedAt`.
- `status` : `ACTIVE`, `RESOLVED` ou `UNCONFIRMED`. Une résolution minimale suffit :
  `{ "id": "…", "status": "RESOLVED", "updatedAt": "…Z" }`.
- `id` est canonique entre adaptateurs. Sans correspondance vérifiée, ne pas
  fusionner deux accidents uniquement parce qu'ils ont des titres/points proches.
- `road` exige un point GPS pour un incident actif. Un incident officiel sans
  coordonnées exige au moins un réseau identifié. Les réseaux sont `ter`, `brt`,
  `ddd`, `aftu`, `tata`, `other`. Les identifiants d'arrêts suivent le référentiel.
- `headlineWo`, `summaryWo`, `recommendationWo` sont facultatifs. Retards et
  recommandations absents restent absents ; aucune estimation automatique fictive.
- La source et les liens de provenance sont assignés par le registre serveur,
  jamais par du texte libre fourni dans un incident.
- Au plus 500 incidents par source et 500 incidents consolidés dans la réponse.
  Une réponse tronquée devient `PARTIAL`, jamais une preuve de trafic fluide.
- Consolidation : dernier état par identifiant, provenance croisée et union des
  lignes/réseaux déclarés. La date d'expiration retient la **plus courte validité
  des preuves contributives** ; aucun fait ancien ne survit grâce à une autre source.
- Le serveur garde seulement des marqueurs temporaires d'identifiant/date de
  résolution ou retrait, une heure au maximum, afin qu'une source retardataire
  ne ressuscite pas un état retiré. Aucun texte d'incident ni historique n'est conservé.
- Le GPS reçu par le proxy est facultatif et validé ; les coordonnées personnelles
  ne sont pas transmises aux fournisseurs. Le géofiltrage local peut ainsi suivre
  une nouvelle position même entre deux requêtes.

## 5. Vérifications

- Tests de domaine : preuve récente, heure exacte, veille, futur, dates invalides,
  états résolus/non confirmés, provenance, géofiltrage et statut fluide conditionnel.
- Tests du cycle : collecte horaire sans GPS, expiration avant la collecte suivante,
  veille/reconnexion, panne, réponse tardive, timeout, déplacement et démontage.
- Tests interface : panneaux/classes conservés, exemples absents, liste vérifiée,
  statut à jour ou incomplet, migration/purge physique du cache Direct rue.
- Tests Python : cinq sources concurrentes, dédoublonnage, résolution/retrait,
  sources figées/malformées, absence de repli périmé, secrets serveur, API `no-store`.
- `npm test`, `npm run test:data`, `npm run build` (TypeScript, Vite, smoke du bundle
  et exécution du bundle de production).

Les fournisseurs réels n'ont pas été interrogés : les tests injectent des doubles
et les essais HTTP portent sur le proxy local, sans simuler une connexion opérateur.
