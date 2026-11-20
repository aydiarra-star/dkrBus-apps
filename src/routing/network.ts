import { roadDistanceMeters } from '../domain/roadNetworkRouting'
import { isMobilityId } from '../domain/mobilityColors'
import { sliceVerifiedRouteSegment } from '../domain/routeGeometrySlice'
import { inDakar, reviewed, samePoint, shapeLength } from './geometry'
import type { Dataset, Footway, Network, ObservedPlatform, Pattern, PatternInput, Place, PlatformBinding, Section } from './model'
import { patternFromWays } from './vehicleGraph'
import { compileSamePlatformChanges } from './samePlatformChanges'
import { validService } from './serviceTime'

function duplicates(ids: readonly string[]) {
  const seen = new Set<string>(), repeated = new Set<string>()
  for (const id of ids) { if (seen.has(id)) repeated.add(id); seen.add(id) }
  return repeated
}
const accessibilityKnown = (s: string) => ['yes', 'no', 'unknown'].includes(s)
const canBoard = (s: Place | undefined): s is Place => s?.kind === 'platform' || s?.kind === 'call'

function compilePattern(p: PatternInput, places: ReadonlyMap<string, Place>, anchored?: readonly Section[]): Pattern | null {
  const mode = p.network === 'aftu_tata' ? p.busFamily : p.network
  if (!mode || (p.network === 'aftu_tata' ? !['aftu', 'tata'].includes(mode) : p.busFamily !== undefined)) return null
  const shape = p.shape
  const maxStep = p.network === 'ter' ? 2000 : 1000
  if (!p.lineId || !p.name || !p.direction || !isMobilityId(p.network) || !reviewed(p.evidence) ||
      shape?.verified !== true || !['OSM_ROUTE_RELATION', 'REVIEWED_OSM_WAYS', 'OPERATOR_ARCGIS', 'OPERATOR_GEOJSON', 'REVIEWED_GTFS_SHAPE'].includes(shape.source) || !shape.sourceId || shape.lineId !== p.lineId || shape.network !== p.network || shape.directionId !== p.direction ||
      !shapeLength(shape.positions, maxStep) || !validService(p.service) || !p.times.source || !accessibilityKnown(p.stepFree)) return null
  const calls = p.stops.map(id => places.get(id))
  if (calls.length < 2 || !calls.every(canBoard) || duplicates(p.stops).size) return null
  const sections: Section[] = []
  for (let i = 1; i < calls.length; i++) {
    // This projection is on the identified vehicle's OWN reviewed shape. It
    // neither snaps an entrance to a street nor creates a pedestrian edge.
    const sliced = anchored ? anchored[i - 1].positions : sliceVerifiedRouteSegment(shape, calls[i - 1], calls[i], 80)
    if (sliced && anchored && (roadDistanceMeters(calls[i - 1], sliced[0]) > 80 || roadDistanceMeters(calls[i], sliced.at(-1)!) > 80)) return null
    if (!sliced) return null
    const positions = sliced.filter((v, j) => !j || !samePoint(v, sliced[j - 1]))
    const meters = shapeLength(positions, maxStep)
    if (!meters || (i > 1 && !samePoint(sections[i - 2].positions.at(-1)!, positions[0]))) return null
    sections.push({ positions, meters })
  }
  let arrivals: readonly number[], departures: readonly number[]
  if (p.times.kind === 'offsets') {
    ;({ arrivals, departures } = p.times)
  } else {
    const { speedKph, dwellSeconds } = p.times
    if (!Number.isFinite(speedKph) || speedKph <= 0 || !Number.isSafeInteger(dwellSeconds) || dwellSeconds < 0) return null
    const a = [0], d = [0]
    for (const [i, section] of sections.entries()) {
      a.push(d[i] + Math.ceil(section.meters * 3.6 / speedKph))
      d.push(a[i + 1] + (i + 1 < sections.length ? dwellSeconds : 0))
    }
    arrivals = a; departures = d
  }
  if (arrivals.length !== calls.length || departures.length !== calls.length || arrivals[0] !== 0 || departures[0] !== 0 ||
    !arrivals.every((at, i) => Number.isSafeInteger(at) && Number.isSafeInteger(departures[i]) && departures[i] >= at && (!i || at > departures[i - 1]))) return null
  return { ...p, mode, calls, sections, arrivals, departures }
}

/** Build once per dataset, drop ambiguous IDs and reject an entire direction
 * if ANY call, section, time offset or source fails admission. */
