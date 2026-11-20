/** Display transcriptions. No stop IDs, platform bindings or router imports. */
import type { BusBoardDirection, BusFamily } from './busPassageBoard'
import type { SourceGrid, SourceHours } from './busSourceHours'
import { hhmm } from './busSourceHours'
import { clockMinutes } from './stopPassageCountdown'
import { AFTU73_SHEETS } from '../data/aftu73Checkpoints'
import { DDD311_PRINTED } from '../data/ddd311BoardSheets'
import { DDD12_SHEETS } from '../data/ddd12DirectionSheets'
import { DDD16B_CHECKPOINTS } from '../data/dddSecondaryBoardSheets'
import { DDD_319_PROFILES } from '../data/busBoardCallSheets'
import { DDD_PUBLISHED_DEPARTURE_WINDOWS } from '../data/dddPublishedDepartureWindows'
import { maristesSheets } from '../data/maristesTimetables'
import { sequenceCheck } from './busBoardModel'
import aftu84 from '../data/aftu-84-directions.json'

interface Sheet { family: BusFamily; code: string; side: 'outbound'|'inbound'; from: string; to: string; points: string[]; source: string; timetable: string; fillBlankFrom?: string; weekdays: SourceGrid; weekend?: SourceGrid }
const files = import.meta.glob<Sheet>('../data/bus-sheets/*.json', {eager:true,import:'default'})
/** Fill only the specifically reviewed empty index slot. Preserve the index
 * as a second source. A different axis, variant or nonempty list is never
 * overwritten; the independent hourly sheet remains available separately. */
