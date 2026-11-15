/**
 * Durées de parcours TER relevées par l'utilisateur dans l'application TER INFOS
 * le 15 novembre 2026. Les plages sont les durées cumulées depuis Dakar,
 * confirmées identiques dans les deux sens par l'utilisateur.
 *
 * Les durées entre gares sont des bornes calculées par soustraction de plages
 * cumulées indépendantes ; elles ne sont PAS des mesures directes d'un même train.
 * Les points médians servent uniquement à la projection arithmétique des
 * créneaux du tableau de stations. Les plages originales restent conservées.
 */

export interface MinuteRange {
  min: number
  max: number
}

export interface TerStationTravelTime {
  stopId: string
  station: string
  cumulativeFromDakar: MinuteRange
}

export interface TerSegmentTravelTime {
  fromStopId: string
  toStopId: string
  derivedDuration: MinuteRange
  derivation: 'difference-of-cumulative-ranges'
}

export const TER_DURATIONS_SAME_BOTH_DIRECTIONS = true as const

export const TER_STATION_TRAVEL_TIMES: readonly TerStationTravelTime[] = [
  { stopId: 'ter-dakar', station: 'Dakar', cumulativeFromDakar: { min: 0, max: 0 } },
  { stopId: 'ter-colobane', station: 'Colobane', cumulativeFromDakar: { min: 3, max: 3 } },
  { stopId: 'ter-hann', station: 'Hann', cumulativeFromDakar: { min: 7, max: 8 } },
  { stopId: 'ter-dalifort', station: 'Dalifort', cumulativeFromDakar: { min: 10, max: 11 } },
  { stopId: 'ter-baux-maraichers', station: 'Baux Maraîchers', cumulativeFromDakar: { min: 13, max: 14 } },
  { stopId: 'ter-pikine', station: 'Pikine', cumulativeFromDakar: { min: 15, max: 17 } },
  { stopId: 'ter-thiaroye', station: 'Thiaroye', cumulativeFromDakar: { min: 19, max: 20 } },
  { stopId: 'ter-yeumbeul', station: 'Yeumbeul', cumulativeFromDakar: { min: 22, max: 24 } },
  { stopId: 'ter-mbao', station: 'Keur Mbaye Fall', cumulativeFromDakar: { min: 27, max: 28 } },
  { stopId: 'ter-pnr', station: 'PNR Rufisque', cumulativeFromDakar: { min: 31, max: 33 } },
  { stopId: 'ter-rufisque', station: 'Rufisque', cumulativeFromDakar: { min: 34, max: 35 } },
  { stopId: 'ter-bargny', station: 'Bargny', cumulativeFromDakar: { min: 39, max: 41 } },
  { stopId: 'ter-diamniadio', station: 'Diamniadio', cumulativeFromDakar: { min: 44, max: 45 } },
  { stopId: 'ter-aibd', station: 'Aéroport Blaise Diagne (AIBD)', cumulativeFromDakar: { min: 56, max: 57 } },
]

function midpoint(range: MinuteRange): number {
  return (range.min + range.max) / 2
}

export function terCumulativeMidpoint(stopId: string): number | null {
  const station = TER_STATION_TRAVEL_TIMES.find((item) => item.stopId === stopId)
  return station ? midpoint(station.cumulativeFromDakar) : null
}

export function terSegmentMidpoint(fromStopId: string, toStopId: string): number | null {
  const fromIndex = TER_STATION_TRAVEL_TIMES.findIndex((item) => item.stopId === fromStopId)
  const toIndex = TER_STATION_TRAVEL_TIMES.findIndex((item) => item.stopId === toStopId)
  if (fromIndex < 0 || toIndex !== fromIndex + 1) return null
  const from = midpoint(TER_STATION_TRAVEL_TIMES[fromIndex].cumulativeFromDakar)
  const to = midpoint(TER_STATION_TRAVEL_TIMES[toIndex].cumulativeFromDakar)
  return to - from
}

export function terCumulativeRange(stopId: string): MinuteRange | null {
  return TER_STATION_TRAVEL_TIMES.find((item) => item.stopId === stopId)?.cumulativeFromDakar ?? null
}

export const TER_SEGMENT_TRAVEL_TIMES: readonly TerSegmentTravelTime[] =
  TER_STATION_TRAVEL_TIMES.slice(1).map((station, index) => {
    const previous = TER_STATION_TRAVEL_TIMES[index]
    return {
      fromStopId: previous.stopId,
      toStopId: station.stopId,
      derivedDuration: {
        min: station.cumulativeFromDakar.min - previous.cumulativeFromDakar.max,
        max: station.cumulativeFromDakar.max - previous.cumulativeFromDakar.min,
      },
      derivation: 'difference-of-cumulative-ranges',
    }
  })
