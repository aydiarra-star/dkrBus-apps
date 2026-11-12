# Spécification — copilote IA de gouvernance des données Dakar Bus

Statut : proposition de conception à implémenter par lots et à faire valider.
Périmètre : console privée d'administration et de contrôle qualité des données.
Cette spécification ne modifie ni les données de transport ni les règles de
publication existantes.

## 1. Deux usages IA distincts

Dakar Bus doit distinguer clairement :

1. **Assistant voyageurs** : aide à comprendre une demande et à calculer un
   déplacement à partir des données réellement disponibles. Il réutilise les
   modules métier existants (assistant.ts, planner.ts, truth.ts) et ne devient
   jamais une source de vérité.
2. **Copilote IA de gouvernance** : outil privé destiné aux administrateurs et
   relecteurs. Il examine les données, détecte les anomalies, compare les
   sources et prépare des propositions de correction à soumettre à un humain.

Le présent document définit le deuxième rôle. Il ne remplace pas la roadmap du
copilote voyageurs et ne justifie pas l'ajout d'un modèle externe dans
l'application publique.

## 2. Mission du copilote de gouvernance

Le copilote doit réduire le travail manuel de contrôle et rendre les décisions
plus explicables. Il agit comme un **analyste et assistant de revue**, jamais
comme un administrateur autonome.

Il peut :
- lire les jeux de données auxquels le relecteur connecté a déjà accès ;
- normaliser les libellés pour faciliter les comparaisons, sans écraser les
  noms d'origine ;
- regrouper des doublons possibles et expliquer les indices ;
- détecter les coordonnées absentes, invalides, imprécises ou incohérentes ;
- comparer les noms, opérateurs, types d'arrêt, coordonnées et sources ;
- examiner la séquence des arrêts d'une ligne dans chaque sens ;
- comparer les séquences aller/retour, les séquences partagées entre lignes et
  leur cohérence avec les géométries disponibles ;
- relever les arrêts répétés, les ruptures, les inversions suspectes, les
  écarts anormaux et les correspondances ambiguës ;
- produire un rapport priorisé, des éléments de preuve et des propositions
  réversibles pour la file de revue humaine.

Il ne doit pas :
- créer un arrêt réel, un nom officiel, une ligne, un sens ou une desserte ;
- inventer ou interpoler une latitude/longitude ;
- déduire un horaire, une fréquence ou un temps réel à partir d'une simple
  géométrie ou d'un ordre d'arrêts ;
- transformer une donnée OSM communautaire en donnée officielle ;
- fusionner automatiquement deux arrêts qui pourraient être des quais,
  plateformes ou arrêts opposés distincts ;
- valider, publier, supprimer ou écraser une donnée de production ;
- modifier les référentiels TER/BRT vérifiés ou leurs horaires.

## 3. Analyse des arrêts sans coordonnées

Pour le lot recensant environ 1 133 arrêts sans GPS, le copilote ne doit pas se
limiter à comparer les noms.

Pour chaque arrêt non géolocalisé, il doit examiner ensemble :
1. le nom brut et ses variantes normalisées ;
2. l'opérateur, la ligne et le sens auxquels l'arrêt est rattaché ;
3. sa position dans la séquence de la ligne (arrêt précédent et suivant) ;
4. les séquences aller/retour et les autres lignes qui partagent ce passage ;
5. les noms et coordonnées de candidats OSM proches ou associés, lorsqu'ils
   existent ;
6. la cohérence du candidat avec les arrêts voisins et la géométrie disponible ;
7. les indices contradictoires, les doublons possibles et la précision de la
   source.

Résultats possibles :
- MATCH_CANDIDATE : candidat plausible, à examiner ;
- AMBIGUOUS : plusieurs candidats ou indices contradictoires ;
- NO_MATCH : aucune correspondance suffisamment étayée ;
- INSUFFICIENT_EVIDENCE : informations trop limitées.

Une proposition de rapprochement peut inclure un lien vers l'objet source,
la distance mesurée, les noms comparés, les voisins de séquence et les raisons
du classement. **Elle ne renseigne jamais automatiquement les coordonnées
manquantes.** Un relecteur doit vérifier la correspondance et sa source avant
toute évolution de statut.

## 4. Analyse de l'ordre des arrêts sur les lignes

L'ordre des arrêts est un signal important, mais il ne prouve pas à lui seul
l'identité ni la géolocalisation d'un arrêt.

Pour chaque ligne et chaque direction, le copilote doit :
- reconstruire la séquence à partir des données effectivement présentes ;
- vérifier les numéros de séquence, doublons et ruptures ;
- comparer l'aller au retour sans supposer que le retour est toujours
  l'inverse exact de l'aller ;
- tenir compte des terminus, boucles, variantes, branches et arrêts non
  desservis dans un sens ;
- comparer les segments communs entre lignes ;
- signaler les sauts géographiques suspects uniquement si des coordonnées
  sourcées existent ;
- distinguer un conflit de nom d'un conflit d'ordre ;
- indiquer explicitement quand la séquence est partielle ou non vérifiable.

Le copilote ne réordonne jamais les arrêts en base. Il présente une séquence
observée, une anomalie éventuelle, les preuves et une proposition alternative
séparée de la donnée d'origine.

## 5. Provenance, statut et confiance

Chaque observation et chaque proposition doivent conserver au minimum :
- source et identifiant de l'objet source ;
- réseau, opérateur, ligne, direction et arrêt concernés ;
- date d'import et date de vérification lorsqu'elles sont connues ;
- valeur d'origine et valeur proposée, sans perte de l'original ;
- méthode de comparaison et éléments de preuve ;
- version du moteur d'analyse ;
- niveau de confiance du rapprochement et explication de ce niveau ;
- statut de revue et identité du relecteur qui a pris la décision.

