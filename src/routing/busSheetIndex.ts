import { PASSENGER_LINE_SHEETS } from '../domain/passengerLineSheets'
import { normalizeSearchTerm } from '../domain/stops'
import type { JourneySettings } from './placeConnections'

/** Index text occurrences, not locations. Repeated calls remain distinct. */
export type Sheet = (typeof PASSENGER_LINE_SHEETS)[number]
const byName = new Map<string, { sheet: Sheet; index: number }[]>()
const prefix = /^(?:terminus|marche|croisement|carrefour|gare routiere|station)(?: de| du| des)? /
for (const sheet of PASSENGER_LINE_SHEETS) sheet.labels.forEach((s, index) => {
  const name = normalizeSearchTerm(s)
  for (const key of new Set([name, name.replace(prefix, '')])) {
    const hits = byName.get(key) ?? []; hits.push({ sheet, index }); byName.set(key, hits)
  }
})
export function sheetHits(name: string) { return byName.get(normalizeSearchTerm(name)) ?? [] }
export function sheetEnabled(s: Sheet, q: JourneySettings) {
  return !q.modes || q.modes.includes(s.network) || (s.network !== 'ddd' && q.modes.includes('aftu_tata'))
}
