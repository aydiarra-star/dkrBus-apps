# Audit de couverture Rufisque, Bargny, Keur Massar et Sangalkam — 16 novembre 2026

## Objet et règle de sécurité

Vérifier les dessertes périurbaines DDD et AFTU à partir des pages officielles accessibles, distinguer les relations annoncées des séquences détaillées et repérer les contradictions entre catalogue et fiches d'itinéraire.

**Ce document est un audit documentaire uniquement.** Il n'ajoute aucun arrêt actif, aucune coordonnée, aucun tracé, aucun horaire ni aucune correspondance au calculateur. Les noms de quartiers ou de terminus ne sont pas convertis en points GPS sans quai identifié.

## 1. Rufisque et ses abords

### DDD — dessertes publiées

Le réseau urbain DDD présente notamment :

- **Ligne 15 : Rufisque ↔ Palais 1.** Séquence publiée : terminus Rufisque, Djoutiba, sortie Rufisque, croisement Keur Massar, Fass Mbao, Diamaguène, Poste Thiaroye, Bountou Pikine, Colobane, puis centre-ville.
- **Ligne 213 : Rufisque ↔ Dieuppeul.** Séquence publiée depuis la gare de Rufisque via HLM SIPRES, ZAC Mbao, Grand Mbao, Keur Mbaye Fall, Petit Mbao, Diamaguène, Poste Thiaroye et jusqu'à Dieuppeul.
- **Ligne 220 : Rufisque ↔ Guédiawaye.** Séquence publiée via Djoutiba, HLM Rufisque, SIPRES, SEDIMA, lycée Jaxaay, station Keur Massar, Malika et Guédiawaye.
- **Ligne 208 : Bayakh ↔ Rufisque.** La page DDD publie les jalons Gorom 01, Gorom 02, Bambilor, Noflaye, Sangalkam, Keur Ndiaye Lo et Rufisque.
- **Relation Rufisque ↔ Yenne :** la page DDD publie une séquence Rufisque, ville de Rufisque, Bargny, Diamniadio/Yenne, sans numéro clairement affiché dans ce bloc.
- **Ligne 15A/15B :** la page « Info voyageurs » utilise cette désignation, tandis que la page « Réseau urbain » affiche « Ligne 15 ». Ne pas créer deux services distincts sur la seule base de cette différence de présentation.

### AFTU — relations du catalogue

Le catalogue AFTU affiche notamment :

- Ligne 54 : « Terminus Rufisque Sonadis – Petersen » ;
- Ligne 56 : « Jaxaay 2 – Petersen » ;
- Ligne 57 : « Liberté 6 – Rufisque » ;
- Ligne 59 : « Colobane – Bargny » ;
- Ligne 60 : « Colobane – Bargny » ;
- Ligne 61 : « Arrêt Chérif (Rufisque) – Penc Mi (Gueule Tapée) » ;
- Ligne 62 : « Terminus Camp Marchand Rufisque – Stade LSS » ;
- Ligne 63 : « Guédiawaye – Rufisque » ;
- Ligne 66 : « Ouakam – Thiawlène Rufisque » ;
- Ligne 73 : « Terminus Bargny (gare ferroviaire) – Tivaouane Peul » ;
- Ligne 76 : « Rufisque – Liberté 5 » ;
- Ligne 82 : « Rufisque Arafat – Zone de Captage » ;
- Ligne 83 : « UCAD – Jaxaay » ;
- Ligne 88 : « Bargny – Croisement Niague (Cité SICAP) ».

Ces libellés prouvent que le catalogue annonce une couverture de Rufisque et de ses secteurs, mais ne suffisent pas à déterminer les quais ni la séquence détaillée de chaque ligne.

### Contradictions catalogue / fiche détaillée AFTU à conserver

Les pages officielles AFTU consultées présentent plusieurs différences importantes :

