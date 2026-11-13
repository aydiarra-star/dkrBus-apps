import { describe, expect, it } from 'vitest'
import { DDD_PUBLISHED_ROUTES, getDddPublishedRoute } from './dddPublishedRoutes'

describe('DDD published route references', () => {
  it('keeps the published route lists as source references', () => {
    expect(DDD_PUBLISHED_ROUTES.map((route) => route.line)).toEqual([
      '1', '4', '7', '8', '9', '10', '13', '18', '20', '23', '121',
      '2', '5', '6', '11', '12', '16A', '16B', '208', '213', '218', '219',
      '220', '221', '227', '228', '232', '234', '217', '233', 'TO1', '319',
    ])
    for (const route of DDD_PUBLISHED_ROUTES) {
      expect(route.stops.length).toBeGreaterThan(1)
      expect(route.sourceUrl).toBe('https://demdikk.sn/reseau-urbain-dakar/')
      expect(route.directionVerified).toBe(false)
      expect(route.coordinatesVerified).toBe(false)
    }
  })

  it('preserves the published line 13 sequence without assigning its reverse', () => {
    const route = getDddPublishedRoute('13')
    expect(route?.origin).toBe('Liberté 5')
    expect(route?.destination).toBe('Palais 2')
    expect(route?.stops).toHaveLength(24)
    expect(route?.stops[0]).toContain('Liberté 5')
    expect(route?.stops.at(-1)).toBe('Terminus Palais 2')
  })

  it('keeps lines 18 and 20 as published circuits, not fabricated directional pairs', () => {
    expect(getDddPublishedRoute('18')?.kind).toBe('published_circuit')
    expect(getDddPublishedRoute('20')?.kind).toBe('published_circuit')
  })

  it('does not manufacture a sequence for a line absent from this source page', () => {
    expect(getDddPublishedRoute('6')?.origin).toBe('Cambérène 2')
    expect(getDddPublishedRoute('6')?.destination).toBe('Palais 2')
  })
  it('flags the official title/sequence conflicts on lines 217 and 233', () => {
    const line217 = getDddPublishedRoute('217')
    expect(line217?.retrievedOn).toBe('2026-11-13')
    expect(line217?.destination).toBe('Ouakam')
    expect(line217?.stops.at(-1)).toBe('Terminus Aéroport LSS')
    expect(line217?.sourceConflict).toContain('titre officiel annonce Ouakam')

    const line233 = getDddPublishedRoute('233')
    expect(line233?.retrievedOn).toBe('2026-11-13')
    expect(line233?.destination).toBe('Palais 1')
    expect(line233?.stops.at(-1)).toBe('Terminus Aéroport LSS')
    expect(line233?.sourceConflict).toContain('titre officiel annonce Palais 1')
  })

})
