import { AFTU_OFFICIAL_PAGE_AUDIT } from './aftuOfficialPageAudit'
import { describe, expect, it } from 'vitest'
import { AFTU_PUBLISHED_ROUTE_CANDIDATES } from './aftuPublishedRouteCandidates'

describe('AFTU published route candidates', () => {
  it('keeps official route descriptions as human-review candidates only', () => {
    expect(AFTU_PUBLISHED_ROUTE_CANDIDATES.length).toBe(65)
    for (const candidate of AFTU_PUBLISHED_ROUTE_CANDIDATES) {
      expect(candidate.sourceUrl).toContain('aftu-senegal.org/map/')
      expect(candidate.status).toBe('NEEDS_HUMAN_REVIEW')
      expect(['SINGLE_DESCRIPTION_ONLY', 'SINGLE_DESCRIPTION_WITH_RETURN_VARIANTS']).toContain(candidate.directionCoverage)
      expect(candidate.retrievedOn).toBe('2026-11-13')
    }
  })

  it('structures the official return-route deviations for lines 2 and 5', () => {
    for (const line of ['2', '5']) {
      const candidate = AFTU_PUBLISHED_ROUTE_CANDIDATES.find((item) => item.line === line)
      expect(candidate?.directionCoverage).toBe('SINGLE_DESCRIPTION_WITH_RETURN_VARIANTS')
      expect(candidate?.returnVariants).toEqual([
        { outboundSegment: 'Rue 39', inboundSegment: 'Rue 17' },
        { outboundSegment: 'Rue 25', inboundSegment: 'Rue 37' },
      ])
    }
  })

  it('contains no duplicate line references', () => {
    const lines = AFTU_PUBLISHED_ROUTE_CANDIDATES.map((candidate) => candidate.line)
    expect(new Set(lines).size).toBe(lines.length)
  })

  it('reflects the latest complete extraction of all linked official AFTU pages', () => {
    expect(AFTU_OFFICIAL_PAGE_AUDIT).toMatchObject({
      linkedPages: 63,
      additionalOfficialPages: 2,
      itineraryTextsRetrieved: 65,
      pagesWithoutExtractedItinerary: [],
    })
  })

})
