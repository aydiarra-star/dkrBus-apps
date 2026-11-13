# Recherche de sources d’itinéraires DDD / AFTU / TATA

Date de consultation : 13 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`

Ce relevé identifie des sources consultables pour poursuivre la qualification des parcours. Il ne transforme aucune information candidate en itinéraire passager validé.

## 1. Dakar Dem Dikk (DDD)

**Source opérateur consultée :** https://demdikk.sn/reseau-urbain-dakar/

La page officielle « Réseau urbain de Dakar » publie des listes de repères dans un ordre terminus-à-terminus pour plusieurs lignes, par exemple :

- Ligne 1 : Parcelles Assainies → Place Leclerc ;
- Ligne 4 : Liberté 5 → Place Leclerc ;
- Ligne 7 : Ouakam → Palais 2 ;
- Ligne 8 : Aéroport LSS → Palais 2 ;
- Ligne 9 : Liberté 6 → Palais 2 ;
- Ligne 10 : Liberté 5 → Palais 2 ;
- Ligne 13 : Liberté 5 → Palais 2 ;
- Ligne 23 : Parcelles Assainies → Palais 1 ;
- Ligne 121 : Scat Urbam → Leclerc.

Les lignes 1, 4, 7, 8, 9, 10, 13, 18, 20, 23, 121 et d’autres parcours sont déjà transcrits dans `src/data/dddPublishedRoutes.ts` avec l’URL de la page opérateur et la date de collecte.

**Limite importante :** la page donne un ordre de repères et des terminus, mais ne fournit pas pour chaque ligne deux séquences détaillées indépendantes Aller et Retour. Les flèches entre terminus ne prouvent pas que le retour suit exactement l’ordre inverse. Les noms ne prouvent pas non plus que chaque repère a déjà été rapproché du bon identifiant d’arrêt et de ses coordonnées.

La ligne 18 apparaît deux fois dans le contenu de la page avec un parcours de type boucle. Elle doit rester un circuit documentaire et faire l’objet d’une vérification avant toute interprétation.

## 2. AFTU

**Source institutionnelle consultée :** https://cetud.sn/reseaux-de-transport/aftu/

Le CETUD confirme sur cette page la structure AFTU (14 GIE, 2 300 bus et 72 lignes) et met à disposition un plan téléchargeable :

https://cetud.sn/wp-content/uploads/2024/11/plan-lignes-aftu.jpeg

Le plan est une carte schématique de lignes numérotées sur la région de Dakar. Il constitue une bonne source pour repérer des corridors et préparer des vérifications, mais il ne fournit pas une liste textuelle ordonnée de tous les arrêts pour chaque sens. Il ne suffit donc pas à remplir les séquences Aller et Retour.

Le CETUD documente également des repositionnements et modifications de lignes AFTU liés à la restructuration du réseau autour du BRT et du TER. Une carte ancienne ne doit pas être considérée comme preuve de la desserte actuelle sans contrôle de date et de validité.

## 3. TATA

**Source secondaire consultée :** https://www.covoiturage.sn/bus-tata-itineraire/

Cette plateforme présente un répertoire de lignes TATA et des pages de détails par ligne. Deux exemples consultés :

- Ligne 1, Lat-Dior ⇔ HLM Grand Yoff : https://www.covoiturage.sn/bus-tata-itineraire/ligne/1/lat-dior/hlm-grand-yoff/
- Ligne 2, Route Principale des Parcelles Assainies ⇔ Gare Petersen : https://www.covoiturage.sn/bus-tata-itineraire/ligne/2/route-principale-des-parcelles-assainies/gare-petersen/

Ces pages contiennent des repères intermédiaires utiles pour préparer une revue. La page de la ligne 2 mentionne notamment des variantes de retour sur certaines rues. Cela confirme qu’il ne faut pas fabriquer le sens retour en inversant mécaniquement une liste.

**Limite importante :** il s’agit d’une source secondaire, non d’une publication de l’opérateur ou d’une validation CETUD. Les séquences TATA relevées doivent rester des candidates non vérifiées, avec leur URL et leur date, jusqu’à confirmation par une source primaire ou par une revue terrain documentée.

## 4. Décision de qualification

| Réseau | Résultat utile | Statut de travail |
|---|---|---|
| DDD | Source opérateur avec des listes ordonnées pour plusieurs lignes | Référence publiée ; sens opposé et rapprochement des arrêts à vérifier |
| AFTU | Page CETUD et carte de réseau numérotée | Référence cartographique ; ordre des arrêts et sens non établis |
| TATA | Catalogue secondaire et pages de détails de certaines lignes | Candidats secondaires ; confirmation opérateur nécessaire |

Aucune séquence nouvellement repérée dans cette recherche n’est injectée dans le catalogue voyageur par ce document.

## 5. Étapes suivantes

1. Demander au CETUD / AFTU un export ou des fiches par ligne avec les arrêts ordonnés dans les deux sens et la date d’effet.
2. Demander à Dakar Dem Dikk de confirmer les variantes et les deux sens des lignes dont la page publique ne donne qu’un ordre.
3. Demander aux responsables TATA / GIE concernés de confirmer les listes secondaires et les variantes.
4. Conserver chaque preuve, URL, date, auteur et statut dans un espace candidat distinct.
5. Rapprocher les repères textuels des identifiants d’arrêts uniquement avec preuves suffisantes.
6. Faire valider séparément chaque sens par un humain avant toute activation du calculateur ou affichage de passages.

Les horaires TER/BRT protégés restent hors périmètre. Le GTFS CETUD n’a pas été reçu et n’est pas requis pour continuer cette collecte documentaire.
