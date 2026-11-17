# Audit géospatial des repères AFTU 53 — Keur Massar à Sébikotane

Date : 16 novembre 2026  
Branche : `docs/aftu53-geospatial-anchor-audit-2026-11-16`  
Base : `069fe6685cbdbe72cee8bdc228be599b3c7ad4fa`  
Périmètre : géolocalisation de repères territoriaux et d'objets cartographiques associés à la séquence officielle AFTU 53. Recherche documentaire uniquement : aucun arrêt actif, tracé, horaire, transfert ou calculateur n'est modifié.

## 1. Référence officielle de parcours

La fiche officielle AFTU 53 publie la séquence suivante :

**Keur Massar (Marché) → terminus P11 → croisement Tivaouane Peulh → SAFCO → Niacourab → croisement Niagues → Ndiakhirate → Keur Ndiaye Lo → hôpital Youssou Mbargane → Dangou → Sonadis → Poste Courant → Sococim → Bargny → Diamniadio → terminus Sébikotane.**

Source opérateur : https://aftu-senegal.org/map/dakar-urbain-ligne-53/  
La même séquence apparaît dans le document de tarification de 2020 : https://cafeactu.com/wp-content/uploads/2020/07/TARIFICATION-DES-LIGNES.pdf  
Une plateforme de covoiturage reprend les arrêts et le sens Keur Massar ⇔ Sébikotane : https://www.covoiturage.sn/bus-tata-itineraire/ligne/53/keur-massar/sebikhotane/

La fiche AFTU actuelle reste la source prioritaire pour le nom de ligne et l'ordre des repères. Les sources secondaires corroborent la séquence, mais ne prouvent pas à elles seules la position des quais.

## 2. Ancrages géographiques retrouvés

Les coordonnées ci-dessous sont celles d'objets OSM ou de lieux cartographiques Mapcarta. **Un centre de village, un équipement ou un repère de quartier n'est pas un arrêt de bus.** Ces coordonnées servent à cadrer les recherches et à vérifier l'axe général ; elles ne doivent pas être injectées comme arrêts voyageurs ni reliées par des segments droits.

| Repère de la fiche AFTU 53 | Objet cartographique candidat | Coordonnées (lat, lon) | Qualification |
|---|---|---:|---|
| Terminus P11 | Terminus Dakar Dem Dikk P11, OSM node 5286379845 | 14.78556, -17.30891 | Gare routière cartographiée ; coïncidence avec le terminus AFTU P11 non confirmée |
| Croisement Tivaouane Peulh | Arrêt « Route de Tivavouane Peulh », OSM node 4684989789 | 14.78922, -17.29302 | Arrêt de bus cartographié ; attribution à AFTU 53 non prouvée |
| Tivaouane Peulh | Localité Tivaouane Peul, OSM node 2447151791 | 14.80535, -17.28099 | Centre de localité, pas un quai |
| Niacourab | Village Niacourab, OSM node 5347945415 | 14.78385, -17.27373 | Centre de village, pas un quai |
| Ndiakhirate | Ndiakhirate Digue, OSM node 2265123690 | 14.76881, -17.22725 | Localité candidate ; identité avec le point d'arrêt « Ndiakhirate » à vérifier |
| Keur Ndiaye Lo | Village Keur Ndiaye Lo, OSM node 2265122389 | 14.74311, -17.24378 | Centre de village, pas un quai |
| Hôpital Youssou Mbargane | Centre Hospitalier Youssou Mbargane Diop, OSM way 166815845 | 14.72622, -17.25971 | Équipement localisé ; arrêt AFTU exact non identifié |
| Dangou | Localité Dangou | 14.71998, -17.27012 | Centre de localité, pas un quai |
| Sococim | Parking Sococim, OSM way 179786220 | 14.70868, -17.25275 | Objet de parking avec accès restreint ; ne pas le traiter comme arrêt public |
| Bargny | Ville de Bargny, OSM node 1250211868 | 14.69380, -17.22970 | Centre de ville, pas un quai |
| Bargny (repère secondaire) | Marché Central de Bargny, OSM way 237459799 | 14.69380, -17.22922 | Marché cartographié ; la fiche dit « Bargny », pas « marché » : arrêt exact non confirmé |
| Diamniadio | Ville de Diamniadio, OSM node 3303351290 | 14.72022, -17.18424 | Centre de ville, pas un quai |
| Terminus Sébikotane | Marché de Sébikotane, OSM way 223688861 | 14.74521, -17.13409 | Marché cartographié ; terminus AFTU non prouvé au milieu du marché |

