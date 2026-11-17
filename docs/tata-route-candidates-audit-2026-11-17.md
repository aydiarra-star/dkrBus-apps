# TATA — audit du catalogue de parcours disponible

Date du contrôle : 17 novembre 2026  
Fichier audité : `src/data/tata-lines.json`  
Données consultées : 10 novembre 2026

## Résultat de l'inventaire

- **62 lignes candidates** sont présentes dans le fichier.
- Les 62 entrées ont une séquence de repères.
- Total : **762 occurrences de repères**.
- 42 fiches proviennent de Covoiturage.sn.
- 20 fiches proviennent d'un article Xibaaru sur les tarifs.
- Aucune des 62 entrées ne possède une séquence retour distincte structurée dans ce fichier.

Ce sont des occurrences de repères textuels, pas 762 arrêts géolocalisés et validés. Les sources sont secondaires et ne suffisent pas à prouver qu'une ligne TATA est un service opérateur autonome ou qu'elle est différente d'une ligne AFTU.

## Décision de traitement

1. Conserver les 62 fiches comme **candidats de parcours**, avec leur source et leur date de consultation.
2. Ne pas afficher TATA comme un réseau opérateur distinct lorsqu'une fiche correspond en réalité à un minibus AFTU : conserver AFTU comme identité publique et garder TATA comme appellation/source de terrain.
3. Ne pas créer de retour en inversant les séquences aller ; aucune liste retour distincte n'est présente dans ce fichier.
4. Les 762 occurrences ne doivent pas être géocodées automatiquement à partir du seul nom de quartier ou de rue.
5. Rapprocher les fiches TATA des fiches AFTU ligne par ligne, sans fusionner deux lignes sur la seule similarité des terminus.
6. Les horaires et fréquences ne sont pas déduits de ce fichier ; le calculateur ne doit pas créer de compte à rebours par arrêt tant que les offsets directionnels ne sont pas disponibles.

## Priorités de rapprochement

- Commencer par les lignes ayant une fiche TATA détaillée et un corridor AFTU de même numéro.
- Garder les différences de terminus, les variantes de rues et les boucles comme conflits visibles.
- Identifier séparément les retours documentés par une source primaire ou une fiche directionnelle explicite.
- Conserver la source secondaire même si sa date est plus ancienne, à condition que sa provenance reste vérifiable ; une date plus récente ne remplace pas automatiquement une source mieux documentée.

## Sécurité

Audit de structure uniquement. Aucun arrêt passager, itinéraire, fréquence, horaire, correspondance, donnée TER/BRT ou donnée Supabase n'est modifié.
