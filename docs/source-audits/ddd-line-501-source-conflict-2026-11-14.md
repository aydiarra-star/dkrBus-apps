# Audit des sources DDD — ligne 501 — 2026-11-14

## Périmètre

Audit documentaire de la ligne 501 à partir des deux pages officielles Dakar Dem Dikk et des métadonnées du service ArcGIS DDD consultées le 14 novembre 2026. Aucun changement de donnée applicative.

## Constat des sources officielles

### Page « Info voyageurs »

La page officielle présente :

- **LIGNE 501 : GARE DE DAKAR ↔ PALAIS 2**

Cette page ne publie pas de liste d'arrêts détaillée ni de séquence indépendante par direction pour la ligne 501.

Source : https://demdikk.sn/info-voyageurs/

### Page « Réseau urbain Dakar »

La page officielle présente un intitulé différent :

- **LIGNE 501 : PALAIS 2 ↔ LECLERCL** (orthographe « LECLERCL » telle que publiée)
- Séquence affichée : Terminus Palais 2 → Avenue Nelson Mandela → Avenue Léopold Sédar Senghor → Place de l’Indépendance → Esso Port Embarcadère → Terminus Leclerc.

La page contient donc une séquence de six libellés dans le sens présenté, mais ne publie pas de séquence de retour distincte.

Source : https://demdikk.sn/reseau-urbain-dakar/

## Contrôle des métadonnées ArcGIS DDD

Le service public « Dem_dikk_mise_a_jour » expose deux couches distinctes :

- `Arrets_Ligne_Dakar_Dem_Dikk` (couche 0), géométrie ponctuelle, avec les champs `Nom_Arret`, `Nom_Ligne` et `Id`.
- `Itinéraire_lignes_Dakar_Dem_Dikk` (couche 1), géométrie linéaire, avec plusieurs champs de texte d'itinéraire.
- L'extraction complète des deux couches confirme une date de dernière modification des données au **24 septembre 2024** pour chacune.

Sources :
- Service : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer
- Couche arrêts : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0
- Couche itinéraires : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/1

Ces métadonnées confirment l'existence de couches d'arrêts et d'itinéraires, mais ne prouvent pas à elles seules que leurs enregistrements décrivent la ligne 501 actuelle, ses deux directions, ou la divergence Gare de Dakar / Leclerc. Les deux couches datent de septembre 2024 et ne constituent pas une preuve de l'exploitation actuelle en 2026.

### Source de presse historique — connexion TER / DDD (21 février 2022)

Un article de Directactu, attribué au journal *Le Soleil*, rapporte qu'en février 2022 des voyageurs sortant de la gare TER de Dakar recherchent le bus de la ligne 501 « qui quitte la gare de Dakar pour le Camp Leclerc ». Un agent indique un stationnement devant Dakarnave ; l'article rapporte aussi le témoignage d'un voyageur évoquant la prolongation du trajet jusqu'à Leclerc.

Source : https://directactu.net/2022/02/21/connexion-ter-dakar-dem-dikk-aibd-le-transport-multimodal-prend-forme-a-dakar/

Cette source de presse renforce l'existence historique d'une liaison 501 entre la gare de Dakar et le secteur/terminus Leclerc en 2022. Elle ne publie toutefois ni liste complète d'arrêts, ni parcours directionnel vérifiable, ni preuve que le service de 2022 est identique à la configuration affichée sur les pages DDD en 2026. Elle ne permet pas de conclure que « Gare de Dakar », « Camp Leclerc » et « Terminus Leclerc » sont des libellés strictement interchangeables.

## Analyse et décision

Les deux pages officielles ne concordent pas sur le terminus associé à la ligne 501 :

- « Gare de Dakar » sur Info voyageurs ;
- « Palais 2 » et « Leclerc » sur la page Réseau urbain.

Les pages officielles actuelles ne publient pas une séquence unique cohérente. La source de presse de 2022 confirme un lien historique Gare de Dakar–Camp Leclerc pour la ligne 501, mais ne permet pas d'identifier avec certitude le terminus actuel ni de reconstruire un retour indépendant. Les deux services ArcGIS examinés ne contiennent aucun enregistrement 501.

