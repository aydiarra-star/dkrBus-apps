# Audit géographique — Dalal Jamm et Police des Parcelles — 16 novembre 2026

## Objet

Évaluer les correspondances potentielles entre AFTU, Dakar Dem Dikk (DDD) et le BRT autour de l'hôpital Dalal Jamm et de Police des Parcelles Assainies.

## Conclusion opérationnelle

- **Dalal Jamm : pôle BRT identifié dans OSM ; desserte AFTU 42 corroborée par une source secondaire au niveau de l'hôpital ; DDD 5 et 6 desservent l'hôpital Dalal Diam selon le site officiel DDD.**
- **Police des Parcelles : arrêt BRT identifié ; AFTU 42 passe par Police des Parcelles selon la page officielle AFTU ; DDD 5 et 6 mentionnent Police des Parcelles dans leurs séquences officielles.**
- **Aucune correspondance nouvelle n'est activée dans le calculateur.** Les quais DDD/AFTU précis et les chemins piétons quai-à-quai ne sont pas encore établis.

## Dalal Jamm

### BRT

OpenStreetMap identifie plusieurs objets BRT nommés Dalal Jamm :
- node 11739850117, stop_position, réseau SunuBRT : 14.77120, -17.40850 ;
- node 11739850119, platform, réseau SunuBRT : 14.77121, -17.40852 ;
- node 13377966028 : 14.77197, -17.40818 ;
- node 11739850118, stop_position : 14.77198, -17.40820.

Ces points sont des objets de cartographie BRT ; ils ne doivent pas être fusionnés arbitrairement en un seul quai. La paire stop_position/platform à environ 1–2 mètres représente vraisemblablement les deux objets cartographiques d'un même accès, tandis que les points plus au nord-est doivent rester séparés tant que leur relation directionnelle n'est pas vérifiée.

### AFTU 42

La page officielle AFTU 42 décrit le parcours Gadaye – Ouakam Baye, avec notamment la route des Niayes, Case Ba, Police des Parcelles, VDN et Ouakam. La page officielle ne nomme pas explicitement un quai AFTU à l'hôpital Dalal Jamm.

La liste d'arrêts secondaire de Transitrun/Moovit pour le sens Stade Municipal – Arrêt de Bus mentionne « Hopital Dallal Jamm » et « Route Bethio / Bvar. Tall ». Cela corrobore une desserte de la zone par la ligne 42, mais ne permet pas de placer un arrêt AFTU précis ni de conclure à une correspondance directe avec le BRT.

### DDD 5 et 6

Le site officiel Dakar Dem Dikk mentionne « Hôpital Dalal Diam » dans les séquences des lignes de banlieue 5 et 6. Il ne fournit pas, dans cette séquence textuelle, les coordonnées du quai exact. L'appellation « Dalal Diam » de la page DDD est conservée telle quelle ; elle n'est pas normalisée automatiquement en nom d'arrêt GPS.

**Décision Dalal Jamm :** pôle BRT géolocalisé, présence des lignes DDD 5/6 et AFTU 42 dans le secteur documentée, mais pas de transfert automatique. Il faut identifier les quais réellement utilisés et mesurer le cheminement piéton.

## Police des Parcelles Assainies

### BRT

OSM/Mapcarta identifie trois objets portant le nom Police des Parcelles :
- node 11739848231, platform + bus_stop : 14.75074, -17.43963 ;
- node 11739848232, stop_position : 14.75072, -17.43963 ;
- node 11739848233, stop_position : 14.75108, -17.43879.

Ils appartiennent au réseau SunuBRT. Ne pas confondre le stop_position et la plateforme, ni supposer que tous les objets correspondent à des quais indépendants.

### AFTU 42

La page officielle AFTU de la ligne 42 mentionne explicitement « Police des Parcelles Assainies » dans son parcours entre Case Ba et la route du stade LSS. La desserte du secteur est donc confirmée par la source officielle, mais la page ne fournit pas la position GPS du quai AFTU ni son entrée.

### DDD 5 et 6

Le site officiel DDD liste « Police de Parcelles Assainies – Pont Sénégal 92 (Pont de l'émergence) » dans la ligne 5 et « Police de Parcelles Assainies – Marché Grand Médine » dans la ligne 6. Ces séquences confirment la desserte du secteur par les deux lignes, sans préciser les quais ou les côtés de rue.

**Décision Police des Parcelles :** convergence de desserte BRT, AFTU 42 et DDD 5/6 au niveau du secteur. La correspondance est prometteuse, mais reste non activée faute de quais bus exacts et de chemin piéton vérifié.

## Distances et cheminements

Aucune distance piétonne n'est publiée dans cet audit. Les coordonnées de plateformes BRT ne doivent pas être comparées à des centres d'hôpital ou à des points génériques de quartier pour inventer un temps de marche.

Avant toute activation, vérifier :
1. quai AFTU réellement utilisé et côté de rue ;
2. quai DDD réellement utilisé et sens de circulation ;
3. entrée voyageurs BRT et traversées autorisées ;
4. continuité et accessibilité du chemin piéton ;
5. distance mesurée sur le chemin, séparément pour chaque paire de quais.

Ne pas utiliser `walkM: 0` et ne pas créer de transfert sur la seule base d'un nom de quartier ou d'une proximité cartographique.

## Sources

### AFTU
- Catalogue officiel : https://aftu-senegal.org/infos-pratiques/
- Page officielle AFTU 42 : https://aftu-senegal.org/map/dakar-urbain-ligne-42/

### Dakar Dem Dikk
- Réseau urbain et banlieue, séquences officielles lignes 5 et 6 : https://demdikk.sn/reseau-urbain-dakar/

### BRT / cartographie
- Dalal Jamm — node 11739850117 : https://mapcarta.com/fr/N11739850117
- Dalal Jamm — node 11739850119 : https://mapcarta.com/fr/N11739850119
- Dalal Jamm — node 13377966028 : https://mapcarta.com/fr/N13377966028
- Dalal Jamm — node 11739850118 : https://mapcarta.com/fr/N11739850118
- Police des Parcelles — node 11739848231 : https://mapcarta.com/fr/N11739848231
- Police des Parcelles — node 11739848232 : https://mapcarta.com/fr/N11739848232
- Police des Parcelles — node 11739848233 : https://mapcarta.com/fr/N11739848233

### Source secondaire de parcours AFTU 42
- Transitrun, sens Stade Municipal – Arrêt de Bus : https://transitrun.com/fr/public-transit-line_42_226925

## Périmètre de modification

Documentation uniquement. Aucun changement de code, d'arrêt actif, de ligne, de tracé, d'horaire, de correspondance ou de données TER/BRT.
