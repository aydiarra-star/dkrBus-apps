# Audit du pôle d’échanges de Petersen — 16 novembre 2026

## Objet

Consolider les preuves disponibles sur le pôle Petersen pour fiabiliser le calcul des correspondances BRT, DDD et AFTU, sans déplacer les arrêts ni modifier les correspondances déjà enregistrées.

## Conclusion

**Petersen est un pôle multimodal officiellement documenté pour le transfert entre BRT, AFTU et DDD.** Le CETUD décrit le pôle d’échanges BRT comme un terminus de bus aménagé à l’intérieur de la gare de Petersen, destiné à faciliter les transferts entre le BRT et les modes de plus petite capacité (AFTU, DDD), dans les deux sens.

Cette preuve confirme le rôle multimodal du site à l’échelle du pôle. Elle ne fournit cependant pas les coordonnées des quais actuels de chaque ligne, les portes d’accès voyageurs effectivement ouvertes, ni les cheminements piétons mesurés entre chaque quai et la station BRT. Il ne faut donc pas transformer automatiquement le centre de la gare ou un point BRT en position exacte de tous les arrêts AFTU/DDD.

## AFTU : lignes officielles terminus Petersen

Le guide officiel de mobilité des JOJ 2026 classe plusieurs lignes AFTU sous les pôles « Piscine Olympique et Stade Iba Mar Diop » et « Stade Iba Mar Diop », et indique explicitement Petersen comme terminus :

| Ligne | Relation publiée dans le guide |
|---|---|
| 4 | Yoff Frigo – Petersen |
| 25 | Parcelles Assainies – Petersen |
| 29 | Cambérène – Petersen |
| 2 | Parcelles Assainies – Petersen |
| 5 | Parcelles Assainies – Petersen |
| 27 | Guédiawaye – Petersen |
| 28 | Warouwaye – Petersen |
| 40 | Jaxaay – Petersen |
| 41 | Guédiawaye – Petersen |
| 50 | Cité APIX – Petersen |
| 55 | Rufisque – Petersen |

Le catalogue officiel AFTU consulté indépendamment confirme notamment les lignes 2, 3, 4, 5, 25, 27, 28, 29, 40, 41, 50, 55 et 56 comme relations ayant Petersen pour terminus ou origine. Les intitulés et les listes peuvent varier selon la version du catalogue : le guide JOJ est conservé comme source datée de référence pour les lignes du tableau ci-dessus.

**Limite géographique :** ces sources prouvent la desserte du pôle Petersen, pas l’emplacement GPS individuel des quais de chaque ligne. Aucun nouveau point d’arrêt ne doit être créé à partir du seul nom « Petersen ».

## DDD : desserte du secteur Petersen

Le réseau urbain publié par Dakar Dem Dikk mentionne Petersen dans les séquences des lignes 13 et 18, ainsi que dans les lignes de boucle 502 et 503 autour de la gare de Colobane et du centre-ville. Cela confirme la desserte DDD du secteur, mais ne localise pas les quais DDD à l’intérieur de la gare Petersen.

Il faut conserver les noms de lieux et les séquences tels que publiés par DDD. Une desserte de secteur ne permet pas à elle seule de déduire une position de quai ou un temps de marche.

## BRT et organisation du pôle

Les documents de projet du CETUD décrivent trois pôles d’échanges terminaux du BRT : Guédiawaye, Grand Médine et Petersen. Pour Petersen, le document décrit un terminus de bus situé à l’intérieur de la gare, afin de permettre le transfert des voyageurs entre le BRT et les réseaux AFTU/DDD.

Un document de suivi du projet BRT précise également que le pôle BRT est une partie de la gare Petersen et évoque l’aménagement de la gare ainsi que la relocalisation des opérateurs AFTU, DDD et d’autres transports collectifs dans l’emprise restante. Cette mention impose de distinguer l’organisation projetée ou réaménagée des positions de quais observées à une date donnée.

## Correspondances déjà enregistrées dans l’application

Le dépôt contient déjà les liens de correspondance Petersen ajoutés dans le cadre de PR #210 :

- BRT Petersen ↔ DDD Petersen ;
- BRT Petersen ↔ AFTU Petersen ;
- DDD Petersen ↔ AFTU Petersen.

Le champ `walkM: 0` y représente le partage d’un même pôle/terminus, et non une mesure de marche nulle entre deux portes ou deux quais. Cette convention ne doit pas être présentée comme une distance réelle de déplacement.

**Décision :** conserver les trois liens existants sans les dupliquer ni les modifier dans cet audit. Ne pas leur attribuer un temps de marche exact tant que les accès et cheminements actuels ne sont pas vérifiés. Dans l’interface, si une précision est nécessaire, interpréter Petersen comme un pôle d’échange commun, pas comme une garantie de quai adjacent.

## Vérifications nécessaires avant un calcul piéton détaillé

1. Relever les accès voyageurs de la station BRT Petersen et de la gare routière.
2. Identifier les zones d’embarquement actuellement utilisées par DDD et AFTU.
3. Vérifier si les lignes AFTU terminus Petersen sont toutes regroupées dans la même zone ou réparties sur plusieurs quais.
4. Tracer les cheminements piétons praticables entre les accès, en tenant compte des traversées, barrières et zones réservées.
5. Mesurer les distances sur le chemin réel, puis seulement définir un temps de marche et les éventuelles pénalités PMR.

## Sources

- CETUD, Plan d’engagement des parties prenantes du BRT (pôle d’échanges de Petersen) : https://cetud.sn/wp-content/uploads/2025/09/plan-dengagement-des-parties-prenantes-du-BRT-mis-a-jour.pdf
- CETUD, Rapport final PEPP BRT Dakar : https://www.cetud.sn/images/docs/Rapport_Final_PEPP_BRT_Dakar.pdf
- Guide officiel de mobilité JOJ Dakar 2026, réseau AFTU : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf
- Catalogue officiel AFTU : https://aftu-senegal.org/infos-pratiques/
- Réseau urbain officiel Dakar Dem Dikk : https://demdikk.sn/reseau-urbain-dakar/
- Banque mondiale, document de suivi du projet BRT et pôle de Petersen : https://documents1.worldbank.org/curated/en/099010003012312042/pdf/P156186-b873dcd5-3dbb-4e9a-9618-a34ba82f356c.pdf

## Périmètre de modification

Documentation uniquement. Aucun changement de code, d’arrêt actif, de ligne, de tracé, d’horaire, de correspondance ni de donnée TER/BRT.
