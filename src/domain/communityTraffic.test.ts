import { describe, expect, it } from 'vitest'
import { assessStreetReport, assistantStreetReportSummary, communityAwareTrafficSummary, communityDisplayAlert, nextCommunityExpiry,
  rankStreetReports, relevantStreetReports, trafficEmptyState } from './communityTraffic'
import { aggregateAlerts } from './trafficAlerts'
import { communityReport } from '../test/communityFixtures'
import { TRAFFIC_TEST_NOW as NOW, isoAt } from '../test/trafficFixtures'

const gps = { lat: 14.7051, lng: -17.4602 }
const HOUR = 60 * 60_000
const current = { availability: 'current' as const, checkedAt: isoAt(NOW) }

describe('Assistant Direct rue : contrôle de forme sans faux fact checking', () => {
  it('nettoie le formulaire sans modifier son sens ni inventer un point', () => {
    expect(assessStreetReport({ kind: 'CONGESTION', place: '  Route   de test ', comment: '  File   arrêtée ' })).toEqual({
      ok: true, value: { kind: 'CONGESTION', place: 'Route de test', comment: 'File arrêtée', lat: null, lng: null, networkId: null },
    })
  })

  it('refuse textes invalides, réseau inconnu et GPS hors Dakar ou incomplet', () => {
    const draft = { kind: 'INCIDENT' as const, place: 'Hann' }
    for (const overrides of [{ place: 'x' }, { place: '<script>x</script>' }, { comment: 'x'.repeat(141) },
      { comment: 123 }, { networkId: 'unknown' }, { lat: 14.7, lng: null }, { lat: 48.89, lng: 2.24 }, { lat: NaN, lng: 0 }, { kind: 'UNKNOWN' }]) {
      expect(assessStreetReport({ ...draft, ...overrides } as never).ok).toBe(false)
    }
  })

  it('met en forme le témoignage mais ne le promeut jamais en confirmation officielle', () => {
    const report = communityReport()
    expect(assistantStreetReportSummary(report)).toContain('Précision de l’usager')
    expect(assistantStreetReportSummary(report)).toContain('non vérifié')
    const card = communityDisplayAlert(report)
    expect(card.status).toBe('UNCONFIRMED')
    expect(card.confirmedAt).toBeNull()
    expect(card.affectedLines).toEqual([])
    expect(card.affectedStopIds).toEqual([])
    expect(card.delayMinutes).toBeNull()
    expect(aggregateAlerts([card], NOW)).toEqual([])
  })
})

describe('proximité et expiration des signalements', () => {
  it('classe à proximité avant distant avant non localisé, sans coordonnées supposées', () => {
    const ranked = rankStreetReports([communityReport({ id: 'far', lat: 14.81, lng: -17.3 }),
      communityReport({ id: 'unknown', lat: null, lng: null }), communityReport({ id: 'near' }, NOW - 60_000)], gps, NOW)
    expect(ranked.map(({ report }) => report.id)).toEqual(['near', 'far', 'unknown'])
    expect(ranked[0].nearby).toBe(true)
    expect(ranked[2].distanceM).toBeNull()
    expect(relevantStreetReports(ranked, gps).map(({ report }) => report.id)).toEqual(['near'])
    expect(relevantStreetReports(ranked, null)).toHaveLength(3)
  })

  it('purge à la limite exacte, résolu, veille, futur et ancien cache de 90 minutes', () => {
    const valid = communityReport({ id: 'valid' })
    const legacy = communityReport({ id: 'legacy', expiresAt: isoAt(NOW + 30 * 60_000) }, NOW - 60 * 60_000)
    const values = [valid, legacy, communityReport({ id: 'resolved', status: 'RESOLVED' }), communityReport({ id: 'future' }, NOW + 1), communityReport({ id: 'yesterday' }, NOW - 24 * HOUR)]
    expect(rankStreetReports(values, gps, NOW).map(({ report }) => report.id)).toEqual(['valid'])
    expect(nextCommunityExpiry([valid], NOW)).toBe(NOW + HOUR)
    expect(rankStreetReports([valid], gps, NOW + HOUR)).toEqual([])
  })
})

describe('fallback rassurant mais honnête', () => {
  it('absence de flux : absence de signalement recueilli, pas confirmation de trafic fluide', () => {
    for (const availability of ['unavailable', 'partial'] as const) {
      const result = communityAwareTrafficSummary([], [], gps, { availability, checkedAt: null }, NOW)
      expect(result.fr).toContain('Aucune perturbation récente signalée dans votre zone')
      expect(result.fr).toContain('ne confirme pas un trafic fluide')
      expect(result.fr).not.toMatch(/^Trafic fluide/)
    }
  })

  it('réserve le statut fluide à une preuve fraîche complète et à zéro témoignage pertinent', () => {
    expect(trafficEmptyState(current, gps, NOW).title).toMatch(/^Trafic fluide/)
    expect(trafficEmptyState(current, gps, NOW + HOUR).title).not.toMatch(/^Trafic fluide/)
    const ranked = rankStreetReports([communityReport()], gps, NOW)
    const result = communityAwareTrafficSummary([], ranked, gps, current, NOW)
    expect(result.fr).toContain('Direct rue : 1 signalement(s)')
    expect(result.fr).toContain('non vérifié')
    expect(result.fr).not.toContain('Trafic fluide')
  })

  it('sans GPS ne prétend pas connaître la zone et résume tous les témoignages frais', () => {
    const result = communityAwareTrafficSummary([], rankStreetReports([communityReport({ lat: null, lng: null })], null, NOW), null,
      { availability: 'unavailable', checkedAt: null }, NOW)
    expect(result.fr).toContain('recueilli(s)')
    expect(result.fr).not.toContain('dans votre rayon')
    expect(result.wo).toContain('Direct rue')
  })

  it('un signalement expiré ne survit pas dans une synthèse déjà calculée', () => {
    const ranked = rankStreetReports([communityReport()], gps, NOW)
    const result = communityAwareTrafficSummary([], ranked, gps, { ...current, checkedAt: isoAt(NOW + HOUR) }, NOW + HOUR)
    expect(result.fr).not.toContain('Portion de route de test')
    expect(result.fr).toContain('Trafic fluide')
  })
})
