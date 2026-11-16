import { describe, expect, it } from 'vitest'
import { DAKAR_REGION_BOUNDS } from './corridors'
import { AFTU_TATA_MAP_ROUTES } from '../data/aftuTataMapRoutes'

describe('corridors cartographiques AFTU/TATA', () => {
  it('conserve des points ordonnés et géolocalisés dans l’agglomération élargie', () => {
    for (const route of AFTU_TATA_MAP_ROUTES) {
      expect(route.waypoints.length).toBeGreaterThanOrEqual(2)
      for (const point of route.waypoints) {
        expect(point.lat).toBeGreaterThanOrEqual(DAKAR_REGION_BOUNDS.minLat)
        expect(point.lat).toBeLessThanOrEqual(DAKAR_REGION_BOUNDS.maxLat)
        expect(point.lon).toBeGreaterThanOrEqual(DAKAR_REGION_BOUNDS.minLon)
        expect(point.lon).toBeLessThanOrEqual(DAKAR_REGION_BOUNDS.maxLon)
      }
    }
  })

  it('couvre les pôles et secteurs périphériques des lignes AFTU publiées', () => {
    const allNames = new Set(AFTU_TATA_MAP_ROUTES.flatMap((route) => route.waypoints.map((point) => point.name)))
    for (const name of ['Sangalkam', 'Bargny', 'Rufisque', 'Keur Massar', 'Malika', 'Tivaouane Peulh', 'Mermoz', 'Ngor', 'Ouakam', 'Cité Avion', 'Carrefour Grand Mbao', 'Thiaroy', 'Rond-point Ngor', 'Bambilor', 'Boune', 'Marché de Niague']) {
      expect(allNames.has(name)).toBe(true)
    }
  })

  it('ne crée aucune ligne sans identifiant unique ni code de ligne', () => {
    expect(new Set(AFTU_TATA_MAP_ROUTES.map((route) => route.id)).size).toBe(AFTU_TATA_MAP_ROUTES.length)
    expect(AFTU_TATA_MAP_ROUTES.every((route) => route.id && route.line)).toBe(true)
  })
})


  it('positionne le terminus AFTU 61 sur le pôle partagé de Keur Massar', () => {
    const route = AFTU_TATA_MAP_ROUTES.find((entry) => entry.id === 'aftu-61')
    expect(route?.waypoints[0]).toMatchObject({ name: 'Keur Massar', lat: 14.78542, lon: -17.30922 })
    expect(route?.waypoints[4]).toMatchObject({ name: 'Almadies', lat: 14.73475, lon: -17.50863 })
    expect(route?.waypoints.map((point) => point.name)).toEqual([
      'Keur Massar',
      'Carrefour Grand Mbao',
      'Thiaroy',
      'Rond-point Ngor',
      'Almadies',
    ])
  })
