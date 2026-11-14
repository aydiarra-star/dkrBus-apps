# Audit OSM actualisé — relations DDD, AFTU et BRT dans Dakar

Date de l'extraction : 14 novembre 2026, 05:17 UTC  
Workflow OSM : [43560694378](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/43560694378) — succès  
Artefact : `dakar-osm-route-candidates` et `dakar-osm-directional-pairs`  
Source : OpenStreetMap contributors via Overpass, licence ODbL  
Périmètre : boîte géographique métropolitaine de Dakar définie par le workflow.

## Résumé de l'extraction

- 6 610 éléments OSM récupérés.
- 25 relations candidates de lignes dans Dakar.
- 23 candidates classées dans le périmètre Dakar par l'analyseur.
- 18 relations possèdent des membres d'arrêts ordonnés ; 522 membres ordonnés.
- 7 relations n'ont pas de membres d'arrêts/quais ordonnés.
- 5 paires directionnelles candidates : DDD 4, DDD 7, DDD 9, DDD 10 et BRT B1.
- 4 paires ont des terminus inversés ; la paire DDD 7 est reliée par un route_master commun.
- 50 candidats de rapprochement stop/platform sont relevés entre les deux directions.
- 13 relations restent non appariées ; 1 relation présente une référence de ligne contradictoire.

## 1. DDD — revue actualisée des paires

| Ligne | Relations OSM | Membres ordonnés A/B | Noms distincts communs | Jaccard | État |
|---|---|---:|---:|---:|---|
| 4 | 6990830 / 7203970 | 34 / 32 | 2 | 0,154 | terminus inversés, recouvrement faible |
| 9 | 6996431 / 7487218 | 32 / 29 | 6 | 0,500 | meilleur recouvrement de noms, sans ID commun |
| 10 | 6990845 / 7488283 | 30 / 25 | 1 | 0,167 | terminus inversés, conflit Palais à maintenir |
| 7 | 6990669 / 7500475 | 31 / 34 | 6 | 0,353 | route_master 7500597 commun, terminus non strictement inversés |

Les quatre paires DDD restent candidates. Les séquences et identifiants de membres sont conservés indépendamment. Le rapprochement de noms est un indicateur d'examen, pas une preuve d'identité physique ni de validation opérateur.

### Cas ligne 7

Le route_master OSM 7500597, nommé « Ligne 7 » et référencé « L 7 », contient les relations 6990669 et 7500475. C'est une preuve structurelle de leur appartenance au même ensemble OSM. Toutefois, les champs de terminus ne sont pas exactement inversés : la relation 6990669 annonce « Terminus Palais » → « Terminus Ouakam », tandis que 7500475 annonce « Terminus Ouakam » → « Terminus Palais 1 ». La relation 6990669 commence aussi par « Gare Palais 2 ». Le route_master commun renforce le lien, mais ne résout pas le conflit Palais / Palais 1 / Palais 2.

### Conflit de référence sur une autre relation

La relation 7499433 possède `ref=6`, mais son nom commence par « 7 Palais 1 → Parcelles-Assainies ». Elle ne contient qu'un membre d'arrêt/quai ordonné. L'analyseur la conserve comme relation non appariée avec conflit de métadonnées. Elle ne doit pas être utilisée pour créer un retour de la ligne 7 ou de la ligne 6.

### Lignes 1, 23 et 121

La relation 6951328 reste un seul sens cartographié pour la ligne 1. Les deux relations 7108131 et 7495279 de la ligne 23 demeurent à traiter avec prudence : 7108131 porte la référence multiple `L23;L5`, tandis que 7495279 porte `L 23`. Le route_master 7499003 est nommé Ligne 23, mais inclut une relation avec rôle de terminus « TERMINUS GUEDIAWAYE 1 / PALAIS 1 » ; cela n'autorise pas à réattribuer automatiquement la relation mixte à la seule ligne 23. Les relations 121 restent fragmentaires ou à terminus divergents.

## 2. AFTU — relation 40

La seule relation OSM de cette extraction explicitement étiquetée AFTU est la relation 3982642 :
- `ref=40`, `operator=Aftu`, `network=Tata` ;
- 35 tronçons de voirie ordonnés (dont 4 membres marqués « Forward ») ;
- aucun membre d'arrêt ou de quai ordonné.

Cette relation peut servir de candidat de géométrie routière, pas de séquence d'arrêts. Les lignes AFTU 42 à 45 et 84 à 89/91 ne sont pas confirmées par cette extraction OSM. Leur absence dans cette boîte et cette requête ne prouve pas leur inexistence ; les corridors officiels AFTU restent la source documentaire.

## 3. BRT B1 — diagnostic séparé et protégé

Les relations 19961937 et 19961993 portent toutes deux `ref=B1` et `network=SunuBRT`, avec les terminus Préfecture de Guédiawaye ↔ Petersen en sens opposés. Chacune contient 25 membres `stop` et 25 membres `platform` (50 membres bruts). Les noms normalisés des membres s'alignent exactement en ordre inverse (50/50) et 24 noms distincts sont communs.

Il s'agit d'un signal communautaire de cohérence directionnelle, pas d'une nouvelle source d'horaires. **Ce diagnostic ne modifie ni ne remplace les 23 stations, les fréquences, les horaires ou les affichages BRT déjà vérifiés par l'utilisateur.** Les deux relations OSM sont conservées hors du catalogue passager.

## 4. AFTU — contrôle des pages officielles exécuté sur le même HEAD

Workflow : [43560694408](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/43560694408) — succès.  
L'artefact confirme 65 pages officielles récupérées avec texte d'itinéraire (63 liées depuis l'index et 2 pages supplémentaires déjà identifiées, lignes 27 et 36). Sept tentatives complémentaires (84, 85, 86, 87, 88, 89 et 91) restent en erreur HTTP 404. Les sept lignes demeurent listées sur l'index officiel avec leurs corridors, mais sans fiche détaillée accessible par les URL testées. Aucun arrêt intermédiaire, retour ou horaire n'est inventé.

## Méthode et garde-fous

Les rôles et l'ordre des membres OSM sont conservés tels quels. Les noms vides ne sont pas complétés. Les membres `stop` et `platform` ne sont pas fusionnés. Les relations partagées par un route_master, les références multiples et les conflits de noms restent visibles.

OSM est une source cartographique contributive : il ne prouve pas à lui seul le service actuel, les arrêts exploités, la direction commerciale, les horaires ou les fréquences. Aucune relation n'est fusionnée ou réattribuée. Aucun retour n'est créé par inversion. Aucun GTFS n'est requis. Aucune écriture Supabase, aucun déploiement et aucune modification du catalogue passager. TER/BRT restent intacts.
