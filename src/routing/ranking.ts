import type { Criterion } from './model'

export interface Metrics { at: number; boards: number; walked: number; cadence: number }
/** All labels compared at a node/round have the same set of onward actions.
 * An earlier arrival can wait for any departure available to a later one. */
export function nondominated<T extends Metrics>(set: T[], value: T): void {
  const dominates = (a: T, b: T) => a.at <= b.at && a.walked <= b.walked && a.boards <= b.boards && a.cadence <= b.cadence
  if (set.some(old => dominates(old, value))) return
  for (let i = set.length - 1; i >= 0; i--) if (dominates(value, set[i])) set.splice(i, 1)
  set.push(value)
}
const criteria: Record<Criterion, (l: Metrics) => number[]> = {
  fastest: l => [l.at, l.boards, l.walked],
  changes: l => [Math.max(0, l.boards - 1), l.at, l.walked],
  walking: l => [l.walked, l.at, l.boards],
  simple: l => [Math.max(0, l.boards - 1), l.walked, l.at],
  cadence: l => [l.cadence, l.at, l.boards, l.walked],
}
function before(a: number[], b: number[]) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]
  return false
}
/** One option can win several criteria; never duplicate it to fill the UI.
 * Cadence describes a service interval, never measured punctuality. */
export function rank<T extends Metrics>(labels: readonly T[]): Map<T, Criterion[]> {
  const winners = new Map<T, Criterion[]>()
  for (const criterion of Object.keys(criteria) as Criterion[]) {
    const pool = criterion === 'cadence' ? labels.filter(l => l.boards > 0) : labels
    if (!pool.length || (criterion === 'cadence' && pool.some(l => !Number.isFinite(l.cadence)))) continue
    const key = criteria[criterion]
    const best = pool.reduce((a, b) => before(key(b), key(a)) ? b : a)
    const tags = winners.get(best) ?? []; tags.push(criterion); winners.set(best, tags)
  }
  return winners
}
