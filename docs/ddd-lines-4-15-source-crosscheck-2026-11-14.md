# Audit des sources DDD — lignes 4 et 15

Date de consultation : 14 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `audit/ddd-lines-4-15-source-crosscheck-2026-11-14`

## Périmètre et règle de preuve

Cet audit compare les publications DDD accessibles et les fiches de mobilité secondaires. Il ne modifie aucun parcours applicatif. Les séquences publiées sont retranscrites comme preuves documentaires, pas comme autorisation d'ajouter des coordonnées ou des horaires. Les sens aller et retour restent distincts ; un sens non publié par une source primaire n'est pas fabriqué en inversant l'autre.

## Ligne DDD 4 — Liberté 5 / Place Leclerc

### Source primaire

La page officielle « Réseau urbain » de Dakar Dem Dikk publie la ligne 4 sous l'intitulé « Liberté 5 ↔ Place Leclerc » et affiche 26 entrées textuelles, terminus compris :

1. Terminus Liberté 5 (Dieuppeul) – Cité Derklé
2. Rond point Liberté 6
3. Khar Yalla
4. Cité Marine
5. CEM Dieuppeul 3
6. Eglise Martyrs de l’ouganda
7. SDE
8. Collège Sacré Cœur
9. Sicap Karack
10. Point E
11. Université Amphate BA
12. Canal 4
13. Marché Fass
14. Gueule Tapée
15. Rond Point Sham
16. Marché Tilène
17. Poste Médina
18. Difoncé
19. Sandaga
20. ASECNA
21. Boulevard de la République
22. Avenue Léopold Sédar Senghor
23. Place de l’Indépendance
24. Gare TER
25. Embarcadère
26. Terminus Leclerc

**Attention au comptage :** la première entrée publiée contient deux noms (« Terminus Liberté 5 (Dieuppeul) – Cité Derklé »). La page les présente sur une même ligne de texte ; cet audit conserve donc la transcription telle quelle et ne prétend pas résoudre si DDD entend un ou deux points d'arrêt distincts.

La page officielle « Info voyageurs » confirme séparément l'identifiant et les terminus « Ligne 4 — Liberté 5 ↔ Place Leclerc ».

### Recoupement secondaire et réserve

Moovit publie une fiche intitulée « Liberté 5 – Leclerc » avec 35 arrêts dans la direction Leclerc, mais sa page classe cette fiche sous **AFTU 4**, alors que la page officielle DDD identifie une ligne DDD 4. Cette contradiction d'opérateur empêche de traiter Moovit comme corroboration indépendante de la ligne DDD 4. Les libellés génériques « Arrêt de bus » et les adresses de rues ne doivent pas être fusionnés avec la séquence officielle sans rapprochement individuel.

### Conclusion ligne 4

- Terminus et séquence de référence : **DOCUMENTED_REFERENCE**, sur la base de la page officielle DDD.
- Le sens retour détaillé n'est pas fourni comme séquence indépendante par la page officielle consultée.
- Ne pas créer un retour en inversant automatiquement les entrées publiées.
- Ne pas importer les 35 arrêts Moovit dans DDD 4 : l'attribution AFTU/DDD est contradictoire.
- Aucun horaire, fréquence, coordonnée ou temps de passage n'est validé par cet audit.

## Ligne DDD 15 — Rufisque / Palais 1

### Source primaire : contradiction de nomenclature

La page officielle « Réseau urbain de Dakar » affiche une **LIGNE 15 : RUFISQUE ↔ PALAIS 1** et publie les 18 entrées suivantes, terminus compris :

1. Terminus Rufisque
2. Djoutiba
3. Sortie Rufisque
4. Croissement Keur Massar
5. Fass Mbao
6. Diamaguène
7. Poste Thiaroye
8. Croisement Bountou Pikine
9. National 1
10. Croissement Camberene
11. autoroute
12. Colobane
13. SCOA
14. Esso Port
15. Place de l’Indépendance
16. Avenue Léopold Sédar Senghor
17. Avenue Nelson Mandela
18. Palais 1

