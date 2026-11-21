import { concatenate } from './geometry'
import type { Criterion, Footway, Itinerary, Leg, Network, ObservedPlatform, OnwardBoarding, Outcome, Pattern, Place, Query, Walk } from './model'
import { nondominated, rank, type Metrics } from './ranking'
import { dayOf, followingPassages, nextRuns } from './serviceTime'
import { timedWalks, walkingTree } from './walking'

type Action = { kind: 'walk'; ways: Footway[]; role: Walk['role']; meters: number }
  | { kind: 'ride'; pattern: Pattern; i: number; j: number; start: number; every: number | null; board?: ObservedPlatform; alight?: ObservedPlatform; change?: OnwardBoarding['proof']; changeBufferSeconds?: number }
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
      const { pattern: p, i, j, start, every, board, alight, change, changeBufferSeconds } = action
      const stepFree = [p.stepFree, ...(change ? [change.stepFree] : []), ...[board, alight].flatMap(o => o ? [o.stepFree] : [])]
      const sources = [p.evidence.reference, ...[board, alight].flatMap(o => o ? [`${o.place.name} : ${o.evidence.reference} (${o.evidence.date})`] : [])]
      const sections = p.sections.slice(i, j)
      legs.push({ ...common, from: board?.place ?? common.from, to: alight?.place ?? common.to, kind: 'ride', start, waitSeconds: start - prev.at, headwaySeconds: every,
        passages: followingPassages(p.service, dayOf(departAt), start, p.departures[i]),
        lineId: p.lineId, lineName: p.name, mode: p.mode, network: p.network, direction: p.direction, stops: p.calls.slice(i, j + 1),
        ...(change && { samePlatformChange: change }), ...(changeBufferSeconds !== undefined && { changeBufferSeconds }),
        source: sources.join(' · '), serviceSource: p.service.source, timing: p.service.kind, timeProfile: p.times.kind, timingSource: p.times.source,
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
interface RequiredRide { pattern: Pattern; fromIndex: number; toIndex: number; requiredOrigin?: number }
/** Private to a review query; limits existing permissions, never adds one. */
interface ReviewedPair { rides: readonly [RequiredRide, RequiredRide]; alightPlatform: string; samePosition: boolean }
function scanner(net: Network, origin: Place, targets: ReadonlySet<string>, query: Settings, pair?: ReviewedPair) {
  const { departAt, maxChanges = 3, maxWalkPerLegM = 1200, walkSpeedMpm = 80, transferBufferSeconds = 180, stepFreeOnly = false } = query
  const day = dayOf(departAt)
  const trees = new Map<string, ReturnType<typeof walkingTree>>()
  const transfers = new Map<string, ReturnType<typeof timedWalks>>()
  const seed: Label = { place: origin, at: departAt, boards: 0, walked: 0, cadence: 0 }

  return function scan(topologyOnly: boolean) {
    let ready: Frontier = new Map()
    // Only a diagnostic scan may join modelled times. Single rides and their
    // access/egress walks stay available with their original timing labels.
    const datedChangesOnly = !topologyOnly && !pair
    // Kept apart from the generic walking frontier: only THIS outgoing
    // boarding is permitted. Earlier alightings from other lines cannot
    // dominate it or acquire its permission, even at the same place.
    let shared = new Map<OnwardBoarding, Label[]>()
    function* boardings() {
      for (const [id, labels] of ready) for (const b of net.boarding.get(id) ?? []) yield { ...b, labels, change: undefined }
      for (const [b, labels] of shared) yield { ...b, labels, change: b.proof }
    }
    const complete: Frontier = new Map()
    const finish = (l: Label) => insert(complete, l.boards ? l : { ...l, cadence: Infinity })
    function afterWalk(l: Label, next: Frontier, egressOnly = false) {
      if (!net.walking.has(l.place.id) || (pair && (l.boards !== 1 || pair.samePosition))) return
      const close = (role: Walk['role'], final: boolean) => {
        if (role === 'transfer') {
          let paths = transfers.get(l.place.id)
          if (!paths) { paths = timedWalks(net, l.place.id, maxWalkPerLegM, stepFreeOnly, walkSpeedMpm); transfers.set(l.place.id,paths) }
          for (const path of paths) {
            if (!pair && targets.size === 1 && targets.has(path.to)) continue
            insert(next, { ...l, place: net.places.get(path.to)!, walked: l.walked + path.meters, at: l.at + path.seconds,
              back: { prev: l, action: { kind:'walk', role, ways: path.ways, meters: path.meters} } })
          }
          return
        }
        // A path to catch a bus is not necessarily open to through pedestrians.
        // Filter *inside* Dijkstra: a longer general-use path might still exist.
        const key = JSON.stringify([l.place.id, role])
        let tree = trees.get(key)
        if (!tree) { tree = walkingTree(net, l.place.id, maxWalkPerLegM, stepFreeOnly, role); trees.set(key, tree) }
        for (const [id, meters] of tree.distances) {
          if (!meters || (final ? !targets.has(id) : !net.boarding.has(id) || (!pair && targets.size === 1 && targets.has(id)))) continue
          const arrival: Label = { ...l, place: net.places.get(id)!, walked: l.walked + meters,
            at: l.at + Math.ceil(meters * 60 / walkSpeedMpm), back: { prev: l, action: { kind: 'walk', ways: tree.pathTo(id), meters, role } } }
          if (final) finish(arrival)
          else insert(next, arrival)
        }
      }
      if (!pair) close(l.boards ? 'egress' : 'direct', true)
      if (!egressOnly) close(l.boards ? 'transfer' : 'access', false)
    }
    insert(ready, seed); afterWalk(seed, ready)
    for (let boards = 1; (ready.size || shared.size) && boards <= maxChanges + 1; boards++) {
      // Keep the two frontiers separate: an earlier modelled alighting may
      // walk to the destination but must not displace a dated transfer label.
      const alighted: Frontier = new Map(), exitOnly: Frontier = new Map()
      const nextShared = new Map<OnwardBoarding, Label[]>()
      const required = pair?.rides[boards - 1]
      for (const { labels, pattern: p, index: i, change } of boardings()) {
        if (pair && (p !== required?.pattern || i !== required.fromIndex || (boards === 2 && Boolean(change) !== pair.samePosition))) continue
        if ((query.modes && !query.modes.includes(p.network) && !query.modes.includes(p.mode)) || (stepFreeOnly && p.stepFree !== 'yes')) continue
        const dated = p.service.kind === 'timetable' && p.times.kind === 'offsets'
        if (datedChangesOnly && boards > 1 && !dated) continue
        const platforms = net.platforms.get(p)
        const board = platforms?.board.get(i)
        if (stepFreeOnly && board && board.stepFree !== 'yes') continue
        for (const l of labels) {
          const changeBufferSeconds = boards > 1 ? Math.max(transferBufferSeconds, change?.minimumSeconds ?? 0) : undefined
          const canBoardAt = l.at + (changeBufferSeconds ?? 0)
          const offset = p.departures[i]
          const pinned = required?.requiredOrigin
          // Restrict the normal dated lookup; never manufacture the selected
          // origin or substitute the next run after a missed connection.
          const readyAt = pinned === undefined ? canBoardAt : Math.max(canBoardAt, pinned + offset)
          const runs = topologyOnly ? [{ originAt: canBoardAt - offset, every: null }]
            : pinned === undefined ? nextRuns(p.service, day, readyAt, offset)
            : dated ? nextRuns(p.service, day, readyAt, offset).filter(r => r.originAt === pinned) : []
          for (const { originAt, every } of runs) for (let j = i + 1; j < p.calls.length; j++) {
            if (required && j !== required.toIndex) continue
            const arrive = (place: Place, alight?: ObservedPlatform) => {
              if (pair && boards === 1 && place.id !== pair.alightPlatform) return
              const arrival: Label = { place, at: originAt + p.arrivals[j], boards, walked: l.walked,
                cadence: Math.max(l.cadence, every ?? Infinity), back: { prev: l, action: { kind: 'ride', pattern: p, i, j, start: originAt + offset, every, board, alight, change, changeBufferSeconds } } }
              if ((!pair || boards === 2) && targets.has(place.id)) finish(arrival)
              if (place.kind === 'platform' && boards <= maxChanges) for (const b of net.samePlatform.get(p)?.get(j) ?? []) {
                if (b.proof.platformId !== place.id || (stepFreeOnly && b.proof.stepFree !== 'yes')) continue
                const list = nextShared.get(b) ?? []; nondominated(list, arrival); nextShared.set(b, list)
              }
              if (net.walking.has(place.id) && (pair || !targets.has(place.id) || targets.size > 1)) insert(datedChangesOnly && !dated ? exitOnly : alighted, arrival)
            }
            const alight = platforms?.alight.get(j)
            if (stepFreeOnly && alight && alight.stepFree !== 'yes') continue
            // A bound service call is a logical destination, not a second platform from which to change.
            if (!alight || targets.has(p.calls[j].id)) arrive(p.calls[j], alight)
            if (alight) arrive(alight.place, alight)
          }
        }
      }
      shared = nextShared
      ready = new Map()
      for (const labels of alighted.values()) for (const l of labels) afterWalk(l, ready)
      for (const labels of exitOnly.values()) for (const l of labels) afterWalk(l, ready, true)
      if (topologyOnly && complete.size) break
    }
    return complete
  }
}

/** A faster direct line or an unrelated shortcut may hide a valid change in
 * the public Pareto ranking. The reviewer asks a different, constrained
 * question using the same scanner, admitted service, doors, timing and margin. */
export function searchReviewedPair(net: Network, query: Query, pair: ReviewedPair, wayIds: readonly string[]): Outcome {
  const allowed = new Set(wayIds), walking = new Map<string, Footway[]>()
  for (const [id, edges] of net.walking) {
    const kept = edges.filter(w => allowed.has(w.id))
    if (kept.length) walking.set(id, kept)
  }
  return runSearch({ ...net, walking }, { ...query, maxChanges: 1 }, pair)
}
export function search(net: Network, query: Query): Outcome { return runSearch(net, query) }
function runSearch(net: Network, query: Query, pair?: ReviewedPair): Outcome {
  if (!validQuery(query)) return { ok: false, code: 'INVALID_QUERY', message: 'Date, heure de Dakar ou paramètres de trajet invalides.' }
  const origin = net.places.get(query.origin), dest = net.places.get(query.destination)
  if (!origin || !dest) return { ok: false, code: 'UNVERIFIED_ACCESS', message: 'Le départ ou la destination ne dispose pas d’un point de desserte ou d’accès vérifié. Aucun raccordement par proximité.' }
  if (origin.id === dest.id) return { ok: false, code: 'SAME_PLACE', message: 'Le départ et la destination sont identiques.' }
  const scan = scanner(net, origin, new Set([dest.id]), query, pair)
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
