import { describe, expect, it } from 'vitest'
import { ALL_CORRIDOR_STOPS, BRT_STOPS, CORRIDOR_TRANSFERS, TER_STOPS } from '../domain/corridors'
import { OFFICIAL_REFERENCE_FREQUENCIES } from '../domain/frequencies'
import { dakarNetwork as net, planDakarJourney } from './dakar'
import { brtService, phaseOneService } from './dakarService'
import { projectStopToLine } from '../domain/roadNetworkRouting'
import { mapItinerary } from './presentation'
import { dayOf, nextRuns } from './serviceTime'
const at = (s: string) => Date.parse(s + 'Z') / 1000
const morning = at('2026-11-18T08:01')
const endpoint = (id: string) => {
  const p = ALL_CORRIDOR_STOPS.find(s => s.id === id)!
  return { stopId: id, lat: p.lat, lng: p.lon }
}
function plan(from: string, to: string, departAt = morning) { return planDakarJourney(endpoint(from), endpoint(to), { departAt }) }

it('uses only the 13 phase-one calls and 23 B1 calls and does not mutate or publish the wider reference', () => {
  expect(net.rejected).toEqual([])
  expect(net.patterns.map(p => [p.shape.sourceId, p.calls.length])).toEqual([['13645077', 13], ['19961937', 23], ['19961993', 22]])
  expect([...net.places.values()].filter(p => p.kind === 'call')).toHaveLength(36)
  expect(net.places.size).toBe(40); expect([...net.walking.values()].flat()).toHaveLength(4)
  expect(net.places.has('ter-aibd')).toBe(false)
  expect(TER_STOPS).toHaveLength(14); expect(BRT_STOPS).toHaveLength(23)
  expect(CORRIDOR_TRANSFERS).toHaveLength(6)
  expect(OFFICIAL_REFERENCE_FREQUENCIES.brt[0].days).toHaveLength(7)
  expect(OFFICIAL_REFERENCE_FREQUENCIES.brt[0].headwayMinutes).toBe(6)
})

it.each([
  ['ter-dakar','ter-pikine',11305,360,960], ['ter-colobane','ter-diamniadio',32777,60,2490],
  ['brt-prefecture-guediawaye','brt-petersen',17500,300,3163], ['brt-grand-medine','brt-liberte-6',3029,283,529],
] as const)('routes %s → %s over source vertices with a compatible departure', (from, to, meters, wait, ride) => {
  const r = plan(from, to)
  if (!r.ok) throw Error(r.message)
  const t = r.options[0]
  expect(r.options).toHaveLength(1); expect(t.legs).toHaveLength(1)
  expect(Math.round(t.meters)).toBe(meters); expect(t.waitSeconds).toBe(wait); expect(t.rideSeconds).toBe(ride)
  expect(t.totalSeconds).toBe(wait + ride); expect(t.walkMeters).toBe(0)
  expect(mapItinerary(t).segments[0].positions.length).toBeGreaterThan(2)
  expect(t.legs[0]).toMatchObject({ from: { id: from }, to: { id: to === 'brt-petersen' ? 'brt-petersen-quai-arrivee' : to }, timing: 'frequency', stepFree: 'unknown' })
})

it.each([
  ['ter-pikine','ter-dakar','NO_PATH'], ['ter-diamniadio','ter-aibd','OUT_OF_SCOPE'],
  ['brt-petersen','brt-prefecture-guediawaye','NO_PATH'], ['brt-prefecture-guediawaye','ter-rufisque','NO_PATH'],
  ['ddd-petersen','brt-grande-mosquee','UNVERIFIED_ACCESS'], ['aftu-colobane','ter-hann','UNVERIFIED_ACCESS'],
])('rejects %s → %s without falling back to the historic estimate', (from, to, code) => expect(plan(from, to)).toMatchObject({ ok: false, code }))

it('does not promote a GPS fix, a mismatched position or a colliding published stop ID to a reference boarding point', () => {
  const a = endpoint('ter-dakar'), b = endpoint('ter-pikine')
  for (const p of [{ ...a, stopId: undefined }, { ...a, lat: a.lat + 0.00001 }, { ...a, kind: 'stop' as const }, { ...a, kind: 'map' as const }]) {
    expect(planDakarJourney(p, b, { departAt: morning })).toMatchObject({ code: 'UNVERIFIED_ACCESS' })
  }
  expect(planDakarJourney(a, b, { departAt: NaN })).toMatchObject({ code: 'INVALID_QUERY' })
  expect(planDakarJourney(a, b, { departAt: morning, modes: ['brt'] })).toMatchObject({ code: 'NO_PATH' })
  expect(planDakarJourney(a, b, { departAt: morning, stepFreeOnly: true })).toMatchObject({ code: 'NO_PATH' })
})

