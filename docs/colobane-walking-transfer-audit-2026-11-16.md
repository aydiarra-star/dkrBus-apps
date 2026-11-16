# Audit géographique du pôle de Colobane — 16 novembre 2026

## Objet

Vérifier si le pôle TER Colobane et la gare routière de Colobane peuvent être reliés dans le calculateur multimodal, sans créer une correspondance artificielle ni modifier les données TER/BRT existantes.

## Résultat synthétique

**Correspondance TER Colobane ↔ bus de Colobane : candidate, non activée.**

Les sources établissent la présence d'une gare TER à Colobane et d'une gare routière de Colobane. Elles ne donnent toutefois pas les accès voyageurs précis, les quais AFTU/DDD utilisés, ni un cheminement piéton vérifié entre les deux. La proximité géographique ne suffit donc pas à enregistrer une correspondance avec une distance ou un temps de marche fiable.

## Ancrages géographiques disponibles

| Objet | Coordonnées | Nature / fiabilité |
|---|---:|---|
| Gare TER Colobane | 14.70035, -17.44165 | Nœud OSM 10245681535, gare ferroviaire et station de transport public, opérateur SETER |
| Position ferroviaire | 14.70043, -17.44163 | Nœud OSM 9373889212, position d'arrêt ferroviaire |
| Gare routière de Colobane (géométrie surfacique) | 14.69793, -17.44303 | Way OSM 599927187, gare routière et station de transport public ; opérateur/réseau renseigné Dakar Dem Dikk |
| Gare routière de Colobane (nœud) | 14.69733, -17.44290 | Nœud OSM 560521498, gare routière et station de transport public |

Les deux objets OSM nommés « Gare Routière de Colobane » ne sont pas exactement au même point. Le way surfacique est l'ancrage le plus adapté pour représenter l'emprise du pôle ; le nœud ne doit pas être interprété comme le quai d'une ligne précise.

La distance à vol d'oiseau entre le point de la gare TER (14.70035, -17.44165) et le point représentatif du way de la gare routière (14.69793, -17.44303) est d'environ **307 m**. Ce chiffre n'est ni une distance piétonne, ni un temps de marche. Le chemin réel dépend des entrées, traversées, clôtures et accès voyageurs.

## Lignes AFTU dont le terminus ou l'intitulé officiel cite Colobane

Le catalogue officiel AFTU répertorie notamment :

- Ligne 30 : Gadaye (Guédiawaye) – Gare de Colobane.
- Ligne 32 : Colobane – Serigne Assane.
- Ligne 59 : Colobane – Bargny.
- Ligne 64 : Colobane – Jaxaay.
- Ligne 74 : Terminus Malika (Cité Sonatel) – Terminus gare routière Colobane.

**Précision importante :** la ligne 29 n'est pas présentée par le catalogue officiel comme une ligne terminus Colobane. Elle est donc exclue de la liste des terminus AFTU confirmés à Colobane. Les lignes 30, 32, 59, 64 et 74 sont les lignes du catalogue dont l'intitulé mentionne explicitement la gare ou le secteur de Colobane.

Le plan Moovit de la ligne 30 place « Gare de Colobane » en tête d'une direction et affiche 74 arrêts dans la liste consultée. Cette donnée secondaire confirme l'appellation d'arrêt, mais ne localise pas précisément le quai dans l'emprise de la gare routière.

## DDD

Les lignes DDD 18 et 20 ont été identifiées dans l'audit antérieur comme desservant le secteur de Colobane. Les sources consultées ici ne permettent pas d'attribuer leurs quais à un point GPS précis dans la gare routière. Ne pas transformer le centre du polygone de gare routière en quai DDD sans vérification terrain ou source d'arrêt explicite.

## Cheminement TER ↔ gare routière

État des preuves :

1. Les deux pôles sont localisés dans le secteur de Colobane.
2. La distance droite est d'environ 307 m entre les ancrages retenus.
3. Une source de presse décrit des accès voyageurs TER différents autour du pont de Colobane et une passerelle sur l'autre flanc ; cela confirme que l'accès TER n'est pas un point unique évident, mais ne décrit pas le trajet vers la gare routière.
4. Aucun itinéraire piéton continu, traversée autorisée, entrée exacte ou distance de marche fiable n'a été vérifié dans les sources disponibles.

**Décision :** ne créer aucun lien TER ↔ DDD/AFTU pour le moment. Ne pas utiliser walkM: 0, ni remplacer la marche réelle par les 307 m à vol d'oiseau. Ne pas afficher une correspondance automatique dans le calculateur.

## Éléments requis pour activer la correspondance

- Position précise de l'entrée voyageurs TER utilisée pour sortir vers la gare routière.
- Position des quais ou zones d'embarquement DDD et AFTU concernés.
- Chemin piéton praticable entre ces points, avec traversées et accès réels.
- Distance de marche mesurée sur le chemin, pas en ligne droite.
- Confirmation que les lignes sont effectivement accessibles depuis les zones identifiées dans les deux sens.

## Sources

### AFTU
- Catalogue officiel des lignes : https://aftu-senegal.org/infos-pratiques/
- Page AFTU de la ligne 30 : https://aftu-senegal.org/map/dakar-urbain-ligne-30/
- Plan Moovit de la ligne 30 (direction Gare de Colobane) : https://moovitapp.com/index/fr/transport_en_commun-map-30-Dakar-5996-1618038-18051443-1

### TER
- Page officielle gare TER Colobane : https://ter-senegal.sn/colobane/
- Gares TER : https://ter-senegal.sn/gares/

### Cartographie OSM (via Mapcarta)
- Gare routière — way 599927187 : https://mapcarta.com/fr/W599927187
- Gare routière — node 560521498 : https://mapcarta.com/fr/N560521498
- Gare TER — node 10245681535 : https://mapcarta.com/fr/N10245681535
- Position ferroviaire — node 9373889212 : https://mapcarta.com/N9373889212

### Contexte d'accès TER
- EnQuête+, article sur les accès et flux voyageurs à la gare de Colobane : https://www.enqueteplus.com/content/calvaire-au-niveau-des-gares-du-ter-les-joj-pas-que-du-jeu-pour-les-passagers-du-train

## Périmètre de modification

Documentation uniquement. Aucun changement de code, d'arrêt actif, de ligne, de tracé, d'horaire, de correspondance ou de données TER/BRT.