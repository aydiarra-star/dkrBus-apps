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

## Lignes AFTU : catalogue et pages détaillées

Le catalogue officiel AFTU affiche les intitulés suivants :
- Ligne 30 : Gadaye (Guédiawaye) – Gare de Colobane.
- Ligne 33 : Colobane – Serigne Assane.
- Ligne 59 : Colobane – Bargny.
- Ligne 64 : Colobane – Jaxaay.
- Ligne 74 : Terminus Malika (Cité Sonatel) – Terminus gare routière Colobane.

Les pages détaillées consultées ne concordent pas toutes avec ce catalogue :

| Ligne | Catalogue AFTU | Page détaillée AFTU consultée | Conclusion |
|---|---|---|---|
| 30 | Gadaye – Gare de Colobane | Gadaye – … – Terminus Gare de Colobane | Colobane confirmé par les deux sources |
| 33 | Colobane – Serigne Assane | Terminus Colobane – … – Terminus Serigne Assane | Colobane confirmé par les deux sources |
| 59 | Colobane – Bargny | Diamalaye – … – Cité Gendarmerie | Conflit de sources, ne pas géocoder la ligne à Colobane sur cette seule base |
| 64 | Colobane – Jaxaay | Diamniadio – … – Terminus Notaire | Conflit de sources, ne pas géocoder la ligne à Colobane sur cette seule base |
| 74 | Malika – Gare routière Colobane | Bargny (gare ferroviaire) – Colobane Rufisque – … – Keur Massar / Tivaouane Peul | Conflit de sources ; « Colobane Rufisque » ne doit pas être assimilé à la gare routière de Dakar |

La page détaillée de la ligne 30 place explicitement le terminus à la gare de Colobane. La page détaillée de la ligne 33 donne également Colobane comme terminus et cite le rond-point de Colobane dans sa séquence.

Le catalogue officiel ne donne pas de terminus Colobane à la ligne 29 ; elle n'est donc pas ajoutée à la liste.

Le plan Moovit de la ligne 30 place « Gare de Colobane » en tête d'une direction et affiche une liste d'arrêts. Cette donnée secondaire confirme l'appellation d'arrêt, mais ne localise pas précisément le quai dans l'emprise de la gare routière.

**Décision données AFTU :** seules les lignes 30 et 33 sont confirmées par concordance du catalogue et de la page détaillée. Les lignes 59, 64 et 74 restent en conflit documentaire et ne doivent pas être ajoutées au pôle Colobane avant clarification.

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
- Page détaillée ligne 30 : https://aftu-senegal.org/map/dakar-urbain-ligne-30/
- Page détaillée ligne 32 : https://aftu-senegal.org/map/dakar-urbain-ligne-32/
- Page détaillée ligne 33 : https://aftu-senegal.org/map/dakar-urbain-ligne-33/
- Page détaillée ligne 59 : https://aftu-senegal.org/map/dakar-urbain-ligne-59/
- Page détaillée ligne 64 : https://aftu-senegal.org/map/dakar-urbain-ligne-64/
- Page détaillée ligne 74 : https://aftu-senegal.org/map/dakar-urbain-ligne-74/
- Plan Moovit ligne 30 : https://moovitapp.com/index/fr/transport_en_commun-map-30-Dakar-5996-1618038-18051443-1

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