| Ligne | Catalogue AFTU | Fiche détaillée consultée | Décision |
|---|---|---|---|
| 54 | Rufisque Sonadis – Petersen | Keur Massar (MTOA) – UCAD | Conflit majeur : ne pas géocoder la relation sans clarification |
| 59 | Colobane – Bargny | Diamalaye – Cité Gendarmerie (Jaxaay) | Ne pas fusionner les deux relations |
| 63 | Guédiawaye – Rufisque | Parcelles Dior – Camp Marchand Rufisque | Conserver la divergence et la fiche détaillée comme séquence propre à vérifier |
| 66 | Ouakam – Thiawlène | Yoff – Gorom 1 via Keur Ndiaye Lo et Bambilor | Ne pas assimiler automatiquement la fiche à la relation du catalogue |
| 73 | Bargny gare ferroviaire – Tivaouane Peul | Poste Thiaroye – Lac Rose via Keur Massar, Niakourab et Niagues | Conflit majeur : aucun tracé actif à déduire |
| 76 | Rufisque – Liberté 5 | SIPRES – Cité Assurance via Keur Massar | Ne pas géocoder les deux terminus comme une seule relation |
| 78 | Sangalkam – Cambérène | Diamaguène – Liberté 5 | Conflit majeur : ne pas déduire une liaison Sangalkam–Cambérène de cette fiche |
| 82 | Rufisque Arafat – Zone de Captage | Comico – Lat Dior | Conflit majeur : conserver la relation catalogue séparée |
| 83 | UCAD – Jaxaay | Rufisque Arafat – Zone de Captage | Conflit majeur déjà repéré dans l'audit UCAD ; ne pas créer de point UCAD sur cette seule fiche |

La ligne 60 est un exemple où la fiche détaillée consultée décrit bien une relation Colobane–Bargny, avec des jalons intermédiaires : route nationale 1, Diamaguène, Sicap Mbao, Fass Mbao, croisement Keur Massar, Dioutyba/Rufisque, Sonadis, Sococim et terminus Bargny. Elle constitue une preuve de desserte de corridor, mais pas une localisation précise des quais.

## 2. Bargny

### DDD

La page DDD publie une relation Rufisque–Yenne qui passe par Bargny. Cette séquence confirme le passage par la localité, mais ne donne ni quai, ni arrêt nommé à l'intérieur de Bargny, ni numéro de ligne clairement attaché au bloc de la page consultée.

### AFTU

Le catalogue annonce les lignes 59 et 60 Colobane–Bargny, la ligne 73 Bargny gare ferroviaire–Tivaouane Peul et la ligne 88 Bargny–Croisement Niague (Cité SICAP).

La fiche détaillée de la ligne 60 décrit une desserte de Bargny via Sonadis et Sococim. En revanche, les fiches consultées des lignes 59 et 73 ne correspondent pas aux intitulés de leur catalogue. La ligne 88 n'a pas pu être confirmée par une fiche détaillée exploitable dans cette vérification.

**Décision Bargny :** retenir les relations du catalogue comme indices de couverture, mais ne pas créer de tracé détaillé pour les lignes 59, 73 ou 88 tant que l'opérateur n'a pas clarifié les divergences. Ne pas créer de correspondance DDD↔AFTU à Bargny sans points de quais et cheminement piéton vérifiés.

## 3. Keur Massar et corridor Mbao–Thiaroye

### DDD — séquences publiées

Les pages officielles DDD mentionnent Keur Massar dans plusieurs relations :

- **Ligne 11 :** Keur Massar – Lat Dior, avec station Keur Massar, croisement Keur Massar, Fass Mbao, Diamaguène et Poste Thiaroye.
- **Ligne 15 :** Rufisque – Palais 1, avec croisement Keur Massar, Fass Mbao et Diamaguène.
- **Ligne 16B :** Malika – Palais 1, avec station et croisement Keur Massar, LGI Mbao et Diamaguène.
- **Ligne 220 :** Rufisque – Guédiawaye, via SEDIMA, Jaxaay et station Keur Massar.
- **Ligne 227 :** Keur Massar – Terminus Parcelles, via Tolou Abdoulaye Wade, croisement Tivaouane Peulh, APIX et Malika.
- **Ligne 234 :** Jaxaay – Leclerc, via station Keur Massar, croisement Keur Massar, Fass Mbao et Diamaguène.
- **Ligne 311 :** Lac Rose – Croisement Keur Massar, via croisement Tivaouane Peulh et station Keur Massar.
- **Ligne 327 :** Keur Massar – Terminus Parcelles, via Tolou Abdoulaye Wade, croisement Tivaouane Peulh, APIX et Malika.

