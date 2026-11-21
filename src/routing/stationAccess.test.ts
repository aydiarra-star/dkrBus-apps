import { expect, it } from 'vitest'
import { extractJourneyRequest } from '../domain/assistant'
import { understandWolof } from '../domain/wolofNlp'
import { buildStopIndex } from '../domain/stops'
import { passengerLookup } from './answers'
import { dakarNetwork as net, localPassengerData, planDakarJourney } from './dakar'
import { buildNetwork } from './network'
import { mapItinerary } from './presentation'
import { endpointOf } from './placeConnections'
import { search } from './search'
import { walkingTree } from './walking'
import type { Query } from './model'

const north = 'landmark:scat-ilot-nord', south = 'landmark:scat-ilot-sud', quay = 'brt-scat-quai-central'
const arrival = 'brt-petersen-quai-arrivee', call = 'brt-petersen'
const departAt = Date.parse('2026-11-18T19:00:00Z') / 1000
const point = (id: string) => endpointOf(net.places.get(id)!)
const run = (origin: string, destination: string, extra: Partial<Query> = {}) => search(net, { origin, destination, departAt, ...extra })

it.each([
  [north, call, 'access', '19961937', 61, 47, 246, 1430],
  [south, 'brt-grand-medine', 'access', '19961993', 71, 54, 324, 280],
  [call, north, 'egress', '19961993', 61, 47, 0, 1428],
  ['brt-prefecture-guediawaye', south, 'egress', '19961937', 71, 54, 0, 1703],
] as const)('travels %s → %s by the documented platform and compatible B1 direction', (a, b, role, relation, meters, walk, wait, ride) => {
  const result = planDakarJourney(point(a), point(b), { departAt, modes: ['brt'], maxChanges: 0 })
  if (!result.ok) throw Error(result.message)
  const t = result.options[0], w = t.legs.find(l => l.kind === 'walk')!, v = t.legs.find(l => l.kind === 'ride')!
  expect(t.legs.map(l => l.kind)).toEqual(role === 'access' ? ['walk','ride'] : ['ride','walk'])
  expect(w.role).toBe(role); expect(w.ways.map(e => e.onlyFor)).toEqual([role]); expect(w.stepFree).toBe('unknown')
  expect(w.positions).toHaveLength(3); expect(w.positions[1]).toEqual(a === north || b === north ? { lat: 14.7373054, lon: -17.4550269 } : { lat: 14.7366283, lon: -17.4553478 })
  expect(Math.round(t.walkMeters)).toBe(meters); expect(t).toMatchObject({ walkSeconds: walk, rideSeconds: ride, waitSeconds: wait, changes: 0, totalSeconds: walk + wait + ride })
  expect(v.source).toContain(relation); expect(v.source).toContain(relation === '19961937' ? 'stop 11738664176' : 'stop 11739915374')
  expect(v.source).toContain('platform 11739915373'); expect((role === 'access' ? v.from : v.to).id).toBe(quay)
  expect(mapItinerary(t).segments.map(s => s.positions)).toEqual(t.legs.map(l => l.positions.map(p => [p.lat, p.lon])))
  expect(mapItinerary(t).changes).toEqual([])
})

it('cannot turn an islet into a pavement, a passage through the station, a 121 transfer, or a step-free path', () => {
  for (const [a,b] of [[north,south], [south,north], [north,quay], [quay,south], [north,'ter-diamniadio'], [north,'ddd-petersen'], [north,'brt-prefecture-guediawaye']]) expect(run(a,b).ok).toBe(false)
  for (const settings of [{ modes: ['ddd'] as const }, { stepFreeOnly: true }, { maxWalkPerLegM: 60 }]) expect(planDakarJourney(point(north), point(call), { departAt, ...settings }).ok).toBe(false)
  for (const from of [{ ...point(north), landmarkId: undefined }, { ...point(north), lat: point(north).lat + 0.00001 }]) expect(planDakarJourney(from, point(call), { departAt })).toMatchObject({ ok: false, code: 'UNVERIFIED_ACCESS' })
  expect(run(south, call, { departAt: departAt + 3 * 3600 })).toMatchObject({ code: 'NO_SERVICE' })
  expect(walkingTree(net, north, 1200, false, 'transfer').distances.has(quay)).toBe(false)
  expect(walkingTree(net, quay, 1200, false, 'direct').distances.has(north)).toBe(false)
  const noBoard = buildNetwork({ ...localPassengerData, platformBindings: localPassengerData.platformBindings!.filter(b => !(b.platformId === quay && b.role === 'board')) })
  expect(search(noBoard, { origin: north, destination: call, departAt }).ok).toBe(false)
  expect(search(noBoard, { origin: call, destination: north, departAt }).ok).toBe(true) // independent alighting evidence
})

it('counts the islet walk before the last frequency slot, not after boarding', () => {
  // Last run leaves Préfecture at 20:54. At Scat Urbam its departure offset is 28:53.
  const atLimit = Date.parse('2026-11-18T21:22:06Z') / 1000 // 47 s to the quay
  const last = run(north, call, { departAt: atLimit, maxWalkPerLegM: 62 })
  if (!last.ok) throw Error(last.message)
  expect(last.options[0].waitSeconds).toBe(0)
  expect(run(north, call, { departAt: atLimit + 1 })).toMatchObject({ code: 'NO_SERVICE' })
  expect(run(quay, call, { departAt: atLimit + 1 }).ok).toBe(true) // already on the quay
})

it('never boards the Petersen arrival platform or moves the reference call to admit the other one', () => {
  expect(run(arrival, north)).toMatchObject({ ok: false, code: 'NO_PATH' }); expect(net.boarding.has(arrival)).toBe(false)
  expect(net.places.get(call)).toMatchObject({ lat: 14.6766438, lon: -17.4406354 })
  const other = { ...net.places.get(arrival)!, id: 'test:13377966011', lat: 14.6773569, lon: -17.4411392 }
  const pattern = net.patterns.find(p => p.shape.sourceId === '19961993')!
  const checked = buildNetwork({ ...localPassengerData, places: [...localPassengerData.places, other], platformBindings: [
    ...localPassengerData.platformBindings!, { mode: 'brt', direction: pattern.direction, lineId: pattern.lineId, stopId: call, role: 'board', platformId: other.id, stepFree: 'unknown', evidence: other.evidence }] })
  expect(checked.rejected).toHaveLength(1); expect(checked.rejected[0]).toContain('platform-binding:'); expect(checked.boarding.has(other.id)).toBe(false)
})

it('preserves the explicit island identity in the form and passenger assistant only', () => {
  expect(buildStopIndex([], net.places.values()).find(p => p.value === north)).toMatchObject({ group: 'Accès et quais vérifiés', kind: 'landmark' })
  const req = extractJourneyRequest(`De ${point(north).label} à station BRT de Petersen`, 'passenger')!
  expect(req.origin.landmarkId).toBe(north); expect(req.destination.stopId).toBe(call)
  const wo = `Jóge ${point(north).label} dem station BRT de Petersen`
  expect(understandWolof(wo, 'passenger')).toMatchObject({ intent: 'journey', origin: { landmarkId: north }, destination: { stopId: call } })
  expect(understandWolof(wo, 'reference').origin?.landmarkId).toBeUndefined()
  const answer = passengerLookup({ departAt })(req.origin, req.destination, 'trajet', 'fr')
  expect(answer.memory?.transfers).toBe(0); expect(answer.text).toContain('Marche'); expect(answer.text).toContain('quai central B1')
})
