# Audit de fidélité géométrique du calculateur multimodal — 17 novembre 2026

## Objet

Vérifier si le calculateur et la carte utilisent effectivement les tracés routiers/ferroviaires de chaque mobilité et des cheminements piétons réels pour représenter les étapes d'un itinéraire, sans relier les points par des segments artificiels.

Cet audit est une lecture du code de la branche `fix/verified-transit-traces-and-line-badges`. Il ne modifie ni les horaires, ni les fréquences, ni les données voyageurs.

## Constat du calculateur

### 1. Accès au premier arrêt et marche finale

Dans `src/domain/planner.ts`, la fonction `accessible()` classe les arrêts avec `haversineMeters()` et applique le rayon de marche. Elle ne cherche pas de chemin dans le graphe piéton.

Conséquence : la distance d'accès/egress affichée est une distance géographique directe, pas une distance de marche sur trottoir ou passage piéton.

### 2. Distances à bord des lignes

La fonction `rideMinutes()` utilise `verifiedRideDistance()` pour les segments TER phase 1 et BRT B1 lorsqu'une géométrie directionnelle passe l'audit. Dans tous les autres cas, elle retombe sur `haversineMeters(a, b)`.

Conséquence : DDD, AFTU et TATA, ainsi que tout segment TER/BRT non validé, peuvent encore recevoir une distance directe entre arrêts pour le calcul de durée. Cette distance n'est pas une géométrie de route et ne doit pas servir à dessiner un tracé voyageurs.

### 3. Correspondances entre réseaux

Le calculateur utilise `TRANSFER_INDEX`, construit à partir de `CORRIDOR_TRANSFERS` dans `src/domain/corridors.ts`. Chaque transfert porte une valeur `walkM` statique ; les transferts au même pôle ont parfois `walkM: 0`.

Aucun chemin n'est calculé dans le graphe piéton candidat. Les valeurs de marche de référence ne sont donc pas des itinéraires piétons géométriques et ne prouvent ni le cheminement accessible, ni les traversées, ni les entrées réellement utilisées.

### 4. Géométrie affichée sur la carte

Dans `src/components/TransitMap.tsx`, les propriétés de trajet multimodal exposées sont notamment `highlightedLineIds` et `highlightedStopIds`. La mise en évidence dessine les tracés complets TER/BRT, et non la portion exacte entre les arrêts de montée et de descente.

La propriété `searchRoute` est une géométrie routière distincte. Elle ne constitue pas, à elle seule, la géométrie de chaque jambe multimodale. Les lignes DDD ArcGIS et la relation OSM TATA 40 sont affichées comme couches cartographiques, mais ne sont pas transformées ici en géométries directionnelles vérifiées et découpées pour chaque jambe calculée.

Le helper `src/domain/routeGeometrySlice.ts` sait découper une portion de géométrie directionnelle vérifiée, mais le composant `TransitMap` ne l'importe pas pour tracer les jambes du résultat multimodal.

## Constat du graphe piéton strict

L'audit documenté dans `docs/audit-graphe-pieton-candidat-2026-11-17.md` retient 2 246 ways dédiés, 10 472 nœuds, 19 634 arêtes et 935 composantes connexes. La plus grande composante ne contient que 492 nœuds.

Les nœuds les plus proches des 13 gares TER phase 1 et des 23 stations BRT sont seulement des candidats de proximité. Les entrées, quais, passages piétons et traversées ne sont pas raccordés au graphe. Les 23 identifiants de station BRT du référentiel sont absents du graphe strict.

**Aucune correspondance piétonne ne peut donc être calculée de manière fiable à partir de cet artefact à ce stade.** Ne pas connecter artificiellement les composantes et ne pas convertir une distance à vol d'oiseau en durée de marche.

## Conditions obligatoires avant correction fonctionnelle

1. Disposer, pour chaque ligne et chaque sens activé, d'une géométrie routière/ferroviaire provenant d'une source identifiée et conservant son sens réel.
2. Vérifier la projection de chaque arrêt sur cette géométrie, son ordre, sa tolérance et la continuité de la ligne. Un sens non validé reste non dessiné comme tracé validé.
3. Pour chaque jambe calculée, découper uniquement la portion réelle entre les arrêts de montée et de descente avec `sliceVerifiedRouteSegment()`. Ne pas mettre en évidence la ligne complète comme substitut au segment parcouru.
4. Pour chaque marche d'accès, de correspondance et de sortie, disposer d'un point d'accès/entrée réel et d'un chemin piéton continu contrôlé, incluant les barrières et traversées pertinentes.
5. Si la géométrie d'une jambe manque ou échoue à l'audit, ne pas fabriquer de ligne droite ni emprunter arbitrairement la route la plus proche. L'étape doit rester sans tracé cartographique validé ou être signalée comme non calculable selon le contrat d'affichage retenu.

## Décision

- Ne pas activer de nouvelles correspondances sur la seule base de coordonnées proches.
- Ne pas présenter les distances Haversine comme des distances routières ou piétonnes.
- Ne pas dessiner les jambes DDD/AFTU/TATA à partir de simples points d'arrêts.
- Préserver strictement les horaires et fréquences TER/BRT déjà validés.
- Garder le graphe piéton strict en audit uniquement jusqu'au raccordement documenté des entrées et à la validation des chemins.

Cet audit décrit les limites actuelles ; il ne constitue pas une validation de tous les itinéraires ni une autorisation de publication.
