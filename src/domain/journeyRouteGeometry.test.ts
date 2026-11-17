import { describe, expect, it } from 'vitest'
import { BRT_STOPS, CORRIDOR_LINES, TER_STOPS } from './corridors'
import { BRT_B1_TRACKS } from './brtTrackGeometry'
import { TER_TRACK } from './terTrackGeometry'
import { verifiedJourneyRouteSegments } from './journeyRouteGeometry'
import type { PlannerLeg } from './planner'

const terLine = CORRIDOR_LINES.find((line) => line.network === 'ter')!
const brtLine = CORRIDOR_LINES.find((line) => line.network === 'brt')!
const dddLine = CORRIDOR_LINES.find((line) => line.network === 'ddd')!
const aftuLine = CORRIDOR_LINES.find((line) => line.network === 'aftu_tata')!

function ride(line: typeof terLine, fromId: string, toId: string): PlannerLeg {
  return { kind: 'ride', line, fromId, toId, minutes: 10 }
}

describe('verified journey route geometry', () => {
  it('slices the TER phase-one track between the selected boarding and alighting stations', () => {
    const from = TER_STOPS[0]
    const to = TER_STOPS[TER_STOPS.length - 2]
    const [segment] = verifiedJourneyRouteSegments([ride(terLine, from.id, to.id)])

    expect(segment).toBeDefined()
    expect(segment?.network).toBe('ter')
    expect(segment?.positions.length).toBeGreaterThan(2)
    expect(segment?.positions.length).toBeLessThan(TER_TRACK.positions.length)
  })

  it('does not reverse the TER source geometry when the requested ride is in the opposite direction', () => {
    const from = TER_STOPS[TER_STOPS.length - 2]
    const to = TER_STOPS[0]
    expect(verifiedJourneyRouteSegments([ride(terLine, from.id, to.id)])).toEqual([])
  })

  it('slices only the BRT B1 direction that passes the directional geometry audit', () => {
    const from = BRT_STOPS[BRT_STOPS.length - 1]
    const to = BRT_STOPS[0]
    const [segment] = verifiedJourneyRouteSegments([ride(brtLine, from.id, to.id)])

    expect(segment).toBeDefined()
    expect(segment?.network).toBe('brt')
    expect(segment?.positions.length).toBeGreaterThan(2)
    expect(segment?.positions.length).toBeLessThan(BRT_B1_TRACKS[0].positions.length)
  })

  it('does not draw the BRT direction whose source geometry fails the stop-order audit', () => {
    expect(verifiedJourneyRouteSegments([
      ride(brtLine, BRT_STOPS[0].id, BRT_STOPS[BRT_STOPS.length - 1].id),
    ])).toEqual([])
  })

  it.each([dddLine, aftuLine])('does not synthesize a route segment for %s without verified directional geometry', (line) => {
    const stops = line.stopIds
    expect(verifiedJourneyRouteSegments([ride(line, stops[0], stops[1])])).toEqual([])
  })

  it('does not draw a straight connector for walking legs', () => {
    const leg: PlannerLeg = {
      kind: 'walk_transfer',
      from: 'Gare A',
      to: 'Arrêt B',
      fromId: 'ter-dakar',
      toId: 'brt-petersen',
      distanceM: 300,
      minutes: 5,
    }
    expect(verifiedJourneyRouteSegments([leg])).toEqual([])
  })
})
