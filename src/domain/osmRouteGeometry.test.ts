import { describe, expect, it } from 'vitest'
import { osmRouteWayMembersToTracks } from './osmRouteGeometry'

describe('géométrie de relation OSM AFTU/TATA', () => {
  it('convertit les ways de la relation en segments cartographiques', () => {
    const tracks = osmRouteWayMembersToTracks(3982642, '40', [
      { type: 'way', id: 12, geometry: [{ lat: 14.7, lon: -17.4 }, { lat: 14.71, lon: -17.39 }] },
      { type: 'way', id: 13, geometry: [{ lat: 14.72, lon: -17.38 }, { lat: 14.73, lon: -17.37 }] },
    ])
    expect(tracks).toHaveLength(2)
    expect(tracks[0].id).toBe('osm-route-3982642-12')
    expect(tracks[0].positions[0]).toEqual([14.7, -17.4])
  })

  it('ignore les ways hors zone et les géométries trop courtes', () => {
    const tracks = osmRouteWayMembersToTracks(3982642, '40', [
      { type: 'way', id: 1, geometry: [{ lat: 40.7, lon: -74.0 }, { lat: 40.8, lon: -73.9 }] },
      { type: 'way', id: 2, geometry: [{ lat: 14.7, lon: -17.4 }] },
      { type: 'node', id: 3, geometry: [{ lat: 14.7, lon: -17.4 }, { lat: 14.71, lon: -17.39 }] },
    ])
    expect(tracks).toHaveLength(0)
  })
})
