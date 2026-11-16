import { describe, expect, it } from 'vitest'
import { dddArcgisFeatureStops, dddArcgisFeatureTracks } from './dddArcgisMapGeometry'

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


  it('extrait les arrêts ponctuels DDD avec leur ligne et ignore les points hors zone', () => {
    const stops = dddArcgisFeatureStops('8', [
      { geometry: { type: 'Point', coordinates: [-17.49, 14.74] } },
      { geometry: { type: 'Point', coordinates: [-3.7, 40.4] } },
      { geometry: { type: 'LineString', coordinates: [[-17.3, 14.7], [-17.2, 14.8]] } },
    ])
    expect(stops).toHaveLength(1)
    expect(stops[0].line).toBe('8')
    expect(stops[0].position).toEqual([14.74, -17.49])
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

import { dddArcgisFeatureStops } from './dddArcgisMapGeometry'

describe('points d’arrêt DDD ArcGIS', () => {
  it('convertit les points WGS84 en coordonnées Leaflet', () => {
    expect(dddArcgisFeatureStops('7', [
      { geometry: { type: 'Point', coordinates: [-17.45, 14.72] } },
    ])).toEqual([{
      id: 'ddd-arcgis-stop-7-14.72000--17.45000',
      line: '7',
      position: [14.72, -17.45],
    }])
  })

  it('ignore les géométries non ponctuelles et les points hors zone', () => {
    expect(dddArcgisFeatureStops('8', [
      { geometry: { type: 'LineString', coordinates: [[-17.4, 14.7], [-17.3, 14.8]] } },
      { geometry: { type: 'Point', coordinates: [-3.7, 40.4] } },
    ])).toHaveLength(0)
  })
})