export function buildNetwork(data: Dataset): Network {
  const rejected: string[] = []
  const places = new Map<string, Place>()
  const duplicatePlaces = duplicates(data.places.map(p => p.id))
  for (const p of data.places) {
    if (!p.id || !p.name || p.id.startsWith('landmark:bus-osm-') || !['call', 'platform', 'entrance', 'path'].includes(p.kind) || (p.id.startsWith('landmark:') && canBoard(p)) ||
        duplicatePlaces.has(p.id) || !reviewed(p.evidence) || !inDakar(p)) rejected.push(`place:${p.id}`)
    else places.set(p.id, p)
  }
  const patterns: Pattern[] = [], boarding = new Map<string, { pattern: Pattern; index: number }[]>()
  const patternKey = (p: Pick<PatternInput, 'network' | 'busFamily' | 'lineId' | 'direction'>) => JSON.stringify([p.busFamily ?? p.network, p.lineId, p.direction])
  const graphs = data.graphPatterns ?? []
  const duplicatePatterns = duplicates([...data.patterns, ...graphs].map(patternKey))
  const anchored = new Map<PatternInput, Section[]>()
  const normalized = graphs.flatMap(g => {
    const p = patternFromWays(g)
    if (p) { anchored.set(p.pattern, p.sections); return [p.pattern] }
    rejected.push(`vehicle-graph:${g.lineId}:${g.direction}`)
    return []
  })
  for (const p of [...data.patterns, ...normalized]) {
    const pattern = !duplicatePatterns.has(patternKey(p)) && compilePattern(p, places, anchored.get(p))
    if (!pattern) { rejected.push(`direction:${p.lineId}:${p.direction}`); continue }
    patterns.push(pattern)
    pattern.calls.slice(0, -1).forEach((place, index) => {
      const calls = boarding.get(place.id) ?? []; calls.push({ pattern, index }); boarding.set(place.id, calls)
    })
  }
  const platforms = new Map<Pattern, Record<'board' | 'alight', Map<number, ObservedPlatform>>>()
  const bindings = data.platformBindings ?? []
  const bindingKey = (b: PlatformBinding) => JSON.stringify([b.mode, b.lineId, b.direction, b.stopId, b.role])
  const ambiguous = duplicates(bindings.map(bindingKey))
  for (const b of bindings) {
    const pattern = patterns.find(p => p.mode === b.mode && p.lineId === b.lineId && p.direction === b.direction)
    const index = pattern?.stops.indexOf(b.stopId) ?? -1
    const platform = places.get(b.platformId)
    // The 80 m stop-to-shape guard is only a check on an explicit observation,
    // never the means by which the platform or the service call is chosen.
    const position = b.role === 'board' ? pattern?.sections[index]?.positions[0] : pattern?.sections[index - 1]?.positions.at(-1)
    if (!pattern || pattern.calls[index]?.kind !== 'call' || !position || platform?.kind !== 'platform' ||
        !['board', 'alight'].includes(b.role) || !reviewed(b.evidence) || !accessibilityKnown(b.stepFree) ||
        ambiguous.has(bindingKey(b)) || roadDistanceMeters(position, platform) > 80 || roadDistanceMeters(pattern.calls[index], platform) > 80) {
      rejected.push(`platform-binding:${bindingKey(b)}`); continue
    }
    const observed = platforms.get(pattern) ?? { board: new Map(), alight: new Map() }
    observed[b.role].set(index, { place: platform, stepFree: b.stepFree, evidence: b.evidence }); platforms.set(pattern, observed)
    if (b.role === 'board') {
      const entries = boarding.get(platform.id) ?? []; entries.push({ pattern, index }); boarding.set(platform.id, entries)
    }
  }
  const walking = new Map<string, Footway[]>()
  const duplicateWays = duplicates(data.footways.map(w => w.id))
  for (const w of data.footways) {
    const a = places.get(w.from), b = places.get(w.to)
    const meters = shapeLength(w.positions, 250), measured = w.transferTiming
    if (measured !== undefined && (!measured || measured.from !== w.from || measured.to !== w.to ||
        !Number.isSafeInteger(measured.seconds) || measured.seconds <= 0 || measured.seconds >= 86400 || !reviewed(measured.evidence))) {
      rejected.push(`footway-timing:${w.id}`); continue
    }
    // Match endpoints by explicit identity AND by the actual end vertices.
    // A station's service-call reference never doubles as a pedestrian access.
    if (!meters || !w.id || !w.name || duplicateWays.has(w.id) || w.from === w.to || !a || !b || a.kind === 'call' || b.kind === 'call' ||
        !samePoint(a, w.positions[0]) || !samePoint(b, w.positions.at(-1)!) || !reviewed(w.evidence) ||
        (w.onlyFor !== undefined && !['access','egress'].includes(w.onlyFor)) ||
        w.access !== 'public' || w.crossingsAndBarriersChecked !== true || !accessibilityKnown(w.stepFree) ||
        !['footway','sidewalk','crossing','steps','ramp','station-path'].includes(w.kind) || (w.kind === 'steps' && w.stepFree === 'yes')) {
      rejected.push(`footway:${w.id}`); continue
    }
    const bucket = walking.get(w.from) ?? []; bucket.push({ ...w, meters }); walking.set(w.from, bucket)
  }
  const samePlatform = compileSamePlatformChanges(patterns, platforms, data.samePlatformChanges ?? [], rejected)
  return { places, patterns, boarding, platforms, samePlatform, walking, rejected }
}
