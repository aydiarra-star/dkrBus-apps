# AFTU 84–91 — contrôle croisé des artefacts existants

Date : 14 novembre 2026  
Branche : `feat/admin-stop-sequence-audit-phase-a`  
Commit audité : `e57db5c6901860f6840fc1a75191e4047edc3fae`

## Résultat synthétique

Les trois contrôles demandés ont été exécutés sur les artefacts AFTU, OSM et ArcGIS du commit audité. Ils ne permettent pas d'attribuer une séquence d'arrêts aux lignes 86, 87, 88, 89 ou 91. Les recoupements de terminus avec d'autres lignes sont des intersections/corridors communs possibles, pas une preuve de fusion ou de renumérotation.

Les lignes 84 et 85 disposent déjà de fichiers de parcours dans le dépôt, provenant de références transmises au projet ; elles ne doivent donc pas être effacées ni reclassées comme absentes.

## 1. Variantes de nommage et liens internes

Artefact AFTU : `aftu-official-route-pages.json`, run GitHub Actions `43561685704`, généré le 14 novembre 2026 à 05:28:56 UTC.

- L'index officiel traité par l'extracteur est `https://aftu-senegal.org/infos-pratiques/`.
- 63 liens de fiches ont été extraits de l'index ; les pages additionnelles 27 et 36 ont été ajoutées séparément.
- Les sept URL canoniques testées pour 84, 85, 86, 87, 88, 89 et 91 ont renvoyé HTTP 404.
- La liste des slugs effectivement récupérés ne contient ni variante 84A/84B, ni 84-bis, ni variante équivalente pour 85–89 ou 91.

**Limite à conserver :** l'artefact ne contient ni copie du sitemap XML, ni HTML brut de l'index. Le script de collecte extrait les liens internes `/map/dakar-urbain-ligne-…/`, mais ne télécharge pas les sitemaps. On ne peut donc pas affirmer qu'un sitemap a été exhaustivement contrôlé. Aucun slug alternatif vérifiable n'a été trouvé dans les données déjà récupérées.

## 2. Croisement inverse OSM / ArcGIS

### OpenStreetMap

Artefact : `dakar-osm-route-candidates.json`, run `43561685622`.

- 6 610 éléments OSM ont été examinés.
- Aucune relation de bus avec `ref=84`, `85`, `86`, `87`, `88`, `89` ou `91` n'est présente.
- La seule relation AFTU/Tata identifiée dans cet extrait est la relation 3982642, `ref=40`, `network=Tata`, `operator=Aftu`. Elle ne concerne pas les sept numéros recherchés.
- Quelques nœuds portent `network=AFTU` ou un nom générique d'arrêt Tata/AFTU, sans numéro de ligne exploitable. Ils ne peuvent pas être affectés aux lignes 84–91.

### ArcGIS

Artefact : `ddd-updated-service-candidates.json`, run `43561685593`.

- Le service extrait est explicitement un service DDD : `Dem_dikk_mise_a_jour`, avec 777 entités d'arrêts et 25 entités de lignes.
- Les valeurs `Nom_Ligne` des arrêts sont des références DDD (par exemple 1, 2, 6, 9, 12, 16A/16B, 217, 218, 232), pas un catalogue AFTU.
- Aucune ligne 84–89 ou 91 n'est identifiable dans les attributs de lignes DDD comme preuve d'un tracé AFTU correspondant.

**Conclusion du croisement :** aucun tracé/arrêt OSM numéroté 84–89 ou 91, ni couche ArcGIS AFTU correspondante, n'est présent dans les artefacts audités.

## 3. Recherche de fusion ou renumérotation dans les 65 fiches AFTU

Comparaison textuelle des terminus/corridors officiels indexés pour les sept lignes avec les textes d'itinéraire des 65 fiches récupérées.

| Ligne en attente | Corridor affiché par l'index AFTU | Recoupements textuels dans les 65 fiches | Interprétation |
|---|---|---|---|
| 84 | UCAD – Jaxaay | UCAD dans 38, 58, 62 ; Jaxaay dans 45, 51, 52, 56, 65, 70, 74 | Axes partagés ; aucune preuve de fusion |
| 85 | Banoba – Liberté 5 | Liberté 5 dans 77 et 78 ; Banoba non retrouvé | Aucun remplacement démontré |
| 86 | Tournalou Boune – Toubab Dialaw | Aucun des deux terminus retrouvé exactement | Aucun remplacement démontré |
| 87 | Bambilor – Mosquée Massalikou Djinane | Bambilor dans 66 ; Massalikou Djinane non retrouvé | Axe partagé possible ; aucune preuve de fusion |
| 88 | MTOA – Liberté 5 | MTOA dans 37, 54, 73, 76, 81 ; Liberté 5 dans 77 et 78 | Axes partagés ; aucune preuve de fusion |
| 89 | Bargny – Croisement Niague (Cité SICAP) | Bargny dans 53, 60, 64, 68, 74 ; Croisement Niague dans 53, 73, 79 | Axes partagés ; aucune preuve de fusion |
| 91 | APIX – Dougar | APIX dans 37 ; Dougar non retrouvé | Aucun remplacement démontré |

