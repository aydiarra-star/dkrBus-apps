# Consolidation OSM–ArcGIS DDD — 13 novembre 2026

## État des collectes

- Export OSM : 2026-11-13T13:33:56.721Z.
- Export ArcGIS DDD : 2026-11-13T13:29:26.350Z.
- OSM : 6 610 éléments, 25 relations de lignes, 2 relations route-master, 23 candidates dans le périmètre Dakar, 2 conflits de périmètre, 18 relations avec arrêts ordonnés et 522 occurrences d'arrêts ordonnés.
- ArcGIS : 24/24 couches de lignes et 12/12 couches d'arrêts récupérées, 25 entités de lignes, 455 entités d'arrêts, aucune erreur.
- Le croisement reproductible a produit 374 occurrences OSM comparables sur 14 relations non vides, pour les lignes disposant d'une couche d'arrêts ArcGIS correspondante.

## Résultat du rapprochement spatial

La distance est celle entre chaque membre OSM et le point ArcGIS le plus proche de la couche de la ligne. Ce calcul est un indice de proximité, pas une validation d'arrêt : plusieurs membres OSM peuvent désigner le même OBJECTID ArcGIS et les noms peuvent différer.

| Ligne | Relation OSM | Membres ordonnés | ≤25 m | ≤50 m cumulés | ≤100 m cumulés | Médiane |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 6951328 | 38 | 34 | 35 | 36 | 1,7 m |
| 7 | 6990669 | 31 | 6 | 10 | 17 | 95,5 m |
| 7 | 7500475 | 34 | 28 | 30 | 31 | 2,2 m |
| 4 | 6990830 | 34 | 2 | 6 | 14 | 112,8 m |
| 4 | 7203970 | 32 | 24 | 24 | 24 | 2,2 m |
| 9 | 6996431 | 32 | 7 | 15 | 23 | 55,6 m |
| 9 | 7487218 | 29 | 27 | 27 | 28 | 1,7 m |
| 10 | 6990845 | 30 | 5 | 10 | 21 | 74,7 m |
| 10 | 7488283 | 25 | 18 | 20 | 22 | 2,1 m |
| 121 | 2792903 | 3 | 3 | 3 | 3 | 1,3 m |
| 121 | 6990794 | 27 | 24 | 24 | 26 | 1,6 m |
| 121 | 6999013 | 7 | 2 | 4 | 5 | 45,8 m |
| 23 | 7495279 | 51 | 12 | 22 | 32 | 67,3 m |
| 6* | 7499433 | 1 | 0 | 0 | 0 | 211,0 m |

Les colonnes ≤50 m et ≤100 m sont cumulatives. Les catégories exclusives du CSV sont : 192 occurrences ≤25 m, 38 entre 25 et 50 m, 52 entre 50 et 100 m, 92 au-delà de 100 m.

## Priorités de revue

### Priorité haute — géométrie très cohérente à confronter aux noms et à l'ordre officiel
- Ligne 1, relation 6951328.
- Ligne 7, relation 7500475.
- Ligne 4, relation 7203970.
- Ligne 9, relation 7487218.
- Ligne 10, relation 7488283.
- Ligne 121, relation 6990794.

Ces groupes ont une médiane proche de 2 m et une majorité de points à moins de 25 m. Ils restent des candidates tant que l'ordre, les noms et les terminus ne sont pas confirmés conjointement.

### Priorité moyenne — géométrie partielle ou dispersée
- Ligne 7, relation 6990669.
- Ligne 9, relation 6996431.
- Ligne 10, relation 6990845.
- Ligne 121, relation 6999013.
- Ligne 23, relation 7495279.

Ne pas fusionner ces séquences avec les candidates de priorité haute : les directions et relations doivent rester distinctes.

### À isoler — conflits et données insuffisantes
- Relation 7499433 : référence 6 mais nom de route indiquant la ligne 7, un seul arrêt ordonné et distance de 211 m. Conflit à résoudre, aucune attribution automatique.
- Relation 7108131 : références multiples L23;L5, ne pas l'affecter automatiquement à une ligne.
- Relations 7495137 (ligne 8) et 7499475 (ligne 18) : aucune séquence d'arrêts ordonnés exploitable.
- Les relations sans couche ArcGIS de ligne correspondante ne sont pas incluses dans les 374 occurrences du rapprochement.

## Contrôle des sources officielles et des directions

Les pages officielles DDD et AFTU restent les références pour les noms et l'ordre publiés. Les séquences officielles DDD extraites sont conservées comme séquences publiées, sans fabriquer un retour à partir de l'aller. Les seules variantes de retour explicitement relevées dans les pages AFTU sont conservées comme telles ; aucune généralisation aux autres lignes.

Le rapprochement des noms OSM avec les séquences DDD publiées doit être lu avec le rapport complémentaire `ddd-osm-official-sequence-name-crosscheck-2026-11-13.md`. Un rapprochement de noms ou une proximité spatiale ne suffit pas seul à confirmer une desserte.

## Politique de validation

- Statut de toutes les correspondances spatiales : `UNVERIFIED_CANDIDATE`.
- Pas de création automatique d'arrêts, de directions, de fréquences ou d'horaires.
- Pas de renversement automatique des séquences.
- OSM reste une source communautaire de candidats ; ArcGIS apporte une géométrie de référence publiée, mais pas nécessairement l'ordre d'exploitation.
- Aucune donnée TER/BRT n'est modifiée.
- Aucune écriture Supabase, aucun déploiement et aucune fusion de PR dans cette étape.

## Contrôles automatisés

Sur le commit de tête du PR au moment du contrôle (\`0012547bb206c5f489c6d529c10d1570b9b573ab\`), les trois jobs du workflow CI ont réussi : build/tests/audit, contrôle de la fonction privée et vérification des migrations dans une base isolée. Les collectes OSM, ArcGIS et AFTU associées ont également terminé avec succès.
