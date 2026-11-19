import { MARISTES_ID, maristesSheets, timetableReviewWeek, timetableStops, type TimetableSheet } from '../data/maristesTimetables'
import { clockMinutes } from '../domain/stopPassageCountdown'
import type { JourneySettings } from './placeConnections'
import { dayOf } from './serviceTime'

/** Deliberately not an Itinerary. A shared *schedule* stop is not proof of
 * the same physical boarding position or of a directed walk. */
export interface ScheduledLeg { line: string; towards: string; url: string; from: string; to: string; start: number; end: number }
export type TimetableAdvice = { kind: 'hours-only'; legs: ScheduledLeg[]; gapSeconds: number | null; marginSeconds: number }
  | { kind: 'unavailable'; message: string }
const no = (message: string): TimetableAdvice => ({ kind: 'unavailable', message })
const lookup = new Map(timetableStops.map(s => [s.id, s]))
// Buffer for comparing two published minutes, NOT a measured walk time.
export const MIN_SCHEDULE_MARGIN_SECONDS = 180
const hour = 3600

function legs(sheet: TimetableSheet, from: string, to: string, day: number): ScheduledLeg[] {
  const a = sheet.calls.findIndex(c => c.id === from), b = sheet.calls.findIndex(c => c.id === to)
  if (a < 0 || b <= a) return []
  return sheet.rows.flatMap(row => {
    const first = clockMinutes(row[a]), last = clockMinutes(row[b])
    return first !== null && last !== null && last > first ? [{ line: sheet.line, towards: sheet.towards, url: sheet.url,
      from, to, start: day + first * 60, end: day + last * 60 }] : []
  })
}

export function compareTimetables(from: string, to: string, settings: JourneySettings): TimetableAdvice {
  const { departAt, modes, maxChanges = 3, transferBufferSeconds = 0, stepFreeOnly } = settings
  if (!lookup.has(from) || !lookup.has(to) || from === to) return no('Choisissez deux arrêts distincts des fiches horaires.')
  if (stepFreeOnly) return no('Accessibilité des arrêts et du changement non vérifiée. Aucun parcours sans marches proposé.')
  if (!Number.isSafeInteger(departAt) || !Number.isFinite(new Date(departAt * 1000).getTime()) ||
      !Number.isInteger(maxChanges) || maxChanges < 0 || maxChanges > 5 || !Number.isSafeInteger(transferBufferSeconds) || transferBufferSeconds < 0) return no('Date, heure ou réglage de correspondance non valide.')
  const date = new Date(departAt * 1000).toISOString().slice(0, 10)
  if (date < timetableReviewWeek.first || date > timetableReviewWeek.last) return no('Pas de grille relue pour ce jour. Consultez les horaires de la ligne.')
  const sheets = maristesSheets.filter(s => !modes || modes.includes(s.mode) || (s.mode === 'aftu' && modes.includes('aftu_tata')))
  const day = dayOf(departAt), marginSeconds = Math.max(MIN_SCHEDULE_MARGIN_SECONDS, transferBufferSeconds)
  const choices: ScheduledLeg[][] = []
  const canStart = (l: ScheduledLeg) => l.start >= departAt && l.start <= departAt + hour
  for (const before of sheets) {
    for (const l of legs(before, from, to, day)) if (canStart(l)) choices.push([l])
    if (maxChanges === 0) continue
    for (const after of sheets) {
      if (before === after) continue
      for (const first of legs(before, from, MARISTES_ID, day).filter(canStart)) {
        for (const next of legs(after, MARISTES_ID, to, day)) {
          const gap = next.start - first.end
          if (gap >= marginSeconds && gap <= hour) choices.push([first, next])
        }
      }
    }
  }
  // Earliest arrival among reviewed rows, then fewer changes, then later start.
  const best = choices.sort((a,b) => a.at(-1)!.end - b.at(-1)!.end || a.length - b.length || b[0].start - a[0].start)[0]
  return best ? { kind: 'hours-only', legs: best, gapSeconds: best.length === 2 ? best[1].start - best[0].end : null, marginSeconds }
    : no('Aucun enchaînement dans les courses relues pour ces arrêts, cette heure et ces réglages. Cela ne signifie pas que le service est terminé.')
}
