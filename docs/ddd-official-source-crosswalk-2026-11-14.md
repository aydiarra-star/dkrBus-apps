# DDD — rapprochement actualisé des pages officielles et nomenclatures

Date de contrôle : 14 novembre 2026  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Portée : audit documentaire en lecture seule ; aucun changement du catalogue passager.

## Sources relues

- Page « Réseau urbain de Dakar » : https://demdikk.sn/reseau-urbain-dakar/
- Page « Info voyageurs » : https://demdikk.sn/info-voyageurs/
- Guide officiel de la mobilité JOJ Dakar 2026 (CETUD, publié sur Vie-publique.sn) : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf

Le contrôle est transcrit dans `src/data/dddOfficialSourceCrosswalk.ts` et protégé par `src/data/dddOfficialSourceCrosswalk.test.ts`. Le registre conserve la déclaration de chaque source séparément. Il ne choisit pas arbitrairement une version.

## Divergences et décisions

| Ligne / service | Page réseau DDD | Info voyageurs DDD | Guide CETUD JOJ | Décision de travail |
|---|---|---|---|---|
| 4 | Liberté 5 (Dieuppeul) → Leclerc | Liberté 5 → Leclerc | Dieuppeul → Leclerc | Corridor cohérent ; variante de libellé du terminus à confirmer |
| 6 | Guédiawaye → Palais 1 | Cambérène 2 → Palais 2 | Cambérène → Palais 1 | Conflit de terminus ; aucune réécriture |
| 7 | Ouakam → Palais 2 | Ouakam → Palais 2 | Ouakam → Palais 1 | Deux pages DDD concordent ; divergence CETUD conservée |
| 9 | Liberté 6 → Palais 2 | Liberté 6 → Palais 2 | Liberté 6 → Palais 1 | Conserver les deux terminus publiés ; contexte JOJ à distinguer |
| 10 | Liberté 5 (Dieuppeul) → Palais 2 | Liberté 5 → Palais 2 | Dieuppeul → Palais 1 | Conserver les deux terminus publiés ; contexte JOJ à distinguer |
| 13 | Liberté 5 → Palais 2 | Liberté 5 → Palais 2 | Dieuppeul → Palais 1 | Conserver les trois libellés selon leur source |
| 15 | Ligne 15 : Rufisque → Palais 1 | Lignes 15A et 15B : Rufisque → Palais 1 | — | Ne pas fusionner 15, 15A et 15B |
| 23 | Parcelles Assainies → Palais 1 ; dernier repère « Terminus Palais 2 » | — | ArcGIS 2024 : 54 points, dernier « Terminus Palais de JUSTICE » ; géométrie jusqu’au Palais de Justice | Conflit d’extrémité ; conserver les trois libellés sans les assimiler |
| 121 | Scat Urbam → Leclerc | Scat Urbam → Leclerc | HLM Grand Yoff → Leclerc | ArcGIS 2024 corrobore Scat Urban → Leclerc ; le guide JOJ reste une déclaration distincte |
| 233 | En-tête Palais 1 ; séquence détaillée jusqu’à Aéroport LSS | Baux Maraichers → Palais 1 | — | Conflit en-tête / dernier arrêt ; séquence intacte |
| 501 | Palais 2 → Leclerc | Gare de Dakar → Palais 2 | — | Corridors incompatibles sous le code 501 |
| 502 | Boucle Gare Colobane → Gare Colobane | 502A Colobane → UCAD ; 502B Colobane → Abass Ndao | — | Garder la boucle 502 et les deux sous-codes distincts |
| 503 | Boucle Gare de Colobane → Gare de Colobane | 503A Colobane → Môle 8 ; 503B Colobane → Hydrocarbure | — | Garder la boucle 503 et les deux sous-codes distincts |
| TAF TAF / TO1 | TO1 : Ouakam → Palais 2 ; TAF TAF : Ouakam → AIBD | TAF TAF : AIBD / Sphère ministérielle | — | Deux services distincts ; aucune séquence empruntée |

## Contrôle des lignes prioritaires 4, 7, 9, 10 et 121

La page DDD « Réseau urbain » fournit des listes détaillées pour les lignes 4, 7, 9 et 10. La page « Info voyageurs » confirme les mêmes corridors que la page réseau pour ces lignes. Le guide CETUD JOJ présente un réseau opérationnel lié aux sites des Jeux et affiche des terminus Palais 1 pour 7, 9 et 10, alors que les pages DDD consultées indiquent Palais 2. Pour la ligne 121, les deux pages DDD indiquent Scat Urbam → Leclerc tandis que le guide JOJ indique HLM Grand Yoff → Leclerc.

