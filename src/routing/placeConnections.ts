import { MAX_ACCESS_M } from '../domain/assumptions'
import { haversineMeters } from '../domain/corridors'
import { isValidLatLng } from '../domain/http'
import { walkingTree } from './walking'
import { inDakar } from './geometry'
import type { Network, Outcome, Place, Query } from './model'
import { fastestRideSections, search } from './search'

export interface DakarEndpoint { snapshotId?: string; stopId?: string; landmarkId?: string; lat: number; lng: number; kind?: 'map' | 'stop'; label?: string }
export type JourneySettings = Omit<Query, 'origin' | 'destination'>

/** Bind an explicit selection to a reviewed vertex, never to a neighbour.
 * A reviewed entrance/path with the landmark's ID can use all its directed
 * walk links. A landmark cannot masquerade as a call. Published stops belong
 * to a different snapshot/namespace, and a GPS fix carries no vertex ID. */
export function selectedVertex(net: Network, point: DakarEndpoint): Place | undefined {
  if ((point.landmarkId && point.stopId) || (point.kind !== 'stop' && point.stopId?.startsWith('gtfs:'))) return
  const id = point.kind === 'stop' ? (point.snapshotId && point.stopId ? `gtfs:${point.snapshotId}:stop:${point.stopId}` : undefined)
    : point.landmarkId ?? (point.kind === undefined ? point.stopId : undefined)
  if (!id || (id.startsWith('landmark:') && !point.landmarkId)) return
  const vertex = net.places.get(id)
  if (!vertex || vertex.lat !== point.lat || vertex.lon !== point.lng) return
  if (point.landmarkId && (!id.startsWith('landmark:') || (vertex.kind !== 'entrance' && vertex.kind !== 'path'))) return
  return vertex
}

/** Replacing the requested journey is an explicit user action. A published
 * logical call keeps its original GTFS ID for the read API, never a synthetic
 * ref: ID or the old snapshot's index. */
export function endpointOf(p: Place, snapshotId?: string): DakarEndpoint & { label: string } {
  const base = { label: p.name, lat: p.lat, lng: p.lon }
  const prefix = `gtfs:${snapshotId}:stop:`
  if (snapshotId && p.id.startsWith(prefix)) return { ...base, kind: 'stop', snapshotId, stopId: p.id.slice(prefix.length) }
  return p.id.startsWith('landmark:') ? { ...base, kind: 'map', landmarkId: p.id } : { ...base, stopId: p.id }
}

export interface StopSection {
  tripId: string
  from: Place
  to: Place
  /** Null means the original selection is retained. Zero is still NOT a walk. */
  fromGapM: number | null
  toGapM: number | null
  /** Times apply only if already at the proposed starting point at query time. */
  boardAt: number
  arriveAt: number
  lines: string[]
  changes: number
}
export interface ConnectionReport {
  radiusM: number
  /** Count of eligible nearby calls, null for an already verified selection. */
  boardingCount: number | null
  alightingCount: number | null
  sections: StopSection[]
}

interface Choice { place: Place; gapM: number | null }
function choices(net: Network, point: DakarEndpoint, side: 'board' | 'alight', settings: JourneySettings, radiusM: number): Choice[] {
  const selected = selectedVertex(net, point)
  const keep = selected ? [{ place: selected, gapM: null }] : []
  if (selected?.kind === 'call' || selected?.kind === 'platform') return keep // an explicitly chosen stop is not interchangeable
  const location = { lat: point.lat, lon: point.lng }
  if (!inDakar(location)) return []
  const possible = new Set<Place>()
  for (const p of net.patterns) {
    if (settings.modes && !settings.modes.includes(p.network) && !settings.modes.includes(p.mode)) continue
    if (settings.stepFreeOnly && p.stepFree !== 'yes') continue
    // The last call of a one-way service is not a boarding point, nor its
    // first call an alighting point. A name or a route map gives neither role.
    for (let i = side === 'board' ? 0 : 1; i < p.calls.length - (side === 'board' ? 1 : 0); i++) {
      const observed = net.platforms.get(p)?.[side].get(i)
      if (!observed || !settings.stepFreeOnly || observed.stepFree === 'yes') possible.add(observed?.place ?? p.calls[i])
    }
  }
  const nearby = Array.from(possible, place => ({ place, gapM: haversineMeters(location, place) })).filter(c => c.gapM <= radiusM)
  // A surveyed entrance may lack the directed link for this side. Keep a
  // reachable entrance; merely having a vertex does not certify either walk.
  if (selected) {
    const walk = (id: string) => walkingTree(net, id, radiusM, settings.stepFreeOnly ?? false, side === 'board' ? 'access' : 'egress').distances
    if (side === 'board') {
      const reachable = walk(selected.id)
      if (nearby.some(c => reachable.has(c.place.id))) return keep
    } else if (nearby.some(c => walk(c.place.id).has(selected.id))) return keep
  }
  return nearby
}

