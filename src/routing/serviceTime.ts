import { hasSenegalPublicHolidayCalendar, isSenegalPublicHoliday } from '../domain/senegalPublicHolidays'
import type { FrequencyWindow, Service } from './model'

export const DAY = 86_400
export const dayOf = (at: number) => Math.floor(at / DAY) * DAY
const integer = Number.isSafeInteger
export function validService(service: Service): boolean {
  if (!service.source.trim()) return false
  if (service.kind === 'timetable') return service.departures.length > 0 && service.departures.every((t, i, a) => integer(t) && t >= 0 && (!i || t > a[i - 1]))
  return service.kind === 'frequency' && service.windows.length > 0 && service.windows.every(w =>
    integer(w.start) && integer(w.end) && w.start >= 0 && w.start < w.end && w.end <= DAY &&
    integer(w.every) && w.every > 0 && w.every <= DAY && w.weekdays.length > 0 &&
    w.weekdays.every(d => integer(d) && d >= 0 && d <= 6) && ['include', 'exclude', 'as-weekday'].includes(w.holidays))
}
function applies(w: FrequencyWindow, day: number): boolean {
  if (w.holidays !== 'as-weekday') {
    if (!hasSenegalPublicHolidayCalendar(day * 1000)) return false
    if (isSenegalPublicHoliday(day * 1000)) return w.holidays === 'include'
  }
  return w.weekdays.includes(new Date(day * 1000).getUTCDay())
}
export interface Departure { originAt: number; every: number | null }
/** First compatible run of EACH cadence window: a later, more frequent
 * window can be a nondominated alternative. No frequency => no departure.
 * The query is for one service day, not an implicit wait until tomorrow. */
export function nextRuns(service: Service, day: number, ready: number, offset: number): Departure[] {
  const earliest = ready - offset
  if (service.kind === 'timetable') {
    const minimum = Math.max(day, earliest)
    let lo = 0, hi = service.departures.length
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (service.departures[mid] < minimum) lo = mid + 1
      else hi = mid
    }
    const at = service.departures[lo]
    return at !== undefined && at < day + DAY ? [{ originAt: at, every: null }] : []
  }
  return service.windows.flatMap(w => {
    if (!applies(w, day)) return []
    const start = day + w.start
    const at = start + Math.max(0, Math.ceil((earliest - start) / w.every)) * w.every
    return at < day + w.end ? [{ originAt: at, every: w.every }] : []
  })
}

/** A small board for the selected ride (not another trip search). A smaller
 * headway in another window must not hide the next chronological passage. */
export function followingPassages(service: Service, day: number, start: number, offset: number): number[] {
  const result = [start]
  while (result.length < 3) {
    const runs = nextRuns(service, day, result[result.length - 1] + 1, offset)
    if (!runs.length) break
    result.push(Math.min(...runs.map(r => r.originAt + offset)))
  }
  return result
}
