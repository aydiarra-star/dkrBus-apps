import { describe, expect, it } from 'vitest'
import {
  TER_DURATIONS_SAME_BOTH_DIRECTIONS,
  TER_SEGMENT_TRAVEL_TIMES,
  TER_STATION_TRAVEL_TIMES,
  terCumulativeMidpoint,
  terSegmentMidpoint,
} from './terTravelTimes'

describe('durées TER relevées dans TER INFOS', () => {
  it('conserve les 14 gares dans l’ordre Dakar–AIBD', () => {
    expect(TER_STATION_TRAVEL_TIMES).toHaveLength(14)
    expect(TER_STATION_TRAVEL_TIMES[0].stopId).toBe('ter-dakar')
    expect(TER_STATION_TRAVEL_TIMES[12].stopId).toBe('ter-diamniadio')
    expect(TER_STATION_TRAVEL_TIMES[13].stopId).toBe('ter-aibd')
  })

  it('conserve les plages cumulées et leur symétrie aller-retour', () => {
    expect(TER_DURATIONS_SAME_BOTH_DIRECTIONS).toBe(true)
    expect(terCumulativeMidpoint('ter-diamniadio')).toBe(44.5)
    expect(terCumulativeMidpoint('ter-aibd')).toBe(56.5)
  })

  it('distingue PNR Rufisque de la gare de Rufisque', () => {
    expect(terCumulativeMidpoint('ter-pnr')).toBe(32)
    expect(terCumulativeMidpoint('ter-rufisque')).toBe(34.5)
  })

  it('conserve 13 tronçons dérivés sans les présenter comme mesures directes', () => {
    expect(TER_SEGMENT_TRAVEL_TIMES).toHaveLength(13)
    expect(TER_SEGMENT_TRAVEL_TIMES.every((segment) =>
      segment.derivation === 'difference-of-cumulative-ranges'
    )).toBe(true)
    expect(TER_SEGMENT_TRAVEL_TIMES[12].derivedDuration).toEqual({ min: 11, max: 13 })
    expect(terSegmentMidpoint('ter-diamniadio', 'ter-aibd')).toBe(12)
  })
})
