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
