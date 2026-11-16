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


  it('positionne le terminus AFTU 60 sur le pôle partagé de Keur Massar', () => {
    const route = AFTU_TATA_MAP_ROUTES.find((entry) => entry.id === 'aftu-60')
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


it('utilise les numéros du catalogue AFTU courant pour les corridors vérifiés', () => {
  const byId = Object.fromEntries(AFTU_TATA_MAP_ROUTES.map((route) => [route.id, route]))
  expect(byId['aftu-59']?.line).toBe('59')
  expect(byId['aftu-60']?.line).toBe('60')
  expect(byId['aftu-66']?.line).toBe('66')
  expect(byId['aftu-73']?.line).toBe('73')
  expect(byId['aftu-78']?.line).toBe('78')
  expect(byId['aftu-59']?.waypoints.map((point) => point.name)).toContain('Bargny')
  expect(byId['aftu-73']?.waypoints.map((point) => point.name)).toContain('Tivaouane Peulh')
  expect(byId['aftu-78']?.waypoints.map((point) => point.name)).toContain('Sangalkam')
  expect(byId['aftu-59']?.waypoints.at(-1)).toMatchObject({ name: 'Bargny', lat: 14.69798, lon: -17.22923 })
  expect(byId['aftu-73']?.waypoints[0]).toMatchObject({ name: 'Bargny', lat: 14.69798, lon: -17.22923 })
  expect(byId['aftu-73']?.waypoints[1]).toMatchObject({ name: 'Arrêt Khaar (repère Rufisque)', lat: 14.72029, lon: -17.26547 })
  expect(byId['aftu-73']?.waypoints.at(-1)).toMatchObject({ name: 'Tivaouane Peulh', lat: 14.81072, lon: -17.26086 })
})
