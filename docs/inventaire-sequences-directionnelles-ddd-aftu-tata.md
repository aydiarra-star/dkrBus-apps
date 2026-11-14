# Inventaire des séquences directionnelles DDD / AFTU / TATA

Date de mise à jour : 2026-11-14  
Dépôt de référence : `aydiarra-star/dkrBus-apps`


## Mise à jour de l'inventaire — 14 novembre 2026

Cette mise à jour complète l'état historique ci-dessous : les chiffres du relevé du 9 novembre ne décrivent plus à eux seuls le dépôt actuel.

### DDD — référentiels actuels

- `src/data/dddPublishedRoutes.ts` contient 34 séquences de repères ordonnées.
- Le registre agrégé `src/data/dddOfficialPublishedRoutes.ts` contient 39 séquences officielles uniques issues des registres urbain et périurbains. Ces 39 séquences ne s'ajoutent pas mécaniquement aux 34 précédentes : les sources et codes se recoupent.
- 17 lignes identifiées sans groupe de points ArcGIS portant le même code disposent néanmoins d'une séquence textuelle exploitable. Voir `docs/ddd-missing-arcgis-route-sequence-coverage-2026-11-14.md`.
- Les séquences de ces registres restent des ordres publiés, pas une preuve automatique de coordonnées, de sens retour ou de validation terrain.

### AFTU — séquences directionnelles structurées

Les fichiers directionnels séparés ont été complétés et contrôlés pour les lignes suivantes :

| Ligne | Aller | Retour | Statut / précaution |
|---:|---:|---:|---|
| 30 | 77 | 74 | Deux séquences distinctes ; répétitions anonymes conservées |
| 66 | 77 | 77 | Deux sources directionnelles séparées |
| 83 | 14 | — | Retour absent, non reconstitué |
| 84 | 73 | 73 | Deux sens conservés ; terminus à réconcilier |
| 85 | 89 | 95 | Deux sens conservés ; répétitions préservées |
| 86 | 68 | 64 | Heures transcrites invalidées et non publiables |
| 87 | 68 | 71 | Séquences CETUD transmises ; divergence de terminus/corridor signalée |
| 88 | 78 | 81 | Séquences des deux sens conservées |
| 89 | 55 | 53 | Séquences des deux sens conservées |
| 90 | 82 | 82 | Séquences des deux sens validées par le responsable du projet |
| 91 | 70 | 70 | Séquences des deux sens validées à partir de la référence CETUD transmise |

Les nombres désignent des occurrences ordonnées, pas nécessairement des arrêts géographiquement uniques. Les noms répétés et les positions anonymes ne sont pas supprimés. Les lignes 88–91 et leurs rapports sont détaillés dans `docs/aftu-88-91-directional-sequence-crosscheck-2026-11-14.md`.

### Règle de lecture actualisée

Les listes d'arrêts fournies et validées par le responsable du projet servent de références de travail. Les sources externes servent à corroborer, documenter une correspondance ou signaler une anomalie précise ; leur absence ne bloque pas la structuration d'une liste déjà fournie. Une séquence Aller ne prouve toujours pas le Retour : chaque sens reste indépendant.

---

## Règles de lecture

- Une séquence est dite **publiée** lorsque l'application conserve une liste ordonnée d'arrêts/repères issue d'une source identifiée.
- Une séquence **aller** ne prouve pas l'existence d'une séquence retour.
- Ne jamais créer un retour par simple inversion : certains itinéraires utilisent des rues et arrêts différents selon le sens.
- Un terminus de catalogue n'est pas une séquence d'arrêts.
- Une couche cartographique historique ou un ordre spatial ne prouve pas à lui seul le sens d'exploitation actuel.
- Les fréquences et compte-à-rebours TER/BRT ne sont pas modifiés par cet inventaire.

## DDD

### Séquences ordonnées publiées