## 3. Repères non localisés au niveau d'arrêt

La recherche n'a pas établi de point d'arrêt précis et suffisamment attribué à la ligne pour les éléments suivants :

- Terminus « Keur Massar (Marché) » : plusieurs marchés et terminus existent dans le secteur ; ne pas substituer automatiquement le terminus P11 ou un marché d'unité.
- Cité SAFCO : la localité est connue, mais le quai exact de la ligne 53 n'est pas identifié.
- Croisement Niagues : aucun objet exact suffisamment fiable et attribué à l'arrêt AFTU 53 n'a été établi.
- Sonadis : les résultats trouvés confirment le secteur Rufisque Sonadis, mais pas le point de prise en charge de la ligne 53.
- Poste Courant : repère de la fiche AFTU, quai et coordonnées non identifiés.

## 4. Contrôle de cohérence spatiale

Les ancrages disponibles sont compatibles avec une desserte qui part de Keur Massar vers l'est et le sud-est, traverse les secteurs de Niacourab, Ndiakhirate et Keur Ndiaye Lo, rejoint Rufisque/Bargny, puis continue vers Diamniadio et Sébikotane.

Cela ne constitue **pas** une reconstruction de la chaussée empruntée. Les centres de localités peuvent être éloignés des axes routiers et des arrêts. Les points P11 et « Route de Tivaouane Peulh » sont des objets de transport cartographiés, mais leur attribution à la ligne AFTU 53 reste à démontrer. Le terminus P11 de Dakar Dem Dikk ne doit pas être fusionné avec celui de l'AFTU sans preuve d'un quai ou d'une aire partagée.

## 5. Décisions de données

1. Conserver la séquence officielle AFTU 53 comme preuve de parcours, avec statut de revue humaine.
2. Ne pas remplacer le terminus officiel Sébikotane par Lat Dior, Rufisque ou Diamniadio.
3. Ne pas transformer les coordonnées de villages, marchés, hôpitaux ou installations industrielles en arrêts voyageurs.
4. Ne pas tracer une polyligne en reliant les centres de lieux par segments droits.
5. Ne pas déduire le sens retour par simple inversion de la séquence publiée ; rechercher une source distincte.
6. Ne pas activer de correspondance avec TER, BRT, DDD ou une autre ligne sur la seule base de ces ancrages.
7. Garder le libellé public **AFTU** ; ne pas afficher TATA comme réseau distinct.
8. Ne modifier aucune donnée TER/BRT, leurs tracés, leurs arrêts ou leurs horaires.
9. GTFS n'est pas un prérequis à cette étape.

## 6. Étapes suivantes

1. Obtenir ou vérifier le point réel du terminus AFTU « Keur Massar (Marché) ».
2. Vérifier sur place ou avec une source opérateur le quai AFTU du terminus P11 et celui du croisement Tivaouane Peulh.
3. Identifier les points d'arrêt de SAFCO, Niacourab et Niagues, sans confondre localités et quais.
4. Identifier séparément les quais de Ndiakhirate, Keur Ndiaye Lo, hôpital Youssou Mbargane, Dangou, Sonadis et Poste Courant.
5. Vérifier si « Sococim » désigne un arrêt public sur la voie, et non le parking industriel à accès restreint.
6. Relever les arrêts exacts de Bargny, Diamniadio et Sébikotane, puis obtenir la séquence du retour.
7. Une fois les arrêts confirmés, confronter les points aux géométries OSM et construire la route sur le réseau routier réel.

