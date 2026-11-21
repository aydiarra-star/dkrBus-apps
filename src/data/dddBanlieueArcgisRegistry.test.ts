import { describe, expect, it } from 'vitest'
import {
  DDD_BANLIEUE_ARCGIS_LAYERS,
  DDD_ARCGIS_MAP_QUERIES,
  DDD_BANLIEUE_ARCGIS_STOP_GROUPS,
  DDD_BANLIEUE_ARCGIS_STOP_GROUP_TOTALS,
  DDD_BANLIEUE_ARCGIS_STOP_LAYER_URL,
  DDD_URBAN_ARCGIS_AUDIT_TOTALS,
  DDD_URBAN_ARCGIS_ROUTE_LAYERS,
  DDD_URBAN_ARCGIS_STOP_LAYERS,
  getDddBanlieueArcgisLayer,
} from './dddBanlieueArcgisRegistry'

describe('DDD suburban ArcGIS route references', () => {
  it('registers the 12 historical polyline layers published by the service', () => {
    expect(DDD_BANLIEUE_ARCGIS_LAYERS.map((item) => item.line)).toEqual([
      '227', '219', '218', '217', '2', '16B', '16A', '12', '232', '5', '11', '228',
    ])
    for (const item of DDD_BANLIEUE_ARCGIS_LAYERS) {
      expect(item.layerUrl).toContain('/FeatureServer/')
      expect(item.geometryType).toBe('polyline')
      expect(item.spatialReference).toBe('EPSG:3857')
      expect(item.sourceAge).toBe('historical')
      expect(item.stopPointFeaturesIncluded).toBe(false)
      expect(item.directionOrderVerified).toBe(false)
    }
  })

  it('keeps the known last-edit dates for the route layers checked directly', () => {
    expect(getDddBanlieueArcgisLayer('217')?.dataLastEditDate).toBe('2017-12-06')
    expect(getDddBanlieueArcgisLayer('218')?.dataLastEditDate).toBe('2017-12-06')
    expect(getDddBanlieueArcgisLayer('227')?.dataLastEditDate).toBe('2019-03-25')
    expect(getDddBanlieueArcgisLayer('232')?.dataLastEditDate).toBe('2017-12-06')
    expect(getDddBanlieueArcgisLayer('228')?.dataLastEditDate).toBe('2017-12-06')
  })

  it('does not invent a GIS layer for line 233', () => {
    expect(getDddBanlieueArcgisLayer('233')).toBeNull()
  })
})

describe('DDD suburban ArcGIS stop candidates', () => {
  it('loads only the eight clean source groups, totalling 187 historical map stops', () => {
    expect(DDD_BANLIEUE_ARCGIS_STOP_LAYER_URL).toContain('Dem_dikk_mise_a_jour/FeatureServer/0')
    expect(DDD_BANLIEUE_ARCGIS_STOP_GROUPS.map((group) => group.sourceGroup)).toEqual([
      'ligne_2', 'ligne_5', 'Ligne_11', 'Ligne_12', 'ligne_16A', 'ligne_16B', 'ligne_227', 'ligne_232',
    ])
    expect(DDD_BANLIEUE_ARCGIS_STOP_GROUP_TOTALS).toEqual({ groups: 8, candidateStops: 187 })
    expect(DDD_BANLIEUE_ARCGIS_STOP_GROUPS.some((group) => ['ligne_217', 'ligne_218', 'ligne_228'].includes(group.sourceGroup))).toBe(false)
  })
})

describe('DDD urban ArcGIS stop inventory', () => {
  it('records the 12 urban stop layers and the extracted point totals', () => {
    expect(DDD_URBAN_ARCGIS_STOP_LAYERS).toHaveLength(12)
    expect(DDD_URBAN_ARCGIS_AUDIT_TOTALS).toEqual({
      routeLayers: 12,
      routeFeatures: 13,
      nonEmptyRouteFeatures: 12,
      emptyRouteFeatures: 1,
      stopLayers: 12,
      stopFeatures: 455,
      namedStopFeatures: 379,
      missingNameStopFeatures: 76,
      geolocatedStopFeatures: 454,
    })
    expect(DDD_URBAN_ARCGIS_ROUTE_LAYERS.find((layer) => layer.line === '8')).toMatchObject({
      featureCount: 2,
      nonEmptyFeatureCount: 1,
      emptyFeatureCount: 1,
    })
  })

  it('keeps unnamed line 8 and line 13 stop layers as geographic candidates', () => {
    expect(DDD_URBAN_ARCGIS_STOP_LAYERS.find((layer) => layer.layerId === 3)).toMatchObject({
      line: '8', featureCount: 49, namedFeatureCount: 0, geolocatedFeatureCount: 49,
    })
    expect(DDD_URBAN_ARCGIS_STOP_LAYERS.find((layer) => layer.layerId === 8)).toMatchObject({
      line: '13', featureCount: 22, namedFeatureCount: 0, geolocatedFeatureCount: 22,
    })
  })
})

it('only allows the exact 37 geometry query paths, not an ArcGIS origin or wildcard', () => {
  expect(DDD_ARCGIS_MAP_QUERIES).toHaveLength(37)
  expect(new Set(DDD_ARCGIS_MAP_QUERIES).size).toBe(37)
  for (const url of DDD_ARCGIS_MAP_QUERIES) expect(decodeURI(url)).toMatch(
    /^https:\/\/services1\.arcgis\.com\/tKMirJrirprCZbnf\/ArcGIS\/rest\/services\/(?:Ligne_inter_urbain|Dem_dikk_mise_a_jour|Itinéraire_ligne_de_Banlieue_Dakar_Dem_Dikk)\/FeatureServer\/\d+\/query$/,
  )
})
