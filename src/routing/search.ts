import { concatenate } from './geometry'
import type { Criterion, Footway, Itinerary, Leg, Network, ObservedPlatform, Outcome, Pattern, Place, Query, Walk } from './model'
import { nondominated, rank, type Metrics } from './ranking'
import { dayOf, followingPassages, nextRuns } from './serviceTime'
import { walkingTree } from './walking'

type Action = { kind: 'walk'; ways: Footway[]; role: Walk['role']; meters: number }
  | { kind: 'ride'; pattern: Pattern; i: number; j: number; start: number; every: number | null; board?: ObservedPlatform; alight?: ObservedPlatform }
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
      const { pattern: p, i, j, start, every, board, alight } = action
      const stepFree = [p.stepFree, ...[board, alight].flatMap(o => o ? [o.stepFree] : [])]
      const sources = [p.evidence.reference, ...[board, alight].flatMap(o => o ? [`${o.place.name} : ${o.evidence.reference} (${o.evidence.date})`] : [])]
      const sections = p.sections.slice(i, j)
      legs.push({ ...common, from: board?.place ?? common.from, to: alight?.place ?? common.to, kind: 'ride', start, waitSeconds: start - prev.at, headwaySeconds: every,
        passages: followingPassages(p.service, dayOf(departAt), start, p.departures[i]),
        lineId: p.lineId, lineName: p.name, mode: p.mode, network: p.network, direction: p.direction, stops: p.calls.slice(i, j + 1),
        source: sources.join(' · '), serviceSource: p.service.source, timing: p.service.kind, timingSource: p.times.source,
        stepFree: stepFree.includes('no') ? 'no' : stepFree.includes('unknown') ? 'unknown' : 'yes', positions: concatenate(sections), meters: sections.reduce((m, s) => m + s.meters, 0) })
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
type Settings = Omit<Query, 'origin' | 'destination'>
function validQuery(query: Settings) {
  const { departAt, maxChanges = 3, maxWalkPerLegM = 1200, walkSpeedMpm = 80, transferBufferSeconds = 180 } = query
  return Number.isSafeInteger(departAt) && Number.isFinite(new Date(departAt * 1000).getTime()) && Number.isInteger(maxChanges) && maxChanges >= 0 && maxChanges <= 5 &&
    Number.isFinite(walkSpeedMpm) && walkSpeedMpm > 0 && Number.isFinite(maxWalkPerLegM) && maxWalkPerLegM >= 0 && Number.isSafeInteger(transferBufferSeconds) && transferBufferSeconds >= 0
}
function scanner(net: Network, origin: Place, targets: ReadonlySet<string>, query: Settings) {
  const { departAt, maxChanges = 3, maxWalkPerLegM = 1200, walkSpeedMpm = 80, transferBufferSeconds = 180, stepFreeOnly = false } = query
  const day = dayOf(departAt)
  const trees = new Map<string, ReturnType<typeof walkingTree>>()
  const seed: Label = { place: origin, at: departAt, boards: 0, walked: 0, cadence: 0 }

  return function scan(topologyOnly: boolean) {
    let ready: Frontier = new Map()
    const complete: Frontier = new Map()
    const finish = (l: Label) => insert(complete, l.boards ? l : { ...l, cadence: Infinity })
    function afterWalk(l: Label, next: Frontier) {
      if (!net.walking.has(l.place.id)) return
      const close = (role: Walk['role'], final: boolean) => {
        // A path to catch a bus is not necessarily open to through pedestrians.
        // Filter *inside* Dijkstra: a longer general-use path might still exist.
        const key = JSON.stringify([l.place.id, role])
        let tree = trees.get(key)
        if (!tree) { tree = walkingTree(net, l.place.id, maxWalkPerLegM, stepFreeOnly, role); trees.set(key, tree) }
        for (const [id, meters] of tree.distances) {
          if (!meters || (final ? !targets.has(id) : !net.boarding.has(id) || (targets.size === 1 && targets.has(id)))) continue
          const arrival: Label = { ...l, place: net.places.get(id)!, walked: l.walked + meters,
            at: l.at + Math.ceil(meters * 60 / walkSpeedMpm), back: { prev: l, action: { kind: 'walk', ways: tree.pathTo(id), meters, role } } }
          if (final) finish(arrival)
          else insert(next, arrival)
        }
      }
      close(l.boards ? 'egress' : 'direct', true)
      close(l.boards ? 'transfer' : 'access', false)
    }
    insert(ready, seed); afterWalk(seed, ready)
    for (let boards = 1; ready.size && boards <= maxChanges + 1; boards++) {
      const alighted: Frontier = new Map()
      for (const [id, labels] of ready) for (const { pattern: p, index: i } of net.boarding.get(id) ?? []) {
        if ((query.modes && !query.modes.includes(p.network) && !query.modes.includes(p.mode)) || (stepFreeOnly && p.stepFree !== 'yes')) continue
        const platforms = net.platforms.get(p)
        const board = platforms?.board.get(i)
        if (stepFreeOnly && board && board.stepFree !== 'yes') continue
        for (const l of labels) {
          const canBoardAt = l.at + (boards > 1 ? transferBufferSeconds : 0)
          const offset = p.departures[i]
          const runs = topologyOnly ? [{ originAt: canBoardAt - offset, every: null }] : nextRuns(p.service, day, canBoardAt, offset)
          for (const { originAt, every } of runs) for (let j = i + 1; j < p.calls.length; j++) {
            const arrive = (place: Place, alight?: ObservedPlatform) => {
              const arrival: Label = { place, at: originAt + p.arrivals[j], boards, walked: l.walked,
                cadence: Math.max(l.cadence, every ?? Infinity), back: { prev: l, action: { kind: 'ride', pattern: p, i, j, start: originAt + offset, every, board, alight } } }
              if (targets.has(place.id)) finish(arrival)
              if (net.walking.has(place.id) && (!targets.has(place.id) || targets.size > 1)) insert(alighted, arrival)
            }
            const alight = platforms?.alight.get(j)
            if (stepFreeOnly && alight && alight.stepFree !== 'yes') continue
            // A bound service call is a logical destination, not a second platform from which to change.
            if (!alight || targets.has(p.calls[j].id)) arrive(p.calls[j], alight)
            if (alight) arrive(alight.place, alight)
          }
        }
      }
      ready = new Map()
      for (const labels of alighted.values()) for (const l of labels) afterWalk(l, ready)
      if (topologyOnly && complete.size) break
    }
    return complete
  }
}

