import { describe, expect, it } from 'vitest'
import { assessSourceEvidence } from './sourceEvidencePolicy'

describe('assessSourceEvidence', () => {
  it('retains a well-sourced historical dataset and records its age separately', () => {
    const result = assessSourceEvidence({
      sourceUrl: 'https://services1.arcgis.com/tKMirJrirprCZbnf/ArcGIS/rest/services/Dem_dikk_mise_a_jour/FeatureServer/0',
      sourceLabel: 'ArcGIS · Arrets_Ligne_Dakar_Dem_Dikk',
      dataLastUpdated: '2024-09-24T12:00:06Z',
    })
    expect(result.accepted).toBe(true)
    expect(result.provenanceStatus).toBe('SOURCED')
    expect(result.dateStatus).toBe('DATED')
    expect(result.freshnessWarning).toBe(true)
  })
  it('does not reject a sourced dataset when its date is unknown', () => {
    const result = assessSourceEvidence({ sourceUrl: 'https://example.org/dataset', sourceLabel: 'Dataset documenté' })
    expect(result.accepted).toBe(true)
    expect(result.dateStatus).toBe('DATE_UNKNOWN')
  })
  it('rejects records without a valid traceable HTTP(S) provenance', () => {
    const missing = assessSourceEvidence({ sourceUrl: '', sourceLabel: 'Source non identifiée', dataLastUpdated: '2026-11-17' })
    const malformed = assessSourceEvidence({ sourceUrl: 'pas-une-url', sourceLabel: 'Source sans lien vérifiable' })
    expect(missing.accepted).toBe(false)
    expect(missing.provenanceStatus).toBe('MISSING_PROVENANCE')
    expect(malformed.accepted).toBe(false)
  })
})
