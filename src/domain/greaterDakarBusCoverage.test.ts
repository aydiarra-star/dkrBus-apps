import { describe, expect, it } from 'vitest'
import { ALL_CORRIDOR_STOPS, DAKAR_REGION_BOUNDS } from './corridors'
import { GREATER_DAKAR_BUS_COVERAGE_POINTS } from '../data/greaterDakarBusCoverage'

describe('repères de couverture DDD/AFTU/TATA de l’agglomération élargie', () => {
  it('place les localités dans le périmètre cartographique étendu', () => {
    for (const point of GREATER_DAKAR_BUS_COVERAGE_POINTS) {
      expect(point.lat).toBeGreaterThanOrEqual(DAKAR_REGION_BOUNDS.minLat)
      expect(point.lat).toBeLessThanOrEqual(DAKAR_REGION_BOUNDS.maxLat)
      expect(point.lon).toBeGreaterThanOrEqual(DAKAR_REGION_BOUNDS.minLon)
      expect(point.lon).toBeLessThanOrEqual(DAKAR_REGION_BOUNDS.maxLon)
    }
  })

  it('inclut les dessertes périphériques citées dans les itinéraires officiels', () => {
    const names = new Set(GREATER_DAKAR_BUS_COVERAGE_POINTS.map((point) => point.name))
    for (const name of ['Sangalkam', 'Bambilor', 'Niacourab', 'Tivaouane Peulh', 'Malika', 'Bargny', 'Toubab Dialaw', 'Yène', 'Noflaye', 'Keur Ndiaye Lo', 'Carrefour Marché Boubess']) {
      expect(names.has(name)).toBe(true)
    }
  })

  it('garde chaque repère hors du graphe des arrêts du calculateur', () => {
    const plannerStopIds = new Set(ALL_CORRIDOR_STOPS.map((stop) => stop.id))
    expect(GREATER_DAKAR_BUS_COVERAGE_POINTS.every((point) => !plannerStopIds.has(point.id))).toBe(true)
    expect(new Set(GREATER_DAKAR_BUS_COVERAGE_POINTS.map((point) => point.id)).size).toBe(GREATER_DAKAR_BUS_COVERAGE_POINTS.length)
    expect(GREATER_DAKAR_BUS_COVERAGE_POINTS.every((point) => point.osmRef && point.osmUrl && point.routes.length > 0)).toBe(true)
  })
})
