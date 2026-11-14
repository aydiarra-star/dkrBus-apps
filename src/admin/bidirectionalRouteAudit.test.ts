import { describe, expect, it } from 'vitest'
import { auditBidirectionalBusLines } from './bidirectionalRouteAudit'
import type { BidirectionalBusLine, BusDirection } from '../domain/bidirectionalBusLines'

const source = {
  line: '7',
  origin: 'Petersen',
  destination: 'Ouakam',
  network: 'aftu' as const,
  sourceUrl: 'https://aftu-senegal.org/infos-pratiques/',
  sourceLabel: 'AFTU Sénégal',
}

function direction(
  id: 'outbound' | 'inbound',
  origin: string,
  destination: string,
  stopIds: string[],
  status: BusDirection['status'],
): BusDirection {
  return {
    id,
    label: id === 'outbound' ? 'Aller' : 'Retour',
    origin,
    destination,
    stopIds,
    status,
    sourceUrl: source.sourceUrl,
    sourceLabel: source.sourceLabel,
  }
}

function lineWith(
  outbound: BusDirection,
  inbound: BusDirection,
): BidirectionalBusLine {
  return {
    id: 'aftu-7',
    network: 'aftu',
    line: '7',
    source,
    serviceWindow: null,
    directions: { outbound, inbound },
  }
}

describe('auditBidirectionalBusLines', () => {
  it('does not manufacture a return by reversing the outbound sequence', () => {
    const line = lineWith(
      direction('outbound', 'Petersen', 'Ouakam', ['a', 'b', 'c'], 'stops_mapped'),
      direction('inbound', 'Ouakam', 'Petersen', [], 'awaiting_stops'),
    )

    const report = auditBidirectionalBusLines([line])

    expect(report.analyzedLines).toBe(1)
    expect(report.analyzedDirections).toBe(2)
    expect(report.completeLines).toBe(0)
    expect(report.counts.MISSING_DIRECTION_STOPS).toBe(1)
    expect(report.findings.some((finding) =>
      finding.kind === 'MISSING_DIRECTION_STOPS' && finding.direction === 'inbound',
    )).toBe(true)
    expect(line.directions.inbound.stopIds).toEqual([])
  })

  it('does not treat a mapped sequence as verified', () => {
    const report = auditBidirectionalBusLines([lineWith(
      direction('outbound', 'Petersen', 'Ouakam', ['a', 'b'], 'stops_mapped'),
      direction('inbound', 'Ouakam', 'Petersen', ['c', 'd'], 'stops_mapped'),
    )])

    expect(report.counts.DIRECTION_NOT_VERIFIED).toBe(2)
    expect(report.completeLines).toBe(0)
  })

  it('counts a line complete only when both independently supplied directions are verified and valid', () => {
    const report = auditBidirectionalBusLines([lineWith(
      direction('outbound', 'Petersen', 'Ouakam', ['a', 'b'], 'verified'),
      direction('inbound', 'Ouakam', 'Petersen', ['c', 'd'], 'verified'),
    )])

    expect(report.completeLines).toBe(1)
    expect(report.findings).toEqual([])
  })

  it('flags repeated stops in a direction without silently repairing the sequence', () => {
    const repeated = ['a', 'b', 'a']
    const line = lineWith(
      direction('outbound', 'Petersen', 'Ouakam', repeated, 'verified'),
      direction('inbound', 'Ouakam', 'Petersen', ['c', 'd'], 'verified'),
    )
    const report = auditBidirectionalBusLines([line])

    expect(report.counts.INVALID_DIRECTION_SEQUENCE).toBe(1)
    expect(report.findings.find((finding) =>
      finding.kind === 'INVALID_DIRECTION_SEQUENCE',
    )?.direction).toBe('outbound')
    expect(line.directions.outbound.stopIds).toEqual(repeated)
  })
})
