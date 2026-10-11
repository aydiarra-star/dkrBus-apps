# Recherche d’accès réels aux flux de Dakar

**Vérification : 11 octobre 2026.** Résultat partiel, pas cinq flux raccordés.

**Évolution après cet audit :** une veille publique conservatrice et le partage
Direct rue sont maintenant disponibles dans le code/lanceur API. Cela n’a pas
obtenu les habilitations opérateurs ni cinq flux complets `LIVE`. Voir la
[veille, le partage et leurs limites](veille-direct-rue-2026-10-11.md).
Les preuves et limitations d’accès ci-dessous restent valables.

Deux points JSON publics ont été effectivement lus : **l’API routière de
l’Autoroute de l’Avenir / SECAA** et **l’API éditoriale du CETUD**. Le premier
est un vrai état de trafic autoroutier, le second un fil d’actualités. Ni la
réussite d’un téléchargement ni l’existence d’une application mobile ne
prouvent un flux complet, frais, géolocalisé et réutilisable pour DakarBus.

**L’objectif des cinq flux d’incidents actuels n’est pas atteint.** Aucune
clé opérateur, autorisation de réutilisation ou connexion en production n’a
été obtenue. L’absence d’API publique trouvée n’est pas une preuve qu’aucune
API privée existe. Aucun accès protégé n’a été contourné.

## 1. Accès routier public réellement trouvé

### Point d’accès

```text
GET https://www.autoroutedelavenir.sn/wp-json/trafic-avenir/v1/state
```

Découverte par le registre REST public, pas par supposition de l’URL :

1. `https://www.autoroutedelavenir.sn/wp-json/?_fields=namespaces`
   expose `trafic-avenir/v1`.
2. `https://www.autoroutedelavenir.sn/wp-json/trafic-avenir/v1`
   publie la route GET `/trafic-avenir/v1/state`.
3. Cette route renvoie effectivement un JSON contenant `success`, `state`,
   `updated_at`, `count`, `incidents`, `segments`, `gares`, `weather`, `axis`
   et `dir_labels`.
4. `https://www.autoroutedelavenir.sn/wp-json/?_fields=gmt_offset,timezone_string`
   renvoie `gmt_offset: 0`, `timezone_string: "Africa/Dakar"`.