**Décision :** conserver l'écart documentaire ouvert. Ne pas fusionner les terminus, ne pas renommer « LECLERCL » silencieusement, ne pas créer de retour par inversion automatique et ne pas modifier la séquence de production sur la seule base de cet audit.

## Garde-fous

- Documentation uniquement : aucun arrêt de production ajouté, supprimé ou renommé.
- Aucun horaire ou fréquence ajouté.
- Aucun tracé ou retour déduit.
- Aucune modification TER/BRT.
- Aucune écriture Supabase.
- Aucun déploiement.

## Suite de vérification

Contrôle ciblé effectué : extraction des deux couches complètes, filtre normalisé sur `Nom_Ligne` pour 501 et capture séparée des libellés contenant 501. Résultat : aucune entité correspondante. Conserver la recherche d'autres services ArcGIS comme piste distincte.

## Vérification du catalogue ArcGIS interurbain

Le catalogue du service public `Ligne_inter_urbain` expose des couches dédiées pour les lignes 1, 4, 6, 7, 8, 9, 10, 13, 18, 20, 23 et 121. Il ne présente pas de couche dédiée à la ligne 501 dans cet inventaire.

Source : https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Ligne_inter_urbain/FeatureServer/layers

Cette absence de couche dédiée dans ce service ne prouve pas l'absence de données 501 dans d'autres services ArcGIS. Le service générique `Dem_dikk_mise_a_jour` a été interrogé séparément dans ses deux couches : les résultats ciblés sont consignés ci-dessous.

## Résultat de l'audit ArcGIS — extraction ciblée du 14 novembre 2026

Le workflow en lecture seule a récupéré l'intégralité du service `Dem_dikk_mise_a_jour` puis appliqué un filtre normalisé sur le champ `Nom_Ligne`, avec une seconde recherche plus large des libellés contenant le numéro 501.

| Contrôle | Résultat |
|---|---:|
| Entités de la couche arrêts | 777 |
| Entités avec géométrie d'arrêt | 775 |
| Entités avec nom d'arrêt | 750 |
| Entités avec code de ligne | 775 |
| Entités de la couche itinéraires | 25 |
| Entités avec géométrie de tracé | 24 |
| Arrêts codés exactement 501 | **0** |
| Candidats arrêts dont le libellé contient 501 | **0** |
| Tracés codés exactement 501 | **0** |
| Candidats tracés dont le libellé contient 501 | **0** |

La liste des codes `Nom_Ligne` observés dans les 777 enregistrements d'arrêts comprend notamment 1, 2, 4 à 13, 16A/16B, 18, 23, 121, 217, 218, 227, 228 et 232 ; aucun code 501 n'apparaît. La couche des tracés ne présente pas non plus de code 501. Les deux couches indiquent la date de dernière modification des données du **24 septembre 2024**.

Le catalogue distinct `Ligne_inter_urbain` expose des couches dédiées aux lignes 1, 4, 6, 7, 8, 9, 10, 13, 18, 20, 23 et 121, mais aucune couche dédiée 501.

**Interprétation limitée :** les deux services ArcGIS DDD examinés ne fournissent pas de preuve géographique exploitable pour la ligne 501. Cela ne démontre pas que la ligne n'existe pas et ne permet pas de choisir entre « Gare de Dakar » et « Leclerc ». Il faut rechercher d'autres services/couches ou une confirmation opérationnelle DDD. Aucun ordre de passage, retour ou équivalence de terminus n'est déduit.

Artefact de l'extraction ciblée : workflow GitHub Actions `43604447054`, artefact `ddd-updated-service-and-sequence-audit` (cinq fichiers, conservation 14 jours).

La vérification ArcGIS ne lève donc pas la contradiction des terminus. Elle établit que les deux services cartographiques recensés dans cet audit ne contiennent pas d'entité 501 identifiée.


## Recoupement complémentaire CETUD et guide DDD — 14 novembre 2026

### Plan officiel des lignes DDD publié par le CETUD

La page CETUD consacrée à DDD comporte un lien « Télécharger les lignes et horaires ». Le lien a été ouvert : il mène à une image JPEG intitulée `plan-lignes-ddd.jpeg`, publiée sous `/wp-content/uploads/2024/11/`.

