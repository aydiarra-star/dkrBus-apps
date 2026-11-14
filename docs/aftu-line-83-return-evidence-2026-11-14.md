# Ligne AFTU 83 — séquences aller et retour validées

Date : 14 novembre 2026

## Validation des deux directions

Les listes détaillées ci-dessous ont été transmises par le responsable du projet comme données CETUD et explicitement validées pour intégration. Elles sont conservées dans leur ordre d'origine, sans suppression des doublons ni normalisation des libellés.

- Aller : 93 occurrences, de « Sonadis près du Jardin En Face Hôtel De Ville (Départ) » à « Zone De Captage (Terminus) ».
- Retour : 90 occurrences, de « Zone De Captage (Départ) » à « Rufisque Ville Devant La Boutique Orange À Coté De La Mairie (Terminus) ».
- Fréquence déclarée : 11 minutes.

Les deux sens sont stockés séparément dans `src/data/aftu-83-directions.json`. Les anciennes 14 étapes synthétiques de la fiche opérateur et les huit repères tarifaires ne remplacent plus les listes directionnelles validées.

## Règles de conservation

- Les répétitions explicites sont conservées : par exemple « Malika Plage Vdn » apparaît deux fois à l'aller, « Terrain De Football Zone De Captage » deux fois au retour et « Terminus Malika » deux fois au retour.
- Les variantes de noms entre les deux sens restent distinctes.
- La fréquence de 11 minutes est enregistrée comme intervalle de ligne.
- Aucun horaire individuel par arrêt, aucune coordonnée et aucune géolocalisation ne sont fabriqués.
- La plage générale CETUD 05:30–22:00 reste une information réseau distincte de la fréquence de ligne.

## Provenance

Source déclarée : CETUD — listes aller/retour et fréquence transmises puis validées par le responsable du projet. Les listes détaillées fournies pour ce chantier constituent la référence d'intégration. La fiche publique AFTU et l'ancien document tarifaire avaient précédemment permis de repérer le corridor, mais ils ne sont plus utilisés pour reconstituer artificiellement les arrêts maintenant que les deux séquences complètes ont été fournies.

## Résultat technique

- Les deux directions sont exposées par l'adaptateur d'audit AFTU.
- Les tests verrouillent les volumes 93/90, les terminus, la fréquence 11 min et quelques doublons représentatifs.
- La ligne 83 n'est plus classée parmi les lignes détaillées dont le retour est absent.
