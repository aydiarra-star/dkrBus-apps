/**
 * Read-only audit of the two directions recorded for DDD / AFTU / TATA lines.
 * It never creates a return by reversing the outbound sequence and never changes
 * the passenger catalogue. Every finding remains a human-review candidate.
 */
import {
  validateBusDirection,
  type BidirectionalBusLine,
  type BusDirectionId,
  type BusDirectionStatus,
} from '../domain/bidirectionalBusLines'

export type DirectionAuditFindingKind =
  | 'MISSING_DIRECTION_STOPS'
  | 'DIRECTION_NOT_VERIFIED'
  | 'INVALID_DIRECTION_SEQUENCE'

export interface DirectionAuditFinding {
  id: string
  kind: DirectionAuditFindingKind
  status: 'NEEDS_HUMAN_REVIEW'
  network: BidirectionalBusLine['network']
  line: string
  direction: BusDirectionId
  directionStatus: BusDirectionStatus
  stopCount: number
  origin: string
  destination: string
  sourceUrl: string
  sourceLabel: string
  evidence: string[]
}

export interface DirectionAuditReport {
  findings: DirectionAuditFinding[]
  counts: Record<DirectionAuditFindingKind, number>
  analyzedLines: number
  analyzedDirections: number
  completeLines: number
}

/**
 * A direction is complete only when its own ordered stops are present, its
 * status is explicitly verified, and the existing domain validator accepts it.
 * The opposite direction is never used as a fallback or reversed automatically.
 */
export function auditBidirectionalBusLines(
  lines: readonly BidirectionalBusLine[],
): DirectionAuditReport {
  const findings: DirectionAuditFinding[] = []
  let completeLines = 0

  for (const line of lines) {
    let lineComplete = true
    const directions: BusDirectionId[] = ['outbound', 'inbound']

    for (const directionId of directions) {
      const direction = line.directions[directionId]
      const errors = validateBusDirection(direction)
      const base = {
        status: 'NEEDS_HUMAN_REVIEW' as const,
        network: line.network,
        line: line.line,
        direction: directionId,
        directionStatus: direction.status,
        stopCount: direction.stopIds.length,
        origin: direction.origin,
        destination: direction.destination,
        sourceUrl: direction.sourceUrl,
        sourceLabel: direction.sourceLabel,
      }

      if (direction.stopIds.length < 2) {
        lineComplete = false
        findings.push({
          ...base,
          id: `missing-direction-stops:${line.network}:${line.line}:${directionId}`,
          kind: 'MISSING_DIRECTION_STOPS',
          evidence: ['Aucune séquence ordonnée complète de ce sens (au moins deux arrêts) n’est enregistrée.'],
        })
      }

      if (direction.status !== 'verified') {
        lineComplete = false
        findings.push({
          ...base,
          id: `direction-not-verified:${line.network}:${line.line}:${directionId}`,
          kind: 'DIRECTION_NOT_VERIFIED',
          evidence: [
            `Statut actuel : ${direction.status}.`,
            'Une séquence présente ou un terminus de catalogue ne suffit pas à valider le sens.',
          ],
        })
      }

      if (errors.length) {
        lineComplete = false
        findings.push({
          ...base,
          id: `invalid-direction-sequence:${line.network}:${line.line}:${directionId}`,
          kind: 'INVALID_DIRECTION_SEQUENCE',
          evidence: errors,
        })
      }
    }

    if (lineComplete) completeLines += 1
  }

  const counts: DirectionAuditReport['counts'] = {
    MISSING_DIRECTION_STOPS: 0,
    DIRECTION_NOT_VERIFIED: 0,
    INVALID_DIRECTION_SEQUENCE: 0,
  }
  for (const finding of findings) counts[finding.kind] += 1

  return {
    findings,
    counts,
    analyzedLines: lines.length,
    analyzedDirections: lines.length * 2,
    completeLines,
  }
}
