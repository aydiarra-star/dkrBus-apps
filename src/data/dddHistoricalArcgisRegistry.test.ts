import { describe, expect, it } from 'vitest'
import {
  DDD_HISTORICAL_ARCGIS_REGISTRY,
  getDddHistoricalLayerReference,
  getDddHistoricalStopFeatureTotal,
} from './dddHistoricalArcgisRegistry'

describe('DDD historical ArcGIS source registry', () => {
  it('preserves the twelve documented historical line references', () => {
    expect(DDD_HISTORICAL_ARCGIS_REGISTRY.map(({ line }) => line)).toEqual([
      '1', '4', '6', '7', '8', '9', '10', '13', '18', '20', '23', '121',
    ])
  })

  it('records the published stop feature estimates without claiming direction order', () => {
    expect(getDddHistoricalStopFeatureTotal()).toBe(455)
    for (const reference of DDD_HISTORICAL_ARCGIS_REGISTRY) {
      expect(reference.spatialReference).toBe('EPSG:32628')
      expect(reference.sourceAge).toBe('historical')
      expect(reference.directionOrderVerified).toBe(false)
    }
  })

  it('keeps the line 20 route geometry while explicitly recording no stop layer in this inventory', () => {
    const line20 = getDddHistoricalLayerReference('20')
    expect(line20?.routeLayerId).toBe(15)
    expect(line20?.stopLayerId).toBeNull()
    expect(line20?.estimatedStopFeatures).toBe(0)
  })
})
