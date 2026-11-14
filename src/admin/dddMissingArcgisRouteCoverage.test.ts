import { describe, expect, it } from 'vitest'
import {
  DDD_MISSING_ARCGIS_ROUTE_COVERAGE,
  getDddMissingArcgisRouteCoverage,
} from './dddMissingArcgisRouteCoverage'

describe('DDD lines without a same-code ArcGIS stop group', () => {
  it('confirms that all 17 lines still have a published text sequence to work from', () => {
    expect(DDD_MISSING_ARCGIS_ROUTE_COVERAGE.map((item) => item.line)).toEqual([
      '20', '208', '213', '219', '220', '221', '233', '234',
      '311', '327', 'TO1', '319', '501', '502', '503', 'TAF_TAF', '15',
    ])
    expect(DDD_MISSING_ARCGIS_ROUTE_COVERAGE).toHaveLength(17)
    expect(DDD_MISSING_ARCGIS_ROUTE_COVERAGE.every((item) => item.stopCount > 1)).toBe(true)
  })

  it('keeps the absence of ArcGIS points separate from published sequence availability', () => {
    expect(DDD_MISSING_ARCGIS_ROUTE_COVERAGE.every((item) => item.arcgisSameCodeStopGroup === false)).toBe(true)
    expect(DDD_MISSING_ARCGIS_ROUTE_COVERAGE.every((item) => item.reverseSequenceCreated === false)).toBe(true)
    expect(DDD_MISSING_ARCGIS_ROUTE_COVERAGE.every((item) => item.directionVerified === false)).toBe(true)
    expect(DDD_MISSING_ARCGIS_ROUTE_COVERAGE.every((item) => item.coordinatesVerified === false)).toBe(true)
  })

  it('uses distinct source records for TO1 and TAF_TAF', () => {
    expect(getDddMissingArcgisRouteCoverage('TO1')).toMatchObject({
      sequenceSource: 'ddd-published-routes',
      sequenceLine: 'TO1',
    })
    expect(getDddMissingArcgisRouteCoverage('TAF_TAF')).toMatchObject({
      sequenceSource: 'official-published-routes',
      sequenceLine: 'TAF_TAF',
    })
    expect(getDddMissingArcgisRouteCoverage('TO1')?.stopCount).toBeGreaterThan(1)
    expect(getDddMissingArcgisRouteCoverage('TAF_TAF')?.stopCount).toBeGreaterThan(1)
  })

  it('uses the official published suburban records for lines 15 and 501–503', () => {
    for (const line of ['15', '501', '502', '503']) {
      expect(getDddMissingArcgisRouteCoverage(line)).toMatchObject({
        sequenceSource: 'official-published-routes',
        sequenceLine: line,
      })
    }
  })

  it('does not claim a route sequence for an unrelated line', () => {
    expect(getDddMissingArcgisRouteCoverage('999')).toBeNull()
  })
})
