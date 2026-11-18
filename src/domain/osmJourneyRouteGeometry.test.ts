import { describe, expect, it } from 'vitest'
import {
  buildOsmRouteSearchUrl,
  findOrderedOsmRouteStops,
  isMatchingAftuTataRoute,
  osmRouteSegmentToLeafletPositions,
} from './osmJourneyRouteGeometry'

describe('géométrie des tronçons AFTU/TATA issus des relations OSM', () => {
  it('borne la recherche des relations bus à Dakar et utilise le numéro exact', () => {
    const url = new URL(buildOsmRouteSearchUrl('40'))
    expect(url.searchParams.get('q')).toBe('40')
    expect(url.searchParams.get('mode')).toBe('bus')
    expect(url.searchParams.get('south')).toBe('14.55')
    expect(url.searchParams.get('north')).toBe('14.88')
  })

  it('refuse les relations sans attribution AFTU/TATA explicite ou sans référence exacte', () => {
    expect(isMatchingAftuTataRoute({
      id: 1, type: 'route', route: 'bus', ref: '40', network: 'AFTU',
    }, '40')).toBe(true)
    expect(isMatchingAftuTataRoute({
      id: 2, type: 'route', route: 'bus', ref: '40', network: 'DDD',
    }, '40')).toBe(false)
    expect(isMatchingAftuTataRoute({
      id: 3, type: 'route', route: 'bus', ref: '041', network: 'AFTU',
    }, '40')).toBe(false)
    expect(isMatchingAftuTataRoute({
      id: 4, type: 'route_master', route: 'bus', ref: '40', network: 'AFTU',
    }, '40')).toBe(false)
  })

  it('retient les arrêts nommés uniquement dans le sens demandé', () => {
    const stops = [{ name: 'Jaxaay' }, { name: 'Pikine' }, { name: 'Petersen' }]
    expect(findOrderedOsmRouteStops(stops, ['jaxaay'], ['petersen'])).toEqual({
      from: 'Jaxaay', to: 'Petersen',
    })
    expect(findOrderedOsmRouteStops(stops, ['petersen'], ['jaxaay'])).toBeNull()
  })

  it('normalise les accents mais ne remplace pas les noms par une proximité GPS', () => {
    expect(findOrderedOsmRouteStops(
      [{ name: 'Gare de Petersen' }, { name: 'Guédiawaye' }],
      ['gare de petersen'],
      ['guediawaye'],
    )).toEqual({ from: 'Gare de Petersen', to: 'Guédiawaye' })
    expect(findOrderedOsmRouteStops([{ name: 'Petersen' }], ['Petersen'], ['Colobane'])).toBeNull()
  })

  it('convertit une LineString GeoJSON en coordonnées Leaflet et rejette les points hors région', () => {
    expect(osmRouteSegmentToLeafletPositions({
      features: [{ geometry: { type: 'LineString', coordinates: [
        [-17.44, 14.67], [-17.43, 14.68], [0, 0],
      ] } }],
    })).toEqual([[14.67, -17.44], [14.68, -17.43]])
  })

  it('ne fabrique pas de tracé depuis des géométries absentes ou des points invalides', () => {
    expect(osmRouteSegmentToLeafletPositions({ features: [] })).toEqual([])
    expect(osmRouteSegmentToLeafletPositions({
      features: [{ geometry: { type: 'LineString', coordinates: [[0, 0]] } }],
    })).toEqual([])
  })
})
