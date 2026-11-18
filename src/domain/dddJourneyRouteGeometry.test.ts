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

const track: DddArcgisMapTrack = {
  id: 'ddd-arcgis-1-fixture',
  line: '1',
  part: 0,
  positions: [
    [14.7627, -17.4243],
    [14.7500, -17.4350],
    [14.7350, -17.4500],
    [14.7210415, -17.464045],
    [14.7263088, -17.4591976],
    [14.7320392, -17.4564326],
    [14.7160, -17.4490],
    [14.7003482, -17.4416523],
    [14.6766438, -17.4406354],
    [14.6815, -17.4310],
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
