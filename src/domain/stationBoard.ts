/**
 * Tableau des créneaux théoriques, station par station et sens par sens.
 *
 * CE MODULE N'EST PAS UN FLUX TEMPS RÉEL ET N'EN SIMULE PAS UN.
 *
 * Pour le TER, chaque tronçon possède sa propre cadence et son propre
 * terminus de référence ; le segment AIBD n'est desservi que par la grille
 * Diamniadio ↔ AIBD. Le BRT conserve son calcul de référence (distance à vol
 * d'oiseau / vitesse commerciale + arrêts). Les deux sens sont distincts.
 *
 * La phase exacte de la grille au départ de chaque terminus n'est pas
 * déclarée publiquement : les créneaux du sens retour projettent la même
 * grille depuis le terminus opposé, sans inventer de décalage. Ce que ce
 * module produit reste un horaire théorique issu d'une fréquence — jamais
 * une position de véhicule, jamais un retard constaté, jamais une promesse.
 *
 * Les réseaux sans ligne publiée (DDD, AFTU, TATA) ne renvoient aucune
 * station : la structure est prête à les afficher dès que des lignes
 * publiées existeront, sans autre changement d'interface.
 */

import { CORRIDOR_LINES, getCorridorStop, haversineMeters, type CorridorStop } from './corridors'
import { terTravelTimeMidpointMinutes } from './terTravelTimes'
import type { OfficialFrequency } from './frequencies'
import { dwellMinutes } from './assumptions'
import { nextReferencePassage, type NextPassage } from './headways'
import type { NetworkId } from './network'

/** Ligne exploitable par le tableau : tout réseau peut en publier une. */
export interface BoardLine {
  id: string
  network: NetworkId
  shortName: string
  longName: string
  stopIds: readonly string[]
  /** Vitesse commerciale moyenne déclarée (km/h). */
  speedKph: number
  officialFrequencies: readonly OfficialFrequency[]
}

/** Une station et ses deux créneaux théoriques, aller et retour. */
export interface StationRow {
  stop: CorridorStop
  /** Temps de parcours de référence depuis le terminus d'origine (minutes). */
  offsetFromOriginMin: number
  /** Temps de parcours de référence depuis le terminus opposé (minutes). */
  offsetFromDestinationMin: number
  /** Sens aller (départ du terminus d'origine) : nul au terminus opposé. */
  outbound: NextPassage | null
  /** Sens retour (départ du terminus opposé) : nul au terminus d'origine. */
  inbound: NextPassage | null
  /** À Diamniadio seulement : prochain train aller qui poursuit jusqu'à AIBD. */
  outboundAirport?: NextPassage | null
  /** À Diamniadio seulement : prochain train retour en provenance d'AIBD. */
  inboundAirport?: NextPassage | null
}

export interface StationBoard {
  line: BoardLine
  /** Station d'origine de la ligne (sens aller au départ de celle-ci). */
  originStop: CorridorStop
  /** Terminus opposé (sens retour au départ de celui-ci). */
  destinationStop: CorridorStop
  rows: readonly StationRow[]
}

/** Temps de parcours de référence entre deux stations consécutives (min). */
function segmentMinutes(line: BoardLine, index: number): number {
  const a = getCorridorStop(line.stopIds[index])
  const b = getCorridorStop(line.stopIds[index + 1])
  if (!a || !b) return 0
  return (haversineMeters(a, b) / 1000 / line.speedKph) * 60
}

/**
 * Construit le tableau d'une ligne : pour chaque station desservie, le
 * prochain créneau théorique dans chaque sens. Les identifiants d'arrêt non
 * résolus sont ignorés — aucune station n'est inventée.
 */
