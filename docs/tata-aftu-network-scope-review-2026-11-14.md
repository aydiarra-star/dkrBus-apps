# Qualification du périmètre TATA / AFTU — 14 novembre 2026

Dépôt : `aydiarra-star/dkrBus-apps`  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Nature : revue documentaire en lecture seule.

## Conclusion de qualification

Les sources institutionnelles consultées ne décrivent pas TATA comme un réseau d'exploitation autonome à ajouter au réseau AFTU. Elles décrivent les minibus de marque TATA comme une composante du programme de renouvellement du parc exploité par les opérateurs regroupés au sein de l'AFTU.

Le modèle de données doit donc distinguer :

1. **AFTU** : réseau/organisation opératrice à conserver comme référence principale des lignes de minibus.
2. **TATA** : marque de véhicules / appellation usuelle de ces minibus, à conserver comme alias ou attribut de mode lorsque cela est utile.
3. **TATA Magic / taxis collectifs de proximité** : programme distinct de rabattement, documenté par MECTRANS ; ne pas le confondre avec les lignes régulières de minibus AFTU.
4. **Fiches de lignes TATA issues de sites secondaires** : preuves de comparaison, jamais des fiches officielles ni un réseau indépendant par défaut.

## Vérifications sur les sources institutionnelles

- Le CETUD indique que 505 minibus de marque TATA ont été mis en circulation à partir de fin 2005 au profit de membres de neuf GIE de l'AFTU, et que 402 minibus KING LONG ont ensuite rejoint le programme. Le CETUD mentionne également une tranche de 700 minibus TATA mise en circulation à partir de 2012.
- La présentation institutionnelle du CETUD décrit l'AFTU comme le regroupement de 14 GIE de transporteurs et situe le programme de renouvellement dans le réseau organisé autour de cette association.
- La documentation de l'enquête mobilité du CETUD décrit les minibus AFTU comme couramment appelés « Tata » par les Dakarois. Cette appellation ne prouve pas l'existence d'un opérateur ou d'un réseau parallèle.
- MECTRANS documente séparément 101 taxis collectifs de proximité de marque TATA Magic en exploitation depuis mai 2015. Leur fonction annoncée est le rabattement depuis des zones éloignées vers les grandes artères et les réseaux AFTU / Dakar Dem Dikk. Ce service ne doit pas être fusionné avec les lignes régulières AFTU simplement parce que le nom TATA apparaît.

Sources :
- CETUD, « L'AFTU est la fierté des transporteurs urbains du Sénégal » : https://cetud.sn/l-aftu-est-la-fierte-des-transporteurs-urbains-du-senegal/
- CETUD, rapport EMTASUD : https://cetud.sn/wp-content/uploads/2026/03/9-CETUD-EMTASUD_RAPPORT-VF.pdf
- CETUD, présentation du programme de modernisation des transports : https://cetud.sn/projet/pmt/
- MECTRANS, programme exécuté — taxis collectifs de proximité TATA Magic : https://mectrans.sn/?page_id=320
- AFTU, index officiel des lignes de Dakar : https://aftu-senegal.org/infos-pratiques/

## État du jeu secondaire présent dans le dépôt

Le fichier `src/data/tata-lines.json` contient **62 fiches candidates**, avec 62 codes distincts. Les sources enregistrées sont `covoiturage.sn` et `xibaaru.sn`. Aucune de ces fiches n'est présentée dans le fichier comme une publication de l'opérateur AFTU.

Contrôle structurel effectué sur ces 62 objets :
- 62 séquences de repères/waypoints dans un seul ordre publié par la source secondaire ;
- 0 séquence retour indépendante structurée ;
- aucune fréquence officielle par ligne TATA établie par ce fichier ;
- les dates de publication ne sont pas renseignées dans les objets contrôlés.

Les numéros de lignes secondaires recoupent largement la numérotation visible sur l'index AFTU, mais un numéro identique ne prouve pas à lui seul que la fiche secondaire correspond exactement à la fiche officielle. Les différences de terminus, de variantes de voirie et d'ordre des repères doivent être comparées ligne par ligne.

## Règles de traitement à appliquer

- Ne pas additionner 62 lignes « TATA » aux lignes AFTU comme s'il s'agissait de deux réseaux distincts.
- Conserver la provenance secondaire de chaque fiche dans les données et l'interface d'audit.
- Rapprocher chaque fiche secondaire de sa candidate AFTU par terminus, corridor et séquence ; un rapprochement de numéro seul reste insuffisant.
- Quand le corridor correspond, conserver un lien candidat vers la ligne AFTU et garder les éventuels écarts comme variantes/conflits.
- Ne jamais fabriquer le retour en inversant les waypoints secondaires : aucune des 62 fiches ne fournit actuellement une séquence retour indépendante.
- Ne rattacher aucune fréquence ou aucun compte à rebours à une fiche TATA sur la seule base de ces sources.
- Garder TATA Magic dans un périmètre de rabattement distinct si ses lignes/arrêts propres sont documentés par une source opérationnelle.

