/**
 * Politique commune d'acceptation des sources du réseau Dakar Bus.
 * Une date ancienne ne disqualifie jamais, à elle seule, une source traçable.
 */
export interface SourceEvidence {
  sourceUrl: string
  sourceLabel: string
  dataLastUpdated?: string | null
}
export interface SourceEvidenceAssessment {
  accepted: boolean
  provenanceStatus: 'SOURCED' | 'MISSING_PROVENANCE'
  dateStatus: 'DATED' | 'DATE_UNKNOWN' | 'INVALID_DATE'
  dataLastUpdated: string | null
  freshnessWarning: boolean
  reason: string
}
export function assessSourceEvidence(evidence: SourceEvidence): SourceEvidenceAssessment {
  const sourceUrl = typeof evidence?.sourceUrl === 'string' ? evidence.sourceUrl.trim() : ''
  const sourceLabel = typeof evidence?.sourceLabel === 'string' ? evidence.sourceLabel.trim() : ''
  const hasProvenance = Boolean(sourceUrl && sourceLabel)
  const rawDate = typeof evidence?.dataLastUpdated === 'string' ? evidence.dataLastUpdated.trim() : ''
  const timestamp = rawDate ? Date.parse(rawDate) : Number.NaN
  const dateStatus = !rawDate ? 'DATE_UNKNOWN' : Number.isFinite(timestamp) ? 'DATED' : 'INVALID_DATE'
  const accepted = hasProvenance
  return {
    accepted,
    provenanceStatus: hasProvenance ? 'SOURCED' : 'MISSING_PROVENANCE',
    dateStatus,
    dataLastUpdated: dateStatus === 'DATED' ? new Date(timestamp).toISOString() : null,
    // A freshness warning is for review only; it never rejects a sourced record.
    freshnessWarning: dateStatus === 'DATED' && Date.now() - timestamp > 365 * 24 * 60 * 60 * 1000,
    reason: !hasProvenance
      ? 'Source URL and source label are both required.'
      : dateStatus === 'DATED'
        ? 'Source retained because its provenance is documented; date is metadata, not an exclusion rule.'
        : 'Source retained because its provenance is documented; source date is unavailable or invalid.',
  }
}
