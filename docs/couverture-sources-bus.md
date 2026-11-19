# Couverture locale des sources de bus

Une ligne de tableau = un couple **provenance + code**. Ni une ligne en circulation, ni une course. AFTU et TATA peuvent décrire le même minibus ; les pièces de comparaison restent distinctes.

Les colonnes donnent les nombres d’occurrences par liste, sans additionner les transcriptions. Un même nombre peut correspondre à plusieurs variantes : consulter le JSON de `npm run audit:bus -- --output inventaire.json` pour les noms, l’ordre, les terminus et la provenance. « Ordre publié » ne veut pas dire « aller ». Une description de rues n’est pas une liste de quais. Une fenêtre ou un intervalle ne vaut pas service daté.

## DDD — 48 identifiants

| Code | Ordre publié | Aller | Retour | Autres pièces | Portions de carte |
|---|---|---|---|---|---|
| 1 | 22 | 22 | — | catalogue, ArcGIS, repères, horaires de référence, revue de sources | 2705 m vers Leclerc ; 3934 m vers Leclerc ; 911 m vers Sahm (depuis Leclerc) |
| 2 | 35 | 35 | — | catalogue, ArcGIS | — |
| 4 | 26 / 27 | 27 | — | catalogue, ArcGIS, repères, revue de sources | 787 m vers Leclerc ; 1790 m vers Liberté 5 |
| 5 | 15 | 15 | — | catalogue, ArcGIS | — |
| 6 | 24 / 25 | 24 | — | catalogue, ArcGIS, horaires de référence, revue de sources | — |
| 7 | 21 | 21 | — | catalogue, ArcGIS, revue de sources | 2334 m vers Palais (portion UCAD–Stade) ; 2422 m vers Ouakam |
| 8 | 28 | 28 | — | catalogue, ArcGIS | 2064 m vers Palais 2 |
| 9 | 24 | 24 | — | catalogue, ArcGIS, revue de sources | — |
| 10 | 29 | 29 | — | catalogue, ArcGIS, revue de sources | — |
| 11 | 16 | 16 | — | catalogue, ArcGIS | — |
| 12 | 20 | 20 | — | catalogue, ArcGIS, horaires de référence, revue de sources | 2064 m vers Palais 1 |
| 13 | 24 | 24 | — | catalogue, ArcGIS, revue de sources | — |
| 15 | 18 | — | — | repères, revue de sources | — |
| 15A | — | — | — | catalogue | — |
| 15B | — | — | — | catalogue | — |
| 16A | 19 | 19 | — | catalogue, ArcGIS, horaires de référence | — |
| 16B | 27 | 27 | — | catalogue, ArcGIS, horaires de référence, revue de sources | — |
| 18 | 41 / 42 | — | — | catalogue, circuit, ArcGIS | — |
| 20 | 42 | — | — | catalogue, circuit, ArcGIS | — |
| 23 | 40 | 40 | — | catalogue, ArcGIS, revue de sources | — |
| 121 | 25 | 25 | — | catalogue, ArcGIS, revue de sources | — |
| 208 | 7 | 7 | — | catalogue, repères | — |
| 213 | 17 | 17 | — | catalogue | — |
| 217 | 15 | 15 | — | catalogue, ArcGIS, repères, horaires de référence | — |
| 218 | 15 | 15 | — | catalogue, ArcGIS, horaires de référence | — |
| 219 | 19 | 19 | — | catalogue, ArcGIS, horaires de référence | — |
| 220 | 16 | 16 | — | catalogue, repères | 441 m vers Keur Massar (sens Guédiawaye) |
| 221 | 15 | 15 | — | catalogue | — |
| 227 | 16 | 16 | — | catalogue, ArcGIS, horaires de référence | — |
| 228 | 4 | 4 | — | catalogue, ArcGIS, repères | — |
| 232 | 15 | 15 | — | catalogue, ArcGIS | 917 m vers Front de Terre (sens aéroport LSS) |
| 233 | 15 | 15 | — | catalogue, revue de sources | — |
| 234 | 13 | 13 | — | catalogue | — |
| 311 | 5 / 6 | — | — | circuit | — |
| 319 | 17 | 17 | 26 | catalogue, horaires de référence | — |
| 327 | 11 | — | — | — | — |
| 501 | 6 / 9 | 9 | 9 | catalogue, revue de sources | — |
| 502 | 8 | — | — | revue de sources | — |
| 502A | — | — | — | catalogue | — |
| 502B | — | — | — | catalogue | — |
| 503 | 8 | — | — | circuit, revue de sources | — |
| 503A | — | — | — | catalogue | — |
| 503B | — | — | — | catalogue | — |
| 504A | — | — | — | catalogue | — |
| 504B | — | — | — | catalogue | — |
| TAF_TAF | 17 | — | — | horaires de référence, revue de sources | — |
| TAF_TAF_TO1 | 10 | — | — | — | — |
| TO1 | 10 | 10 | — | catalogue, revue de sources | — |