## Prochaine étape de travail

Prioriser le rapprochement des 62 fiches secondaires avec les 72 lignes de l'index AFTU : produire un tableau de correspondance explicite (correspondance forte, candidate, conflit, ou aucune correspondance), puis rechercher les preuves de sens retour indépendantes dans les sources accessibles. Les sept lignes AFTU 84–89 et 91 restent listées officiellement mais sans fiche détaillée récupérée par les URL testées ; leurs corridors ne doivent pas être enrichis par extrapolation.

## Garde-fous

Cette revue ne modifie aucun catalogue passager, aucune séquence d'arrêts, aucun horaire ni aucune fréquence. Aucune écriture Supabase, aucun déploiement et aucune modification des données TER/BRT. GTFS n'est pas requis pour poursuivre.


## Résultat du rapprochement des 62 codes avec le catalogue AFTU

Un contrôle reproductible a comparé les 62 objets de `src/data/tata-lines.json` aux 72 fiches AFTU de `src/data/mobility-lines.json`, en normalisant les accents, la casse et la ponctuation des terminus. La comparaison a été faite sur les lignes portant le même code, sans comparer les séquences de waypoints à ce stade.

| Résultat sur les 62 codes communs | Nombre | Codes |
|---|---:|---|
| Même origine et même destination normalisées | 26 | 1, 4, 30, 33, 34, 36, 39, 40, 41, 43, 44, 45, 46, 48, 49, 50, 51, 55, 56, 62, 66, 76, 78, 79, 80, 83 |
| Terminus inversés | 5 | 35, 60, 61, 73, 84 |
| Terminus différents ou non concordants | 31 | 2, 3, 5, 24–29, 31, 32, 37, 38, 42, 47, 52–54, 57–59, 63, 65, 67, 68, 71, 74, 75, 77, 81, 82 |

### Interprétation

- Les 26 correspondances de terminus dans le même sens sont des rapprochements forts à examiner en priorité, mais elles ne valident pas encore l'identité de toutes les rues, des arrêts intermédiaires ni du service actuel.
- Les cinq cas inversés ne doivent pas être corrigés automatiquement : ils peuvent signaler un ordre de terminus inversé dans une fiche secondaire, une variante, ou une divergence réelle.
- Les 31 cas restants nécessitent une comparaison des séquences et des sources ; un numéro identique ne suffit pas.
- Le contrôle ne cherche pas à faire correspondre une fiche secondaire à une autre ligne AFTU de numéro différent ; les cas de renumérotation éventuelle restent donc à examiner.
- Les 62 fiches TATA ne contiennent toujours aucune séquence retour indépendante.

Ce résultat donne une base concrète pour la prochaine revue : traiter d'abord les 26 paires de terminus concordantes, puis les cinq inversions, sans fusionner automatiquement les enregistrements ni publier de retour.


## Comparaison complémentaire des repères — 26 corridors à terminus concordants

Pour les 26 paires de même code et de mêmes terminus, un second contrôle a comparé les ensembles de waypoints normalisés (accents/casse/ponctuation neutralisés). La mesure est l'indice de Jaccard sur les noms distincts : intersection des noms divisée par l'union. **Elle ignore volontairement l'ordre** ; elle sert uniquement à prioriser la revue, jamais à valider une séquence.

Les 17 paires dont le score est au moins 0,70 sont :

| Code | Repères TATA / AFTU | Noms communs | Jaccard |
|---:|---:|---:|---:|
| 66 | 21 / 23 | 21 | 0,913 |
| 45 | 31 / 34 | 31 | 0,912 |
| 33 | 16 / 18 | 16 | 0,889 |
| 80 | 15 / 17 | 15 | 0,882 |
| 41 | 18 / 21 | 18 | 0,857 |
| 83 | 12 / 14 | 12 | 0,857 |
| 50 | 17 / 20 | 17 | 0,850 |
| 62 | 17 / 18 | 16 | 0,842 |
| 56 | 10 / 12 | 10 | 0,833 |
| 76 | 10 / 12 | 10 | 0,833 |
| 40 | 9 / 11 | 9 | 0,818 |
| 4 | 8 / 10 | 8 | 0,800 |
| 49 | 19 / 22 | 18 | 0,783 |
| 48 | 9 / 12 | 9 | 0,750 |
| 55 | 11 / 13 | 10 | 0,714 |
| 51 | 7 / 10 | 7 | 0,700 |
| 34 | 7 / 10 | 7 | 0,700 |


Les neuf autres paires de terminus identiques ont un score inférieur à 0,70 (codes 78, 46, 36, 43, 44, 1, 39, 79 et 30). Elles restent à contrôler, car une couverture secondaire partielle, des alias de noms ou une divergence de corridor peuvent expliquer le score.

### Priorité proposée

