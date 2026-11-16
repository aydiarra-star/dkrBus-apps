import { describe, expect, it } from 'vitest'
import { DAKAR_REGION_BOUNDS } from './corridors'
import { DDD_ADDITIONAL_MAP_ROUTES } from '../data/dddAdditionalMapRoutes'

describe('corridors DDD complémentaires de la carte', () => {
  it('couvre Bayakh, Sangalkam, Guédiawaye et Rufisque', () => {
    const names = new Set(DDD_ADDITIONAL_MAP_ROUTES.flatMap((route) => route.waypoints.map((point) => point.name)))
    for (const name of ['Bayakh', 'Gorom 1', 'Gorom 2', 'Bambilor', 'Noflaye', 'Sangalkam', 'Keur Ndiaye Lo', 'Rufisque', 'Keur Massar', 'Malika', 'Carrefour Marché Boubess', 'Guédiawaye']) {
      expect(names.has(name)).toBe(true)
    }
  })

  it('conserve des waypoints ordonnés dans le périmètre de la carte', () => {
    for (const route of DDD_ADDITIONAL_MAP_ROUTES) {
      expect(route.waypoints.length).toBeGreaterThanOrEqual(2)
      for (const point of route.waypoints) {
        expect(point.lat).toBeGreaterThanOrEqual(DAKAR_REGION_BOUNDS.minLat)
        expect(point.lat).toBeLessThanOrEqual(DAKAR_REGION_BOUNDS.maxLat)
        expect(point.lon).toBeGreaterThanOrEqual(DAKAR_REGION_BOUNDS.minLon)
        expect(point.lon).toBeLessThanOrEqual(DAKAR_REGION_BOUNDS.maxLon)
      }
    }
  })
})
