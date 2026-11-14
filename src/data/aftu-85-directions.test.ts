import { describe, expect, it } from 'vitest'
import route from './aftu-85-directions.json'

describe('parcours AFTU 85 transmis', () => {
  it('conserve les 89 occurrences de l’aller et les 95 du retour', () => {
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('85')
    expect(route.waypoints).toHaveLength(89)
    expect(route.inboundWaypoints).toHaveLength(95)
    expect(route.stopCount).toEqual({ outbound: 89, inbound: 95 })
    expect(route.waypoints[0]).toBe('Terminus De La Ligne 73')
    expect(route.waypoints.at(-1)).toBe('Terminus Liberté 5')
    expect(route.inboundWaypoints[0]).toBe('Terminus Liberté 5')
    expect(route.inboundWaypoints.at(-1)).toBe('Terminus De La Ligne 73')
    expect(route.waypoints).not.toEqual(route.inboundWaypoints)
  })

  it('préserve les occurrences répétées dans chaque sens', () => {
    expect(route.waypoints.filter((stop: string) => stop === 'Terminus De La Ligne 73')).toHaveLength(2)
    expect(route.waypoints.filter((stop: string) => stop === 'Keur Massar')).toHaveLength(2)
    expect(route.inboundWaypoints.filter((stop: string) => stop === 'Terminus De La Ligne 73')).toHaveLength(2)
    expect(route.inboundWaypoints.filter((stop: string) => stop === 'Keur Massar')).toHaveLength(2)
  })

  it('conserve la provenance et les plages de fréquence sans fabriquer de passages horaires', () => {
    expect(route.sourceLabel).toBe('Parcours transmis par l’utilisateur')
    expect(route.sourceStatus).toBe('user-provided-route-reference')
    expect(route.serviceWindow).toEqual({ start: '06:00', end: '21:00' })
    expect(route.frequency.peakRangeMinutes).toEqual([10, 15])
    expect(route.frequency.offPeakRangeMinutes).toEqual([15, 25])
    expect(route.frequency.display).toContain('10–15 min')
    expect(route.frequency.display).toContain('15–25 min')
    expect('times' in route).toBe(false)
    expect('outboundSchedule' in route).toBe(false)
    expect('inboundSchedule' in route).toBe(false)
  })
})
