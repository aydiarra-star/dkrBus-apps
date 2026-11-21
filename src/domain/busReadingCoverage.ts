import type { BusBoardDirection, BusBoardLine } from './busPassageBoard'
import { sourceIssue, type SourceHours } from './busSourceHours'

/** Documentary extent of a single occurrence, independently of 'is a
 * countdown running now?'. Friday inherits weekdays only if not specified. */
export const coverageClasses = ['couvert','partiel','non documenté'] as const
export type RankCoverage = typeof coverageClasses[number]
export function rankCoverage(h: SourceHours | undefined, rank: number): RankCoverage {
  if (!h) return 'non documenté'
  const days = [h.weekday, h.friday ?? h.weekday, h.saturday, h.sunday]
  const printed = days.some(g => g?.ranks.includes(rank) && g.profiles.some(p=>p.origins.length))
  if (!printed) return h.samples?.some(s => s.ranks.includes(rank)) ? 'partiel' : 'non documenté'
  // A present, empty grid is the sheet's explicit day off, not a missing
  // Sunday. A partial transcription cannot certify the end of the day.
  return days.every(g => g && g.nextUntranscribedOrigin === null && g.ranks.includes(rank)) ? 'couvert' : 'partiel'
}
const empty = (): Record<RankCoverage,number> => ({couvert:0, partiel:0, 'non documenté':0})
export function directionCoverage(d: BusBoardDirection) {
  const counts = empty()
  if (d.pointKind !== 'arrêts') return counts
  const h = d.sourceHours && !sourceIssue(d.sourceHours,d.points.length) ? d.sourceHours : undefined
  for(let rank=1; rank<=d.points.length; rank++) counts[rankCoverage(h,rank)]++
  return counts
}
export function linesCoverage(lines: readonly BusBoardLine[]) {
  const counts = empty()
  for (const l of lines) if (!l.aliasOf) for (const d of l.directions) {
    const row = directionCoverage(d)
    for (const k of coverageClasses) counts[k] += row[k]
  }
  return counts
}

/** Only URLs already attached at the directional source match. A network
 * index, an undated notice or a generic map is not a directional fallback. */
export function consultationPage(d: BusBoardDirection) {
  if (d.clock?.kind === 'timetable' || d.pointKind !== 'arrêts' || !d.points.length) return
  const url = d.sourceHours?.weekday ? d.sourceHours.source : d.directionPage
  return url?.startsWith('https://') ? url : undefined
}
