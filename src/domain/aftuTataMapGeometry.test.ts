import { describe, expect, it } from 'vitest'
import { AFTU_TATA_MAP_ROUTES } from '../data/aftuTataMapRoutes'
import { buildAftuTataOsrmUrl, osrmGeometryToLeafletPositions } from './aftuTataMapGeometry'

describe('géométries cartographiques AFTU/TATA', () => {
  it('construit une requête OSRM avec les waypoints dans l’ordre publié', () => {
    const route = AFTU_TATA_MAP_ROUTES.find((item) => item.line === '79')!
    const url = buildAftuTataOsrmUrl(route)
    expect(url).toContain('/14.77877,-17.22654;')
    expect(url).toContain('14.771,-17.4237?')
    expect(url).toContain('geometries=geojson')
  })

  it('convertit longitude/latitude en latitude/longitude', () => {
    expect(osrmGeometryToLeafletPositions([[-17.3, 14.7], [-17.2, 14.8]])).toEqual([
      [14.7, -17.3],
      [14.8, -17.2],
    ])
  })

  it('ignore les géométries invalides et hors Sénégal', () => {
    expect(osrmGeometryToLeafletPositions([[-3.7, 40.4], [-17.2, 14.6], ['bad', 14.7]])).toEqual([
      [14.6, -17.2],
    ])
    expect(osrmGeometryToLeafletPositions(null)).toEqual([])
  })
})
