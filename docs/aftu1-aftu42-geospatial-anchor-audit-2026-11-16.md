# Audit des points candidats AFTU 42 et AFTU 1 — Guédiawaye, Parcelles et Lat Dior

Date : 16 novembre 2026  
Branche : `docs/aftu53-geospatial-anchor-audit-2026-11-16`  
Périmètre : qualification de repères publiés et cartographiques. Aucun arrêt voyageur, tracé, horaire ou transfert n'est modifié.

## 1. AFTU 42 — séquence opérateur et points de contrôle

La fiche officielle AFTU 42 décrit le parcours :

**Gadaye → Corniche Guédiawaye → Cité des Enseignants → croisement Béthio → route des Niayes → Case Ba → Police des Parcelles Assainies → route du stade LSS (Tally Boubess) → VDN → ancienne piste d’envol → avenue Cheikh Anta Diop → route principale de Ouakam (marché) → Boutikou Diallo → terminus Ouakam Baye.**

Source officielle : https://aftu-senegal.org/map/dakar-urbain-ligne-42/

### Séquences distinctes dans les deux sens

Moovit publie deux fiches directionnelles distinctes pour la ligne 42 :
- **Vers Ouakam : 70 arrêts**, de « Arrêt de Bus » à « Rue OKM 282, 222 ».
- **Vers Guédiawaye : 68 arrêts**, de « Stade Municipal » à « Arrêt de Bus ».

Les listes ne sont pas de simples inversions l'une de l'autre : elles présentent des arrêts de fin et des segments différents. Il faut donc conserver deux séquences séparées et ne pas reconstruire le retour en inversant une liste unique. Les libellés génériques « Arrêt de Bus » ne sont pas des points géographiques identifiables.

Sources :
- https://moovitapp.com/index/fr/transport_en_commun-line-42-Dakar-5996-1618038-18051474-1
- https://moovitapp.com/index/fr/transport_en_commun-line-42-Dakar-5996-1618038-18051474-0

### AFTU 42 à l'hôpital Dalal Jamm

Moovit liste explicitement la ligne AFTU 42 à l'arrêt « Hôpital Dallal Jamm », dans les deux sens de desserte consultables. Les pages indiquent des arrêts voisins et des distances piétonnes depuis l'hôpital, mais ne fournissent pas une coordonnée de quai exploitable dans cette recherche.

- Sens Ouakam : https://moovitapp.com/index/fr/transport_en_commun-Hopital_Dallal_Jamm-Dakar-stop_37703146-5996
- Sens Guédiawaye : https://moovitapp.com/index/fr/transport_en_commun-Hopital_Dallal_Jamm-Dakar-stop_37703147-5996
- Hôpital Dallal Jamm, OSM way 229557678 : 14.77287, -17.40979 ; c'est le bâtiment hospitalier, pas l'arrêt AFTU.
- Croisement Béthio, OSM way 335874529 : 14.77059, -17.40821 ; repère routier voisin, pas un quai confirmé.

**Décision :** la desserte AFTU 42 du secteur hospitalier est corroborée, mais ni le point exact d'embarquement, ni l'accès au BRT Dalal Jamm, ni un parcours piéton porte-à-porte ne sont confirmés. Ne pas activer la correspondance AFTU 42 ↔ BRT Dalal Jamm.

### AFTU 42 à Police des Parcelles

La fiche AFTU cite « Police des Parcelles Assainies ». Les objets cartographiques du BRT Police des Parcelles sont identifiés dans OSM :

| Objet BRT | Coordonnées | Type OSM |
|---|---:|---|
| node 11739848231 | 14.75074, -17.43963 | plateforme / arrêt |
| node 11739848232 | 14.75072, -17.43963 | position d'arrêt |
| node 11739848233 | 14.75108, -17.43879 | position d'arrêt |

Références :  
- https://mapcarta.com/N11739848231  
- https://mapcarta.com/fr/N11739848232  
- https://mapcarta.com/fr/N11739848233

Ces points identifient les objets BRT, pas l'arrêt AFTU 42. Le nom commun « Police des Parcelles » ne prouve pas que les deux quais soient confondus ni qu'une traversée directe soit possible.