## AFTU — 73 identifiants

| Code | Ordre publié | Aller | Retour | Autres pièces | Portions de carte |
|---|---|---|---|---|---|
| 1 | 21 | — | — | catalogue, descriptif, repères | 903 m vers HLM Grand Médine |
| 2 | 18 | — | — | catalogue, descriptif | — |
| 3 | 15 | — | — | catalogue, descriptif, repères | 2064 m vers Petersen |
| 4 | 10 | — | — | catalogue, descriptif | 2064 m vers Petersen |
| 5 | 17 | — | — | catalogue, descriptif, horaires de référence | — |
| 24 | 14 | — | — | catalogue, descriptif | — |
| 25 | 13 | — | — | catalogue, descriptif | — |
| 26 | 8 | — | — | catalogue, descriptif | — |
| 27 | 20 | — | — | catalogue, descriptif | — |
| 28 | 16 | — | — | catalogue, descriptif | — |
| 29 | 16 | — | — | catalogue, descriptif, horaires de référence | — |
| 30 | 18 / 74 / 77 | 77 | 74 | catalogue, descriptif, horaires de référence | — |
| 31 | 15 | — | — | catalogue, descriptif | — |
| 32 | 13 | — | — | catalogue, descriptif, horaires de référence | — |
| 33 | 18 | — | — | catalogue, descriptif, horaires de référence | — |
| 34 | 10 | — | — | catalogue, descriptif | — |
| 35 | 10 | — | — | catalogue, descriptif, repères | — |
| 36 | 18 | — | — | catalogue, descriptif, horaires de référence | — |
| 37 | 35 | — | — | catalogue, descriptif | 917 m vers Front de Terre ; 917 m vers carrefour des Civilisations |
| 38 | 13 | — | — | catalogue, descriptif | — |
| 39 | 15 | — | — | catalogue, descriptif, horaires de référence | — |
| 40 | 11 | — | — | catalogue, descriptif | 938 m vers Petersen ; 941 m vers Mbao |
| 41 | 21 | — | — | catalogue, descriptif, horaires de référence | — |
| 42 | 14 | — | — | catalogue, descriptif, repères, horaires de référence | — |
| 43 | 15 | — | — | catalogue, descriptif, horaires de référence | — |
| 44 | 13 | — | — | catalogue, descriptif | — |
| 45 | 34 | — | — | catalogue, descriptif | 1179 m vers Keur Massar |
| 46 | 20 | — | — | catalogue, descriptif, horaires de référence | — |
| 47 | 15 | — | — | catalogue, descriptif, horaires de référence | — |
| 48 | 12 | — | — | catalogue, descriptif | — |
| 49 | 22 | — | — | catalogue, descriptif, horaires de référence | — |
| 50 | 20 | — | — | catalogue, descriptif | — |
| 51 | 10 | — | — | catalogue, descriptif, horaires de référence | — |
| 52 | 13 | — | — | catalogue, descriptif | — |
| 53 | 16 | — | — | catalogue, descriptif, repères, horaires de référence | — |
| 54 | 14 | — | — | catalogue, descriptif | — |
| 55 | 13 | — | — | catalogue, descriptif | — |
| 56 | 12 | — | — | catalogue, descriptif | — |
| 57 | 14 / 56 / 57 | 56 | 57 | catalogue, descriptif, horaires de référence | — |
| 58 | 12 / 39 / 43 | 39 | 43 | catalogue, descriptif, horaires de référence | — |
| 59 | 15 | — | — | catalogue, descriptif | — |
| 60 | 11 | — | — | catalogue, descriptif, repères | — |
| 61 | 10 | — | — | catalogue, descriptif, repères | — |
| 62 | 18 / 68 / 72 | 72 | 68 | catalogue, descriptif, horaires de référence | — |
| 63 | 18 | — | — | catalogue, descriptif | — |
| 64 | 2 / 61 | 61 | 61 | catalogue, descriptif, horaires de référence | — |
| 65 | 2 / 56 / 57 | 57 | 56 | catalogue, descriptif, horaires de référence | — |
| 66 | 23 / 77 | 77 | 77 | catalogue, descriptif, horaires de référence | — |
| 67 | 22 / 71 | 71 | 71 | catalogue, descriptif, repères, horaires de référence | — |
| 68 | 9 / 50 | 50 | 50 | catalogue, descriptif, horaires de référence | — |
| 69 | 15 | — | — | catalogue, descriptif | — |
| 70 | 14 / 57 / 58 | 58 | 57 | catalogue, descriptif, horaires de référence | — |
| 71 | 18 / 54 / 55 | 54 | 55 | catalogue, descriptif, horaires de référence | — |
| 72 | 22 / 78 | 78 | 78 | catalogue, descriptif, horaires de référence | — |
| 73 | 10 / 75 | 75 | 75 | catalogue, descriptif, horaires de référence | — |
| 74 | 14 | 14 | — | catalogue, descriptif, repères, grilles d’un autre parcours, retour non attesté | 1179 m vers Keur Massar ; 1117 m vers Rufisque |
| 75 | 15 / 51 / 52 | 52 | 51 | catalogue, descriptif, repères, horaires de référence | 917 m vers Front de Terre ; 917 m vers carrefour des Civilisations |
| 76 | 12 | — | — | catalogue, descriptif, horaires de référence | — |
| 77 | 14 | — | — | catalogue, descriptif | — |
| 78 | 12 | — | — | catalogue, descriptif | — |
| 79 | 15 / 92 / 93 | 92 | 93 | catalogue, descriptif, repères, horaires de référence | — |
| 80 | 17 | 17 | — | catalogue, descriptif, repères, retour non attesté | — |
| 81 | 16 / 71 | 71 | 71 | catalogue, descriptif, horaires de référence | — |
| 82 | 14 / 49 / 51 | 51 | 49 | catalogue, descriptif, horaires de référence | — |
| 83 | 14 / 90 / 93 | 93 | 90 | catalogue, descriptif | 1179 m vers ASECNA (depuis le secteur Shell) (fiche aller, rangs 18–23) ; 1117 m vers Sédima (depuis le secteur ASECNA) (fiche retour, rangs 69–74) |
| 84 | 73 | 73 | 73 | catalogue, horaires de référence, heures aux repères | 1179 m vers ASECNA (depuis le secteur Shell) (fiche retour, rangs 58–63) ; 1117 m vers Sédima (depuis le secteur ASECNA) (fiche aller, rangs 14–19) |
| 85 | — | — | — | catalogue, revue de sources | — |
| 86 | — | 68 | 64 | catalogue, repères, profil indicatif, revue de sources | — |
| 87 | — | 68 | 71 | catalogue, repères, profil indicatif, revue de sources | — |
| 88 | 78 / 81 | 78 | 81 | catalogue, revue de sources | — |
| 89 | 53 / 55 | 55 | 53 | catalogue, repères, revue de sources | — |
| 90 | 82 | 82 | 82 | catalogue, profil indicatif | 1179 m vers ASECNA (depuis le secteur Shell) (fiche retour, rangs 42–47) ; 1117 m vers Sédima (depuis le secteur ASECNA) (fiche aller, rangs 39–44) |
| 91 | 70 | 70 | 70 | catalogue, revue de sources | 1179 m vers ASECNA (depuis le secteur Shell) (fiche aller, rangs 44–49) ; 1117 m vers Sédima (depuis le secteur ASECNA) (fiche retour, rangs 21–26) |

