import { describe, expect, it } from 'vitest'
import line88 from './aftu-88-directions.json'
import line89 from './aftu-89-directions.json'
import line90 from './aftu-90-directions.json'
import line91 from './aftu-91-directions.json'

describe('AFTU lines 88–91: supplied directional sequences', () => {
  it('preserves the 78 outbound and 81 inbound occurrences of line 88', () => {
    expect(line88.network).toBe('aftu')
    expect(line88.code).toBe('88')
    expect(line88.stopCount).toEqual({ outbound: 78, inbound: 81 })
    expect(line88.directions.outbound.waypoints).toHaveLength(78)
    expect(line88.directions.inbound.waypoints).toHaveLength(81)
    expect(line88.directions.outbound.waypoints[0]).toBe('Terminus 88')
    expect(line88.directions.outbound.waypoints.at(-1)).toBe('Terminus Liberté 5')
    expect(line88.directions.inbound.waypoints[0]).toBe('Terminus Liberté 5')
    expect(line88.directions.inbound.waypoints.at(-1)).toBe('Terminus 88')
    expect(line88.directions.outbound.waypoints).not.toEqual(line88.directions.inbound.waypoints)
  })

  it('preserves the 55 outbound and 53 inbound occurrences of line 89, including repeated labels', () => {
    expect(line89.network).toBe('aftu')
    expect(line89.code).toBe('89')
    expect(line89.stopCount).toEqual({ outbound: 55, inbound: 53 })
    expect(line89.directions.outbound.waypoints).toHaveLength(55)
    expect(line89.directions.inbound.waypoints).toHaveLength(53)
    expect(line89.directions.outbound.waypoints.filter((stop) => stop === 'Arrêt Keur Massar')).toHaveLength(2)
    expect(line89.directions.inbound.waypoints.filter((stop) => stop === 'Keur Massar')).toHaveLength(2)
    expect(line89.directions.outbound.waypoints).not.toEqual(line89.directions.inbound.waypoints)
  })

  it('preserves both validated 82-occurrence sequences of line 90', () => {
    expect(line90.network).toBe('aftu')
    expect(line90.code).toBe('90')
    expect(line90.stopCount).toEqual({ outbound: 82, inbound: 82 })
    expect(line90.directions.outbound.waypoints).toHaveLength(82)
    expect(line90.directions.inbound.waypoints).toHaveLength(82)
    expect(line90.directions.outbound.waypoints[0]).toBe('Terminus 90 (Départ)')
    expect(line90.directions.outbound.waypoints.at(-1)).toBe('Deni Birame Ndao Nord (Terminus)')
    expect(line90.directions.inbound.waypoints[0]).toBe('Deni Birame Ndao Nord (Départ)')
    expect(line90.directions.inbound.waypoints.at(-1)).toBe('Terminus 90 (Terminus)')
    expect(line90.sourceStatus).toBe('user-validated-directional-sequences')
    expect('times' in line90.directions.outbound).toBe(false)
    expect('times' in line90.directions.inbound).toBe(false)
  })

  it('preserves both validated 70-occurrence CETUD sequences of line 91', () => {
    expect(line91.network).toBe('aftu')
    expect(line91.code).toBe('91')
    expect(line91.stopCount).toEqual({ outbound: 70, inbound: 70 })
    expect(line91.directions.outbound.waypoints).toHaveLength(70)
    expect(line91.directions.inbound.waypoints).toHaveLength(70)
    expect(line91.directions.outbound.waypoints[0]).toBe('Losso (Départ)')
    expect(line91.directions.outbound.waypoints.at(-1)).toBe('Terminus 91 (Terminus)')
    expect(line91.directions.inbound.waypoints[0]).toBe('Chez Lo électricien (Départ)')
    expect(line91.directions.inbound.waypoints.at(-1)).toBe('Losso (Terminus)')
    expect(line91.sourceStatus).toBe('user-validated-cetud-sequences')
    expect('times' in line91.directions.outbound).toBe(false)
    expect('times' in line91.directions.inbound).toBe(false)
  })

  it('does not fabricate frequencies, coordinates, or stop passage times', () => {
    for (const route of [line88, line89, line90, line91]) {
      expect('frequency' in route).toBe(false)
      expect('operatingProfile' in route).toBe(false)
      expect('times' in route.directions.outbound).toBe(false)
      expect('times' in route.directions.inbound).toBe(false)
      expect('coordinates' in route.directions.outbound).toBe(false)
      expect('coordinates' in route.directions.inbound).toBe(false)
    }
  })
})
