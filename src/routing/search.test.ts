import { describe, expect, it } from 'vitest'
import { roadDistanceMeters } from '../domain/roadNetworkRouting'
import type { Dataset, FootwayInput, Itinerary, Outcome, PatternInput, Place, Query } from './model'
import { buildNetwork } from './network'
import { mapItinerary } from './presentation'
import { search } from './search'

// Topology fixtures ONLY; these IDs, ways and times are not Dakar services.
const proof = { status: 'reviewed', reference: 'synthetic test only', date: '2026-11-18' } as const
const T = Date.parse('2026-11-18T08:00:00Z') / 1000
function place(id: string, x: number, y = 0, kind: Place['kind'] = 'platform'): Place {
  return { id, name: id, kind, lat: 14.7 + y / 5000, lon: -17.43 + x / 5000, evidence: proof }
}
const entry = place('entry', 0, 0, 'entrance'), corner = place('corner', 0, 1, 'path'), a = place('A', 1, 1), b = place('B', 12, 1)
const c = place('C', 12, 2), d = place('D', 25, 2), e = place('E', 25, 3), f = place('F', 35, 3), exit = place('exit', 36, 3, 'entrance')
const addresses = [entry, corner, a, b, c, d, e, f, exit]
function way(from: Place, to: Place): FootwayInput {
  return { id: `${from.id}/${to.id}`, from: from.id, to: to.id, name: `Way ${from.id}/${to.id}`, transferTiming:{from:from.id,to:to.id,seconds:24,evidence:proof}, kind: 'crossing', access: 'public', crossingsAndBarriersChecked: true, stepFree: 'yes', evidence: proof, positions: [from, to] }
}
function line(lineId: string, network: PatternInput['network'], from: Place, to: Place, when: number, duration: number): PatternInput {
  const direction = `${from.id} → ${to.id}`
  const bend = { lat: (from.lat + to.lat) / 2 + 0.0005, lon: (from.lon + to.lon) / 2 }
  return { lineId, name: lineId, network, direction, stops: [from.id, to.id], stepFree: 'yes', evidence: proof,
    shape: { network, lineId, directionId: direction, source: 'OPERATOR_GEOJSON', sourceId: `fixture:${lineId}`, verified: true, positions: [from, bend, to] },
    service: { kind: 'timetable', source: 'test timetable', departures: [T + when] },
    times: { kind: 'offsets', arrivals: [0, duration], departures: [0, duration], source: 'test run' } }
}
const paths = [way(entry, corner), way(corner, a), way(b, c), way(d, e), way(f, exit)]
const lines = [line('train', 'ter', a, b, 120, 180), line('rapid', 'brt', c, d, 480, 120), line('bus', 'ddd', e, f, 720, 180)]
const data: Dataset = { places: addresses, patterns: lines, footways: paths }
const query: Query = { origin: entry.id, destination: exit.id, departAt: T, transferBufferSeconds: 60 }
const run = (changes: Partial<Dataset> = {}, options: Partial<Query> = {}) => search(buildNetwork({ ...data, ...changes }), { ...query, ...options })
function first(result: Outcome): Itinerary { if (!result.ok) throw Error(result.message); return result.options[0] }

it('boards three dated services, walks between distinct platforms, and accounts for every second once', () => {
  const trip = first(run())
  expect(trip.legs.map(l => l.kind === 'walk' ? l.role : l.network)).toEqual(['access', 'ter', 'transfer', 'brt', 'transfer', 'ddd', 'egress'])
  expect(trip.changes).toBe(2)
  expect(trip.rideSeconds).toBe(480)
  expect(trip.totalSeconds).toBe(trip.rideSeconds + trip.waitSeconds + trip.walkSeconds)
  expect(trip.end).toBe(T + 900 + Math.ceil(roadDistanceMeters(f, exit) * 60 / 80))
  expect(trip.legs.filter(l => l.kind === 'ride').map(l => l.start)).toEqual([T + 120, T + 480, T + 720])
  expect(trip.legs[0].positions).toEqual([entry, corner, a])
  for (const l of trip.legs) {
    const meters = l.positions.slice(1).reduce((n, p, i) => n + roadDistanceMeters(l.positions[i], p), 0)
    expect(l.meters).toBeCloseTo(meters, 5)
  }
  const overlay = mapItinerary(trip)
  expect(overlay.segments.map(s => s.positions)).toEqual(trip.legs.map(l => l.positions.map(p => [p.lat, p.lon])))
  expect(overlay.changes.map(p => p.id)).toEqual(['B', 'C', 'D', 'E'])
})

