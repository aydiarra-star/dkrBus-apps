/** A partial transcription is NOT a headway. Only printed cells, attached
 * to their own ordered occurrence and day type, may start a source timer. */
import { hasSenegalPublicHolidayCalendar, isSenegalPublicHoliday } from './senegalPublicHolidays'
import { clockMinutes, DAY_MS, midnight, MINUTE, nextOccurrence } from './stopPassageCountdown'
import type { BusPassage } from './busPassageBoard'

export interface SourceGrid {
  ranks: readonly number[] // 1-based, includes the origin
  profiles: readonly { origins: readonly string[]; elapsed: readonly number[] }[]
  // If the grid stops partway through the day, later untranscribed runs
  // could overtake. This is the NEXT printed origin, NOT a generated bus.
  nextUntranscribedOrigin: string | null
}
export interface SourceHours {
  file: string; source: string
  weekday?: SourceGrid; saturday?: SourceGrid; sunday?: SourceGrid
  // Isolated columns / undated receipt. No continuity or service-day claim.
  samples?: readonly { label: string; ranks: readonly number[]; times: readonly string[] }[]
}
const minute = (s: string) => s === '24:00' ? 1440 : clockMinutes(s)
export const hhmm = (min: number) => `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`
const checkRanks = (ranks: readonly number[], n: number) => ranks[0] === 1 && ranks.every((r,i) => Number.isSafeInteger(r) && r <= n && (!i || r > ranks[i-1]))
/** Invalid data fails the offline audit with a source/rank; never sort bad
 * times to make them look plausible. Duplicate stop NAMES remain legal. */
export function sourceIssue(hours: SourceHours, n: number): string | undefined {
  for (const [day,g] of Object.entries({weekday:hours.weekday,saturday:hours.saturday,sunday:hours.sunday})) {
    if (!g) continue
    if (!checkRanks(g.ranks,n)) return `${day}: rang absent, dupliqué ou inversé`
    const origins = new Set<number>(), limit = g.nextUntranscribedOrigin === null ? Infinity : minute(g.nextUntranscribedOrigin)
    if (limit === null) return `${day}: borne de transcription invalide`
    for (const p of g.profiles) {
      if (!p.origins.length || p.elapsed.length !== g.ranks.length || p.elapsed[0] !== 0) return `${day}: colonne incomplète`
      for (const [i,v] of p.elapsed.entries()) if (!Number.isSafeInteger(v) || v < 0 || v >= 1440 || (i && v < p.elapsed[i-1])) return `${day}: heure décroissante/invalide au rang ${g.ranks[i]}`
      for (const t of p.origins) {
        const m = minute(t)
        if (m === null || origins.has(m) || m >= limit) return `${day}: origine ${t} invalide, répétée ou hors transcription`
        origins.add(m)
      }
    }
  }
  for (const s of hours.samples ?? []) {
    if (!checkRanks(s.ranks,n) || s.times.length !== s.ranks.length) return `${s.label}: référence incomplète`
    let previous = -1
    for (const [i,t] of s.times.entries()) {
      // Require service-hour notation for the following day; never infer it.
      const m = /^([01]\d|2[0-9]|3\d|4[0-7]):[0-5]\d$/.test(t) ? Number(t.slice(0,2))*60+Number(t.slice(3)) : -1
      if (m < 0 || m < previous) return `${s.label}: heure invalide au rang ${s.ranks[i]}`
      previous = m
    }
  }
}
export function gridAt(hours: SourceHours, day: number) {
  if (!hasSenegalPublicHolidayCalendar(day) || isSenegalPublicHoliday(day)) return undefined
  const d = new Date(day).getUTCDay()
  return hours[d === 0 ? 'sunday' : d === 6 ? 'saturday' : 'weekday']
}
function compileDay(g: SourceGrid | undefined, day: number) {
  const calls = new Map<number,number[]>()
  const limit = g?.nextUntranscribedOrigin ? day + minute(g.nextUntranscribedOrigin)! * MINUTE : Infinity
  if (g) for (const [i,r] of g.ranks.entries()) {
    const row = g.profiles.flatMap(p => p.origins.map(t => day + (minute(t)! + p.elapsed[i])*MINUTE))
    calls.set(r,row.filter(t => t <= limit).sort((a,b)=>a-b))
  }
  return { calls, limit, known:g !== undefined }
}
export function sourceDay(hours: SourceHours | undefined, n: number, day: number) {
  if (!hours || (!hours.weekday && !hours.saturday && !hours.sunday) || !Number.isSafeInteger(day) || midnight(day) !== day || sourceIssue(hours,n)) return null
  const today = compileDay(gridAt(hours,day),day), prior = compileDay(gridAt(hours,day-DAY_MS),day-DAY_MS)
  return { today, prior, count:n, first:today.calls.get(1)?.[0] ?? Infinity }
}
export function sourcePassage(d: ReturnType<typeof sourceDay>, rank: number, now: number): BusPassage {
  if (!d || !Number.isFinite(now) || !Number.isInteger(rank) || rank < 1 || rank > d.count) return {state:'unknown'}
  const fromToday = d.today.calls.get(rank), a = nextOccurrence(fromToday ?? [],0,now), b = nextOccurrence(d.prior.calls.get(rank) ?? [],0,now)
  if (a === null && b === null) return {state: !d.today.known ? 'calendar' : !fromToday || d.today.limit < Infinity ? 'unknown' : fromToday.length ? 'finished' : 'closed'}
  const at = Math.min(a ?? Infinity,b ?? Infinity)
  return a === at && b !== at && now < d.first ? {state:'upcoming',at} : {state:'active',minutes:Math.ceil((at-now)/MINUTE),at}
}
