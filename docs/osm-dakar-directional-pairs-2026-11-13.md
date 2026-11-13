# Audit des relations OSM directionnelles à Dakar — 13 novembre 2026

## Source et périmètre

Extraction automatisée en lecture seule par Overpass dans la zone métropolitaine de Dakar. Attribution : © OpenStreetMap contributors, ODbL.

- 6 610 éléments OSM extraits
- 25 relations de lignes de bus
- 2 relations maîtresses
- 23 relations classées candidates Dakar
- 18 relations comportant des membres d'arrêt/quai ordonnés
- 522 membres d'arrêt/quai au total
- 2 relations hors périmètre identifiées comme conflits de périmètre (APSRTC, trajets Vijayawada–Hyderabad) et exclues des candidats Dakar

Les séquences de membres sont conservées séparément par relation et dans leur ordre OSM. La présence d'une relation OSM ne prouve ni le service actuel de l'opérateur, ni l'exhaustivité des arrêts, ni les horaires ou fréquences.

## Paires directionnelles DDD particulièrement utiles

### Ligne 9

| Relation OSM | Sens déclaré par les terminus | Arrêts/quais |
|---|---|---:|
| 6996431 | Palais 1 → Liberté 6 | 32 |
| 7487218 | Liberté 6 → Palais 1 | 29 |

Les terminus sont inversés et le numéro de ligne est identique. Ce sont deux relations distinctes à conserver comme candidats aller/retour, pas une seule séquence à fusionner.

### Ligne 10

| Relation OSM | Sens déclaré par les terminus | Arrêts/quais |
|---|---|---:|
| 6990845 | Palais 1 → Liberté 5 | 30 |
| 7488283 | Liberté 5 → Palais 1 | 25 |

Même constat : terminus inversés, relations séparées et ordres d'arrêts distincts.

### Autres regroupements intéressants

- Ligne 7 : relations 6990669 (Palais → Ouakam) et 7500475 (Ouakam → Palais), reliées à la même relation maîtresse 7500597. 31 et 34 membres d'arrêt/quai.
- Ligne 23 : relation maîtresse 7499003 qui référence notamment les relations 7495279 (Palais 1 → Parcelles-Assainies, 51 membres) et 7108131 (Parcelles-Assainies → Palais 1, 47 membres). La relation 7108131 porte aussi la référence composée `L23;L5` et un rôle de terminus spécifique ; ne pas l'utiliser comme preuve exclusive de la ligne 23 sans rapprochement supplémentaire.
- Ligne 4 : relations 6990830 et 7203970 déclarent des terminus inversés (34 et 32 membres), mais elles ne sont pas encore liées à une relation maîtresse commune dans cette extraction.

## Limites et règles de sécurité

- Les membres d'arrêt/quai anonymes restent dans la séquence avec leur identifiant OSM ; aucun nom n'est inventé.
- Les relations aller et retour ne sont jamais fusionnées.
- Aucun arrêt n'est déplacé d'une relation à une autre.
- Aucune fréquence, aucun horaire et aucun temps de passage n'est déduit d'OSM.
- Les paires sont des candidats géographiques à rapprocher des séquences officielles DDD. Elles ne remplacent pas les sources opérateur.
- Les lignes 218 et 219 ne sont pas identifiées comme relations OSM directionnelles dédiées dans cette extraction ; l'écart ArcGIS 218/219 demeure donc à confirmer par d'autres éléments, sans réaffectation automatique.

## Automatisation ajoutée

Le script `scripts/analyze_dakar_osm_directional_pairs.mjs` génère `artifacts/osm/dakar-osm-directional-pairs.json`. Il compare les références, les terminus inversés et les liens explicites de relations maîtresses tout en préservant intégralement les membres ordonnés de chaque relation. Le workflow OSM lance ce contrôle après l'extraction et conserve les deux artefacts.

