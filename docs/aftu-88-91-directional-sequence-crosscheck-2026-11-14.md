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

**Interprétation limitée :** cela prouve un recouvrement textuel ordonné entre les listes transmises, pas que les lignes 89 et 91 sont la même ligne, ni qu'elles ont été fusionnées ou renumérotées. L'index public AFTU consulté affiche 89 = APIX–Dougar, tandis que la fiche CETUD 91 transmise décrit Losso / Chez Lo électricien. Cette divergence institutionnelle demeure ouverte ; aucun arrêt n'est réaffecté.

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
- Ligne 87 : MTOA – Liberté 5.
- Ligne 88 : Bargny – Croisement Niague (Cité SICAP).
- Ligne 89 : APIX – Dougar.
- Ligne 91 : le titre « Ligne 91 » apparaît sans corridor lisible dans le texte récupéré.

La liste détaillée 88 transmise au projet va de « Terminus 88 » à « Terminus Liberté 5 » : elle ne correspond donc pas au corridor actuellement affiché par l'index officiel. La liste détaillée 89 va de « Terminus 89 » à « Poste Courant Bargny près de la gare TER » : elle ne correspond pas non plus au corridor officiel APIX–Dougar. Ces différences sont des conflits de sources à résoudre, pas des raisons d'effacer les listes fournies.

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
