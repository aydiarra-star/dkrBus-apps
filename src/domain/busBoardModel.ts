/** All quantities here parameterise signs, never passenger service. See
 * docs/modeles-passages-bus.md for sources, calibration and exclusions. */
import profiles from '../data/bus-board-profiles.json'
import { AFTU_DRAWINGS } from '../data/reviewedAftuDrawings'
import { AFTU_CETUD_SCHEDULE_SETTINGS as cetud } from '../data/aftuScheduleSettings'
import { REFERENCE_COMMERCIAL_SPEED_KPH as speed } from './assumptions'
import type { EstimatedLineSchedule } from './estimatedSchedules'
import { everyDay, rankOffsets, type BusFamily, type ModelClock, type PointKind, type Week } from './busPassageBoard'
import { clockMinutes, MINUTE, type OriginWindow } from './stopPassageCountdown'

const window = (start: string, end: string, every: number): OriginWindow => ({ start, end, every })
const peak = cetud.peakIntervalMinutes, off = cetud.offPeakIntervalMinutes
export const AFTU_MODEL_WEEK = everyDay([
  window(cetud.generalServiceWindow.start, '05:59', (off.min + off.max) / 2),
  window('06:00', '08:59', (peak.min + peak.max) / 2), window('09:00', '16:59', (off.min + off.max) / 2),
  window('17:00', '19:59', (peak.min + peak.max) / 2), window('20:00', cetud.generalServiceWindow.end, (off.min + off.max) / 2),
])
export const DDD_MODEL_WEEK = everyDay([window('05:30', '05:59', 13), window('06:00', '08:59', 8), window('09:00', '15:59', 13),
  window('16:00', '18:59', 8), window('19:00', '21:00', 13)])

export function publishedBounds(start: string, end: string): Week {
  // A published first/last departure constrains a model; it does not prove
  // the frequency in between. Clip each period, and retain the real last.
  return everyDay(DDD_MODEL_WEEK.weekday!.flatMap(w => {
    const a = w.start < start ? start : w.start, b = w.end > end ? end : w.end
    return a <= b ? [{ start: a, end: b, every: w.every, includePublishedLast: b === end }] : []
  }))
}
export function sheetWeek(s: EstimatedLineSchedule): Week {
  const convert = (w: EstimatedLineSchedule['weekday']) => {
    if (!w) return null
    const match = /^(\d+(?:[.,]\d+)?)\s*min$/i.exec(w.interval)
    if (!match || clockMinutes(w.start) === null || (w.end !== '24:00' && clockMinutes(w.end) === null)) return null
    // Ceiling on origin slots, not on vehicles already on the road.
    return [window(w.start, w.end, Number(match[1].replace(',', '.')))]
  }
  return { weekday: convert(s.weekday), saturday: convert(s.saturday), sunday: convert(s.sunday) }
}
export const fixedModelWeek = (start: string, end: string, every: number) => everyDay([window(start, end, every)])

/** Timed checkpoints must match this exact occurrence (including duplicates).
 * Fill only the intervals bracketed by two published samples. */
export function checkpointProfiles(points: readonly string[], samples: readonly [number,string,number,number][]): [number[],number[]] | null {
  if (samples[0]?.[0] !== 1 || samples.at(-1)?.[0] !== points.length || samples[0][2] !== 0 || samples[0][3] !== 0) return null
  const result: [number[],number[]] = [[0],[0]]
  for (const [j, [rank,name,quiet,busy]] of samples.entries()) {
    if (points[rank-1] !== name || !Number.isInteger(rank) || ![quiet,busy].every(x=>Number.isFinite(x) && x>=0)) return null
    if (!j) continue
    const [before,,a,b] = samples[j-1]
    if (rank <= before || quiet < a || busy < b) return null
    for (let i=before+1; i<=rank; i++) {
      const k = (i-before)/(rank-before)
      result[0].push(Math.round((a+k*(quiet-a))*MINUTE)); result[1].push(Math.round((b+k*(busy-b))*MINUTE))
    }
  }
  return result
}

// Whole-corridor lengths, not stop coordinates. Only for the reviewed order
// with matching termini, never for its reverse or a different route number.
const dddMeters: Readonly<Record<string, number>> = { '1': 17872, '4': 12222, '8': 21152, '13': 10562, '16B': 28874, '121': 12318, '218': 25598, '219': 20772, '227': 19780, '232': 15653 }
const historical: Readonly<Record<string, { count: number; perMille: number[]; medianSeconds: number; sequenceCheck: number }>> = profiles
// Coarse fallbacks are for an entire itinerary, not one fabricated bus stop
// per street. The calibration and its small sample are explicit in the report.
const median = (a: number[]) => { const b = [...a].sort((x,y) => x-y); return (b[(b.length-1) >> 1] + b[b.length >> 1]) / 2 }
function sequenceCheck(points: readonly string[]) {
  let h = 2166136261
  for (const b of new TextEncoder().encode(JSON.stringify(points))) h = Math.imul(h ^ b, 16777619)
  return h >>> 0
}
const typicalMeters = { ddd: median(Object.values(dddMeters)), aftu: median(Object.values(AFTU_DRAWINGS).map(d => d.meters)) }
export function modelClock(family: BusFamily, code: string, side: string, points: readonly string[], kind: PointKind,
  options: { week?: Week; originBasis?: string; offsets?: number[]; offsetBasis?: string; duration?: number; owner?: boolean; dddPublished?: boolean } = {}): ModelClock {
  const week = options.week ?? (family === 'ddd' ? DDD_MODEL_WEEK : AFTU_MODEL_WEEK)
  const originBasis = options.originBasis ?? (family === 'ddd' ? 'DDD · modèle 8/13' : 'CETUD · modèle réseau AFTU/TATA')
  const make = (offsetsMs: readonly number[], offsetBasis: string): ModelClock => ({ kind: 'model', week, originBasis, offsetsMs, offsetBasis })
  if (options.offsets) return make(options.offsets, options.offsetBasis!)
  if (points.length === 1) return make([0], 'origine seule')
  const prior = options.owner && historical[`${family}:${code}:${side}`]
  if (prior && prior.count === points.length && prior.sequenceCheck === sequenceCheck(points)) {
    const duration = options.duration ? options.duration * MINUTE : prior.medianSeconds * 1000
    return make(prior.perMille.map(q => Math.round(q * duration / 1000)), options.duration ? 'durée CETUD · profil relatif historique' : 'profil relatif historique apparié')
  }
  if (options.duration) return make(rankOffsets(points.length, options.duration), options.offsetBasis ?? 'durée du sens · interpolation par rang')
  if (kind === 'arrêts') {
    // 80 min for 72 inter-stop intervals in the 84 reference; a family
    // calibration, NOT a mirrored 84 trajectory or a time read off a bus.
    return make(rankOffsets(points.length, (points.length - 1) * 80 / 72), 'rang · calibration 84 (80/72)')
  }
  const drawing = family === 'aftu' && AFTU_DRAWINGS[code]
  const measured = drawing && drawing.from === points[0] && drawing.to === points.at(-1) ? drawing.meters : options.dddPublished && dddMeters[code]
  const meters = measured || typicalMeters[family === 'tata' ? 'aftu' : family]
  return make(rankOffsets(points.length, meters / 1000 / speed[family] * 60), measured ? 'longueur du corridor · vitesse modèle · rang' : 'longueur médiane de référence · vitesse modèle · rang')
}
