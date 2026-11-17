import { describe, expect, it } from 'vitest'
import {
  measureVerifiedRouteSegment,
  shortestRoadGraphPath,
  type RoadGraphEdge,
  type VerifiedLineGeometry,
} from './roadNetworkRouting'

const route: VerifiedLineGeometry = {
  network: 'brt',
  lineId: 'B1',
  directionId: 'PETERSEN_GUEDIAWAYE',
  source: 'OSM_ROUTE_RELATION',
  sourceId: '19961937',
  verified: true,
  positions: [
    { lat: 14.6766, lon: -17.4406 },
    { lat: 14.6900, lon: -17.4300 },
    { lat: 14.7100, lon: -17.4200 },
  ],
}

describe('route-faithful road routing primitives', () => {
  it('measures a ride along the supplied line geometry, not the chord between stops', () => {
    const measured = measureVerifiedRouteSegment(
      route,
      { lat: 14.6766, lon: -17.4406 },
      { lat: 14.7100, lon: -17.4200 },
    )
    expect(measured).not.toBeNull()
    const straightChord = 4_000
    expect(measured!.distanceM).toBeGreaterThan(straightChord)
    expect(measured!.distanceM).toBeGreaterThan(0)
  })

  it('rejects a stop that does not snap to the verified route', () => {
    const measured = measureVerifiedRouteSegment(
      route,
      { lat: 14.6766, lon: -17.4406 },
      { lat: 14.7100, lon: -17.3000 },
    )
    expect(measured).toBeNull()
  })

  it('does not silently reverse a route when the requested stops are in reverse order', () => {
    const measured = measureVerifiedRouteSegment(
      route,
      { lat: 14.7100, lon: -17.4200 },
      { lat: 14.6766, lon: -17.4406 },
    )
    expect(measured).toBeNull()
  })

  it('fails closed when route geometry is missing or not verified', () => {
    expect(measureVerifiedRouteSegment(null, route.positions[0], route.positions[2])).toBeNull()
    expect(measureVerifiedRouteSegment(
      { ...route, verified: false } as unknown as VerifiedLineGeometry,
      route.positions[0],
      route.positions[2],
    )).toBeNull()
  })

  it('finds a connected pedestrian path and never uses a bus-only edge for walking', () => {
    const edges: RoadGraphEdge[] = [
      { from: 'A', to: 'B', meters: 120, mode: 'walk', positions: [{ lat: 14.7, lon: -17.4 }, { lat: 14.701, lon: -17.4 }] },
      { from: 'B', to: 'C', meters: 180, mode: 'walk', positions: [{ lat: 14.701, lon: -17.4 }, { lat: 14.702, lon: -17.4 }] },
      { from: 'A', to: 'C', meters: 40, mode: 'bus', positions: [{ lat: 14.7, lon: -17.4 }, { lat: 14.702, lon: -17.4 }] },
    ]
    const path = shortestRoadGraphPath(edges, 'A', 'C', 'walk')
    expect(path?.distanceM).toBe(300)
    expect(path?.edges.map((edge) => edge.mode)).toEqual(['walk', 'walk'])
  })

  it('returns no path instead of drawing a connector across disconnected roads', () => {
    const edges: RoadGraphEdge[] = [
      { from: 'A', to: 'B', meters: 120, mode: 'walk', positions: [{ lat: 14.7, lon: -17.4 }, { lat: 14.701, lon: -17.4 }] },
      { from: 'C', to: 'D', meters: 180, mode: 'walk', positions: [{ lat: 14.702, lon: -17.4 }, { lat: 14.703, lon: -17.4 }] },
    ]
    expect(shortestRoadGraphPath(edges, 'A', 'D', 'walk')).toBeNull()
  })
})