## Sources cartographiques

- Route de Tivaouane Peulh, arrêt OSM : https://mapcarta.com/fr/N4684989789
- Tivaouane Peul, localité : https://mapcarta.com/17537042
- Niacourab : https://mapcarta.com/fr/N5347945415
- Ndiakhirate Digue : https://mapcarta.com/N2265123690
- Keur Ndiaye Lo : https://mapcarta.com/fr/16845884
- Centre Hospitalier Youssou Mbargane Diop : https://mapcarta.com/fr/W166815845
- Dangou : https://mapcarta.com/fr/17537280
- Parking Sococim : https://mapcarta.com/fr/W179786220
- Bargny : https://mapcarta.com/fr/16853986
- Marché Central de Bargny : https://mapcarta.com/fr/W237459799
- Diamniadio : https://mapcarta.com/fr/17536958
- Marché de Sébikotane : https://mapcarta.com/fr/W223688861
- Terminus Dakar Dem Dikk P11 : https://mapcarta.com/fr/N5286379845

## Périmètre de cet ajout

- Document d'audit uniquement ; aucun code ou jeu de données actif modifié.
- Aucun arrêt voyageur créé.
- Aucun corridor ou transfert modifié.
- Aucune donnée TER/BRT touchée.


## Addendum — corroboration cartographique Moovit consultée le 17 novembre 2026

Une source secondaire Moovit expose une fiche de la ligne AFTU 53 avec **96 arrêts dans chaque direction** et un plan PDF de ligne. Le PDF décrit une carte générale qui passe par les secteurs de Rufisque/Jaxaay, Keur Massar, Niaga et Sébikhotane. La liste publiée comprend plusieurs repères nommés (École/CEM/Marché de Niaga, École Keur Massar, routes de Diakhaye, Lycée Jaxaay, Stade Diouf, Cimetière de Bargny, Hôtel de Ville et Hôpital de Diamniadio), mais aussi de nombreux libellés génériques « Arrêt de bus ».

**Écart de terminus à conserver :** la page officielle AFTU du 6 juillet 2026 donne « Terminus Keur Massar (Marché) » comme départ et « Terminus Sébikhotane » comme arrivée. La fiche Moovit présente la ligne sous le nom « Lac Rose – Sébikhotane » et utilise les libellés « Terminus 53 - 315 » / « Arrêt de bus » pour ses directions. Ce rapprochement n'est pas résolu ; le libellé et la séquence AFTU officielle restent prioritaires. Moovit est une source secondaire de repères, pas une preuve de quai ni de terminus opérateur.

Le plan PDF ne fournit pas, dans son texte exploitable, une géométrie routière géoréférencée ni des coordonnées de chaque arrêt. Il ne peut donc pas être converti directement en polyligne de calculateur. Les 96 entrées ne doivent pas être géocodées automatiquement, notamment les libellés génériques. Elles constituent une nouvelle liste de contrôle pour retrouver les arrêts réels sur OSM et les ways routiers.

Sources :
- Fiche officielle AFTU 53, publiée le 6 juillet 2026 : https://aftu-senegal.org/map/dakar-urbain-ligne-53/
- Fiche Moovit AFTU 53 et liste de 96 arrêts : https://moovitapp.com/index/fr/transport_en_commun-line-53-Dakar-5996-1618038-18051484-1
- Plan PDF Moovit : https://appassets.mvtdev.com/map/48/l/5996/18051484.pdf

Décision : conserver cette source secondaire pour le rapprochement de repères uniquement ; aucun arrêt, aucune géométrie, aucun retour ni horaire n'est activé dans le réseau passager à partir de cet addendum.
