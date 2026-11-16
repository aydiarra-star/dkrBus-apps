import { describe, expect, it } from 'vitest'
import { dddArcgisFeatureTracks } from './dddArcgisMapGeometry'

describe('géométries cartographiques DDD ArcGIS', () => {
  it('convertit les coordonnées GeoJSON longitude/latitude en latitude/longitude Leaflet', () => {
    const tracks = dddArcgisFeatureTracks('227', [{
      geometry: { type: 'LineString', coordinates: [[-17.31, 14.78], [-17.30, 14.79]] },
    }])
    expect(tracks).toHaveLength(1)
    expect(tracks[0].positions).toEqual([[14.78, -17.31], [14.79, -17.30]])
  })

  it('préserve les parties séparées d’une géométrie MultiLineString', () => {
    const tracks = dddArcgisFeatureTracks('16A', [{
      geometry: { type: 'MultiLineString', coordinates: [
        [[-17.34, 14.79], [-17.33, 14.79]],
        [[-17.32, 14.78], [-17.31, 14.78]],
      ] },
    }])
    expect(tracks).toHaveLength(2)
    expect(tracks[0].id).not.toBe(tracks[1].id)
  })

  it('ignore les géométries invalides, hors Sénégal ou trop courtes', () => {
    const tracks = dddArcgisFeatureTracks('228', [
      { geometry: { type: 'LineString', coordinates: [[-17.2, 14.6]] } },
      { geometry: { type: 'LineString', coordinates: [[-3.7, 40.4], [-3.6, 40.5]] } },
      { geometry: { type: 'Polygon', coordinates: [] } },
    ])
    expect(tracks).toHaveLength(0)
  })
})
