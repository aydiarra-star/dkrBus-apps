import type { PlannerLeg } from './planner'
import { ALL_CORRIDOR_STOPS } from './corridors'
import { auditBrtB1DirectionalGeometry, auditTerPhaseOneGeometry } from './referenceRouteGeometry'
import { sliceVerifiedRouteSegment } from './routeGeometrySlice'
import type { RoadPoint, VerifiedLineGeometry } from './roadNetworkRouting'
import { BRT_B1_TRACKS } from './brtTrackGeometry'
import { TER_TRACK } from './terTrackGeometry'

export interface HighlightedJourneyRouteSegment {
  id: string
  network: 'ter' | 'brt'
  /** Leaflet coordinates [latitude, longitude], cut from the verified source line. */
  positions: readonly (readonly [number, number])[]
}

const terAudit = auditTerPhaseOneGeometry()
const terPhaseOneRoute: VerifiedLineGeometry | null = terAudit.passed
  ? {
      network: 'ter',
      lineId: 'ter-dakar-diamniadio',
      directionId: 'Dakar → Diamniadio',
      source: 'OSM_ROUTE_RELATION',
      sourceId: String(TER_TRACK.osmRelationId),
      verified: true,
      positions: TER_TRACK.positions
        .slice(0, TER_TRACK.phase2StartIndex + 1)
        .map(([lat, lon]) => ({ lat, lon })),
    }
  : null

const brtDirectionalRoutes: VerifiedLineGeometry[] = BRT_B1_TRACKS.flatMap((track) => {
  const directionId = `${track.directionFrom} → ${track.directionTo}`
  const audit = auditBrtB1DirectionalGeometry().find((candidate) => candidate.direction === directionId)
  if (!audit?.passed) return []
  return [{
    network: 'brt',
    lineId: 'brt-b1',
    directionId,
    source: 'OSM_ROUTE_RELATION',
    sourceId: String(track.osmRelationId),
    verified: true,
    positions: track.positions.map(([lat, lon]) => ({ lat, lon })),
  }]
})

const stopById = new Map(ALL_CORRIDOR_STOPS.map((stop) => [stop.id, stop]))

/**
 * Produce only the ride portions that can be cut from an audited, directional
 * route geometry. No stop-to-stop chord, reversed direction or walking proxy
 * is created when source geometry is missing or fails validation.
 */
export function verifiedJourneyRouteSegments(
  legs: readonly PlannerLeg[],
): HighlightedJourneyRouteSegment[] {
  const segments: HighlightedJourneyRouteSegment[] = []

  legs.forEach((leg, index) => {
    if (leg.kind !== 'ride' || !leg.line || !leg.fromId || !leg.toId) return
    const fromStop = stopById.get(leg.fromId)
    const toStop = stopById.get(leg.toId)
    if (!fromStop || !toStop) return

    let candidates: readonly VerifiedLineGeometry[] = []
    if (leg.line.network === 'ter' && leg.line.id === 'ter-dakar-diamniadio' && terPhaseOneRoute) {
      candidates = [terPhaseOneRoute]
    } else if (leg.line.network === 'brt' && leg.line.id === 'brt-b1') {
      candidates = brtDirectionalRoutes
    }

    for (const route of candidates) {
      const sliced = sliceVerifiedRouteSegment(
        route,
        { lat: fromStop.lat, lon: fromStop.lon } satisfies RoadPoint,
        { lat: toStop.lat, lon: toStop.lon } satisfies RoadPoint,
      )
      if (!sliced) continue
      segments.push({
        id: `${leg.line.id}:${leg.fromId}:${leg.toId}:${index}`,
        network: route.network,
        positions: sliced.map(({ lat, lon }) => [lat, lon] as const),
      })
      break
    }
  })

  return segments
}
