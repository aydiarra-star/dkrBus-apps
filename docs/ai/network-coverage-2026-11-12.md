# Référentiel de couverture — Dakar Bus

**État au 12 novembre 2026 — catalogue de travail, non publié aux voyageurs.**

Ce document sert de mémoire de référence à l'équipe et au futur assistant. Les chiffres officiels, les fiches du dépôt et les parcours effectivement vérifiés sont trois mesures différentes.

## 1. Couverture officielle publiée par le CETUD

| Réseau | Lignes annoncées | Autres indicateurs publiés |
|---|---:|---|
| Dakar Dem Dikk (DDD) | **38** | 400 autobus |
| AFTU | **72** | 14 GIE, 2 300 bus |

Sources institutionnelles :
- DDD : https://cetud.sn/reseaux-de-transport/ddd/
- AFTU : https://cetud.sn/reseaux-de-transport/aftu/

**Total DDD + AFTU : 110 lignes annoncées.**

Ne pas interpréter ce total comme 110 itinéraires complets disponibles dans l'application. Les fiches, les directions et les arrêts doivent être audités séparément.

## 2. Comparaison avec le catalogue du dépôt

État constaté dans le dépôt officiel lors de l'audit :

| Réseau | Fiches candidates | Lignes CETUD | Écart |
|---|---:|---:|---:|
| DDD | 37 | 38 | 1 |
| AFTU | 72 | 72 | 0 |
| Total | 109 | 110 | 1 |

### Travail obligatoire pour DDD

Le catalogue de 37 fiches ne doit pas être complété par une ligne inventée. Les pages publiques DDD présentent des nomenclatures qui ne sont pas parfaitement alignées entre elles (variantes, navettes et lignes historiques). L'écart doit être résolu par comparaison des listes officielles, puis validation opérateur/CETUD.

Sources à rapprocher :
- DDD — Info voyageurs : https://demdikk.sn/info-voyageurs/
- DDD — Réseau urbain Dakar : https://demdikk.sn/reseau-urbain-dakar/
- CETUD — DDD : https://cetud.sn/reseaux-de-transport/ddd/

### Travail obligatoire pour AFTU

Les 72 fiches candidates ne signifient pas que les 72 lignes disposent toutes de :
- tracé vérifié ;
- arrêts nommés et ordonnés à l'aller ;
- arrêts nommés et ordonnés au retour ;
- fréquences et plages horaires sourcées ;
- correspondances vérifiées.

L'audit du dépôt signale que seules quelques fiches disposent d'un parcours détaillé directement exploitable. Les parcours absents restent incomplets plutôt que complétés par extrapolation.

Source : https://aftu-senegal.org/infos-pratiques/

## 3. Mise à jour du TER — phase 2 AIBD

### Faits confirmés

La phase 2 Diamniadio–AIBD a été mise en service le **28 septembre 2026**.

- Extension : 19 km en double voie électrifiée.
- Longueur totale annoncée : 55 km.
- Nouvelle gare AIBD.
- Fréquence annoncée : un train toutes les 8 minutes entre Dakar et Diamniadio ; toutes les 24 minutes entre Diamniadio et AIBD.
- Le ministre indique qu'une gare à Sébikotane reste à réaliser ; une navette de bus entre Sébikotane et Diamniadio est annoncée pendant cette période.

Source primaire institutionnelle relayée par l'Agence de Presse Sénégalaise :
https://aps.sn/train-express-regional-la-phase-diamniadio-aibd-inauguree-un-investissement-de-plus-de-300-milliards-fcfa/

Le ministère annonce également un temps de parcours d'environ 55 minutes entre Dakar et l'AIBD :
https://fr.linkedin.com/posts/ministere-des-transports-terrestres-aeriens_ter-aibd-diamniadio-activity-7510463677347717122--lfm

### À ne pas publier comme fait vérifié pour le moment

- Tarifs 4 000 FCFA (2e classe) et 7 500 FCFA (1re classe) : grille commerciale actuelle à obtenir.
- Amplitude 05:40–22:00 : horaires opérateur à obtenir.
- Sébikotane comme gare TER voyageurs ouverte : contredit par l'annonce APS qui indique une gare à réaliser et une navette provisoire.
- Liste exhaustive des stations intermédiaires de la phase 2 : à obtenir auprès de l'exploitant.
- Fréquence de 8 minutes : elle concerne Dakar–Diamniadio ; ne pas l'étendre au tronçon Diamniadio–AIBD.

### Règle de migration

L'ancien référentiel des 13 gares Dakar–Diamniadio est une version historique à conserver. La phase 2 est une nouvelle version du réseau. Ne pas remplacer les données historiques et ne pas créer des arrêts intermédiaires à partir d'une carte approximative.

## 4. Compteurs à stocker séparément dans la mémoire centrale

Pour chaque réseau et chaque date de référence, conserver :
1. `official_line_count` : total annoncé par l'autorité.
2. `catalogue_record_count` : fiches présentes dans le dépôt.
3. `verified_line_count` : lignes dont l'identité et les terminus sont vérifiés.
4. `verified_direction_count` : directions aller/retour réellement documentées.
5. `verified_stop_count` : arrêts nommés, ordonnés et vérifiés.
6. `complete_bidirectional_line_count` : lignes avec deux sens complets validés.

Ne jamais afficher l'un de ces compteurs à la place d'un autre.

## 5. Taxonomie extensible pour les futurs travaux

Le modèle de mémoire doit pouvoir ajouter de nouveaux réseaux et services sans réécrire l'assistant :
- bus urbains, cars, navettes et transports interurbains ;
- train régional, métro ou autres réseaux ferroviaires ;
- transport maritime et navettes fluviales si des services sont établis ;
- marche, vélo et mobilité partagée ;
- pôles d'échange, parkings, billettique et services voyageurs ;
- travaux routiers, fermetures, déviations, événements et arrêts temporaires ;
- accessibilité, ascenseurs, rampes et cheminements adaptés.

Cette liste décrit des catégories futures possibles, pas des services confirmés comme actuellement exploités.

## 6. Règles de confiance

Chaque information doit porter une source, une date d'observation, un statut (candidate, vérifiée, publiée, rejetée ou expirée), une période de validité si connue et une trace de validation.

Les sources institutionnelles priment pour les faits d'exploitation. Les informations de presse peuvent corroborer une annonce. Les signalements d'usagers restent des témoignages jusqu'à corroboration. L'IA explique les données ; elle ne transforme pas une information manquante en fait.
