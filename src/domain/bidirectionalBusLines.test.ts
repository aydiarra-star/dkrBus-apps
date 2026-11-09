import { describe, expect, it } from 'vitest'
import {
  BIDIRECTIONAL_BUS_LINES,
  getBusDirectionReadiness,
  getBusLineDirections,
  validateBusDirection,
} from './bidirectionalBusLines'

describe('bidirectional bus line registry', () => {
  it('creates independent Aller and Retour directions for every public bus line', () => {
    expect(BIDIRECTIONAL_BUS_LINES.length).toBeGreaterThan(100)
    for (const line of BIDIRECTIONAL_BUS_LINES) {
      expect(line.directions.outbound.id).toBe('outbound')
      expect(line.directions.inbound.id).toBe('inbound')
      expect(line.directions.outbound.origin).toBe(line.source.origin)
      expect(line.directions.outbound.destination).toBe(line.source.destination)
      expect(line.directions.inbound.origin).toBe(line.source.destination)
      expect(line.directions.inbound.destination).toBe(line.source.origin)
      expect(line.directions.outbound.stopIds).not.toBe(line.directions.inbound.stopIds)
    }
  })

  it('keeps DDD, AFTU and TATA line identifiers in separate namespaces', () => {
    expect(getBusLineDirections('ddd', '1')?.network).toBe('ddd')
    expect(getBusLineDirections('aftu', '1')?.network).toBe('aftu')
    expect(getBusLineDirections('tata', '1')?.network).toBe('tata')
  })

  it('does not mark an empty direction as complete or verified', () => {
    const line = getBusLineDirections('aftu', '2')
    expect(line).not.toBeNull()
    expect(getBusDirectionReadiness(line!).complete).toBe(false)
    expect(validateBusDirection(line!.directions.outbound)).toEqual([])
  })

  it('rejects duplicate stops and incomplete verified directions', () => {
    const line = getBusLineDirections('ddd', '1')!
    const invalid = {
      ...line.directions.outbound,
      status: 'verified' as const,
      stopIds: ['stop-a', 'stop-a'],
    }
    expect(validateBusDirection(invalid)).toContain('Un arrêt apparaît plusieurs fois dans le même sens')
  })
})
