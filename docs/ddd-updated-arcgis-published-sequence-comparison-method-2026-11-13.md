# Rapprochement automatisé des séquences publiées avec la nouvelle couche d'arrêts ArcGIS

Date : 13 novembre 2026.
Branche : feat/admin-stop-sequence-audit-phase-a.
PR : #123.

## Objectif

Une nouvelle passe reproductible compare les noms de la couche d'arrêts du service ArcGIS DDD mis à jour aux séquences DDD publiées dans le dépôt pour les lignes 217, 218, 219, 227, 228 et 232.

Le contrôle produit un appariement nominal un-à-un par plus longue sous-séquence commune (LCS), après normalisation des accents, de la casse, de la ponctuation et des préfixes génériques Arrêt/Terminus/Station/Gare.

## Fichiers ajoutés

- scripts/compare_ddd_updated_arcgis_published_sequences.mjs
- .github/workflows/audit-ddd-updated-arcgis-sequences.yml

Le workflow relance l'extraction complète du FeatureServer, puis le rapprochement, valide les deux JSON et conserve un artefact GitHub Actions de 14 jours.

## Interprétation stricte

La couche ArcGIS ne fournit pas de séquence opérationnelle certifiée. Le script conserve donc l'ordre de réponse des entités uniquement comme ordre technique reproductible ; il ne le traite jamais comme un sens de circulation. Les scores LCS sont des diagnostics de noms, pas une validation d'arrêt ni de direction.

Les occurrences répétées restent distinctes et les GlobalID/OBJECTID sont conservés. Les deux blocs de la ligne 13 restent séparés par leur valeur source. Les enregistrements de la ligne 218 ne sont ni fusionnés, ni supprimés, ni réattribués à la ligne 219.

Aucun retour n'est créé par inversion de la séquence publiée. Les lignes qui ne sont pas présentes dans la source officielle locale restent signalées sans inventer de liste.

## Limites et suite

Le premier lot cible les lignes 217/218/219/227/228/232 car il permet d'examiner les correspondances potentielles autour des deux blocs 218/219, les tracés anonymes 228 et les petits inventaires 227/228. Une seconde passe devra couvrir les lignes urbaines et les autres lignes de banlieue en important leurs séquences publiées dédiées.

Le contrôle doit être relu avec les audits spatiaux précédents et, lorsqu'elles existent, les relations OSM distinctes par direction. Un résultat nominal élevé ne remplace pas la confirmation de l'opérateur.

## Sécurité

Lecture seule. Permissions GitHub contents: read. Aucun secret requis. Aucun appel Supabase. Aucun changement de données de production, de catalogue passager, de TER/BRT, d'horaires ou de fréquences. GTFS reste hors périmètre.
