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
| 6 | Guédiawaye → Palais 1 | Cambérène 2 → Palais 2 | Cambérène → Palais 1 | Conflit de terminus ; aucune réécriture |
| 7 | Ouakam → Palais 2 | Ouakam → Palais 2 | Ouakam → Palais 1 | Deux pages DDD concordent ; divergence CETUD conservée |
| 13 | Liberté 5 → Palais 2 | Liberté 5 → Palais 2 | Dieuppeul → Palais 1 | Conserver les trois libellés selon leur source |
| 15 | Ligne 15 : Rufisque → Palais 1 | Lignes 15A et 15B : Rufisque → Palais 1 | — | Ne pas fusionner 15, 15A et 15B |
| 233 | En-tête Palais 1 ; séquence détaillée jusqu’à Aéroport LSS | Baux Maraichers → Palais 1 | — | Conflit en-tête / dernier arrêt ; séquence intacte |
| 501 | Palais 2 → Leclerc | Gare de Dakar → Palais 2 | — | Corridors incompatibles sous le code 501 |
| 502 | Boucle Gare Colobane → Gare Colobane | 502A Colobane → UCAD ; 502B Colobane → Abass Ndao | — | Garder la boucle 502 et les deux sous-codes distincts |
| 503 | Boucle Gare de Colobane → Gare de Colobane | 503A Colobane → Môle 8 ; 503B Colobane → Hydrocarbure | — | Garder la boucle 503 et les deux sous-codes distincts |
| TAF TAF / TO1 | TO1 : Ouakam → Palais 2 ; TAF TAF : Ouakam → AIBD | TAF TAF : AIBD / Sphère ministérielle | — | Deux services distincts ; aucune séquence empruntée |

## Conséquences pour le chantier

1. Les séquences publiées par l'utilisateur et celles déjà transcrites restent les références de travail. Ce tableau ne les bloque pas et ne les remplace pas.
2. Les lignes 6, 7 et 13 gardent les conflits de terminus visibles dans le registre d'audit ; pas de validation automatique d'un sens.
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