1. Examiner d'abord les 18 paires à score élevé en comparant l'ordre exact, les arrêts répétés, les points OSM/ArcGIS disponibles et les variantes de voirie.
2. Vérifier en particulier les fiches courtes (ex. codes 79 et 30) : un score bas peut venir d'une extraction secondaire incomplète.
3. Ne jamais reconstruire le retour par inversion : les deux fichiers ne contiennent aucune séquence retour TATA indépendante.
4. Conserver les deux provenances tant qu'une validation opérateur n'a pas établi la relation canonique.


## Contrôle de l'ordre des séquences — paires à terminus concordants

Un troisième contrôle compare les listes dans leur ordre publié avec une plus longue sous-séquence commune (LCS), après normalisation des accents, de la casse et de la ponctuation. Le score ci-dessous est `LCS / max(longueur TATA, longueur AFTU)`. Les libellés de terminus et les noms non identiques restent des différences ; aucun arrêt n'est fusionné automatiquement. Ce score est un outil de tri, pas une validation opérateur.

| Code | Waypoints TATA | Waypoints AFTU | LCS ordonnée | Score |
|---:|---:|---:|---:|---:|
| 66 | 21 | 23 | 21 | 0,913 |
| 45 | 31 | 34 | 31 | 0,912 |
| 33 | 16 | 18 | 16 | 0,889 |
| 62 | 17 | 18 | 16 | 0,889 |
| 80 | 15 | 17 | 15 | 0,882 |
| 41 | 18 | 21 | 18 | 0,857 |
| 83 | 12 | 14 | 12 | 0,857 |
| 50 | 17 | 20 | 17 | 0,850 |
| 56 | 10 | 12 | 10 | 0,833 |
| 76 | 10 | 12 | 10 | 0,833 |
| 40 | 9 | 11 | 9 | 0,818 |
| 49 | 19 | 22 | 18 | 0,818 |
| 4 | 8 | 10 | 8 | 0,800 |
| 55 | 11 | 13 | 10 | 0,769 |
| 48 | 9 | 12 | 9 | 0,750 |
| 78 | 10 | 12 | 9 | 0,750 |
| 51 | 7 | 10 | 7 | 0,700 |
| 34 | 7 | 10 | 7 | 0,700 |
| 46 | 15 | 20 | 13 | 0,650 |
| 1 | 18 | 21 | 12 | 0,571 |
| 36 | 14 | 18 | 10 | 0,556 |
| 44 | 8 | 13 | 7 | 0,538 |
| 39 | 11 | 15 | 8 | 0,533 |
| 43 | 12 | 15 | 8 | 0,533 |
| 30 | 6 | 18 | 5 | 0,278 |
| 79 | 4 | 15 | 4 | 0,267 |

### Ce que le contrôle permet de dire

- Pour 17 lignes sur 26, tous les repères TATA apparaissent dans la séquence AFTU dans le même ordre (LCS égale à la longueur TATA). Cela indique que la fiche secondaire est compatible avec un sous-parcours de la séquence AFTU, sans démontrer qu'elle est complète ni actuelle.
- Pour les codes 62, 49, 55, 78, 46, 1, 36, 44, 39, 43 et 30, certains repères secondaires ne s'alignent pas dans l'ordre AFTU ou sont absents après normalisation ; ces divergences demandent une revue manuelle.
- Les codes 30 et 79 sont particulièrement incomplets côté TATA par rapport à la fiche AFTU (6/18 et 4/15 repères respectivement). Ne pas les prendre comme itinéraires complets.
- Les libellés ajoutés automatiquement au début/à la fin par les fiches AFTU (par exemple « Terminus ... ») peuvent compter comme différence de nom même quand le lieu est le même. Les scores doivent donc rester des indicateurs, pas des pourcentages de précision géographique.

## Contrôle des cinq paires dont les terminus sont inversés

Pour les codes 35, 60, 61, 73 et 84, les libellés origine/destination TATA et AFTU sont inversés. La comparaison a aussi testé l'ordre des listes dans les deux sens :

| Code | Repères TATA | Repères AFTU | LCS même ordre | LCS après inversion |
|---:|---:|---:|---:|---:|
| 35 | 8 | 10 | 8 | 1 |
| 60 | 6 | 11 | 4 | 1 |
| 61 | 9 | 10 | 8 | 1 |
| 73 | 8 | 10 | 8 | 1 |
| 84 | 8 | 0 | 0 | 0 |

Ces résultats sont importants : pour les codes 35, 60, 61 et 73, malgré les terminus inversés dans les métadonnées, les repères communs se retrouvent plutôt dans le même ordre que dans les listes, et non dans l'ordre inverse. Cela interdit de conclure que les séquences sont simplement la même ligne en sens opposé. Pour le code 84, la fiche AFTU indexée ne fournit pas de liste de waypoints dans le catalogue local ; la comparaison de séquences est donc impossible.

Décision : classer ces cinq lignes comme **conflits de métadonnées de terminus à résoudre**, pas comme retours validés. Ne pas retourner les listes, ne pas fusionner les objets et ne pas exposer de compte à rebours à partir de ces comparaisons.
