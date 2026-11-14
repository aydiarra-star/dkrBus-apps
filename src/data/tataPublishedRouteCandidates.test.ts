import { describe, expect, it } from 'vitest'
import { TATA_PUBLISHED_ROUTE_CANDIDATES } from './tataPublishedRouteCandidates'

describe('TATA published route candidates', () => {
  it('keeps secondary-source route descriptions separate and human-review only', () => {
    expect(TATA_PUBLISHED_ROUTE_CANDIDATES.length).toBe(2)
    for (const candidate of TATA_PUBLISHED_ROUTE_CANDIDATES) {
      expect(candidate.sourceUrl).toContain('covoiturage.sn/bus-tata-itineraire/ligne/')
      expect(candidate.sourceLabel).toContain('source secondaire')
      expect(candidate.status).toBe('NEEDS_HUMAN_REVIEW')
      expect(candidate.directionCoverage).toBe('SINGLE_DESCRIPTION_WITH_RETURN_VARIANTS')
      expect(candidate.retrievedOn).toBe('2026-11-13')
    }
  })

  it('keeps TATA line identifiers unique within the TATA source register', () => {
    const lines = TATA_PUBLISHED_ROUTE_CANDIDATES.map((candidate) => candidate.line)
    expect(new Set(lines).size).toBe(lines.length)
  })
})
