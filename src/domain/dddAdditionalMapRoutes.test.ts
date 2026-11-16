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


  it('ajoute le corridor DDD 227 avec les pôles GPS Keur Massar et Parcelles', () => {
    const route = DDD_ADDITIONAL_MAP_ROUTES.find((entry) => entry.id === 'ddd-227')
    expect(route?.line).toBe('227')
    expect(route?.waypoints).toEqual([
      { name: 'Terminus Keur Massar', lat: 14.78542, lon: -17.30922 },
      { name: 'Route de Malika', lat: 14.793653, lon: -17.336456 },
      { name: 'Terminus Guédiawaye', lat: 14.77277, lon: -17.38922 },
      { name: 'Case Ba', lat: 14.756216, lon: -17.42975 },
      { name: 'Terminus Parcelles Assainies', lat: 14.76043, lon: -17.439267 },
    ])
  })
