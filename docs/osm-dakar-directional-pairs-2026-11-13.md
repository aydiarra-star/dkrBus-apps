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

## Rapprochement avec les séquences publiées DDD — lignes 9 et 10

Contrôle croisé effectué avec `src/data/dddOfficialUrbanPublishedRoutes.ts` sur le même commit :

| Ligne | Séquence DDD publiée | Relations OSM candidates | Point à résoudre |
|---|---|---|---|
| 9 | Liberté 6 → Palais 2, 24 repères | 6996431 Palais 1 → Liberté 6 (32 membres) ; 7487218 Liberté 6 → Palais 1 (29 membres) | Le terminus OSM « Palais 1 » ne correspond pas littéralement au « Palais 2 » publié par DDD ; les nombres de membres ne sont pas égaux aux repères publiés. |
| 10 | Liberté 5 (Dieuppeul) → Palais 2, 29 repères | 6990845 Palais 1 → Liberté 5 (30 membres) ; 7488283 Liberté 5 → Palais 1 (25 membres) | Même divergence Palais 1 / Palais 2 ; la correspondance exacte des repères et l'ordre complet restent à vérifier. |

### Conclusion opérationnelle

- Les deux sources concordent sur le numéro de ligne et sur le terminus Liberté de chaque ligne.
- Les relations OSM apportent deux sens géographiques distincts ; elles ne prouvent pas à elles seules que chaque membre correspond à un arrêt de la séquence DDD publiée.
- Le terminus Palais 1 / Palais 2 est une divergence explicite à résoudre, pas une différence à normaliser automatiquement.
- Les 24 et 29 repères publiés DDD restent inchangés. Les 32/29 et 30/25 membres OSM restent conservés séparément par relation.
- Aucun appariement automatique, aucune suppression d'arrêt, aucune correction de terminus et aucune publication passager n'est déclenché par ce rapprochement.

Cette étape transforme les paires OSM 9/10 en candidats directement comparables aux séquences officielles DDD, tout en isolant précisément les écarts qui empêchent une validation sans ambiguïté.

### Ligne 7 — rapprochement complémentaire

La séquence DDD publiée pour la ligne 7 est Ouakam → Palais 2 et contient 21 repères. Les deux relations OSM reliées à la même relation maîtresse 7500597 sont 6990669 (Palais → Ouakam, 31 membres) et 7500475 (Ouakam → Palais, 34 membres).

Le terminus OSM est libellé « Palais » sans précision 1/2 dans les éléments résumés ici ; il ne peut donc pas être assimilé à « Palais 2 » sans contrôle des arrêts terminaux et des identifiants OSM. La paire est mieux étayée structurellement grâce à la relation maîtresse commune, mais la séquence et les arrêts ne sont pas validés pour autant.

Comme pour les lignes 9 et 10, les 21 repères DDD et les deux séquences OSM restent intacts et indépendants. La ligne 7 demeure un rapprochement candidat, pas une validation de parcours.
