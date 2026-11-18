import { afterEach, describe, expect, it, vi } from 'vitest'
import { CORRIDOR_LINES } from './corridors'
import type { PlannerLeg } from './planner'
import {
  buildOsmRouteSearchUrl,
  findOrderedOsmRouteStops,
  isMatchingAftuTataRoute,
  loadOsmJourneyRouteSegments,
  osmRouteSegmentToLeafletPositions,
} from './osmJourneyRouteGeometry'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('géométrie des tronçons AFTU/TATA issus des relations OSM', () => {
  it('borne la recherche des relations bus à Dakar et utilise le numéro exact', () => {
    const url = new URL(buildOsmRouteSearchUrl('40'))
    expect(url.searchParams.get('q')).toBe('40')
    expect(url.searchParams.get('mode')).toBe('bus')
    expect(url.searchParams.get('south')).toBe('14.55')
    expect(url.searchParams.get('north')).toBe('14.88')
    expect(new URL(buildOsmRouteSearchUrl('AFTU 1')).searchParams.get('q')).toBe('AFTU 1')
  })

  it('refuse les relations sans attribution AFTU/TATA explicite ou sans référence exacte', () => {
    expect(isMatchingAftuTataRoute({
      id: 1, type: 'route', route: 'bus', ref: '40', network: 'AFTU',
    }, '40')).toBe(true)
    expect(isMatchingAftuTataRoute({
      id: 6, type: 'route', route: 'bus', ref: 'AFTU 40', network: 'AFTU',
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
    expect(isMatchingAftuTataRoute({
      id: 5, type: 'route', route: 'bus', ref: '79', operator: 'AFTU Sénégal',
    })).toBe(true)
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

  it('convertit une LineString GeoJSON en coordonnées Leaflet', () => {
    expect(osmRouteSegmentToLeafletPositions({
      features: [{ geometry: { type: 'LineString', coordinates: [
        [-17.44, 14.67], [-17.43, 14.68],
      ] } }],
    })).toEqual([[14.67, -17.44], [14.68, -17.43]])
  })

  it('rejette toute géométrie contenant un point hors région au lieu de relier les deux côtés', () => {
    expect(osmRouteSegmentToLeafletPositions({
      features: [{ geometry: { type: 'LineString', coordinates: [
        [-17.44, 14.67], [0, 0], [-17.43, 14.68],
      ] } }],
    })).toEqual([])
  })

  it('charge et découpe la relation OSM attribuée à la ligne AFTU et aux deux arrêts demandés', async () => {
    const line = CORRIDOR_LINES.find((candidate) => candidate.shortName === 'AFTU 1')
    if (!line) throw new Error('ligne AFTU 1 de référence manquante')
    const leg: PlannerLeg = {
      kind: 'ride',
      line,
      fromId: 'aftu-lat-dior',
      toId: 'aftu-petersen',
      minutes: 10,
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [{ id: 123, type: 'route', route: 'bus', ref: '1', network: 'AFTU' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stops: [{ name: 'Lat Dior' }, { name: 'Petersen' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ features: [{ geometry: { type: 'LineString', coordinates: [
          [-17.44, 14.69], [-17.4406354, 14.6766438],
        ] } }] }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const segments = await loadOsmJourneyRouteSegments([leg], new AbortController().signal)
    expect(segments).toHaveLength(1)
    expect(segments[0]).toMatchObject({ network: 'aftu_tata', line: '1', id: 'osm-123-0' })
    expect(segments[0]?.positions).toEqual([[14.69, -17.44], [14.6766438, -17.4406354]])
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('n\'affiche aucun segment si la relation trouvée ne dessert pas les arrêts dans le sens choisi', async () => {
    const line = CORRIDOR_LINES.find((candidate) => candidate.shortName === 'AFTU 1')
    if (!line) throw new Error('ligne AFTU 1 de référence manquante')
    const leg: PlannerLeg = {
      kind: 'ride',
      line,
      fromId: 'aftu-lat-dior',
      toId: 'aftu-petersen',
      minutes: 10,
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [{ id: 124, type: 'route', route: 'bus', ref: '1', network: 'AFTU' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stops: [{ name: 'Petersen' }, { name: 'Lat Dior' }] }),
      })
    vi.stubGlobal('fetch', fetchMock)

    expect(await loadOsmJourneyRouteSegments([leg], new AbortController().signal)).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('ne fabrique pas de tracé depuis des géométries absentes ou des points invalides', () => {
    expect(osmRouteSegmentToLeafletPositions({ features: [] })).toEqual([])
    expect(osmRouteSegmentToLeafletPositions({
      features: [{ geometry: { type: 'LineString', coordinates: [[0, 0]] } }],
    })).toEqual([])
  })
})
