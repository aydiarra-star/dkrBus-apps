/**
 * Grille tarifaire de référence — la même que celle que connaît l'assistant,
 * étendue au calcul d'un prix d'itinéraire.
 *
 * Ce module ne devine aucun prix :
 * - TER et BRT publient une grille par zones, transcrite ici avec sa source et
 *   sa date de consultation ; le calcul additionne le ticket de chaque course
 *   selon les zones réellement traversées ;
 * - DDD, AFTU et TATA ne publient pas de tarif ligne par ligne dans les fiches
 *   consultées : le montant reste `null` et l'itinéraire affiche « tarif non
 *   déclaré » au lieu d'un chiffre approchant ;
 * - une correspondance entre deux réseaux n'est pas un billet combiné : aucun
 *   tarif commun n'étant publié, le total est une **somme des tickets**, jamais
 *   un prix guichet garanti.
 *
 * Aucun abonnement, aucune réduction, aucune gratuité n'est appliqué
 * automatiquement : les conditions d'âge et de pièce restent à vérifier au
 * guichet. Les montants sont en francs CFA (XOF), seule devise documentée.
 */

import { BRT_STOPS, getCorridorStop, networkOfStopId, type CorridorLine } from './corridors'
import type { MobilityId } from './mobilityColors'

/** Date de consultation de la mémoire documentaire (mobility-lines.json). */
export const FARE_CONSULTED_AT = '2026-10-10'

const SOURCES = {
  terFares: 'https://www.terdakar.sn/ticket-voyage-aller-simple-de-quoi-s-agit-il/',
  terSubscriptions: 'https://www.terdakar.sn/quel-titre-choisir/',
  brtGuide: 'https://cetud.sn/wp-content/uploads/2024/11/sunubrt-guide-du-voyageur-vf.pdf',
  cetud: 'https://cetud.sn/reseaux-de-transport/',
} as const

export type FareClass = 'second' | 'first'
export type FareBasis = 'OFFICIAL_ZONE_TABLE' | 'NOT_PUBLISHED'

export interface FareGridRow {
  label: string
  amountCfa: number | null
}

export interface FareGrid {
  network: MobilityId
  label: string
  basis: FareBasis
  rows: readonly FareGridRow[]
  sourceUrl: string
  /** Les fiches DDD/AFTU ne publient ni montant ni date de tarification. */
  sourceLabel: string
  note: string
}

/** TER Dakar — tickets aller simple, 2e et 1re classe, par nombre de zones. */
export const TER_FARE_ROWS: readonly FareGridRow[] = [
  { label: '1 zone · 2e classe', amountCfa: 500 },
  { label: '2 zones · 2e classe', amountCfa: 1000 },
  { label: '3 zones · 2e classe', amountCfa: 1500 },
  { label: '1re classe (toutes zones)', amountCfa: 2500 },
]

/** SunuBRT — ticket par zone traversée, d'après le guide du voyageur. */
export const BRT_FARE_ROWS: readonly FareGridRow[] = [
  { label: 'Dans une même zone', amountCfa: 400 },
  { label: 'En franchissant une ou deux limites de zones', amountCfa: 500 },
]

const NOT_PUBLISHED_ROWS = (network: string): FareGridRow[] => [
  { label: `${network} : tarif ligne par ligne non publié dans la fiche consultée`, amountCfa: null },
]

export const FARE_GRIDS: Record<MobilityId, FareGrid> = {
  ter: {
    network: 'ter',
    label: 'TER',
    basis: 'OFFICIAL_ZONE_TABLE',
    rows: TER_FARE_ROWS,
    sourceUrl: SOURCES.terFares,
    sourceLabel: 'TER Dakar — ticket aller simple',
    note: 'Grille de référence consultée le 2026-10-10 ; enfants de moins de 5 ans annoncés gratuits. Un abonnement se calcule autrement.',
  },
  brt: {
    network: 'brt',
    label: 'BRT (SunuBRT)',
    basis: 'OFFICIAL_ZONE_TABLE',
    rows: BRT_FARE_ROWS,
    sourceUrl: SOURCES.brtGuide,
    sourceLabel: 'SunuBRT — guide du voyageur',
    note: 'Grille du guide du voyageur ; le titre se valide à l’entrée et à la sortie. Enfants de moins de 4 ans accompagnés annoncés gratuits.',
  },
  ddd: {
    network: 'ddd',
    label: 'Dakar Dem Dikk',
    basis: 'NOT_PUBLISHED',
    rows: NOT_PUBLISHED_ROWS('DDD'),
    sourceUrl: SOURCES.cetud,
    sourceLabel: 'CETUD — réseaux de transport',
    note: 'Aucun tarif ligne par ligne dans les fiches consultées : le montant reste non déclaré plutôt qu’estimé.',
  },
  aftu: {
    network: 'aftu',
    label: 'AFTU',
    basis: 'NOT_PUBLISHED',
    rows: NOT_PUBLISHED_ROWS('AFTU'),
    sourceUrl: SOURCES.cetud,
    sourceLabel: 'CETUD — réseaux de transport',
    note: 'Tarif non publié dans les fiches consultées : à confirmer au receveur ou auprès d’AFTU.',
  },
  tata: {
    network: 'tata',
    label: 'TATA',
    basis: 'NOT_PUBLISHED',
    rows: NOT_PUBLISHED_ROWS('TATA'),
    sourceUrl: SOURCES.cetud,
    sourceLabel: 'CETUD — réseaux de transport',
    note: 'Les minibus TATA ne publient pas de grille dans la mémoire du dépôt : aucun montant n’est supposé.',
  },
}