it('requires a reviewed positive path even at the same station; honours direction, modes, walking budget and accessibility', () => {
  expect(run({ footways: paths.filter(w => w.from !== 'B') })).toMatchObject({ ok: false, code: 'NO_PATH' })
  expect(run({ footways: paths.map(w => w.from === 'B' ? way(c, b) : w) })).toMatchObject({ ok: false, code: 'NO_PATH' })
  expect(run({ places: addresses.map(p => p === c ? { ...p, name: b.name, lat: b.lat, lon: b.lon } : p), footways: paths.filter(w => w.from !== 'B') }).ok).toBe(false)
  // Even two lines calling at the very same ID cannot change without a transfer proof.
  expect(run({ patterns: [lines[0], line('other', 'brt', b, f, 550, 60)] }).ok).toBe(false)
  expect(run({}, { modes: ['ter', 'brt'] }).ok).toBe(false)
  expect(run({}, { modes: [] }).ok).toBe(false)
  expect(run({}, { maxChanges: 1 }).ok).toBe(false)
  expect(run({}, { maxWalkPerLegM: 15 }).ok).toBe(false)
  expect(run({}, { stepFreeOnly: true }).ok).toBe(true)
  expect(run({ footways: paths.map(w => ({ ...w, stepFree: 'unknown' })) }, { stepFreeOnly: true }).ok).toBe(false)
  expect(run({ patterns: lines.map(p => ({ ...p, stepFree: 'unknown' })) }, { stepFreeOnly: true }).ok).toBe(false)
})

it('refuses missed connections after walking plus buffer, even though the topology connects', () => {
  expect(run({}, { transferBufferSeconds: 300 })).toMatchObject({ ok: false, code: 'NO_SERVICE' })
  expect(run({}, { departAt: T + 120 })).toMatchObject({ ok: false, code: 'NO_SERVICE' })
  expect(run({}, { walkSpeedMpm: 1 })).toMatchObject({ ok: false, code: 'NO_SERVICE' })
})

it('uses different explicit geometry/time for a return, never automatically reversing a ride or footway', () => {
  const reverse = { origin: 'B', destination: 'A' }
  expect(run({}, reverse)).toMatchObject({ ok: false, code: 'NO_PATH' })
  const back = line('train', 'ter', b, a, 870, 230)
  const positions = [b, { lat: a.lat - 0.0005, lon: (b.lon + a.lon) / 2 }, a]
  const trip = first(run({ patterns: [...lines, { ...back, shape: { ...back.shape, positions } }] }, reverse))
  expect(trip.legs[0].start).toBe(T + 870)
  expect(trip.rideSeconds).toBe(230)
  expect(trip.legs[0].positions).toEqual(positions.map(({ lat, lon }) => ({ lat, lon })))
  expect(run({}, { origin: 'A', destination: 'entry' }).ok).toBe(false)
})

it('can walk without a vehicle only when a complete reviewed path exists', () => {
  const trip = first(run({ patterns: [] }, { destination: 'A' }))
  expect(trip.legs).toHaveLength(1)
  expect(trip.legs[0]).toMatchObject({ kind: 'walk', role: 'direct', positions: [entry, corner, a] })
  expect(run({ footways: [] }, { destination: 'A' }).ok).toBe(false)
  expect(run({}, { origin: 'unmapped' })).toMatchObject({ code: 'UNVERIFIED_ACCESS' })
  expect(run({}, { destination: entry.id })).toMatchObject({ code: 'SAME_PLACE' })
})

