import { describe, expect, it } from 'vitest'
import { AFTU_PUBLISHED_ROUTE_CANDIDATES } from './aftuPublishedRouteCandidates'

describe('AFTU published route candidates', () => {
  it('keeps official route descriptions as human-review candidates only', () => {
    expect(AFTU_PUBLISHED_ROUTE_CANDIDATES.length).toBe(65)
    for (const candidate of AFTU_PUBLISHED_ROUTE_CANDIDATES) {
      expect(candidate.sourceUrl).toContain('aftu-senegal.org/map/')
      expect(candidate.status).toBe('NEEDS_HUMAN_REVIEW')
      expect(candidate.directionCoverage).toBe('SINGLE_DESCRIPTION_ONLY')
      expect(candidate.retrievedOn).toBe('2026-11-13')
    }
  })

  it('contains no duplicate line references', () => {
    const lines = AFTU_PUBLISHED_ROUTE_CANDIDATES.map((candidate) => candidate.line)
    expect(new Set(lines).size).toBe(lines.length)
  })
})
