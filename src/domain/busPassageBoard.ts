/** The display model deliberately has no coordinates, platform IDs or graph
 * edges. An estimate cannot be admitted to the passenger router as a ride. */
import type { SourceHours } from './busSourceHours'
import type { Pattern } from '../routing/model'
import { hasSenegalPublicHolidayCalendar, isSenegalPublicHoliday } from './senegalPublicHolidays'
import { clockMinutes, DAY_MS, midnight, MINUTE, nextOccurrence, originSlots, validOffsets, type OriginWindow } from './stopPassageCountdown'

export type BusFamily = 'ddd' | 'aftu' | 'tata'
export type Side = 'outbound' | 'inbound'
export type Week = Readonly<Record<'weekday' | 'saturday' | 'sunday', readonly OriginWindow[] | null> & { friday?: readonly OriginWindow[] | null }>
export type PointKind = 'arrêts' | 'repères' | 'secteurs' | 'départ seul'
export interface ModelClock {
  kind: 'model'; week: Week; offsetsMs: readonly number[]; peakOffsetsMs?: readonly number[]
  /** Exceptions attached to an origin slot, never extra departures. */
  byOrigin?: Readonly<Record<string, readonly number[]>>
  /** Independently trace the cadence/phase and the time along the direction. */
  originBasis: string; offsetBasis: string
}
interface RunProfile { slots: readonly number[]; offsetsMs: readonly number[] }
export interface ScheduledClock { kind: 'timetable'; profiles: readonly RunProfile[] }
export interface BusBoardDirection {
  label: string; from: string; to: string; points: readonly string[]; pointKind: PointKind
  partialList?: boolean; sourceHours?: SourceHours; clock: ModelClock | ScheduledClock | null; source: string; reason?: string
}
export interface BusBoardLine { key: string; code: string; family: BusFamily; aliasOf?: string; directions: readonly BusBoardDirection[] }
export const BUS_BOARD_MODEL = 'dakar-bus-board/v1'
export const everyDay = (windows: readonly OriginWindow[]): Week => ({ weekday: windows, saturday: windows, sunday: windows })
export function rankOffsets(count: number, durationMinutes: number): number[] {
  if (count < 2 || !Number.isInteger(count) || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return []
  return Array.from({ length: count }, (_, i) => Math.round(i / (count - 1) * durationMinutes * MINUTE))
}
export function transcribedOffsets(times: readonly string[], count: number): number[] | null {
  const minutes = times.map(clockMinutes)
  if (minutes.some(m => m === null)) return null
  const offsets = minutes.map(t => (t! - minutes[0]!) * MINUTE)
  return validOffsets(offsets, count) ? offsets : null
}

function slotsForDay(clock: ModelClock, day: number) {
  // No assertion that a public holiday runs like Sunday, or that an
  // unreviewed year has no public holidays. Dated timetables take precedence.
  if (!hasSenegalPublicHolidayCalendar(day) || isSenegalPublicHoliday(day)) return null
  const dayOfWeek = new Date(day).getUTCDay()
  const windows = clock.week[dayOfWeek === 0 ? 'sunday' : dayOfWeek === 6 ? 'saturday' : dayOfWeek === 5 && clock.week.friday !== undefined ? 'friday' : 'weekday']
  return windows ? [...new Set(windows.flatMap(w => originSlots(w, day)))].sort((a, b) => a - b) : null
}
interface DayProfile { previous: readonly number[]; today: readonly number[] | null; offsets: readonly number[] }
export interface BoardDay { profiles: readonly DayProfile[]; first: number; count: number }
function modelProfiles(clock: ModelClock, day: number): DayProfile[] {
  const today = slotsForDay(clock, day), previous = slotsForDay(clock, day - DAY_MS) ?? []
  if (!clock.peakOffsetsMs && !clock.byOrigin) return [{ today, previous, offsets: clock.offsetsMs }]
  // A run keeps its own profile for the entire trip. Some weekly sheets
  // give distinct columns to the services crossing a change of pace.
  const groups = new Map<readonly number[], { today: number[] | null; previous: number[] }>()
  const group = (offsets: readonly number[]) => {
    const existing = groups.get(offsets)
    if (existing) return existing
    const row = { today: today ? [] as number[] : null, previous: [] as number[] }
    groups.set(offsets, row)
    return row
  }
  group(clock.offsetsMs) // preserve the calendar/closed state even without runs
  const offsetsAt = (t: number) => {
    const time = new Date(t), h = time.getUTCHours(), peak = h >= 7 && h < 10 || h >= 15 && h < 20
    return clock.byOrigin?.[time.toISOString().slice(11,16)] ?? (peak ? clock.peakOffsetsMs ?? clock.offsetsMs : clock.offsetsMs)
  }
  for (const t of today ?? []) group(offsetsAt(t)).today!.push(t)
  for (const t of previous) group(offsetsAt(t)).previous.push(t)
  return Array.from(groups, ([offsets, row]) => ({ offsets, ...row }))
}
export function boardDay(dir: BusBoardDirection, day: number): BoardDay | null {
  const clock = dir.clock, count = dir.points.length
  if (!clock || !Number.isFinite(day) || midnight(day) !== day) return null
  const profiles = clock.kind === 'model' ? modelProfiles(clock, day)
    : clock.profiles.map(r => ({ today: r.slots.filter(t => t >= day && t < day + DAY_MS), previous: [], offsets: r.offsetsMs }))
  if (!profiles.length || profiles.some(p => !validOffsets(p.offsets, count))) return null
  return { count, profiles, first: Math.min(...profiles.map(p => p.today?.[0] ?? Infinity)) }
}
export type BusPassage = { state: 'active'; minutes: number; at: number } | { state: 'upcoming'; at: number }
  | { state: 'unknown' | 'calendar' | 'closed' | 'finished' }
export function busPassage(day: BoardDay | null, index: number, now: number): BusPassage {
  if (!day || !Number.isFinite(now) || !Number.isInteger(index) || index < 0 || index >= day.count) return { state: 'unknown' }
  // Dated running profiles can overtake one another. Compare their next
  // *call*, not just their next origin departure. A late modeled run can also
  // outlive its service day; never roll a finished sign over to tomorrow.
  let at = Infinity, fromPrevious = false
  for (const p of day.profiles) {
    const offset = p.offsets[index], prev = nextOccurrence(p.previous, offset, now), current = nextOccurrence(p.today ?? [], offset, now)
    if (prev !== null && prev < at) { at = prev; fromPrevious = true }
    if (current !== null && current < at) { at = current; fromPrevious = false }
  }
  if (at === Infinity) return { state: day.profiles.some(p => p.today === null) ? 'calendar' : day.first < Infinity ? 'finished' : 'closed' }
  if (!fromPrevious && now < day.first) return { state: 'upcoming', at }
  return { state: 'active', minutes: Math.ceil((at - now) / MINUTE), at }
}

/** Published editions carry their own IDs and ordered calls. Do not guess a
 * catalogue crosswalk from a short name, direction_id or nearby point. */
export function datedBusBoards(patterns: readonly Pattern[], family: BusFamily, day: number): BusBoardLine[] {
  const groups = new Map<string, { direction: BusBoardDirection; code: string; profiles: RunProfile[] }>()
  for (const p of patterns) {
    if (p.mode !== family || p.shape.source !== 'REVIEWED_GTFS_SHAPE' || p.service.kind !== 'timetable' || p.times.kind !== 'offsets') continue
    const slots = p.service.departures.map(t => t * 1000).filter(t => midnight(t) === day).sort((a,b) => a - b)
    if (!slots.length) continue
    const points = p.calls.map(c => c.name), offsetsMs = p.departures.map((s,i) => (i === points.length - 1 ? p.arrivals[i] : s) * 1000)
    if (!validOffsets(offsetsMs, points.length)) continue
    // The edition builder issues gtfs:<snapshot>:<reviewed-direction>:<profile>.
    // No other ID is shortened. Even for the same reviewed direction require
    // the same shape, headsign and ordered stop IDs, not matching stop names.
    const id = /^(gtfs:[^:]+:[A-Za-z0-9_-]+):\d+$/.exec(p.lineId)?.[1] ?? p.lineId
    const key = JSON.stringify([family, id, p.shape.sourceId, p.direction, p.stops])
    let row = groups.get(key)
    if (!row) {
      const profiles: RunProfile[] = []
      row = { code: p.name, profiles, direction: { label: p.direction, from: points[0], to: points.at(-1)!, points, pointKind: 'arrêts',
        source: p.service.source, clock: { kind: 'timetable', profiles } } }
      groups.set(key, row)
    }
    row.profiles.push({ slots, offsetsMs })
  }
  return Array.from(groups, ([key, r]) => ({ key, code: r.code, family, directions: [r.direction] }))
}
