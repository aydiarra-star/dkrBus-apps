// Tests only. No place, line, time, evidence or way here represents Dakar service.
import type { Evidence, FootwayInput, PatternInput, Place } from '../routing/model'
import { buildNetwork } from '../routing/network'
import type { TransferDirection, TransferProof } from '../routing/transferReview'

export const testEpoch = Date.parse('2026-11-18T08:00Z') / 1000
const evidence: Evidence = { status: 'reviewed', reference: 'SYNTHETIC QA ONLY', date: '2026-11-18' }
function point(name: string, x: number, y: number, kind: Place['kind'] = 'platform'): Place {
  return { id: `qa-${name}`, name, kind, evidence, lat: 14.72 + y / 10000, lon: -17.44 + x / 10000 }
}
const a = point('A', 0, 0), b = point('B', 20, 0), c = point('C', 21, 2), d = point('D', 45, 4)
const exit = point('Exit', 20, 1, 'entrance'), entry = point('Entry', 21, 1, 'entrance')
function line(name: string, network: PatternInput['network'], from: Place, to: Place, departure: number, duration: number): PatternInput {
  const lineId = `qa-${name}`, direction = `${from.id} → ${to.id}`
  return { lineId, name, network, direction, evidence, stops: [from.id, to.id], stepFree: 'yes',
    shape: { network, lineId, directionId: direction, source: 'OPERATOR_GEOJSON', sourceId: 'qa-shape', verified: true,
      positions: [from, { lat: to.lat + 0.0003, lon: (from.lon + to.lon) / 2 }, to] },
    service: { kind: 'timetable', source: 'qa-schedule', departures: [testEpoch + departure] },
    times: { kind: 'offsets', source: 'qa-times', arrivals: [0, duration], departures: [0, duration] } }
}
const inbound = line('Inbound', 'ter', a, b, 10, 110), outbound = line('Outbound', 'brt', c, d, 600, 121)
const direct = line('Direct', 'ddd', a, d, 901, 200)
const ways: FootwayInput[] = [[b, exit], [exit, entry], [entry, c]].map(([from, to], i) => ({
  id: `qa-way-${i}`, from: from.id, to: to.id, name: `qa-way-${i}`, kind: i === 1 ? 'crossing' : 'station-path',
  transferTiming:{from:from.id,to:to.id,seconds:[10,18,13][i],evidence},
  evidence, stepFree: 'yes', access: 'public', crossingsAndBarriersChecked: true, positions: [from, to],
}))
export const fixtureData = { places: [a, b, exit, entry, c, d], patterns: [inbound, outbound, direct], footways: ways }
export const fixtureNetwork = buildNetwork(fixtureData)
export const fixtureQuery = { origin: a.id, destination: d.id, departAt: testEpoch }
export const candidate: TransferDirection = { from: { stopId: 'qa-stop-west', mode: 'ter' }, to: { stopId: 'qa-stop-east', mode: 'brt' }, betweenSites: true }
export const proof = {
  alight: { ...candidate.from, platformId: b.id, lineId: inbound.lineId, direction: inbound.direction, evidence },
  board: { ...candidate.to, platformId: c.id, lineId: outbound.lineId, direction: outbound.direction, evidence },
  path: { scope: 'via-street', wayIds: ways.map(w => w.id), gates: [exit.id, entry.id], evidence },
} satisfies TransferProof
