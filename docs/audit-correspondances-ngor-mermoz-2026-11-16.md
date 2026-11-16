# Audit des dessertes et correspondances — Ngor et Mermoz — 16 novembre 2026

## Objectif et règle de sécurité

Compléter la couverture des lignes DDD/AFTU et identifier les pôles de correspondance utilisables par le calcul multimodal.

**Aucune correspondance nouvelle n'est activée dans cet audit.** Les noms de quartier ne sont jamais convertis en quais GPS. Les lignes, arrêts, tracés et horaires TER/BRT restent inchangés.

## 1. Ngor — dessertes confirmées et numérotation à contrôler

### DDD

La page officielle DDD confirme :
- **Ligne 221 — Gadaye ↔ Almadies** : « Rond-point Ngor » et « Ngor village » figurent dans la séquence publiée.
- **Ligne 218 — Thiaroye ↔ Aéroport LSS** : la séquence publiée passe par Ouakam, route des Mamelles, route des Almadies et Ngor.
- **Ligne 217** : la page affiche aussi une séquence vers Ngor/Aéroport LSS alors que son titre annonce Ouakam. Conflit titre/séquence à maintenir ; ne pas créer une liaison indépendante sur cette seule page.

### AFTU

Le catalogue AFTU courant et les fiches détaillées ne sont pas parfaitement alignés sur les numéros :
- Le catalogue affiche **ligne 34 : Ngor–Pikine Texaco** et **ligne 35 : Marché Ndiarème–Ngor**.
- La fiche détaillée intitulée **ligne 35** décrit Pikine Texaco → Tally Boumack → Khourounar → Cité Lobatt Fall → route nationale → Croisement Cambérène → Patte d'Oie → Yoff → Aéroport → **terminus Ngor**.
- La fiche détaillée intitulée **ligne 34** décrit au contraire Nord Foire → VDN → Liberté 6 → Sacré-Cœur → Rue 10 Grand Dakar → Zone B → Sham → Poste Médina → Lat Dior, sans Ngor.

Décision : la desserte AFTU de Ngor est confirmée par la fiche détaillée qui aboutit explicitement au terminus Ngor, mais la correspondance exacte entre identifiant catalogue et numéro affiché sur la fiche doit être conservée comme conflit documentaire. Ne pas associer automatiquement la ligne catalogue 35 à cette fiche.

La fiche détaillée **ligne 49** publie Gadaye → Marché Ndiarème → … → Sacré-Cœur → **Mermoz rond-point Cheikh Béthio** → Ouakam → Mamelles → Rond-point Almadies → **terminus Ngor**. Le catalogue courant affiche Gadaye–Ngor sous la ligne 48 : décalage d'identifiant à conserver, sans renuméroter silencieusement.

### Pôles GPS candidats

- « Arrêt bus rond-point Ngor » OSM node 4747526721 : **14.74894, -17.51440**.
- « Garage de Ngor » OSM way 121413765 : **14.74877, -17.51518**.
- « Terminus de bus 35 » OSM node 11544808946 : **14.74149, -17.51849**.

Ces objets sont distincts. Les deux premiers sont proches mais ne prouvent pas que DDD 221 et les lignes AFTU terminus Ngor utilisent le même quai. Le troisième est un autre point terminal. Aucun cheminement piéton mesuré entre ces quais n'est encore établi.

## 2. Mermoz — dessertes et correspondance candidate

### DDD

La ligne **DDD 7 — Ouakam ↔ Palais 2** publie explicitement l'arrêt « Mermoz » entre Hôpital IHO et ENEA.

### AFTU

Les fiches AFTU courantes montrent :
- **Fiche détaillée 44** : Grand Mbao → … → Foire → Ancienne Piste → **Mermoz** → terminus Ouakam. Le catalogue voisin affiche Grand Mbao–Ouakam sous le numéro 43 : décalage de numérotation à contrôler.
- **Fiche détaillée 49** : Gadaye → … → Sacré-Cœur → **Mermoz rond-point Cheikh Béthio** → Ouakam → Mamelles → Ngor. Le catalogue voisin affiche Gadaye–Ngor sous le numéro 48.
- La fiche détaillée 43 décrit un autre parcours Ouakam–Thierno Ndiaye, sans arrêt Mermoz dans la séquence consultée.

