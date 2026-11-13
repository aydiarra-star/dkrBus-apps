import { describe, expect, it } from 'vitest'
import route from './aftu-84-directions.json'

describe('parcours AFTU 84', () => {
  it('conserve les 73 arrêts transmis pour le sens Jaxaay 2 → UCAD', () => {
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('84')
    expect(route.frequency.intervalMinutes).toBe(14)
    expect(route.waypoints).toHaveLength(73)
    expect(route.waypoints[0]).toBe('Jaxaay 2 Pénitence')
    expect(route.waypoints.at(-1)).toBe('Terminus 84_54Derrière Ucad En Face Canal 4')
    expect(route.directions.outbound.waypoints).toEqual(route.waypoints)
  })

  it('conserve le retour transmis avec ses 73 horaires et ses deux arrêts terminaux', () => {
    const inbound = route.directions.inbound
    expect(route.inboundStatus).toBe('USER_PROVIDED_PENDING_SOURCE')
    expect(inbound.origin).toBe('Delafosse Commerce')
    expect(inbound.destination).toBe('Jaxaay 2 Pénitence')
    expect(inbound.waypoints).toHaveLength(75)
    expect(inbound.times).toHaveLength(75)
    expect(inbound.times.filter(Boolean)).toHaveLength(73)
    expect(inbound.times[0]).toBe('05:49')
    expect(inbound.times[72]).toBe('07:09')
    expect(inbound.times[73]).toBeNull()
    expect(inbound.times[74]).toBeNull()
    expect(inbound.waypoints.slice(-3)).toEqual([
      'Jaxaay2 Route Du 84',
      'Jaxaay A Côté Pharmacie Marie Essentene Manga',
      'Jaxaay 2 Pénitence'
    ])
    expect(route.inboundWaypoints).toEqual(inbound.waypoints)
    expect(route.stopCount).toEqual({ outbound: 73, inbound: 75 })
  })
})