Les noms « Station Keur Massar », « Croisement Keur Massar », « Terminus Keur Massar », « MTOA » et « Croisement Tivaouane Peulh » doivent rester distincts tant que leurs positions et leurs fonctions ne sont pas identifiées.

### AFTU — relations du catalogue et fiches consultées

Le catalogue annonce notamment :

- Ligne 51 : Bountou Pikine – Keur Massar ;
- Ligne 52 : Keur Massar – Sébikotane ;
- Ligne 53 : Terminus Keur Massar (Cité MTOA) – UCAD ;
- Ligne 54 : Terminus Rufisque Sonadis – Petersen ;
- Ligne 60 : Colobane – Bargny ;
- Ligne 61 : Keur Massar – Almadies ;
- Ligne 67 : Yeumbeul – Sébikotane ;
- Ligne 70 : Keur Massar – Claudel ;
- Ligne 73 : Bargny gare ferroviaire – Tivaouane Peul ;
- Ligne 76 : Rufisque – Liberté 5 ;
- Ligne 82 : Rufisque Arafat – Zone de Captage ;
- Ligne 83 : UCAD – Jaxaay.

Les fiches détaillées consultées confirment des séquences qui passent par Keur Massar ou ses abords, notamment les lignes 54 (MTOA–UCAD), 60 (Colobane–Bargny via le croisement Keur Massar) et 61 (Keur Massar–Almadies). Les contradictions catalogue / fiche listées plus haut interdisent de traiter toutes les relations comme validées.

**Décision Keur Massar :** la couverture DDD est confirmée par plusieurs séquences publiées. La couverture AFTU est annoncée par le catalogue, avec des fiches détaillées à rapprocher. Aucun arrêt AFTU ne doit être positionné automatiquement sur un arrêt DDD homonyme.

## 4. Sangalkam, Bambilor et corridor vers Rufisque

### DDD

La ligne 208 publiée par DDD relie Bayakh à Rufisque via Gorom 01, Gorom 02, Bambilor, Noflaye, Sangalkam et Keur Ndiaye Lo. La page « Info voyageurs » confirme l'existence de la relation Bayakh–Rufisque.

### AFTU

Le catalogue AFTU annonce :

- Ligne 65 : Yoff – Gorom 1 ;
- Ligne 66 : Ouakam – Thiawlène Rufisque ;
- Ligne 78 : Sangalkam – Cambérène ;
- Ligne 86 : Bambilor – Mosquée Massalikou Djinaane ;
- Ligne 88 : Bargny – Croisement Niague (Cité SICAP).

La fiche détaillée de la ligne 66 consultée publie en réalité une séquence Yoff–Gorom 1 via Keur Ndiaye Lo et Bambilor, alors que le catalogue l'intitule Ouakam–Thiawlène. La fiche détaillée de la ligne 78 décrit Diamaguène–Liberté 5, alors que le catalogue annonce Sangalkam–Cambérène. Il s'agit de divergences à résoudre, pas de variantes de tracé à fusionner.

**Décision Sangalkam :** la desserte DDD de la localité est explicitement publiée sur la ligne 208. Le catalogue AFTU annonce la ligne 78 Sangalkam–Cambérène, mais sa fiche détaillée consultée ne confirme pas cette relation. Ne pas activer la relation AFTU 78 dans le calculateur sur la seule base du catalogue tant que la divergence n'est pas levée.

## 5. Correspondances et géolocalisation : aucune activation nouvelle

