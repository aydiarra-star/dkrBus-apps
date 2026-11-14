# AFTU 86–89 — contrôle de rattachement et de validation directionnelle (14 novembre 2026)

## Règle de traitement des répétitions

Une répétition d'un nom d'arrêt n'est pas, à elle seule, une erreur. Un même libellé peut apparaître plusieurs fois dans le même sens ou dans les deux sens, y compris lorsqu'il désigne des passages distincts. Chaque occurrence et sa position sont donc conservées. Aucun dédoublonnage, aucune suppression et aucune fusion de lieux ne sont autorisés sur la seule base d'un nom identique ou proche.

La comparaison Aller/Retour porte sur les séquences ordonnées séparément. Elle sert à repérer les correspondances et les divergences, pas à fabriquer un sens manquant ni à imposer une symétrie.

## Source institutionnelle de référence

La page publique « Infos pratiques » d'AFTU-Sénégal a été relue le 14 novembre 2026 :
https://aftu-senegal.org/infos-pratiques/

Elle publie actuellement les corridors suivants :
- Ligne 86 : Tournalou Boune – Toubab Dialaw.
- Ligne 87 : Bambilor – Mosquée Massalikou Djinane.
- Ligne 88 : MTOA – Liberté 5.
- Ligne 89 : Bargny – Croisement Niague (Cité SICAP).
- Ligne 91 : APIX – Dougar.

Sur cette même page, « Voir itinéraire » pour les lignes 84 à 91 apparaît comme un texte sans lien exploitable dans la page consultée. Cette source confirme donc les numéros et corridors affichés, mais pas les listes détaillées d'arrêts, leur ordre, les deux sens, les horaires ou les fréquences.

## Résultat par ligne

### Ligne 86 — CONFLICTING_SOURCES / rattachement non validé

Le fichier de travail `src/data/aftu-86-directions.json` contient :
- Aller : 68 entrées, de « Yeumbeul (Départ) » à « Terminus 86 (Terminus) » ; le champ destination est « Terminus 86 / Touba Ngayame ».
- Retour : 64 entrées, de « Terminus 86 (Départ) » à « Route De Malika En Face Mairie Yeumbel Sud Et Sgbs (Terminus) ».
- La source de transcription est étiquetée « CETUD — captures transmises par l’utilisateur ».

La page AFTU actuelle rattache pourtant le numéro 86 au corridor « Tournalou Boune – Toubab Dialaw ». Les terminus de la séquence structurée et le corridor institutionnel ne concordent donc pas. La séquence transcrite est conservée intégralement comme donnée source, mais son rattachement au numéro 86 ne peut pas être validé sur la base des preuves actuellement disponibles.

Les heures de la transcription initiale restent explicitement invalidées dans le JSON et ne doivent pas être réutilisées. Aucune heure de passage ni fréquence propre à la ligne n'est validée ici.

### Ligne 87 — CONFLICTING_SOURCES / rattachement non validé

Le fichier `src/data/aftu-87-directions.json` contient :
- Aller : 68 entrées, de « Terminus 79 87 » à « Maristes Terminus 87 ».
- Retour : 71 entrées, de « Maristes Terminus 87 » à « Terminus 79 87 ».
- La source est étiquetée « Application CETUD — captures transmises par l’utilisateur ».

Le profil associé au fichier mentionne des repères théoriques Bambilor 06:30 et Maristes 06:35, mais les libellés exacts des séquences restent « Terminus 79 87 » et « Maristes Terminus 87 ». La page AFTU actuelle publie pour le numéro 87 « Bambilor – Mosquée Massalikou Djinane ». Le terminus retour Maristes n'est pas corroboré par ce corridor institutionnel. La séquence capturée est conservée, mais son rattachement au numéro 87 et ses terminus ne sont pas validés tant que cette divergence n'est pas expliquée par une source datée ou un document opérateur.

Les départs 06:30/06:35 restent des références théoriques transmises, pas des horaires garantis ni des heures de passage. La fréquence variable 5–15 minutes demeure une référence de pointe générale et ne constitue pas une fréquence propre à la ligne.