### Pôle partagé le plus solide

La fiche d'arrêt Moovit « Avenue Cheikh Anta Diop, 48 » indique une desserte des réseaux Dakar Dem Dikk et AFTU, et affiche notamment **DDD 7** et **AFTU 44 / 49**. La fiche place le repère « Lycée Mermoz » à **54 m (environ 1 minute de marche)**.

C'est un candidat de correspondance solide au niveau de l'arrêt partagé. La coordonnée GPS du quai exact n'est toutefois pas fournie dans la fiche consultée. Le point du bâtiment du lycée ne doit pas être utilisé comme position du quai. Les deux sens doivent rester séparés si les quais sont opposés.

Autre point distinct : l'arrêt OSM « Deuxième porte Mermoz », node 4363241793, **14.70277, -17.47340**. Ne pas le fusionner avec le pôle Avenue Cheikh Anta Diop / Lycée Mermoz.

## 3. Correspondances et décisions

| Secteur | Correspondance candidate | État |
|---|---|---|
| Mermoz | DDD 7 ↔ AFTU fiche 44 / fiche 49, Avenue Cheikh Anta Diop 48 | Arrêt partagé documenté ; GPS du quai à relever avant activation |
| Ngor | DDD 221/218 ↔ AFTU terminus Ngor | Lignes confirmées ; quais et cheminement non prouvés |
| Mermoz | DDD 7 ↔ AFTU fiche 44 / fiche 49 à d'autres arrêts du secteur | Passage dans le même secteur seulement ; pas de transfert automatique |
| Ngor | DDD 221 ↔ AFTU 35 détaillée | Terminus Ngor publié ; identité exacte catalogue/fiche à réconcilier |

Avant activation, il faut relever les coordonnées des quais dans chaque sens, tracer le cheminement piéton praticable (traversées, barrières, accès) et mesurer la distance sur le réseau piéton. Aucun `walkM: 0` ne doit être ajouté sur la seule base d'un nom de quartier.

## 4. Sources

### Officielles
- DDD, réseau urbain et banlieue : https://demdikk.sn/reseau-urbain-dakar/
- AFTU, catalogue courant : https://aftu-senegal.org/infos-pratiques/
- AFTU, fiche détaillée 34 : https://aftu-senegal.org/map/dakar-urbain-ligne-34/
- AFTU, fiche détaillée 35 : https://aftu-senegal.org/map/dakar-urbain-ligne-35/
- AFTU, fiche détaillée 43 : https://aftu-senegal.org/map/dakar-urbain-ligne-43/
- AFTU, fiche détaillée 44 : https://aftu-senegal.org/map/dakar-urbain-ligne-44/
- AFTU, fiche détaillée 49 : https://aftu-senegal.org/map/dakar-urbain-ligne-49/

### Arrêts et cartographie
- Moovit, Avenue Cheikh Anta Diop 48 : https://moovitapp.com/index/fr/transport_en_commun-Avenue_Cheikh_Anta_Diop_48-Dakar-stop_37702386-5996
- Moovit, Lycée Mermoz : https://moovitapp.com/index/fr/transport_en_commun-Lyc%C3%A9e_Mermoz-Dakar-stop_37702387-5996
- OSM/Mapcarta, arrêt bus rond-point Ngor : https://mapcarta.com/fr/N4747526721
- OSM/Mapcarta, Garage de Ngor : https://mapcarta.com/W121413765
- OSM/Mapcarta, Terminus de bus 35 : https://mapcarta.com/fr/N11544808946
- OSM/Mapcarta, Deuxième porte Mermoz : https://mapcarta.com/fr/N4363241793

## Périmètre

Audit documentaire et correction des références de lignes uniquement. Aucun arrêt actif, coordonnée de calcul, tracé, horaire, correspondance du graphe ou donnée TER/BRT n'est modifié.
