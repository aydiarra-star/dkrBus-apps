import { BUS_OPERATOR_CONTACTS, type BusOperatorContact } from '../domain/busOperatorContacts'
import { normalizeSearchTerm } from '../domain/stops'
import { sheetEnabled, sheetHits } from './busSheetIndex'
import { referenceName, sheetClosingTime } from './documentedDirections'
import type { Network, Pattern, Place } from './model'
import { selectedVertex, type DakarEndpoint, type JourneySettings } from './placeConnections'
import { dayOf, nextRuns } from './serviceTime'

/** A guide to two separate enquiries, NOT an Itinerary. No transfer arc,
 * access geometry, departure after a change, fare or combined duration. */
export type ChangeSide = { line: string; from: string; to: string } & (
  { kind: 'sheet'; source: string; url: string; contact: BusOperatorContact } |
  { kind: 'section'; section: { from: Place; to: Place } }
)
export interface ChangeLead { hub: string; check: string; before: ChangeSide; after: ChangeSide }

// Exact labels in the published descriptions, not interchangeable stop IDs.
// See docs/preparer-une-correspondance.md. Never join every identical street
// or commune name: e.g. Colobane Rufisque is not the Dakar bus station.
interface Sector { name: string; calls: string[]; references?: string[]; labels: string[]; check: string }
const sectors: Sector[] = [
  { name: 'Petersen', calls: ['brt-petersen'], references: ['ddd-petersen', 'aftu-petersen'], labels: ['Petersen', 'Terminus Petersen', 'Terminus Gare Petersen'], check: 'Identifier le quai du bus et l’accès BRT ou bus correspondant dans le pôle.' },
  { name: 'Colobane', calls: ['ter-colobane'], references: ['ddd-colobane', 'aftu-colobane', 'tata-colobane'], labels: ['Colobane', 'Terminus Colobane', 'Terminus Gare de Colobane'], check: 'Distinguer gare TER, gare DDD et gare routière AFTU. Demander les deux accès et les traversées.' },
  { name: 'Bargny · gare ferroviaire', calls: ['ter-bargny'], labels: ['Terminus Bargny (Gare ferroviaire)'], check: 'Localiser le terminus AFTU 74, la sortie de la gare TER et le chemin à pied entre les deux.' },
  { name: 'Guédiawaye', calls: ['brt-prefecture-guediawaye'], references: ['ddd-guediawaye'], labels: ['Terminus Guédiawaye'], check: 'Confirmer la position du terminus de bus par rapport au pôle BRT. Notaire n’est pas assimilé à Préfecture.' },
  { name: 'Grand Médine', calls: ['brt-grand-medine'], labels: ['Marché Grand Médine', 'HLM Grand Médine'], check: 'Vérifier l’arrêt de bus exact : le marché et les HLM ne désignent pas le quai BRT.' },
  { name: 'UCAD', calls: [], labels: ['UCAD', 'Terminus Université Cheikh Anta Diop'], check: 'Demander de quel côté de l’avenue et à quel portail se trouvent les deux arrêts.' },
  { name: 'Lat Dior', calls: [], labels: ['Lat Dior', 'Terminus Lat-Dior', 'Gare Lat Dior'], check: 'Confirmer les deux emplacements de bus ; un terminus et un point de passage peuvent être distincts.' },
  { name: 'Gare de Dakar / Petersen', calls: ['ter-dakar', 'brt-petersen'], labels: [], check: 'Deux sites distincts. Faire confirmer le chemin de gare à gare, ses traversées et sa durée.' },
  { name: 'Colobane / Place de la Nation', calls: ['ter-colobane', 'brt-place-nation'], labels: [], check: 'Deux sites distincts. Vérifier le chemin entre la gare TER et la station BRT.' },
]
const indexed = sectors.map(s => ({ ...s, names: new Set(s.labels.map(normalizeSearchTerm)) }))

/** Two selected references already describe the sites to be checked. Do not
 * send the rider out to a distant hub and back in lieu of the missing walk. */
