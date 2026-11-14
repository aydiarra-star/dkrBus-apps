# DDD ligne 121 — revue des relations OSM et de la couverture aller/retour

Date : 13 novembre 2026.

## Référence officielle

La page officielle DDD publie la ligne 121 sous l'intitulé « SCAT URBAM LECLERC » et dans l'ordre suivant (25 arrêts) : Terminus Scat Urban, Mairie Grand Yoff, Pentola, Les deux voies de Sipres, Camp penal, Les deux voies de Liberté 6, Rond point JVC, Boulangerie Zone, Collège Sacré Cœur, Scor liberté, Sicap rue 10, Lycée Blaise Diagne, Place ONU, Canal 4, HLM Fass, Travaux communaux, Rue 22 prolongée, RTS, Allées Papa Guèye Fall, Petersen, Avenue Faidherbe, Place de l’indépendance, Albert Sarraut, BCEAO, Terminus Leclerc.

Source : https://demdikk.sn/reseau-urbain-dakar/

## Relation OSM 6990794 — HLM Grand Yoff vers Leclerc

- 27 membres d'arrêt ordonnés ; 48 membres de voie.
- 24/27 points d'arrêt à 25 m ou moins de la couche ArcGIS DDD ; 24/27 à 50 m ou moins ; 26/27 à 100 m ou moins.
- Sept membres portent un nom ; une seule concordance normalisée stricte avec la séquence officielle est retrouvée dans le même ordre : « Place de l’Indépendance » (membre OSM 27 → arrêt officiel 22).
- Les membres 12 et 13 portent les noms « Arret 2 voies sacré coeur » et « Arret Sacre coeur - BEM », qui peuvent aider à rechercher les arrêts officiels « Collège Sacré Cœur » et « Scor liberté », mais les libellés ne sont pas identiques et ne sont pas validés.
- Les membres 17 et 18 sont nommés « DDD 121 » et « 121 » ; ce sont des libellés génériques, pas des noms d'arrêt.
- Le début OSM annonce « Terminus Hlm Grand Yoff », alors que la page officielle commence par « Terminus Scat Urban ». Le terminus ne doit pas être assimilé sans preuve supplémentaire.

**Décision :** relation candidate géographiquement cohérente avec une partie du corridor, mais correspondance d'ordre et d'identité insuffisante pour importer les 27 arrêts comme séquence officielle.

## Relation OSM 6999013 — Leclerc vers HLM Grand Medine

- Sept membres d'arrêt ordonnés ; 18 membres de voie.
- 2/7 points à 25 m ou moins de la couche ArcGIS ; 4/7 à 50 m ou moins ; 5/7 à 100 m ou moins.
- Un seul membre est nommé : « Hôtel de ville de Dakar » ; aucune concordance stricte ordonnée n'est retrouvée dans la liste officielle.
- Le terminus annoncé est « HLM Grand Medine », alors que le terminus officiel est « Terminus Scat Urban ».

**Décision :** ne pas considérer cette relation comme le retour officiel de la ligne 121. Son terminus diffère de la fiche DDD et sa géométrie présente des écarts.

## Relation OSM 2792903 — fragment non directionnel

- Trois membres d'arrêt, tous sans nom ; quatre membres de voie.
- Les trois références de nœuds sont également présentes dans la relation 6990794 (nœuds 4323838509, 4323838518 et 4323838530), dans un ordre différent.
- Elle ne fournit donc pas une troisième direction indépendante ni une séquence complète.

**Décision :** conserver comme fragment/recouvrement technique et ne pas la compter comme sens supplémentaire.

## Conclusion et action suivante

La ligne 121 dispose d'une séquence officielle unique de 25 arrêts. Les relations OSM montrent des candidats de corridor, mais elles ne démontrent pas encore deux directions complètes correspondant aux terminus officiels. Ne pas fabriquer le retour en inversant la relation 6990794 et ne pas substituer « HLM Grand Medine » à « Scat Urban ».

Priorités :
1. rechercher une source DDD complémentaire pour les terminus et l'ordre des deux directions ;
2. rapprocher les noms OSM génériques des arrêts officiels uniquement avec une preuve de localisation et d'identité ;
3. conserver distinctement les relations 6990794, 6999013 et 2792903 dans l'audit ;
4. laisser la fréquence non renseignée tant qu'une source officielle ne la confirme pas.

Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT et aucune fusion de PR.


## Contrôle complémentaire sur la polyligne ArcGIS de la ligne 121

La nouvelle extraction ArcGIS comprend une polyligne continue de la ligne 121. La projection des membres OSM sur cette géométrie précise le niveau de corroboration directionnelle :

| Relation | Sens OSM | Arrêts géolocalisés | Médiane | Maximum | À ≤25 m | Corrélation ordre / chaînage |
|---|---|---:|---:|---:|---:|---:|
| 6990794 | HLM Grand Yoff → Leclerc | 27 | 5,4 m | 8,9 m | 27/27 | +0,9889 |
| 6999013 | Leclerc → HLM Grand Medine | 7 | 4,6 m | 70,3 m | 6/7 | -0,9814 |
| 2792903 | Fragment sans terminus | 3 | 5,4 m | 6,8 m | 3/3 | -0,9945 |

La relation 6990794 suit très proprement une partie du tracé dans le sens croissant. La relation 6999013 suit le tracé dans le sens opposé, mais ne couvre qu'un segment partiel et annonce HLM Grand Medine plutôt que le terminus officiel Scat Urban. Un point de cette relation est à 70,3 m de la polyligne ; les six autres sont à 25 m ou moins.

Le fragment 2792903 est bien proche de la géométrie, mais ses trois nœuds sont également présents dans la relation 6990794 : il ne constitue pas une troisième direction indépendante.

**Conclusion actualisée :** la ligne 121 dispose maintenant d'une preuve géographique forte de deux séquences OSM partielles qui suivent le même corridor dans des sens opposés. Cela ne résout pas le terminus HLM Grand Medine / Scat Urban, ni l'absence d'une séquence complète de retour. Conserver les deux relations séparément et les qualifier de candidats directionnels partiels ; ne pas les promouvoir en itinéraires voyageurs validés.