## TATA — 65 identifiants

| Code | Ordre publié | Aller | Retour | Autres pièces | Portions de carte |
|---|---|---|---|---|---|
| 1 | 18 / 20 | — | — | catalogue, descriptif | 903 m vers HLM Grand Yoff (fiche TATA) |
| 2 | 16 / 18 | — | — | catalogue, descriptif | — |
| 3 | 13 / 15 | — | — | catalogue | 2064 m vers Petersen |
| 4 | 8 / 10 | — | — | catalogue | 2064 m vers Petersen |
| 5 | 17 / 19 | — | — | catalogue | — |
| 24 | 12 / 14 | — | — | catalogue | — |
| 25 | 5 / 7 | — | — | catalogue | — |
| 26 | 11 / 13 | — | — | catalogue | — |
| 27 | 10 / 12 | — | — | catalogue | — |
| 28 | 14 | — | — | catalogue | — |
| 29 | 11 / 13 | — | — | catalogue | — |
| 30 | 6 / 8 | — | — | catalogue | — |
| 31 | 13 | — | — | catalogue | — |
| 32 | 8 / 10 | — | — | catalogue | — |
| 33 | 16 / 18 | — | — | catalogue | — |
| 34 | 7 / 9 | — | — | catalogue | — |
| 35 | 8 / 10 | — | — | catalogue | — |
| 36 | 14 / 16 | — | — | catalogue | — |
| 37 | 27 / 29 | — | — | catalogue | — |
| 38 | 11 / 13 | — | — | catalogue | — |
| 39 | 11 / 13 | — | — | catalogue | — |
| 40 | 9 / 11 | — | — | catalogue | — |
| 41 | 18 / 20 | — | — | catalogue | — |
| 42 | 13 / 15 | — | — | catalogue | — |
| 43 | 12 / 14 | — | — | catalogue | — |
| 44 | 8 / 10 | — | — | catalogue | — |
| 45 | 31 / 33 | — | — | — | 1179 m vers Keur Massar |
| 46 | 15 / 17 | — | — | catalogue | — |
| 47 | 13 / 15 | — | — | — | — |
| 48 | 9 / 11 | — | — | catalogue | — |
| 49 | 19 / 21 | — | — | catalogue | — |
| 50 | 17 / 19 | — | — | catalogue | — |
| 51 | 7 / 9 | — | — | catalogue | — |
| 52 | 8 / 10 | — | — | catalogue | — |
| 53 | 14 / 16 | — | — | catalogue | — |
| 54 | 10 / 12 | — | — | catalogue | — |
| 55 | 11 / 13 | — | — | catalogue | — |
| 56 | 10 / 12 | — | — | catalogue | — |
| 57 | 11 / 13 | — | — | catalogue | — |
| 58 | 7 | — | — | catalogue | — |
| 59 | 12 | — | — | catalogue | — |
| 60 | 6 / 8 | — | — | catalogue | — |
| 61 | 9 | — | — | catalogue | — |
| 62 | 17 | — | — | catalogue | — |
| 63 | 16 | — | — | catalogue | — |
| 65 | 10 | — | — | catalogue | — |
| 66 | 21 | — | — | catalogue | — |
| 67 | 20 | — | — | catalogue | — |
| 68 | 7 | — | — | catalogue | — |
| 69 | — | — | — | catalogue | — |
| 70 | — | — | — | catalogue | — |
| 71 | 16 | — | — | catalogue | — |
| 72 | — | — | — | catalogue | — |
| 73 | 8 | — | — | catalogue | — |
| 74 | 12 | — | — | catalogue | — |
| 75 | 13 | — | — | catalogue | — |
| 76 | 10 | — | — | catalogue | — |
| 77 | 12 | — | — | catalogue | — |
| 78 | 10 | — | — | catalogue | — |
| 79 | 4 | — | — | catalogue | — |
| 80 | 15 | — | — | catalogue | — |
| 81 | 14 | — | — | catalogue | — |
| 82 | 12 | — | — | catalogue | — |
| 83 | 12 | — | — | — | — |
| 84 | 8 | — | — | catalogue | — |

Hors attribution :
- aftu-85-directions.json (85-unverified) : outbound, 89 occurrences.
- aftu-85-directions.json (85-unverified) : inbound, 95 occurrences.
- corridors : as-published, 4 occurrences.

Calcul daté local (hors édition opérateur) : 0 sens de bus ; 4 arcs piétons orientés (tous usages confondus). Une ligne absente du calculateur n’est pas déclarée hors service.
