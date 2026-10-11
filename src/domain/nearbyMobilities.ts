/**
 * Détection des mobilités de référence autour d’une position GPS.
 *
 * Le rayon est le même que le géofencing des alertes (1,5 km) : assez serré
 * pour « immédiatement autour », assez large pour croiser TER, BRT, DDD, AFTU
 * et TATA là où leurs arrêts de référence se rencontrent. Aucune position de
 * véhicule n’est inventée : seuls les arrêts déclarés du catalogue entrent
 * dans la liste, et seulement s’ils tombent dans le rayon.
 */

import {
  AFTU_STOPS,
  BRT_STOPS,
  DDD_STOPS,
  TATA_STOPS,
  TER_STOPS,
  haversineMeters,
  linesServingStop,
  type CorridorNetworkId,
  type CorridorStop,
} from './corridors'
import { MOBILITY_IDS, mobilityFromStopId, type MobilityId } from './mobilityColors'

export const NEARBY_MOBILITY_RADIUS_M = 1500

/** Ordre d’affichage demandé : TER, BRT, DDD, puis AFTU / TATA. */
export const NEARBY_MOBILITY_ORDER = ['ter', 'brt', 'ddd', 'aftu', 'tata'] as const satisfies readonly MobilityId[]

export const NEARBY_MOBILITY_KIND: Record<CorridorNetworkId, string> = {
  ter: 'Arrêts TER',
  brt: 'Stations BRT',
  ddd: 'Bus DDD',
  aftu: 'Arrêts AFTU',
  tata: 'Arrêts TATA',
}

const STOPS_BY_NETWORK: Record<CorridorNetworkId, readonly CorridorStop[]> = {
  ter: TER_STOPS,
  brt: BRT_STOPS,
  ddd: DDD_STOPS,
  aftu: AFTU_STOPS,
  tata: TATA_STOPS,
}

export interface NearbyMobilityHit {
  stop: CorridorStop
  network: CorridorNetworkId
  distanceM: number
  /** Sigles des lignes de référence qui desservent l’arrêt. Vide si aucune n’est déclarée. */
  lineNames: readonly string[]
}

export interface NearbyMobilityGroup {
  network: CorridorNetworkId
  hits: readonly NearbyMobilityHit[]
}

function isFinitePoint(point: { lat: number; lon: number }): boolean {
  return Number.isFinite(point.lat) && Number.isFinite(point.lon)
    && Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180
}

/** Arrêts de référence dans le rayon, du plus proche au plus loin. */
export function detectNearbyMobilities(
  point: { lat: number; lon: number },
  radiusM = NEARBY_MOBILITY_RADIUS_M,
): NearbyMobilityHit[] {
  if (!isFinitePoint(point) || !Number.isFinite(radiusM) || radiusM < 0) return []
  const hits: NearbyMobilityHit[] = []
  for (const network of NEARBY_MOBILITY_ORDER) {
    for (const stop of STOPS_BY_NETWORK[network]) {
      if (mobilityFromStopId(stop.id) !== network) continue
      const distanceM = haversineMeters(point, stop)
      if (distanceM > radiusM) continue
      hits.push({
        stop,
        network,
        distanceM,
        lineNames: linesServingStop(stop.id).map((line) => line.shortName),
      })
    }
  }
  hits.sort((a, b) => a.distanceM - b.distanceM || a.stop.name.localeCompare(b.stop.name, 'fr'))
  return hits
}

/** Regroupe les détections dans l’ordre des cinq mobilités, sans groupe vide. */
export function groupNearbyMobilities(hits: readonly NearbyMobilityHit[]): NearbyMobilityGroup[] {
  const byNetwork = new Map<CorridorNetworkId, NearbyMobilityHit[]>()
  for (const hit of hits) {
    const list = byNetwork.get(hit.network)
    if (list) list.push(hit)
    else byNetwork.set(hit.network, [hit])
  }
  return NEARBY_MOBILITY_ORDER
    .filter((network) => byNetwork.has(network))
    .map((network) => ({ network, hits: byNetwork.get(network) ?? [] }))
}

export function absentNearbyNetworks(groups: readonly NearbyMobilityGroup[]): CorridorNetworkId[] {
  const present = new Set(groups.map((group) => group.network))
  return NEARBY_MOBILITY_ORDER.filter((network) => !present.has(network))
}

/** Phrase unique pour les réseaux sans arrêt dans le rayon. `null` si les cinq sont là. */
export function absentNearbyLabel(networks: readonly CorridorNetworkId[]): string | null {
  if (networks.length === 0) return null
  const labels = networks.map((id) => NEARBY_MOBILITY_KIND[id].replace(/^Arrêts |^Stations |^Bus /, ''))
  const joined = labels.length === 1
    ? labels[0]
    : `${labels.slice(0, -1).join(', ')} ni ${labels[labels.length - 1]}`
  return `Aucun arrêt ${joined} dans ce rayon.`
}

/** Garde-fou : les cinq identifiants de mobilité restent ceux du catalogue. */
export function nearbyMobilityCatalogCoversAllNetworks(): boolean {
  return MOBILITY_IDS.every((id) => NEARBY_MOBILITY_ORDER.includes(id))
}
