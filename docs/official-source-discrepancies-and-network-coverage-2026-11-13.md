# Contrôle croisé des sources officielles DDD et AFTU — 13 novembre 2026

## 1. DDD : divergences de terminus entre sources officielles

Deux sources publiques officielles donnent des formulations différentes pour plusieurs lignes :

- Page réseau urbain de Dakar Dem Dikk : https://demdikk.sn/reseau-urbain-dakar/
- Guide officiel de mobilité des JOJ Dakar 2026, diffusé sur le portail vie-publique.sn : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf

| Ligne | Page réseau DDD | Guide mobilité JOJ 2026 | Traitement |
|---|---|---|---|
| 7 | Ouakam ↔ Palais 2 | Ouakam – Palais 1 | Deux formulations officielles à conserver ; ne pas rejeter la relation OSM Palais 1 sur ce seul écart |
| 9 | Liberté 6 ↔ Palais 2 | Liberté 6 – Palais 1 | Même divergence ; la relation OSM vers Palais 1 peut correspondre à une variante documentée |
| 10 | Liberté 5 ↔ Palais 2 | Dieuppeul – Palais 1 | Même divergence ; vérifier si le guide JOJ décrit une variante liée aux sites olympiques |
| 23 | En-tête Parcelles Assainies ↔ Palais 1, mais la séquence détaillée finit par « Terminus Palais 2 » | Parcelles Assainies – Palais 1 | La page DDD comporte elle-même un écart entre son en-tête et le dernier arrêt ; ne pas forcer un seul terminus |
| 121 | SCAT URBAM ↔ Leclerc | HLM Grand Yoff – Leclerc | Les deux sources nomment des origines différentes ; la relation OSM 6990794 porte précisément « HLM Grand Yoff – Leclerc », mais sa séquence récupérée reste partielle |

### Conséquence pour les relations OSM

Les relations OSM 7500475 (ligne 7), 7487218 (ligne 9), 7488283 (ligne 10), 7108131 (multi-référence L23;L5) et 6990794 (ligne 121) ne doivent pas être écartées simplement parce qu'elles portent un terminus Palais 1 ou HLM Grand Yoff. Le guide officiel JOJ fournit une deuxième formulation officielle qui rend ces variantes plausibles.

Cela ne valide pas automatiquement les relations : les distances, l'ordre des arrêts et les membres manquants restent à contrôler. La relation 7108131 conserve notamment son ambiguïté explicite L23;L5.

### Règle de données recommandée

Conserver les sources et leurs dates séparément, par exemple :
- `DDD_NETWORK_PAGE` : formulation de la page réseau DDD.
- `JOJ_2026_MOBILITY_GUIDE` : formulation du guide officiel JOJ 2026.

Ne pas écraser un terminus par l'autre. Un éventuel changement de terminus doit être représenté comme une variante sourcée, pas comme une correction silencieuse.

## 2. AFTU / TATA : couverture des pages et nombre de lignes

La collecte AFTU du 13/11/2026 a récupéré 65 pages officielles :
- 63 pages liées depuis l'index et 2 pages officielles supplémentaires ;
- 65/65 pages contiennent un texte d'itinéraire ;
- 0 erreur et 0 itinéraire manquant dans les pages récupérées.

Le CETUD indique sur sa page « Réseaux de transport » que l'AFTU compte 72 lignes et 2 300 bus : https://cetud.sn/reseaux-de-transport/

**Écart de couverture :** les 65 pages extraites représentent 65 lignes documentées sur les 72 annoncées par le CETUD, soit 7 lignes qui ne sont pas encore représentées dans cet export. Les numéros manquants ne doivent pas être déduits des trous dans la numérotation : ils doivent être identifiés en comparant l'index AFTU, les pages et les listes CETUD.

Le terme « Tata » désigne les minibus associés au réseau AFTU dans l'usage courant ; la collecte des pages AFTU ne constitue pas un deuxième réseau distinct à additionner aux 72 lignes AFTU.

### Retours AFTU explicitement repérés

- Ligne 2 : Rue 39 (retour par Rue 17) ; Rue 25 (retour par Rue 37).
- Ligne 5 : retour par Rue 17 ; retour par Rue 37.

Ces indications ne décrivent que des variantes locales de voirie. Elles ne donnent pas le parcours complet du retour. Les 63 autres pages ne contiennent pas de mention explicite de retour dans le texte extrait ; cela ne prouve pas l'absence d'un service retour.

### Fréquences

La page CETUD affiche une plage générale de service de 6 h à 21 h pour l'AFTU, mais elle ne fournit pas une fréquence détaillée pour chaque ligne. Ne pas convertir cette plage générale en fréquence de ligne. Les fréquences estimées déjà prévues dans le projet doivent rester clairement séparées des horaires officiellement publiés et ne doivent pas être présentées comme des fréquences AFTU certifiées.

## 3. Prochaines actions

1. Ajouter la double provenance de terminus DDD aux fiches de revue des lignes 7, 9, 10, 23 et 121.
2. Rechercher les 7 lignes AFTU non représentées dans l'extraction, sans inventer leurs numéros.
3. Découper les 65 corridors AFTU publiés en étapes de voie et lieux distincts ; confronter ces étapes aux noms OSM et ArcGIS quand la géographie est disponible.
4. Continuer à rechercher des retours explicitement publiés, sans inverser les séquences aller.
5. Garder les fréquences séparées des corridors tant qu'une source ligne par ligne n'est pas trouvée.

Aucune écriture de production, aucune modification TER/BRT, aucun déploiement et aucune fusion de PR dans cette étape.
