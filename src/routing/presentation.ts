import type { MobilityId } from '../domain/mobilityColors'
import type { BusMapSection } from './busGeography'
import type { Criterion, Itinerary, Place } from './model'

export const criterionLabels: Record<Criterion, string> = {
  fastest: 'Le plus rapide', changes: 'Moins de correspondances', walking: 'Moins de marche',
  simple: 'Le plus simple', cadence: 'Cadence la plus rapprochée',
}
export function dakarClock(epochSeconds: number): string { return new Date(epochSeconds * 1000).toISOString().slice(11, 16) }
export function tripSummary(t: Itinerary): string {
  const lines = t.legs.flatMap(l => l.kind === 'ride' ? [l.lineName] : [])
  return `${lines.join(' → ') || 'À pied'} · ${dakarClock(t.start)} → ${dakarClock(t.end)} · ≈ ${Math.ceil(t.totalSeconds / 60)} min · ${t.changes} correspondance${t.changes > 1 ? 's' : ''}`
}
export interface JourneyMarker { place: Pick<Place, 'id' | 'name' | 'lat' | 'lon'>; network: MobilityId; line: string; role: 'Montée' | 'Descente' | 'Desserte' | 'Repère cartographique' }
export interface MapSegment { id: string; geographyOnly?: boolean; busFamily?: 'aftu' | 'tata'; network: MobilityId | 'walk'; positions: readonly (readonly [number, number])[] }
/** Coordinate order conversion only: no routing, projecting, interpolation or
 * async geometry lookup in the map. Never draw between the ends of two legs. */
export function mapItinerary(t: Itinerary | undefined) {
  const segments: MapSegment[] = [], changes: Place[] = [], calls: JourneyMarker[] = []
  for (const [i, leg] of (t?.legs ?? []).entries()) {
    segments.push({ id: `${leg.kind === 'ride' ? leg.lineId : 'walk'}:${leg.from.id}:${leg.to.id}:${i}`, network: leg.kind === 'ride' ? leg.network : 'walk',
      busFamily: leg.kind === 'ride' && (leg.mode === 'aftu' || leg.mode === 'tata') ? leg.mode : undefined, positions: leg.positions.map(p => [p.lat, p.lon]) })
    if (leg.kind === 'ride') {
      if (leg.samePlatformChange) changes.push(leg.from)
      leg.stops.forEach((place, j) => calls.push({ place: j === 0 ? leg.from : j === leg.stops.length - 1 ? leg.to : place, network: leg.network, line: leg.lineName, role: j === 0 ? 'Montée' : j === leg.stops.length - 1 ? 'Descente' : 'Desserte' }))
    }
    else if (leg.role === 'transfer') changes.push(leg.from, leg.to)
  }
  return { segments, changes, calls }
}

/** Explicit opt-in after a routing refusal. Never reuses boarding, alighting or
 * transfer symbology. Only the selected slice, not the whole relation. */
export function mapBusSection(s: BusMapSection): ReturnType<typeof mapItinerary> {
  const network = s.review.family === 'ddd' ? 'ddd' : 'aftu_tata'
  return { changes: [], segments: [{ id: s.id, network, geographyOnly: true, positions: s.positions.map(p => [p.lat, p.lon]) }],
    calls: s.markers.map(place => ({ place, network, line: `${s.review.family.toUpperCase()} ${s.review.line} · sans horaire`, role: 'Repère cartographique' })) }
}
