# Audit de cohérence des corridors AFTU du calculateur

Date : 16 novembre 2026  
Branche : `docs/audit-aftu-corridor-coherence-2026-11-16`  
Périmètre : comparaison en lecture seule des corridors simplifiés de `src/domain/corridors.ts` avec le catalogue officiel AFTU. Aucun itinéraire n'est modifié dans cette étape.

## Résultat principal

Le catalogue officiel AFTU confirme plusieurs dessertes et terminus qui ne correspondent pas exactement aux séquences simplifiées actuellement utilisées par le calculateur. Ces écarts ne doivent pas être interprétés comme des itinéraires exacts.

### Ligne AFTU 1

- Catalogue officiel : **Lat Dior – HLM Grand Yoff**.
- Corridor actuel : `aftu-3`, affiché « AFTU 1 », séquence `Lat Dior → Petersen → Colobane → Parcelles → Diamalaye`.
- Écart : le terminus officiel HLM Grand Yoff n'est pas représenté ; plusieurs arrêts intermédiaires du corridor ne sont pas prouvés par la fiche de la ligne 1.
- Décision : ne pas présenter la séquence actuelle comme un tracé complet ou fidèle de la ligne 1. Identifier les arrêts intermédiaires et le quai HLM Grand Yoff avant correction.

### Ligne AFTU 53

- Catalogue officiel : **Keur Massar (Marché) – Terminus Sébikotane**, via notamment P11, Tivaouane Peulh, Niacourab, Niagues, Keur Ndiaye Lo, Hôpital Youssou Mbargane, Dangou, Sonadis, Sococim, Bargny et Diamniadio.
- Corridor actuel : `aftu-2`, affiché « AFTU 53 », séquence `Keur Massar → Pikine → Rufisque → Lat Dior`.
- Écart majeur : le terminus officiel Sébikotane est absent et Lat Dior est ajouté à la place ; la séquence ne reflète pas l'itinéraire officiel publié.
- Décision : cette séquence ne doit pas être considérée comme une représentation fiable de la ligne 53. Reconstituer la liste ordonnée des arrêts à partir des sources de l'opérateur et de repères géographiques vérifiables avant de l'utiliser pour calculer des trajets.

### Ligne AFTU 42

- Catalogue officiel : **Gadaye (Guédiawaye) – Ouakam Baye**.
- Corridor actuel : `aftu-1`, affiché « AFTU 42 », long nom « Gadaye ↔ Ouakam ».
- Écart : le libellé « Ouakam » est trop générique par rapport au terminus publié « Ouakam Baye » ; les arrêts intermédiaires simplifiés ne sont pas attestés par cette seule fiche.
- Décision : conserver l'identifiant de ligne 42, mais préciser le terminus « Ouakam Baye » dans le référentiel après vérification du point exact. Ne pas déduire les arrêts intermédiaires du seul nom des quartiers.

## Règles de correction proposées

1. Une fiche officielle qui donne seulement les deux terminus ne suffit pas à reconstruire les arrêts intermédiaires.
2. Ne pas remplacer un terminus officiel par un quartier voisin (ex. Lat Dior à la place de Sébikotane).
3. Ne pas utiliser une ligne simplifiée comme preuve d'une correspondance physique entre réseaux.
4. Conserver les anciens points cartographiques comme candidats séparés tant que leur attribution à une ligne n'est pas confirmée.
5. Le nom public reste **AFTU** ; aucune marque TATA distincte ne doit apparaître dans l'interface.
6. Aucun changement ne doit être apporté aux tracés, arrêts, horaires ou fréquences TER/BRT dans le cadre de cet audit.

## Étapes suivantes

1. Reconstituer d'abord les séquences AFTU 1, 42 et 53 à partir des fiches détaillées de l'opérateur.
2. Associer chaque arrêt à un point cartographique vérifiable, en conservant les sens aller et retour séparés.
3. Ajouter des tests de cohérence entre numéro de ligne, terminus officiels et séquences déclarées.
4. N'activer les correspondances DDD/AFTU qu'après vérification des quais et du cheminement piéton.

## Sources

- AFTU Sénégal, catalogue officiel des lignes : https://aftu-senegal.org/infos-pratiques/
- AFTU Sénégal, fiche détaillée de la ligne 53 : https://aftu-senegal.org/map/dakar-urbain-ligne-53/
- AFTU Sénégal, fiche détaillée de la ligne 34 (repère complémentaire pour Lat Dior) : https://aftu-senegal.org/map/dakar-urbain-ligne-34/

## Périmètre de cet ajout

- Documentation seulement ; aucun changement de code ou de données actives.
- Aucun transfert supplémentaire activé.
- Aucun changement TER/BRT.
- GTFS n'est pas un prérequis.
