/** Display only. Origin slots are compiled once per direction and service day;
 * looking up an occurrence (including repeated names) is a binary search.
 * All arithmetic is in integer milliseconds, Dakar = UTC throughout. */
export const MINUTE = 60_000
export const DAY_MS = 1440 * MINUTE
export const midnight = (ms: number) => Math.floor(ms / DAY_MS) * DAY_MS

export function clockMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

export interface OriginWindow { start: string; end: string; every: number; includePublishedLast?: boolean }
export interface DirectionPassagePlan {
  firstDeparture: string; lastDeparture: string; headwayMinutes: number
  cumulativeMinutesByStop: readonly number[]
}

export function validOffsets(values: readonly number[], count: number): boolean {
  return count > 0 && values.length === count && values[0] === 0 && values.every((v, i) =>
    Number.isSafeInteger(v) && v >= 0 && v < DAY_MS && (!i || v >= values[i - 1]))
}

export function originSlots(window: OriginWindow, day: number): number[] {
  const first = clockMinutes(window.start), step = Math.round(window.every * MINUTE)
  // 24:00 is a service-day end, never a start time on the following day.
  const last = window.end === '24:00' ? 1440 : clockMinutes(window.end)
  if (!Number.isSafeInteger(day) || midnight(day) !== day || first === null || last === null || last < first ||
      !Number.isSafeInteger(step) || step < 1000) return []
  const slots: number[] = [], end = day + last * MINUTE
  for (let t = day + first * MINUTE; t <= end; t += step) slots.push(t)
  // An end-of-window is not an extra bus. Only an independently published
  // last departure (e.g. DDD 1 at Leclerc) permits an off-grid final slot.
  if (window.includePublishedLast && slots.at(-1) !== end) slots.push(end)
  return slots
}

export function nextOccurrence(slots: readonly number[], offsetMs: number, now: number): number | null {
  if (!Number.isFinite(now) || !Number.isSafeInteger(offsetMs) || offsetMs < 0) return null
  let lo = 0, hi = slots.length
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (slots[mid] + offsetMs <= now) lo = mid + 1
    else hi = mid
  }
  return lo < slots.length ? slots[lo] + offsetMs : null
}

export function nextStopPassageCountdown(plan: DirectionPassagePlan | null | undefined, index: number, now = new Date()): number | null {
  if (!plan || !Number.isFinite(now.getTime()) || !Number.isInteger(index) || index < 0 || index >= plan.cumulativeMinutesByStop.length) return null
  const offsets = plan.cumulativeMinutesByStop.map(m => Math.round(m * MINUTE))
  if (!validOffsets(offsets, offsets.length)) return null
  const slots = originSlots({ start: plan.firstDeparture, end: plan.lastDeparture, every: plan.headwayMinutes }, midnight(now.getTime()))
  const next = nextOccurrence(slots, offsets[index], now.getTime())
  return next === null ? null : Math.ceil((next - now.getTime()) / MINUTE)
}
