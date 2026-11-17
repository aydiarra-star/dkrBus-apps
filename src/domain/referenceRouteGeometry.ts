import terGeometry from '../../data/ter/ter-dakar-aibd.geojson'
import brtGeometry from '../../data/brt/brt-b1-osm.geojson'
import { BRT_STOPS, TER_STOPS, type CorridorStop } from './corridors'
import { projectStopToLine, type RoadPoint } from './roadNetworkRouting'

interface GeoJsonLineFeature {
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: number[][] }
}

function positionsOf(feature: GeoJsonLineFeature): RoadPoint[] {
  return feature.geometry.coordinates.map(([lon, lat]) => ({ lat, lon }))
}

function auditOrderedStops(stops: readonly CorridorStop[], positions: readonly RoadPoint[]) {
  const projected = stops.map((stop) => ({
    stopId: stop.id,
    name: stop.name,
    projection: projectStopToLine({ lat: stop.lat, lon: stop.lon }, positions),
  }))
  const offsets = projected.map((entry) => entry.projection?.offsetM ?? Number.POSITIVE_INFINITY)
  const chainages = projected.map((entry) => entry.projection?.chainageM ?? Number.NaN)
  const monotonic = chainages.every((value, index) =>
    Number.isFinite(value) && (index === 0 || value > chainages[index - 1]),
  )
  return {
    stopCount: stops.length,
    projectedCount: projected.filter((entry) => entry.projection !== null).length,
    maxOffsetM: Math.max(...offsets),
    monotonic,
    passed: offsets.every((offset) => offset <= 80) && monotonic,
    stops: projected.map((entry) => ({
      stopId: entry.stopId,
      name: entry.name,
      offsetM: entry.projection ? Math.round(entry.projection.offsetM * 10) / 10 : null,
      chainageM: entry.projection ? Math.round(entry.projection.chainageM) : null,
    })),
  }
}

/** Audit TER on the physical railway alignment, restricted to phase 1. */
export function auditTerPhaseOneGeometry() {
  const feature = terGeometry.features[0] as GeoJsonLineFeature
  const phaseOneEnd = Number(feature.properties.phase_2_start_index)
  const positions = positionsOf({ ...feature, geometry: {
    ...feature.geometry,
    coordinates: feature.geometry.coordinates.slice(0, phaseOneEnd + 1),
  } })
  const stops = TER_STOPS.filter((stop) => stop.id !== 'ter-aibd').slice().sort((a, b) => a.order - b.order)
  return {
    source: 'OpenStreetMap physical railway alignment',
    sourceId: String(feature.properties.osm_relation),
    extractedOn: String(feature.properties.extracted_on),
    scope: 'Dakar ↔ Diamniadio (phase 1 only)',
    phaseOneLengthM: Number(feature.properties.phase_1_length_m),
    ...auditOrderedStops(stops, positions),
  }
}

/** Audit both separately mapped, directional OSM relations for BRT B1. */
export function auditBrtB1DirectionalGeometry() {
  const features = brtGeometry.features as unknown as GeoJsonLineFeature[]
  return features.map((feature) => {
    const from = String(feature.properties.direction_from)
    const to = String(feature.properties.direction_to)
    const forward = from.toLowerCase().includes('petersen')
    const stops = BRT_STOPS.slice().sort((a, b) => a.order - b.order)
    const ordered = forward ? stops : stops.reverse()
    const audit = auditOrderedStops(ordered, positionsOf(feature))
    return {
      source: 'OpenStreetMap directional route relation',
      sourceId: String(feature.properties.osm_relation),
      extractedOn: String(feature.properties.extracted_on),
      direction: `${from} → ${to}`,
      ...audit,
    }
  })
}
