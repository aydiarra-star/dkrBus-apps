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

  it('integrates published DDD one-way sequences into their own outbound direction', () => {
    const route = DDD_PUBLISHED_ROUTES.find((item) => item.line === '1')!
    const line = getBusLineDirections('ddd', '1')!
    expect(line.directions.outbound.status).toBe('stops_mapped')
    expect(line.directions.outbound.stopIds).toEqual(route.stops)
    expect(line.directions.outbound.sourceUrl).toBe(route.sourceUrl)
    expect(line.directions.inbound.status).toBe('awaiting_stops')
    expect(line.directions.inbound.stopIds).toEqual([])
    expect(getBusDirectionReadiness(line).complete).toBe(false)
  })

  it('does not split published DDD circuits into fabricated directions', () => {
    for (const lineNumber of ['18', '20']) {
      const line = getBusLineDirections('ddd', lineNumber)!
      expect(line.directions.outbound.status).toBe('awaiting_stops')
      expect(line.directions.inbound.status).toBe('awaiting_stops')
    }
  })

  it('does not invent stop sequences for AFTU or TATA', () => {
    for (const network of ['aftu', 'tata'] as const) {
      for (const line of BIDIRECTIONAL_BUS_LINES.filter((item) => item.network === network)) {
        expect(line.directions.outbound.status).toBe('awaiting_stops')
        expect(line.directions.inbound.status).toBe('awaiting_stops')
        expect(line.directions.outbound.stopIds).toEqual([])
        expect(line.directions.inbound.stopIds).toEqual([])
      }
    }
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
