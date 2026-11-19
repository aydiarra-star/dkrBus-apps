/**
 * Primitives for route-faithful multimodal routing.
 *
 * A route shape is usable only when it belongs to one identified line,
 * one explicit direction and a trace source that has passed source review.
 * This module deliberately does not synthesize geometry from stop centroids.
 */
export interface RoadPoint {
  lat: number
  lon: number
}

export type RouteGeometrySource = 'OSM_ROUTE_RELATION' | 'OPERATOR_ARCGIS' | 'OPERATOR_GEOJSON' | 'REVIEWED_GTFS_SHAPE'

export interface VerifiedLineGeometry {
  network: 'ter' | 'brt' | 'ddd' | 'aftu_tata'
  lineId: string
  directionId: string
  source: RouteGeometrySource
  sourceId: string
  verified: true
  positions: readonly RoadPoint[]
}

export interface RouteProjection {
  chainageM: number
  offsetM: number
  segmentIndex: number
  fraction: number
}

export interface RouteSegmentMeasure {
  distanceM: number
  from: RouteProjection
  to: RouteProjection
}

/** Great-circle distance for short road/rail geometry segments. */
export function roadDistanceMeters(a: RoadPoint, b: RoadPoint): number {
  const radians = Math.PI / 180
  const dLat = (b.lat - a.lat) * radians
  const dLon = (b.lon - a.lon) * radians
  const lat1 = a.lat * radians
  const lat2 = b.lat * radians
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
}

/** Local metric projection used only to snap a stop to a nearby route segment. */
function localXY(point: RoadPoint, referenceLat: number): [number, number] {
  const radians = Math.PI / 180
  return [
    point.lon * radians * 6_371_000 * Math.cos(referenceLat * radians),
    point.lat * radians * 6_371_000,
  ]
}

/**
 * Project a stop onto the actual route shape. The returned chainage follows
 * the stored direction; this function never reverses a line automatically.
 */
export function projectStopToLine(
  point: RoadPoint,
  positions: readonly RoadPoint[],
): RouteProjection | null {
  if (positions.length < 2) return null
  let chainage = 0
  let best: RouteProjection | null = null
  for (let index = 0; index < positions.length - 1; index += 1) {
    const a = positions[index]
    const b = positions[index + 1]
    const segmentLength = roadDistanceMeters(a, b)
    if (!Number.isFinite(segmentLength) || segmentLength <= 0) continue
    const referenceLat = (a.lat + b.lat + point.lat) / 3
    const [ax, ay] = localXY(a, referenceLat)
    const [bx, by] = localXY(b, referenceLat)
    const [px, py] = localXY(point, referenceLat)
    const dx = bx - ax
    const dy = by - ay
    const denominator = dx * dx + dy * dy
    const fraction = denominator > 0
      ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / denominator))
      : 0
    const snapped: RoadPoint = {
      lat: a.lat + (b.lat - a.lat) * fraction,
      lon: a.lon + (b.lon - a.lon) * fraction,
    }
    const offsetM = roadDistanceMeters(point, snapped)
    const candidate = {
      chainageM: chainage + segmentLength * fraction,
      offsetM,
      segmentIndex: index,
      fraction,
    }
    if (!best || candidate.offsetM < best.offsetM) best = candidate
    chainage += segmentLength
  }
  return best
}

/**
 * Measure a ride only along the supplied verified direction geometry.
 * Stops too far from the line, reversed stop order, missing shapes and
 * unverified sources all fail closed instead of falling back to straight lines.
 */
export function measureVerifiedRouteSegment(
  route: VerifiedLineGeometry | null | undefined,
  from: RoadPoint,
  to: RoadPoint,
  maxStopOffsetM = 80,
): RouteSegmentMeasure | null {
  if (!route || route.verified !== true || !route.sourceId || !route.directionId) return null
  if (route.positions.length < 2) return null
  const fromProjection = projectStopToLine(from, route.positions)
  const toProjection = projectStopToLine(to, route.positions)
  if (!fromProjection || !toProjection) return null
  if (fromProjection.offsetM > maxStopOffsetM || toProjection.offsetM > maxStopOffsetM) return null
  if (toProjection.chainageM <= fromProjection.chainageM) return null
  return {
    distanceM: toProjection.chainageM - fromProjection.chainageM,
    from: fromProjection,
    to: toProjection,
  }
}

export interface RoadGraphEdge {
  from: string
  to: string
  meters: number
  mode: 'walk' | 'bus' | 'rail'
  /** The real OSM/agency way geometry for this edge, not a straight connector. */
  positions: readonly RoadPoint[]
}

export interface RoadGraphPath {
  distanceM: number
  edges: readonly RoadGraphEdge[]
}

/** Dijkstra over an extracted, mode-filtered road/rail graph. No coordinate fallback. */
export function shortestRoadGraphPath(
  edges: readonly RoadGraphEdge[],
  startNode: string,
  endNode: string,
  mode: RoadGraphEdge['mode'],
): RoadGraphPath | null {
  if (startNode === endNode) return { distanceM: 0, edges: [] }
  const adjacency = new Map<string, RoadGraphEdge[]>()
  for (const edge of edges) {
    if (edge.mode !== mode || !Number.isFinite(edge.meters) || edge.meters <= 0 || edge.positions.length < 2) continue
    const bucket = adjacency.get(edge.from) ?? []
    bucket.push(edge)
    adjacency.set(edge.from, bucket)
  }
  const distances = new Map<string, number>([[startNode, 0]])
  const previous = new Map<string, RoadGraphEdge>()
  const pending = new Set<string>([startNode])
  while (pending.size) {
    let current: string | null = null
    let best = Number.POSITIVE_INFINITY
    for (const node of pending) {
      const distance = distances.get(node) ?? Number.POSITIVE_INFINITY
      if (distance < best) { best = distance; current = node }
    }
    if (current === null || !Number.isFinite(best)) break
    pending.delete(current)
    if (current === endNode) break
    for (const edge of adjacency.get(current) ?? []) {
      const candidate = best + edge.meters
      if (candidate < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, candidate)
        previous.set(edge.to, edge)
        pending.add(edge.to)
      }
    }
  }
  const distanceM = distances.get(endNode)
  if (distanceM === undefined) return null
  const path: RoadGraphEdge[] = []
  let cursor = endNode
  while (cursor !== startNode) {
    const edge = previous.get(cursor)
    if (!edge) return null
    path.unshift(edge)
    cursor = edge.from
  }
  return { distanceM, edges: path }
}
