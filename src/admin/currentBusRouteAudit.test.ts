import { describe, expect, it } from 'vitest'
import { BIDIRECTIONAL_BUS_LINES } from '../domain/bidirectionalBusLines'
import { getCurrentBusRouteAudit } from './currentBusRouteAudit'

describe('getCurrentBusRouteAudit', () => {
  it('audits every catalogue line and both directions without modifying the catalogue', () => {
    const before = JSON.stringify(BIDIRECTIONAL_BUS_LINES)
    const report = getCurrentBusRouteAudit()

    expect(report.analyzedLines).toBe(BIDIRECTIONAL_BUS_LINES.length)
    expect(report.analyzedDirections).toBe(BIDIRECTIONAL_BUS_LINES.length * 2)
    expect(report.completeLines).toBe(0)
    expect(report.counts.DIRECTION_NOT_VERIFIED).toBe(report.analyzedDirections)
    expect(report.findings.every((finding) => finding.status === 'NEEDS_HUMAN_REVIEW')).toBe(true)
    expect(JSON.stringify(BIDIRECTIONAL_BUS_LINES)).toBe(before)
  })

  it('exposes AFTU source evidence separately from the passenger catalogue audit', () => {
    const report = getCurrentBusRouteAudit()
    expect(report.aftuEvidence).toHaveLength(23)
    expect(report.aftuEvidence.find((route) => route.line === '86')?.inbound.waypoints).toHaveLength(64)
    expect(report.aftuEvidence.find((route) => route.line === '87')?.inbound.waypoints).toHaveLength(71)
    expect(report.aftuEvidence.find((route) => route.line === '83')?.inbound.waypoints).toEqual([])
    expect(report.aftuEvidence.find((route) => route.line === '84')?.inbound.timetableEntries).toBe(73)
    expect(report.aftuEvidence.find((route) => route.line === '85')?.outbound.hasPerStopTimes).toBe(false)
  })

  it('does not infer inbound stops from outbound stops', () => {
    const report = getCurrentBusRouteAudit()
    const inboundFindings = report.findings.filter((finding) =>
      finding.direction === 'inbound' && finding.kind === 'MISSING_DIRECTION_STOPS',
    )

    expect(inboundFindings).toHaveLength(BIDIRECTIONAL_BUS_LINES.length)
    expect(inboundFindings.every((finding) => finding.stopCount === 0)).toBe(true)
  })

  it('retains network, line, direction and source provenance on every finding', () => {
    const report = getCurrentBusRouteAudit()

    expect(report.findings.length).toBeGreaterThan(0)
    for (const finding of report.findings) {
      expect(['ddd', 'aftu', 'tata']).toContain(finding.network)
      expect(finding.line.trim()).not.toBe('')
      expect(['outbound', 'inbound']).toContain(finding.direction)
      expect(finding.sourceUrl.startsWith('https://')).toBe(true)
      expect(finding.sourceLabel.trim()).not.toBe('')
    }
  })
})
