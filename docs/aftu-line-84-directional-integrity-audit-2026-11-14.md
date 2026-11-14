# AFTU ligne 84 — contrôle directionnel et intégrité des horaires

Date du contrôle : 14 novembre 2026  
Fichier contrôlé : `src/data/aftu-84-directions.json`  
Portée : lecture et contrôle des données déjà transmises ; aucune réécriture du catalogue passager.

## Données conservées

| Sens | Occurrences d'arrêts | Premier repère | Dernier repère |
|---|---:|---|---|
| Aller | 73 | Jaxaay 2 Pénitence | Terminus 84_54Derrière Ucad En Face Canal 4 |
| Retour | 73 | Delafosse Commerce | Jaxaay2 Route Du 84 |

- Intervalle de ligne enregistré : 14 minutes.
- Le retour comporte 73 horaires individuels, de 05:49 à 07:09.
- Contrôle structurel : 73 libellés et 73 horaires ; format HH:MM valide ; ordre chronologique non décroissant.
- Les libellés et l'ordre des deux séquences restent inchangés.

## Point à faire confirmer : terminus des deux sens

Les extrémités des séquences transmises ne se rejoignent pas exactement :

- fin de l'aller : « Terminus 84_54Derrière Ucad En Face Canal 4 » ;
- départ du retour : « Delafosse Commerce » ;
- départ de l'aller : « Jaxaay 2 Pénitence » ;
- fin du retour : « Jaxaay2 Route Du 84 ».

Ces différences sont conservées telles quelles. Elles peuvent correspondre à des terminus opérationnels distincts, à une variante de parcours ou à une différence de libellé ; les éléments disponibles ne permettent pas de choisir entre ces explications. Aucun terminus n'est remplacé et aucune inversion ou jonction automatique n'est effectuée.

## Nouvelle corroboration institutionnelle — guide CETUD JOJ Dakar 2026

Le guide officiel de mobilité des JOJ Dakar 2026, publié sous les logos du ministère des Transports et du CETUD, apporte un recoupement cartographique supplémentaire :

- Dans la liste des lignes AFTU représentées, la ligne 84 figure dans la légende de la carte du réseau.
- La carte identifie le repère « Terminus 84 CAD » dans le secteur ouest/sud-ouest et identifie Jaxaay 2 dans le secteur est/nord-est.
- La page d'index officielle AFTU consultée le 14 novembre 2026 donne le corridor « UCAD - JAXAAY ».

Sources :
- Guide officiel CETUD / Mobilité JOJ Dakar 2026, carte AFTU, pages décrites aux lignes 1683–1812 du PDF : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf
- Index officiel AFTU : https://aftu-senegal.org/infos-pratiques/

**Limite de preuve :** la carte est une représentation générale du réseau. Elle ne fournit pas la liste ordonnée des arrêts, les deux séquences directionnelles, ni la preuve que « Terminus 84 CAD » et « Delafosse Commerce » désignent le même arrêt opérationnel. Elle corrobore l'axe UCAD/Jaxaay, mais ne valide pas individuellement les 73 arrêts et ne résout pas l'écart entre les quatre extrémités enregistrées. Les données transmises ne sont donc pas modifiées.

## Décision de l'audit

- Les 73 arrêts aller et les 73 arrêts retour sont préservés séparément.
- Les 73 horaires du retour sont conservés et soumis à un test de format et d'ordre chronologique.
- La fréquence de 14 minutes reste une donnée de ligne ; elle ne sert pas à recalculer les horaires par arrêt.
- La corroboration institutionnelle confirme le corridor général UCAD/Jaxaay, mais la validation de l'exactitude opérationnelle des quatre extrémités et de l'ordre des arrêts reste ouverte.
- Aucune donnée TER/BRT n'est modifiée ; aucune écriture Supabase, fusion ou publication n'est effectuée.

Test associé : `src/data/aftu-84-directions.test.ts`.
