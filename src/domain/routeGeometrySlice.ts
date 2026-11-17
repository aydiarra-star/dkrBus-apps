import {
  measureVerifiedRouteSegment,
  projectStopToLine,
  type RoadPoint,
  type VerifiedLineGeometry,
} from './roadNetworkRouting'

/**
 * Returns only the measured portion of a verified directional route.
 * The returned coordinates follow the source geometry; no chord or reverse
 * direction is synthesized when snapping or direction validation fails.
 */
export function sliceVerifiedRouteSegment(
  route: VerifiedLineGeometry | null | undefined,
  from: RoadPoint,
  to: RoadPoint,
  maxStopOffsetM = 80,
): RoadPoint[] | null {
  if (!route || !measureVerifiedRouteSegment(route, from, to, maxStopOffsetM)) return null
  const start = projectStopToLine(from, route.positions)
  const end = projectStopToLine(to, route.positions)
  if (!start || !end || end.chainageM <= start.chainageM) return null

  const interpolate = (index: number, fraction: number): RoadPoint => {
    const a = route.positions[index]
    const b = route.positions[index + 1]
    return {
      lat: a.lat + (b.lat - a.lat) * fraction,
      lon: a.lon + (b.lon - a.lon) * fraction,
    }
  }

  const segment: RoadPoint[] = [interpolate(start.segmentIndex, start.fraction)]
  for (let index = start.segmentIndex + 1; index <= end.segmentIndex; index += 1) {
    const point = route.positions[index]
    if (point) segment.push({ lat: point.lat, lon: point.lon })
  }
  segment.push(interpolate(end.segmentIndex, end.fraction))
  return segment.length >= 2 ? segment : null
}
