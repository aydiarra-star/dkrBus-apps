# Audit du rapprochement exact AFTU / TATA vers les arrêts ArcGIS DDD

Date de génération : 17 novembre 2026  
Périmètre : 1 373 noms AFTU/TATA comparés aux noms des arrêts DDD extraits d'ArcGIS.

## Résultat

| Résultat du rapprochement exact normalisé | Nombre de noms |
|---|---:|
| Correspondance exacte avec un seul groupe de localisation candidat | 18 |
| Plusieurs localisations DDD possibles | 23 |
| Aucun nom DDD exact trouvé | 1 329 |
| Libellé générique non géocodable | 3 |
| **Total** | **1 373** |

Le catalogue source couvre 72 corridors AFTU, 28 fichiers détaillés AFTU, 62 lignes TATA et 4 748 occurrences de points de passage.

Une correspondance exacte signifie uniquement que le nom normalisé correspond et qu'un groupe de coordonnées DDD a été identifié dans l'extrait. Elle ne prouve pas encore que l'arrêt AFTU/TATA correspond à ce point physique, ni que le point est dans le bon sens ou au bon rang de la ligne. Les 18 coordonnées restent des candidates de revue.

## Les 18 noms candidats à localisation unique

| Nom de point AFTU/TATA | Lignes DDD portant le nom exact | Lignes AFTU/TATA où le nom apparaît |
|---|---|---|
| Allées Papa Guèye Fall | 6, 121 | AFTU 27, 41, 50, 55, 56 ; TATA 41, 50, 55, 56 |
| Case-Ba | 227 | AFTU 33, 36, 38, 42, 45, 59, 78, 80, 83 ; TATA 33, 36, 37, 38, 45, 59, 78, 80, 83 |
| Caserne Sapeurs-Pompiers | 227 | AFTU 36 |
| Derklé | 10 | AFTU 46 |
| Gare De Keur Massar | 11, 227 | AFTU 37, 51, 52, 54, 59, 61, 65, 68, 71, 73, 74, 76, 79, 80, 81, 83 ; TATA 51, 68, 71, 73, 74, 76, 80, 81, 83 |
| Golf | 2 | AFTU 29, 33, 78 ; TATA 29, 33, 38, 78 |
| Hotel De Ville | 1, 4, 16A, 18, 121 | AFTU 66 |
| Marché Jeudi | 2 | AFTU 28 ; TATA 28 |
| Petit Mbao | 16B | AFTU 71 ; TATA 71 |
| Police des Parcelles Assainies | 6 | AFTU 42, 63 ; TATA 42, 63 |
| Poste Fann | 1 | AFTU 71 ; TATA 71 |
| Rocade Fann–Bel Air | 16A, 18 | AFTU 27, 30, 50 ; TATA 50, 65 |
| Route de Malika | 227 | AFTU 68 ; TATA 68 |
| Rue 34 | 4 | AFTU 1 ; TATA 1 |
| Rue 9 | 4 | AFTU 1 ; TATA 1 |
| Stade | 4, 7, 8, 12 | AFTU 66 |
| Terminus Cambérène | 6 | AFTU 79, 80 ; TATA 80 |
| Terminus Gare des Parcelles Assainies | 1, 23, 227 | AFTU 5, 25, 26, 36 ; TATA 36 |

## Cas à ne pas confondre avec une validation

- Les noms courts comme « Stade », « Golf », « Case-Ba », « Rue 9 » ou « Rue 34 » nécessitent un contrôle de contexte : un nom exact peut rester trop général.
- Un point présent sur plusieurs lignes DDD peut être un pôle commun, mais il faut confirmer qu'il s'agit du même quai ou du même côté de rue.
- Une coordonnée unique ne prouve pas l'ordre de passage ni la direction.
- Les 23 noms ambigus ont été exclus des correspondances automatiques parce qu'ils renvoient à plusieurs positions distinctes.
- Les 1 329 noms sans correspondance exacte ne doivent pas recevoir de coordonnées fabriquées ; les rapprochements flous restent dans un rapport séparé.

## Ordre de revue recommandé

Commencer par les points qui apparaissent à la fois dans des sources AFTU et TATA avec un nom précis et un contexte de ligne exploitable : Marché Jeudi (28), Petit Mbao (71), Poste Fann (71), Route de Malika (68), Police des Parcelles Assainies (42/63) et Allées Papa Guèye Fall (41/50/55/56). Ce classement donne un ordre de vérification, pas une approbation.

Pour chaque cas, confirmer le lieu, le côté de chaussée, le sens, le rang dans l'itinéraire et la cohérence avec les autres arrêts voisins avant toute utilisation passager.

Aucune correspondance n'est promue automatiquement. Aucun horaire TER/BRT, aucune donnée de production et aucun écran passager n'a été modifié.
