# Séquences AFTU relevées sur le catalogue officiel — 16 novembre 2026

Source consultée : catalogue officiel AFTU, https://aftu-senegal.org/infos-pratiques/ et ses liens « Voir itinéraire ».  
Portée : transcription des séquences affichées sur les fiches de lignes, pas validation terrain des quais.

## Pourquoi ce relevé est utile

Le catalogue AFTU donne des terminus, tandis que certaines fiches « Voir itinéraire » donnent des listes d'arrêts ordonnées. Ces listes peuvent servir à enrichir le graphe, mais elles ne fournissent pas toutes des coordonnées de quais. Il faut géocoder chaque arrêt séparément et vérifier que le numéro de ligne du catalogue correspond bien à la fiche détaillée.

## Séquences détaillées relevées

### Ligne 53 — Keur Massar vers Sébikotane

Terminus Keur Massar (Marché) → Terminus P11 → Croisement Tivaouane Peulh → Cité SAFCO → Niacourab → Croisement Niagues → Ndiakhirate → Keur Ndiaye Lo → Hôpital Youssou Mbargane → Dangou → Sonadis → Poste Courant → Sococim → Bargny → Diamniadio → Sébikotane.

**Ancrages géographiques disponibles :**
- Terminus Keur Massar (Marché) : gare routière OSM way 335756472, centre approximatif 14.76984, -17.31840.
- Tivaouane Peul : village OSM node 2447151791, 14.80535, -17.28099 (localité, pas quai).
- Keur Ndiaye Lo : village OSM node 2265122389, 14.74311, -17.24378 (localité, pas quai).
- Sonadis : la Pharmacie Astele est décrite « en face arrêt Sonadis », OSM node 2108333848, 14.71591, -17.27366 ; c'est un repère opposé à l'arrêt, pas la coordonnée certifiée du quai.
- Sébikotane : centre de localité OSM/GeoNames, 14.74075, -17.13908 (localité, pas terminus exact).

### Ligne 55 — Sonadis Rufisque vers Petersen

Terminus Sonadis Rufisque → Boulevard Maurice Guèye → RN1 → Keur Mbaye Fall → Croisement Keur Massar → Poste Thiaroye → Bountou Pikine → Croisement Cambérène → Échangeur Patte d'Oie → Autoroute → Avenue Malick Sy → Allées Papa Gueye Fall → Terminus Petersen.

Cette séquence confirme une liaison longue Rufisque–Petersen passant par Keur Mbaye Fall et le croisement Keur Massar. Elle ne signifie pas que la gare TER Keur Mbaye Fall et le terminus bus Keur Massar sont le même lieu.

### Ligne 74 — Bargny gare ferroviaire vers Cité Cocehas

Bargny (Gare Ferroviaire) → Colobane Rufisque → Poste Courant → RN1 → Boulevard Maurice Guèye → Rond-point Djouti Ba Rufisque → Route HLM Rufisque → Échangeur Rufisque Ouest → Route de Jaxaay → Rond-point Station Shell Keur Massar → Terminus Keur Massar → Tivaouane Peulh → Cité Socabeg → Terminus Cité Cocehas.

**Ancrages géographiques disponibles :**
- Gare TER Bargny : OSM node 9373876214, 14.69821, -17.22918. La fiche AFTU nomme explicitement « Bargny (Gare Ferroviaire) » comme terminus de la ligne 74 : candidat de correspondance TER/AFTU à vérifier au niveau du quai.
- Station Shell Keur Massar : OSM node 3103803311, 14.77352, -17.31678. La fiche AFTU précise le rond-point de cette station ; la station-service est un repère, pas automatiquement le point d'arrêt du bus.
- Tivaouane Peul : OSM node 2447151791, 14.80535, -17.28099 (localité, pas quai).

### Ligne 76 — Terminus SIPRES vers Cité Assurance

Terminus SIPRES → Rond-point Liberté 6 → Marché Grand Yoff → Patte d'Oie → Croisement Cambérène → Bountou Pikine → Poste Thiaroye → Fass Mbao → Mbedou Fass → MTOA → Station Keur Massar → Terminus Cité Assurance.

### Ligne 77 — Rufisque Cité Tacco vers Liberté 5

Terminus Rufisque Cité Tacco → Pont Dangou → Sonadis Rufisque → Boulevard Maurice Guèye → Rond-point Djouti Ba → RN1 → Keur Mbaye Fall → Croisement Keur Massar → Poste Thiaroye → Bountou Pikine → Croisement Cambérène → Échangeur Hann → Route Front de Terre → Terminus Liberté 5.

Cette séquence identifie des points distincts à Rufisque : Cité Tacco, Pont Dangou, Sonadis. Il ne faut pas les fusionner dans un unique point générique « Rufisque ».

## Conflits internes à résoudre avant activation

Le catalogue et les fiches détaillées AFTU ne sont pas parfaitement cohérents :

- Le catalogue associe la ligne **78** à Sangalkam ↔ Camberène ; la fiche détaillée ouverte sous le numéro 78 affiche un parcours commençant à Diamaguène et se terminant à Cité Gendarmerie.
- Le catalogue associe la ligne **59** à Colobane ↔ Bargny ; la fiche détaillée ouverte sous le numéro 59 affiche un parcours Diamalaye/Parcelles/Guédiawaye/Thiaroye/Yeumbeul/Keur Massar/Cité Gendarmerie.

Ces deux fiches ne doivent pas être importées sous les numéros 59 et 78 tant que l'AFTU n'a pas confirmé le bon appariement ligne ↔ fiche. La ligne 78 Sangalkam ne doit donc pas être considérée comme géocodée à partir de cette fiche.

## Plan d'intégration sûr

1. Importer les séquences textuelles avec source, date de consultation et statut « à géocoder ».
2. Créer des points distincts pour les terminus nommés (Sonadis, Cité Tacco, Bargny Gare Ferroviaire, Keur Massar Marché, Cité Cocehas).
3. Géocoder les quais et arrêts, pas seulement les centres de localité ou les commerces de repère.
4. Contrôler l'ordre aller et obtenir le sens retour ; ne pas inverser automatiquement une boucle ou un service à terminus multiples.
5. Mesurer les correspondances piétonnes entre les quais réels.
6. N'activer les séquences dans `CORRIDOR_LINES` qu'après contrôle des coordonnées et des correspondances.
7. Conserver les horaires et tracés TER/BRT de référence inchangés.

## Références cartographiques

- Gare routière Keur Massar : https://mapcarta.com/fr/W335756472
- Terminus 52 : https://mapcarta.com/fr/N5286379847
- Shell Keur Massar : https://mapcarta.com/fr/N3103803311
- Tivaouane Peul : https://mapcarta.com/fr/17537042
- Keur Ndiaye Lo : https://mapcarta.com/fr/16845884
- Pharmacie Astele, repère en face de l'arrêt Sonadis : https://mapcarta.com/fr/N2108333848
- Sébikotane : https://mapcarta.com/16837096

**Important :** ces coordonnées sont des points de repère OSM ou des centres de localité. Elles ne certifient pas la position exacte du quai de chaque ligne.
