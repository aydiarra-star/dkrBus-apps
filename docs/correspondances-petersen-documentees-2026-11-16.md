# Correspondances documentées — pôle d’échange Petersen

Date : 16 novembre 2026

## Décision

Activation dans le calculateur de trois correspondances au même pôle d’échange de Petersen :

- BRT ↔ DDD ;
- BRT ↔ AFTU ;
- DDD ↔ AFTU.

Les transferts sont représentés avec `walkM: 0` : les trois réseaux sont annoncés comme desservant le même pôle situé à l’intérieur de la gare routière Petersen. Cette valeur signifie qu’aucune marche entre pôles distincts n’est ajoutée ; elle ne prétend pas mesurer la distance réelle entre quais ou portes.

## Sources officielles

1. **CETUD, Plan d’engagement des parties prenantes du BRT, décembre 2018**  
   https://www.cetud.sn/images/docs/Rapport_Final_PEPP_BRT_Dakar.pdf  
   Le document décrit le pôle d’échanges de Petersen à l’intérieur de la gare routière et indique qu’il doit faciliter le transfert entre le BRT et les modes de plus petite capacité, explicitement AFTU et DDD, dans les deux sens.

2. **CETUD / MITTA, Guide officiel de la mobilité JOJ Dakar 2026**  
   https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf  
   Le guide liste des lignes AFTU se terminant à Petersen (notamment 2, 4, 5, 25, 27, 28, 29, 40, 41, 50 et 55) et situe les dessertes DDD dans le même secteur du complexe Iba Mar Diop. La source confirme aussi les terminus AFTU à Lat Dior et UCAD, mais ces autres pôles ne sont pas activés ici.

3. **Dakar Dem Dikk, réseau urbain**  
   https://demdikk.sn/reseau-urbain-dakar/  
   Les fiches officielles DDD listent notamment Petersen sur la ligne 13 et Colobane sur les lignes 18 et 20.

## Limites conservées

- Aucun transfert n’est activé à Guédiawaye, Grand Médine, Lat Dior, UCAD ou Colobane dans cette modification : les documents repèrent ces lieux, mais les preuves disponibles ne suffisent pas ici à fixer un cheminement piéton précis et une paire de points d’arrêt équivalente au pôle Petersen.
- Les rapprochements issus de coordonnées approximatives ne sont toujours pas utilisés.
- Les deux correspondances TER ↔ BRT préexistantes restent strictement inchangées.
- Aucun tracé, arrêt, horaire ou fréquence TER/BRT n’est modifié.
- Aucune donnée GTFS, Supabase ou position de véhicule temps réel n’est ajoutée.