Ces correspondances sont des occurrences de noms de lieux dans des corridors, pas des correspondances complètes de terminus, d'arrêts, d'ordre, d'opérateur ou de service. Elles ne justifient aucune renumérotation ni substitution automatique. Les changements liés au rabattement BRT/TER ne sont pas démontrés par ces seuls artefacts.

## 4. État des données dans le dépôt

- **Ligne 84 :** `src/data/aftu-84-directions.json` existe déjà. Le fichier porte `sourceStatus=user-provided-cetud-reference` et identifie explicitement la référence CETUD transmise au projet. Ce n'est pas une fiche AFTU récupérée via le lien 404.
- **Ligne 85 :** `src/data/aftu-85-directions.json` existe déjà avec `sourceStatus=user-provided-route-reference`. C'est une référence de parcours transmise au projet, distincte de la page officielle 404.
- **Lignes 86, 87, 88, 89 et 91 :** aucun fichier de parcours correspondant n'a été trouvé dans les données de l'extraction AFTU examinée. Conserver leur état `pending_missing_source` pour les détails non documentés. Les corridors affichés par l'index officiel peuvent rester enregistrés comme métadonnées de terminus, sans être transformés en séquences d'arrêts.

## Décision de consolidation

1. Ne créer aucun arrêt, sens retour, horaire ou fréquence pour 86, 87, 88, 89 et 91.
2. Ne pas écraser les données 84 et 85 déjà présentes ni leur provenance.
3. Ne pas assimiler les recoupements de terminus à une fusion ou à une renumérotation.
4. Garder les sept URL en anomalie source distincte ; la vérification sitemap reste non concluante faute de sitemap brut dans les artefacts actuels.
5. Poursuivre la consolidation DDD sur les comparaisons de séquences et géométries déjà auditées, sans modifier le socle TER/BRT.

Aucune écriture Supabase, aucun changement de données opérationnelles TER/BRT, aucun déploiement et aucune fusion de PR n'ont été effectués.


## Mise à jour après le nouvel audit officiel du 14 novembre 2026

Un nouvel audit de la page d'index AFTU et des liens de fiches a été exécuté sur le commit `ba4b2f9affe8b2fbf9df0fbc4f8415ddaa632b31` (workflow `43563127436`, artefact `14101142058`, génération 05:46:55 UTC).

La relecture directe de l'index officiel confirme explicitement les sept corridors suivants :

| Ligne | Corridor affiché dans l'index AFTU |
|---|---|
| 84 | UCAD – Jaxaay |
| 85 | Banoba – Liberté 5 |
| 86 | Tournalou Boune – Toubab Dialaw |
| 87 | Bambilor – Mosquée Massalikou Djinane |
| 88 | MTOA – Liberté 5 |
| 89 | Bargny – Croisement Niague (Cité SICAP) |
| 91 | APIX – Dougar |

Les sept URL canoniques de fiches détaillées ont encore renvoyé HTTP 404 dans l'exécution automatisée. L'index confirme donc les numéros et les corridors, mais pas les étapes intermédiaires, les arrêts nommés, l'ordre de passage, le sens retour ni les horaires. Le nouvel artefact recense 63 liens de fiches issus de l'index, 9 pages officielles additionnelles testées, 65 fiches avec texte d'itinéraire récupéré et 7 erreurs HTTP 404. Le statut global reste `PARTIAL_SOURCE_RESPONSE`.

**Correction de portée :** il ne faut plus dire que les sept lignes sont absentes de l'index officiel. Elles y figurent bien. Ce sont leurs pages détaillées qui restent indisponibles. Les corridors du tableau ci-dessus sont des métadonnées officielles confirmées ; ils ne constituent pas des séquences d'arrêts.

Les recoupements de terminus observés dans les 65 autres fiches ne prouvent toujours aucune fusion ou renumérotation. Les lignes 84 et 85 conservent leurs fichiers de parcours et leurs provenances déjà présentes dans le dépôt. Pour 86, 87, 88, 89 et 91, conserver `pending_missing_source` pour les détails non documentés, sans supprimer les corridors officiels affichés dans l'index.

Source primaire consultée : https://aftu-senegal.org/infos-pratiques/ (index officiel AFTU, vérifié le 14 novembre 2026).
