/**
 * Deterministic, read-only audit primitives for the private Dakar Bus review console.
 *
 * This module never edits a stop, assigns coordinates, reorders a route or publishes
 * a correction. Findings are evidence bundles for a human reviewer, not decisions.
 */

export type AuditDirection = 'OUTBOUND' | 'INBOUND' | 'UNKNOWN'

export interface AuditSource {
  type: 'OFFICIAL' | 'GTFS' | 'OSM' | 'COMMUNITY' | 'HISTORICAL_REFERENCE' | 'UNKNOWN'
  reference: string
  observedAt?: string | null
}

export interface AuditStop {
  id: string
  name: string
  lat?: number | null
  lon?: number | null
  source?: AuditSource | null
}

export interface AuditLineSequence {
  network: string
  lineId: string
  direction: AuditDirection
  stopIds: readonly string[]
  source?: AuditSource | null
}

export type StopAuditFindingKind =
  | 'MISSING_COORDINATES'
  | 'INVALID_COORDINATES'
  | 'POSSIBLE_DUPLICATE_NAME'
  | 'REPEATED_STOP_IN_SEQUENCE'
  | 'UNKNOWN_STOP_REFERENCE'

export interface StopAuditFinding {
  id: string
  kind: StopAuditFindingKind
  status: 'NEEDS_HUMAN_REVIEW'
  stopIds: string[]
  lineContexts: Array<{
    network: string
    lineId: string
    direction: AuditDirection
    index: number
    previousStopId: string | null
    nextStopId: string | null
    source: AuditSource | null
  }>
  evidence: string[]
  sources: AuditSource[]
}

