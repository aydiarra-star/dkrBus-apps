/** Source selection shared by the passenger component and its offline audit.
 * Compiling rows is a day operation; each tick only looks up the next cell. */
import { boardDay, busPassage, type BusBoardDirection } from './busPassageBoard'
import { sourceDay, sourcePassage } from './busSourceHours'

export function compileSign(d: BusBoardDirection, day: number, estimates = false) {
  const dated = d.clock?.kind === 'timetable'
  const reading = sourceDay(d.sourceHours,d.points.length,day)
  const grids = [d.sourceHours?.weekday,d.sourceHours?.saturday,d.sourceHours?.sunday]
  const ranked = new Set(grids.flatMap(g => g?.ranks ?? []))
  const clock = dated || estimates ? boardDay(d,day) : null
  return { reading, at(rank: number, now: number) {
    if (dated) return { kind:'dated' as const, passage:busPassage(clock,rank-1,now) }
    // Never use a model to fill a missing day or restart a partial grid.
    if (ranked.has(rank)) return { kind:'weekly' as const, passage:sourcePassage(reading,rank,now) }
    if (estimates && clock) return { kind:'model' as const, passage:busPassage(clock,rank-1,now) }
    return { kind:'none' as const, passage:{state:'unknown' as const} }
  } }
}
