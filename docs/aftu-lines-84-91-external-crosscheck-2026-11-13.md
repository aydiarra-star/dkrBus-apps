# AFTU lignes 84 à 91 — recoupements externes et divergences à conserver

Date : 13 novembre 2026.

## Source primaire AFTU

L'index officiel https://aftu-senegal.org/infos-pratiques/ liste les sept lignes sans page détaillée exploitable :
- 84 : UCAD – Jaxaay
- 85 : Banoba – Liberté 5
- 86 : Tournalou Boune – Toubab Dialaw
- 87 : Bambilor – Mosquée Massalikou Djinane
- 88 : MTOA – Liberté 5
- 89 : Bargny – Croisement Niague (Cité SICAP)
- 91 : APIX – Dougar

Les sept liens « Voir itinéraire » de l'index n'ont pas fourni de pages détaillées exploitables dans l'extraction AFTU. Le compte réseau demeure 65 fiches détaillées + 7 lignes indexées = 72 lignes.

## Recoupement externe de la ligne 84 — divergence de corridor

Deux plateformes tierces consultées exposent des données de la ligne 84 :
- TransitByCity : https://transitbycity.com/fr/senegal/dakar/operators/aftu/routes/84/ ; indique « Terminus Jaxaay » et un terminus générique, 86 arrêts, dernier traitement annoncé le 28 mai 2026.
- Moovit : https://moovitapp.com/index/fr/transport_en_commun-line-84-Dakar-5996-1618038-18051515-1 ; présente « Grand Yoff – Jaxaay », 87 arrêts, avec quelques noms de stations et beaucoup de libellés génériques.

**Divergence importante :** l'index AFTU officiel affiche « UCAD – Jaxaay », alors que les deux plateformes tierces décrivent Grand Yoff/Jaxaay. Le nombre d'arrêts diffère aussi (86 contre 87) et les listes de stations ne sont pas suffisamment nommées pour être assimilées à la fiche officielle.

Décision : garder « UCAD – Jaxaay » comme corridor publié par AFTU ; enregistrer Grand Yoff/Jaxaay comme piste tierce à vérifier, sans remplacer la source officielle ni importer les horaires/fréquences tiers.

## Recoupement externe de la ligne 86 — terminus aval corroboré, origine différente

Un guide pratique 2026 consacré à Toubab Dialaw mentionne un Tata n°86 au départ du rond-point Tally Diallo à Pikine, avec des arrêts sur Rufisque, Bargny et Diamniadio, en direction de Toubab Dialaw :
https://anafonio.sn/wp-content/uploads/2026/01/Itineraire_Detaillee_2.pdf

Cela confirme une piste de desserte vers Toubab Dialaw, mais l'origine « Tally Diallo / Pikine » ne correspond pas exactement au corridor AFTU officiel « Tournalou Boune – Toubab Dialaw ». Le document ne suffit pas à établir la liste complète des arrêts, le sens retour ou la fréquence.

Décision : garder le corridor AFTU officiel et utiliser cette source uniquement comme indice externe pour rechercher la variante et son point de départ.

## Lignes 85, 87, 88, 89 et 91

Aucun document d'itinéraire secondaire suffisamment probant n'a été trouvé pendant ce contrôle. Les corridors de l'index officiel restent les seules données confirmées disponibles. Ne pas générer d'arrêts intermédiaires, de retour ni de fréquence pour ces lignes.

## Règle d'intégration

Les données tierces sont des pistes de recherche, pas des validations opérateur. Les seules données à considérer comme officiellement publiées à ce stade sont les numéros et corridors figurant sur l'index AFTU. Conserver séparément les sources, leur date et leurs divergences ; ne pas écraser les corridors officiels ni injecter des horaires tiers dans le modèle de production.

Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT et aucune fusion de PR.
