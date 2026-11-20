/** Display transcriptions. No stop IDs, platform bindings or router imports. */
import type { BusBoardDirection, BusFamily } from './busPassageBoard'
import type { SourceGrid, SourceHours } from './busSourceHours'
import { hhmm } from './busSourceHours'
import { clockMinutes, MINUTE, originSlots } from './stopPassageCountdown'
import { AFTU73_SHEETS } from '../data/aftu73Checkpoints'
import { DDD311_SHEETS } from '../data/ddd311BoardSheets'
import { DDD12_SHEETS } from '../data/ddd12DirectionSheets'
import { DDD16B_CHECKPOINTS } from '../data/dddSecondaryBoardSheets'
import { DDD_319_PROFILES } from '../data/busBoardCallSheets'
import { DDD_PUBLISHED_DEPARTURE_WINDOWS } from '../data/dddPublishedDepartureWindows'
import aftu84 from '../data/aftu-84-directions.json'

interface Sheet { family: BusFamily; code: string; side: 'outbound'|'inbound'; from: string; to: string; points: string[]; source: string; timetable: string; weekdays: SourceGrid }
const files = import.meta.glob<Sheet>('../data/bus-sheets/*.json', {eager:true,import:'default'})
export function newSheetDirections(family: BusFamily, code: string): BusBoardDirection[] {
  return Object.entries(files).filter(([,s])=>s.family===family && s.code===code).sort(([,a],[,b])=>b.side.localeCompare(a.side)).map(([path,s])=>({
    label:`${s.side === 'outbound' ? 'Aller' : 'Retour'} · fiche hebdomadaire`, from:s.from,to:s.to,points:s.points,pointKind:'arrêts', source:s.source,clock:null,
    sourceHours:{ file:path.replace('../','src/'), source:s.timetable, weekday:s.weekdays },
  }))
}
const ranks = (n: number) => Array.from({length:n},(_,i)=>i+1)
const sample = (origin: string, elapsed: readonly number[], rr = ranks(elapsed.length)) => ({label:`Colonne ${origin}`,ranks:rr,times:elapsed.map(m=>hhmm(clockMinutes(origin)!+m))})
export function existingSheetHours(family: BusFamily, code: string, d: BusBoardDirection): SourceHours | undefined {
  const m = d.clock
  if (!m || m.kind !== 'model') return
  if (family === 'aftu' && code === '73') {
    // The model already verified the exact page, sequence and all column counts.
    const s = AFTU73_SHEETS.find(s=>s.grid === m.originBasis && s.page === d.source)
    if (!s) return
    const make = (c: typeof s.weekday): SourceGrid => ({ ranks:[1,s.cemRank,75], nextUntranscribedOrigin:null, profiles:c.arrival.map((v,i)=>({origins:[hhmm(clockMinutes(c.start)!+i*c.every)],elapsed:[0,typeof c.cem==='number'?c.cem:c.cem[i],v]})) })
    return {file:'src/data/aftu73Checkpoints.ts',source:s.grid,weekday:make(s.weekday),saturday:make(s.weekend),sunday:make(s.weekend)}
  }
  if (family === 'ddd' && code === '311') {
    const s = DDD311_SHEETS.find(s=>s.timetable === m.originBasis && s.points === d.points)
    if (!s) return
    const make = (key:'weekday'|'saturday'|'sunday'): SourceGrid => ({ranks:ranks(s.points.length), nextUntranscribedOrigin:null,
      profiles: s.week[key].flatMap(w=>originSlots(w,0)).map(t=>{
        const origin=hhmm(t/MINUTE),hour=Math.floor(t/MINUTE/60)
        return {origins:[origin], elapsed:(s.byOrigin as Record<string, readonly number[]>)[origin] ?? ((hour>=7 && hour<10 || hour>=15 && hour<20)?s.busy:s.quiet)}
      })})
    return {file:'src/data/ddd311BoardSheets.ts',source:s.timetable,weekday:make('weekday'),saturday:make('saturday'),sunday:make('sunday')}
  }
  if (family === 'aftu' && code === '84' && d.points === aftu84.directions.inbound.waypoints) {
    return {file:'src/data/aftu-84-directions.json',source:aftu84.sourceLabel,samples:[{label:'Relevé non daté',ranks:ranks(d.points.length),times:aftu84.directions.inbound.times}]}
  }
  if (family !== 'ddd') return
  const idx = d.label.startsWith('Retour') ? 1 : 0, s = DDD12_SHEETS[idx]
  if (code === '12' && d.points === s.points) return {file:'src/data/ddd12DirectionSheets.ts',source:d.source,samples:[sample(idx?'06:00':'05:00',s.offsetMinutes),sample(idx?'07:08':'07:00',s.peakMinutes)]}
  if (code === '319') return {file:'src/data/busBoardCallSheets.ts',source:d.source,samples:[sample(idx?'06:50':'06:55',DDD_319_PROFILES[idx])]}
  if (code === '16B' && m.peakOffsetsMs && d.source.endsWith('18051473-1')) return {file:'src/data/dddSecondaryBoardSheets.ts',source:d.source.replace('line-','time-').replace(/-1$/,'-4256267-0'),samples:[0,1].map(i=>sample(i?'07:00':'00:00',DDD16B_CHECKPOINTS.map(c=>c[i?3:2]),DDD16B_CHECKPOINTS.map(c=>c[0])))}
  if (code === '1' || code === 'TAF_TAF') {
    const w = DDD_PUBLISHED_DEPARTURE_WINDOWS.find(w=>w.service === (code==='1'?'Ligne 1':'TAF TAF') && w.origin===d.from && w.destination===d.to)
    if (w) return {file:'src/data/dddPublishedDepartureWindows.ts',source:w.sourceUrl,samples:[{label:'Premier départ publié',ranks:[1],times:[w.firstDeparture]},{label:'Dernier départ publié',ranks:[1],times:[w.lastDeparture]}]}
  }
}
