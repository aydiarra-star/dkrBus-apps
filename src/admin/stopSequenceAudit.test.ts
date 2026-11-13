import { describe, expect, it } from 'vitest'
import { auditStopSequences, type AuditLineSequence, type AuditStop } from './stopSequenceAudit'

const source = { type: 'OSM' as const, reference: 'node/123', observedAt: '2026-11-12T10:00:00Z' }

describe('auditStopSequences', () => {
  it('reports missing GPS with line direction and neighboring stop context without inventing coordinates', () => {
    const stops: AuditStop[] = [
      { id: 'a', name: 'Petersen', lat: 14.67, lon: -17.43 },
      { id: 'b', name: 'Colobane', lat: null, lon: null, source },
      { id: 'c', name: 'Hann', lat: 14.72, lon: -17.43 },
    ]
    const sequences: AuditLineSequence[] = [{
      network: 'ddd',
      lineId: '1',
      direction: 'OUTBOUND',
      stopIds: ['a', 'b', 'c'],
      source: { type: 'OFFICIAL', reference: 'operator/line-1' },
    }]

    const report = auditStopSequences(stops, sequences)
    const finding = report.findings.find((item) => item.kind === 'MISSING_COORDINATES')

    expect(finding).toBeDefined()
    expect(finding?.status).toBe('NEEDS_HUMAN_REVIEW')
    expect(finding?.lineContexts).toMatchObject([{
      network: 'ddd',
      lineId: '1',
      direction: 'OUTBOUND',
      index: 1,
      previousStopId: 'a',
      nextStopId: 'c',
    }])
    expect(finding?.evidence.join(' ')).toContain('pas comme preuve GPS')
    expect(stops[1]).toMatchObject({ lat: null, lon: null })
  })

  it('keeps repeated stop references visible instead of silently reordering the route', () => {
    const report = auditStopSequences(
      [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
      [{ network: 'aftu', lineId: '7', direction: 'INBOUND', stopIds: ['a', 'b', 'a'] }],
    )

    expect(report.counts.REPEATED_STOP_IN_SEQUENCE).toBe(1)
    expect(report.findings.find((item) => item.kind === 'REPEATED_STOP_IN_SEQUENCE')?.lineContexts.map((item) => item.index)).toEqual([0, 2])
  })

  it('reports unresolved stop identifiers in a sequence', () => {
    const report = auditStopSequences(
      [{ id: 'known', name: 'Known' }],
      [{ network: 'brt', lineId: 'B1', direction: 'OUTBOUND', stopIds: ['known', 'missing'] }],
    )

    expect(report.counts.UNKNOWN_STOP_REFERENCE).toBe(1)
    expect(report.findings.find((item) => item.kind === 'UNKNOWN_STOP_REFERENCE')?.stopIds).toEqual(['missing'])
  })

  it('groups normalized name collisions as candidates, never as confirmed duplicates', () => {
    const report = auditStopSequences([
      { id: 'platform-east', name: 'Gare de Pikine', lat: 14.75, lon: -17.39 },
      { id: 'platform-west', name: 'GARE DE PIKINE', lat: 14.751, lon: -17.391 },
      { id: 'other', name: 'Thiaroye', lat: 14.76, lon: -17.38 },
    ], [])

    const finding = report.findings.find((item) => item.kind === 'POSSIBLE_DUPLICATE_NAME')
    expect(finding?.stopIds).toEqual(['platform-east', 'platform-west'])
    expect(finding?.status).toBe('NEEDS_HUMAN_REVIEW')
    expect(finding?.evidence.join(' ')).toContain('quais opposés')
  })

  it('rejects non-finite and out-of-range coordinates but does not infer a replacement', () => {
    const stops: AuditStop[] = [
      { id: 'bad-lat', name: 'Bad latitude', lat: 91, lon: 0 },
      { id: 'bad-nan', name: 'Bad number', lat: Number.NaN, lon: -17 },
    ]
    const report = auditStopSequences(stops, [])

    expect(report.counts.INVALID_COORDINATES).toBe(2)
    expect(report.findings.every((item) => item.kind === 'INVALID_COORDINATES')).toBe(true)
    expect(stops[0].lat).toBe(91)
  })

  it('preserves source references and reports summary counts', () => {
    const report = auditStopSequences(
      [{ id: 'x', name: 'X', lat: null, lon: null, source }],
      [{ network: 'tata', lineId: '9', direction: 'UNKNOWN', stopIds: ['x'], source }],
    )

    const finding = report.findings[0]
    expect(finding.sources).toEqual([source])
    expect(report.analyzedStops).toBe(1)
    expect(report.analyzedSequences).toBe(1)
    expect(report.counts.MISSING_COORDINATES).toBe(1)
  })
})
