import { describe, expect, it } from 'vitest'
import route from './aftu-85-directions.json'
import { AFTU_PUBLIC_LINE_CATALOG } from '../domain/publicBusLineCatalog'

describe('attribution du parcours AFTU 85', () => {
  it('conserve le terminus officiel Banoba – Liberté 5 dans le catalogue', () => {
    expect(AFTU_PUBLIC_LINE_CATALOG.find((line) => line.line === '85')).toMatchObject({
      network: 'aftu',
      origin: 'Banoba',
      destination: 'Liberté 5',
    })
  })

  it('préserve les 89 + 95 arrêts transmis sans les attribuer à la ligne 85', () => {
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('85-unverified')
    expect(route.waypoints).toHaveLength(89)
    expect(route.inboundWaypoints).toHaveLength(95)
    expect(route.stopCount).toEqual({ outbound: 89, inbound: 95 })
    expect(route.waypoints[0]).toBe('Terminus De La Ligne 73')
    expect(route.waypoints.at(-1)).toBe('Terminus Liberté 5')
    expect(route.inboundWaypoints[0]).toBe('Terminus Liberté 5')
    expect(route.inboundWaypoints.at(-1)).toBe('Terminus De La Ligne 73')
    expect(route.waypoints).not.toEqual(route.inboundWaypoints)
  })

  it('conserve les occurrences répétées sans les dédupliquer', () => {
    expect(route.waypoints.filter((stop: string) => stop === 'Terminus De La Ligne 73')).toHaveLength(2)
    expect(route.waypoints.filter((stop: string) => stop === 'Keur Massar')).toHaveLength(2)
    expect(route.inboundWaypoints.filter((stop: string) => stop === 'Terminus De La Ligne 73')).toHaveLength(2)
    expect(route.inboundWaypoints.filter((stop: string) => stop === 'Keur Massar')).toHaveLength(2)
  })

  it('marque explicitement la séquence comme non attribuée jusqu’à identification', () => {
    expect(route.sourceLabel).toBe('Parcours transmis par l’utilisateur · attribution à vérifier')
    expect(route.sourceStatus).toBe('unassigned-route-reference')
    expect(route.note).toContain('ne correspondent pas à la ligne AFTU 85 officielle')
    expect(route.note).toContain('désattribuée')
    expect(route.serviceWindow).toEqual({ start: '06:00', end: '21:00' })
    expect(route.frequency.peakRangeMinutes).toEqual([10, 15])
    expect(route.frequency.offPeakRangeMinutes).toEqual([15, 25])
    expect('times' in route).toBe(false)
    expect('outboundSchedule' in route).toBe(false)
    expect('inboundSchedule' in route).toBe(false)
  })
})
