# AFTU 88–91 — comparaison directionnelle des listes et recoupements exacts

Date : 14 novembre 2026  
Branche : `feat/admin-stop-sequence-audit-phase-a`

## Méthode

Comparaison des listes documentaires déjà enregistrées pour les lignes 88, 89, 90 et 91. Les séquences sont extraites séparément par sens. La comparaison normalise uniquement les accents, la casse et la ponctuation pour repérer les libellés strictement équivalents après cette normalisation. Elle ne fusionne ni ne modifie les arrêts. Le LCS mesure la plus longue sous-séquence commune en conservant l'ordre relatif ; il ne valide pas l'identité opérationnelle des lignes.

Comptages relus dans les fiches :
- Ligne 88 : 78 aller, 81 retour.
- Ligne 89 : 55 aller, 53 retour.
- Ligne 90 : 82 aller, 82 retour.
- Ligne 91 : 70 aller, 70 retour.

## Résultats importants

### Ligne 89 et ligne 91

Le recoupement le plus net concerne la ligne 89 et les listes CETUD 91 :
- Ligne 89 aller / ligne 91 retour : **18 libellés communs**, LCS = **18**.
- Ligne 89 retour / ligne 91 aller : **18 libellés communs**, LCS = **18**.

Les deux séquences 89/91 décrivent donc un segment commun très fortement compatible dans l'ordre, dans des sens opposés. Les 18 libellés communs sont :
1. Poste Courant Bargny près de la gare TER
2. Juste après l'arrêt Poste Courant devant l'échangeur
3. Rond-Point Sococim
4. Thiawlène devant Station Total Énergie
5. Thiawlène en face Pharmacie Thiawlene
6. Poste Courant Rufisque
7. Arrêt P15
8. Sonadis près du Jardin en face Hôtel de Ville
9. Sonadis
10. Shell Rufisque Guendel
11. Edicom
12. Mbalka Thiokho
13. Dioutiba
14. Face Auberge L'Oustal de l'Agenais
15. Entrée Rufisque Arrêt Avisen
16. Layousse
17. Rond-Point Zac Mbao face Station Total
18. Zac Mbao Station Oryx

**Interprétation limitée :** cela prouve un recouvrement textuel ordonné entre les listes transmises, pas que les lignes 89 et 91 sont la même ligne, ni qu'elles ont été fusionnées ou renumérotées. L'index public AFTU consulté affiche 89 = Bargny–Croisement Niague et 91 = APIX–Dougar. La liste CETUD 91 transmise décrit Losso / Chez Lo électricien et contient aussi le secteur APIX et Dougar ; la correspondance exacte des extrémités reste ouverte. Aucun arrêt n'est réaffecté.

### Ligne 88 et ligne 90

Un deuxième recoupement significatif concerne les secteurs de Fass Mbao / Boune :
- Ligne 88 retour / ligne 90 aller : **9 libellés communs**, LCS = **9**.
- Ligne 88 aller / ligne 90 retour : **7 libellés communs**, LCS = **7**.

Les libellés partagés comprennent notamment le secteur Fass Mbao, le salon Sope Serigne Fallou, la charbonnerie/Tally Mame Diarra, Boune Tally Bou Bess, Darou Salam, Ola Énergie et le camp LGI Mbao. Les correspondances de direction sont compatibles avec un corridor local partagé. Elles ne permettent pas d'attribuer la totalité de l'une des lignes à l'autre.

Les deux autres comparaisons croisées entre 88 et 90 donnent seulement 2 libellés communs (LCS 1) ou 2 (LCS 1), donc ne constituent pas une continuité directionnelle équivalente.

### Absence de recoupement exact avec les autres paires

Après normalisation accents/casse/ponctuation :
- Aucun libellé commun n'a été détecté entre les listes 88 et 89, dans les quatre combinaisons de sens.
- Aucun libellé commun n'a été détecté entre les listes 88 et 91.
- Aucun libellé commun n'a été détecté entre les listes 89 et 90.

L'absence de libellé identique ne prouve pas l'absence de proximité géographique : les noms peuvent varier, et cette comparaison n'utilise pas de coordonnées.

## Contrôle des corridors publics

