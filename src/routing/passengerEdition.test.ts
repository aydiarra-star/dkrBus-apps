import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'
import { buildStopIndex } from '../domain/stops'
import { dakarNetwork, localPassengerData, planDakarJourney } from './dakar'
import type { Dataset } from './model'
import { endpointOf } from './placeConnections'
import { admitPassengerEdition } from './passengerEdition'
import { mapItinerary } from './presentation'

// This is the actual server response from a temporary reviewed, published
// SQLite snapshot, not a JS object imitating the Python serialization.
const raw = JSON.parse(execFileSync('python3', ['tests/passenger_edition_fixture.py'], { env: { ...process.env, PYTHONPATH: '.' }, encoding: 'utf8' }))
const sid: string = raw.snapshot_id, day = '2026-11-18'
const net = admitPassengerEdition(raw, sid, day, localPassengerData)!
const point = (id: string) => endpointOf(net.places.get(`gtfs:${sid}:stop:${id}`)!, sid)
const at = (hhmm: string) => Date.parse(`${day}T${hhmm}:00Z`) / 1000

it('delivers and maps a five-mode journey from published call to published call, with four physical changes', () => {
  const q = { departAt: at('07:55'), maxChanges: 4, stepFreeOnly: true }
  const r = planDakarJourney(point('A0'), point('B4'), q, net)
  if (!r.ok) throw Error(r.message)
  const t = r.options[0]
  expect(t.changes).toBe(4); expect(t.end).toBe(at('08:45'))
  expect(t.legs.flatMap(l => l.kind === 'ride' ? [l.mode] : [])).toEqual(['ter', 'brt', 'ddd', 'aftu', 'tata'])
  expect(t.legs.filter(l => l.kind === 'walk').every(l => l.role === 'transfer' && l.positions.length === 3)).toBe(true)
  const map = mapItinerary(t)
  expect(map.segments.map(s => s.network)).toEqual(['ter', 'walk', 'brt', 'walk', 'ddd', 'walk', 'aftu_tata', 'walk', 'aftu_tata'])
  expect(map.changes).toHaveLength(8); expect(t.totalSeconds).toBe(t.walkSeconds + t.waitSeconds + t.rideSeconds)
  for (const extra of [{ maxChanges: 3 }, { modes: ['ter', 'brt', 'ddd', 'aftu'] as const }, { departAt: at('08:01') }, { transferBufferSeconds: 300 }, { maxWalkPerLegM: 1 }]) {
    expect(planDakarJourney(point('A0'), point('B4'), { ...q, ...extra }, net).ok).toBe(false)
  }
  expect(planDakarJourney(point('B4'), point('A0'), q, net).ok).toBe(false)
  expect(planDakarJourney(point('A0'), point('B4'), q).ok).toBe(false)
})

it('keeps a published stop in its snapshot on the map, in the combobox and when explicitly choosing a section', () => {
  const q = { departAt: at('08:20'), maxChanges: 1 }
  const a = point('A2'), b = point('B3')
  expect(a).toMatchObject({ kind: 'stop', snapshotId: sid, stopId: 'A2' })
  const options = buildStopIndex([], net.places.values(), sid)
  expect(options.filter(o => o.label === 'Essai A2')).toMatchObject([{ kind: 'published', stopId: 'A2', snapshotId: sid }])
  expect(planDakarJourney(a, b, q, net)).toMatchObject({ ok: true, options: [{ changes: 1, end: at('08:35') }] })
  for (const origin of [{ ...a, snapshotId: 'previous' }, { ...a, snapshotId: undefined }, { ...a, lng: a.lng - .001 }, { ...a, kind: undefined, stopId: `gtfs:${sid}:stop:A2` }]) {
    expect(planDakarJourney(origin, b, q, net)).toMatchObject({ ok: false, code: 'UNVERIFIED_ACCESS' })
  }
  expect(planDakarJourney(a, b, { ...q, departAt: at('08:21') }, net)).toMatchObject({ ok: false, code: 'NO_SERVICE' })
})

it('refuses bad shapes, wrong identity/date, unsafe paths or corrupt bindings atomically; never mutates the baseline', () => {
  for (const input of [null, { ...raw, snapshot_id: 'previous' }, { ...raw, date: '2026-11-19' }]) expect(admitPassengerEdition(input, sid, day, localPassengerData)).toBeNull()
  const mutate = (f: (d: Dataset) => Dataset) => admitPassengerEdition({ ...raw, dataset: f(raw.dataset) }, sid, day, localPassengerData)
  expect(mutate(d => ({ ...d, patterns: d.patterns.map(p => ({ ...p, shape: { ...p.shape, positions: [...p.shape.positions].reverse() } })) }))).toBeNull()
  expect(mutate(d => ({ ...d, patterns: d.patterns.map(p => ({ ...p, service: { kind: 'timetable', source: 'qa', departures: [at('12:00')-86400] } })) }))).toBeNull()
  expect(mutate(d => ({ ...d, footways: d.footways.map(w => ({ ...w, crossingsAndBarriersChecked: false })) }))).toBeNull()
  expect(mutate(d => ({ ...d, patterns: d.patterns.map(p => ({ ...p, service: { kind: 'timetable', source: 'qa', departures: [at('23:59')] } })) }))).toBeNull()
  expect(mutate(d => ({ ...d, footways: d.footways.map(w => ({ ...w, id: 'wrong-snapshot' })) }))).toBeNull()
  expect(mutate(d => ({ ...d, platformBindings: d.platformBindings?.map(b => ({ ...b, platformId: 'absent' })) }))).toBeNull()
  const missing = mutate(d => ({ ...d, footways: [] }))!
  expect(planDakarJourney(point('A2'), point('B3'), { departAt: at('08:20') }, missing).ok).toBe(false)
  expect(dakarNetwork.walking.size).toBe(0)
})
