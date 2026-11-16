# Audit des pôles de correspondance — suite Petersen

Date : 16 novembre 2026  
Branche : `docs/audit-poles-correspondance-2026-11-16`

## Objet

Poursuivre la vérification des correspondances multimodales après l'activation documentée du pôle Petersen. Cet audit ne crée aucune liaison dans le calculateur : une correspondance n'est activée que lorsque le pôle commun et le cheminement entre les points d'arrêt sont suffisamment établis.

## Résultat par pôle

| Pôle candidat | Éléments vérifiés | Décision |
|---|---|---|
| **Grand Médine** | Le CETUD identifie explicitement un pôle d'échanges BRT à Grand Médine, destiné à accueillir un terminus BRT et des lignes de rabattement. Le réseau officiel DDD publie des arrêts « Marché Grand Médine » sur les lignes 1 et 23. Le CETUD documente aussi des observations de fréquence DDD au « Pôle d'échange Grand Médine ». | **Candidat prioritaire DDD ↔ BRT**, mais pas encore activé : le cheminement piéton exact entre le point DDD « Marché Grand Médine » et le quai/terminal BRT doit être confirmé avant de fixer une distance de marche. Aucun lien AFTU n'est ajouté sans source correspondante. |
| **Guédiawaye** | Le CETUD situe un pôle BRT devant la mosquée de Guédiawaye et prévoit des lignes de rabattement. Le réseau officiel DDD publie des terminus/dessertes Guédiawaye, notamment les lignes 5 et 12 et la ligne 220. | **À vérifier sur le terrain / plan détaillé** : la correspondance est plausible, mais le point DDD précis et le cheminement jusqu'au pôle BRT ne sont pas encore établis dans le référentiel. |
| **Colobane** | DDD publie Colobane sur ses lignes 18 et 20 ; la gare TER Colobane existe dans le référentiel TER. | **Non activé** : la desserte des deux réseaux est confirmée, mais aucune preuve de cheminement piéton précis entre l'arrêt DDD et l'accès TER n'est consignée. La proximité des coordonnées ne suffit pas. |
| **UCAD** | DDD publie UCAD sur plusieurs lignes, notamment 1, 7, 8 et 20. | **Non activé** : aucun pôle BRT/TER commun ni cheminement documenté vers un arrêt AFTU n'est établi dans les sources consultées. |
| **Lat Dior** | DDD publie Lat Dior comme terminus de la ligne 11 et comme arrêt sur les lignes 18/20. | **Non activé** : la présence DDD est confirmée, mais pas une connexion piétonne documentée avec un arrêt AFTU ou un autre réseau. |

## Sources officielles consultées

1. **CETUD — Les caractéristiques techniques du Projet BRT** (2 mai 2018)  
   https://cetud.sn/les-caracteristiques-techniques-du-projet-brt/  
   Le CETUD situe les pôles d'échanges de Guédiawaye, Grand Médine et Petersen ; précise que ces pôles doivent accueillir un terminus BRT et des lignes de rabattement.

2. **CETUD — Étude / rapport environnemental du Projet BRT**  
   https://cetud.sn/wp-content/uploads/2025/09/EIES_Projet_BRT_Dakar_Janv_2017.pdf  
   Le document contient un plan d'aménagement du pôle d'échange de Grand Médine, avec la station BRT et le terminal de rabattement.

3. **CETUD — Étude de restructuration du réseau BRT, Tome 2**  
   https://cetud.sn/wp-content/uploads/2026/03/10-CETUD-ESRBRT-TOME-2_VF.pdf  
   Le tableau des observations de fréquence DDD mentionne le « Pôle d'échange Grand Médine vers Rond-Point Unité 26 ».

4. **Dakar Dem Dikk — Réseau urbain et lignes de banlieue**  
   https://demdikk.sn/reseau-urbain-dakar/  
   Les fiches publiées listent notamment Marché Grand Médine sur les lignes 1 et 23, UCAD sur plusieurs lignes, Colobane sur les lignes 18/20, et Lat Dior sur les lignes 11/18/20.

5. **Dakar Dem Dikk — Information voyageurs**  
   https://demdikk.sn/info-voyageurs/  
   La page récapitule les lignes urbaines et de banlieue actuellement publiées, dont les lignes 5, 11, 12, 18, 20, 220 et 227.

## Règles de sécurité du calculateur

- Ne pas créer une correspondance à partir de la seule proximité de coordonnées.
- Ne pas inventer une distance de marche ou un accès entre deux quais.
- Ne pas transformer une ligne de rabattement prévue dans un document de projet en desserte opérationnelle confirmée sans preuve d'exploitation.
- Conserver les correspondances déjà documentées de Petersen et les deux correspondances TER ↔ BRT existantes.
- Ne modifier aucun tracé, arrêt, horaire ou fréquence TER/BRT.
- Conserver le libellé public **AFTU** ; ne pas afficher TATA comme réseau séparé.
- GTFS reste hors périmètre et ne bloque pas le travail.

## Prochaine action

Obtenir/recouper un plan d'accès piéton ou une localisation fiable des quais pour Grand Médine et Guédiawaye. Dès que le cheminement est vérifié, créer les liens directionnels nécessaires et les tests associés, sans extrapoler le retour d'une ligne.
