import { describe, expect, it } from 'vitest'
import route from './aftu-84-directions.json'

describe('parcours AFTU 84', () => {
  it('conserve les 73 arrêts transmis pour le sens Jaxaay 2 → UCAD', () => {
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('84')
    expect(route.frequency.intervalMinutes).toBe(14)
    expect(route.frequency.display).toBe('14 min')
    expect(route.frequency.status).toBe('CETUD_SOURCE_USER_SUPPLIED')
    expect(route.waypoints).toHaveLength(73)
    expect(route.waypoints[0]).toBe('Jaxaay 2 Pénitence')
    expect(route.waypoints.at(-1)).toBe('Terminus 84_54Derrière Ucad En Face Canal 4')
    expect(route.directions.outbound.waypoints).toEqual(route.waypoints)
  })

  it('conserve le retour transmis avec exactement 73 arrêts horaires', () => {
    const inbound = route.directions.inbound
    expect(route.inboundStatus).toBe('CETUD_SOURCE_USER_SUPPLIED')
    expect(inbound.origin).toBe('Delafosse Commerce')
    expect(inbound.destination).toBe('Jaxaay2 Route Du 84')
    expect(inbound.waypoints).toHaveLength(73)
    expect(inbound.times).toHaveLength(73)
    expect(inbound.times.filter(Boolean)).toHaveLength(73)
    expect(inbound.times[0]).toBe('05:49')
    expect(inbound.times[72]).toBe('07:09')
    expect(inbound.waypoints.at(-1)).toBe('Jaxaay2 Route Du 84')
    expect(route.inboundWaypoints).toEqual(inbound.waypoints)
    expect(route.stopCount).toEqual({ outbound: 73, inbound: 73 })
  })
})
