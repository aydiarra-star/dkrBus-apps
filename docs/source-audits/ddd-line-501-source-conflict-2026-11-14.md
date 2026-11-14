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
