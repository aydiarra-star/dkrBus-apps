import { describe, expect, it } from 'vitest'
import { fixtureData, testEpoch } from '../test/passengerTransferFixture'
import { search, fastestRideSections } from './search'
import { buildNetwork } from './network'
import { compareStopSections, planPlaceJourney, selectedVertex, type DakarEndpoint } from './placeConnections'
import type { Dataset, FootwayInput, Place, PlatformBinding } from './model'
import { assessTransfer } from './transferReview'
import { mapItinerary } from './presentation'
import { buildStopIndex } from '../domain/stops'

// Synthetic inspection packet, not evidence about any location in Dakar.
const [a, b, c, d, exit, entry] = ['A','B','C','D','Exit','Entry'].map(id => fixtureData.places.find(p => p.id === `qa-${id}`)!)
const call = (p: Place): Place => ({ ...p, id: `call:${p.id}`, kind: 'call', lat: p.lat + .00001 })
const ref = (p: Place): DakarEndpoint => ({ stopId: p.id, lat: p.lat, lng: p.lon })
const pin = (p: Place): DakarEndpoint => ({ kind: 'map', lat: p.lat, lng: p.lon })
const gate = (p: Place, id: string): Place => ({ ...p, id: `landmark:${id}`, kind: 'entrance', lat: p.lat + .00004 })
const home = gate(a, 'start'), end = gate(d, 'end')
const named = (p: Place): DakarEndpoint => ({ ...pin(p), landmarkId: p.id })
const foot = (from: Place, to: Place): FootwayInput => ({ ...fixtureData.footways[0], id: `${from.id}/${to.id}`, from: from.id, to: to.id, positions: [from, to] })
const patterns = fixtureData.patterns.slice(0, 2).map(p => ({ ...p, stops: p.stops.map(id => `call:${id}`) }))
const links = patterns.flatMap<PlatformBinding>(p => p.stops.map((id, i) => ({
  mode: p.network === 'ter' ? 'ter' : 'brt', lineId: p.lineId, direction: p.direction, role: i === 0 ? 'board' : 'alight',
  stopId: id, platformId: id.slice(5), stepFree: 'yes', evidence: p.evidence,
})))
const data: Dataset = { patterns, places: [...fixtureData.places, ...[a,b,c,d].map(call), home, end], platformBindings: links,
  footways: [foot(home, a), ...fixtureData.footways, foot(d, end)] }
const settings = { departAt: testEpoch, transferBufferSeconds: 60, maxWalkPerLegM: 300, stepFreeOnly: true }
const plan = (changes: Partial<Dataset> = {}, args = settings) => planPlaceJourney(buildNetwork({ ...data, ...changes }), named(home), named(end), args)

it('connects named places through surveyed access, two dated services, a platform transfer and directed egress', () => {
  const net = buildNetwork(data)
  expect(net.rejected).toEqual([])
  expect(buildStopIndex([], net.places.values()).find(o => o.value === `ref:${a.id}`)).toMatchObject({ stopId: a.id, hint: 'Quai vérifié' })
  const result = plan()
  if (!result.ok) throw Error(result.message)
  const trip = result.options[0]
  expect(trip.legs.map(l => l.kind === 'ride' ? [l.from.id, l.to.id] : l.role)).toEqual(['access', [a.id, b.id], 'transfer', [c.id, d.id], 'egress'])
  expect(trip.legs.flatMap(l => l.kind === 'ride' ? [l.start] : [])).toEqual([testEpoch + 10, testEpoch + 600])
  expect(trip.legs[1]).toMatchObject({ stops: [{ id: call(a).id }, { id: call(b).id }], from: { id: a.id }, to: { id: b.id } })
  expect(mapItinerary(trip).calls.map(m => m.place.id)).toEqual([a.id, b.id, c.id, d.id])
  expect(trip.totalSeconds).toBe(trip.walkSeconds + trip.waitSeconds + trip.rideSeconds)
  expect(assessTransfer(net, { betweenSites: true, from: links[1], to: links[2] }, { alight: links[1], board: links[2],
    path: { scope: 'via-street', wayIds: fixtureData.footways.map(w => w.id), gates: [exit.id, entry.id], evidence: a.evidence } }).status).toBe('qualified-for-review')
})

it('will not bind a fix, a published stop, a stale position or a landmark to a service call by coordinates', () => {
  const net = buildNetwork(data)
  expect(selectedVertex(net, named(home))).toBe(net.places.get(home.id))
  for (const p of [pin(home), { ...named(home), kind: 'stop' as const }, { ...named(home), lat: end.lat + .001 },
    { ...ref(call(a)), kind: 'stop' as const }, { ...pin(a), landmarkId: a.id }, ref(home)]) expect(selectedVertex(net, p)).toBeUndefined()
  expect(planPlaceJourney(net, pin(home), named(end), settings)).toMatchObject({ ok: false, code: 'UNVERIFIED_ACCESS' })
})

it.each<[string, Partial<PlatformBinding>]>([
  ['autre sens', { direction: 'reverse' }], ['autre opérateur', { mode: 'aftu' }], ['autre ligne', { lineId: 'x' }],
  ['descente au premier appel', { role: 'alight' }], ['centre de desserte', { platformId: call(a).id }], ['quai éloigné', { platformId: d.id }],
  ['preuve non revue', { evidence: { ...a.evidence, status: 'candidate' } }],
])('rejects a bad binding (%s) without disabling the independent call-to-call service', (_, fields) => {
  const net = buildNetwork({ ...data, platformBindings: [{ ...links[0], ...fields }, ...links.slice(1)] })
  expect(net.rejected).toHaveLength(1); expect(net.boarding.has(a.id)).toBe(false)
  expect(planPlaceJourney(net, named(home), named(end), settings).ok).toBe(false)
  expect(planPlaceJourney(net, ref(call(a)), ref(call(b)), settings).ok).toBe(true)
})