/** A distinct question from door-to-door routing: which journeys could be
 * taken BETWEEN nearby stops? Check every eligible pair with the real dated
 * multimodal search, including its transfer and accessibility constraints.
 * The spatial filter is only a lower bound, never an access/egress leg. */
export function compareStopSections(net: Network, from: DakarEndpoint, to: DakarEndpoint, settings: JourneySettings): ConnectionReport {
  const radiusM = settings.maxWalkPerLegM ?? MAX_ACCESS_M
  const starts = choices(net, from, 'board', settings, radiusM)
  const ends = choices(net, to, 'alight', settings, radiusM)
  if (starts[0]?.gapM === null && ends[0]?.gapM === null) return { radiusM, boardingCount: null, alightingCount: null, sections: [] }
  const sections: StopSection[] = []
  const endById = new Map(ends.map(b => [b.place.id, b]))
  const targets = new Set(endById.keys())
  for (const a of starts) for (const [id, trip] of fastestRideSections(net, a.place, targets, settings)) {
    const b = endById.get(id)!
    const rides = trip.legs.flatMap(l => l.kind === 'ride' ? [l] : [])
    sections.push({ tripId: trip.id, from: a.place, to: b.place, fromGapM: a.gapM, toGapM: b.gapM,
      boardAt: rides[0].start, arriveAt: trip.end, lines: rides.map(l => l.mode === 'aftu' || l.mode === 'tata' ? `${l.mode.toUpperCase()} ${l.lineName}` : l.lineName), changes: trip.changes })
  }
  const gap = (s: StopSection) => (s.fromGapM ?? 0) + (s.toGapM ?? 0)
  sections.sort((a, b) => gap(a) - gap(b) || a.arriveAt - b.arriveAt || a.changes - b.changes || a.from.id.localeCompare(b.from.id) || a.to.id.localeCompare(b.to.id))
  // Limit the display, not the search: the closest pair may be disconnected.
  return { radiusM, boardingCount: starts[0]?.gapM === null ? null : starts.length,
    alightingCount: ends[0]?.gapM === null ? null : ends.length, sections: sections.slice(0, 3) }
}

export type PlaceJourneyOutcome = Extract<Outcome, { ok: true }> | (Extract<Outcome, { ok: false }> & { connections?: ConnectionReport })

/** Whole-journey search takes precedence, including all verified paths from a
 * named entrance. Stop-section comparisons can only enrich a refusal. */
export function planPlaceJourney(net: Network, from: DakarEndpoint, to: DakarEndpoint, settings: JourneySettings): PlaceJourneyOutcome {
  if (!isValidLatLng(from.lat, from.lng) || !isValidLatLng(to.lat, to.lng)) return { ok: false, code: 'INVALID_QUERY', message: 'Coordonnées de départ ou de destination invalides.' }
  if (from.lat === to.lat && from.lng === to.lng && from.stopId === to.stopId && from.landmarkId === to.landmarkId &&
      from.kind === to.kind && from.snapshotId === to.snapshotId) {
    return { ok: false, code: 'SAME_PLACE', message: 'Le départ et la destination sont identiques.' }
  }
  const origin = selectedVertex(net, from), destination = selectedVertex(net, to)
  const result = search(net, { ...settings, origin: origin?.id ?? '', destination: destination?.id ?? '' })
  const isWalkPoint = (p?: Place) => p?.kind === 'entrance' || p?.kind === 'path'
  if (result.ok || !(result.code === 'UNVERIFIED_ACCESS' || (result.code === 'NO_PATH' && (isWalkPoint(origin) || isWalkPoint(destination))))) return result
  const connections = compareStopSections(net, from, to, settings)
  if (connections.boardingCount === null && connections.alightingCount === null) return result
  const name = (p: DakarEndpoint) => p.label || `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`
  const gaps = [connections.boardingCount !== null && `Accès à pied non vérifié entre ${name(from)} et un arrêt de montée.`,
    connections.alightingCount !== null && `Marche finale non vérifiée entre un arrêt de descente et ${name(to)}.`].filter(Boolean)
  return { ok: false, code: 'UNVERIFIED_ACCESS', message: gaps.join(' '), connections }
}
