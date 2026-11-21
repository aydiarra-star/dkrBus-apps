import { AFTU73_SHEETS } from '../data/aftu73Checkpoints'
import { checkpointOffsets, sequenceCheck } from './busBoardModel'
import type { BusBoardDirection } from './busPassageBoard'
import { clockMinutes, MINUTE, originSlots } from './stopPassageCountdown'

/** Refine only the matching secondary sign. Fall back to its labelled rank
 * model on drift; a different day grid must not inherit yesterday's columns. */
export function thiaroyeCheckpoints(d: BusBoardDirection): BusBoardDirection {
  const s = AFTU73_SHEETS.find(s => s.page === d.source && s.from === d.from && s.to === d.to)
  const clock = d.clock
  if (!s || d.pointKind !== 'arrêts' || clock?.kind !== 'model' || clock.originBasis !== s.page ||
      clock.week.friday !== undefined || sequenceCheck(d.points) !== s.sequence) return d
  const byOrigin: Record<string, number[]> = {}
  const distinct = new Map<string, number[]>()
  for (const day of ['weekday','saturday','sunday'] as const) {
    const cols = day === 'weekday' ? s.weekday : s.weekend
    const start = clockMinutes(cols.start)
    const slots = clock.week[day]?.flatMap(w => originSlots(w, 0)) ?? []
    if (start === null || !slots.length || slots.length !== cols.arrival.length || (typeof cols.cem !== 'number' && cols.cem.length !== slots.length)) return d
    for (const [i, t] of slots.entries()) {
      if (t !== (start + cols.every * i) * MINUTE) return d
      const cem = typeof cols.cem === 'number' ? cols.cem : cols.cem[i], end = cols.arrival[i]
      const key = `${cem}/${end}`, hhmm = new Date(t).toISOString().slice(11,16)
      let offsets = distinct.get(key)
      if (!offsets) {
        const profile = checkpointOffsets(d.points, [[1,s.origin,0], [s.cemRank,'Cem Thiaroye',cem], [75,s.terminal,end]])
        if (!profile) return d
        distinct.set(key, profile); offsets = profile
      }
      // byOrigin is keyed by clock time. Shared times in the weekday and
      // weekend tables must carry IDENTICAL offsets before they can share it.
      if (byOrigin[hhmm] && byOrigin[hhmm] !== offsets) return d
      byOrigin[hhmm] = offsets
    }
  }
  return { ...d, clock: { ...clock, offsetsMs: byOrigin[s.weekday.start], byOrigin, originBasis: s.grid,
    offsetBasis: 'Moovit · origine, CEM Thiaroye et arrivée par départ ; autres rangs interpolés' } }
}
