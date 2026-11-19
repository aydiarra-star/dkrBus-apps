// Evidence ledger. No service, geometry, alias or transfer is ever created here.
const sides = ['outbound', 'inbound']
const textKinds = new Set(['source-order','directional-sheet','owner-sequence','reader-sheet','circuit'])
const bus = mode => ['ddd','aftu','tata'].includes(mode)
const key = p => JSON.stringify([p.mode, p.lineId, p.direction])
const unique = a => [...new Set(a)]
const norm = s => s?.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('fr').replace(/[\s\u00a0]+/g,' ').trim()
const endpoints = e => e.labels?.length ? [e.labels[0], e.labels.at(-1)] : e.termini
const sameEnds = (a,b) => a?.length === 2 && b?.length === 2 && a.every((v,i) => v && norm(v) === norm(b[i]))
function markedEnds(m) {
  const marker = role => m?.markers.find(([r]) => r === role)?.[1]
  return m?.orientation ? [marker('start'), marker('finish')] : undefined
}

/** A reviewed key links ONE admitted pattern to an inventory identity and
 * says whether its reviewed scope spans the whole line. A short name, number
 * or GTFS direction_id alone cannot answer that question. Unlike the lookup,
 * the output of the real passenger search needs no such external assertion. */
export function busReadiness(inventory, observations, dossiers, replay, at, links = []) {
  if (replay.atDakar !== at || !replay.wholeForm || replay.stepFreeOnly || !Array.isArray(replay.admittedServices) || !Array.isArray(replay.rideWitnesses) ||
      replay.points !== new Set(replay.pointIds).size || Object.values(replay.exclusive).reduce((a,b) => a+b,0) !== replay.points * (replay.points-1)) throw Error('Matrice exhaustive du formulaire courant, à la date et à l’heure demandées, requise.')
  const witnesses = new Map(replay.rideWitnesses.map(w => [key(w),w]))
  const mappings = new Map(links.map(l => [key(l), l]))
  if (mappings.size !== links.length) throw Error('Attribution dupliquée.')
  const byLine = new Map(), assigned = new Set()
  for (const p of replay.admittedServices.filter(p => bus(p.mode))) {
    const k = key(p), m = mappings.get(k)
    if (!m || !m.reference?.trim() || !sides.includes(m.side) || !['whole','section'].includes(m.scope) || !inventory.lines.some(l => l.network === p.mode && l.code === m.code)) throw Error(`Périmètre et attribution explicites requis : ${k}`)
    assigned.add(k)
    const id = `${p.mode}:${m.code}`, entries = byLine.get(id) ?? []
    entries.push({ ...p, side: m.side, scope: m.scope, reference: m.reference, witness: witnesses.get(k) }); byLine.set(id, entries)
  }
  if (links.length !== assigned.size || replay.rideWitnesses.some(w => bus(w.mode) && !assigned.has(key(w)))) throw Error('Desserte absente de cette édition ou témoin non attribué.')
  const rows = inventory.lines.map(({network, code, evidence: e}) => {
    const id = `${network}:${code}`, active = byLine.get(id) ?? []
    const text = e.filter(v => textKinds.has(v.kind) && v.labels?.length)
    const map = network === 'aftu' ? observations.drawings[code] : undefined // never lend the AFTU drawing to TATA
    const relations = observations.relations.filter(r => r.identity[0] === network && r.identity[1] === code)
    const axisSource = ['owner-sequence','directional-sheet','source-order'].map(kind => text.find(v => v.side === 'outbound' && v.kind === kind)).find(Boolean)
    const firstPublished = text.find(v => v.side === 'as-published')
    const publishedEnds = network === 'tata' && firstPublished?.source === 'tata-lines.json' ? firstPublished.termini : firstPublished && endpoints(firstPublished)
    const pins = markedEnds(map)
    // This axis only labels the columns. If no field documents side A, use the
    // map's explicitly marked endpoints, else the source order, else the title.
    const usePins = !axisSource && pins?.every(Boolean)
    const axis = axisSource ? endpoints(axisSource) : usePins ? pins : publishedEnds ?? e.find(v => v.kind === 'catalogue')?.termini
    const backSource = text.find(v => v.side === 'inbound' && v.source === axisSource?.source)
    const back = backSource ? endpoints(backSource) : axis?.slice().reverse() // comparison key ONLY, never evidence
    const sideOf = ends => sameEnds(axis, back) ? null : sameEnds(axis,ends) ? 'outbound' : sameEnds(back,ends) ? 'inbound' : null
    const mapSide = sideOf(pins)
    const pieces = e.filter(v => v.kind === 'cartographic-section')
    const direction = Object.fromEntries(sides.map(side => {
      // Do not move an explicitly labelled return into outbound merely because
      // the TITLE is backwards. Unventilated lists need both literal ends.
      const lists = text.filter(v => v.side === side || (v.side === 'as-published' && sideOf(endpoints(v)) === side))
      const full = active.filter(p => p.side === side && p.scope === 'whole')
      return [side, { physical: full.some(p => p.physicalCallRanks.length === p.calls), fullShape: !!full.length,
        textCounts: unique(lists.map(v => v.labels.length)).sort((a,b)=>a-b),
        unconfirmed: e.some(v => v.kind === 'unconfirmed-return' && v.side === side),
        mapMeasured: mapSide === side, relations: relations.filter(r => sideOf([r.from,r.to]) === side).map(r => r.id) }]
    }))
    const contacts = dossiers.filter(d => d.busSources.includes(id)).map(d => ({ dossier: d.dossier, from: d.from.stopId, to: d.to.stopId,
      assessments: [d,...d.otherServiceDirections].map(v => ({ status: v.status, timed: v.timed, missing: v.findings.map(f => f.code) })) }))
    const runs = active.map(p => ({ side: p.side, kind: p.service, atOriginOnDay: p.originDepartures, nextOrigin: p.nextOrigin }))
    return { network, code, axis: axis ?? null, axisSource: axisSource?.source ?? (usePins ? 'AFTU Start/Finish' : firstPublished?.source ?? 'catalogue'), direction,
      mapSide, map: map ?? null, relations, pieces: pieces.map(p => ({ id: p.id, toward: p.side, meters: p.meters })),
      transfers: contacts, runs, active, sources: unique(e.flatMap(v => v.url ? [v.url] : [])), conflicts: e.filter(v => v.conflict || v.kind === 'crosscheck').map(v => v.conflict || v.note),
      serviceNotes: { timeCount: Math.max(0,...e.map(v => v.sourceTimeCount ?? 0)), otherCorridor: e.some(v => v.scope === 'other-corridor'),
        window: e.some(v => v.kind === 'terminal-window'), indicative: e.some(v => (['service-reference','operating-profile'].includes(v.kind) || v.frequency) && !v.scope) },
      calculation: active.flatMap(p => p.witness ? [p.witness] : []),
      blocker: active.length ? null : 'AUCUNE_DIRECTION_ADMISE' }
  })
  return { atDakar: at, snapshotId: replay.snapshotId ?? null, points: replay.points, pairs: replay.points*(replay.points-1),
    wholeJourneySha256: replay.wholeJourneySha256, exclusive: replay.exclusive, includes: replay.includes, observationsRevision: observations.sourceRevision, rows }
}

