# DDD — couverture des lignes sans groupe d'arrêts ArcGIS de même code

Date : 14 novembre 2026

## Résultat opérationnel

Les 17 lignes signalées par le rapprochement ArcGIS du 14 novembre disposent déjà d'une séquence textuelle publiée dans le référentiel DDD du projet. L'absence d'un groupe de points ArcGIS portant le même code ne bloque donc pas la consolidation des séquences et ne signifie pas que la ligne est dépourvue d'arrêts.

| Ligne | Référentiel de séquence retenu |
|---|---|
| 20, 208, 213, 219, 220, 221, 233, 234, 311, 327, 319 | Séquences DDD déjà transcrites dans `dddPublishedRoutes.ts` |
| TO1 | Séquence DDD distincte `TO1` dans `dddPublishedRoutes.ts` |
| 15, 501, 502, 503, TAF_TAF | Séquences officielles périurbaines dans `dddOfficialPublishedRoutes.ts` |

## Garde-fous

- Le registre confirme la présence d'une séquence textuelle, pas la validation terrain ni la géolocalisation.
- Aucun arrêt ArcGIS/OSM n'est ajouté au catalogue passager.
- Aucun retour n'est fabriqué par inversion.
- TO1 et TAF_TAF restent deux identifiants distincts. L'entrée source combinée `TAF_TAF_TO1` n'est pas utilisée pour fusionner les deux lignes.
- La ligne 15 reste distincte de 15A et 15B.
- Les éventuels conflits déjà signalés sur 233 et les autres lignes restent visibles ; ce registre ne les efface pas.
- TER/BRT, Supabase et les données de production restent inchangés.

## Décision

On peut poursuivre le travail sur les séquences et leurs correspondances à partir des listes déjà transcrites, sans attendre qu'ArcGIS fournisse un groupe de points pour chaque code. Les coordonnées et les directions distinctes restent des chantiers séparés.