export function interchangeQuestion(from: DakarEndpoint, to: DakarEndpoint) {
  if (!from.stopId || !to.stopId || from.stopId === to.stopId || !referenceName(from) || !referenceName(to)) return
  const sector = sectors.find(s => [from.stopId!, to.stopId!].every(id => s.calls.includes(id) || s.references?.includes(id)))
  return sector && `Changement à vérifier : ${sector.name}. ${sector.check} Aucun cheminement piéton vérifié entre les deux points.`
}

type Candidate = { side: ChangeSide; identity: string; count: number; closes?: number; pattern?: Pattern; i?: number; j?: number }
function sides(net: Network, point: DakarEndpoint, sector: typeof indexed[number], before: boolean, q: JourneySettings): Candidate[] {
  const list: Candidate[] = [], v = selectedVertex(net, point)
  if (v) {
    for (const p of net.patterns) {
      if (!p.stops.includes(v.id) || (q.modes && !q.modes.includes(p.network) && !q.modes.includes(p.mode))) continue
      for (const hub of sector.calls) {
        const i = p.stops.indexOf(before ? v.id : hub), j = p.stops.indexOf(before ? hub : v.id)
        if (i < 0 || j <= i || !nextRuns(p.service, dayOf(q.departAt), q.departAt, p.departures[i]).length) continue
        const from = p.calls[i], to = p.calls[j]
        list.push({ side: { kind: 'section', line: p.name, from: from.name, to: to.name, section: { from, to } }, identity: p.lineId, count: j-i, pattern: p, i, j })
      }
    }
    return list // a selected TER/BRT/GTFS call is not a bus locality
  }
  const name = referenceName(point)
  if (!name || !sector.names.size) return []
  for (const { sheet, index } of sheetHits(name)) {
    if (!sheetEnabled(sheet, q)) continue
    const closes = sheetClosingTime(sheet.schedule, q.departAt)
    if (closes !== undefined && q.departAt >= closes) continue
    for (let k = 0; k < sheet.labels.length; k++) {
      if ((before ? k <= index : k >= index) || !sector.names.has(normalizeSearchTerm(sheet.labels[k]))) continue
      const from = sheet.labels[before ? index : k], to = sheet.labels[before ? k : index]
      if (from === to) continue
      list.push({ closes, identity: `${sheet.network === 'ddd' ? 'ddd' : 'minibus'}:${sheet.line}`, count: Math.abs(k-index),
        side: { kind: 'sheet', line: `${sheet.network.toUpperCase()} ${sheet.line}`, from, to, url: sheet.url, source: sheet.source,
          contact: BUS_OPERATOR_CONTACTS[sheet.network === 'ddd' ? 'ddd' : 'aftu'] } })
    }
  }
  return list
}

export function prepareChanges(net: Network, from: DakarEndpoint, to: DakarEndpoint, q: JourneySettings): ChangeLead[] {
  if (q.stepFreeOnly || q.maxChanges === 0 || (from.lat === to.lat && from.lng === to.lng)) return []
  const results: ChangeLead[] = []
  for (const s of indexed) {
    const first = sides(net, from, s, true, q)
    if (!first.length) continue
    const second = sides(net, to, s, false, q)
    // Prefer the simplest pair of descriptions per sector, NOT “fastest”.
    let best: { a: Candidate; b: Candidate } | undefined
    for (const a of first) for (const b of second) {
      if (a.identity === b.identity || (best && a.count + b.count >= best.a.count + best.b.count)) continue
      if (a.pattern && (b.pattern || b.closes !== undefined)) {
        const day = dayOf(q.departAt), pa = a.pattern, pb = b.pattern
        const earliest = Math.min(...nextRuns(pa.service, day, q.departAt, pa.departures[a.i!]).map(r => r.originAt + pa.arrivals[a.j!]))
        // Even with *zero* walking time this second service would be over.
        // Passing the bound is NOT evidence that the change is reachable.
        const ready = earliest + (q.transferBufferSeconds ?? 180)
        if ((b.closes !== undefined && ready >= b.closes) || (pb && !nextRuns(pb.service, day, ready, pb.departures[b.i!]).length)) continue
      }
      best = { a, b }
    }
    if (best) results.push({ hub: s.name, check: s.check, before: best.a.side, after: best.b.side })
  }
  return results
}
