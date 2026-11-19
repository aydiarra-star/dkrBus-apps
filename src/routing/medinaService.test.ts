import { expect, it } from 'vitest'
import { buildStopIndex } from '../domain/stops'
import { dakarNetwork as net, planDakarJourney } from './dakar'
import { endpointOf } from './placeConnections'
import { mapItinerary } from './presentation'
import { dayOf, nextRuns } from './serviceTime'

const ids = ['4666430960','4666430958','4666430955','4666430953','4666430951','4666430950']
const calls = ids.map(id => net.places.get('ddd-1-medina-'+id)!)
const point = (i: number) => endpointOf(calls[i])
const at = (time: string) => Date.parse(time+'Z') / 1000
const evening = at('2026-11-19T19:00'), pattern = net.patterns.find(p => p.lineId === 'ddd-1-medina')!

it('returns exactly the forward fifteen OD pairs on the six named platforms, not a claim about the whole line', () => {
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
