# Audit ciblé des relations OSM DDD 121 et des références contradictoires — 13 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Extraction : Overpass du 13 novembre 2026, 17:18 UTC  
Attribution : © OpenStreetMap contributors, ODbL

## 1. Ligne 121 : trois relations, pas deux directions validées

L'extraction contient trois relations OSM candidates portant la référence 121 :

| Relation | Nom OSM | Départ déclaré | Arrivée déclarée | Membres ordonnés |
|---:|---|---|---|---:|
| 2792903 | Ligne 121 | non renseigné | non renseigné | 3, tous anonymes |
| 6990794 | 121 Hlm Grand Yoff - Leclerc | Terminus Hlm Grand Yoff | Terminus Leclerc | 27 |
| 6999013 | 121 Leclerc - HLM Grand Medine | Terminus Leclerc | HLM Grand Medine | 7 |

### Recoupement géographique

La relation 2792903 partage exactement ses trois positions avec la relation 6990794 :
- 14.7351958, -17.4615452 ;
- 14.7382712, -17.4590123 ;
- 14.7402156, -17.4573675.

Les positions sont identiques dans les deux relations, mais la relation 2792903 ne possède ni nom d'arrêt, ni terminus, ni direction. Elle semble être un fragment géographique lié au corridor, pas une direction supplémentaire démontrée.

Entre 6990794 et 6999013, deux positions sont très proches :
- une paire à environ 7,33 m ;
- une paire à environ 15,48 m.

Cela confirme une proximité locale autour du secteur central, mais pas une inversion complète des deux itinéraires. Les terminus ne sont pas identiques : HLM Grand Yoff d'un côté, HLM Grand Médine de l'autre. La relation 6999013 ne contient que sept membres, tandis que 6990794 en contient 27.

### Décision ligne 121

- Conserver les trois relations et leurs membres séparément.
- Ne pas présenter 6990794 et 6999013 comme un aller/retour complet.
- Ne pas compléter la relation courte par inversion ou extrapolation.
- Utiliser la relation 2792903 comme fragment de corroboration spatiale uniquement.
- Priorité suivante : rapprocher les positions des couches DDD ArcGIS de la ligne 121 et de la séquence publiée, en contrôlant le sens et les terminus.

## 2. Conflit de référence : relation 7499433

Une relation supplémentaire présente une incohérence explicite :
- référence OSM : `6` ;
- nom : `7 Palais 1 → Parcelles-Assainies` ;
- départ : `Palais 1` ;
- arrivée : `Parcelles-Assainies` ;
- un seul membre ordonné, anonyme.

Le nom annonce la ligne 7, mais la référence indique 6. Le membre unique ne permet pas de reconstruire un trajet.

Décision : ne pas l'affecter automatiquement à DDD 6 ou DDD 7. La conserver dans les candidats non appariés avec conflit de métadonnées.

## 3. Amélioration de l'analyseur OSM

Le script `scripts/analyze_dakar_osm_directional_pairs.mjs` conserve désormais aussi les relations candidates qui ne peuvent pas être appariées :
- relations sans terminus complets ;
- relations sans relation maître commune ni terminus inversés ;
- références multiples ;
- divergences entre la référence et le numéro au début du nom.

Le rapport JSON de l'analyse inclut maintenant `unpairedRelations`, le nombre de relations non appariées et le nombre de conflits référence/nom. Cela évite que les candidats incomplets ou contradictoires disparaissent du diagnostic simplement parce qu'ils ne forment pas une paire.

## 4. Garde-fous

OSM reste une source communautaire de comparaison, pas une preuve d'horaire ou de desserte actuelle. Aucun arrêt n'est supprimé, fusionné ou renommé. Aucun sens retour n'est créé. Aucune fréquence n'est déduite. Aucun GTFS n'est utilisé. Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT ou du catalogue passager.