### Ligne 88 — CONFLICTING_SOURCES / séquences détaillées conservées

La fiche `docs/aftu-line-88-user-provided-directional-stop-lists-2026-11-14.md` conserve :
- Aller : 78 entrées, « Terminus 88 » → « Terminus Liberté 5 ».
- Retour : 81 entrées, « Terminus Liberté 5 » → « Terminus 88 ».
- Les deux listes sont indépendantes et leur ordre d'origine est conservé.

La page AFTU actuelle publie pour la ligne 88 « MTOA – Liberté 5 », et non « Terminus 88 – Liberté 5 ». Le terminus Liberté 5 est commun, mais l'identité du terminus opposé n'est pas encore établie comme équivalente à MTOA. La séquence détaillée ne doit pas être rejetée ; son rattachement officiel au numéro 88 reste toutefois à confirmer.

Le lien exact de la page web d'où proviennent les deux listes détaillées n'est pas présent dans le dossier. La fiche le signale déjà. Il faudra ajouter cette URL pour compléter la traçabilité, sans remettre en cause la transcription fournie.

### Ligne 89 — CONFLICTING_SOURCES / séquences détaillées conservées

La fiche `docs/aftu-line-89-site-source-directional-stop-lists-2026-11-14.md` conserve :
- Aller : 55 entrées, « Terminus 89 » → « Poste Courant Bargny Près De La Gare Ter ».
- Retour : 53 entrées, « Poste Courant Bargny Près De La Gare Ter » → « Terminus 89 ».
- Les deux listes sont indépendantes ; les répétitions et variantes restent conservées.

La page AFTU actuelle publie pour la ligne 89 « Bargny – Croisement Niague (Cité SICAP) ». Le terminus Bargny/Gare TER est cohérent avec le secteur Bargny, mais la correspondance exacte avec « Croisement Niague (Cité SICAP) » et le terminus opposé « Terminus 89 » n'est pas démontrée par l'index. La séquence détaillée reste donc conservée comme source, mais le rattachement complet au corridor institutionnel et l'identité du terminus opposé ne sont pas encore validés.

Comme pour la ligne 88, l'URL exacte de la page source des listes détaillées doit être ajoutée au dossier lorsqu'elle est disponible.

## Ligne 91 — repère à conserver pour la suite

La même page AFTU affiche désormais explicitement « APIX – Dougar » pour la ligne 91. Cela confirme le corridor publié, mais aucune séquence détaillée aller/retour n'est validée par cette seule mention.

## Décision de validation

| Ligne | Séquences disponibles | Identité/corridor officiel | Décision |
|---|---|---|---|
| 86 | 68 aller / 64 retour | Incompatible avec Yeumbeul–Touba Ngayame dans le fichier | CONFLICTING_SOURCES |
| 87 | 68 aller / 71 retour | Bambilor–Massalikou vs Bambilor–Maristes | CONFLICTING_SOURCES |
| 88 | 78 aller / 81 retour | MTOA–Liberté 5 vs Terminus 88–Liberté 5 | CONFLICTING_SOURCES |
| 89 | 55 aller / 53 retour | Bargny–Croisement Niague vs Terminus 89–Bargny Gare TER | CONFLICTING_SOURCES |

**Conclusion :** les transcriptions directionnelles et leurs occurrences sont conservées comme sources de travail fiables telles que transmises. En revanche, il serait incorrect de déclarer les quatre lignes entièrement validées tant que l'identité du numéro et le corridor ne sont pas réconciliés avec la publication AFTU actuelle. Cette distinction évite de perdre des données utiles tout en empêchant de publier une séquence sous un mauvais numéro.

## Actions de validation suivantes

1. Ajouter les URL exactes des pages web sources des listes 88 et 89.
2. Obtenir une preuve opérateur ou une page datée expliquant les différences de terminus pour 86, 87, 88 et 89.
3. Comparer ensuite les séquences Aller/Retour par ordre et par libellé, en conservant chaque occurrence répétée.
4. Ne pas inventer de correspondances de noms, coordonnées, horaires ou fréquences.
5. Ne rien injecter dans le catalogue passager avant résolution des conflits.

