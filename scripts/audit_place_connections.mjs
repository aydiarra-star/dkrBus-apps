#!/usr/bin/env node
// Read-only replay of the passenger form. Optionally preflight a service-day edition; never activate it.
import { readFileSync, statSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { createServer } from 'vite'

const { values } = parseArgs({ options: { from: { type: 'string' }, to: { type: 'string' }, at: { type: 'string' },
  points: { type: 'string' }, edition: { type: 'string' }, 'max-changes': { type: 'string' }, matrix: { type: 'boolean' }, 'step-free': { type: 'boolean' } } })
const departAt = Date.parse(`${values.at}Z`) / 1000
if (!values.at || !/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(values.at) || !Number.isFinite(departAt) || new Date(departAt * 1000).toISOString().slice(0, 16) !== values.at ||
    (!values.matrix && (values.points || !values.from || !values.to))) {
  console.error('Spécifier --at AAAA-MM-JJTHH:MM (Dakar) et soit --from landmark:yoff --to 14.7900,-17.3100, soit --matrix [--points fichier-identifiants.json]. Options : --step-free, --max-changes 0…5, --edition <fichier JSON>.'); process.exit(2)
}
const server = await createServer({ configFile: false, appType: 'custom', server: { middlewareMode: true, hmr: false, watch: null, ws: false } })
try {
  const { localPassengerData, dakarNetwork, planDakarJourney } = await server.ssrLoadModule('/src/routing/dakar.ts')
  const { buildStopIndex } = await server.ssrLoadModule('/src/domain/stops.ts')
  const { tripSummary, dakarClock } = await server.ssrLoadModule('/src/routing/presentation.ts')
  let network = dakarNetwork, snapshotId
  const maxChanges = Number(values['max-changes'] ?? 3)
  if (!Number.isInteger(maxChanges) || maxChanges < 0 || maxChanges > 5) throw Error('--max-changes : entier de 0 à 5 attendu.')
  if (values.edition) {
    if (statSync(values.edition).size > 6_000_001) throw Error('Édition trop volumineuse.')
    const v = JSON.parse(readFileSync(values.edition, 'utf8'))
    const { admitPassengerEdition } = await server.ssrLoadModule('/src/routing/passengerEdition.ts')
    snapshotId = v.snapshot_id
    network = admitPassengerEdition(v, snapshotId, values.at.slice(0, 10), localPassengerData)
    if (!network) throw Error('Édition refusée par le moteur voyageur. Rien n’est activé.')
  }
  const options = buildStopIndex([], network.places.values(), snapshotId)
  function point(value) {
    const option = options.find(o => o.selectable && o.value === value)
    if (option) return { label: option.label, lat: option.lat, lng: option.lon,
      ...(option.kind === 'landmark' ? { kind: 'map', landmarkId: option.value } : option.kind === 'published' ? { kind: 'stop', stopId: option.stopId, snapshotId } : { stopId: option.stopId }) }
    if (/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(value)) {
      const [lat, lng] = value.split(',').map(Number); return { kind: 'map', label: value, lat, lng }
    }
    throw Error(`Point inconnu : ${value}. Choisir un identifiant landmark:…, ref:… ou published:… (avec --edition), ou une paire latitude,longitude.`)
  }
  if (network.rejected.length) throw Error(`Admission refusée : ${network.rejected.join(', ')}`)
  const plan = (a, b) => planDakarJourney(a, b, { departAt, maxChanges, stepFreeOnly: Boolean(values['step-free']) }, network)
  if (values.matrix) {
    // Count every ordered pair of distinct local form selections. Retain
    // separate identities even for catalogue poles at identical coordinates.
    const form = new Map(options.filter(o => o.selectable).map(o => [o.value, o]))
    const ids = values.points ? JSON.parse(readFileSync(values.points, 'utf8')) : [...form.keys()]
    if (!Array.isArray(ids) || ids.length < 2 || new Set(ids).size !== ids.length || !ids.every(id => form.has(id))) throw Error('Cohorte invalide : fournir des identifiants de sélections distincts du formulaire courant.')
    const selected = ids.map(id => form.get(id)).map(o => ({ point: point(o.value),
      group: o.value.startsWith('landmark:bus-osm-') ? 'repère de portion bus' : o.kind === 'landmark' ? 'repère' : (o.kind === 'published' || network.places.has(o.stopId)) ? 'graphe' : 'catalogue seul' }))
    const matrix = {}
    // Exclusive best evidence for the requested pair. Unlike withBusMap and
    // withChangeLead below, these bins can be added to recover the denominator.
    const totals = { whole: 0, exactBusMap: 0, stopSection: 0, nearbyBusMap: 0, changeLead: 0, lineSheet: 0, noProposal: 0 }

    // Within whole journeys only. These overlapping counters are not extra trips.
    const includes = { accessWalk: 0, egressWalk: 0, transferWalk: 0, bus: 0 }
    for (const a of selected) for (const b of selected) {
      if (a === b) continue
      const key = `${a.group} → ${b.group}`
      const row = matrix[key] ??= { pairs: 0, whole: 0, sectionsOnly: 0, neither: 0, withChangeLead: 0, withBusMap: 0, withExactBusMap: 0, wholeWithBus: 0 }
      const r = plan(a.point, b.point)
      const exact = !r.ok && r.mapSections?.some(s => s.fromGapM === null && s.toGapM === null)
      const bin = r.ok ? 'whole' : exact ? 'exactBusMap' : r.connections?.sections.length ? 'stopSection'
        : r.mapSections?.length ? 'nearbyBusMap' : r.changesToCheck?.length ? 'changeLead' : r.documentation?.length ? 'lineSheet' : 'noProposal'
      totals[bin]++
      row.pairs++
      if (!r.ok && r.changesToCheck?.length) row.withChangeLead++
      if (!r.ok && r.mapSections?.length) row.withBusMap++
      if (exact) row.withExactBusMap++
      if (r.ok) {
        const legs = r.options.flatMap(t => t.legs)
        if (legs.some(l => l.kind === 'ride' && ['aftu','ddd','tata'].includes(l.mode))) { row.wholeWithBus++; includes.bus++ }
        for (const role of ['access', 'egress', 'transfer']) if (legs.some(l => l.kind === 'walk' && l.role === role)) includes[`${role}Walk`]++
      }
      if (r.ok) row.whole++
      else if (r.connections?.sections.length) row.sectionsOnly++
      else row.neither++
    }
    console.log(JSON.stringify({ atDakar: values.at, maxChanges, ...(snapshotId && { snapshotId }), stepFreeOnly: Boolean(values['step-free']), points: selected.length, pointIds: ids, exclusive: totals, includes, matrix }, null, 2))
  } else {
    const from = point(values.from), to = point(values.to), r = plan(from, to)
    console.log(`${from.label} → ${to.label} · ${values.at} (Dakar)`)
    if (r.ok) for (const t of r.options) {
      console.log(tripSummary(t))
      for (const leg of t.legs) console.log(`  ${leg.kind === 'walk' ? `Marche (${leg.role})` : leg.lineName} : ${leg.from.name} → ${leg.to.name} · ${Math.round(leg.meters)} m · ${dakarClock(leg.start)}–${dakarClock(leg.end)}`)
    }
    else {
      console.log(`${r.code} : ${r.message}`)
      if (r.connections) {
        const c = r.connections
        console.log(`Rayon géographique ${c.radiusM} m (pas une marche) · montée : ${c.boardingCount ?? 'point conservé'} · descente : ${c.alightingCount ?? 'point conservé'}`)
        for (const s of c.sections) console.log(`Tronçon seul : ${s.from.name} → ${s.to.name} · ${s.lines.join(' → ')} · ${dakarClock(s.boardAt)}–${dakarClock(s.arriveAt)}`)
      }
      for (const c of r.changesToCheck ?? []) console.log(`À confirmer séparément (${c.hub}) : ${c.before.line} · ${c.before.from} → ${c.before.to} ; ${c.after.line} · ${c.after.from} → ${c.after.to}. ${c.check}`)
      for (const s of r.mapSections ?? []) console.log(`Carte uniquement : ${s.review.family.toUpperCase()} ${s.review.line} vers ${s.review.towards} · ${s.markers[0].name} → ${s.markers.at(-1).name} · ${Math.round(s.meters)} m sur voirie · aucun horaire.`)
      for (const d of r.documentation ?? []) console.log(`Fiche uniquement : ${d.line} · ${d.fromLabel} puis ${d.toLabel}. ${d.window ?? ''}\n${d.url}`)
    }
  }
} finally { await server.close() }
