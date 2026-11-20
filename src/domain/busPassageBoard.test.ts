import { describe, expect, it } from 'vitest'
import { BUS_BOARD_LINES } from './busBoardCatalog'
import { thiaroyeCheckpoints } from './thiaroyeCheckpoints'
import { checkpointProfiles, modelClock } from './busBoardModel'
import { boardDay, busPassage, datedBusBoards, everyDay, transcribedOffsets, type BusBoardDirection, type BusFamily } from './busPassageBoard'
import { midnight, MINUTE, originSlots } from './stopPassageCountdown'
import { dakarNetwork } from '../routing/dakar'
import { fixtureNetwork } from '../test/passengerTransferFixture'
import type { Pattern } from '../routing/model'

const th = '2026-11-19', at = (clock: string, day = th) => Date.parse(`${day}T${clock}Z`)
const dirs = (f: BusFamily, c: string) => BUS_BOARD_LINES[f].find(l => l.code === c)!.directions
const get = (d: BusBoardDirection, i: number, time: string, date?: string) => {
  const now = at(time,date); return busPassage(boardDay(d,midnight(now)), i, now)
}
const clockOf = (d: BusBoardDirection) => { if (d.clock?.kind !== 'model') throw Error('missing model'); return d.clock }

describe('time on a bus sign, not a trip planner', () => {
  it('keeps fractional headways, true last departures, ties, negative and invalid input separate', () => {
    const w = { start: '06:00', end: '06:30', every: 12.5 }
    expect(originSlots(w,at('00:00'))).toEqual(['06:00','06:12:30','06:25'].map(t => at(t)))
    expect(originSlots({ ...w, includePublishedLast: true },at('00:00')).at(-1)).toBe(at('06:30'))
    for (const window of [{ ...w, every: NaN },{ ...w, end: '05:59' },{ ...w, start: '24:00' }]) expect(originSlots(window,at('00:00'))).toEqual([])
    expect(transcribedOffsets(['05:49','05:51','05:51'],3)).toEqual([0,2*MINUTE,2*MINUTE])
    expect(transcribedOffsets(['06:00','05:58'],2)).toBeNull(); expect(transcribedOffsets(['99:59'],1)).toBeNull()
    expect(busPassage(null,0,at('12:00')).state).toBe('unknown')
  })
  it('uses the different first/last departures of DDD 1 without making up a Leclerc return list', () => {
    const [out, back] = dirs('ddd','1'); expect(back.points).toEqual(['Place Leclerc'])
    expect(get(out,0,'05:29')).toEqual({ state:'upcoming', at:at('05:30') })
    expect(get(back,0,'06:29')).toEqual({ state:'upcoming', at:at('06:30') })
    expect(get(out,0,'20:29:59.999')).toEqual({ state:'active', minutes:1, at:at('20:30') })
    expect(get(out,0,'20:30').state).toBe('finished'); expect(get(back,0,'20:59')).toMatchObject({ minutes:1 })
    expect(get(out,out.points.length-1,'20:30').state).toBe('active')
    expect(get(back,1,'06:35').state).toBe('unknown')
  })
  it('keeps variable Maristes running profiles attached to the origin run and preserves the Fann variant', () => {
    const [fann, , out, back] = dirs('ddd','12'); expect(fann.points).toHaveLength(20)
    expect(fann.points.join(' ')).toMatch(/Hôpital Fann/); expect(clockOf(fann).peakOffsetsMs).toBeUndefined()
    expect([out,back].map(x => x.points.length)).toEqual([63,67])
    expect([out,back].map(d => [clockOf(d).offsetsMs.at(-1)!/MINUTE,clockOf(d).peakOffsetsMs!.at(-1)!/MINUTE])).toEqual([[51,66],[54,70]])
    expect(get(out,62,'05:50')).toMatchObject({ minutes:1, at:at('05:51') })
    expect(get(out,62,'08:05')).toMatchObject({ minutes:1, at:at('08:06') })
    expect(get(back,66,'08:17')).toMatchObject({ minutes:1, at:at('08:18') })
    expect(get(out,0,'06:00','2026-11-21')).toMatchObject({ minutes:20 }); expect(get(out,0,'06:00','2026-11-22')).toMatchObject({ minutes:30 })
  })
  it('counts the two Palais itineraries independently, including the 16B departure at the end of the service day', () => {
    for (const [code, n, m] of [['6',69,71],['16A',65,64],['16B',83,82]] as const) {
      const [out,back] = dirs('ddd',code).slice(-2)
      expect([out.points.length,back.points.length]).toEqual([n,m]); expect(out.to).toBe('Gare Palais'); expect(back.from).toBe('Gare Palais')
      expect(out.points).not.toEqual([...back.points].reverse())
    }
    const malika = dirs('ddd','16B').at(-2)!, board = (date:string) => boardDay(malika,at('00:00',date))!
    expect(board(th).profiles.flatMap(p => p.today)).toHaveLength(79)
    expect(board('2026-11-20').profiles.flatMap(p => p.today)).toHaveLength(78)
    expect(get(malika,0,'23:59:30')).toMatchObject({minutes:1,at:at('00:00','2026-11-20')})
    expect(get(malika,0,'23:45','2026-11-20').state).toBe('finished')
    expect(get(malika,82,'01:07:30','2026-11-20')).toMatchObject({minutes:1,at:at('01:08','2026-11-20')})
    expect(get(malika,82,'01:08','2026-11-20').state).toBe('upcoming')
    expect(get(malika,82,'08:35')).toMatchObject({minutes:1,at:at('08:36')})
    expect(get(malika,23,'00:13:30','2026-11-20')).toMatchObject({minutes:1,at:at('00:14','2026-11-20')})
    expect(get(malika,0,'23:25','2026-11-21').state).toBe('finished')
    expect(get(malika,0,'23:59:30','2026-11-22')).toMatchObject({minutes:1})
    expect(checkpointProfiles(['one','two'],[[1,'one',0,0],[2,'other',5,6]])).toBeNull()
  })
  it('reads both 311 weekly tables without manufacturing a stop or a ride from the official return instruction', () => {
    const [partial, go, back] = dirs('ddd','311')
    expect(partial.clock).toBeNull(); expect(dirs('ddd','TAF_TAF_TO1')[0].clock).toBeNull()
    expect([go,back].map(d => d.points.length)).toEqual([42,42]); expect(go.points).not.toEqual([...back.points].reverse())
    expect([go,back].map(d => [d.points[0],d.points.at(-1)])).toEqual(Array(2).fill(['Arrêt De Bus','Arrêt De Bus']))
    expect(go.points[7]).toBe('Marché De Niaga'); expect(back.points[34]).toBe('Marché De Niaga')
    expect(get(go,7,'07:08')).toMatchObject({ minutes:1, at:at('07:09') })
    expect(get(back,34,'07:39')).toMatchObject({ minutes:1, at:at('07:40') })
    expect(get(go,41,'07:09')).toMatchObject({ minutes:1, at:at('07:10') }) // 06:30 run, not the daytime profile
    for (const [i, d] of [go,back].entries()) {
      const runs = (date: string) => boardDay(d,at('00:00',date))!.profiles.flatMap(p => p.today ?? [])
      expect(runs(th).length).toBe(i ? 27 : 28); expect(runs('2026-11-21').length).toBe(i ? 17 : 18)
      expect(get(d,41,'10:15')).toMatchObject({ minutes:1, at:at('10:16') }) // 09:30 run crosses the peak boundary
      expect(get(d,41,'20:37:59')).toMatchObject({ minutes:1, at:at('20:38') }); expect(get(d,41,'20:38').state).toBe('finished')
      expect(get(d,41,'12:00','2026-11-22').state).toBe('closed')
      expect(get(d,41,i ? '20:14' : '20:25','2026-11-21')).toMatchObject({ minutes:1 })
    }
  })
  it('never transfers the Rufisque timetable or its Sunday closure to DDD Thiaroye', () => {
    const [thiaroye,,rufisque] = dirs('ddd','218'); expect(rufisque.from).toBe('Terminus Rufisque'); expect(rufisque.points).toHaveLength(69)
    expect(get(rufisque,68,'10:00','2026-11-22').state).toBe('closed')
    expect(get(thiaroye,0,'10:00','2026-11-22').state).toBe('active') // independently labelled model, not the Rufisque timetable
    expect(get(rufisque,0,'06:30','2026-11-21')).toMatchObject({ minutes:20 })
    expect(get(rufisque,0,'05:45')).toMatchObject({ minutes:25 })
    expect(dirs('ddd','217').at(-1)?.points).toHaveLength(126)
    const [go,back] = dirs('ddd','319'); expect([go,back].map(d => [d.points.length,clockOf(d).offsetsMs.at(-1)!/MINUTE])).toEqual([[27,23],[26,21]])
    expect(dirs('ddd','23').slice(2).map(d => d.points.length)).toEqual([57,56])
    expect(dirs('ddd','502').map(d => d.label)).toEqual(['Circuit']); expect(dirs('ddd','502A').map(d => d.points.length)).toEqual([1,1])
    expect(dirs('ddd','TAF_TAF').map(d => [d.from,d.to])).not.toContainEqual(['Ouakam','Palais 2'])
  })
  it('does not truncate an actual directional window, transpose a return or forget the terminal', () => {
    for (const [code,counts] of Object.entries({ '70':[58,57], '72':[78,78], '73':[75,75], '79':[92,93], '81':[71,71] })) {
      const [a,b] = dirs('aftu',code); expect([a.points.length,b.points.length]).toEqual(counts)
      expect(a.points).not.toEqual([...b.points].reverse()); expect(get(b,b.points.length-1,'19:00').state).toBe('active')
    }
    const lac = dirs('aftu','73')[1]; expect(lac.to).toBe('Lac Rose'); expect(get(lac,0,'22:54')).toMatchObject({ minutes:1 })
    expect(get(dirs('aftu','65')[0],0,'22:56')).toMatchObject({ minutes:1 })
    const [out,back] = dirs('aftu','84'); expect(back.points[0]).toMatch(/Delafosse/); expect(out.points.at(-1)).not.toBe(back.points[0])
    expect([2,3].map(i => get(back,i,'05:50'))).toEqual(Array(2).fill({ state:'active', minutes:1, at:at('05:51') }))
    expect(get(back,72,'07:08:59')).toMatchObject({ minutes:1 }); expect(get(back,72,'07:09')).toMatchObject({ minutes:14 })
  })
  it('suit la colonne de la 73 jusqu’au CEM et au terminus, semaine et week-end séparés', () => {
    const [depot, lac] = dirs('aftu','73'), fri = '2026-11-20', sat = '2026-11-21', sun = '2026-11-22'
    for (const [dir, weekday, weekend] of [[depot,37,27],[lac,42,30]] as const) {
      for (const [date, count] of [[fri,weekday],[sat,weekend],[sun,weekend]] as const) {
        expect(boardDay(dir,at('00:00',date))!.profiles.flatMap(p => p.today)).toHaveLength(count)
      }
      expect(get(dir,74,'12:00','2026-12-25')).toEqual({ state:'calendar' })
    }
    expect(get(depot,73,'06:52:59',fri)).toMatchObject({ minutes:1, at:at('06:53',fri) })
    expect(get(depot,74,'06:54',fri)).toMatchObject({ at:at('07:29',fri) }) // not 06:54 plus a headway
    expect(get(depot,74,'06:54',sat)).toMatchObject({ at:at('07:05',sat) })
    expect(get(lac,1,'07:05',fri)).toMatchObject({ minutes:1, at:at('07:06',fri) })
    expect(get(lac,74,'08:21:59',fri)).toMatchObject({ minutes:1, at:at('08:22',fri) })
    expect(get(lac,74,'23:50',sun)).toEqual({ state:'finished' })
    expect(get(depot,74,'23:37:59',fri)).toMatchObject({ minutes:1 }); expect(get(depot,74,'23:38',fri).state).toBe('finished')
    expect(get(depot,74,'23:28',sat).state).toBe('finished')
  })
  it('ne transpose pas les trois repères de Thiaroye en cas de changement de liste, de source ou de créneaux', () => {
    const ready = dirs('aftu','73')[0]
    const clock = modelClock('aftu','73','outbound',ready.points,'arrêts', { week:clockOf(ready).week, originBasis:ready.source, duration:69 })
    const d = { ...ready, clock }
    expect(thiaroyeCheckpoints(d)).toEqual(ready)
    for (const other of [{ ...d, clock:{ ...clock, originBasis:'autre grille' } }, { ...d, source:'autre fiche' }, { ...d, to:d.from }, { ...d, clock:null },
      { ...d, points:d.points.map((v,i) => i === 10 ? v+' bis' : v) }, { ...d, clock: { ...clock, week: { ...clock.week, sunday:null } } },
      { ...d, clock:{ ...clock, week:{ ...clock.week, weekday:[{start:'05:56',end:'22:44',every:28}] } } }]) {
      expect(thiaroyeCheckpoints(other)).toBe(other)
    }
    expect(dirs('tata','73').every(other => !clockOf(other).byOrigin)).toBe(true)
  })
  it('requires the fingerprint of the consumed full ordered list, not the same family, code and count', () => {
    const d = dirs('aftu','89')[0], c = clockOf(d)
    expect(c.offsetBasis).toContain('historique')
    const changed = d.points.map((v,i) => i === 1 ? `${v} bis` : v)
    expect(modelClock('aftu','89','outbound',changed,'arrêts',{ owner:true }).offsetBasis).not.toContain('historique')
    expect(modelClock('tata','89','outbound',d.points,'arrêts',{ owner:true }).offsetBasis).not.toContain('historique')
  })
  it('carries in a late run before testing the new day/holiday, but does not repeat service tomorrow', () => {
    const late: BusBoardDirection = { ...dirs('ddd','501')[0], points:['A','B'], clock: { kind:'model', week:everyDay([{ start:'23:54',end:'23:54',every:10 }]),offsetsMs:[0,12*MINUTE],originBasis:'fixture',offsetBasis:'fixture' } }
    const holiday = '2026-12-25'
    expect(get(late,1,'00:05:59',holiday)).toMatchObject({ minutes:1, at:at('00:06',holiday) })
    expect(get(late,1,'00:06',holiday)).toEqual({ state:'calendar' })
    expect(get(late,0,'23:54')).toEqual({ state:'finished' }); expect(get(late,0,'12:00','2027-11-19').state).toBe('calendar')
  })
  it('respects per-family registrations, repeated landmarks, and unavailable directions', () => {
    expect(dirs('tata','59')[0]).toMatchObject({ from:'Stade L.S.S', to:'Mbarou Samba Dème (Mbeubeuss)',pointKind:'repères' })
    expect(dirs('tata','60')[0]).toMatchObject({ from:'Colobane',to:'Bargny' })
    const sectors = dirs('tata','69')[1]; expect(sectors).toMatchObject({pointKind:'secteurs',from:'Namora'})
    expect(sectors.from).not.toBe(dirs('tata','69')[0].to); expect(dirs('tata','40')[1].points.at(-1)).toBe('SIPRES')
    expect(dirs('tata','79')[0].points).toContain('Malika'); expect(dirs('aftu','79')[0].pointKind).toBe('arrêts')
    expect(dirs('aftu','5')[1].points.slice(1,-1)).toEqual(['Rue 37','Rue 17']); expect(dirs('aftu','5')[0].points.join(' ')).not.toMatch(/retour/i)
    expect(dirs('aftu','58').slice(0,2).every(d => !d.clock)).toBe(true)
    for (const code of ['74','80']) expect(dirs('aftu',code)[1].clock).toBeNull()
    for (const code of ['85','86','87']) expect(dirs('aftu',code).every(d => d.clock === null)).toBe(true)
    expect(dirs('tata','84').every(d => d.clock === null)).toBe(true)
    // A modelled directional ride is not a dated timetable for Explorer.
    for (const family of ['ddd','aftu','tata'] as const) expect(datedBusBoards(dakarNetwork.patterns, family, at('00:00'))).toEqual([])
  })
})