La page officielle AFTU « Infos pratiques » consultée le 14 novembre 2026 affiche :
- Ligne 87 : Bambilor – Mosquée Massalikou Djinane.
- Ligne 88 : MTOA – Liberté 5.
- Ligne 89 : Bargny – Croisement Niague (Cité SICAP).
- Ligne 91 : APIX – Dougar.

La liste détaillée 88 transmise au projet va de « Terminus 88 » à « Terminus Liberté 5 » et contient MTOA comme repère intermédiaire : le point de départ « Terminus 88 » n'est pas encore identifié comme MTOA. La liste détaillée 89 va de « Terminus 89 » à « Poste Courant Bargny près de la gare TER » et contient « Croisement Niague » : le lien entre « Terminus 89 » et Croisement Niague reste à confirmer. Les listes 89 et 91 ont 18 libellés communs en sous-séquence opposée ; la correction du corridor officiel permet de traiter cela comme un segment partagé possible, sans fusionner les lignes. Ces différences sont des conflits de sources à résoudre, pas des raisons d'effacer les listes fournies.

Source primaire : https://aftu-senegal.org/infos-pratiques/  
La page CETUD présente AFTU comme un réseau de 72 lignes et 14 GIE : https://cetud.sn/reseaux-de-transport/aftu/

## Décisions de conservation

- Conserver les quatre listes et les deux sens tels quels, y compris les répétitions et variantes de libellés.
- Ne pas fusionner 89 et 91 malgré le segment commun ordonné.
- Ne pas fusionner 88 et 90 malgré le corridor commun Fass Mbao/Boune.
- Ne créer aucun arrêt, horaire, fréquence, coordonnée ou temps de passage à partir de ces recoupements.
- Ajouter les URLs originales des sources des listes 88/89 lorsqu'elles seront disponibles.
- Garder les divergences de terminus visibles pour validation AFTU/CETUD.

Aucune donnée passager n'est modifiée. Aucun changement TER/BRT, aucune écriture Supabase, aucun déploiement et aucune fusion du PR.


## Rectification officielle de la numérotation — 14 novembre 2026

La page AFTU relue directement confirme les corridors exacts suivants : 88 = MTOA–Liberté 5 ; 89 = Bargny–Croisement Niague (Cité SICAP) ; 91 = APIX–Dougar. Les anciennes associations de numéros dans la section « Contrôle des corridors publics » sont remplacées par cette référence corrigée.

Le segment commun de 18 libellés entre 89 et 91 reste conservé comme indice de corridor partagé possible : la ligne 91, plus longue, dessert elle aussi des secteurs de Bargny/Rufisque dans les listes transmises. Cela ne prouve ni identité de ligne ni fusion, et ne permet pas de transférer des arrêts d'une ligne à l'autre.

Pour la ligne 88, MTOA apparaît dans la liste détaillée mais comme repère intermédiaire ; le lien avec « Terminus 88 » n'est pas établi. Pour la ligne 89, Bargny est corroboré par le terminus de la liste, mais l'équivalence de « Terminus 89 » avec « Croisement Niague (Cité SICAP) » reste à établir. Pour la ligne 91, les deux sens enregistrés contiennent les secteurs APIX et Dougar, mais leurs extrémités Losso / Chez Lo électricien peuvent représenter une extension du corridor officiel ; aucune coupe n'est faite.

Les six lignes 85 à 91 affichées par l'index officiel ont désormais un registre de rapprochement et un test dédié dans `src/data/aftuOfficialIndexCrosswalk.ts` et `src/data/aftuOfficialIndexCrosswalk.test.ts`.


## Statut définitif d'intégration des lignes 88, 89 et 91

Le responsable du projet confirme explicitement que les séquences complètes sont validées à 100 % et doivent être intégrées sans réserve :

- Ligne 88 : 78 occurrences aller et 81 retour ;
- Ligne 89 : 55 occurrences aller et 53 retour ;
- Ligne 91 : 70 occurrences aller et 70 retour.

Cette validation porte sur les séquences transmises elles-mêmes. Les différences entre les noms de terminus dans l'index AFTU et les libellés des listes restent des informations de rapprochement externe ; elles ne constituent pas un statut « à confirmer » pour les listes intégrées. Aucun arrêt n'est retiré, réordonné, fusionné ou renommé en raison de ces différences. Les deux sens sont indépendants et les répétitions sont conservées.
