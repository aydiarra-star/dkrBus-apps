import { describe, expect, it } from 'vitest'
import { CORRIDOR_LINES } from './corridors'
import { verifiedDddJourneyRouteSegments } from './dddJourneyRouteGeometry'
import type { PlannerLeg } from './planner'
import type { DddArcgisMapTrack } from './dddArcgisMapGeometry'

const dddLine = CORRIDOR_LINES.find((line) => line.shortName === 'DDD 1')!

function ride(fromId: string, toId: string, intermediateStopIds: string[] = []): PlannerLeg {
  return {
    kind: 'ride',
    line: dddLine,
    fromId,
    toId,
    intermediateStopIds,
    minutes: 10,
  }
}

const stops = [
  { id: 'ddd-parcelles', lat: 14.7608, lon: -17.4393 },
  { id: 'ddd-liberte-5', lat: 14.7358, lon: -17.4557 },
  { id: 'ddd-liberte-6', lat: 14.7282, lon: -17.4573 },
  { id: 'ddd-khar-yalla', lat: 14.7142, lon: -17.4532 },
  { id: 'ddd-colobane', lat: 14.6938, lon: -17.4442 },
  { id: 'ddd-petersen', lat: 14.6705, lon: -17.4352 },
  { id: 'ddd-leclerc', lat: 14.6661, lon: -17.4315 },
]

const track: DddArcgisMapTrack = {
  id: 'ddd-arcgis-1-fixture',
  line: '1',
  part: 0,
  positions: [
    [14.7610, -17.4392],
    [14.7480, -17.4470],
    [14.7360, -17.4555],
    [14.7280, -17.4570],
    [14.7140, -17.4530],
    [14.6940, -17.4440],
    [14.6700, -17.4350],
    [14.6660, -17.4310],
  ],
}

describe('verified DDD journey route geometry', () => {
  it('slices a DDD ArcGIS shape only when all ride stops align in travel order', () => {
    const [segment] = verifiedDddJourneyRouteSegments([
      ride('ddd-parcelles', 'ddd-petersen', ['ddd-liberte-5', 'ddd-liberte-6', 'ddd-khar-yalla', 'ddd-colobane']),
    ], [track])

    expect(segment).toBeDefined()
    expect(segment?.network).toBe('ddd')
    expect(segment?.line).toBe('1')
    expect(segment?.positions.length).toBeGreaterThan(2)
    expect(segment?.sourceLabel).toContain('actualité du parcours non certifiée')
  })

  it('refuses the reverse direction when the source shape runs the other way', () => {
    expect(verifiedDddJourneyRouteSegments([
      ride('ddd-petersen', 'ddd-parcelles', ['ddd-colobane', 'ddd-khar-yalla', 'ddd-liberte-6', 'ddd-liberte-5']),
    ], [track])).toEqual([])
  })

  it('refuses a track whose line code does not match the selected DDD line', () => {
    expect(verifiedDddJourneyRouteSegments([
      ride('ddd-parcelles', 'ddd-petersen'),
    ], [{ ...track, line: '4' }])).toEqual([])
  })

  it('refuses a shape that misses an intermediate stop', () => {
    const shifted = { ...track, positions: track.positions.map(([lat, lon], index) =>
      index === 3 ? [lat + 0.01, lon + 0.01] as [number, number] : [lat, lon] as [number, number],
    ) }
    expect(verifiedDddJourneyRouteSegments([
      ride('ddd-parcelles', 'ddd-petersen', ['ddd-liberte-5', 'ddd-liberte-6', 'ddd-khar-yalla', 'ddd-colobane']),
    ], [shifted])).toEqual([])
  })

  it('does not create a chord when no DDD source geometry is available', () => {
    expect(verifiedDddJourneyRouteSegments([
      ride('ddd-parcelles', 'ddd-petersen'),
    ], [])).toEqual([])
  })
})
