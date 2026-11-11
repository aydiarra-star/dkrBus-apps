import { describe, expect, it } from 'vitest'
import route from './aftu-84-directions.json'

describe('parcours CETUD AFTU 84', () => {
  it('conserve les 73 arrêts dans l’ordre Jaxaay 2 → UCAD', () => {
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('84')
    expect(route.frequency.intervalMinutes).toBe(14)
    expect(route.waypoints).toHaveLength(73)
    expect(route.waypoints[0]).toBe('Jaxaay 2 Pénitence')
    expect(route.waypoints.at(-1)).toBe('Terminus 84_54Derrière Ucad En Face Canal 4')
  })

  it('conserve les 73 arrêts dans l’ordre inverse pour le retour', () => {
    expect(route.inboundWaypoints).toHaveLength(73)
    expect(route.inboundWaypoints).toEqual([...route.waypoints].reverse())
  })

  it('ne contient aucun arrêt dupliqué dans le sens aller', () => {
    expect(new Set(route.waypoints).size).toBe(73)
  })
})
