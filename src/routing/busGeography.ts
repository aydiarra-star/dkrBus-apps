import { BUS_SECTION_MARKERS, BUS_SECTION_REVIEWS, type SectionReview } from '../data/busSectionReview'
import { BUS_SECTION_WAYS, type BusWay, type OsmVertex } from '../data/busSectionWays'
import { roadDistanceMeters, type RoadPoint, type VerifiedLineGeometry } from '../domain/roadNetworkRouting'
import { sliceVerifiedRouteSegment } from '../domain/routeGeometrySlice'
import { concatenate, inDakar, samePoint, shapeLength } from './geometry'
import type { Section } from './model'
import type { DakarEndpoint, JourneySettings } from './placeConnections'

// This layer has no calendar, passenger graph edges, station bindings, arrival
// times or path finding. In particular two reviews of the SAME line do not join.
export interface BusMapMarker extends RoadPoint { id: string; name: string }
export interface BusScope { review: SectionReview; markers: BusMapMarker[]; parts: Section[] }
export interface BusMapSection extends Section {
  id: string; review: SectionReview; markers: BusMapMarker[]
  /** Null = exact explicit selection; even zero metres of proximity is not access. */
  fromGapM: number | null; toGapM: number | null
}
// Longest consecutive pair of source vertices in the reviewed extracts: 275.8 m.
const maxSourceStepM = 300
const namespace = 'landmark:bus-osm-'
const point = ([, lat, lon]: OsmVertex): RoadPoint => ({ lat, lon })

export function compileBusScope(review: SectionReview, ways: Readonly<Record<number, BusWay>> = BUS_SECTION_WAYS): BusScope | null {
  if (review.ways.length === 0 || review.markers.length < 2 || new Set(review.markers).size !== review.markers.length) return null
  const vertices: OsmVertex[] = []
  for (const signed of review.ways) {
    const w = ways[Math.abs(signed)]
    if (!w || w.vertices.length < 2 || (signed < 0 && w.oneWay)) return null
    const ordered = signed > 0 ? w.vertices : [...w.vertices].reverse()
    const prev = vertices.at(-1), first = ordered[0]
    if (prev && (prev[0] !== first[0] || prev[1] !== first[1] || prev[2] !== first[2])) return null
    vertices.push(...(prev ? ordered.slice(1) : ordered))
  }
  // These specific reviewed sections are simple paths, not folded loops.
  if (new Set(vertices.map(v => v[0])).size !== vertices.length) return null
  const positions = vertices.map(point)
  if (!shapeLength(positions, maxSourceStepM)) return null
  const shape: VerifiedLineGeometry | undefined = review.relation ? { network: review.family === 'ddd' ? 'ddd' : 'aftu_tata', lineId: review.line,
    directionId: review.id, source: 'OSM_ROUTE_RELATION', sourceId: `${review.relation}/v${review.version}`, verified: true, positions } : undefined
  // A road named by the operator isn't an OSM bus relation. For that case
  // slice only at literal, reviewed road nodes, never project a bus platform.
  let lastIndex = -1
  const markers: BusMapMarker[] = [], parts: Section[] = []
  for (const node of review.markers) {
    const m = BUS_SECTION_MARKERS[node]
    if (!m) return null
    const marker = { id: namespace + node, name: m[3], lat: m[1], lon: m[2] }
    if (!inDakar(marker)) return null
    const i = vertices.findIndex(v => v[0] === node && samePoint(point(v), marker))
    const road = review.landmarkKind === 'road-limit'
    if (road && i <= lastIndex) return null
    const previous = markers.at(-1)
    if (previous) {
      const span = road ? positions.slice(lastIndex, i + 1) : sliceVerifiedRouteSegment(shape, previous, marker, 20)
      const meters = span && shapeLength(span, maxSourceStepM)
      if (!span || !meters) return null // includes reversed order and offsets
      parts.push({ positions: span, meters })
    }
    lastIndex = i
    markers.push(marker)
  }
  return { review, markers, parts }
}
export const busScopes = BUS_SECTION_REVIEWS.flatMap(r => compileBusScope(r) ?? [])
const index = new Map<string, { marker: BusMapMarker; lines: Set<string>; roadLimit: boolean }>()
for (const s of busScopes) for (const marker of s.markers) {
  const entry = index.get(marker.id) ?? { marker, lines: new Set(), roadLimit: s.review.landmarkKind === 'road-limit' }
  entry.lines.add(`${s.review.family.toUpperCase()} ${s.review.line}`)
  index.set(marker.id, entry)
}
export const busMapPoints = Array.from(index.values())

export function findBusMapSections(from: DakarEndpoint, to: DakarEndpoint, settings: JourneySettings): BusMapSection[] {
  if (settings.stepFreeOnly || !inDakar({ lat: from.lat, lon: from.lng }) || !inDakar({ lat: to.lat, lon: to.lng })) return []
  const radius = Math.min(350, settings.maxWalkPerLegM ?? 350) // discovery only; never metres walked
  const eligible = (p: DakarEndpoint, marker: BusMapMarker): number | null | undefined => {
    if (p.snapshotId || p.kind === 'stop' || (p.stopId && p.landmarkId)) return undefined
    if (p.landmarkId?.startsWith(namespace)) return p.landmarkId === marker.id && p.lat === marker.lat && p.lng === marker.lon ? null : undefined
    // Nearby map pins/places can discover a map fragment, not acquire the ID
    // of its first/last platform. Do not substitute for an explicitly chosen stop.
    if (p.stopId) return undefined
    const gap = roadDistanceMeters({ lat: p.lat, lon: p.lng }, marker)
    return gap <= radius ? gap : undefined
  }
  const results: BusMapSection[] = []
  const score = (a: BusMapSection) => (a.fromGapM ?? 0) + (a.toGapM ?? 0)
  for (const { review, markers, parts } of busScopes) {
    if (settings.modes && !settings.modes.includes(review.family) && !(review.family !== 'ddd' && settings.modes.includes('aftu_tata'))) continue
    let best: BusMapSection | undefined
    for (let i = 0; i < markers.length - 1; i++) {
      const fromGapM = eligible(from, markers[i]); if (fromGapM === undefined) continue
      for (let j = i + 1; j < markers.length; j++) {
        const toGapM = eligible(to, markers[j]); if (toGapM === undefined) continue
        if (best && (fromGapM ?? 0) + (toGapM ?? 0) >= score(best)) continue
        const span = parts.slice(i, j)
        best = { id: `${review.id}/${i}/${j}`, review, markers: markers.slice(i, j + 1), positions: concatenate(span),
          meters: span.reduce((n, p) => n + p.meters, 0), fromGapM, toGapM }
      }
    }
    if (best) results.push(best)
  }
  return results.sort((a, b) => score(a) - score(b) || a.id.localeCompare(b.id))
}
