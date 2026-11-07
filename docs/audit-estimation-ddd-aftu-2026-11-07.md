# Audit DDD/AFTU et estimation des attentes — 7 novembre 2026

## Décisions de préservation

- TER et BRT sont gelés : aucune modification de leurs horaires, fréquences, calculs ou affichages sans accord explicite du propriétaire du projet.
- Le nouvel estimateur `src/domain/observedWaits.ts` est isolé et ne modifie ni n'importe le moteur TER/BRT.
- Aucune donnée historique n'est présentée comme fréquence actuelle.
- Aucune heure exacte de prochain passage n'est calculée sans ancre de départ ou donnée d'observation adéquate.

## État réel du dépôt audité

Le fichier `src/data/mobility-lines.json` contient 109 fiches :
- AFTU : 72 fiches, dont 5 avec étapes détaillées et URL de fiche de parcours.
- DDD : 37 fiches, dont 15 avec étapes détaillées.
- Le référentiel annonce 38 lignes DDD : le décompte de 37 fiches doit être réconcilié avec l'opérateur avant de considérer l'inventaire complet.

Ces fiches donnent une base de lignes et certains itinéraires, mais elles ne fournissent pas les fréquences actuelles par ligne, sens et arrêt. Les étapes textuelles ne sont pas encore toutes des arrêts géolocalisés validés.

Le module `src/domain/candidateLines.ts` est présent, mais `CANDIDATE_LINES` est vide. Le mécanisme d'observations existant ne suffit pas encore à produire une statistique distincte par arrêt et période : son agrégat `acceptedAt` est attaché à une fiche ligne/sens, sans clé d'arrêt.

## Sources consultées

### DDD — informations opérateur
- Page voyageurs : https://demdikk.sn/info-voyageurs/
- Elle publie des lignes et certains premiers/derniers départs. La ligne 01, par exemple, annonce un premier départ à 05:30 depuis les Parcelles et un dernier à 20:30, puis 06:30–21:00 depuis Leclerc. Ces bornes ne donnent pas l'intervalle de passage aux arrêts intermédiaires.
- La page ne fournit pas un tableau complet de fréquences par ligne et arrêt.

### AFTU — informations opérateur
- FAQ : https://aftu-senegal.org/faq/
- Elle indique une circulation généralement du matin au soir jusqu'à 21 h, avec horaires variables selon les lignes et les zones. Ce n'est pas une fréquence ligne par ligne.
- Site des lignes : https://aftu-senegal.org/infos-pratiques/

### Mesures AFTU publiées en 2025
- Étude : https://www.acadlore.com/article/IJTDI/2025_9_1/ijtdi.090108
- Article publié le 31 mars 2025 ; ses mesures de fréquences sont annoncées comme relevées en 2023–2024.
- Moyenne globale AFTU rapportée : 11,58 min ; écart-type : 6,97 min ; plage statistique publiée : 13,94 min.
- Ces mesures agrégées ne sont pas ventilées dans le tableau par ligne, arrêt et sens. Elles servent de contexte/calibration scientifique, pas de fréquence par défaut dans l'application.

### Mesures historiques CETUD
- Rapport CETUD/CUREM, « Étude de la situation de référence du projet BRT », tome 2, juillet 2020 : https://cetud.sn/wp-content/uploads/2026/03/10-CETUD-ESRBRT-TOME-2_VF.pdf
- Les tableaux 48–49 donnent des intervalles AFTU observés sur certains sites du corridor ; les tableaux 52–53 donnent des intervalles DDD sur certains sites. Le rapport précise que les mesures proviennent des données EFOV 2016.
- Les mesures sont anciennes et limitées à certains sites autour du corridor BRT. Elles ne doivent pas être utilisées comme fréquence actuelle ni généralisées à toutes les lignes.

## Règle d'estimation proposée

L'estimation doit être construite séparément pour chaque :
- réseau (DDD ou AFTU) ;
- ligne ;
- sens ;
- arrêt ;
- type de jour (semaine, samedi, dimanche) ;
- période de service (pointe matin, journée, pointe soir, soirée).

Les observations doivent résulter d'une action volontaire explicite de l'utilisateur. Pas de suivi GPS passif. Les données futures, anciennes, passives, hors réseau ou dupliquées sont rejetées.

Le nouvel estimateur attend au moins 12 intervalles observés et récents (fenêtre de 60 jours). Il renvoie une attente moyenne statistique et une fourchette issue des quartiles observés. Il ne renvoie jamais un compte à rebours exact ni un libellé temps réel. Les observations sont segmentées par ligne/sens/arrêt/jour/période pour ne pas mélanger des services différents.

La formule d'attente moyenne tient compte de l'irrégularité des intervalles : E(H²)/(2E(H)). La fourchette est calculée à partir des quartiles des intervalles observés. Cela reste une estimation statistique, pas une promesse de passage.

## Prochaines étapes avant affichage dans l'application

1. Réconcilier les 37 fiches DDD du dépôt avec le total déclaré de 38.
2. Vérifier les parcours et géolocaliser les étapes à partir de sources fiables ; ne pas transformer chaque repère textuel en arrêt officiel sans validation.
3. Obtenir ou collecter des observations récentes volontaires, par ligne, sens, arrêt et période.
4. Stocker ces observations avec une provenance, un horodatage, un consentement explicite et une politique de conservation.
5. Valider les seuils sur des relevés terrain indépendants, puis seulement connecter le moteur à l'interface.
6. Exécuter l'ensemble des tests frontend, données et build avant toute fusion.

## Statut de ce chantier

Le module d'estimation empirique est une première brique technique isolée. Il n'est pas encore relié à la collecte, au stockage ou à l'interface et ne change pas les horaires affichés. Le dépôt de production reste inchangé jusqu'à validation complète.