it('selects distinct Pareto winners, not merely the earliest intermediate arrival', () => {
  const freq = (p: PatternInput, start: number, every: number): PatternInput => ({ ...p, service: { kind: 'frequency', source: 'test', windows: [{ start: 8 * 3600 + start, end: 13 * 3600, every, weekdays: [3], holidays: 'as-weekday' }] } })
  const slow = freq(line('direct', 'ddd', a, f, 0, 1300), 0, 300)
  const firstLeg = lines[0], secondLeg = line('rapid', 'brt', c, f, 400, 120)
  const result = run({ patterns: [slow, firstLeg, secondLeg] }, { origin: 'A', destination: 'F' })
  expect(result.ok && result.options.length).toBe(2)
  if (!result.ok) throw Error(result.message)
  const [fast, direct] = result.options
  expect(fast.best).toContain('fastest'); expect(fast.end).toBe(T + 520)
  expect(direct.best).toEqual(expect.arrayContaining(['walking','simple','changes']))
  expect(direct.changes).toBe(0); expect(direct.walkSeconds).toBe(0)
  // When both headways are known, still keep the more frequent direct
  // option even if it arrives later. Do not impute a headway to a timetable.
  const frequent = run({ patterns:[slow, freq(line('fast-direct','ddd',a,f,0,120),0,600)] }, { origin:a.id,destination:f.id })
  expect(frequent.ok && frequent.options.map(t => t.best)).toEqual([expect.arrayContaining(['fastest']), ['cadence']])
})

describe('admission rejects the whole invalid direction or edge, without chords', () => {
  it.each(['candidate','unordered','unknown stop','duplicate call','distant stop','missing vertices','jump','NaN','line mismatch','bad offsets','no service'])(`rejects %s`, key => {
    const p = structuredClone(lines[0])
    if (key === 'candidate') p.evidence.status = 'candidate'
    if (key === 'unordered') p.stops = ['B','A']
    if (key === 'unknown stop') p.stops = ['A','?']
    if (key === 'duplicate call') p.stops = ['A','A']
    if (key === 'distant stop') p.stops = ['A','F']
    if (key === 'missing vertices') p.shape.positions = []
    if (key === 'jump') p.shape.positions = [a, { lat: 14.85, lon: -17.43 }, b]
    if (key === 'NaN') p.shape.positions = [a, { lat: NaN, lon: -17.43 }, b]
    if (key === 'line mismatch') p.shape.lineId = 'different'
    if (key === 'bad offsets' && p.times.kind === 'offsets') p.times.arrivals = [0, -1]
    if (key === 'no service') p.service = { kind: 'frequency', windows: [], source: 'none' }
    const net = buildNetwork({ ...data, patterns: [p] })
    expect(net.patterns).toHaveLength(0); expect(net.rejected).toHaveLength(1)
  })
  it('does not wire ambiguous IDs, call centroids, blocked or unreviewed crossings, or unanchored geometry', () => {
    expect(buildNetwork({ ...data, patterns: [lines[0], lines[0]] }).patterns).toHaveLength(0)
    expect(buildNetwork({ ...data, places: [...addresses, a] }).places.has('A')).toBe(false)
    const w = paths[2]
    for (const changes of [{ positions: [b, d] }, { evidence: { ...proof, status: 'candidate' as const } }, { access: 'unknown' as const }, { crossingsAndBarriersChecked: false }]) {
      expect(buildNetwork({ ...data, footways: [{ ...w, ...changes }] }).walking.size).toBe(0)
    }
    expect(buildNetwork({ ...data, places: addresses.map(p => ({ ...p, kind: 'call' })) }).walking.size).toBe(0)
  })
})

it('Dijkstra chooses the shortest checked footway chain, not the first discovered route or a chord', () => {
  const detour = place('detour', 0, 5, 'path')
  const trip = first(run({ patterns: [], places: [...addresses, detour], footways: [way(entry, detour), way(detour, a), ...paths] }, { destination: a.id }))
  expect(trip.legs[0].positions).toEqual([entry, corner, a])
})

it('normalizes explicitly identified bus/rail road ways; will not take a shortcut, jump, reverse, or infer a stop anchor', () => {
  const graphPattern = (mode: 'bus' | 'rail') => {
    const { shape, ...p } = mode === 'rail' ? lines[0] : lines[1]
    const [from, mid, to] = shape.positions
    const first = { from: 'n1', to: 'n2', mode, evidence: proof, positions: [from, mid] }
    const second = { from: 'n2', to: 'n3', mode, evidence: proof, positions: [mid, to] }
    return { ...p, geometry: shape, sections: [{ fromStop: p.stops[0], toStop: p.stops[1], fromNode: 'n1', toNode: 'n3', evidence: proof, ways: [second, first] }] }
  }
  for (const mode of ['bus', 'rail'] as const) {
    const g = graphPattern(mode)
    const s = g.sections[0], [second, one] = s.ways
    const result = run({ patterns: [], graphPatterns: [g] }, { origin: s.fromStop, destination: s.toStop })
    expect(first(result).legs[0].positions).toEqual(g.geometry.positions)
    const shortcut = { ...one, to: 'n3', positions: [one.positions[0], second.positions[1]] }
    for (const section of [
      { ...s, ways: [...s.ways, shortcut] }, { ...s, ways: [one] }, { ...s, ways: [one, { ...second, from: 'other-node' }] },
      { ...s, ways: [one, { ...second, positions: [...second.positions].reverse() }] },
      { ...s, ways: [one, { ...second, mode: 'walk' as const }] }, { ...s, toStop: 'wrong' }, { ...s, toNode: 'n1' },
      { ...s, evidence: { ...proof, status: 'candidate' as const } },
    ]) expect(buildNetwork({ ...data, patterns: [], graphPatterns: [{ ...g, sections: [section] }] }).patterns).toHaveLength(0)
  }
})

