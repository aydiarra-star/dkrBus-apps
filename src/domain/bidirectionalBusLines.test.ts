import { describe, expect, it } from 'vitest'
import {
  BIDIRECTIONAL_BUS_LINES,
  getBusDirectionReadiness,
  getBusLineDirections,
  validateBusDirection,
} from './bidirectionalBusLines'
import { DDD_PUBLISHED_ROUTES } from '../data/dddPublishedRoutes'

describe('bidirectional bus line registry', () => {
  it('creates independent Aller and Retour directions for every public bus line', () => {
    expect(BIDIRECTIONAL_BUS_LINES.length).toBeGreaterThan(100)
    for (const line of BIDIRECTIONAL_BUS_LINES) {
      expect(line.directions.outbound.id).toBe('outbound')
      expect(line.directions.inbound.id).toBe('inbound')
      expect(line.directions.outbound.stopNames).not.toBe(line.directions.inbound.stopNames)
    }
  })

  it('applies the CETUD 05:30–22:00 service window to every AFTU catalogue line only', () => {
    const aftuLines = BIDIRECTIONAL_BUS_LINES.filter((line) => line.network === 'aftu')
    expect(aftuLines).toHaveLength(72)
    expect(aftuLines.every((line) => line.serviceWindow?.start === '05:30' && line.serviceWindow.end === '22:00')).toBe(true)
    expect(BIDIRECTIONAL_BUS_LINES.filter((line) => line.network !== 'aftu').every((line) => line.serviceWindow === null)).toBe(true)
  })

  it('keeps DDD, AFTU and TATA line identifiers in separate namespaces', () => {
    expect(getBusLineDirections('ddd', '1')?.network).toBe('ddd')
    expect(getBusLineDirections('aftu', '1')?.network).toBe('aftu')
    expect(getBusLineDirections('tata', '1')?.network).toBe('tata')
  })

  it('integrates published DDD one-way sequences into their own outbound direction', () => {
    const route = DDD_PUBLISHED_ROUTES.find((item) => item.line === '1')!
    const line = getBusLineDirections('ddd', '1')!
    expect(line.directions.outbound.status).toBe('stops_mapped')
    expect(line.directions.outbound.stopIds).toEqual(route.stops)
    expect(line.directions.inbound.status).toBe('awaiting_stops')
    expect(line.directions.inbound.stopIds).toEqual([])
    expect(getBusDirectionReadiness(line).complete).toBe(false)
  })

  it('integrates all 78/81 validated occurrences of AFTU 88 in separate directions', () => {
    const line = getBusLineDirections('aftu', '88')!
    expect(line.directions.outbound.status).toBe('sequence_validated')
    expect(line.directions.inbound.status).toBe('sequence_validated')
    expect(line.directions.outbound.stopNames).toHaveLength(78)
    expect(line.directions.inbound.stopNames).toHaveLength(81)
    expect(line.directions.outbound.origin).toBe('Terminus 88')
    expect(line.directions.outbound.destination).toBe('Terminus Liberté 5')
    expect(line.directions.inbound.origin).toBe('Terminus Liberté 5')
    expect(line.directions.inbound.destination).toBe('Terminus 88')
    expect(getBusDirectionReadiness(line).complete).toBe(true)
  })

  it('integrates all 55/53 validated occurrences of AFTU 89 and retains repeated labels', () => {
    const line = getBusLineDirections('aftu', '89')!
    expect(line.directions.outbound.stopNames).toHaveLength(55)
    expect(line.directions.inbound.stopNames).toHaveLength(53)
    expect(line.directions.outbound.stopNames.filter((stop) => stop === 'Arrêt Keur Massar')).toHaveLength(2)
    expect(line.directions.inbound.stopNames.filter((stop) => stop === 'Keur Massar')).toHaveLength(2)
    expect(getBusDirectionReadiness(line).complete).toBe(true)
  })

  it('integrates both 70-occurrence validated CETUD directions of AFTU 91', () => {
    const line = getBusLineDirections('aftu', '91')!
    expect(line.directions.outbound.stopNames).toHaveLength(70)
    expect(line.directions.inbound.stopNames).toHaveLength(70)
    expect(line.directions.outbound.origin).toBe('Losso (Départ)')
    expect(line.directions.outbound.destination).toBe('Terminus 91 (Terminus)')
    expect(line.directions.inbound.origin).toBe('Chez Lo électricien (Départ)')
    expect(line.directions.inbound.destination).toBe('Losso (Terminus)')
    expect(getBusDirectionReadiness(line).complete).toBe(true)
  })

  it('does not split published DDD circuits into fabricated directions', () => {
    for (const lineNumber of ['18', '20']) {
      const line = getBusLineDirections('ddd', lineNumber)!
      expect(line.directions.outbound.status).toBe('awaiting_stops')
      expect(line.directions.inbound.status).toBe('awaiting_stops')
    }
  })

  it('does not invent stop sequences for other AFTU lines or TATA', () => {
    for (const network of ['aftu', 'tata'] as const) {
      for (const line of BIDIRECTIONAL_BUS_LINES.filter((item) => item.network === network)) {
        if (network === 'aftu' && ['88', '89', '91'].includes(line.line)) continue
        expect(line.directions.outbound.status).toBe('awaiting_stops')
        expect(line.directions.inbound.status).toBe('awaiting_stops')
        expect(line.directions.outbound.stopNames).toEqual([])
        expect(line.directions.inbound.stopNames).toEqual([])
      }
    }
  })

  it('accepts repeated stop names in validated sequences but rejects duplicate geographic IDs', () => {
    const line = getBusLineDirections('aftu', '89')!
    expect(validateBusDirection(line.directions.outbound)).toEqual([])
    const invalid = {
      ...line.directions.outbound,
      status: 'verified' as const,
      stopIds: ['stop-a', 'stop-a'],
    }
    expect(validateBusDirection(invalid)).toContain('Un identifiant géographique apparaît plusieurs fois dans le même sens')
  })
})