La [page officielle SECAA](https://www.autoroutedelavenir.sn/) propose le
suivi du trafic et les applications Sunu Autoroute / Radio de l’Avenir.

### Preuve reçue et limitation de fraîcheur

Extrait factuel de la réponse lue, **à ne pas servir comme une alerte active** :

```json
{
  "success": true,
  "state": { "code": "ralenti", "label": "Trafic ralenti" },
  "updated_at": "2026-10-09 13:22:26",
  "count": 1
}
```

L’incident listé est un ralentissement après remorquage d’un poids lourd,
localisé par le texte « Sebi Ponty » et `PK 34.7 → 35.3`. Sa date `created_at`
est également le **9 octobre 2026 à 13:22:26**.

Au 11 octobre, ces dates sont périmées pour la règle d’une heure. **Ne jamais
remplacer `updated_at` par la date de téléchargement du 11 octobre.** Cette
réponse ne justifie ni l’affichage du ralentissement comme actuel, ni un état
« fluide » après retrait de l’ancien incident.

Une seconde lecture, avec la requête
`https://www.autoroutedelavenir.sn/wp-json/trafic-avenir/v1/state?_fields=success,updated_at,count,state,incidents&nocache=1`,
a renvoyé la même date du producteur. Le paramètre de requête ne constitue
pas, à lui seul, une garantie sur les caches amont.

Autres limites constatées dans cette réponse :

- couverture d’un **corridor autoroutier**, pas de toute la voirie de Dakar ;
- localisation par nom, sens et points kilométriques ; pas de latitude/longitude
  d’incident dans le schéma lu ;
- pas de droit de réutilisation API ni SLA documenté obtenu pendant cette recherche.

Pour une intégration GPS : obtenir une géoréférence vérifiée des PK/segments ou
une réponse opérateur en GeoJSON. Ne pas utiliser arbitrairement le centre
d’une ville ou une station TER comme emplacement d’accident.

**Point de contact public vérifié :**
[formulaire officiel SECAA](https://www.autoroutedelavenir.sn/contacts/),
standard **+221 33 859 10 61**, service client **+221 33 859 16 85**.
Demander l’équipe propriétaire du service trafic, le rythme de mise à jour,
les droits de réutilisation et la géoréférence des PK. Aucun formulaire
n’a été soumis.

## 2. CETUD : API publique réelle, mais éditoriale

```text
GET https://cetud.sn/wp-json/wp/v2/posts?per_page=3&_fields=id,date_gmt,modified_gmt,title,link
```

La réponse a fourni notamment l’article `16911`,
« JOJ Dakar 2026 : le dispositif opérationnel de circulation présenté »,
avec `date_gmt: 2026-10-08T15:33:43` et
`modified_gmt: 2026-10-08T15:33:44`.

C’est une API lisible sans authentification pour des **publications**, pas un
snapshot d’incidents actifs. Le registre WordPress accessible ne constitue
pas un contrat SAE / GTFS-RT. Une publication récente, sa modification, ou
un fil vide ne peuvent pas confirmer l’absence de perturbations.

Le CETUD décrit effectivement des données **SAE**, **CAPTRANS** et **GTFS**
dans son système de données. Il donne aussi le contact dédié de l’Observatoire.
Référence consultée : https://cetud.sn/observatoire/systeme-de-donnees/.

**Contact dédié vérifié :** `observatoire@cetud.sn`, **+221 33 859 47 20**.
Repli institutionnel : `cetud@cetud.sn`.

Demander l’accès développeur SAE/SAEIV ou GTFS-RT `ServiceAlerts`, les droits
pour les réseaux concernés, la portée de couverture, et le dictionnaire
identifiants lignes/arrêts. Un GTFS statique n’est pas un flux d’incidents.

## 3. TER / SENTER / SETER : canal voyageurs réel, API non obtenue

Canaux effectivement consultés :

- https://www.terdakar.sn/ : mention « Trafic normal sur le réseau », mais
  aucune date de confirmation exploitable dans le contenu lu ;
- https://www.terdakar.sn/toute-l-info-trafic/ : bulletin avec image et
  informations voyageurs, pas de liste d’incidents horodatés structurée ;
- [TER INFOS, fiche officielle](https://play.google.com/store/apps/details?id=sn.seter.terdakar&hl=fr) :
  annonce des informations trafic et notifications voyageurs.

La mention HTML « normal » n’est **pas** considérée comme une preuve actuelle
et n’est pas transformée en `LIVE`.

**Contact technique public vérifié dans la fiche de TER INFOS :**
`dsi.pi@seter.sn`.

Demander l’API d’information voyageurs utilisée par TER INFOS, ou une sortie
GTFS-RT/SIRI pour les alertes, avec authentification serveur autorisée et
horodatages de confirmation/résolution. Il ne faut pas confondre le TER
sénégalais avec l’API SNCF des TER français.

## 4. SunuBRT / Dakar Mobilité : site en maintenance, piste de plateforme

Les deux URL suivantes ont renvoyé la page « Notre site est actuellement en
maintenance », avec les contacts et réseaux sociaux officiels :

```text
https://www.sunubrt.sn/
https://www.sunubrt.sn/wp-json/
```

La [fiche officielle SunuBRT](https://play.google.com/store/apps/details?id=prod.maasify.dakar&hl=fr)
identifie l’application de Dakar Mobilité sous le package
`prod.maasify.dakar`. Elle fournit les prochains passages, la carte et les
services voyageurs annoncés ; cela ne donne pas les identifiants d’un accès
API pour une autre application.

La piste MaaSify/Monkey Factory annonce une offre API/SDK
[1](https://hellonemo.io/fonctionnalites/pour-les-collectivites-territoriales-et-les-exploitants/maasify-toute-la-technologie-mybus-en-marque-blanche/), mais
les vérifications n’ont pas donné un endpoint Dakar utilisable :

- `https://www.maasify.io/notre-offre-maas/donnees-ouverture-et-en-mode-api-maasify-on-demand/`
  renvoie `404 page not found` lors de la consultation ;
- `https://ondemand-maasify.alwaysdata.net/` renvoie `Account suspended`.

Ces pages indexées et offres commerciales ne sont **pas** présentées comme
un accès SunuBRT obtenu.

**Contact opérationnel vérifié :** `serviceclient@sunubrt.sn`,
**+221 818 55 55 55**. Contact développeur professionnel publié sur la fiche
SunuBRT : `p.balde@dakarmobilite.sn`.

Demander une habilitation partenaire pour les alertes/temps réel SunuBRT,
l’endpoint de production, son contrat et les droits d’export/réutilisation.

## 5. Dakar Dem Dikk : service voyageurs réel, API du site protégée

Le point d’entrée :

```text
GET https://demdikk.sn/wp-json/
```

a renvoyé ce refus explicite :

```json
{
  "code": "rest_login_required",
  "message": "REST API restricted to authenticated users.",
  "data": { "status": 401 }
}
```

Le code 401 ci-dessus est celui de la réponse JSON ; l’outil web n’expose pas
les en-têtes HTTP complets. Aucune tentative de contournement n’a été faite.

La [fiche officielle Dem Dikk](https://play.google.com/store/apps/details?id=sn.demdikk.reservation.ddd_reservation&hl=fr)
annonce un fil d’information et des notifications de perturbations. Le site
`https://booking.demdikk.sn/` fournit une réservation de navettes, pas un
flux public d’incidents urbains. Débloquer WordPress ne prouverait pas, à lui
seul, l’accès à l’API voyageurs de l’application.

**Contact technique public vérifié :** `dsicloud@demdikk.sn`.
Service client : `contact@demdikk.sn`, **+221 33 824 10 10**.

Demander un accès en lecture à l’API des informations voyageurs/perturbations,
pas un compte client de réservation ni un compte administrateur WordPress.

## 6. Fournisseurs routiers supplémentaires : vérifier la couverture

- **Google Maps** : la table officielle indique la **Traffic Layer disponible
  au Sénégal** (ligne `SN`, page mise à jour le 8 octobre 2026).
  https://developers.google.com/maps/coverage.
  Le service Routes documente l’appel
  `POST https://routes.googleapis.com/directions/v2:computeRoutes` et les
  polylignes avec trafic :
  https://developers.google.com/maps/documentation/routes/traffic_on_polylines.
  C’est une piste réelle pour les conditions de circulation sur un itinéraire,
  **pas une API générale d’accidents ni une API opérateur CETUD/TER/BRT/DDD**.
  Accès serveur, clé/compte fournisseur, activation, facturation et conditions
  de réutilisation restent à établir ; aucun appel authentifié n’a été exécuté.
  La compatibilité avec la carte Leaflet existante doit aussi être vérifiée
  contractuellement, sans changer l’interface validée.
- **TomTom Traffic v4/v5** : la table de couverture consultée, éditée le
  15 septembre 2026, ne liste **pas le Sénégal**. Ne pas configurer TomTom
  pour Dakar sur la seule base de son API mondiale ou d’une couverture de
  cartographie/routage.
  https://docs.tomtom.com/traffic-api/documentation/tomtom-maps/v1/product-information/market-coverage.
- **HERE Traffic v7** : le Sénégal n’apparaît pas dans la table Flow/Incidents
  consultée. Couverture Dakar non vérifiée, donc fournisseur non retenu.
  https://docs.here.com/traffic-api/docs/traffic-here-traffic-api-v7-coverage-information.md.
- **Waze** : les spécifications publiques de « partner data feed » décrivent
  notamment l’envoi de données **vers Waze**. Elles ne donnent pas un flux
  de lecture public pour réutiliser les signalements de Waze dans DakarBus.
  [1](https://developers.google.com/waze/data-feed/overview).
  Ne pas réutiliser un endpoint interne ou des jetons d’une autre application.

Le catalogue public `MobilityData/mobility-database-catalogs` a aussi été
inspecté via GitHub : 1 037 chemins GTFS-RT, aucun chemin Sénégal/Dakar trouvé
à cette consultation. Cela n’est **ni une recherche exhaustive ni une preuve
d’inexistence d’un flux privé**. Les projets universitaires/demo trouvés ne
sont pas des preuves de flux officiels actifs.

## 7. Refaire les vérifications sans rien publier

Un outil en lecture seule est fourni :

```sh
python3 scripts/probe_traffic_access.py
python3 scripts/probe_traffic_access.py --source road --source cetud
python3 -m unittest tests.test_probe_traffic_access -v
```

Il interroge seulement les URL publiques vérifiées du registre, en parallèle,
avec délai de 5 secondes, taille limitée à 1 Mio, `no-store`, sans cookies,
sans authentification ni suivi de redirections. Pour SECAA, il relit aussi
le fuseau du CMS ; il garde la date du producteur, vérifie la limite exacte
60 minutes, et distingue récence, couverture et existence de coordonnées.

Sa sortie est **un audit d’accès**, pas le contrat `/api/traffic/alerts`.
Elle ne contient aucune liste d’alertes à publier ni statut `LIVE`.
Le code de sortie **1** signale que l’objectif des cinq flux temps réel
vérifiés n’est pas atteint, même si une API publique répond correctement.
Il ne remplace pas une confirmation réelle par `auditedAt`.
Les URL de ce registre de recherche sont volontairement marquées
`eligibleForLiveTraffic: false` : cette sonde ne peut pas certifier à elle
seule une future habilitation ou un flux de production.

**Limite d’environnement :** les points publics ci-dessus ont été lus par
les outils de consultation web. La sonde a ensuite été exécutée depuis cet
atelier : les cinq sources ont renvoyé `NETWORK_OR_RESPONSE_ERROR` et son
code de sortie est 1. L’atelier n’autorise pas la sortie réseau directe vers
les domaines des opérateurs. Il faut exécuter la sonde
et l’API sur un serveur autorisé à les joindre. Les résultats de cette sonde
dans l’atelier ne doivent pas être utilisés pour affirmer que les API distantes
sont hors service.

## 8. Demande d’accès prête à envoyer aux propriétaires

**Aucune demande n’a été envoyée en votre nom.** Les habilitations privées
et droits de redistribution ne peuvent pas être accordés par une recherche web.
Les secrets éventuels doivent être provisionnés dans l’environnement serveur,
jamais envoyés dans le chat, le navigateur ou Git.

> Objet : Accès développeur aux alertes voyageurs et trafic — DakarBus
>
> Bonjour,
>
> Nous souhaitons intégrer à DakarBus des informations d’incidents actifs
> concernant votre réseau, sans réutiliser d’informations périmées. Pourriez-vous
> orienter cette demande vers l’équipe information voyageurs/DSI/Observatoire ?
>
> Nous recherchons un accès en lecture à vos ServiceAlerts GTFS-RT, messages
> SIRI ou API voyageurs, avec état actif/résolu, date de confirmation effective,
> portée de couverture, identifiants lignes/arrêts et localisation lorsque disponible.
> Pour le routier, nous avons besoin de coordonnées ou de la géoréférence des PK.
>
> Merci de préciser les modalités d’authentification serveur, quotas, fréquence
> de publication, licence de réutilisation, attribution et procédure d’habilitation.
> Une interrogation horaire et une expiration stricte à une heure sont prévues ;
> nous adaptons la fréquence aux contraintes de votre service.
>
> Nous ne sollicitons pas de données personnelles voyageurs ou conducteurs,
> ni d’accès administrateur aux plateformes.
>
> Cordialement.

## 9. Vérifications du dépôt

- **508 tests frontend réussis** dans 41 fichiers.
- 10 tests de la sonde (réponses simulées, pas des connexions opérateur),
  inclus dans la suite Python complète : **163 tests réussis**.
- **Build TypeScript/Vite et deux tests smoke du bundle réussis**.
- L’exécution réseau de la sonde est un diagnostic séparé des tests et ne
  certifie aucune connexion de production.
- Aucun changement visuel, aucun compte créé, aucune clé obtenue et aucun
  déploiement effectué pour cette recherche.
