# Audit des pôles Lat Dior et Grand Médine — 16 novembre 2026

## Objet

Vérifier les lignes DDD/AFTU documentées autour de Lat Dior et Grand Médine, distinguer les terminus des simples arrêts de passage et éviter de créer des correspondances géographiques non prouvées.

Documentation uniquement : aucune modification de données actives, de tracés, d'arrêts, d'horaires, de calculateur ou de correspondances TER/BRT.

---

## 1. Lat Dior

### DDD — desserte confirmée

Le réseau urbain officiel Dakar Dem Dikk publie :

- **Ligne 11 : Keur Massar ↔ Lat Dior**, avec « Terminus Lat Dior » indiqué en fin de séquence.
- **Ligne 18 : Dieuppeul ↔ Centre-ville**, avec Lat Dior dans la séquence de retour.
- **Ligne 20 : Dieuppeul ↔ Centre-ville**, avec Lat Dior dans la séquence de retour.

Le guide officiel de mobilité JOJ 2026 confirme également la relation de la ligne 11 « Keur Massar – Lat Dior ».

La ligne 11 a donc un terminus nommé Lat Dior dans la source DDD. Pour les lignes 18 et 20, Lat Dior est un point de passage publié, pas un terminus démontré.

### AFTU — lignes dont le catalogue mentionne Lat Dior

Le catalogue officiel AFTU affiche les relations suivantes :

| Ligne | Relation affichée |
|---|---|
| 1 | Lat Dior – HLM Grand Yoff |
| 34 | Nord Foire – Lat Dior |
| 39 | Lat Dior – Diamalaye |
| 46 | SDE Serigne Assane – Lat Dior |
| 47 | Cité Serigne Mansour – Lat Dior |
| 81 | Lat Dior – Comico Yeumbeul |

Ces relations attestent une desserte du secteur, mais le catalogue ne donne pas les coordonnées des quais, la porte exacte de terminus ni les côtés de rue utilisés.

**Point de vigilance ligne 1 :** des informations de détail précédemment consultées décrivent un terminus HLM Grand Médine, alors que le catalogue officiel affiche HLM Grand Yoff. Cette contradiction ne doit pas être résolue par supposition. Garder le terminus non géocodé tant qu'une source opérateur ou un relevé terrain ne tranche pas.

### Décision Lat Dior

- Conserver les dessertes publiées.
- Distinguer le terminus DDD ligne 11 des arrêts de passage DDD 18/20.
- Ne créer aucun lien de correspondance AFTU↔DDD ou avec TER/BRT à partir du seul nom « Lat Dior ».
- Ne pas placer les quais AFTU au centre d'un carrefour ou d'un point de quartier.
- Prochaine preuve nécessaire : position précise des quais et traversées piétonnes entre chaque opérateur.

---

## 2. Grand Médine

### BRT — pôle d'échange officiellement documenté

Les documents CETUD / projet BRT décrivent un pôle d'échange à Grand Médine, situé au croisement de la route venant de Nord-Foire (Tally Boubess) et de la Route des Niayes, à proximité de la route de l'aéroport et de l'échangeur Aliou Sow. Le pôle comprend un terminal bus et des aménagements de rabattement.

Le référentiel cartographique déjà audité dans le dépôt distingue les points BRT du secteur :
- station/point BRT : 14.74819, -17.44443 ;
- station/point BRT : 14.74744, -17.44489.

Ces coordonnées sont conservées comme points BRT existants, pas comme coordonnées de terminus DDD/AFTU.

### DDD — trois désignations à ne pas confondre

Le réseau officiel DDD mentionne :
- **Ligne 1 : Marché Grand Médine** ;
- **Ligne 6 : Police des Parcelles Assainies – Marché Grand Médine** ;
- **Ligne 23 : HLM Grand Médine**.

Ces trois libellés sont des arrêts/secteurs distincts dans les séquences publiées. Ils ne doivent pas être fusionnés sous un unique arrêt « Grand Médine ».

Le point DDD HLM Grand Médine déjà relevé dans l'audit antérieur est situé à 14.76135, -17.45056. Il est à environ 1,5 km à vol d'oiseau du point BRT de Grand Médine le plus proche du secteur. Cette distance en ligne droite n'est pas une distance piétonne. Elle ne justifie pas une correspondance BRT↔DDD.

La position exacte de l'arrêt DDD « Marché Grand Médine » reste à confirmer. Il ne faut pas réutiliser automatiquement le point HLM Grand Médine pour le marché.

### AFTU — conflit de terminus ligne 1

Le catalogue officiel AFTU affiche pour la ligne 1 « Lat Dior – HLM Grand Yoff ». Une page détaillée consultée antérieurement présente toutefois une destination HLM Grand Médine. Ce conflit de source doit rester visible dans les données d'audit et la destination ne doit pas être géocodée avant résolution.

La proximité générale d'un itinéraire AFTU avec le pôle BRT ne suffit pas à prouver un arrêt commun ni un transfert piéton.

### Décision Grand Médine

- Conserver les points BRT existants.
- Garder distincts Marché Grand Médine, HLM Grand Médine et Police des Parcelles.
- Ne pas raccorder le point DDD HLM Grand Médine au BRT : l'écart spatial est trop important pour une correspondance piétonne directe et l'arrêt Marché exact n'est pas établi.
- Ne pas géocoder le terminus AFTU 1 tant que le conflit HLM Grand Yoff / HLM Grand Médine n'est pas résolu.
- Aucun nouveau transfert n'est ajouté.

---

## 3. Ordre de vérification terrain / sources

1. Obtenir un point GPS opérateur pour le terminus DDD Lat Dior et les quais AFTU qui y terminent.
2. Confirmer si les lignes DDD 18 et 20 utilisent le même arrêt Lat Dior que la ligne 11, dans chaque sens.
3. Résoudre le terminus nord de l'AFTU 1 (HLM Grand Yoff ou HLM Grand Médine).
4. Localiser précisément l'arrêt DDD Marché Grand Médine et l'arrêt DDD Police des Parcelles.
5. Identifier les quais AFTU réellement rabattus au pôle BRT Grand Médine.
6. Tracer les cheminements piétons réels et mesurer les distances avant d'activer une correspondance.

## Sources

- Catalogue officiel AFTU, lignes et relations publiées : https://aftu-senegal.org/infos-pratiques/
- Réseau urbain officiel Dakar Dem Dikk, séquences des lignes 1, 6, 11, 18, 20 et 23 : https://demdikk.sn/reseau-urbain-dakar/
- Guide officiel de mobilité JOJ Dakar 2026, réseau DDD : https://www.vie-publique.sn/docs/270ed4e5-ab8f-47b6-9e77-cfd6ed491f02/guide-mobilite-dakar-joj-2026.pdf
- CETUD, rapport final PEPP BRT Dakar, pôle d'échange Grand Médine : https://www.cetud.sn/images/docs/Rapport_Final_PEPP_BRT_Dakar.pdf
- Banque mondiale, étude d'impact du projet BRT, description du pôle Grand Médine : https://documents1.worldbank.org/curated/en/135801485195983933/pdf/SFG2890-EA-FRENCH-P156186-Box402874B-PUBLIC-Disclosed-1-22-2017.pdf

## Périmètre de modification

Un seul document d'audit ajouté. Aucun changement de code, de données actives, d'arrêt, de ligne, de tracé, d'horaire, de correspondance, ni de référence TER/BRT.
