# Résultats du rapprochement ArcGIS / séquences DDD publiées

Date de l'extraction : 13 novembre 2026, 19:00 UTC environ.
Source : FeatureServer public « Dem_dikk_mise_a_jour », couche 0 « Arrets_Ligne_Dakar_Dem_Dikk ».
Référence : artefact GitHub Actions `ddd-updated-arcgis-sequence-audit`, workflow 43488044639.

## Résultat global

- 6 lignes examinées : 217, 218, 219, 227, 228 et 232.
- 168 entités ArcGIS, toutes nommées et géolocalisées.
- 7 correspondances nominales ordonnées détectées par LCS.
- Le classement des entités dans la réponse ArcGIS est un ordre technique de réponse, pas un ordre opérationnel de circulation.

## Détail par ligne

| Ligne | Entités ArcGIS | Arrêts séquence publiée | Correspondances LCS | Lecture |
|---|---:|---:|---:|---|
| 217 | 30 | 15 | 0 | Aucun nom commun suffisamment établi par cette méthode. |
| 218 | 103 | 15 | 5 | Correspondances nominales VDN, Ancienne Piste, Ouakam, Marché Ouakam et terminus Ouakam. Les 103 entités et les répétitions sont conservées séparément. |
| 219 | 0 | 19 | 0 | Aucune entité ArcGIS attribuée à la valeur source ligne_219 dans cette couche. Ne pas fusionner avec 218. |
| 227 | 8 | 16 | 1 | Correspondance « Terminus Keur Massar » uniquement. |
| 228 | 4 | 4 | 0 | Aucun nom commun confirmé par la méthode. |
| 232 | 23 | 15 | 1 | Correspondance « Yarakh » uniquement. |

## Décisions de traitement

1. Conserver strictement les identifiants GlobalID/ObjectID et les valeurs de ligne de la source.
2. Ne pas attribuer les 103 entités de la ligne 218 à la ligne 219 : l'absence d'entités 219 dans cette couche reste un constat distinct.
3. Ne pas considérer les 7 correspondances comme une validation de l'identité physique des arrêts ou du sens de circulation.
4. Ne pas utiliser l'ordre de réponse ArcGIS pour construire une séquence aller/retour.
5. Pour poursuivre, croiser les points géographiques et tracés ArcGIS avec les relations OSM distinctes par direction et les séquences publiées officielles. Les arrêts non appariés restent à examiner, pas à inventer.

## Périmètre et sécurité

Audit en lecture seule. Aucun horaire, fréquence, sens, arrêt ou tracé passager n'a été modifié. Aucun appel Supabase, aucune écriture de production, aucun déploiement. TER et BRT ne sont pas concernés. GTFS reste hors périmètre et ne bloque pas la suite.