it('does not cross a station by ID or invert a walk; checks platform accessibility, walking budget and connection margin', () => {
  expect(plan({ platformBindings: [...links, links[0]] }).ok).toBe(false)
  expect(plan({ footways: [foot(home, a), foot(d, end)] }).ok).toBe(false)
  expect(plan({ footways: [...fixtureData.footways, foot(a, home), foot(d, end)] }).ok).toBe(false)
  expect(plan({}, { ...settings, maxWalkPerLegM: 2 }).ok).toBe(false)
  expect(plan({}, { ...settings, transferBufferSeconds: 600 })).toMatchObject({ code: 'NO_SERVICE' })
  const uncertain = { platformBindings: links.map((l, i) => i === 1 ? { ...l, stepFree: 'unknown' as const } : l) }
  expect(plan(uncertain).ok).toBe(false)
  const admitted = plan(uncertain, { ...settings, stepFreeOnly: false })
  expect(admitted.ok && admitted.options[0].legs[1].stepFree).toBe('unknown')
  expect(planPlaceJourney(buildNetwork(data), named(end), named(home), settings).ok).toBe(false)
})

describe('conditional stop-to-stop comparisons, not new walk edges', () => {
  it('evaluates farther eligible boarding stops, keeping an explicitly selected destination fixed', () => {
    // Nearest orphan boards a real service, but that service cannot reach D.
    const x = { ...a, id: 'qa-orphan', lat: a.lat + .0002 }, y = { ...b, id: 'qa-island' }
    const isolated = { ...fixtureData.patterns[0], lineId: 'qa-isolated', stops: [x.id, y.id], shape: { ...fixtureData.patterns[0].shape, lineId: 'qa-isolated' } }
    const net = buildNetwork({ ...data, patterns: [...patterns, isolated], places: [...data.places, x, y] })
    expect(net.rejected).toEqual([])
    const r = compareStopSections(net, pin(x), ref(d), { ...settings, maxWalkPerLegM: 30 })
    expect(r).toMatchObject({ boardingCount: 2, alightingCount: null, sections: [] }) // 30 m is too short for the transfer
    const available = compareStopSections(net, pin(x), ref(d), { ...settings, maxWalkPerLegM: 150 })
    expect(available.sections.map(s => [s.from.id, s.to.id, s.changes, s.toGapM])).toEqual([[a.id, d.id, 1, null]])
    expect(available.sections[0].fromGapM).toBeGreaterThan(0)
    expect(compareStopSections(net, pin(x), ref(d), { ...settings, departAt: testEpoch + 601 }).sections).toEqual([])
    const partial = planPlaceJourney(net, pin(a), ref(d), settings)
    expect(partial.ok).toBe(false); expect(!partial.ok && partial.connections?.sections[0].fromGapM).toBe(0)
  })
})

it('identifies the missing side of an admitted entrance without losing the other surveyed walk', () => {
  const local = { ...settings, maxWalkPerLegM: 150 }
  const missingAccess = plan({ footways: [...fixtureData.footways, foot(d, end)] }, local)
  expect(missingAccess).toMatchObject({ code: 'UNVERIFIED_ACCESS', connections: { boardingCount: 1, alightingCount: null,
    sections: [{ from: { id: a.id }, to: { id: end.id }, toGapM: null }] } })
  const missingExit = plan({ footways: [foot(home, a), ...fixtureData.footways] }, local)
  expect(missingExit).toMatchObject({ code: 'UNVERIFIED_ACCESS', connections: { boardingCount: null, alightingCount: 1 } })
})

it('does not transfer through a catalogue call shared by two different physical platforms', () => {
  // B and C share one catalogue ID, but each observation belongs to just one role and line.
  const shared = call(b)
  const net = buildNetwork({ ...data, patterns: [patterns[0], { ...patterns[1], stops: [shared.id, call(d).id] }],
    platformBindings: links.map((l, i) => i === 2 ? { ...l, stopId: shared.id } : l), footways: [foot(home, a), foot(d, end)] })
  expect(net.rejected).toEqual([])
  expect(planPlaceJourney(net, named(home), named(end), settings)).toMatchObject({ ok: false, code: 'NO_PATH' })
  const first = planPlaceJourney(net, ref(call(a)), ref(shared), settings)
  expect(first.ok && mapItinerary(first.options[0]).calls.map(m => m.place.id)).toEqual([a.id, b.id])
  const second = planPlaceJourney(net, ref(shared), ref(call(d)), settings)
  expect(second.ok && mapItinerary(second.options[0]).calls.map(m => m.place.id)).toEqual([c.id, d.id])
})

it('a single multi-target section scan reproduces the selected per-destination journey, even through another target', () => {
  const net = buildNetwork(data), targets = new Set(net.places.keys())
  for (const origin of [home, a, c]) {
    const batch = fastestRideSections(net, origin, targets, settings)
    for (const id of targets) {
      const single = search(net, { ...settings, origin: origin.id, destination: id })
      const ride = single.ok ? single.options.filter(t => t.legs.some(l => l.kind === 'ride')).sort((x, y) => x.end-y.end)[0] : undefined
      expect(batch.get(id)?.id, `${origin.id} → ${id}`).toBe(ride?.id)
    }
  }
})