/** Zones TER déclarées dans le référentiel (`note` de chaque gare). */
export function terZoneOf(stopId: string): 1 | 2 | 3 | null {
  const note = getCorridorStop(stopId)?.note ?? ''
  const match = /zone\s*([123])/i.exec(note)
  if (!match) return null
  return Number(match[1]) as 1 | 2 | 3
}

/**
 * Zones SunuBRT, telles que les découpe le guide du voyageur :
 * zone 1 de Papa Gueye Fall à Liberté 6, zone 2 de Khar Yalla à Croisement 22,
 * zone 3 de Parcelles à la Préfecture de Guédiawaye. Les bornes sont retrouvées
 * dans l'ordre de desserte des 23 stations, sans ressaisie de liste.
 */
const BRT_ZONE_BOUNDS: readonly { from: string; to: string; zone: 1 | 2 | 3 }[] = [
  { from: 'petersen – papa gueye fall', to: 'liberté 6', zone: 1 },
  { from: 'khar yalla', to: 'croisement 22', zone: 2 },
  { from: 'parcelles', to: 'préfecture de guédiawaye', zone: 3 },
]

function normalizeName(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

let brtZoneByOrder: Map<number, 1 | 2 | 3> | null = null

function brtZones(): Map<number, 1 | 2 | 3> {
  if (brtZoneByOrder) return brtZoneByOrder
  const stops = allBrtStops()
  const byName = new Map(stops.map((stop) => [normalizeName(stop.name), stop.order]))
  const ranges = BRT_ZONE_BOUNDS.flatMap((bound) => {
    const from = byName.get(normalizeName(bound.from))
    const to = byName.get(normalizeName(bound.to))
    return from === undefined || to === undefined ? [] : [{ from, to, zone: bound.zone }]
  })
  const zones = new Map<number, 1 | 2 | 3>()
  for (const range of ranges) {
    for (let order = Math.min(range.from, range.to); order <= Math.max(range.from, range.to); order += 1) {
      zones.set(order, range.zone)
    }
  }
  brtZoneByOrder = zones
  return zones
}

/** Import direct : les 23 stations BRT portent déjà l'ordre de desserte. */
function allBrtStops(): readonly { name: string; order: number }[] {
  return BRT_STOPS
}

export function brtZoneOf(stopId: string): 1 | 2 | 3 | null {
  const stop = getCorridorStop(stopId)
  if (!stop || !stopId.startsWith('brt-')) return null
  return brtZones().get(stop.order) ?? null
}

export function zoneOf(stopId: string): 1 | 2 | 3 | null {
  if (networkOfStopId(stopId) === 'ter') return terZoneOf(stopId)
  if (networkOfStopId(stopId) === 'brt') return brtZoneOf(stopId)
  return null
}

/** Ticket d'une course, d'après la grille du réseau. `null` si non déclaré. */
export interface RideFare {
  lineId: string
  shortName: string
  network: MobilityId
  amountCfa: number | null
  basis: FareBasis
  zonesCrossed: number | null
  fromZone: number | null
  toZone: number | null
  sourceUrl: string | null
  note: string
}

export function fareForRide(line: CorridorLine, fromStopId: string, toStopId: string, options: { terClass?: FareClass } = {}): RideFare {
  const grid = FARE_GRIDS[line.network]
  const base = {
    lineId: line.id,
    shortName: line.shortName,
    network: line.network,
    basis: grid.basis,
    sourceUrl: grid.sourceUrl,
  }
  if (grid.basis === 'NOT_PUBLISHED') {
    return { ...base, amountCfa: null, zonesCrossed: null, fromZone: null, toZone: null, note: grid.note }
  }
  const fromZone = zoneOf(fromStopId)
  const toZone = zoneOf(toStopId)
  if (fromZone === null || toZone === null) {
    return {
      ...base,
      amountCfa: null,
      zonesCrossed: null,
      fromZone,
      toZone,
      note: `Zone de ${fromZone === null ? 'débarquement' : 'embarquement'} non déclarée pour ${line.shortName} : tarif non calculé.`,
    }
  }
  const span = Math.abs(toZone - fromZone) + 1
  if (line.network === 'ter') {
    if (options.terClass === 'first') {
      return { ...base, amountCfa: 2500, zonesCrossed: span, fromZone, toZone, note: '1re classe : montant unique quelle que soit la zone.' }
    }
    const amount = [500, 1000, 1500][Math.min(2, span - 1)] ?? null
    return {
      ...base,
      amountCfa: amount,
      zonesCrossed: span,
      fromZone,
      toZone,
      note: `Ticket 2e classe pour ${span} zone${span > 1 ? 's' : ''} parcourue${span > 1 ? 's' : ''} (zones ${fromZone} → ${toZone}).`,
    }
  }
  return {
    ...base,
    amountCfa: span === 1 ? 400 : 500,
    zonesCrossed: span,
    fromZone,
    toZone,
    note: span === 1 ? 'Titre SunuBRT dans une même zone.' : `Titre SunuBRT avec ${span - 1} limite${span - 1 > 1 ? 's' : ''} de zone${span - 1 > 1 ? 's' : ''} franchie${span - 1 > 1 ? 's' : ''}.`,
  }
}

export type JourneyFareStatus = 'KNOWN' | 'PARTIAL' | 'UNKNOWN'

export interface JourneyFare {
  status: JourneyFareStatus
  /** Somme des tickets des courses dont le tarif est déclaré. */
  totalCfa: number | null
  /** Part connue quand un réseau du trajet ne publie pas son tarif. */
  knownSubtotalCfa: number | null
  legs: readonly RideFare[]
  note: string
}

export function fareForJourney(
  rides: readonly { line: CorridorLine; fromStopId: string; toStopId: string }[],
  options: { terClass?: FareClass } = {},
): JourneyFare {
  const legs = rides.map((ride) => fareForRide(ride.line, ride.fromStopId, ride.toStopId, options))
  return summarizeFare(legs)
}

export function summarizeFare(legs: readonly RideFare[]): JourneyFare {
  const known = legs.filter((leg) => leg.amountCfa !== null)
  const total = known.reduce((sum, leg) => sum + (leg.amountCfa ?? 0), 0)
  if (legs.length === 0) return { status: 'UNKNOWN', totalCfa: null, knownSubtotalCfa: null, legs, note: 'Aucune course tarifée dans ce trajet.' }
  if (known.length === legs.length) {
    return {
      status: 'KNOWN',
      totalCfa: total,
      knownSubtotalCfa: total,
      legs,
      note: 'Somme des tickets de référence de chaque course. Aucun billet combiné n’est publié entre réseaux : ce total n’est pas un guichet unique.',
    }
  }
  const missing = [...new Set(legs.filter((leg) => leg.amountCfa === null).map((leg) => leg.shortName))]
  return {
    status: known.length === 0 ? 'UNKNOWN' : 'PARTIAL',
    totalCfa: null,
    knownSubtotalCfa: known.length === 0 ? null : total,
    legs,
    note: `Tarif non déclaré pour : ${missing.join(', ')}. La part calculée ci-dessus ne couvre que les courses dont la grille est publiée.`,
  }
}

/** « 900 F CFA », « tarif non déclaré », « à partir de 400 F CFA ». */
export function fareStatusLabel(fare: JourneyFare): string {
  if (fare.status === 'KNOWN' && fare.totalCfa !== null) return `${formatCfa(fare.totalCfa)}`
  if (fare.status === 'PARTIAL' && fare.knownSubtotalCfa !== null) return `${formatCfa(fare.knownSubtotalCfa)} + tarif non déclaré`
  if (fare.legs.length > 0 && fare.legs.every((leg) => leg.basis === 'NOT_PUBLISHED')) return 'tarif non déclaré'
  return 'tarif indisponible'
}

export function formatCfa(amount: number | null): string {
  if (amount === null) return 'non déclaré'
  return `${amount.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} F CFA`
}

/** Grille lisible pour l'assistant et les Paramètres. */
export function fareGridSummaryText(): string {
  const lines = (Object.keys(FARE_GRIDS) as MobilityId[]).map((id) => {
    const grid = FARE_GRIDS[id]
    const rows = grid.rows.map((row) => `  – ${row.label} : ${row.amountCfa === null ? 'non déclaré' : formatCfa(row.amountCfa)}`).join('\n')
    return `• ${grid.label} (${grid.basis === 'OFFICIAL_ZONE_TABLE' ? 'grille publiée' : 'aucune grille publiée'})\n${rows}\n  Source : ${grid.sourceUrl} · consultée le ${FARE_CONSULTED_AT}`
  })
  return `Grille tarifaire de référence :\n${lines.join('\n')}\nUn total d’itinéraire est une somme de tickets, pas un billet combiné ; les abonnements, réductions et gratuités ne sont pas appliqués automatiquement (${SOURCES.terSubscriptions}).`
}
