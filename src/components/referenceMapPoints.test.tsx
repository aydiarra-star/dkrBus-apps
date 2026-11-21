// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { ALL_CORRIDOR_STOPS, BRT_STOPS, CORRIDOR_LINES, TER_STOPS } from '../domain/corridors'
import { GREATER_DAKAR_BUS_COVERAGE_POINTS } from '../data/greaterDakarBusCoverage'
import { busMapPoints } from '../routing/busGeography'
import { referenceMapPoints } from './referenceMapPoints'
const sources = { corridors: ALL_CORRIDOR_STOPS, lines: CORRIDOR_LINES, published: [], historical: [], layers: {}, picking: false, choose: vi.fn() }
it('preserves the identity, exact source coordinate and network of every reference, including all 37 stations', () => {
  const points = referenceMapPoints(sources)
  expect(TER_STOPS).toHaveLength(14); expect(BRT_STOPS).toHaveLength(23)
  for (const s of ALL_CORRIDOR_STOPS) expect(points.find(p => p.key === `ref:${s.id}`)).toMatchObject({
    name: s.name, position: [s.lat, s.lon], badges: [s.id.split('-')[0].toUpperCase()],
  })
  for (const p of GREATER_DAKAR_BUS_COVERAGE_POINTS) expect(points.find(x => x.key === `landmark:${p.id}`)?.position).toEqual([p.lat, p.lon])
  for (const {marker:p, roadLimit} of busMapPoints) expect(points.find(x => x.key === p.id)?.kind).toContain(roadLimit ? 'pas un quai' : 'Quai cartographié')
  expect(points.length).toBe(new Set(points.map(p => p.key)).size)
})
it('filters the visible constituents of mixed coverage; no hidden layer leaks through published or historical points', () => {
  const {lat,lon} = TER_STOPS[1]
  const input = { ...sources, historical: [{ id: 'history', line: '6', position: [lat,lon] as [number,number] }],
    published: [{ stopId:'ddd-colobane', stopName:'Quai publié', lat, lon, distanceM:null, locationType:null, parentStation:null }] }
  const off = referenceMapPoints({ ...input, layers:{ ddd:false } })
  expect(off.find(p => p.key === 'landmark:guediawaye-ddd-220')).toMatchObject({badges:['AFTU'],kind:'Zone desservie · AFTU 79'})
  expect(off.some(p => p.badges.includes('DDD'))).toBe(false)
  const on = referenceMapPoints(input)
  expect(on.filter(p => p.position[0] === lat && p.position[1] === lon).map(p => p.key)).toEqual(expect.arrayContaining(['ref:ter-colobane','ref:ddd-colobane','ref:aftu-colobane','published::ddd-colobane','history']))
  expect(referenceMapPoints({...input,layers:{ddd:false,aftu_tata:false}})).toHaveLength(37)
})

it('does not label arbitrary published IDs TER because they start with the same letters', () => {
  const s = {stopId:'terminus-central', stopName:'Quai', lat:14.71,lon:-17.42,distanceM:null,parentStation:null,locationType:null}
  expect(referenceMapPoints({...sources,published:[s],layers:{ter:false}}).find(p=>p.key==='published::terminus-central')?.badges).toEqual(['BUS'])
})

it('hands off each exact reference, not the first stop or the centre of a group', () => {
  const choose = vi.fn()
  const points = referenceMapPoints({ ...sources, picking: true, choose })
  for (const stop of ALL_CORRIDOR_STOPS) {
    const matches = points.filter(p => p.key === `ref:${stop.id}`)
    expect(matches).toHaveLength(1)
    matches[0].action!.run()
    expect(choose).toHaveBeenLastCalledWith({ label: stop.name, stopId: stop.id, lat: stop.lat, lng: stop.lon })
  }
  expect(new Set(choose.mock.calls.map(([p]) => p.stopId)).size).toBe(70)
})
