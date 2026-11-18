import { PASSENGER_LINE_SHEETS } from '../domain/passengerLineSheets'
import { getCorridorStop } from '../domain/corridors'
import type { EstimatedLineSchedule } from '../domain/estimatedSchedules'
import { JOURNEY_LANDMARKS } from '../domain/journeyLandmarks'
import { hasSenegalPublicHolidayCalendar, isSenegalPublicHoliday } from '../domain/senegalPublicHolidays'
import { normalizeSearchTerm } from '../domain/stops'
import type { DakarEndpoint, JourneySettings } from './placeConnections'

/** Name matches are useful reading material, not edges. There are deliberately
 * no coordinates, trip IDs, passenger timestamps or transferable stop IDs here. */
export interface DirectionNote {
  line: string
  fromLabel: string
  toLabel: string
  source: string
  url: string
  window: string | null
}
function referenceName(p: DakarEndpoint): string | undefined {
  if (p.kind === 'stop' || (p.stopId && p.landmarkId)) return // different namespaces
  if (p.stopId || p.landmarkId) {
    const ref = p.landmarkId ? JOURNEY_LANDMARKS.find(l => l.id === p.landmarkId) : p.kind === undefined && getCorridorStop(p.stopId!)
    return ref && ref.lat === p.lat && ref.lon === p.lng ? ref.name : undefined
  }
  // A pin exactly on a known map reference may retrieve its documentation.
  // This is NOT a boarding identity; no fuzzy geocoder/nearest municipality.
  const refs = JOURNEY_LANDMARKS.filter(l => l.lat === p.lat && l.lon === p.lng)
  return refs.length === 1 ? refs[0].name : undefined
}

const contextPrefix = /^(?:terminus|marche|croisement|carrefour|gare routiere|station)(?: de| du| des)? /
function mentioned(label: string, name: string) {
  const key = normalizeSearchTerm(label)
  return key === name || key.replace(contextPrefix, '') === name
}
function serviceNote(schedule: EstimatedLineSchedule | undefined, at: number): string | null {
  if (!schedule) return null
  const ms = at * 1000
  if (!hasSenegalPublicHolidayCalendar(ms) || isSenegalPublicHoliday(ms)) return 'Aucune plage spécifique confirmée pour cette date.'
  const date = new Date(ms), day = date.getUTCDay()
  const w = day === 0 ? schedule.sunday : day === 6 ? schedule.saturday : schedule.weekday
  if (!w) return null
  const hhmm = date.toISOString().slice(11, 16)
  const period = day === 0 ? 'dimanche' : day === 6 ? 'samedi' : 'semaine'
  return `${hhmm} ${hhmm >= w.start && hhmm < w.end ? 'dans' : 'hors de'} la plage indicative de la ligne (${period} : ${w.start}–${w.end}, intervalle ${w.interval}). Ce n’est pas une heure de passage à l’arrêt.`
}

export function documentedDirections(from: DakarEndpoint, to: DakarEndpoint, settings: JourneySettings): DirectionNote[] {
  if (settings.stepFreeOnly || !Number.isSafeInteger(settings.departAt) || !Number.isFinite(new Date(settings.departAt * 1000).getTime())) return []
  const a = normalizeSearchTerm(referenceName(from) ?? ''), b = normalizeSearchTerm(referenceName(to) ?? '')
  if (!a || !b || a === b) return []
  const notes: DirectionNote[] = []
  for (const d of PASSENGER_LINE_SHEETS) {
    if (settings.modes && !settings.modes.includes(d.network) && !(d.network === 'aftu' && settings.modes.includes('aftu_tata'))) continue
    const i = d.labels.findIndex(label => mentioned(label, a))
    if (i < 0) continue
    const target = d.labels.find((label, j) => j > i && mentioned(label, b))
    if (!target) continue
    notes.push({ line: `${d.network.toUpperCase()} ${d.line}`, fromLabel: d.labels[i], toLabel: target,
      source: d.source, url: d.url, window: serviceNote(d.schedule, settings.departAt) })
  }
  return notes
}
