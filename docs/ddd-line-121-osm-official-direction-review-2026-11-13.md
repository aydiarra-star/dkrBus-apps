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