describe('service-day policy, entirely separate from the protected boards', () => {
  const runs = (line: 'B1' | 'B2', iso: string, offset = 0) => { const t = at(iso); return nextRuns(brtService(line), dayOf(t), t, offset) }
  it('accepts the exact departure, waits before opening, rejects the exclusive closing time', () => {
    expect(runs('B1', '2026-11-18T05:59')[0]).toMatchObject({ originAt: at('2026-11-18T06:00'), every: 360 })
    expect(runs('B2', '2026-11-21T06:00')[0]).toMatchObject({ originAt: at('2026-11-21T06:00'), every: 360 })
    expect(runs('B1', '2026-11-18T21:00')).toEqual([])
    expect(runs('B1', '2026-11-18T21:01', 420)[0].originAt).toBe(at('2026-11-18T20:54'))
    expect(plan('brt-prefecture-guediawaye', 'brt-petersen', at('2026-11-18T21:00'))).toMatchObject({ code: 'NO_SERVICE' })
  })
  it.each(['2026-11-22', '2026-12-25'])('handles Sunday / Senegal holiday %s without inventing a B2 frequency', date => {
    expect(runs('B1', date + 'T06:01')[0]).toEqual({ originAt: at(date + 'T06:10'), every: 600 })
    expect(runs('B1', date + 'T10:50')[0].every).toBe(600)
    expect(runs('B1', date + 'T10:59')[0]).toEqual({ originAt: at(date + 'T11:00'), every: 420 })
    expect(runs('B1', date + 'T11:01')[0]).toEqual({ originAt: at(date + 'T11:07'), every: 420 })
    expect(runs('B2', date + 'T08:00')).toEqual([])
  })
  it('never imports AIBD frequencies or assumes holidays for an uncovered year', () => {
    expect(phaseOneService.kind === 'frequency' && phaseOneService.windows.map(w => w.every / 60)).toEqual([8,20])
    expect(runs('B1', '2027-01-04T08:00')).toEqual([])
  })
})

it('gives actual next modeled slots at the boarding stop, never extending beyond its run window', () => {
  const r = plan('brt-prefecture-guediawaye', 'brt-petersen')
  expect(r.ok && r.options[0].legs[0]).toMatchObject({ passages: ['08:06', '08:12', '08:18'].map(s => at(`2026-11-18T${s}`)) })
  const last = plan('brt-prefecture-guediawaye', 'brt-petersen', at('2026-11-18T20:53'))
  expect(last.ok && last.options[0].legs[0]).toMatchObject({ passages: [at('2026-11-18T20:54')] })
})


it('checks all ordered pairs of the 36 actual calls: direction, source chainage, map vertices and time accounting', () => {
  let allowed = 0, refused = 0
  const ter = TER_STOPS.filter(s => s.id !== 'ter-aibd'), universe = [...ter, ...BRT_STOPS]
  const scopes = [[ter, '13645077'], [[...BRT_STOPS].reverse(), '19961937'], [BRT_STOPS.slice(0, 22), '19961993']] as const
  const expected = scopes.map(([stops, relation]) => {
    const p = net.patterns.find(p => p.shape.sourceId === relation)!
    return { stops, chainages: stops.map(s => projectStopToLine(s, p.shape.positions)!.chainageM) }
  })
  for (const from of universe) for (const to of universe) {
    const r = plan(from.id, to.id)
    const scope = expected.find(e => e.stops.indexOf(from) >= 0 && e.stops.indexOf(to) > e.stops.indexOf(from))
    if (!scope) {
      expect(r).toMatchObject({ ok: false, code: from === to ? 'SAME_PLACE' : 'NO_PATH' })
      refused++; continue
    }
    const { stops, chainages } = scope, i = stops.indexOf(from), j = stops.indexOf(to)
    if (!r.ok) throw Error(`${from.id} → ${to.id}: ${r.message}`)
    allowed++
    const t = r.options[0], leg = t.legs[0]
    expect(r.options.length).toBe(1); expect(t.legs.length).toBe(1)
    if (leg.kind !== 'ride') throw Error('Unexpected walk')
    expect(leg.stops.map(s => s.id)).toEqual(stops.slice(i, j + 1).map(s => s.id))
    expect(Math.abs(t.meters - (chainages[j] - chainages[i]))).toBeLessThan(0.1)
    expect(t.walkSeconds).toBe(0); expect(t.totalSeconds).toBe(t.waitSeconds + t.rideSeconds)
    expect(leg.start).toBe(t.start + leg.waitSeconds); expect(leg.end).toBe(leg.start + t.rideSeconds)
    expect(mapItinerary(t).segments[0].positions).toEqual(leg.positions.map(p => [p.lat, p.lon]))
  }
  expect([allowed, refused]).toEqual([562, 734]) // 36²; includes 36 identical endpoints and 598 cross-network pairs
})
