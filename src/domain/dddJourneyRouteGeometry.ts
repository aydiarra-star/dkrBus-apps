import type { PlannerLeg } from './planner'
import { ALL_CORRIDOR_STOPS } from './corridors'
import { projectStopToLine, type VerifiedLineGeometry } from './roadNetworkRouting'
import { sliceVerifiedRouteSegment } from './routeGeometrySlice'
import type { DddArcgisMapTrack } from './dddArcgisMapGeometry'

export interface HighlightedDddJourneyRouteSegment {
  id: string
  network: 'ddd'
  line: string
  /** Leaflet coordinates [latitude, longitude], sliced from the ArcGIS source. */
  positions: readonly (readonly [number, number])[]
  sourceLabel: string
}

const stopById = new Map(ALL_CORRIDOR_STOPS.map((stop) => [stop.id, stop]))

function dddLineCode(shortName: string): string | null {
  const match = /\\bDDD\\s+([0-9]+[A-Z]?)\\b/i.exec(shortName)
  return match?.[1]?.toUpperCase() ?? null
}

/**
 * Highlight a DDD ride only when one historical ArcGIS route shape contains
 * every stop of that ride, in the same order and within the snap tolerance.
 * This proves geometric alignment, not that the historical route is still
 * operated today. No stop-to-stop chords or reversed routes are synthesized.
 */
export function verifiedDddJourneyRouteSegments(
  legs: readonly PlannerLeg[],
  tracks: readonly DddArcgisMapTrack[],
  maxStopOffsetM = 80,
): HighlightedDddJourneyRouteSegment[] {
  const segments: HighlightedDddJourneyRouteSegment[] = []

  for (const [legIndex, leg] of legs.entries()) {
    if (leg.kind !== 'ride' || leg.line?.network !== 'ddd' || !leg.fromId || !leg.toId) continue
    const lineCode = dddLineCode(leg.line.shortName)
    if (!lineCode) continue

    const orderedIds = [leg.fromId, ...(leg.intermediateStopIds ?? []), leg.toId]
    const stops = orderedIds.map((id) => stopById.get(id))
    if (stops.length < 2 || stops.some((stop) => !stop)) continue

    for (const track of tracks) {
      if (track.line.toUpperCase() !== lineCode || track.positions.length < 2) continue
      const positions = track.positions.map(([lat, lon]) => ({ lat, lon }))
      const projections = stops.map((stop) => projectStopToLine(
        { lat: stop!.lat, lon: stop!.lon },
        positions,
      ))
      if (projections.some((projection) => !projection || projection.offsetM > maxStopOffsetM)) continue
      const chainages = projections.map((projection) => projection!.chainageM)
      if (!chainages.every((chainage, index) => index === 0 || chainage > chainages[index - 1])) continue

      const route: VerifiedLineGeometry = {
        network: 'ddd',
        lineId: leg.line.id,
        directionId: orderedIds.join('→'),
        source: 'OPERATOR_ARCGIS',
        sourceId: `ddd-arcgis-line-${lineCode}`,
        verified: true,
        positions,
      }
      const sliced = sliceVerifiedRouteSegment(
        route,
        { lat: stops[0]!.lat, lon: stops[0]!.lon },
        { lat: stops[stops.length - 1]!.lat, lon: stops[stops.length - 1]!.lon },
        maxStopOffsetM,
      )
      if (!sliced) continue

      segments.push({
        id: `${leg.line.id}:${orderedIds[0]}:${orderedIds.at(-1)}:${legIndex}`,
        network: 'ddd',
        line: lineCode,
        positions: sliced.map(({ lat, lon }) => [lat, lon] as const),
        sourceLabel: 'Tracé ArcGIS historique · alignement des arrêts et sens contrôlés · actualité du parcours non certifiée',
      })
      break
    }
  }

  return segments
}
