import { concatenate } from './geometry'
import type { Criterion, Footway, Itinerary, Leg, Network, Outcome, Pattern, Place, Query, Walk } from './model'
import { nondominated, rank, type Metrics } from './ranking'
import { dayOf, followingPassages, nextRuns } from './serviceTime'
import { walkingTree } from './walking'

type Action = { kind: 'walk'; ways: Footway[]; role: Walk['role']; meters: number }
  | { kind: 'ride'; pattern: Pattern; i: number; j: number; start: number; every: number | null }
interface Label extends Metrics { place: Place; back?: { prev: Label; action: Action } }
type Frontier = Map<string, Label[]>
function insert(frontier: Frontier, label: Label) {
  const list = frontier.get(label.place.id) ?? []
  nondominated(list, label); frontier.set(label.place.id, list)
}
function itinerary(last: Label, best: Criterion[], departAt: number): Itinerary {
  const legs: Leg[] = []
  for (let l = last; l.back; l = l.back.prev) {
    const { prev, action } = l.back
    const common = { from: prev.place, to: l.place, end: l.at }
    if (action.kind === 'walk') {
      const { ways, role, meters } = action
      legs.push({ ...common, kind: 'walk', role, ways, meters, start: prev.at, positions: concatenate(ways),
        stepFree: ways.some(w => w.stepFree === 'no') ? 'no' : ways.every(w => w.stepFree === 'yes') ? 'yes' : 'unknown' })
    } else {
      const { pattern: p, i, j, start, every } = action
      const sections = p.sections.slice(i, j)
      legs.push({ ...common, kind: 'ride', start, waitSeconds: start - prev.at, headwaySeconds: every,
        passages: followingPassages(p.service, dayOf(departAt), start, p.departures[i]),
        lineId: p.lineId, lineName: p.name, mode: p.mode, network: p.network, direction: p.direction, stops: p.calls.slice(i, j + 1),
        source: p.evidence.reference, serviceSource: p.service.source, timing: p.service.kind, timingSource: p.times.source,
        stepFree: p.stepFree, positions: concatenate(sections), meters: sections.reduce((m, s) => m + s.meters, 0) })
    }
  }
  legs.reverse()
  // Include the run, direction and directed walking way IDs in option identity.
  const id = JSON.stringify(legs.map(l => l.kind === 'ride' ? [l.mode, l.lineId, l.direction, l.from.id, l.to.id, l.start] : l.ways.map(w => w.id)))
  return { id, best, legs, start: departAt, end: last.at, totalSeconds: last.at - departAt,
    changes: Math.max(0, last.boards - 1), walkMeters: last.walked,
    walkSeconds: legs.reduce((n, l) => n + (l.kind === 'walk' ? l.end - l.start : 0), 0),
    waitSeconds: legs.reduce((n, l) => n + (l.kind === 'ride' ? l.waitSeconds : 0), 0),
    rideSeconds: legs.reduce((n, l) => n + (l.kind === 'ride' ? l.end - l.start : 0), 0),
    meters: legs.reduce((n, l) => n + l.meters, 0) }
}

/** Multicriteria, round-based transit scan. Round k = k boardings. The label
 * frontier is Pareto-pruned, not a fixed top-N of nearby stops. Foot closures
 * use directed Dijkstra trees cached per source for this query/profile. */
