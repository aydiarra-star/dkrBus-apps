import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'
import { dakarNetwork, localPassengerData } from './dakar'
import type { Dataset, SamePlatformChange } from './model'
import { admitPassengerEdition } from './passengerEdition'
import { mapItinerary } from './presentation'
import { fastestRideSections, search } from './search'
import { assessTransfer } from './transferReview'

// Real Python publisher and service-day compiler; all the inputs are fictitious.
const pack = JSON.parse(execFileSync('python3', ['tests/passenger_edition_fixture.py', '--same-position'], {
  env: { ...process.env, PYTHONPATH: '.' }, encoding: 'utf8',
}))
const data: Dataset = pack.dataset, sid: string = pack.snapshot_id, [change] = data.samePlatformChanges!
const admit = (patch: Partial<Dataset> = {}) => admitPassengerEdition({ ...pack, dataset: { ...data, ...patch } }, sid, pack.date, localPassengerData)
const query = { origin: `gtfs:${sid}:stop:A2`, destination: `gtfs:${sid}:stop:B3`, departAt: Date.parse('2026-11-18T08:20Z') / 1000,
  modes: ['ddd', 'aftu'] as const, maxChanges: 1, maxWalkPerLegM: 0, stepFreeOnly: true }
const net = admit()!

it('changes at one independently reviewed physical position between two dated runs; never draws a walk', () => {
  const r = search(net, query)
  if (!r.ok) throw Error(r.message)
  const t = r.options[0], next = t.legs[1]
  expect(t).toMatchObject({ changes: 1, end: query.departAt + 900, walkMeters: 0, walkSeconds: 0, waitSeconds: 300, rideSeconds: 600 })
  expect(t.legs.map(l => l.kind === 'ride' && l.mode)).toEqual(['ddd', 'aftu'])
  expect(next).toMatchObject({ kind: 'ride', from: { id: change.platformId }, samePlatformChange: change })
  expect(t.legs[0].to.id).toBe(change.platformId)
  const map = mapItinerary(t)
  expect(map.changes.map(c => c.id)).toEqual([change.platformId]); expect(map.segments).toHaveLength(2)
  expect(fastestRideSections(net, net.places.get(query.origin)!, new Set([query.destination, change.platformId]), query).get(query.destination)?.id).toBe(t.id)
  expect(dakarNetwork.samePlatform.size).toBe(0)
})

it('sharing a call AND both platform bindings is not enough; enforces direction, buffers, date, filters and accessibility', () => {
  for (const patch of [{ samePlatformChanges: [] }, { samePlatformChanges: undefined }]) expect(search(admit(patch)!, query)).toMatchObject({ code: 'NO_PATH' })
  for (const q of [{ maxChanges: 0 }, { modes: ['ddd'] as const }, { origin: query.destination, destination: query.origin }]) expect(search(net, { ...query, ...q }).ok).toBe(false)
  for (const q of [{ transferBufferSeconds: 301 }, { departAt: query.departAt + 1 }, { departAt: query.departAt + 86400 }]) expect(search(net, { ...query, ...q })).toMatchObject({ code: 'NO_SERVICE' })
  expect(search(admit({ samePlatformChanges: [{ ...change, minimumSeconds: 301 }] })!, { ...query, transferBufferSeconds: 0 })).toMatchObject({ code: 'NO_SERVICE' })
  const unknown = admit({ samePlatformChanges: [{ ...change, stepFree: 'unknown' }] })!
  expect(search(unknown, query).ok).toBe(false)
  expect(search(unknown, { ...query, stepFreeOnly: false }).ok).toBe(true)
})

it('an earlier arrival at the same place cannot take, or suppress, the later arrival’s permission', () => {
  const p = data.patterns.find(r => r.lineId === change.alight.lineId)!
  const lineId = p.lineId + '-other'
  const earlier = { ...p, lineId, shape: { ...p.shape, lineId }, service: { kind: 'timetable' as const, source: 'QA only', departures: [query.departAt - 60] } }
  const extra = data.platformBindings!.filter(b => b.lineId === p.lineId).map(b => ({ ...b, lineId }))
  const both = { patterns: [...data.patterns, earlier], platformBindings: [...data.platformBindings!, ...extra] }
  const q = { ...query, departAt: query.departAt - 60 }
  const r = search(admit(both)!, q)
  expect(r).toMatchObject({ ok: true, options: [{ legs: [{ lineId: p.lineId }, { lineId: change.board.lineId }] }] })
  // Only the unqualified earlier arrival could have made a 301-second minimum.
  expect(search(admit({ ...both, samePlatformChanges: [{ ...change, minimumSeconds: 301 }] })!, q)).toMatchObject({ code: 'NO_SERVICE' })
})

it('invalid pairs fail edition admission atomically, including an identically placed but differently identified platform', () => {
  const twin = { ...data.places.find(p => p.id === change.platformId)!, id: `access:${sid}:twin` }
  expect(admit({ places: [...data.places, twin], platformBindings: data.platformBindings!.map(b => b.lineId === change.board.lineId && b.role === 'board' ? { ...b, platformId: twin.id } : b) })).toBeNull()
  for (const patch of [{ platformId: change.alight.stopId }, { alight: change.board, board: change.alight }, { board: { ...change.board, mode: 'tata' as const } },
    { board: { ...change.board, lineId: 'brt-b1' } }, { evidence: { ...change.evidence, status: 'candidate' as const } },
    { minimumSeconds: 0 }, { minimumSeconds: 1.25 }, { path: ['unreviewed gate'] }, { platformId: 'landmark:bus-osm-4666430953' }]) {
    expect(admit({ samePlatformChanges: [{ ...change, ...patch }] })).toBeNull()
  }
  expect(admit({ samePlatformChanges: [change, { ...change, minimumSeconds: 15 }] })).toBeNull()
  expect(admit({ samePlatformChanges: null as unknown as SamePlatformChange[] })).toBeNull()
  const b = data.platformBindings!.filter(b => b.lineId !== change.board.lineId || b.role !== 'board')
  expect(admit({ platformBindings: b })).toBeNull()
  expect(admit({ places: [...data.places, { ...twin, id: 'landmark:bus-osm-4666430953', kind: 'entrance' }] })).toBeNull()
})

it('the dossier can recognize that exact rule, not a pathless interchange between sites', () => {
  const candidate = { from: change.alight, to: change.board, betweenSites: false }
  const binding = { platformId: change.platformId, evidence: change.evidence }
  const proof = { samePosition: true as const, alight: { ...binding, ...change.alight }, board: { ...binding, ...change.board } }
  expect(assessTransfer(net, candidate, proof)).toMatchObject({ status: 'qualified-for-review', meters: null, walkStepFree: null, samePosition: { minimumSeconds: 300 } })
  expect(assessTransfer(net, { ...candidate, betweenSites: true }, proof).status).toBe('blocked')
  expect(assessTransfer(admit({ samePlatformChanges: [] })!, candidate, proof).findings.map(f => f.code)).toContain('SAME_POSITION_RULE')
  expect(assessTransfer(net, candidate, { ...proof, samePosition: undefined }).findings.map(f => f.code)).toContain('PATH_EVIDENCE')
})