export function readinessTable(r) {
  const out = ['# Peut-on calculer un trajet sur chaque ligne de bus ?', '', `**${r.atDakar.replace('T',' à ')} (Dakar)** · ${r.points} sélections, ${r.pairs} couples orientés effectivement essayés. ${r.exclusive.whole} voyages complets, dont **${r.includes.bus} avec DDD/AFTU/TATA** et **${r.includes.anyChange} avec changement**. ${r.snapshotId ? `Édition : ${r.snapshotId}.` : 'Application embarquée, sans édition opérateur.'}`, '',
    'Une ligne du tableau est un **couple provenance/code**, pas forcément un service distinct. Sept questions : quais ordonnés A/R, tracé entier A/R, correspondance, départ du jour et résultat du calcul. **A** est orienté par la fiche directionnelle, sinon les marqueurs de la carte, l’ordre du texte ou le titre ; **R** est évalué indépendamment. Le titre n’atteste ni A ni R. Les variantes non équivalentes restent à part.', '',
    '**Lecture.** « Non · 93 noms » = une liste de 93 occurrences, pas 93 quais validés. « Carte » = dessin de l’opérateur ; « voirie candidate » = au moins une chaîne possible au contrôle géométrique, pas un sens homologué. L’absence de tracé *entier* n’efface pas une portion. Les départs sont ceux à l’origine d’une direction admise pour cette date ; une fenêtre, une cadence de référence ou les heures successives aux arrêts ne les remplacent pas. « Aucun dossier ciblé » ne signifie pas « aucune correspondance dans la ville ». Les témoins proviennent uniquement des **étapes d’un voyage complet** ; un changement à vérifier ou un tronçon de remplacement n’est pas compté.', '',
    '[Méthode, cas concrets et reproduction](revue-bus-2026-11-19.md) · [Tableau détaillé des pièces locales](couverture-sources-bus.md) · [Mesures par page, variante historique et relation](../data/bus-review/sources-2026-11-19.json).', '']
  const compact = s => String(s).replaceAll('|','\\|').replace(/\s+/g,' ').trim()
  for (const family of ['ddd','aftu','tata']) {
    const rows = r.rows.filter(l => l.network === family)
    out.push(`## ${family.toUpperCase()} — ${rows.length} identités`, '', '| Code · sens de lecture A | Quais A | Quais R | Tracé entier A | Tracé entier R | Changement | Départs du jour | Calcul |', '|---|---|---|---|---|---|---|---|')
    for (const l of rows) {
      const d = side => l.direction[side]
      const q = side => d(side).physical ? 'Établis' : `Non${d(side).textCounts.length ? ` · ${d(side).textCounts.join('/')} noms` : d(side).unconfirmed ? ' · inversion écartée' : ''}`
      const g = side => d(side).fullShape ? 'Admis' : d(side).mapMeasured ? `Carte · ${l.map.possible ? 'voirie candidate' : 'écarts de voirie'}` : d(side).relations.length ? 'Relation à revoir' : 'Non établi'
      const n = l.serviceNotes, timing = l.runs.length ? l.runs.map(s => s.kind === 'timetable' ? String(s.atOriginOnDay) : 'fréquence').join(' / ') : `0${n.timeCount ? ` · ${n.timeCount} heures aux arrêts` : n.otherCorridor ? ' · autre grille écartée' : n.window ? ' · bornes seules' : n.indicative ? ' · indicatif seul' : ''}`
      const change = l.calculation.find(w => w.changeExample), example = change?.changeExample ?? l.calculation.find(w => w.directExample)?.directExample
      const transfers = change ? 'Témoin daté' : l.transfers.length ? `${l.transfers.length} sens étudiés · aucun témoin` : 'Aucun dossier ciblé'
      const calc = example ? `${example.from} → ${example.to}` : l.blocker ? 'Aucune direction admise' : 'Aucun témoin à cette heure'
      out.push(`| **${l.code}**${l.axis ? ` · ${compact(l.axis.join(' → '))}` : ' · sens non établi'} | ${q('outbound')} | ${q('inbound')} | ${g('outbound')} | ${g('inbound')} | ${transfers} | ${timing} | ${compact(calc)} |`)
    }
    out.push('')
    if (family === 'tata') continue
    out.push('**Pièces avec leur orientation propre.** Pas de rapprochement sur le seul numéro : un terminus différent peut désigner une variante. Les écarts portent sur le dessin dans son sens marqué ; aucune archive n’est utilisée comme service du jour.', '')
    for (const l of rows.filter(l => l.map || l.relations.length)) {
      const m = l.map
      if (m) {
        const pins = m.markers.map(([role,name]) => `${role} « ${name || 'sans nom'} »`).join(', ')
        const road = m.possible == null ? 'sens non résolu, voirie non testée' : m.possible ? 'chaîne possible' : Object.entries(m.roadGaps).map(([k,[n,ranks]]) => `${k === 'NO_DIRECTED_ROAD' ? 'sans chaussée compatible' : 'rupture'} : ${n} segment(s), rang(s) ${ranks.join(', ')}${ranks.length < n ? '…' : ''}`).join(' ; ')
        out.push(`- **${family.toUpperCase()} ${l.code}** : ${compact(pins)}. ${m.vertices} sommets, ${m.meters} m ; ${road}. ${m.archive?.length ? `${m.archive.filter(v => v.at20[2]).length}/${m.archive.length} suites historiques compatibles à 20 m (de bout en bout).` : 'Pas de suite historique testée pour ce dessin.'}`)
      }
      for (const p of l.relations) out.push(`- **${family.toUpperCase()} ${l.code}** : [${p.id} v${p.version}](https://www.openstreetmap.org/relation/${p.id}/history/${p.version}), ${compact(p.from ?? '?')} → ${compact(p.to ?? '?')}. ${p.stops} membres d’arrêt, ${p.ways} ways ; ${p.breaks.length} rupture(s) de nœuds, ${p.directionConflicts.length} conflit(s) orienté(s), ${p.outside.length} occurrence(s) à plus de 20 m. ${p.orderedRoadChainPossible ? 'Chaîne possible, étendue commerciale non établie.' : 'Chaîne entière non établie.'}`)
    }
    out.push('')
  }
  return out.join('\n')
}
