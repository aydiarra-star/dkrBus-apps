/**
 * Read-only audit of the two directions recorded for DDD / AFTU / TATA lines.
 * It never creates a return by reversing the outbound sequence. A sequence
 * explicitly validated by the project owner is complete as a text route even
 * before its stop names receive geographic IDs or coordinates.
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
      const sequenceCount = direction.stopNames.length || direction.stopIds.length
      const ownerValidatedSequence = direction.status === 'sequence_validated'
        && direction.sequenceValidatedByProjectOwner
        && direction.stopNames.length >= 2
      const directionVerified = direction.status === 'verified' || ownerValidatedSequence
      const base = {
        status: 'NEEDS_HUMAN_REVIEW' as const,
        network: line.network,
        line: line.line,
        direction: directionId,
        directionStatus: direction.status,
        stopCount: sequenceCount,
        origin: direction.origin,
        destination: direction.destination,
        sourceUrl: direction.sourceUrl,
        sourceLabel: direction.sourceLabel,
      }

      if (sequenceCount < 2) {
        lineComplete = false
        findings.push({
          ...base,
          id: `missing-direction-stops:${line.network}:${line.line}:${directionId}`,
          kind: 'MISSING_DIRECTION_STOPS',
          evidence: ['Aucune séquence ordonnée complète de ce sens (au moins deux occurrences) n’est enregistrée.'],
        })
      }

      if (!directionVerified) {
        lineComplete = false
        findings.push({
          ...base,
          id: `direction-not-verified:${line.network}:${line.line}:${directionId}`,
          kind: 'DIRECTION_NOT_VERIFIED',
          evidence: [
            `Statut actuel : ${direction.status}.`,
            'Une séquence présente ou un terminus de catalogue ne suffit pas ; la validation du responsable du projet est enregistrée séparément.',
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
