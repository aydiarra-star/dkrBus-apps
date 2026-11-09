import { describe, expect, it } from 'vitest'
import {
  DDD_LINE_13_HISTORICAL_STOPS,
  DDD_LINE_13_LAYER_0_FEATURE_COUNT,
  DDD_LINE_13_LAYER_8_FEATURE_COUNT,
  DDD_LINE_13_SPATIAL_MATCH_COUNT,
  DDD_LINE_13_ONLY_LAYER_0_COUNT,
  DDD_LINE_13_SPATIAL_MATCH_THRESHOLD_METERS,
} from './dddLine13HistoricalMerged'

describe('DDD historical line 13 consolidated stop layers', () => {
  it('retains all 23 layer 0 points and all 22 layer 8 matches', () => {
    expect(DDD_LINE_13_LAYER_0_FEATURE_COUNT).toBe(23)
    expect(DDD_LINE_13_LAYER_8_FEATURE_COUNT).toBe(22)
    expect(DDD_LINE_13_HISTORICAL_STOPS).toHaveLength(23)
    expect(DDD_LINE_13_SPATIAL_MATCH_COUNT).toBe(22)
    expect(DDD_LINE_13_ONLY_LAYER_0_COUNT).toBe(1)
  })

  it('preserves every original source identity and keeps the unmatched terminal point', () => {
    const matched = DDD_LINE_13_HISTORICAL_STOPS.filter((stop) => stop.layer8ObjectId !== undefined)
    const unmatched = DDD_LINE_13_HISTORICAL_STOPS.filter((stop) => stop.layer8ObjectId === undefined)
    expect(matched).toHaveLength(22)
    expect(unmatched).toHaveLength(1)
    expect(unmatched[0]).toMatchObject({
      sourceOrder: 2,
      name: 'Arret Terminus Liberté 5',
      layer0ObjectId: 2,
      reconciliation: 'only_in_layer_0',
    })
    expect(new Set(matched.map((stop) => stop.layer0GlobalId)).size).toBe(22)
    expect(new Set(matched.map((stop) => stop.layer8GlobalId)).size).toBe(22)
  })

  it('marks close coordinate pairs as candidates, not proven business-stop duplicates', () => {
    const matched = DDD_LINE_13_HISTORICAL_STOPS.filter((stop) => stop.spatialMatchDistanceMeters !== undefined)
    expect(matched.every((stop) => stop.spatialMatchDistanceMeters! <= DDD_LINE_13_SPATIAL_MATCH_THRESHOLD_METERS)).toBe(true)
    expect(matched.every((stop) => stop.reconciliation === 'spatial_duplicate_candidate')).toBe(true)
  })

  it('keeps the historical route chainage strictly increasing without claiming a current direction', () => {
    const chainages = DDD_LINE_13_HISTORICAL_STOPS.map((stop) => stop.routeChainageMeters)
    expect(chainages.every((value, index) => index === 0 || value > chainages[index - 1])).toBe(true)
    expect(DDD_LINE_13_HISTORICAL_STOPS.every((stop) => stop.longitude < 0 && stop.latitude > 0)).toBe(true)
  })
})