export function withNewSheetDirections(family: BusFamily, code: string, base: readonly BusBoardDirection[]): BusBoardDirection[] {
  const result = [...base]
  const matches = Object.entries(files).filter(([,s]) => s.family===family && s.code===code)
    .sort(([,a],[,b]) => b.side.localeCompare(a.side))
  for (const [path,s] of matches) {
    const side = s.side==='outbound' ? 'Aller' : 'Retour'
    const sheet: BusBoardDirection = {label:`${side} · fiche hebdomadaire`, from:s.from, to:s.to,
      points:s.points, pointKind:'arrêts', source:s.source, clock:null,
      sourceHours:{file:path.replace('../','src/'), source:s.timetable, weekday:s.weekdays, saturday:s.weekend, sunday:s.weekend}}
    const slots = s.fillBlankFrom ? result.filter(d => !d.points.length && !d.clock && !d.sourceHours &&
      d.label===side && d.from===s.from && d.to===s.to && d.source===s.fillBlankFrom) : []
    if (slots.length===1) result[result.indexOf(slots[0])] = {...sheet, indexSource:slots[0].source}
    else result.push(sheet)
  }
  return result
}
interface RankedGrid { page:string; sequence:number; source:string; weekday:SourceGrid; friday?:SourceGrid; saturday?:SourceGrid; sunday?:SourceGrid; weekend?:SourceGrid; family?:BusFamily; code?:string; side?:Sheet['side']; first?:string; last?:string; printedLabels?:SourceHours['printedLabels'] }
const grids = import.meta.glob<RankedGrid>('../data/weekly-cells/*.json',{eager:true,import:'default'})
const ranks = (n: number) => Array.from({length:n},(_,i)=>i+1)
const sample = (origin: string, elapsed: readonly number[], rr = ranks(elapsed.length)) => ({label:`Colonne ${origin}`,ranks:rr,times:elapsed.map(m=>hhmm(clockMinutes(origin)!+m))})
// The original two samples remain visible even at ranks not yet in a grid.
const malikaSamples = () => [0,1].map(i=>sample(i?'07:00':'00:00',DDD16B_CHECKPOINTS.map(c=>c[i?3:2]),DDD16B_CHECKPOINTS.map(c=>c[0])))
export function existingSheetHours(family: BusFamily, code: string, d: BusBoardDirection): SourceHours | undefined {
  const m = d.clock
  if (!d.points.length || m?.kind === 'timetable') return
  if (family === 'aftu' && code === '73') {
    // The model already verified the exact page, sequence and all column counts.
    const s = AFTU73_SHEETS.find(s=>s.grid === m?.originBasis && s.page === d.source)
    if (!s) return
    const make = (c: typeof s.weekday): SourceGrid => ({ ranks:[1,s.cemRank,75], nextUntranscribedOrigin:null, profiles:c.arrival.map((v,i)=>({origins:[hhmm(clockMinutes(c.start)!+i*c.every)],elapsed:[0,typeof c.cem==='number'?c.cem:c.cem[i],v]})) })
    return {file:'src/data/aftu73Checkpoints.ts',source:s.grid,weekday:make(s.weekday),saturday:make(s.weekend),sunday:make(s.weekend)}
  }
  if (family === 'ddd' && code === '311') {
    const table = DDD311_PRINTED.find(({sheet}) => sheet.source === d.source && sheet.points === d.points)
    if (!table) return
    const make = (profiles: SourceGrid['profiles']): SourceGrid => ({ranks:ranks(d.points.length),nextUntranscribedOrigin:null,profiles})
    return {file:'src/data/ddd311BoardSheets.ts',source:table.sheet.timetable,weekday:make(table.weekday),saturday:make(table.saturday),sunday:make([])}
  }
  if (family === 'aftu' && code === '84' && d.points === aftu84.directions.inbound.waypoints) {
    return {file:'src/data/aftu-84-directions.json',source:aftu84.sourceLabel,samples:[{label:'Relevé non daté',ranks:ranks(d.points.length),times:aftu84.directions.inbound.times}]}
  }
  const idx = d.label.startsWith('Retour') ? 1 : 0
  const matches = Object.entries(grids).filter(([path,g]) =>
    path.split('/').at(-1)?.startsWith(`${family}-${code}-`) && g.page === d.source &&
    (g.family === undefined || (g.family === family && g.code === code && g.side === (idx ? 'inbound' : 'outbound') &&
      g.first === d.points[0] && g.last === d.points.at(-1))) && sequenceCheck(d.points) === g.sequence)
  if (matches.length === 1) {
    const [path,g] = matches[0], s = DDD12_SHEETS[idx]
    const samples: NonNullable<SourceHours['samples']>[number][] = []
    if (family === 'ddd' && code === '12' && idx && s.points === d.points) samples.push(sample('06:00',s.offsetMinutes),sample('07:08',s.peakMinutes))
    if (family === 'ddd' && code === '319') samples.push(sample(idx?'06:50':'06:55',DDD_319_PROFILES[idx]))
    if (family === 'ddd' && code === '16B' && !idx) samples.push(...malikaSamples())
    const old = maristesSheets.find(t=>t.url===g.source)
    // Evening samples aren't a complete grid between morning and evening.
    for (const row of old?.rows ?? []) if (row[0] >= '18:00') samples.push({label:`Extrait semaine ${row[0]}`,ranks:old!.calls.map(c=>c.rank),times:row})
    return {file:path.replace('../','src/'), source:g.source, printedLabels:g.printedLabels, weekday:g.weekday, friday:g.friday, saturday:g.saturday ?? g.weekend, sunday:g.sunday ?? g.weekend, samples}
  }
  if (family !== 'ddd') return
  if (code === '319' && m?.originBasis === d.source) return {file:'src/data/busBoardCallSheets.ts',source:d.source,samples:[sample(idx?'06:50':'06:55',DDD_319_PROFILES[idx])]}
  if (code === '16B' && m?.peakOffsetsMs && d.source.endsWith('18051473-1')) return {file:'src/data/dddSecondaryBoardSheets.ts',source:d.source.replace('line-','time-').replace(/-1$/,'-4256267-0'),samples:malikaSamples()}
  if (code === '1' || code === 'TAF_TAF') {
    const w = DDD_PUBLISHED_DEPARTURE_WINDOWS.find(w=>w.service === (code==='1'?'Ligne 1':'TAF TAF') && w.origin===d.from && w.destination===d.to)
    if (w) return {file:'src/data/dddPublishedDepartureWindows.ts',source:w.sourceUrl,samples:[{label:'Premier départ publié',ranks:[1],times:[w.firstDeparture]},{label:'Dernier départ publié',ranks:[1],times:[w.lastDeparture]}]}
  }
}
