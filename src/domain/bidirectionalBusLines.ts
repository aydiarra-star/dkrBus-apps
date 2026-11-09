import {
  AFTU_PUBLIC_LINE_CATALOG,
  DDD_PUBLIC_LINE_CATALOG,
  TATA_PUBLIC_LINE_CATALOG,
  type PublicBusLineReference,
} from './publicBusLineCatalog'

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
 * Chaque ligne DDD, AFTU et TATA possède deux parcours indépendants dès le
 * référentiel. Les listes d'arrêts sont volontairement vides tant que leur
 * ordre et leur position n'ont pas été établis à partir d'une fiche de trajet,
 * d'une carte exploitable ou d'un relevé cartographique vérifiable.
 *
 * Important : le retour n'est PAS créé en inversant l'aller. Les deux sens
 * peuvent emprunter des rues et des arrêts différents.
 */
function registerLine(source: PublicBusLineReference): BidirectionalBusLine {
  return {
    id: `${source.network}-${source.line}`,
    network: source.network,
    line: source.line,
    source,
    directions: {
      outbound: makeDirection(source, 'outbound', source.origin, source.destination),
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