Les noms de pôles ou de quartiers (Gare de Rufisque, Camp Marchand, Sonadis, Sococim, Bargny gare ferroviaire, Station Keur Massar, MTOA, Sangalkam, Bambilor, Keur Ndiaye Lo) ne sont pas des coordonnées de quais.

Avant d'ajouter une correspondance, il faut obtenir pour chaque opérateur :
1. le point GPS exact du quai dans chaque sens ;
2. la confirmation que les deux services utilisent bien le même pôle et non deux arrêts de quartier différents ;
3. le cheminement piéton praticable, les traversées et les accès ;
4. une distance piétonne mesurée, et non une distance à vol d'oiseau ;
5. la confirmation du nom officiel à afficher.

Aucun lien de correspondance Rufisque, Bargny, Keur Massar ou Sangalkam n'est ajouté dans cet audit.

## 6. Priorités de résolution

1. Demander à AFTU de clarifier les conflits des lignes 54, 59, 63, 66, 73, 76, 78, 82 et 83 entre catalogue et fiches détaillées.
2. Obtenir la séquence officielle complète et les points de terminus de la ligne 88 Bargny–Croisement Niague.
3. Vérifier le numéro de la relation DDD Rufisque–Bargny–Yenne et ses arrêts réels.
4. Identifier les quais DDD et AFTU à Gare de Rufisque, Camp Marchand, Sonadis, Sococim et Bargny gare ferroviaire.
5. Distinguer les différents arrêts Keur Massar (station, croisement, terminus, MTOA).
6. Confirmer le tracé actuel de la ligne AFTU 78 Sangalkam–Cambérène et de la ligne 66 catalogue Ouakam–Thiawlène.
7. Relever les accès et cheminements piétons avant toute correspondance automatique.

## Sources officielles consultées

- Dakar Dem Dikk, réseau urbain et lignes de banlieue : https://demdikk.sn/reseau-urbain-dakar/
- Dakar Dem Dikk, info voyageurs et liste des relations : https://demdikk.sn/info-voyageurs/
- AFTU Sénégal, catalogue officiel des lignes : https://aftu-senegal.org/infos-pratiques/
- AFTU Sénégal, fiche détaillée ligne 54 : https://aftu-senegal.org/map/dakar-urbain-ligne-54/
- AFTU Sénégal, fiche détaillée ligne 59 : https://aftu-senegal.org/map/dakar-urbain-ligne-59/
- AFTU Sénégal, fiche détaillée ligne 60 : https://aftu-senegal.org/map/dakar-urbain-ligne-60/
- AFTU Sénégal, fiche détaillée ligne 61 : https://aftu-senegal.org/map/dakar-urbain-ligne-61/
- AFTU Sénégal, fiche détaillée ligne 63 : https://aftu-senegal.org/map/dakar-urbain-ligne-63/
- AFTU Sénégal, fiche détaillée ligne 66 : https://aftu-senegal.org/map/dakar-urbain-ligne-66/
- AFTU Sénégal, fiche détaillée ligne 67 : https://aftu-senegal.org/map/dakar-urbain-ligne-67/
- AFTU Sénégal, fiche détaillée ligne 73 : https://aftu-senegal.org/map/dakar-urbain-ligne-73/
- AFTU Sénégal, fiche détaillée ligne 76 : https://aftu-senegal.org/map/dakar-urbain-ligne-76/
- AFTU Sénégal, fiche détaillée ligne 78 : https://aftu-senegal.org/map/dakar-urbain-ligne-78/
- AFTU Sénégal, fiche détaillée ligne 82 : https://aftu-senegal.org/map/dakar-urbain-ligne-82/
- AFTU Sénégal, fiche détaillée ligne 83 : https://aftu-senegal.org/map/dakar-urbain-ligne-83/

## Périmètre de modification

Un seul document d'audit est ajouté. Aucun changement de code, de données actives, d'arrêts, de lignes, de tracés, d'horaires, de correspondances, ni de référence TER/BRT.
