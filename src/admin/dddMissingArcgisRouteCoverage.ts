import { DDD_PUBLISHED_ROUTES, getDddPublishedRoute } from '../data/dddPublishedRoutes'
import { getDddOfficialPublishedRoute } from '../data/dddOfficialPublishedRoutes'

/**
 * Couverture documentaire des lignes sans groupe de points ArcGIS portant
 * leur propre code. Une séquence textuelle publiée existe, mais cela ne
 * valide ni les coordonnées, ni les deux sens, ni l'exhaustivité terrain.
 */
export type DddMissingArcgisSequenceSource = 'ddd-published-routes' | 'official-published-routes'

export interface DddMissingArcgisRouteCoverage {
  line: string
  sequenceSource: DddMissingArcgisSequenceSource
  sequenceLine: string
  stopCount: number
  arcgisSameCodeStopGroup: false
  reverseSequenceCreated: false
  coordinatesVerified: false
}

const dddPublishedRouteLines = new Set(DDD_PUBLISHED_ROUTES.map((route) => route.line))

const coverage = (
  line: string,
  sequenceSource: DddMissingArcgisSequenceSource,
  sequenceLine = line,
): DddMissingArcgisRouteCoverage => {
  const route = sequenceSource === 'ddd-published-routes'
    ? getDddPublishedRoute(sequenceLine)
    : getDddOfficialPublishedRoute(sequenceLine)

  if (!route) {
    throw new Error(`Missing DDD published sequence for ArcGIS gap line ${line} (source key ${sequenceLine})`)
  }

  return {
    line,
    sequenceSource,
    sequenceLine,
    stopCount: route.stops.length,
    arcgisSameCodeStopGroup: false,
    reverseSequenceCreated: false,
    coordinatesVerified: false,
  }
}

const missingArcgisLines = [
  '20', '208', '213', '219', '220', '221', '233', '234',
  '311', '327', 'TO1', '319', '501', '502', '503', 'TAF_TAF', '15',
] as const

export const DDD_MISSING_ARCGIS_ROUTE_COVERAGE: readonly DddMissingArcgisRouteCoverage[] =
  missingArcgisLines.map((line) => {
    // TO1 is sourced from its own DDD route record. The combined official
    // TAF_TAF_TO1 entry is not treated as proof that TAF_TAF and TO1 are equal.
    if (line === 'TO1') return coverage(line, 'ddd-published-routes')
    if (dddPublishedRouteLines.has(line)) return coverage(line, 'ddd-published-routes')
    return coverage(line, 'official-published-routes')
  })

export function getDddMissingArcgisRouteCoverage(line: string): DddMissingArcgisRouteCoverage | null {
  return DDD_MISSING_ARCGIS_ROUTE_COVERAGE.find((item) => item.line === line) ?? null
}
