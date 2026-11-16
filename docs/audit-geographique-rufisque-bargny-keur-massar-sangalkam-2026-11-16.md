# Note de correction — audit géographique préliminaire du 16 novembre 2026

Ce document était une première synthèse de repérage. Il est remplacé par l'audit détaillé, qui réconcilie les points OSM, les couches DDD, le catalogue AFTU et les numéros des fiches de parcours :

**Document de référence :** [audit géographique Rufisque, Bargny, Keur Massar et Sangalkam](./audit-rufisque-bargny-keur-massar-sangalkam-2026-11-16.md).

## Corrections importantes

1. **Numérotation AFTU :** les numéros des fiches détaillées ne sont pas les numéros du catalogue. Le terminus Bargny gare ferroviaire est la ligne officielle **73** (fiche détaillée page 74), et le parcours Keur Massar–Almadies est la ligne officielle **60** (fiche détaillée page 61). Les numéros de catalogue sont ceux utilisés par l'application.
2. **Keur Massar :** la gare routière OSM (14.76984, -17.31840), le Terminus 52 (14.77419, -17.31767) et le pôle P11 DDD/AFTU (14.7854, -17.3092) sont des lieux distincts. Le pôle P11 est le terminus commun documenté de DDD 227 et AFTU 60 ; il ne faut pas le confondre avec la gare routière générale.
3. **Bargny :** la ligne AFTU 73 annonce explicitement le terminus « Bargny (gare ferroviaire) ». Le calculateur utilise ce pôle pour une correspondance TER ↔ AFTU 73 ; la marche interne au pôle n'est pas mesurée et n'est pas présentée comme 0 minute.
4. **Rufisque / PNR :** la gare TER Rufisque, la halte PNR et la gare routière restent trois lieux distincts. Aucun transfert TER ↔ bus n'est activé sans quai et cheminement piéton vérifiés.
5. **Sangalkam :** DDD 208 et AFTU 78 sont des corridors routiers publiés, mais les quais exacts restent à confirmer.

## Règle de sécurité

Les points de référence, centres de localité et emprises de gare ne remplacent pas un quai opérateur. Les correspondances non vérifiées restent des candidates d'audit. Les tracés et horaires TER/BRT de référence restent intacts.