Source : [Dakar Dem Dikk – Réseau urbain de Dakar](https://demdikk.sn/reseau-urbain-dakar/)  
Fichier : `src/data/dddPublishedRoutes.ts`  
Le fichier conserve 28 séquences : `1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16A, 16B, 18, 20, 23, 121, 208, 213, 218, 219, 220, 221, 227, 228, 232, 234`.

Nature des données :
- 26 entrées sont des ordres de repères entre terminus publiés.
- Lignes 18 et 20 : circuits publiés, conservés comme circuits et non artificiellement divisés en aller/retour.
- Les 28 entrées ont `directionVerified: false` et `coordinatesVerified: false`.
- Aucune seconde séquence retour distincte n'est fournie par ce fichier.

Références complémentaires présentes dans `src/data/mobility-lines.json` : 15 fiches comportent des `waypoints` :  
`1, 4, 7, 13, 319, 501, 11, 15, 213, 219, 220, 221, 234, 311, 327`.

Ces références doivent être rapprochées des 28 séquences publiées avant toute fusion. Les lignes 319, 501, 311 et 327 ne doivent pas être considérées comme des parcours DDD confirmés uniquement sur la base de leur présence dans ce fichier.

### Données historiques géographiques

Le dépôt contient des couches historiques d'arrêts DDD pour plusieurs lignes, dont un registre consolidé de la ligne 13 dans `src/data/dddLine13HistoricalMerged.ts`. Ces points peuvent aider à retrouver et géolocaliser les arrêts, mais l'ordre des entités ou le chaînage géométrique n'établit pas formellement les sens aller et retour actuels. La consolidation de la ligne 13 mentionne 23 points, dont des doublons spatiaux probables et un point isolé.

### Réserves à résoudre

- Ligne 23 : le terminus annoncé dans le catalogue est Palais 1, alors que la séquence publiée se termine par « Terminus Palais 2 ».
- Les couches historiques et les séquences textuelles doivent être comparées sans fusion automatique.
- Aucun retour distinct ne doit être affiché comme validé sans source de sens opposé.

## AFTU

### Séquences ordonnées disponibles

Fichier : `src/data/mobility-lines.json`  
30 fiches possèdent une liste ordonnée de `waypoints` :

`1, 30, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 56, 57, 58, 60, 76, 79, 81, 82`.

Les autres lignes du catalogue AFTU ont des terminus de référence, mais pas de séquence d'arrêts complète dans ce fichier.

Sources de référence du catalogue : [AFTU Sénégal – Infos pratiques](https://aftu-senegal.org/infos-pratiques/) et fiches de parcours détaillées référencées dans le dépôt.

### Divergences signalées

- Ligne 1 : terminus HLM Grand Yoff / HLM Grand Médine selon les fiches.
- Ligne 35 : ordre des terminus différent entre la liste générale et la fiche détaillée.
- Ligne 53 : parcours général Keur Massar–Sébikotane en désaccord avec une fiche détaillée indiquant un autre couple de terminus.
- Ligne 56 : Jaxaay 1 / Jaxaay 2.
- Ligne 57 : terminus affichés dans l'ordre inverse selon les sources.
- Ligne 81 : terminus détaillé distinct du libellé court du catalogue.

Les divergences doivent être résolues avant de considérer les données concernées comme canoniques. Aucune des 30 fiches n'enregistre actuellement une liste de retour séparée dans `mobility-lines.json`.

## TATA

Le catalogue indépendant `TATA_PUBLIC_LINE_CATALOG` de `src/domain/publicBusLineCatalog.ts` comporte des lignes et des terminus, avec une référence MoMove datée du 09/06/2026. Il ne comporte pas de liste ordonnée de waypoints dans le fichier `mobility-lines.json`.

Le dépôt déclare explicitement que les horaires/fréquences TATA autonomes ne sont pas validés. TATA reste un réseau visuellement distinct. Ne pas copier les séquences AFTU sans preuve de correspondance de ligne et de parcours.

## État consolidé Aller / Retour

| Réseau | Séquences ordonnées disponibles | Retours distincts structurés dans le référentiel examiné |
|---|---:|---:|
| DDD | 28 publiées + 15 fiches waypoint à rapprocher | 0 |
| AFTU | 30 fiches waypoint | 0 |
| TATA | 0 fiche waypoint | 0 |

**Important :** « 0 retour structuré » signifie qu'aucune séquence opposée distincte n'est enregistrée dans les fichiers examinés. Cela ne signifie pas qu'aucun opérateur n'exploite le retour ; il faut encore récupérer ou vérifier ces données auprès des sources correspondantes.

## Étapes nécessaires pour compléter les deux sens

1. Rapprocher les doublons et variantes DDD, puis vérifier chaque terminus et chaque ordre de desserte.
2. Extraire les fiches AFTU détaillées et rechercher les descriptions explicites de retour, en conservant les variantes de voirie.
3. Rechercher des fiches TATA indépendantes, ligne par ligne.
4. Enregistrer séparément chaque sens avec sa source, sa date, ses arrêts ordonnés et le statut de validation des coordonnées.
5. N'afficher le retour comme itinéraire complet que lorsque sa propre séquence est disponible.
6. Ne pas modifier les références ni les panneaux TER/BRT.