export function search(net: Network, query: Query): Outcome {
  const { departAt, maxChanges = 3, maxWalkPerLegM = 1200, walkSpeedMpm = 80, transferBufferSeconds = 180, stepFreeOnly = false } = query
  if (!Number.isSafeInteger(departAt) || !Number.isFinite(new Date(departAt * 1000).getTime()) || !Number.isInteger(maxChanges) || maxChanges < 0 || maxChanges > 5 ||
      !Number.isFinite(walkSpeedMpm) || walkSpeedMpm <= 0 || !Number.isFinite(maxWalkPerLegM) || maxWalkPerLegM < 0 ||
      !Number.isSafeInteger(transferBufferSeconds) || transferBufferSeconds < 0) return { ok: false, code: 'INVALID_QUERY', message: 'Date, heure de Dakar ou paramètres de trajet invalides.' }
  const origin = net.places.get(query.origin), dest = net.places.get(query.destination)
  if (!origin || !dest) return { ok: false, code: 'UNVERIFIED_ACCESS', message: 'Le départ ou la destination ne dispose pas d’un point de desserte ou d’accès vérifié. Aucun raccordement par proximité.' }
  if (origin.id === dest.id) return { ok: false, code: 'SAME_PLACE', message: 'Le départ et la destination sont identiques.' }
  const day = dayOf(departAt)
  const trees = new Map<string, ReturnType<typeof walkingTree>>()
  const seed: Label = { place: origin, at: departAt, boards: 0, walked: 0, cadence: 0 }

  function scan(topologyOnly: boolean) {
    let ready: Frontier = new Map()
    const complete: Label[] = []
    const finish = (l: Label) => nondominated(complete, l.boards ? l : { ...l, cadence: Infinity })
    function afterWalk(l: Label, next: Frontier) {
      let tree = trees.get(l.place.id)
      if (!tree) { tree = walkingTree(net, l.place.id, maxWalkPerLegM, stepFreeOnly); trees.set(l.place.id, tree) }
      for (const [id, meters] of tree.distances) {
        // Even platforms at the same station never imply a change of vehicle.
        if (!meters || (id !== query.destination && !net.boarding.has(id))) continue
        const role = id === query.destination ? (l.boards ? 'egress' : 'direct') : (l.boards ? 'transfer' : 'access')
        const walked: Label = { ...l, place: net.places.get(id)!, walked: l.walked + meters,
          at: l.at + Math.ceil(meters * 60 / walkSpeedMpm), back: { prev: l, action: { kind: 'walk', ways: tree.pathTo(id), meters, role } } }
        if (id === query.destination) finish(walked)
        else insert(next, walked)
      }
    }
    insert(ready, seed); afterWalk(seed, ready)
    for (let boards = 1; ready.size && boards <= maxChanges + 1; boards++) {
      const alighted: Frontier = new Map()
      for (const [id, labels] of ready) for (const { pattern: p, index: i } of net.boarding.get(id) ?? []) {
        if ((query.modes && !query.modes.includes(p.network) && !query.modes.includes(p.mode)) || (stepFreeOnly && p.stepFree !== 'yes')) continue
        for (const l of labels) {
          const canBoardAt = l.at + (boards > 1 ? transferBufferSeconds : 0)
          const offset = p.departures[i]
          const runs = topologyOnly ? [{ originAt: canBoardAt - offset, every: null }] : nextRuns(p.service, day, canBoardAt, offset)
          for (const { originAt, every } of runs) for (let j = i + 1; j < p.calls.length; j++) {
            const arrival: Label = { place: p.calls[j], at: originAt + p.arrivals[j], boards, walked: l.walked,
              cadence: Math.max(l.cadence, every ?? Infinity), back: { prev: l, action: { kind: 'ride', pattern: p, i, j, start: originAt + offset, every } } }
            if (arrival.place.id === query.destination) finish(arrival)
            else insert(alighted, arrival)
          }
        }
      }
      ready = new Map()
      for (const labels of alighted.values()) for (const l of labels) afterWalk(l, ready)
      if (topologyOnly && complete.length) break
    }
    return complete
  }
  const labels = scan(false)
  if (!labels.length) {
    // This second scan diagnoses a calendar failure; its hypothetical times
    // NEVER leave this function as an itinerary.
    return scan(true).length
      ? { ok: false, code: 'NO_SERVICE', message: 'Aucun passage compatible avec l’heure, la date et le temps de correspondance pour ce jour de service.' }
      : { ok: false, code: 'NO_PATH', message: 'Aucun itinéraire complet dans ce sens avec les lignes et cheminements vérifiés et les filtres choisis.' }
  }
  return { ok: true, options: [...rank(labels)].map(([l, best]) => itinerary(l, best, departAt)) }
}
