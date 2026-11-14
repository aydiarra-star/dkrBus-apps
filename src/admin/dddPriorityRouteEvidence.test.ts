import { describe, expect, it } from 'vitest'
import {
  DDD_ARCGIS_ATTRIBUTION_WARNINGS,
  DDD_LINES_WITHOUT_SAME_CODE_ARCGIS_STOP_GROUP,
  DDD_PRIORITY_ROUTE_EVIDENCE,
  getDddPriorityRouteEvidence,
} from './dddPriorityRouteEvidence'

describe('DDD priority route evidence', () => {
  it('records the six priority lines without promoting evidence to passenger stops', () => {
    expect(DDD_PRIORITY_ROUTE_EVIDENCE.map((item) => item.line))
      .toEqual(['1', '6', '12', '13', '16B', '121'])
    expect(DDD_PRIORITY_ROUTE_EVIDENCE.every((item) => item.passengerStopsImported === false)).toBe(true)
    expect(DDD_PRIORITY_ROUTE_EVIDENCE.every((item) => item.reverseSequenceCreated === false)).toBe(true)
  })

  it('preserves the measured OSM and ArcGIS evidence for line 1', () => {
    const route = getDddPriorityRouteEvidence('1')
    expect(route?.arcgisPointCount).toBe(38)
    expect(route?.maxPointDistanceMeters).toBe(25)
    expect(route?.osmRelations).toEqual(['6951328'])
    expect(route?.status).toBe('OSM_ORDER_GEOMETRY_STRONG_ONE_DIRECTION')
  })

  it('keeps the line 6 terminus conflict explicit', () => {
    const route = getDddPriorityRouteEvidence('6')
    expect(route?.arcgisPointCount).toBe(60)
    expect(route?.maxPointDistanceMeters).toBe(11.6)
    expect(route?.status).toBe('OFFICIAL_TERMINUS_CONFLICT')
    expect(route?.notes.join(' ')).toContain('ref=6')
  })

  it('does not count line 13 duplicate Id=0 points as additional stops', () => {
    const route = getDddPriorityRouteEvidence('13')
    expect(route?.arcgisPointCount).toBe(23)
    expect(route?.maxPointDistanceMeters).toBe(10.5)
    expect(route?.notes.join(' ')).toContain('Id=0')
  })

  it('keeps line 121 OSM candidates partial and distinct', () => {
    const route = getDddPriorityRouteEvidence('121')
    expect(route?.osmRelations).toEqual(['6990794', '6999013'])
    expect(route?.status).toBe('OSM_PARTIAL_DIRECTIONS_TERMINUS_MISMATCH')
    expect(route?.notes.join(' ')).toContain('27 arrêts')
    expect(route?.notes.join(' ')).toContain('7 arrêts')
  })

  it('lists the 17 DDD codes without same-code ArcGIS stop groups', () => {
    expect(DDD_LINES_WITHOUT_SAME_CODE_ARCGIS_STOP_GROUP).toHaveLength(17)
    expect(DDD_LINES_WITHOUT_SAME_CODE_ARCGIS_STOP_GROUP).toContain('20')
    expect(DDD_LINES_WITHOUT_SAME_CODE_ARCGIS_STOP_GROUP).toContain('219')
    expect(DDD_LINES_WITHOUT_SAME_CODE_ARCGIS_STOP_GROUP).toContain('TAF_TAF')
  })
  it('does not reassign ambiguous ArcGIS layers to another DDD line', () => {
    expect(DDD_ARCGIS_ATTRIBUTION_WARNINGS.find((item) => item.line === '20')?.sourceLayerLine).toBe('18')
    expect(DDD_ARCGIS_ATTRIBUTION_WARNINGS.find((item) => item.line === '20')?.pointCount).toBe(44)
    expect(DDD_ARCGIS_ATTRIBUTION_WARNINGS.find((item) => item.line === '219')?.sourceLayerLine).toBe('218')
    expect(DDD_ARCGIS_ATTRIBUTION_WARNINGS.find((item) => item.line === '219')?.pointCount).toBe(33)
    expect(DDD_ARCGIS_ATTRIBUTION_WARNINGS.find((item) => item.line === '233')?.warning).toContain('Palais 1')
    expect(DDD_ARCGIS_ATTRIBUTION_WARNINGS.find((item) => item.line === 'TAF_TAF')?.sourceLayerLine).toBe('TO1')
    expect(DDD_ARCGIS_ATTRIBUTION_WARNINGS.find((item) => item.line === '15')?.sourceLayerLine).toBe('15A/15B')
  })
})
