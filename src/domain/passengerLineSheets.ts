import { DDD_PUBLISHED_ROUTES } from '../data/dddPublishedRoutes'
import { ALL_CORRIDOR_STOPS } from './corridors'
import type { EstimatedLineSchedule } from './estimatedSchedules'
import { JOURNEY_LANDMARKS } from './journeyLandmarks'
import { normalizeMobility } from './mobilityKnowledge'

interface TextDirection {
  network: 'ddd' | 'aftu'
  line: string
  labels: readonly string[]
  source: string
  url: string
  schedule?: EstimatedLineSchedule
}
interface DirectionFile {
  network: string; code: string
  waypoints?: string[]; detailSourceUrl?: string; outboundSchedule?: EstimatedLineSchedule
  inboundWaypoints?: string[]; inboundDetailSourceUrl?: string; inboundSchedule?: EstimatedLineSchedule
}
const files = import.meta.glob<DirectionFile>(['../data/aftu-*-directions.json', '../data/aftu-66-return.json'], { eager: true, import: 'default' })
const directions: TextDirection[] = DDD_PUBLISHED_ROUTES.filter(r => r.kind === 'published_order' && !r.sourceConflict)
  .map(r => ({ network: 'ddd', line: r.line, labels: r.stops, url: r.sourceUrl, source: r.sourceLabel }))
for (const file of Object.values(files)) {
  if (file.network !== 'aftu') continue
  for (const [labels, url, schedule] of [[file.waypoints, file.detailSourceUrl, file.outboundSchedule],
    [file.inboundWaypoints, file.inboundDetailSourceUrl, file.inboundSchedule]] as const) {
    // Do not use the timetable of a similar line or attach it to an official
    // narrative which doesn't give both directions. One source for this order.
    if (!labels?.length || !url || !schedule || schedule.line !== file.code || url !== schedule.sourceUrl) continue
    directions.push({ network: 'aftu', line: file.code, labels, url, source: schedule.sourceLabel, schedule })
  }
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
