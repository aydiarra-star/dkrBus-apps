import {
  AFTU_PUBLIC_LINE_CATALOG,
  DDD_PUBLIC_LINE_CATALOG,
  TATA_PUBLIC_LINE_CATALOG,
  type PublicBusLineReference,
} from './publicBusLineCatalog'
import { DDD_PUBLISHED_ROUTES } from '../data/dddPublishedRoutes'
import { AFTU_CETUD_SCHEDULE_SETTINGS } from '../data/aftuScheduleSettings'
import line88 from '../data/aftu-88-directions.json'
import line89 from '../data/aftu-89-directions.json'
import line91 from '../data/aftu-91-directions.json'

export type BusDirectionId = 'outbound' | 'inbound'
export type BusDirectionStatus = 'awaiting_stops' | 'sequence_validated' | 'stops_mapped' | 'verified'

export interface BusDirection {
  id: BusDirectionId
  label: string
  origin: string
  destination: string
  /** Identifiants géographiques uniquement ; vides tant qu'aucun arrêt géolocalisé n'est associé. */
  stopIds: readonly string[]
  /** Libellés ordonnés validés ; les occurrences répétées sont conservées. */
  stopNames: readonly string[]
  status: BusDirectionStatus
  sourceUrl: string
  sourceLabel: string
  sequenceValidatedByProjectOwner: boolean
}

export interface BidirectionalBusLine {
  id: string
  network: 'ddd' | 'aftu' | 'tata'
  line: string
  source: PublicBusLineReference
  serviceWindow: {
    start: string
    end: string
    source: 'CETUD-network-default'
  } | null
  directions: Readonly<Record<BusDirectionId, BusDirection>>
}

type SuppliedAftuSequence = {
  directions: Record<BusDirectionId, {
    origin: string
    destination: string
    waypoints: string[]
  }>
  sourceLabel: string
  sourceStatus: string
  validatedByProjectOwner: boolean
}

const AFTU_VALIDATED_DIRECTIONAL_SEQUENCES: Readonly<Record<string, SuppliedAftuSequence>> = {
  '88': line88,
  '89': line89,
  '91': line91,
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
    stopNames: [],
    status: 'awaiting_stops',
    sourceUrl: source.sourceUrl,
    sourceLabel: source.sourceLabel,
    sequenceValidatedByProjectOwner: false,
  }
}

function makeValidatedAftuDirection(
  source: PublicBusLineReference,
  id: BusDirectionId,
  sequence: SuppliedAftuSequence['directions'][BusDirectionId],
  sourceLabel: string,
  validatedByProjectOwner: boolean,
): BusDirection {
  return {
    id,
    label: id === 'outbound' ? 'Aller' : 'Retour',
    origin: sequence.origin,
    destination: sequence.destination,
    stopIds: [],
    stopNames: [...sequence.waypoints],
    status: 'sequence_validated',
    sourceUrl: source.sourceUrl,
    sourceLabel: `${sourceLabel} · séquence validée par le responsable du projet`,
    sequenceValidatedByProjectOwner: validatedByProjectOwner,
  }
}

/**
 * Les séquences DDD publiées dans un ordre terminus-à-terminus alimentent
 * uniquement le sens documenté. Les circuits restent au registre documentaire.
 */
const DDD_OUTBOUND_BY_LINE = new Map(
  DDD_PUBLISHED_ROUTES
    .filter((route) => route.kind === 'published_order')
    .map((route) => [route.line, route] as const),
)

function registerLine(source: PublicBusLineReference): BidirectionalBusLine {
  const aftuSequence = source.network === 'aftu'
    ? AFTU_VALIDATED_DIRECTIONAL_SEQUENCES[source.line]
    : undefined

  if (aftuSequence) {
    return {
      id: `${source.network}-${source.line}`,
      network: source.network,
      line: source.line,
      source,
      serviceWindow: {
        ...AFTU_CETUD_SCHEDULE_SETTINGS.generalServiceWindow,
        source: 'CETUD-network-default',
      },
      directions: {
        outbound: makeValidatedAftuDirection(source, 'outbound', aftuSequence.directions.outbound, aftuSequence.sourceLabel, aftuSequence.validatedByProjectOwner),
        inbound: makeValidatedAftuDirection(source, 'inbound', aftuSequence.directions.inbound, aftuSequence.sourceLabel, aftuSequence.validatedByProjectOwner),
      },
    }
  }

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
    serviceWindow: source.network === 'aftu'
      ? {
          ...AFTU_CETUD_SCHEDULE_SETTINGS.generalServiceWindow,
          source: 'CETUD-network-default',
        }
      : null,
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
  if (direction.status === 'sequence_validated' && direction.stopNames.length < 2) {
    errors.push('Une séquence validée doit contenir au moins deux occurrences')
  }
  if (direction.status !== 'awaiting_stops' && direction.status !== 'sequence_validated' && direction.stopIds.length < 2) {
    errors.push('Un parcours cartographié doit contenir au moins deux identifiants d’arrêts')
  }
  if (new Set(direction.stopIds).size !== direction.stopIds.length) {
    errors.push('Un identifiant géographique apparaît plusieurs fois dans le même sens')
  }
  if (direction.status === 'verified' && direction.stopIds.length < 2) {
    errors.push('Un sens géolocalisé vérifié doit posséder une séquence d’identifiants')
  }
  return errors
}

export function getBusDirectionReadiness(line: BidirectionalBusLine): {
  outbound: boolean
  inbound: boolean
  complete: boolean
} {
  const ready = (direction: BusDirection) =>
    (direction.status === 'sequence_validated' || direction.status === 'verified')
    && validateBusDirection(direction).length === 0
  const outbound = ready(line.directions.outbound)
  const inbound = ready(line.directions.inbound)
  return { outbound, inbound, complete: outbound && inbound }
}
