# Reçus de la revue bus — date de service 2026-11-19 (Dakar)

Ces fichiers servent à la revue hors ligne. Aucun n’est chargé comme réseau dans le navigateur.

- [`sources-2026-11-19.json`](sources-2026-11-19.json) : mesures de la [collecte des pages officielles AFTU](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44584780753/job/135774669030) ([artefact](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44584780753/artifacts/14560613167)) et de la [revue régionale des relations](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44584780667/job/135774669811) ([artefact](https://github.com/aydiarra-star/dkrBus-apps/actions/runs/44584780667/artifacts/14559633031)). Ces deux jobs ont abouti sur `621849d` et sur le **même PBF**, dont l’empreinte est enregistrée. La réponse AFTU est **partielle**, pas un certificat d’exhaustivité du site. Les tableaux `at20`/`at80` comptent `[occurrences hors bande, occurrences sans progression, succès global]`. Ce dernier tient aussi compte des bouts, des rangs ex æquo et des données manquantes. Les rangs sont à base 1 ; `unmeasured` n’est pas une liste de distances nulles. Les archives de CI contiennent les diagnostics de rang plus détaillés ; elles peuvent expirer.
- [`replay-2026-11-19.json`](replay-2026-11-19.json) : requêtes sur les 144 sélections du formulaire sans API à 19 h. Les compteurs `exclusive` partitionnent les couples ; `includes` ne porte que sur les **voyages complets** et ses colonnes se chevauchent. `rideWitnesses` cite des **étapes réellement renvoyées**. Une fréquence dans `admittedServices` n’est pas convertie en un nombre de départs d’origine du jour. Les rangs physiques exigent les rôles applicables : montée au premier, descente au dernier, les deux aux appels intermédiaires.
- [`replay-panneaux-v1-2026-11-19.json`](replay-panneaux-v1-2026-11-19.json) : même formulaire, options et heure après correction des deux titres TATA 59/60. Ce gel antérieur à la portion de Médina est conservé, avec le [tableau par ligne de cette révision](https://github.com/aydiarra-star/dkrBus-apps/blob/1a415a1a6995e916e942de5b4210e5e05b023479/docs/etat-par-ligne-2026-11-19.md). L’empreinte des 716 voyages ne change pas ; 976 pistes documentaires, 334 fiches seules et 13 712 sans proposition. [Comparaison et test des minutes](../../docs/modeles-passages-bus.md).
- [`comparaison-2026-11-19.json`](comparaison-2026-11-19.json) : sept paires de reçus à cohortes, date, heure et options identiques sur `0c6cf56` et sur l’édition du 19. L’empreinte est calculée en flux sur les couples de sélections et les options/étapes, pas sur les totaux. La cohorte de 144 IDs de `0c6cf56` et les sélections du formulaire courant coïncident ici ; **cela n’est pas présumé pour un futur formulaire**.

- [`comparaison-panneaux-v1-2026-11-19.json`](comparaison-panneaux-v1-2026-11-19.json) : mêmes sept cohortes, rejouées cette fois sur une extraction `git archive 32f3776` **sans remplacement de scripts**, puis sur la version des panneaux. Au total 121 854 couples par version. Les IDs, modes, directions, témoins et empreintes de voyages complets sont identiques pour chacune des sept comparaisons ; les catégories documentaires sont conservées séparément.

### Calculateur : deux formulaires, trois dénominateurs

- [Rejeu constant sur les 144 IDs](replay-calculateur-144-2026-11-19.json) : même empreinte que les 716 voyages du gel panneaux ; 58 tronçons de remplacement supplémentaires, pas 58 voyages complets.
- [Formulaire géographique étendu](replay-calculateur-2026-11-19.json) : 150 sélections, 731 complets, 15 directs DDD 1, zéro changement. Seul ce reçu `wholeForm: true` peut alimenter le tableau courant par ligne. [Attribution locale](local-pattern-bindings.json) : `section`, six quais **vers Leclerc**, pas un crédit à la ligne entière. Une éventuelle édition opérateur doit toujours fournir **ses propres** attributions.
- [Fiches horaires à 05 h](horaires-maristes-2026-11-19-0500.json) et [à 19 h](horaires-maristes-2026-11-19-1900.json) : 20 couples de fiches dans chaque test. Les 2 enchaînements possibles ne sont ni des `Itinerary` ni des témoins d’accès. La CI rejoue les deux matrices géographiques et les deux comparaisons horaires indépendamment. [Sources, exemples et commandes](../../docs/trajets-bus-medina-maristes.md).

**Droits et périmètre.** Voirie et relations : [© les contributeurs OpenStreetMap](https://www.openstreetmap.org/copyright), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Les positions des polylignes Waymark acquises dans la CI restent temporaires. Aucune liste de coordonnées ou grille de départ de l’archive historique AFTU n’est redistribuée. Les géométries locales effectivement réutilisées pour les **portions** ont [leur propre registre de sources](../bus-sections/README.md).

### Reproduction

Pour recréer le reçu de sources à partir des annotations (ou lors d’une nouvelle revue), vérifier au préalable avec `gh api .../check-runs/<id>` la conclusion **et** le `head_sha` des deux jobs de mesure. Ce ne sont ni les numéros de run ni le job de migration de la base privée.

```sh
repo=aydiarra-star/dkrBus-apps
rev=621849d6149bfd892727355fb647bc160f4240a5
base=https://github.com/$repo/actions/runs
gh api --paginate --slurp --jq 'add' "repos/$repo/check-runs/135774669030/annotations?per_page=100" > /tmp/aftu-notes.json
gh api --paginate --slurp --jq 'add' "repos/$repo/check-runs/135774669811/annotations?per_page=100" > /tmp/osm-notes.json
python3 scripts/freeze_bus_checks.py /tmp/aftu-notes.json /tmp/osm-notes.json "$rev" \
    "$base/44584780753/job/135774669030" "$base/44584780667/job/135774669811" /tmp/sources.json
cmp /tmp/sources.json data/bus-review/sources-2026-11-19.json
```

Pour recalculer avec le code de cette revue : voir le [tableau par ligne](../../docs/etat-par-ligne-2026-11-19.md). La CI compare également le reçu du formulaire **octet par octet** à une nouvelle exécution. Pour rejouer les mesures anciennes avec la même instrumentation, sans changer de branche :

```sh
root=$PWD; ancien=$(mktemp -d)
git archive 0c6cf56 | tar -x -C "$ancien"
mkdir -p "$ancien/scripts/lib"; cp scripts/lib/journeyWitness.mjs "$ancien/scripts/lib/"
cp scripts/audit_place_connections.mjs "$ancien/scripts/"; ln -s "$root/node_modules" "$ancien/node_modules"
for dir in "$ancien" "$root"; do (
  cd "$dir"
  node scripts/audit_place_connections.mjs --matrix --at 2026-11-19T19:00 \
      --points "$root/data/bus-sections/selection-0c6cf56.json"
); done
```

Changer l’heure, le fichier `--points` ou ajouter `--step-free` comme indiqué dans chaque reçu de comparaison. On ne recopie **aucune** source ni règle de calcul du code actuel vers l’ancien.