export interface StopSequenceAuditReport {
  findings: StopAuditFinding[]
  counts: Record<StopAuditFindingKind, number>
  analyzedStops: number
  analyzedSequences: number
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function hasValidCoordinates(stop: AuditStop): boolean {
  return typeof stop.lat === 'number'
    && Number.isFinite(stop.lat)
    && stop.lat >= -90
    && stop.lat <= 90
    && typeof stop.lon === 'number'
    && Number.isFinite(stop.lon)
    && stop.lon >= -180
    && stop.lon <= 180
}

function sourceList(...sources: Array<AuditSource | null | undefined>): AuditSource[] {
  const seen = new Set<string>()
  return sources.filter((source): source is AuditSource => {
    if (!source) return false
    const key = `${source.type}:${source.reference}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Build a deterministic report from already-loaded records. Inputs are treated as
 * untrusted data. A missing or suspicious coordinate is reported, never inferred.
 */
export function auditStopSequences(
  stops: readonly AuditStop[],
  sequences: readonly AuditLineSequence[],
): StopSequenceAuditReport {
  const stopById = new Map(stops.map((stop) => [stop.id, stop]))
  const contextsByStop = new Map<string, StopAuditFinding['lineContexts']>()
  const findings: StopAuditFinding[] = []

  for (const sequence of sequences) {
    sequence.stopIds.forEach((stopId, index) => {
      const contexts = contextsByStop.get(stopId) ?? []
      contexts.push({
        network: sequence.network,
        lineId: sequence.lineId,
        direction: sequence.direction,
        index,
        previousStopId: index > 0 ? sequence.stopIds[index - 1] : null,
        nextStopId: index + 1 < sequence.stopIds.length ? sequence.stopIds[index + 1] : null,
        source: sequence.source ?? null,
      })
      contextsByStop.set(stopId, contexts)

      if (!stopById.has(stopId)) {
        findings.push({
          id: `unknown-reference:${sequence.network}:${sequence.lineId}:${sequence.direction}:${index}:${stopId}`,
          kind: 'UNKNOWN_STOP_REFERENCE',
          status: 'NEEDS_HUMAN_REVIEW',
          stopIds: [stopId],
          lineContexts: [contexts[contexts.length - 1]],
          evidence: ['La séquence référence un identifiant absent du jeu d’arrêts fourni.'],
          sources: sourceList(sequence.source),
        })
      }
    })

    const seenAt = new Map<string, number>()
    sequence.stopIds.forEach((stopId, index) => {
      const firstIndex = seenAt.get(stopId)
      if (firstIndex !== undefined) {
        findings.push({
          id: `repeated-stop:${sequence.network}:${sequence.lineId}:${sequence.direction}:${stopId}:${index}`,
          kind: 'REPEATED_STOP_IN_SEQUENCE',
          status: 'NEEDS_HUMAN_REVIEW',
          stopIds: [stopId],
          lineContexts: [firstIndex, index].map((position) => ({
            network: sequence.network,
            lineId: sequence.lineId,
            direction: sequence.direction,
            index: position,
            previousStopId: position > 0 ? sequence.stopIds[position - 1] : null,
            nextStopId: position + 1 < sequence.stopIds.length ? sequence.stopIds[position + 1] : null,
            source: sequence.source ?? null,
          })),
          evidence: [`Le même identifiant apparaît aux positions ${firstIndex + 1} et ${index + 1} de la séquence.`],
          sources: sourceList(sequence.source),
        })
      } else {
        seenAt.set(stopId, index)
      }
    })
  }

  for (const stop of stops) {
    const contexts = contextsByStop.get(stop.id) ?? []
    const sources = sourceList(stop.source, ...contexts.map((context) => context.source))

    if (stop.lat == null || stop.lon == null) {
      findings.push({
        id: `missing-coordinates:${stop.id}`,
        kind: 'MISSING_COORDINATES',
        status: 'NEEDS_HUMAN_REVIEW',
        stopIds: [stop.id],
        lineContexts: contexts,
        evidence: [
          'Latitude ou longitude absente.',
          contexts.length
            ? 'Les lignes, sens et arrêts voisins sont fournis comme contexte de revue, pas comme preuve GPS.'
            : 'Aucune séquence de ligne fournie pour contextualiser cet arrêt.',
        ],
        sources,
      })
    } else if (!hasValidCoordinates(stop)) {
      findings.push({
        id: `invalid-coordinates:${stop.id}`,
        kind: 'INVALID_COORDINATES',
        status: 'NEEDS_HUMAN_REVIEW',
        stopIds: [stop.id],
        lineContexts: contexts,
        evidence: ['Les coordonnées ne sont pas des nombres finis dans les plages latitude [-90, 90] et longitude [-180, 180].'],
        sources,
      })
    }
  }

  const idsByNormalizedName = new Map<string, string[]>()
  for (const stop of stops) {
    const normalized = normalizeName(stop.name)
    if (!normalized) continue
    const ids = idsByNormalizedName.get(normalized) ?? []
    ids.push(stop.id)
    idsByNormalizedName.set(normalized, ids)
  }

  for (const [normalizedName, ids] of idsByNormalizedName) {
    const distinctIds = [...new Set(ids)]
    if (distinctIds.length < 2) continue
    const relatedContexts = distinctIds.flatMap((id) => contextsByStop.get(id) ?? [])
    findings.push({
      id: `possible-duplicate-name:${normalizedName.replace(/ /g, '-')}`,
      kind: 'POSSIBLE_DUPLICATE_NAME',
      status: 'NEEDS_HUMAN_REVIEW',
      stopIds: distinctIds,
      lineContexts: relatedContexts,
      evidence: [
        `Même nom après normalisation textuelle : « ${normalizedName} ».`,
        'Une similarité de nom ne prouve pas que les arrêts sont identiques : quais opposés, plateformes et variantes doivent rester distincts tant qu’un humain n’a pas vérifié.',
      ],
      sources: sourceList(...distinctIds.map((id) => stopById.get(id)?.source), ...relatedContexts.map((context) => context.source)),
    })
  }

  const counts: StopSequenceAuditReport['counts'] = {
    MISSING_COORDINATES: 0,
    INVALID_COORDINATES: 0,
    POSSIBLE_DUPLICATE_NAME: 0,
    REPEATED_STOP_IN_SEQUENCE: 0,
    UNKNOWN_STOP_REFERENCE: 0,
  }
  for (const finding of findings) counts[finding.kind] += 1

  return {
    findings,
    counts,
    analyzedStops: stops.length,
    analyzedSequences: sequences.length,
  }
}