Cependant, la page officielle « Info voyageurs » classe actuellement **15A & 15B — Rufisque ↔ Palais 1** dans les lignes de banlieue, sans fournir dans cette rubrique les séquences propres à 15A et 15B.

Ces deux publications officielles ne permettent donc pas d'établir si la fiche « ligne 15 » de la page réseau représente une ligne unique, une fiche générique regroupant 15A/15B, ou une ancienne nomenclature. Il ne faut pas attribuer automatiquement la séquence de 18 entrées à 15A et à 15B.

### Recoupement secondaire : Moovit

Moovit présente une fiche « Dakar Dem Dikk 15 — Rufisque / Palais » avec 69 arrêts dans chaque direction :
- direction Palais : Gare Maritime de Rufisque → Gare Palais ;
- direction Rufisque : Gare Palais → Gare Maritime de Rufisque.

La fiche Moovit confirme l'existence d'une ligne 15 opérée sous le nom Dakar Dem Dikk et expose deux directions distinctes. Toutefois :
- les terminus Moovit « Gare Palais » et « Gare Maritime de Rufisque » ne sont pas libellés exactement comme les terminus de la page DDD (« Palais 1 » et « Terminus Rufisque ») ;
- les listes contiennent de nombreux libellés génériques « Arrêt de bus » ;
- le volume de 69 arrêts par sens ne permet pas d'identifier à lui seul les variantes 15A et 15B ;
- aucune preuve consultée ne relie explicitement la fiche Moovit 15 à chacune des variantes 15A et 15B.

### Conclusion ligne 15

- L'existence d'un service DDD « 15 — Rufisque / Palais » est documentée par la page réseau DDD et recoupée par Moovit.
- La nomenclature actuelle 15A/15B de la page « Info voyageurs » est également officielle, mais ses séquences respectives restent non documentées dans les éléments consultés.
- La séquence DDD publiée de 18 entrées est conservée comme **DOCUMENTED_REFERENCE pour la fiche générique 15 uniquement** ; elle n'est pas attribuée à 15A ou 15B.
- Les deux listes Moovit de 69 arrêts sont des éléments secondaires de comparaison, pas un remplacement automatique de la séquence officielle.
- Ne pas fusionner « Palais 1 », « Gare Palais » et d'autres terminus du centre-ville sans preuve d'équivalence opérationnelle.
- Ne pas fabriquer des séquences 15A/15B, des coordonnées, des horaires ou des fréquences.

## Sources consultées

1. Dakar Dem Dikk, « Réseau urbain de Dakar » — lignes 4 et 15, séquences publiées : https://demdikk.sn/reseau-urbain-dakar/
2. Dakar Dem Dikk, « Info voyageurs » — nomenclature des lignes urbaines et banlieue, dont ligne 4 et 15A/15B : https://demdikk.sn/info-voyageurs/
3. Moovit, ligne 4 « Liberté 5 – Leclerc », 35 arrêts, attribution de page affichée AFTU : https://moovitapp.com/index/fr/transport_en_commun-line-4-Dakar-5996-1618038-18051497-0
4. Moovit, ligne 15 « Rufisque – Palais », direction Palais : https://moovitapp.com/index/fr/transport_en_commun-line-15-Dakar-5996-1618037-18051465-0
5. Moovit, ligne 15 « Rufisque – Palais », direction Rufisque : https://moovitapp.com/index/fr/transport_en_commun-line-15-Dakar-5996-1618037-18051465-1

## Garde-fous

- Audit documentaire uniquement : aucune séquence de production, aucun arrêt, aucune coordonnée, aucun horaire et aucune fréquence modifiés.
- Aucun retour n'est généré par inversion mécanique.
- Les variantes 15A/15B restent séparées tant que leurs parcours propres ne sont pas prouvés.
- Aucune donnée TER/BRT n'est touchée.
- Aucun accès Supabase ni déploiement n'est effectué.
