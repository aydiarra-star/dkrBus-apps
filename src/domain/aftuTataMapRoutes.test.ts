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
    for (const name of ['Sangalkam', 'Bargny', 'Rufisque / Thiawlène', 'Keur Massar', 'Malika', 'Tivaouane Peulh', 'Mermoz', 'Rond-point Ngor', 'Ouakam', 'Cité Avion', 'Yoff', 'Bambilor', 'Boune', 'Marché de Niague']) {
      expect(allNames.has(name)).toBe(true)
    }
  })

  it('ne crée aucune ligne sans identifiant unique ni code de ligne', () => {
    expect(new Set(AFTU_TATA_MAP_ROUTES.map((route) => route.id)).size).toBe(AFTU_TATA_MAP_ROUTES.length)
    expect(AFTU_TATA_MAP_ROUTES.every((route) => route.id && route.line)).toBe(true)
  })
})

it('utilise les numéros du catalogue AFTU courant et les GPS des pôles audités', () => {
  const byId = Object.fromEntries(AFTU_TATA_MAP_ROUTES.map((route) => [route.id, route]))
  expect(byId['aftu-59']?.line).toBe('59')
  expect(byId['aftu-60']?.line).toBe('60')
  expect(byId['aftu-66']?.line).toBe('66')
  expect(byId['aftu-73']?.line).toBe('73')
  expect(byId['aftu-78']?.line).toBe('78')
  const line59 = byId['aftu-59']?.waypoints ?? []
  const line73 = byId['aftu-73']?.waypoints ?? []
  expect(line59[line59.length - 1]).toMatchObject({ name: 'Bargny', lat: 14.69798, lon: -17.22923 })
  expect(line73[0]).toMatchObject({ name: 'Bargny', lat: 14.69798, lon: -17.22923 })
  expect(line73[1]).toMatchObject({ name: 'Arrêt Khaar (repère Rufisque)', lat: 14.72029, lon: -17.26547 })
  expect(line73[line73.length - 1]).toMatchObject({ name: 'Tivaouane Peulh', lat: 14.81072, lon: -17.26086 })
})