export function buildStationBoard(line: BoardLine, now = Date.now()): StationBoard | null {
  const stops = line.stopIds
    .map((stopId) => getCorridorStop(stopId))
    .filter((stop): stop is CorridorStop => stop !== null)
  if (stops.length < 2) return null

  const dwell = dwellMinutes(line.network)
  const originStop = stops[0]
  const destinationStop = stops[stops.length - 1]

  const terDiamniadioIndex = line.network === 'ter' ? stops.findIndex((stop) => stop.id === 'ter-diamniadio') : -1
  const terDiamniadioOffset = line.network === 'ter' ? terTravelTimeMidpointMinutes('ter-diamniadio') : 0
  const terTotalOffset = line.network === 'ter' ? terTravelTimeMidpointMinutes(destinationStop.id) : 0

  const terDakarDiamniadio = line.network === 'ter'
    ? line.officialFrequencies.filter((frequency) => frequency.routeSegment === 'DAKAR_DIAMNIADIO')
    : []
  const terDiamniadioAibd = line.network === 'ter'
    ? line.officialFrequencies.filter((frequency) => frequency.routeSegment === 'DIAMNIADIO_AIBD')
    : []

  const rows: StationRow[] = stops.map((stop, index) => {
    let fromOrigin = 0
    let fromDestination = 0
    if (line.network === 'ter') {
      // Les heures sont propagées depuis le terminus de la mission :
      // départ Dakar + offset cumulé, ou départ AIBD + offset retour.
      fromOrigin = terTravelTimeMidpointMinutes(stop.id)
      fromDestination = Math.max(0, terTotalOffset - fromOrigin)
    } else {
      for (let i = 0; i < index; i += 1) fromOrigin += segmentMinutes(line, i)
      fromOrigin += Math.max(0, index - 1) * dwell
      for (let i = index; i < stops.length - 1; i += 1) fromDestination += segmentMinutes(line, i)
      fromDestination += Math.max(0, stops.length - 2 - index) * dwell
    }

    let outbound: NextPassage | null
    let inbound: NextPassage | null
    let outboundAirport: NextPassage | null = null
    let inboundAirport: NextPassage | null = null

    if (line.network === 'ter') {
      if (index < terDiamniadioIndex) {
        // Dakar → Bargny : tous les trains, cadence commune de 8 minutes.
        outbound = nextReferencePassage(terDakarDiamniadio, now, fromOrigin)
        // Tous les trains qui repartent de Diamniadio vers Dakar : 8 minutes.
        inbound = nextReferencePassage(
          terDakarDiamniadio,
          now,
          Math.max(0, terDiamniadioOffset - fromOrigin),
        )
      } else if (index === terDiamniadioIndex) {
        // Gare charnière : elle est desservie toutes les 8 minutes dans les
        // deux sens, mais seuls un train sur trois poursuit vers / vient d'AIBD.
        outbound = nextReferencePassage(terDakarDiamniadio, now, fromOrigin)
        // Le tronc commun retour est ancré à Diamniadio (offset zéro).
        // Les missions venant d'AIBD sont affichées séparément ci-dessous.
        inbound = nextReferencePassage(terDakarDiamniadio, now, 0)
        outboundAirport = nextReferencePassage(terDiamniadioAibd, now, fromOrigin)
        inboundAirport = nextReferencePassage(
          terDiamniadioAibd,
          now,
          Math.max(0, terTotalOffset - terDiamniadioOffset),
        )
      } else {
        // Après Diamniadio : uniquement les missions prolongées jusqu'à AIBD.
        outbound = nextReferencePassage(terDiamniadioAibd, now, fromOrigin)
        inbound = nextReferencePassage(terDiamniadioAibd, now, fromDestination)
      }
    } else {
      outbound = index === stops.length - 1
        ? null
        : nextReferencePassage(line.officialFrequencies, now, fromOrigin)
      inbound = index === 0
        ? null
        : nextReferencePassage(line.officialFrequencies, now, fromDestination)
    }

    return {
      stop,
      offsetFromOriginMin: fromOrigin,
      offsetFromDestinationMin: fromDestination,
      outbound: index === stops.length - 1 ? null : outbound,
      inbound: index === 0 ? null : inbound,
      ...(index === terDiamniadioIndex ? { outboundAirport, inboundAirport } : {}),
    }
  })

  return { line, originStop, destinationStop, rows }
}

/**
 * Lignes publiées d'un réseau, prêtes pour le tableau par station. Aujourd'hui
 * seuls TER et BRT publient des lignes de référence ; DDD, AFTU et TATA
 * reviendront ici dès que des lignes leur seront publiées — l'interface les
 * affichera alors sans autre changement.
 */
export function boardLinesForNetwork(networkId: NetworkId): readonly BoardLine[] {
  return CORRIDOR_LINES.filter((line) => line.network === networkId)
}

/** Libellé court d'une station pour les en-têtes compacts. */
export function stationShortName(stop: CorridorStop): string {
  return stop.shortName ?? stop.name
}
