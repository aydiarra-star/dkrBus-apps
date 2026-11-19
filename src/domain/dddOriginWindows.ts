import type { OriginWindow } from './stopPassageCountdown'

/** Assumed spacing at the DDD origin, in minutes. It is NOT a stop timetable.
 * Both Explorer and the separately reviewed Médina section use these phases. */
export const DDD_ORIGIN_WINDOWS: readonly OriginWindow[] = [
  { start: '05:30', end: '05:59', every: 13 }, { start: '06:00', end: '08:59', every: 8 },
  { start: '09:00', end: '15:59', every: 13 }, { start: '16:00', end: '18:59', every: 8 },
  { start: '19:00', end: '21:00', every: 13 },
]
export function boundedDddWindows(first: string, last: string): OriginWindow[] {
  return DDD_ORIGIN_WINDOWS.flatMap(w => {
    const start = w.start < first ? first : w.start, end = w.end > last ? last : w.end
    return start <= end ? [{ ...w, start, end, includePublishedLast: end === last }] : []
  })
}
