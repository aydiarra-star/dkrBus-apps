import {
  AFTU_PUBLIC_LINE_CATALOG,
  DDD_PUBLIC_LINE_CATALOG,
  TATA_PUBLIC_LINE_CATALOG,
  type PublicBusLineReference,
} from './publicBusLineCatalog'
import { DDD_PUBLISHED_ROUTES } from '../data/dddPublishedRoutes'

export type BusDirectionId = 'outbound' | 'inbound'
export type BusDirectionStatus = 'awaiting_stops' | 'stops_mapped' | 'verified'

export interface BusDirection {
  id: BusDirectionId
  label: string
  origin: string
  destination: string
  /** Arrêts ordonnés et propres à CE sens ; jamais déduits du sens opposé. */
  stopIds: readonly string[]
  status: BusDirectionStatus
  sourceUrl: string
  sourceLabel: string
}

export interface BidirectionalBusLine {
  id: string
  network: 'ddd' | 'aftu' | 'tata'
  line: string
  source: PublicBusLineReference
  directions: Readonly<Record<BusDirectionId, BusDirection>>
}

function makeDirection(
  source: PublicBusLineReference,
  id: BusDirectionId,
  origin: string,
  destination: string,
): BusDirection {
  return {
    id,
    label: id === 'outbound' ? 'Aller' : 'Retour',
    origin,
    destination,
    stopIds: [],
    status: 'awaiting_stops',
    sourceUrl: source.sourceUrl,
    sourceLabel: source.sourceLabel,
  }
}

/**
 * Les séquences DDD publiées dans un ordre terminus-à-terminus alimentent
 * uniquement le sens documenté. Les circuits restent au registre documentaire
 * et ne sont pas artificiellement séparés en Aller/Retour.
 */
const DDD_OUTBOUND_BY_LINE = new Map(
  DDD_PUBLISHED_ROUTES
    .filter((route) => route.kind === 'published_order')
    .map((route) => [route.line, route] as const),
)

function registerLine(source: PublicBusLineReference): BidirectionalBusLine {
  const outbound = makeDirection(source, 'outbound', source.origin, source.destination)
  const publishedDddRoute = source.network === 'ddd'
    ? DDD_OUTBOUND_BY_LINE.get(source.line)
    : undefined
  const mappedOutbound: BusDirection = publishedDddRoute
    ? {
        ...outbound,
        origin: publishedDddRoute.origin,
        destination: publishedDddRoute.destination,
        stopIds: [...publishedDddRoute.stops],
        status: 'stops_mapped',
        sourceUrl: publishedDddRoute.sourceUrl,
        sourceLabel: publishedDddRoute.sourceLabel,
      }
    : outbound

  return {
    id: `${source.network}-${source.line}`,
    network: source.network,
    line: source.line,
    source,
    directions: {
      outbound: mappedOutbound,
      inbound: makeDirection(source, 'inbound', source.destination, source.origin),
    },
  }
}

export const BIDIRECTIONAL_BUS_LINES: readonly BidirectionalBusLine[] = [
  ...DDD_PUBLIC_LINE_CATALOG,
  ...AFTU_PUBLIC_LINE_CATALOG,
  ...TATA_PUBLIC_LINE_CATALOG,
].map(registerLine)

export function getBusLineDirections(
  network: BidirectionalBusLine['network'],
  line: string,
): BidirectionalBusLine | null {
  return BIDIRECTIONAL_BUS_LINES.find((item) => item.network === network && item.line === line) ?? null
}

export function validateBusDirection(direction: BusDirection): string[] {
  const errors: string[] = []
  if (!direction.origin.trim() || !direction.destination.trim()) errors.push('Terminus manquant')
  if (direction.origin === direction.destination) errors.push('Les deux terminus doivent être distincts')
  if (direction.status !== 'awaiting_stops' && direction.stopIds.length < 2) {
    errors.push('Un parcours renseigné doit contenir au moins deux arrêts')
  }
  if (new Set(direction.stopIds).size !== direction.stopIds.length) {
    errors.push('Un arrêt apparaît plusieurs fois dans le même sens')
  }
  if (direction.status === 'verified' && direction.stopIds.length < 2) {
    errors.push('Un sens vérifié doit posséder une séquence d’arrêts')
  }
  return errors
}

export function getBusDirectionReadiness(line: BidirectionalBusLine): {
  outbound: boolean
  inbound: boolean
  complete: boolean
} {
  const outbound = line.directions.outbound.status === 'verified'
    && validateBusDirection(line.directions.outbound).length === 0
  const inbound = line.directions.inbound.status === 'verified'
    && validateBusDirection(line.directions.inbound).length === 0
  return { outbound, inbound, complete: outbound && inbound }
}