Aucune écriture Supabase, aucun déploiement, aucune modification TER/BRT et aucune fusion du PR ne sont effectués par ce rapport.


## Complément de recherche et correction des références — 14 novembre 2026, 09:40

Une nouvelle lecture de l'index AFTU confirme sans ambiguïté l'affectation actuelle des corridors : 86 Tournalou Boune–Toubab Dialaw ; 87 Bambilor–Mosquée Massalikou Djinane ; 88 MTOA–Liberté 5 ; 89 Bargny–Croisement Niague (Cité SICAP). Les anciennes notes internes des fichiers JSON 86 et 87 contenaient des affectations décalées (86 associé à l'ancien corridor du 87 ; 87 associé au corridor du 88). Seuls les champs de note documentaire ont été corrigés dans les deux JSON ; les listes d'arrêts, leurs positions, les nombres d'entrées, les statuts d'horaires et les données opérationnelles n'ont pas été modifiés.

### Ligne 86 — corroboration partielle du secteur d'arrivée
Un guide d'accès à Toubab Dialaw publié en janvier 2026 cite un « bus Tata n° 86 » au départ de Pikine, avec des arrêts à Rufisque, Bargny et Diamniadio. Cela corrobore indépendamment l'association du numéro 86 au secteur de Toubab Dialaw, mais pas le terminus Tournalou Boune ni les 68/64 arrêts de la transcription Yeumbeul–Touba Ngayame. Le décalage entre le corridor officiel actuel, la source secondaire et la séquence transcrite reste donc ouvert.

### Ligne 87 — départ Bambilor corroboré, terminus retour non résolu
L'index officiel confirme Bambilor comme extrémité du corridor 87, ce qui rejoint la référence de départ des captures. Il publie toutefois Mosquée Massalikou Djinane, tandis que les listes capturées se terminent aux Maristes. Aucune source indépendante retrouvée ne confirme que Maristes est une variante, un terminus alternatif ou un changement de service. Les 68/71 entrées restent conservées mais le corridor complet et le numéro restent à confirmer.

### Ligne 88 — MTOA apparaît dans la liste détaillée
La séquence aller de 78 entrées contient explicitement « Devant Mtoa près du dibiterie Le Djolof » au rang 12 ; la séquence retour de 81 entrées contient « Station Mtoa » au rang 71. L'index officiel publie MTOA–Liberté 5. Cela établit que MTOA est bien un repère présent dans les listes détaillées, mais ne démontre pas qu'il est leur terminus : la liste commence à « Terminus 88 » et continue au-delà de MTOA vers Malika, Yeumbeul et Keur Massar. Ne pas raccourcir la séquence ni déplacer son terminus sans preuve de terrain ou opérateur.

### Ligne 89 — cohérence géographique générale avec le corridor officiel
La liste aller de 55 entrées commence par des repères explicitement situés à Niague (Mosquée Tawfekh Niague, établissements et commerces de Niague, station Niague, Lotissement Alassane), puis descend vers Tivaoune Peulh, Keur Massar, Keur Mbaye Fall, Zac Mbao, Rufisque et Bargny Gare TER. Le retour de 53 entrées suit la chaîne opposée dans son propre ordre transcrit. Cette géographie est globalement cohérente avec le corridor officiel Bargny–Croisement Niague, davantage que ne le laissait entendre la première note. Cependant, le point exact « Terminus 89 » n'est pas identifié comme étant le « Croisement Niague (Cité SICAP) » : la ligne est donc **corridor-compatible, terminus précis à confirmer**, et non encore VALIDATED_ROUTE.

### Règle de traitement maintenue
Les comparaisons sont ordinales et directionnelles. Les répétitions telles que « Arrêt Keur Massar », « Keur Massar », les libellés de gares et les arrêts nommés de façon proche sont des occurrences à conserver ; aucune fusion n'est faite à partir d'une égalité de texte. Les sources trouvées ne permettent pas de valider les horaires ou fréquences propres aux lignes 86–89.
