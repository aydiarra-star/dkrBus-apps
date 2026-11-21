import { expect, it } from 'vitest'
import { BUS_SECTION_WAYS } from '../data/busSectionWays'
import { medinaService } from './medinaService'
import { buildStopIndex } from '../domain/stops'
import { dakarNetwork as net, planDakarJourney } from './dakar'
import { endpointOf } from './placeConnections'
import { mapItinerary } from './presentation'
import { dayOf, nextRuns } from './serviceTime'

const ids = ['4666430960','4666430958','4666430955','4666430953','4666430951','4666430950','4666430947','4666430945']
const calls = ids.map(id => net.places.get('ddd-1-medina-'+id)!)
const point = (i: number) => endpointOf(calls[i])
const at = (time: string) => Date.parse(time+'Z') / 1000
const evening = at('2026-11-19T19:00'), pattern = net.patterns.find(p => p.lineId === 'ddd-1-medina')!

it('returns exactly the forward 28 OD pairs on the eight named platforms, not a claim about the whole line', () => {
  const form = buildStopIndex([], net.places.values()).filter(o => o.selectable)
  expect(pattern.calls).toEqual(calls); expect(pattern.service.kind).toBe('frequency')
  expect(calls.every(c => c.kind === 'platform' && form.some(o => o.value === 'ref:'+c.id))).toBe(true)
  for (let i=0; i<calls.length; i++) for (let j=0; j<calls.length; j++) {
    const r = planDakarJourney(point(i),point(j),{departAt:evening,maxChanges:0})
    expect(r.ok).toBe(i < j)
    if (!r.ok) continue
    expect(r.options).toHaveLength(1)
    expect(r.options[0]).toMatchObject({changes:0,walkMeters:0,legs:[{from:calls[i],to:calls[j],stops:calls.slice(i,j+1),timing:'frequency',stepFree:'unknown'}]})
    expect(mapItinerary(r.options[0]).segments[0].positions.length).toBeGreaterThan(2)
  }
  const r = planDakarJourney(point(0),point(5),{departAt:evening})
  if (!r.ok) throw Error(r.message)
  const leg = r.options[0].legs[0]
  expect(leg.start).toBe(at('2026-11-19T19:06:38')); expect(Math.round(leg.meters)).toBe(1667)
  expect(new Date(leg.end*1000).toISOString().slice(11,16)).toBe('19:14')
})

it('shifts only the weekday origin windows and never treats the last terminus departure as an observed call', () => {
  const d = dayOf(evening), times = (time: string) => nextRuns(pattern.service,d,at('2026-11-19T'+time),0).map(x=>x.originAt)
  expect(times('05:30')[0]).toBe(at('2026-11-19T06:28:38'))
  expect(times('19:06:39')).not.toContain(at('2026-11-19T19:06:38'))
  expect(times('21:28:38')).toEqual([at('2026-11-19T21:28:38')]); expect(times('21:28:39')).toEqual([])
  for (const time of ['2026-11-19T21:29','2026-11-21T19:00','2026-12-25T19:00','2027-11-19T19:00']) {
    expect(planDakarJourney(point(0),point(5),{departAt:at(time)})).toMatchObject({ok:false,code:'NO_SERVICE'})
  }
})

it('does not board from a GPS pin or a map-only marker, add a transfer, or evade the network/step-free filters', () => {
  for (const settings of [{modes:['brt'] as const},{stepFreeOnly:true}]) expect(planDakarJourney(point(0),point(5),{departAt:evening,...settings}).ok).toBe(false)
  const { lat,lng } = point(0)
  for (const start of [{lat,lng}, {lat,lng,kind:'map' as const,landmarkId:'landmark:bus-osm-'+ids[0]}, {...point(0),lat:lat+0.0001}]) {
    expect(planDakarJourney(start,point(5),{departAt:evening})).toMatchObject({ok:false,code:'UNVERIFIED_ACCESS'})
  }
  expect(planDakarJourney(point(0),endpointOf(net.places.get('ter-colobane')!),{departAt:evening}).ok).toBe(false)
})


it('goes around the Poste on real arcs, leaving the original 15 directs available if an arc is missing', () => {
  const r = planDakarJourney(point(0), point(7), {departAt:evening})
  if (!r.ok) throw Error(r.message)
  const leg = r.options[0].legs[0]
  expect([leg.start,leg.end,Math.round(leg.meters)]).toEqual([at('2026-11-19T19:06:38'),at('2026-11-19T19:19:11'),2847])
  expect(pattern.shape.source).toBe('REVIEWED_OSM_WAYS')
  const positions = pattern.shape.positions
  for (const [,lat,lon] of [...BUS_SECTION_WAYS[430805832].vertices, ...BUS_SECTION_WAYS[108821823].vertices]) expect(positions).toContainEqual({lat,lon})
  const detached = { ...BUS_SECTION_WAYS }; delete detached[108821823]
  expect(medinaService(detached).patterns.map(p=>[p.stops.length,p.shape.source])).toEqual([[6,'OSM_ROUTE_RELATION'],[2,'REVIEWED_OSM_WAYS']])
})

it('boards only the independently located return occurrence and never borrows a timetable, platform or crossing', () => {
  const p = net.patterns.find(p=>p.direction === 'Vers Parcelles · PMI Médina → Rue 37')!
  expect(p.stops).toEqual(['ddd-1-medina-retour-4666430956','ddd-1-medina-retour-4666430957'])
  const [a,b] = p.calls.map(c=>endpointOf(c)), settings = { departAt:evening, modes:['ddd'] as const }
  const r = planDakarJourney(a,b,settings)
  if (!r.ok) throw Error(r.message)
  expect(r.options[0]).toMatchObject({changes:0, legs:[{ kind:'ride',start:at('2026-11-19T19:05:46'),end:at('2026-11-19T19:06:44'),timing:'frequency',serviceSource:expect.stringContaining('Place Leclerc') }]})
  expect(Math.round(r.options[0].meters)).toBe(290)
  for (const [from,to] of [[b,a],[point(0),b],[a,point(7)],[{lat:a.lat,lng:a.lng},b]]) expect(planDakarJourney(from,to,settings).ok).toBe(false)
  const d = dayOf(evening), t = (hhmmss:string)=>at('2026-11-19T'+hhmmss)
  expect(nextRuns(p.service,d,t('06:30:00'),0)[0].originAt).toBe(t('06:47:46'))
  expect(nextRuns(p.service,d,t('21:17:46'),0).map(r=>r.originAt)).toEqual([t('21:17:46')])
  expect(nextRuns(p.service,d,t('21:17:47'),0)).toEqual([])
  for (const overrides of [{stepFreeOnly:true},{departAt:at('2026-11-22T08:00')}]) expect(planDakarJourney(a,b,{...settings,...overrides}).ok).toBe(false)
})