Ce document est un **plan cartographique du réseau**, pas un fichier d'horaires ni un jeu de données d'arrêts ordonnés. Il permet de visualiser des corridors et des numéros de lignes, mais ne fournit pas de séquence directionnelle exploitable pour la ligne 501. Il ne résout donc pas la divergence Gare de Dakar / Palais 2 / Leclerc.

Sources :
- Page CETUD DDD : https://cetud.sn/reseaux-de-transport/ddd/
- Fichier lié « Je télécharge » : https://cetud.sn/wp-content/uploads/2024/11/plan-lignes-ddd.jpeg

### Guide DDD hébergé sur le site officiel — septembre 2026

La page DDD « Guide complet des services Dakar Dem Dikk » indique que le réseau urbain comprend des navettes connectées aux gares TER, dont les lignes spéciales 501 et 502. Elle recommande l'application Dem Dikk pour les trajets, correspondances et estimations en temps réel.

Cette mention confirme le contexte de service spécial/connexion TER pour la ligne 501, mais le guide consulté ne donne ni liste d'arrêts 501, ni terminus détaillés, ni horaire propre à cette ligne, ni deux séquences indépendantes. Elle ne permet pas de trancher entre les deux intitulés officiels actuels.

Source : https://demdikk.sn/chatbot-2303/ (guide annoncé comme document de référence, septembre 2026).

### Conclusion après recoupement

Le nouveau plan CETUD est cartographique et daté de 2024 ; le guide DDD de septembre 2026 confirme l'existence de navettes spéciales 501/502 liées aux gares TER sans en détailler le parcours. Ces éléments renforcent le contexte de la ligne mais ne lèvent pas le conflit sur ses terminus ni l'absence de retour indépendant.

**Décision inchangée :** conserver le statut `CONFLICTING_SOURCES`. Ne pas injecter le parcours de six repères du PR #74 dans le catalogue passager et ne pas fabriquer de retour. Une confirmation opérationnelle DDD reste nécessaire.


## Piste de vérification par l'application officielle DDD — 14 novembre 2026

La page officielle DDD annonce une nouvelle version de l'application mobile disponible depuis le 3 septembre 2025. DDD y décrit notamment une carte interactive des lignes et arrêts du réseau urbain, la géolocalisation des arrêts proches et des informations voyageurs en temps réel.

Sources :
- Page officielle DDD sur la nouvelle version : https://demdikk.sn/v2appmobile/
- Page officielle de téléchargement : https://booking.demdikk.sn/
- Fiche Google Play officielle « Dem Dikk » : https://play.google.com/store/apps/details?id=sn.demdikk.reservation.ddd_reservation

La fiche Google Play décrit également la recherche d'itinéraires et l'information voyageurs en temps réel ; elle indique une mise à jour au 27 septembre 2025. La page DDD fournit un lien App Store et un lien Google Play.

**Limite de la vérification web :** les pages publiques consultées décrivent les fonctions de l'application, mais n'exposent pas les résultats de recherche d'itinéraire ni la fiche détaillée de la ligne 501. Aucune séquence d'arrêts, aucun terminus supplémentaire et aucun horaire 501 ne peuvent donc être extraits de ces pages seules.

**Prochaine vérification opérationnelle :** consulter dans l'application officielle, si elle est accessible, les trajets et arrêts proposés pour la ligne 501 dans les deux sens, puis conserver les captures/résultats datés comme éléments de preuve. Comparer précisément les libellés Gare de Dakar, Palais 2, Esso Port Embarcadère et Leclerc sans les fusionner par hypothèse. Si l'application ne fournit pas de réponse exploitable, demander une confirmation écrite au service client DDD (serviceclient@demdikk.sn ; +221 33 824 10 10), sans présumer de la réponse.

Cette piste ne modifie pas la décision de l'audit : le conflit de sources reste ouvert et aucune donnée de production n'est validée par cette seule documentation applicative.


## Recoupement avec le guide officiel de mobilité JOJ Dakar 2026 — 14 novembre 2026

Le guide officiel de mobilité JOJ Dakar 2026, publié par les autorités de mobilité et le CETUD, présente des listes de lignes DDD par site de compétition. Il identifie explicitement les pôles et les lignes recommandées pour les déplacements liés aux sites des Jeux. Dans ces tableaux, les lignes 501/502 ne figurent pas parmi les lignes DDD listées pour ces sites ; le guide cite notamment les lignes urbaines 1, 4, 6, 7, 8, 9, 10, 11, 13, 18, 20, 23, 121 et 233 selon les sites.

