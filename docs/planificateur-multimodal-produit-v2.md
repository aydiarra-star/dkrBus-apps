# Planificateur multimodal DakarBus — évolution produit v2

Date : 16 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`  
Périmètre : écran Trajet, calculateur multimodal, qualité des correspondances et critères de recette.

## 1. Positionnement produit

DakarBus doit devenir l'assistant de déplacement le plus utile et le plus digne de confiance pour l'agglomération dakaroise. La promesse n'est pas de prétendre à une couverture parfaite : c'est de proposer le meilleur trajet que les données permettent réellement de calculer, d'expliquer ses étapes et de rendre visibles les limites restantes.

Le CETUD présente désormais CETUD Mobilités comme une application qui consulte BRT, AFTU, Dakar Dem Dikk, GTS et TER et planifie des trajets combinant plusieurs modes et la marche à pied (page CETUD consultée le 16/11/2026 : https://cetud.sn/cetud-mobilites-une-application-pour-simplifier-vos-deplacements/). DakarBus ne doit donc pas revendiquer l'exclusivité du multimodal. Sa différence doit être mesurable :
- meilleure qualité locale des arrêts et des deux sens de chaque ligne ;
- correspondances piétonnes vérifiées quai par quai ;
- résultats lisibles, comparables et honnêtes sur la fraîcheur et la confiance ;
- couverture des pôles périphériques et des lignes de proximité ;
- fonctionnement mobile fluide et données utiles disponibles hors connexion ;
- correction continue des données avec preuve et validation humaine.

## 2. Écran Trajet — spécification livrée dans cette évolution

### P1 — Action principale
- Bouton « Rechercher un trajet » vert soutenu, texte blanc, flèche visible et ombre discrète.
- Le bouton reste désactivé tant que départ et destination ne sont pas renseignés.
- Libellé accessible conservé pour les technologies d'assistance.

### P2 — Saisie groupée
- Départ et destination dans un même cadre visuel.
- Action d'inversion visible entre les deux champs.
- « Utiliser ma position comme départ » reste dans le bloc Départ.
- Le changement de sens déclenche un nouveau calcul lorsque les deux points existent.

### P3 — Filtres de réseau
- Label « Réseaux à utiliser ».
- TER, BRT, DDD et AFTU sont des boutons à état explicite.
- Actif : couleur de réseau ; désactivé : gris.
- Le trait de couleur sous chaque badge reprend exactement la largeur du badge.
- Les filtres mettent à jour les préférences de mobilité réellement consommées par le calculateur et la carte ; ils sont aussi transmis à la recherche des courses directes publiées. Les courses dont le réseau ne peut pas être identifié ne sont pas affichées lorsqu'un sous-ensemble de réseaux est choisi, et cette exclusion est signalée.
- Le dernier réseau actif ne peut pas être désactivé : un trajet ne doit jamais être présenté comme filtré alors que tous les réseaux sont exclus.

### P4 — Carte compacte
- La carte occupe environ 28 % de la hauteur disponible dans l'onglet Trajet sur mobile.
- Le panneau inférieur garde son propre défilement et ne pousse pas la coquille hors de l'écran.
- La navigation basse et les contrôles de carte restent accessibles.

### P5 — Résultats
Le calculateur présente d'abord l'option classée en tête comme « Trajet recommandé », puis les alternatives réellement distinctes. Chaque option détaille :
- durée estimée et marge d'incertitude ;
- marche totale, attente, nombre de correspondances ;
- lignes et réseaux effectivement empruntés ;
- tarif connu, partiel ou non déclaré ;
- étapes ordonnées : marche d'accès, attente, véhicule, correspondance, marche finale.

Ne pas afficher une heure d'arrivée exacte en additionnant une estimation à l'heure actuelle. Une arrivée horodatée ne sera affichée que si le départ de référence est explicite et que les données de service permettent ce calcul. Le prix le moins cher n'est affiché comme tel que lorsque les tarifs de toutes les courses comparées sont connus.

## 3. État technique constaté dans le dépôt

Le dépôt possède déjà un moteur de référence dans `src/domain/planner.ts` et un comparateur dans `src/domain/journeyOptions.ts` :
- recherche multimodale sur les lignes et séquences directionnelles déclarées ;
- états à pied / à bord, changements de ligne et correspondances du graphe ;
- calcul des options « plus rapide », « moins de marche », « moins de correspondances » ;
- filtres de réseaux via les préférences ;
- tarification TER/BRT et statut non déclaré pour DDD/AFTU/TATA ;
- refus d'inventer un retour lorsqu'une séquence directionnelle explicite manque.

La recherche serveur décrite par `src/domain/journeys.ts` n'accepte que les courses directes d'un snapshot publié. Le calcul multimodal avec changements de lignes repose donc encore sur le moteur local de référence, et non sur un moteur horaire complet alimenté par un GTFS opérateur.

Le moteur de référence utilise des vitesses commerciales et des fréquences de repli pour les lignes sans horaire publié. Ces valeurs sont des hypothèses de calcul ; elles ne doivent jamais être décrites comme des départs exacts ou du temps réel.

Les distances d'accès et d'approche calculées à partir de coordonnées sont des distances géographiques, pas des itinéraires piétons sur voirie. Les liens de correspondance sont ceux du graphe déclaré. Aucun lien supplémentaire ne doit être ajouté sur la seule base d'une proximité à vol d'oiseau.

## 4. Données et correspondances : règles non négociables

- TER et BRT : tracés, gares/stations, horaires et fréquences de référence validés protégés. Aucune retouche sans autorisation explicite.
- DDD/AFTU : enrichir les lignes disponibles, les deux sens indépendamment, les arrêts dans l'ordre, les variantes et les sources. Le GTFS CETUD n'est pas reçu et ne constitue pas un blocage.
- Identité publique des minibus : AFTU uniquement ; TATA est regroupé sous AFTU dans l'interface.
- Un nom d'arrêt identique ne prouve ni un quai commun, ni une correspondance.
- Une distance droite ne prouve pas un chemin piéton.
- Ne pas déplacer un arrêt générique sur une position OSM candidate sans preuve que la ligne dessert ce quai.

### Pôles déjà documentés

| Pôle | État à conserver |
|---|---|
| Petersen | Correspondances déclarées dans le graphe ; ne pas changer les distances ou les quais sans nouvelle preuve |
| Terminus BRT / DDD Guédiawaye | Liaison existante documentée ; préserver |
| Colobane TER ↔ gare routière | Candidate seulement ; 307 m en ligne droite, pas une distance piétonne ; aucun lien à activer |
| UCAD DDD ↔ AFTU | Dessertes de secteur repérées, quais AFTU et cheminement non vérifiés ; aucun lien à activer |
| Lat Dior DDD ↔ AFTU | Convergence de terminus dans les fiches, positions exactes des quais inconnues ; aucun lien à activer |
| Grand Médine BRT ↔ DDD | Marché Grand Médine et HLM Grand Médine sont des arrêts distincts ; quai DDD du marché à localiser ; aucun lien à activer |

Sources internes de preuve : `docs/calage-geographique-poles-2026-11-16.md` et `docs/colobane-walking-transfer-audit-2026-11-16.md`.

## 5. Feuille de route moteur — après l'interface

### M1 — Graphe de réseau auditable
- Un identifiant stable pour chaque arrêt, quai, ligne, sens et variante.
- Séquences aller et retour séparées ; aucun renversement automatique des lignes documentées.
- Chaque lien conserve sa source, sa date, sa méthode et son niveau de confiance.
- Séparer arrêt, station parente, quai, entrée voyageurs et pôle d'échange.

### M2 — Cheminement piéton réel
- Utiliser un moteur de routage piéton sur un graphe OSM (chemins, trottoirs, traversées, passerelles et barrières).
- Calculer distance et durée sur le chemin praticable, pas en ligne droite.
- Rejeter les traversées interdites, les accès fermés et les liaisons à travers voies ferrées ou emprises clôturées.
- Tant que le chemin n'est pas vérifié, garder la correspondance candidate non activée ou afficher « accès à confirmer ».

### M3 — Moteur horaire multimodal
- À terme, utiliser un algorithme de type RAPTOR ou Connection Scan Algorithm sur les services et horaires réellement publiés.
- Les temps d'attente doivent dépendre de l'heure de départ, du calendrier, des périodes de service et des correspondances accessibles.
- Tant que les données DDD/AFTU sont estimées, exposer cette incertitude et ne pas mélanger estimation et horaire exact.
- Calculer les trajets aller et retour séparément.
- Produire les options plus rapide, moins de marche, moins de changements et moins cher seulement lorsque le prix est entièrement connu.

### M4 — Qualité des tarifs
- TER/BRT : grilles publiées et zones connues.
- DDD/AFTU : garder « tarif non déclaré » tant qu'une grille ligne par ligne ou règle tarifaire officielle n'est pas vérifiée.
- Un total inter-réseaux est une somme de titres connus, pas la preuve d'un billet combiné ou d'une intégration tarifaire.

### M5 — Couverture et tests terrain
Recetter des itinéraires représentatifs :
- Dakar Plateau ↔ UCAD / Ouakam / Ngor ;
- Dakar ↔ Guédiawaye / Keur Massar ;
- Dakar ↔ Rufisque / Bargny / Diamniadio ;
- Rufisque ↔ Bargny ;
- Ngor / Yoff / Cité Avion ↔ pôles TER/BRT ;
- Mermoz / Sacré-Cœur ↔ BRT, DDD et AFTU ;
- itinéraires directs, une correspondance, plusieurs correspondances, retour et absence de solution.

Pour chaque cas : vérifier départ, arrivée, sens, arrêts intermédiaires, distance de marche réelle, temps d'attente, tarifs, accessibilité et résultat de repli.

## 6. Critères de sortie

Une version ne peut être déclarée terminée que si :
1. le build TypeScript/Vite passe ;
2. les tests unitaires du moteur et les tests d'interface passent ;
3. les filtres de réseaux influencent réellement les options et le tracé mis en évidence ;
4. aucun transfert non vérifié n'est ajouté ;
5. les données TER/BRT protégées sont inchangées ;
6. les itinéraires aller/retour ont été vérifiés sur des cas de Dakar et de la périphérie ;
7. les prix et heures d'arrivée ne sont affichés que lorsqu'ils sont justifiables ;
8. la publication GitHub Pages est confirmée et le rendu iPhone est contrôlé.

Une PR fusionnée, un build vert ou une capture illustrative ne suffit pas à prouver la qualité des données ni l'exactitude d'un trajet.
