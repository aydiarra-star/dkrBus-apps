import type { PlannerLeg } from './planner'
import { ALL_CORRIDOR_STOPS } from './corridors'

const OSM_PT_API = 'https://openstreetmap.tools/public_transport_geojson/api'
const DAKAR_BOUNDS = { south: 14.55, west: -17.56, north: 14.88, east: -17.05 }

export interface OSMRouteCandidate {
  id: number
  name?: string
  ref?: string
  operator?: string
  network?: string
  route?: string
  type?: string
}

export interface OSMRouteStop {
  name?: string
  lat?: number
  lon?: number
}

export interface OSMRouteDetail {
  stops?: OSMRouteStop[]
}

export interface OSMRouteSegmentFeatureCollection {
  features?: Array<{
    geometry?: { type?: string; coordinates?: unknown }
  }>
}

export interface HighlightedOsmJourneyRouteSegment {
  id: string
  network: 'aftu_tata'
  line: string
  positions: readonly (readonly [number, number])[]
  sourceLabel: string
}

function normalizeStopName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function lineReference(leg: PlannerLeg): string | null {
  if (leg.line?.network !== 'aftu_tata') return null
  const match = /\b(?:AFTU|TATA)\s*([0-9]{1,3})\b/i.exec(leg.line.shortName)
  return match?.[1] ?? null
}

function stopNames(stopId: string | undefined): string[] {
  if (!stopId) return []
  const stop = ALL_CORRIDOR_STOPS.find((candidate) => candidate.id === stopId)
  if (!stop) return []
  return [stop.name, ...(stop.shortName ? [stop.shortName] : []), ...stop.aliases]
    .map(normalizeStopName)
    .filter(Boolean)
}

/** Construit une recherche bornée à l'agglomération de Dakar, par numéro exact. */
export function buildOsmRouteSearchUrl(reference: string): string {
  const params = new URLSearchParams({
    q: reference,
    mode: 'bus',
    south: String(DAKAR_BOUNDS.south),
    west: String(DAKAR_BOUNDS.west),
    north: String(DAKAR_BOUNDS.north),
    east: String(DAKAR_BOUNDS.east),
  })
  return `${OSM_PT_API}/search?${params.toString()}`
}

/** Refuse les relations sans référence exacte ou sans attribution AFTU/TATA explicite. */
export function isMatchingAftuTataRoute(route: OSMRouteCandidate, reference?: string): boolean {
  if (route.type !== 'route' || route.route !== 'bus') return false
  if (reference && route.ref?.trim() !== reference) return false
  const attribution = [route.operator, route.network, route.name]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase()
  return /\baftu\b|\btata\b/.test(attribution)
}

/** Les deux arrêts doivent être nommés explicitement et dans le sens demandé. */
export function findOrderedOsmRouteStops(
  stops: readonly OSMRouteStop[],
  fromNames: readonly string[],
  toNames: readonly string[],
): { from: string; to: string } | null {
  const fromSet = new Set(fromNames)
  const toSet = new Set(toNames)
  for (let fromIndex = 0; fromIndex < stops.length; fromIndex += 1) {
    const from = stops[fromIndex]?.name?.trim()
    if (!from || !fromSet.has(normalizeStopName(from))) continue
    for (let toIndex = fromIndex + 1; toIndex < stops.length; toIndex += 1) {
      const to = stops[toIndex]?.name?.trim()
      if (to && toSet.has(normalizeStopName(to))) return { from, to }
    }
  }
  return null
}

/** Ne garde que la LineString GeoJSON renvoyée par l'extracteur OSM. */
export function osmRouteSegmentToLeafletPositions(
  payload: OSMRouteSegmentFeatureCollection,
): [number, number][] {
  const feature = payload.features?.find((candidate) => candidate.geometry?.type === 'LineString')
  const coordinates = feature?.geometry?.coordinates
  if (!Array.isArray(coordinates)) return []
  const positions: [number, number][] = []
  for (const point of coordinates) {
    if (
      !Array.isArray(point)
      || !Number.isFinite(point[0])
      || !Number.isFinite(point[1])
      || point[0] < DAKAR_BOUNDS.west - 0.2
      || point[0] > DAKAR_BOUNDS.east + 0.2
      || point[1] < DAKAR_BOUNDS.south - 0.2
      || point[1] > DAKAR_BOUNDS.north + 0.2
    ) continue
    positions.push([point[1] as number, point[0] as number])
  }
  return positions.length >= 2 ? positions : []
}

/**
 * Résout uniquement les tronçons AFTU/TATA réellement présents dans une relation
 * OSM bus : numéro exact, opérateur/réseau attribué et arrêts de départ/arrivée
 * retrouvés dans le bon ordre. Aucun OSRM entre quartiers ni aucune corde n'est créé.
 */
export async function loadOsmJourneyRouteSegments(
  legs: readonly PlannerLeg[],
  signal: AbortSignal,
): Promise<HighlightedOsmJourneyRouteSegment[]> {
  const segments: HighlightedOsmJourneyRouteSegment[] = []
  const rides = legs.flatMap((leg, index) => {
    if (leg.kind !== 'ride') return []
    const reference = lineReference(leg)
    const fromNames = stopNames(leg.fromId)
    const toNames = stopNames(leg.toId)
    // L'API OSM exige au moins deux caractères dans sa recherche textuelle.
    const searchTerm = reference ? (reference.length >= 2 ? reference : `AFTU ${reference}`) : fromNames[0]
    return searchTerm && fromNames.length && toNames.length
      ? [{ leg, index, reference, searchTerm, fromNames, toNames }]
      : []
  })

  for (const ride of rides) {
    if (signal.aborted) return []
    try {
      const searchResponse = await fetch(buildOsmRouteSearchUrl(ride.searchTerm), {
        signal,
        headers: { Accept: 'application/json' },
      })
      if (!searchResponse.ok) continue
      const searchPayload = await searchResponse.json() as { routes?: OSMRouteCandidate[] }
      const candidates = (searchPayload.routes ?? []).filter((route) =>
        isMatchingAftuTataRoute(route, ride.reference),
      )

      for (const candidate of candidates) {
        if (signal.aborted) return []
        const detailResponse = await fetch(`${OSM_PT_API}/route/${candidate.id}`, {
          signal,
          headers: { Accept: 'application/json' },
        })
        if (!detailResponse.ok) continue
        const detail = await detailResponse.json() as OSMRouteDetail
        const matchedStops = findOrderedOsmRouteStops(detail.stops ?? [], ride.fromNames, ride.toNames)
        if (!matchedStops) continue

        const params = new URLSearchParams({ from: matchedStops.from, to: matchedStops.to, stops: '0' })
        const segmentResponse = await fetch(
          `${OSM_PT_API}/segment/${candidate.id}?${params.toString()}`,
          { signal, headers: { Accept: 'application/json' } },
        )
        if (!segmentResponse.ok) continue
        const payload = await segmentResponse.json() as OSMRouteSegmentFeatureCollection
        const positions = osmRouteSegmentToLeafletPositions(payload)
        if (positions.length < 2) continue

        segments.push({
          id: `osm-${candidate.id}-${ride.index}`,
          network: 'aftu_tata',
          line: candidate.ref?.trim() || ride.reference || 'AFTU',
          positions,
          sourceLabel: 'OpenStreetMap · relation de bus · arrêts et sens concordants',
        })
        break
      }
    } catch {
      // Une source OSM indisponible ne bloque jamais la recherche ni les autres réseaux.
    }
  }
  return segments
}