Le guide JOJ est une publication de contexte opérationnel temporaire (31 octobre–13 novembre 2026) ; sa nomenclature ne doit pas être fusionnée avec les pages permanentes DDD sans confirmation opérateur. Les deux sources sont conservées et aucune séquence n'est remplacée.

La page DDD détaille notamment les séquences 4 (27 repères), 7 (21), 9 (24) et 10 (29) dans l'ordre publié. Le présent rapprochement confirme leur provenance documentaire et leurs corridors ; il ne valide pas les deux sens commerciaux ni l'ordre des arrêts sur le terrain.

## Correction de provenance — ligne 6

La séquence Cambérène 2 → Palais 2 déjà conservée dans le registre historique `src/data/dddPublishedRoutes.ts` correspond à la déclaration de la page DDD « Info voyageurs », et non à la page « Réseau urbain de Dakar ». Son champ `sourceUrl` et son libellé de source ont donc été corrigés pour pointer vers `https://demdikk.sn/info-voyageurs/`. La séquence et ses arrêts n'ont pas été modifiés. Un test protège désormais cette provenance. La séquence distincte Guédiawaye → Palais 1 de la page réseau reste conservée dans le registre officiel détaillé.

## Conséquences pour le chantier

1. Les séquences publiées par l'utilisateur et celles déjà transcrites restent les références de travail. Ce tableau ne les bloque pas et ne les remplace pas.
2. Les lignes 6, 7, 9, 10, 13 et 121 gardent les conflits de terminus visibles dans le registre d'audit ; pas de validation automatique d'un sens.
3. Les identifiants 15 / 15A / 15B, 502 / 502A / 502B et 503 / 503A / 503B ne sont pas fusionnés.
4. La boucle 502 et la boucle 503 ne sont pas découpées artificiellement en aller et retour.
5. Les deux services TAF TAF et TO1 restent séparés.
6. La ligne 233 garde sa liste publiée même si son dernier repère ne correspond pas à l'en-tête.
7. Aucun arrêt, identifiant GPS, horaire, fréquence ou retour n'est créé à partir de ces divergences.

## Statut technique et garde-fous

- Registre de rapprochement documentaire ajouté au code et tests dédiés ajoutés.
- Aucun changement du catalogue passager ou des séquences de référence.
- Aucune inversion automatique et aucune direction retour fabriquée.
- Aucune écriture Supabase, aucun déploiement, aucune fusion.
- TER et BRT restent strictement inchangés.
- GTFS n'est pas requis pour poursuivre.


## Complément ArcGIS 2024 — lignes 23 et 121

L'audit détaillé du service `Dem_dikk_mise_a_jour` confirme des données cartographiques séparées à conserver :

- **Ligne 23 :** 54 points `LIgne_23`, de « Terminus Parcelles Assainies » à « Terminus Palais de JUSTICE », et une géométrie explicitement nommée Ligne 23. Les attributs du tracé vont jusqu'au Palais de Justice. La fiche voyageurs contient 40 repères, avec un en-tête Palais 1 mais une dernière occurrence « Terminus Palais 2 ». Les quatre noms communs sont ACAPES, UCAD, Avenue Cheikh Anta Diop et Hôpital Principal ; seuls trois apparaissent dans la sous-séquence de réponse ArcGIS. Cela ne permet pas de choisir le terminus ni de fusionner les listes.
- **Ligne 121 :** 31 points `LIgne_121` et une géométrie nommée Ligne 121. Le tracé ArcGIS commence par « Terminus Scat Urban – Mairie grand Yoff » et finit à Leclerc. Cinq correspondances ordonnées de noms sont retrouvées. Le groupe contient quatre occurrences « Arret Scat Urbam » ; elles restent distinctes. Cela corrobore le corridor DDD Scat Urbam → Leclerc, mais ne valide pas l'ordre voyageurs.

Détails et limites : `docs/ddd-line-23-121-arcgis-2024-audit-2026-11-14.md`.

Le service ArcGIS indique une édition source au 24 septembre 2024. Il apporte une corroboration cartographique historique, pas une validation de l'exploitation actuelle, des deux sens, de l'exhaustivité ou des horaires.
