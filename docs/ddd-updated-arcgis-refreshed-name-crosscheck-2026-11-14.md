# DDD — contrôle actualisé des noms ArcGIS face aux séquences publiées

Date de l'extraction : 14 novembre 2026, 05:09 UTC  
Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Workflow : `43560116455` — **Audit updated DDD ArcGIS against published sequences**  
Artefact : `14100043255` — `ddd-updated-arcgis-sequence-audit`  
Source publiée : `src/data/dddSuburbanPublishedRoutesB.ts`

## Résultat

Le contrôle actualisé compare les noms des points du service ArcGIS DDD édité en 2024 aux repères des séquences publiées. Il couvre 6 lignes, 168 enregistrements ArcGIS nommés et 7 correspondances ordonnées strictes au sens de l'algorithme de comparaison.

| Ligne | Points ArcGIS | Repères publiés | Noms distincts communs | Correspondances ordonnées |
|---|---:|---:|---:|---:|
| 217 | 30 | 15 | 0 | 0 |
| 218 | 103 | 15 | 4 | 5 |
| 219 | 0 | 19 | 0 | 0 |
| 227 | 8 | 16 | 1 | 1 |
| 228 | 4 | 4 | 0 | 0 |
| 232 | 23 | 15 | 1 | 1 |
| **Total** | **168** | — | — | **7** |

Les cinq correspondances de la ligne 218 sont : VDN, Ancienne Piste, Ouakam, Marché Ouakam et Terminus Ouakam. La ligne 227 partage « Terminus Keur Massar ». La ligne 232 partage « Yarakh ».

## Interprétation prudente

- **218 :** les cinq correspondances renforcent le rapprochement de noms sur le secteur VDN–Ouakam. Elles ne valident pas les 103 enregistrements comme une seule séquence : l'audit spatial distingue déjà deux blocs géographiques, dont un candidat 219.
- **217 :** aucune correspondance stricte parmi les 15 repères publiés. Ce résultat n'invalide pas le groupe spatialement proche de la géométrie 217 ; il confirme que l'identification par les noms reste non résolue.
- **219 :** aucun point n'est explicitement codé 219 dans ce service, malgré les 19 repères publiés et la géométrie de corridor identifiée. Les 33 points codés 218 mais proches de la géométrie 219 restent des candidats séparés.
- **227 et 232 :** une correspondance chacune est insuffisante pour certifier l'exhaustivité ou l'ordre des arrêts.
- **228 :** aucune correspondance stricte ; les quatre points et le tracé anonyme restent à rapprocher sans réécriture de leurs attributs.

## Méthode et limites

Normalisation des accents, de la casse et de la ponctuation, retrait des préfixes génériques d'arrêt, puis comparaison par sous-séquence commune la plus longue avec appariement un-à-un. L'ordre de réponse ArcGIS sert uniquement au diagnostic algorithmique : il n'est pas considéré comme un ordre voyageurs validé.

Les noms répétés sont conservés comme occurrences distinctes. Aucun point n'est supprimé, fusionné ou réattribué. Aucun retour n'est fabriqué par inversion. Aucun horaire, intervalle ou fréquence n'est déduit.

## Décision

Ce contrôle actualise la preuve documentaire et les priorités de revue, mais **ne justifie aucun import automatique de séquence**. Les lignes 217, 218, 219, 227, 228 et 232 restent soumises à validation indépendante des directions et des arrêts. Aucun changement de données voyageurs, aucune écriture Supabase, aucun déploiement et aucune modification TER/BRT.

