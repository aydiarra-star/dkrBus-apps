# Audit géographique du pôle UCAD — AFTU 24 et 83 — 16 novembre 2026

## Objet

Vérifier les arrêts AFTU 24 et 83 autour de l'Université Cheikh Anta Diop (UCAD), les comparer aux deux quais DDD déjà cartographiés et décider si une correspondance peut être activée dans le calculateur multimodal.

## Conclusion opérationnelle

- **AFTU 24 : desserte d'UCAD confirmée par l'itinéraire officiel, mais quai exact non géolocalisé.**
- **AFTU 83 : conflit majeur entre le catalogue officiel et la page détaillée officielle ; ne pas rattacher à UCAD sans clarification.**
- **DDD UCAD : deux quais directionnels distincts sont déjà référencés dans OSM, à conserver séparément.**
- **Aucune nouvelle correspondance AFTU ↔ DDD ne doit être activée à ce stade.**

## AFTU 24

Le catalogue officiel AFTU présente la ligne 24 sous l'intitulé « UCAD – Notaire Guédiawaye ».

La page détaillée officielle, datée du 21 mai 2026, décrit le parcours :
Terminus Notaire (Guédiawaye) – Sapeurs-pompiers de GW – prolongement rue 10 – route des Niayes – Tally Boubess – sortie Pikine – branche est autoroute – autoroute – échangeur de Hann – route du Front de Terre – avenue Bourguiba – rond-point Seydou N Tall – avenue Cheikh Anta Diop – terminus Université Cheikh Anta Diop.

Cette page confirme l'UCAD comme terminus de la ligne 24. Elle ne fournit toutefois aucune coordonnée de quai ni aucune identification de la plateforme d'embarquement précise.

Moovit décrit également une direction Guédiawaye de 42 arrêts, dont « Ucad » et plusieurs arrêts sur l'avenue Cheikh Anta Diop. Cette source secondaire corrobore la desserte de l'université, mais ne doit pas remplacer la localisation du quai réel.

**Décision AFTU 24 :** desserte confirmée, point d'arrêt précis non confirmé. Ne pas déplacer le point sur le centre du campus et ne pas assimiler automatiquement un arrêt générique OSM « Arret Bus Aftu » à la ligne 24.

## AFTU 83

Le catalogue officiel AFTU affiche « UCAD – Jaxaay ».

En revanche, la page détaillée officielle de la ligne 83, datée du 14 juillet 2026, publie l'itinéraire suivant :
Terminus Rufisque Arafat – HLM Rufisque – Sedima – Station Keur Massar – Malika Plage – VDN 3 – rond-point Malibu – Cité Nations Unies – Case-Ba – pont de l'Émergence – Grand-Yoff – route de Front de Terre – CTO – terminus Zone de Captage.

L'itinéraire détaillé ne mentionne ni UCAD ni Jaxaay. Il est donc incompatible avec l'intitulé du catalogue.

**Décision AFTU 83 :** conflit de sources officiel/officiel. La ligne ne doit pas être géocodée à UCAD, et aucun arrêt UCAD ne doit lui être attribué, tant qu'AFTU n'a pas clarifié la version correcte de son itinéraire.

## Quais DDD à UCAD

Deux nœuds OSM distincts sont identifiés comme arrêts UCAD du réseau Dakar Dem Dikk :

| Repère | Coordonnées | Objet OSM | Interprétation |
|---|---:|---|---|
| UCAD – quai DDD A | 14.69324, -17.46207 | node 4666430963 | Arrêt DDD / plateforme |
| UCAD – quai DDD B | 14.69308, -17.46216 | node 4666430964 | Arrêt DDD / plateforme opposée |

Les deux points sont distants d'environ 20 m à vol d'oiseau. Ils doivent rester deux arrêts distincts afin de préserver les directions et éviter de fusionner les quais opposés.

## Arrêts AFTU candidats à proximité

Deux nœuds OSM nommés « Arret Bus Aftu » sont visibles dans le secteur :

| Repère | Coordonnées | Objet OSM | Réserve |
|---|---:|---|---|
| Arrêt AFTU candidat 1 | 14.69106, -17.45971 | node 4666430962 | Le réseau et l'opérateur OSM sont renseignés « Dakar Dem Dikk », malgré le nom « Aftu » |
| Arrêt AFTU candidat 2 | 14.69072, -17.45896 | node 4666430961 | Même ambiguïté de tags : réseau/opérateur « Dakar Dem Dikk » |

Ces nœuds ne peuvent pas être considérés comme des quais AFTU confirmés. Leur nom seul ne suffit pas, et leurs métadonnées OSM se contredisent. Leur proximité relative avec les quais DDD ne prouve ni une desserte par AFTU 24, ni une desserte par AFTU 83, ni un cheminement piéton entre plateformes.

## Correspondances

**Aucune correspondance AFTU ↔ DDD à UCAD n'est ajoutée.**

Motifs :
1. Le quai DDD directionnel est identifiable, mais le quai AFTU 24 n'est pas géolocalisé avec certitude.
2. Les deux nœuds « Arret Bus Aftu » ont des tags d'opérateur/réseau contradictoires.
3. La ligne 83 présente une contradiction entre le catalogue et sa page détaillée officielle.
4. Aucun chemin piéton quai-à-quai n'a été vérifié.

Ne pas utiliser `walkM: 0`, ne pas calculer une distance piétonne depuis les seuls centres de points, et ne pas créer de transfert par proximité automatique.

## Éléments requis pour lever les réserves

- Confirmation par AFTU du parcours actuel de la ligne 83.
- Identification du quai réellement utilisé par la ligne 24 à UCAD.
- Attribution vérifiée des deux nœuds OSM « Arret Bus Aftu » (opérateur, réseau, lignes desservies).
- Entrées et cheminement piéton entre les plateformes AFTU et DDD, dans chaque sens.

## Sources

### AFTU
- Catalogue officiel : https://aftu-senegal.org/infos-pratiques/
- Page détaillée officielle AFTU 24 : https://aftu-senegal.org/map/dakar-urbain-ligne-24/
- Page détaillée officielle AFTU 83 : https://aftu-senegal.org/map/dakar-urbain-ligne-83/

### Sources secondaires de parcours
- Moovit, AFTU 24 : https://moovitapp.com/index/fr/transport_en_commun-line-24-Dakar-5996-1618038-18051446-1
- Transitrun, AFTU 24 : https://transitrun.com/fr/public-transit-line_24_226920

### Cartographie OSM (via Mapcarta)
- Quai UCAD DDD — node 4666430963 : https://mapcarta.com/fr/N4666430963
- Quai UCAD DDD — node 4666430964 : https://mapcarta.com/fr/N4666430964
- Arrêt candidat « Arret Bus Aftu » — node 4666430962 : https://mapcarta.com/fr/N4666430962
- Arrêt candidat « Arret Bus Aftu » — node 4666430961 : https://mapcarta.com/fr/N4666430961

## Périmètre de modification

Documentation uniquement. Aucun changement de code, d'arrêt actif, de ligne, de tracé, d'horaire, de correspondance ou de données TER/BRT.
