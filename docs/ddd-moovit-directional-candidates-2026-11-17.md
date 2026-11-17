# DDD — candidats directionnels Moovit pour les lignes 7 et 13

Date de consultation : 17 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`  
Statut : **sources secondaires récentes, à rapprocher de la référence officielle DDD**. Aucun arrêt n'est activé automatiquement.

## Pourquoi cette source est ajoutée

Les pages cartographiques Moovit consultées publient des listes ordonnées distinctes selon le sens, avec une date de mise à jour affichée. Elles apportent donc une preuve directionnelle complémentaire, plus récente que la couche géographique ArcGIS DDD modifiée le 24 septembre 2024. Moovit reste une source secondaire : ses noms génériques, ses arrêts adressés et ses terminus doivent être recoupés avec DDD, ArcGIS et les autres références avant intégration.

## Ligne 7 — deux séquences distinctes trouvées

| Sens indiqué par Moovit | Départ → arrivée affichés | Occurrences | Mise à jour affichée |
|---|---|---:|---|
| Ouakam | Gare Palais → Rue Okm 60, 67 | 29 | 7 novembre 2026 |
| Palais | Rue Okm 60, 67 → Gare Palais | 27 | 14 novembre 2026 |

Pages sources :
- Sens Ouakam : https://moovitapp.com/index/fr/transport_en_commun-map-7-Dakar-5996-1618037-18051422-0
- Sens Palais : https://moovitapp.com/index/fr/transport_en_commun-map-7-Dakar-5996-1618037-18051422-1

**Contrôle à effectuer :** DDD publie la ligne 7 entre Ouakam et Palais 2, tandis que Moovit emploie « Gare Palais » et des arrêts de rue. Les deux séquences Moovit comptent 29 et 27 occurrences ; elles ne doivent pas être forcées en miroir ni fusionnées avec les 21 repères de la fiche officielle DDD. Les libellés génériques « Arrêt de bus » nécessitent une identification géographique indépendante.

## Ligne 13 — deux séquences distinctes trouvées

| Sens indiqué par Moovit | Départ → arrivée affichés | Occurrences | Mise à jour affichée |
|---|---|---:|---|
| Palais | Terminus Liberté 5 → Gare Palais | 30 | 14 novembre 2026 |
| Liberté 5 | Gare Palais → Terminus Liberté 5 | 30 | 14 novembre 2026 |

Pages sources :
- Sens Palais : https://moovitapp.com/index/fr/transport_en_commun-map-13-Dakar-5996-1618037-18051475-1
- Sens Liberté 5 : https://moovitapp.com/index/fr/transport_en_commun-map-13-Dakar-5996-1618037-18051475-0

**Contrôle à effectuer :** la fiche officielle DDD publie une séquence Liberté 5 → Palais 2 de 24 repères. Moovit publie 30 occurrences dans chaque sens, dont plusieurs libellés de rues ou arrêts génériques. Il s'agit d'une différence de granularité et possiblement de périmètre ; ne pas remplacer la liste officielle par la liste Moovit sans rapprochement arrêt par arrêt. Les deux sens Moovit restent des candidats distincts.

## Décisions de données

1. Conserver la séquence officielle DDD comme référence de parcours publiée.
2. Enregistrer Moovit comme source secondaire directionnelle récente pour les lignes 7 et 13.
3. Ne pas importer directement les libellés génériques, les arrêts de rue ou les terminus Moovit dans le catalogue passager.
4. Ne pas inverser les listes pour fabriquer un retour : conserver les pages de chaque sens comme preuves séparées.
5. Ne pas convertir les heures ou fréquences affichées par Moovit en référence DDD sans validation de l'opérateur.
6. Avant calcul de compte à rebours, identifier les arrêts communs, les écarts, les coordonnées et les temps cumulés pour chaque sens indépendamment.
7. Aucun changement aux données TER/BRT, aux horaires de production ou à Supabase.

## Prochaine étape technique

Faire le rapprochement ligne 7 et 13 entre les repères DDD officiels, les deux listes directionnelles Moovit et les couches cartographiques ArcGIS/OSM. Produire un tableau de correspondance avec le nom source, le candidat géographique, le sens, l'ordre, la méthode de correspondance et le statut. Seuls les arrêts non ambigus pourront alimenter les séquences de calcul du compte à rebours.


## Durées globales publiées par Moovit

Les pages de détail associées donnent aussi une durée totale de parcours :
- Ligne 7 vers Ouakam : environ 35 minutes ; vers Palais : environ 34 minutes.
- Ligne 13 vers Palais : environ 31 minutes ; vers Liberté 5 : environ 30 minutes.

Ces durées sont enregistrées dans `publishedJourneyDurationMinutes` pour préparer le calcul des temps cumulés. Elles ne fournissent pas les temps de passage intermédiaires à chaque arrêt. Une interpolation uniforme entre arrêts ne doit pas être présentée comme un horaire réel : il faut d'abord exploiter les horaires par arrêt disponibles sur les pages Moovit ou une source opérateur, puis qualifier la méthode et la marge d'erreur en métadonnées internes.