it('keeps AFTU and TATA services separately identified even with the same public line number', () => {
  const base = line('7', 'aftu_tata', a, b, 180, 60)
  const options = { origin: 'A', destination: 'B' }
  expect(run({ patterns: [base] }, options).ok).toBe(false)
  for (const family of ['aftu', 'tata'] as const) {
    const r = run({ patterns: [{ ...base, busFamily: 'aftu' }, { ...base, busFamily: 'tata' }] }, { ...options, modes: [family] })
    expect(first(r).legs[0]).toMatchObject({ mode: family, lineName: '7' })
    expect(mapItinerary(first(r)).segments[0].busFamily).toBe(family)
  }
})

it.each([[0,'frequency'],[1,'frequency'],[0,'running time'],[1,'running time']] as const)(
  'does not advertise a walking change when leg %i has only modelled %s, even on a documented path', (index, model) => {
    const pair = [lines[0], lines[1]].map((p, i): PatternInput => i !== index ? p : model === 'frequency'
      ? { ...p, service: { kind:'frequency',source:'synthetic cadence',windows:[{start:28920+i*360,end:30000,every:60,weekdays:[3],holidays:'as-weekday'}] } }
      : { ...p, times: { kind:'model',speedKph:30,dwellSeconds:0,source:'synthetic speed' } })
    expect(run({ patterns:pair }, { origin:a.id, destination:d.id })).toMatchObject({ ok:false, code:'NO_SERVICE' })
    expect(run({ patterns:pair }, { origin:pair[index].stops[0], destination:pair[index].stops[1] }).ok).toBe(true)
  })

it('an earlier modelled arrival can egress but cannot suppress or impersonate the dated transfer at the same place', () => {
  const early = line('early','ter',a,b,0,1)
  const p: PatternInput = { ...early, times: { kind:'model',source:'synthetic',speedKph:60,dwellSeconds:0 } }
  const pair = [p,lines[0],lines[1]], trip = first(run({ patterns:pair }, {origin:a.id,destination:d.id}))
  expect(trip.legs.filter(l => l.kind === 'ride').map(l=>l.lineId)).toEqual(['train','rapid'])
  const egress = first(run({ patterns:[p] }, {origin:a.id,destination:c.id}))
  expect(egress.legs.map(l=>l.kind === 'walk' ? l.role : l.lineId)).toEqual(['early','egress'])
})

it('does not sell a connection on metres and generic walking speed without a timed directed crossing', () => {
  const footways=paths.map(({...w})=>{delete w.transferTiming;return w})
  expect(run({footways},{origin:a.id,destination:d.id}).ok).toBe(false)
  expect(run({footways},{origin:a.id,destination:c.id}).ok).toBe(true) // egress is not a change
})

it('checks a longer timed alternative instead of assuming the geometrically shortest crossing is fastest',()=>{
  const mid=place('signal',12.5,1.5,'path')
  const slow={...paths[2],transferTiming:{...paths[2].transferTiming!,seconds:240}}
  const via=[way(b,mid),way(mid,c)], q={origin:a.id,destination:d.id}
  expect(run({footways:[slow]},q).ok).toBe(false)
  const trip=first(run({footways:[slow,...via],places:[...addresses,mid]},q))
  expect(trip.legs[1]).toMatchObject({role:'transfer',ways:via.map(w=>({id:w.id}))});expect(trip.walkSeconds).toBe(48)
  expect(run({footways:via,places:[...addresses,mid]}, {...q,walkSpeedMpm:1}).ok).toBe(false)
})
