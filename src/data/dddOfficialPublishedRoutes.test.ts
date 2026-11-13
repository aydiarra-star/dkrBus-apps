import { describe, expect, it } from 'vitest'
import {
  DDD_OFFICIAL_PUBLISHED_ROUTE_SEQUENCES,
  DDD_OFFICIAL_ROUTE_SOURCE,
  getDddOfficialPublishedRoute,
} from './dddOfficialPublishedRoutes'

describe('official DDD published route sequences', () => {
  it('stores the 39 unique route sequences transcribed from the operator page', () => {
    expect(DDD_OFFICIAL_PUBLISHED_ROUTE_SEQUENCES).toHaveLength(39)
    expect(new Set(DDD_OFFICIAL_PUBLISHED_ROUTE_SEQUENCES.map((route) => route.line)).size).toBe(39)
    expect(DDD_OFFICIAL_ROUTE_SOURCE).toMatchObject({
      url: 'https://demdikk.sn/reseau-urbain-dakar/',
      infoUrl: 'https://demdikk.sn/info-voyageurs/',
      status: 'NEEDS_HUMAN_REVIEW',
      directionCoverage: 'ONE_PUBLISHED_ORDER_ONLY',
      reverseSequenceVerified: false,
      stopIdsMatched: false,
      frequencyMinutes: null,
    })
  })

  it('preserves the published stop order without creating reverse sequences', () => {
    expect(getDddOfficialPublishedRoute('1')?.stops.slice(0, 3)).toEqual([
      'Terminus Parcelles Assainies',
      'Sapeur Pompiers',
      'Unités 09 10 15',
    ])
    expect(getDddOfficialPublishedRoute('18')?.stops.at(-1)).toBe('Terminus Liberté 5 (Dieuppeul).')
    const line228 = getDddOfficialPublishedRoute('228')
    expect(line228 && 'codeSource' in line228 ? line228.codeSource : null).toBe('cross_reference_to_official_info_page')
    expect(getDddOfficialPublishedRoute('504A')).toBeNull()
  })

  it('keeps distinct TAF TAF services and the published 502/503 headings', () => {
    expect(getDddOfficialPublishedRoute('TAF_TAF_TO1')?.stops.at(-1)).toBe('Palais 2')
    expect(getDddOfficialPublishedRoute('TAF_TAF')?.stops.at(-1)).toBe('AIBD')
    expect(getDddOfficialPublishedRoute('502')?.stops.at(-1)).toBe('Gare Colobane')
    expect(getDddOfficialPublishedRoute('503')?.stops.at(-1)).toBe('Gare de Colobane')
  })
})