Source : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf

**Limite de portée :** ce guide est un document de mobilité événementielle, organisé par sites JOJ et trajets conseillés pour les déplacements liés aux sites, pendant la période du 31 octobre au 13 novembre 2026. Ses listes ne constituent pas un inventaire exhaustif de tout le réseau DDD. L'absence de 501 dans ces tableaux ne prouve donc ni la suppression de la ligne ni l'inexactitude de la page « Info voyageurs ». Elle ne permet pas davantage de trancher son terminus ou son retour.

**Conséquence pour l'audit :** conserver cette source comme contexte institutionnel daté, sans l'utiliser pour modifier le statut CONFLICTING_SOURCES ni pour ajouter/supprimer des arrêts.


## Séquences 501 fournies par l'utilisateur — 14 novembre 2026

L'utilisateur a fourni une capture de la fiche DDD et la transcription du sens retour. Ces éléments documentent deux séquences distinctes de neuf arrêts chacune. **Toutes les heures affichées dans la capture et la transcription sont exclues** : elles ne sont ni reprises ni utilisées pour valider des horaires.

### Sens aller — Port De Dakar → Terminus Palais 2

1. Port De Dakar
2. Cercle Mess Des Officiers Colonel Emmanuel Gomis Ou Embarcadère (Port Môle 08)
3. Poste Ponty
4. Devant Strass Avenue Ponpidou
5. Devant Cité Peytavin
6. Asecna
7. Prés Du Bureau Regional Pam
8. Prés De L'Hôpital Le Dantec
9. Terminus Palais 2

### Sens retour — Terminus Palais 2 → Port de Dakar

1. Terminus Palais 2
2. Hopital Le Dantec
3. Face Bureau Regional Pam
4. En Face De La Direction Générale Du Budget
5. Avenue Ponpidou En Face Alimentation Catim
6. Cbao Ponty
7. Place De L'Indépendance Prés De La Cbao
8. Royal Air Maroc Place De L'Indépendance
9. Port De Dakar

Les noms, l'orthographe et l'ordre sont conservés tels que fournis. Les deux directions restent séparées ; aucune direction n'est fabriquée par inversion. Les variantes de libellés entre directions ne sont pas fusionnées.

## Vérification CETUD du statut des séquences — 14 novembre 2026

La page officielle « Système de données » du CETUD indique que l'organisme a créé des fichiers GTFS pour numériser le réseau de transport collectif de Dakar. Le CETUD précise que ces fichiers peuvent contenir les horaires, arrêts, itinéraires, trajets, tarifs et services.

Source : https://cetud.sn/observatoire/systeme-de-donnees/

La page publique consultée décrit l'existence et le contenu général des fichiers GTFS, mais ne donne pas de lien de téléchargement direct vers le jeu de données lui-même ni d'extrait consultable permettant d'isoler la ligne 501. La page CETUD consacrée à DDD propose par ailleurs un téléchargement des lignes et horaires, mais le lien examiné précédemment aboutit à un plan cartographique JPEG de 2024, et non à une liste d'arrêts ordonnés par direction.

Source : https://cetud.sn/reseaux-de-transport/ddd/

### Conclusion de validation

- **Séquences observées :** 9 arrêts aller et 9 arrêts retour, conservés exactement selon les éléments transmis par l'utilisateur.
- **Horaires :** exclus, conformément à la consigne de l'utilisateur.
- **Validation indépendante CETUD :** non acquise à ce stade. Le CETUD confirme publiquement l'existence de données GTFS contenant des arrêts et itinéraires, mais le fichier exploitable et son contenu pour la ligne 501 n'ont pas été récupérés/inspectés dans cet audit.
- **Décision :** ne pas qualifier les deux séquences de « validées par le CETUD » tant que le GTFS ou une autre source CETUD directement vérifiable ne confirme pas les 9 arrêts et leur ordre dans chacun des deux sens. Ne pas les injecter comme données officiellement validées dans le catalogue de production sur la seule base de la capture.

Aucune modification de donnée applicative, aucun horaire/fréquence ajouté, aucune modification TER/BRT, aucune écriture Supabase et aucun déploiement.