La confiance du modèle ne doit jamais être confondue avec l'autorité de la
source. Les catégories de provenance restent explicites (OFFICIAL,
GTFS_SOURCE, OSM, HYBRID, HISTORICAL_REFERENCE, UNVERIFIED) et OSM reste
communautaire, jamais officiellement vérifié par le seul fait d'une analyse IA.

Le copilote doit préférer « inconnu » ou « preuves insuffisantes » à une
réponse forcée.

## 6. Circuit obligatoire de décision humaine

Cycle recommandé :
1. **Observation** : données originales conservées et importées dans un espace
   de staging privé.
2. **Analyse IA** : anomalies et rapprochements candidats calculés en lecture
   seule.
3. **Proposition** : une fiche de revue affiche avant/après, preuves, source,
   confiance et limites.
4. **Décision humaine** : un relecteur habilité accepte, rejette ou corrige la
   proposition, avec motif.
5. **Publication séparée** : un publieur autorisé applique les changements
   acceptés via le pipeline existant, avec séparation des rôles et journal
   append-only.
6. **Contrôle après publication** : comparaison du résultat au changement
   approuvé et possibilité de revenir à la version précédente.

Aucune réponse du modèle, aucun score et aucune sortie structurée ne peuvent
satisfaire à la place d'une attestation humaine. L'IA ne peut ni attribuer le
rôle de relecteur, ni s'auto-approuver, ni appeler la porte de publication.

## 7. Interface attendue dans la console

Une fiche d'anomalie doit rester compréhensible par un non-technicien et
montrer :
- **Ce qui a été détecté** ;
- **Pourquoi c'est suspect** ;
- **Les données et sources comparées** ;
- **Ce que l'IA propose**, si elle a une proposition ;
- **Ce qu'elle ne sait pas établir** ;
- **Le niveau de confiance et ses limites** ;
- les actions humaines : accepter, rejeter, corriger ou demander une nouvelle
  analyse.

Prévoir des filtres par réseau, opérateur, ligne, direction, zone, type
d'anomalie et état de revue. Les lots volumineux doivent être traités par
priorité, avec pagination et historique.

L'interface ne doit pas présenter une proposition IA comme une correction déjà
faite. La donnée d'origine et la proposition doivent être visuellement
distinctes.

## 8. Sécurité et limites techniques

- Accès privé réservé aux rôles autorisés ; l'IA hérite strictement des droits
  de l'utilisateur et ne peut pas élargir son périmètre.
- Analyse en lecture seule ; les propositions sont enregistrées dans une file
  de revue séparée.
- Les champs OSM, noms d'arrêts, descriptions, fichiers GTFS et autres contenus
  importés sont des **données non fiables**, jamais des instructions à suivre
  par le modèle (protection contre l'injection de prompt).
- Aucun secret Supabase, jeton ou donnée sensible ne doit être envoyé au modèle.
- Journaliser les versions du modèle, consignes, données d'entrée et décisions,
  en minimisant les données personnelles.
- Toute action doit être traçable, limitée, réversible et testée.
- Un modèle indisponible ne doit pas bloquer la validation déterministe ni
  modifier le comportement normal de l'application.
- Les contrôles déterministes (schéma, références, unicité, limites, hash,
  séquences) restent exécutés par du code testé ; le modèle ne les remplace pas.

## 9. Architecture progressive recommandée

**Phase A — sans modèle génératif** : bâtir les règles déterministes de qualité,
les rapports de séquence, les contrôles de doublons et la file de revue. C'est
la base vérifiable et testable.

**Phase B — IA d'aide à l'analyse** : utiliser un modèle pour expliquer les
anomalies et classer les candidats à partir des seuls éléments déjà extraits
par les contrôles. Chaque résultat doit être structuré, borné et accompagné
des références de preuve.

**Phase C — aide à la revue** : permettre au relecteur de questionner un
dossier, de comparer des hypothèses et de préparer une décision. Toujours
aucune publication automatique.

**Phase D — amélioration contrôlée** : mesurer les faux positifs et faux
négatifs à partir des décisions humaines validées ; faire évoluer les règles
ou prompts par versions et tests. Ne pas entraîner ni modifier le modèle
automatiquement à partir des décisions sans gouvernance explicite.

## 10. Critères d'acceptation

- Aucun arrêt, GPS, horaire, ligne ou ordre de séquence n'est modifié par l'IA.
- Les arrêts sans GPS sont analysés avec leurs voisins et leurs lignes, pas
  seulement par similarité de nom.
- Les quais opposés et arrêts distincts ne sont pas fusionnés sur la seule
  similarité de nom ou proximité.
- Chaque proposition est traçable jusqu'aux sources et aux preuves.
- Les cas ambigus et les données insuffisantes restent explicitement en attente.
- Aucune donnée OSM n'est étiquetée officielle ou vérifiée automatiquement.
- Une proposition IA ne peut pas passer seule de staging à publication.
- Les rôles relecteur et publieur restent séparés.
- Les données TER/BRT et leurs horaires vérifiés restent inchangés.
- Les tests couvrent les cas ambigus, les erreurs de séquence, les coordonnées
  manquantes, les sources contradictoires, les contenus importés malveillants
  et les tentatives d'auto-publication.

## 11. Relation avec le chantier GTFS

Le validateur GTFS serveur contrôle la structure et les références du fichier.
Le copilote de gouvernance peut ensuite aider à examiner les résultats et les
écarts avec les autres sources, mais il ne remplace pas le validateur.

Une archive structurellement valide reste PENDING_REVIEW et NOT_PUBLISHED.
Une analyse IA favorable ne change pas ces statuts. La validation de la
structure, l'autorité de la source, la revue humaine et la publication sont
quatre décisions distinctes.
