import { DDD_PUBLISHED_ROUTES } from '../data/dddPublishedRoutes'
import { DDD_501_PROJECT_SEQUENCE } from '../data/ddd501ProjectSequence'
import { ALL_CORRIDOR_STOPS } from './corridors'
import type { EstimatedLineSchedule } from './estimatedSchedules'
import { JOURNEY_LANDMARKS } from './journeyLandmarks'
import { BUS_LINES, TATA_BUS_LINES, normalizeMobility } from './mobilityKnowledge'

interface TextDirection {
  network: 'ddd' | 'aftu' | 'tata'
  line: string
  labels: readonly string[]
  source: string
  url: string
  schedule?: EstimatedLineSchedule
  officialLineUrl?: string
}
interface DirectionFile {
  network: string; code: string; sourceStatus?: string; validatedByProjectOwner?: boolean
  directions?: Partial<Record<'outbound' | 'inbound', { waypoints: string[] }>>
  waypoints?: string[]; detailSourceUrl?: string; outboundSchedule?: EstimatedLineSchedule
  inboundWaypoints?: string[]; inboundDetailSourceUrl?: string; inboundSchedule?: EstimatedLineSchedule
}
const files = import.meta.glob<DirectionFile>(['../data/aftu-*-directions.json', '../data/aftu-66-return.json'], { eager: true, import: 'default' })
const directions: TextDirection[] = DDD_PUBLISHED_ROUTES.filter(r => r.kind === 'published_order' && !r.sourceConflict)
  .map(r => ({ network: 'ddd', line: r.line, labels: r.stops, url: r.sourceUrl, source: r.sourceLabel }))
// Link to the actual transcription, not an operator home page as if it
// published these exact labels. A reading sheet has no boarding coordinates.
const transcription = 'https://github.com/aydiarra-star/dkrBus-apps/blob/e6240379239c4dc4750520930974ca38f151f0b7/src/'
const reviewedNames: Record<string, [number, number]> = { '83': [93,90], '84': [73,73], '88': [78,81], '89': [55,53], '90': [82,82], '91': [70,70] }
for (const file of Object.values(files)) {
  if (file.network !== 'aftu' || file.code.endsWith('-unverified')) continue
  const counts = reviewedNames[file.code]
  const out = file.directions?.outbound?.waypoints, back = file.directions?.inbound?.waypoints
  if (counts && out?.length === counts[0] && back?.length === counts[1] && (file.validatedByProjectOwner ||
      (file.code === '90' && file.sourceStatus === 'user-validated-directional-sequences') ||
      (file.code === '84' && file.sourceStatus === 'user-provided-cetud-reference'))) {
    for (const labels of [out, back]) directions.push({ network: 'aftu', line: file.code, labels,
      source: 'Transcription fournie au projet · ordre des libellés, passage non confirmé', url: `${transcription}data/aftu-${file.code}-directions.json` })
  }
  // An official overview is a separate reading link, never the source of the
  // stop order or timetable below. Do not manufacture URLs from line numbers.
  const detail = BUS_LINES.find(l => l.network === 'aftu' && l.code === file.code)?.detailSourceUrl
  const officialLineUrl = detail?.startsWith('https://aftu-senegal.org/map/') ? detail : undefined
  for (const [labels, url, schedule] of [[file.waypoints, file.detailSourceUrl, file.outboundSchedule],
    [file.inboundWaypoints, file.inboundDetailSourceUrl, file.inboundSchedule]] as const) {
    // Do not use the timetable of a similar line or attach it to an official
    // narrative which doesn't give both directions. One source for this order.
    if (!labels?.length || !url || !schedule || schedule.line !== file.code || url !== schedule.sourceUrl) continue
    directions.push({ network: 'aftu', line: file.code, labels, url, source: schedule.sourceLabel, schedule, officialLineUrl })
  }
}

// For the following official sheets the *body* gives the order, even where
// the overview title lists the termini in the opposite order (e.g. 24).
const checkedAftu = new Set(['3', '4', '24', '25', '29', '30', '33', '39', '40', '74'])
for (const r of BUS_LINES) {
  if (r.network !== 'aftu' || !checkedAftu.has(r.code) || !r.waypoints.length || r.detailSourceUrl !== `https://aftu-senegal.org/map/dakar-urbain-ligne-${r.code}/`) continue
  directions.push({ network: 'aftu', line: r.code, labels: r.waypoints, url: r.detailSourceUrl, source: 'AFTU · descriptif dans l’ordre publié' })
}
// The app capture for 501 documents Port–Palais 2, not a merged
// Gare de Dakar–Palais–Leclerc service. Keep its own order in each direction.
for (const d of Object.values(DDD_501_PROJECT_SEQUENCE.directions)) {
  directions.push({ network: 'ddd', line: '501', labels: d.waypoints,
    source: 'Fiche de l’application DDD transmise au projet · variante Port / Palais 2, sans horaires', url: `${transcription}domain/bidirectionalBusLines.ts` })
}
// Admit independent TATA reading material only where the directional URL,
// both endpoints and the transcription agree. No historical tariff sheets.
const slug = (s: string) => normalizeMobility(s).replace(/[^a-z0-9]+/g, '-')
for (const r of TATA_BUS_LINES) {
  const url = r.detailSourceUrl
  if (!r.waypoints.length || !r.note?.includes('source indépendante non officielle') || url !== `https://www.covoiturage.sn/bus-tata-itineraire/ligne/${r.code}/${slug(r.origin)}/${slug(r.destination)}/`) continue
  directions.push({ network: 'tata', line: r.code, labels: [r.origin, ...r.waypoints, r.destination], url, source: 'Covoiturage.sn · fiche TATA indépendante' })
}
// A published circuit is readable in order without wrapping it across the
// terminus, splitting it into two lines or inventing the opposite direction.
for (const r of DDD_PUBLISHED_ROUTES.filter(r => r.kind === 'published_circuit' && !r.sourceConflict)) {
  directions.push({ network: 'ddd', line: r.line, labels: r.stops, url: r.sourceUrl, source: r.sourceLabel })
}

export const PASSENGER_LINE_SHEETS: readonly TextDirection[] = directions

// Keep qualified names such as « Carrefour Keur Massar » from resolving to
// the embedded municipality. The line sheet identifies a label, NOT a point.
const geolocated = new Set([...JOURNEY_LANDMARKS.map(p => p.name), ...ALL_CORRIDOR_STOPS.flatMap(p => [p.name, ...p.aliases])].map(normalizeMobility))
const embeddedNames = [...geolocated].filter(n => n.length >= 3).map(n => ` ${n} `)
const named = new Map<string, { id: string; name: string; lines: Set<string> }>()
for (const d of directions) for (const name of d.labels) {
  const key = normalizeMobility(name)
  if (geolocated.has(key) || !embeddedNames.some(n => ` ${key} `.includes(n))) continue
  const item = named.get(key) ?? { id: `sheet:${key}`, name, lines: new Set<string>() }
  item.lines.add(`${d.network}:${d.line}`); named.set(key, item)
}
export const QUALIFIED_SHEET_LABELS = [...named.values()]
