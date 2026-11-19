#!/usr/bin/env node
// Read-only replay of the passenger form. Optionally preflight a service-day edition; never activate it.
import { readFileSync, statSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { createServer } from 'vite'

const { values } = parseArgs({ options: { from: { type: 'string' }, to: { type: 'string' }, at: { type: 'string' },
  edition: { type: 'string' }, 'max-changes': { type: 'string' }, matrix: { type: 'boolean' }, 'step-free': { type: 'boolean' } } })
const departAt = Date.parse(`${values.at}Z`) / 1000
if (!values.at || !/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(values.at) || !Number.isFinite(departAt) || new Date(departAt * 1000).toISOString().slice(0, 16) !== values.at ||
    (!values.matrix && (!values.from || !values.to))) {
  console.error('Spécifier --at AAAA-MM-JJTHH:MM (Dakar) et soit --from landmark:yoff --to 14.7900,-17.3100, soit --matrix. Options : --step-free, --max-changes 0…5, --edition <fichier JSON>.'); process.exit(2)
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
    const selected = options.filter(o => o.selectable).map(o => ({ point: point(o.value),
      group: o.kind === 'landmark' ? 'repère' : (o.kind === 'published' || network.places.has(o.stopId)) ? 'graphe' : 'catalogue seul' }))
    const matrix = {}
    for (const a of selected) for (const b of selected) {
      if (a === b) continue
      const key = `${a.group} → ${b.group}`
      const row = matrix[key] ??= { pairs: 0, whole: 0, sectionsOnly: 0, neither: 0, withChangeLead: 0 }
      const r = plan(a.point, b.point)
      row.pairs++
      if (!r.ok && r.changesToCheck?.length) row.withChangeLead++
      if (r.ok) row.whole++
      else if (r.connections?.sections.length) row.sectionsOnly++
      else row.neither++
    }
    console.log(JSON.stringify({ atDakar: values.at, maxChanges, ...(snapshotId && { snapshotId }), stepFreeOnly: Boolean(values['step-free']), points: selected.length, matrix }, null, 2))
  } else {
    const from = point(values.from), to = point(values.to), r = plan(from, to)
    console.log(`${from.label} → ${to.label} · ${values.at} (Dakar)`)
    if (r.ok) r.options.forEach(t => console.log(tripSummary(t)))
    else {
      console.log(`${r.code} : ${r.message}`)
      if (r.connections) {
        const c = r.connections
        console.log(`Rayon géographique ${c.radiusM} m (pas une marche) · montée : ${c.boardingCount ?? 'point conservé'} · descente : ${c.alightingCount ?? 'point conservé'}`)
        for (const s of c.sections) console.log(`Tronçon seul : ${s.from.name} → ${s.to.name} · ${s.lines.join(' → ')} · ${dakarClock(s.boardAt)}–${dakarClock(s.arriveAt)}`)
      }
      for (const c of r.changesToCheck ?? []) console.log(`À confirmer séparément (${c.hub}) : ${c.before.line} · ${c.before.from} → ${c.before.to} ; ${c.after.line} · ${c.after.from} → ${c.after.to}. ${c.check}`)
      for (const d of r.documentation ?? []) console.log(`Fiche uniquement : ${d.line} · ${d.fromLabel} puis ${d.toLabel}. ${d.window ?? ''}\n${d.url}`)
    }
  }
} finally { await server.close() }