it('compares all the running profiles of the same reviewed edition direction at each call; excludes other dates, families, shapes and IDs', () => {
  const base = fixtureNetwork.patterns[0]
  const p = (id: string, start: string, end: number, shape = 'shape'): Pattern => ({ ...base, mode:'tata',lineId:`gtfs:snap:review:${id}`,shape:{...base.shape,source:'REVIEWED_GTFS_SHAPE',sourceId:shape},
    times:{ kind:'offsets',arrivals:[0,end],departures:[0,end+30],source:'qa' },arrivals:[0,end],departures:[0,end+30],service:{ kind:'timetable',source:'qa',departures:[at(start)/1000] } })
  const patterns = [p('0','08:00',1200),p('1','08:03',300),p('2','08:00',100,'other'),{ ...p('0','08:00',100),lineId:'gtfs:other:review:0' }]
  const boards = datedBusBoards(patterns,'tata',at('00:00')); expect(boards).toHaveLength(3)
  const d = boards[0].directions[0]; expect(get(d,0,'08:00')).toMatchObject({ at:at('08:03') }); expect(get(d,1,'08:07')).toMatchObject({ minutes:1,at:at('08:08') })
  expect(get(d,1,'08:08')).toMatchObject({ minutes:12,at:at('08:20') }); expect(get(d,1,'08:20').state).toBe('finished')
  expect(datedBusBoards([{ ...patterns[0], shape:{...patterns[0].shape,source:'OSM_ROUTE_RELATION'} }], 'tata', at('00:00'))).toEqual([])
  expect(datedBusBoards(patterns,'aftu',at('00:00'))).toEqual([]); expect(datedBusBoards(patterns,'tata',at('00:00','2026-11-20'))).toEqual([])
})
