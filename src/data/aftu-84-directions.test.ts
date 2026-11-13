import { describe, expect, it } from 'vitest'
import route from './aftu-84-directions.json'

describe('parcours CETUD AFTU 84', () => {
  it('conserve les 73 arrêts transmis pour le sens Jaxaay 2 → UCAD', () => {
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('84')
    expect(route.frequency.intervalMinutes).toBe(14)
    expect(route.waypoints).toHaveLength(73)
    expect(route.waypoints[0]).toBe('Jaxaay 2 Pénitence')
    expect(route.waypoints.at(-1)).toBe('Terminus 84_54Derrière Ucad En Face Canal 4')
    expect(route.directions.outbound.waypoints).toEqual(route.waypoints)
  })

  it('ne fabrique pas le retour en inversant la séquence aller', () => {
    expect(route.inboundStatus).toBe('NOT_DOCUMENTED')
    expect(route.inboundNote).toContain('pas une preuve')
    expect(route.inboundWaypoints).toEqual([])
    expect(route.directions.inbound.waypoints).toEqual([])
    expect(route.stopCount).toEqual({ outbound: 73, inbound: 0 })
  })
})