export function search(net: Network, query: Query): Outcome {
  if (!validQuery(query)) return { ok: false, code: 'INVALID_QUERY', message: 'Date, heure de Dakar ou paramètres de trajet invalides.' }
  const origin = net.places.get(query.origin), dest = net.places.get(query.destination)
  if (!origin || !dest) return { ok: false, code: 'UNVERIFIED_ACCESS', message: 'Le départ ou la destination ne dispose pas d’un point de desserte ou d’accès vérifié. Aucun raccordement par proximité.' }
  if (origin.id === dest.id) return { ok: false, code: 'SAME_PLACE', message: 'Le départ et la destination sont identiques.' }
  const scan = scanner(net, origin, new Set([dest.id]), query)
  const labels = scan(false).get(dest.id) ?? []
  if (!labels.length) {
    // This second scan diagnoses a calendar failure; its hypothetical times
    // NEVER leave this function as an itinerary.
    return scan(true).size
      ? { ok: false, code: 'NO_SERVICE', message: 'Aucun passage compatible avec l’heure, la date et le temps de correspondance pour ce jour de service.' }
      : { ok: false, code: 'NO_PATH', message: 'Aucun itinéraire complet dans ce sens avec les lignes et cheminements vérifiés et les filtres choisis.' }
  }
  return { ok: true, options: [...rank(labels)].map(([l, best]) => itinerary(l, best, query.departAt)) }
}

/** Nearby-stop fallback: one dated scan per boarding point for ALL candidate
 * destinations, not a new scan and topology diagnosis for every pair. Keep a
 * winning ride so selecting its exact endpoints reproduces the same variant. */
export function fastestRideSections(net: Network, origin: Place, targets: ReadonlySet<string>, query: Settings) {
  const trips = new Map<string, Itinerary>()
  if (!targets.size || !validQuery(query)) return trips
  for (const [id, labels] of scanner(net, origin, targets, query)(false)) {
    if (id === origin.id) continue
    const win = [...rank(labels)].filter(([l]) => l.boards).sort(([a], [b]) => a.at - b.at)[0]
    if (win) trips.set(id, itinerary(win[0], win[1], query.departAt))
  }
  return trips
}
