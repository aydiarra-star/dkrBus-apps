import { describe, expect, it } from 'vitest'
import { sliceVerifiedRouteSegment } from './routeGeometrySlice'
import type { VerifiedLineGeometry } from './roadNetworkRouting'

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

describe('sliceVerifiedRouteSegment', () => {
  it('returns the actual intermediate vertices between two snapped stops', () => {
    const segment = sliceVerifiedRouteSegment(
      route,
      { lat: 14.6766, lon: -17.4406 },
      { lat: 14.7100, lon: -17.4200 },
    )
    expect(segment).toEqual(route.positions)
  })

  it('returns only the requested sub-section, not the full corridor', () => {
    const segment = sliceVerifiedRouteSegment(
      route,
      { lat: 14.6833, lon: -17.4353 },
      { lat: 14.7000, lon: -17.4250 },
    )
    expect(segment).not.toBeNull()
    expect(segment!.length).toBe(2)
    expect(segment![0]).not.toEqual(route.positions[0])
    expect(segment![1]).not.toEqual(route.positions[2])
  })

  it('fails closed for reversed, unverified, or distant stop pairs', () => {
    expect(sliceVerifiedRouteSegment(route, route.positions[2], route.positions[0])).toBeNull()
    expect(sliceVerifiedRouteSegment({ ...route, verified: false }, route.positions[0], route.positions[2])).toBeNull()
    expect(sliceVerifiedRouteSegment(route, route.positions[0], { lat: 14.71, lon: -17.3 })).toBeNull()
  })
})
