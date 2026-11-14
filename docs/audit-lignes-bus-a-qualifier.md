# Audit préalable des lignes DDD / AFTU / TATA

Date : 13 novembre 2026  
Dépôt : `aydiarra-star/dkrBus-apps`

## Constat dans le code actuel

Le registre `src/domain/corridors.ts` contient des séquences de référence pour DDD, AFTU et TATA, notamment :
- DDD 1, DDD 4 et DDD 15 ;
- AFTU 42, AFTU 53 et AFTU 1 ;
- une ligne TATA générique Colobane ↔ Guédiawaye.

Les arrêts de ces réseaux sont en partie des points de pôles ou coordonnées approximatives. Les noms « référence » et les commentaires du code ne constituent pas une preuve que l'opérateur dessert réellement ces arrêts dans cet ordre. Des correspondances calculées à partir de proximité géographique ne prouvent pas non plus qu'un changement de ligne est praticable.

## Règle avant enrichissement

Chaque séquence doit être classée individuellement :
- `VERIFIED` : source primaire ou document opérateur daté et vérifié ;
- `DOCUMENTED_REFERENCE` : document identifiable, mais confirmation opérationnelle incomplète ;
- `ESTIMATED` : hypothèse de travail explicitement calculée à partir de données disponibles ;
- `UNVERIFIED` : séquence non étayée ou contradictoire ;
- `INCOMPLETE` : séquence partielle.

Ces statuts concernent la donnée et sa provenance. Ils ne doivent pas être transformés en badge public trompeur. Les panneaux voyageurs suivent les règles d'affichage produit de la feuille de route, tandis que les détails de provenance et de confiance restent consultables dans les fiches de données et la console.

## Informations de travail déjà disponibles

Les plages et fréquences communiquées pour préparer le modèle en attendant les sources complètes sont conservées dans `feuille-de-route-produit-complete.md`. Elles ne permettent pas, à elles seules, de confirmer l'ordre des arrêts ni le tracé réel d'une ligne.

En particulier, les exemples d'horaires 2B, AFTU 5, AFTU 29 et AFTU 30 ne doivent pas être attribués à une séquence de stations tant que les arrêts et le sens correspondants ne sont pas documentés.

## Travail à effectuer par ligne

Pour chaque numéro de ligne et chaque sens :
1. retrouver une fiche, carte ou publication de l'opérateur et enregistrer son URL/référence et sa date ;
2. relever séparément terminus, arrêts intermédiaires et variantes ;
3. vérifier l'ordre des arrêts et la continuité géographique uniquement avec des coordonnées sourcées ;
4. confronter les deux sens sans inverser mécaniquement l'aller ;
5. comparer avec les objets OSM comme candidats secondaires, sans les promouvoir au rang officiel ;
6. documenter les contradictions, les arrêts manquants et les limites ;
7. faire relire la séquence par un humain avant de la rendre routable comme ligne confirmée.

## Garde-fous de routage

- Ne pas faire passer une ligne de référence schématique pour un itinéraire opérateur confirmé.
- Ne pas calculer un trajet bus si le sens, la séquence ou les arrêts nécessaires ne sont pas suffisamment étayés.
- Ne pas déduire un horaire de passage exact d'une fréquence moyenne.
- Ne pas présenter une correspondance de proximité comme une liaison piétonne vérifiée.
- Ne pas modifier les 13 gares TER ni les 23 stations BRT et leurs horaires protégés.
- Les données de test et les séquences fictives restent hors catalogue réel.

Cet audit n'efface aucune donnée existante et ne modifie aucun comportement applicatif. Il fixe les contrôles à réaliser avant d'élargir la couverture DDD/AFTU/TATA.