**Décision :** conserver Police des Parcelles comme correspondance candidate uniquement. Pas de liaison dans le graphe, pas de distance de marche inventée.

## 2. AFTU 1 — divergence documentaire sur le terminus nord

La ligne AFTU 1 est le cas où les sources consultées ne concordent pas entièrement :

- Le catalogue AFTU actuellement en ligne affiche l'intitulé **« LAT DIOR - HLM GRAND YOFF »**.
- La fiche détaillée officielle AFTU 1, datée du 18 mai 2026, publie une séquence se terminant par **« Espace HLM Grand Médine (face autoroute) »**.
- Le Guide officiel de mobilité des JOJ Dakar 2026 classe également la ligne 1 sous l'intitulé **« HLM Grand Yoff - Lat Dior »**.

Sources :
- Catalogue AFTU : https://aftu-senegal.org/infos-pratiques/
- Fiche détaillée AFTU 1 : https://aftu-senegal.org/map/dakar-urbain-ligne-1/
- Guide officiel MITTA/CETUD : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf

La fiche détaillée est plus précise sur les rues empruntées, mais le guide officiel récent et le titre du catalogue donnent un terminus différent. Il n'est donc pas sûr de transformer l'un des deux libellés en coordonnée de terminus sans clarification de l'AFTU.

### Gare Lat Dior

La fiche détaillée AFTU 1 nomme « Terminus Gare Lat Dior ». Une carte administrative de la région de Dakar fournit un repère « Gare routière Lat Dior » à environ **14.6793849, -17.4565293**.

Source : https://www.au-senegal.com/IMG/article_PDF/article_a31.pdf

Ce repère est une gare routière générique : il ne précise pas le quai de départ de l'AFTU 1, ni son éventuelle séparation des quais DDD. Le point doit rester candidat.

### Terminus nord : ne pas géocoder avant arbitrage

La fiche détaillée pointe vers Espace HLM Grand Médine, tandis que le catalogue AFTU et le guide MITTA/CETUD indiquent HLM Grand Yoff. Ces deux quartiers sont distincts. Il est interdit de déplacer automatiquement le terminus vers le point DDD « HLM Grand Médine », le marché Grand Médine ou une position générique de HLM Grand Yoff.

**Décision :** conserver l'itinéraire textuel détaillé comme source documentaire, mais marquer le terminus nord comme **CONFLIT DE SOURCES — NON GÉOCODÉ**. Aucune correspondance AFTU 1 ↔ DDD/BRT ne doit être créée à Lat Dior, HLM Grand Yoff ou HLM Grand Médine avant confirmation de l'opérateur.

## 3. Règles de mise en données

1. Un nom d'arrêt sur la fiche de ligne ne suffit pas à identifier son quai.
2. Une page d'horaires tierce peut corroborer une desserte, mais ne remplace pas une position d'arrêt vérifiée.
3. Les coordonnées d'un hôpital, d'une gare générique ou d'une station BRT ne doivent pas être réutilisées comme coordonnées d'un quai AFTU.
4. Ne pas déduire le sens retour par inversion de la fiche unique.
5. Les transferts AFTU 42 ↔ BRT Dalal Jamm et AFTU 42 ↔ BRT Police des Parcelles restent candidats non activés.
6. Les terminus AFTU 1 Lat Dior et HLM Grand Médine restent distincts des points DDD et BRT.
7. Aucun changement aux données TER/BRT, à leurs tracés, arrêts ou horaires.
8. L'identité publique reste **AFTU**, sans réseau TATA séparé.

## 4. Prochaine validation terrain ou documentaire

- Relever le quai AFTU 42 devant ou autour de l'hôpital Dalal Jamm et mesurer son cheminement jusqu'à l'accès voyageurs BRT.
- Identifier le côté de chaussée et le quai AFTU 42 à Police des Parcelles.
- Relever les entrées et quais AFTU 1 à la Gare Lat Dior.
- Localiser le terminus AFTU 1 « Espace HLM Grand Médine » sur la voie et le distinguer des arrêts DDD et BRT.
- Obtenir les fiches de retour distinctes avant d'activer les séquences directionnelles.

## Périmètre

Document d'audit uniquement. Aucun code, arrêt actif, tracé, horaire, intervalle ou transfert n'est modifié.