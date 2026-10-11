import { describe, expect, test } from 'vitest'
import {
  aggregateAlerts, aiTrafficSummaryFr, aiTrafficSummaryWo, alertExpiresAt, formatDistanceMeters,
  isActiveTrafficAlert, proximityLabel, rankAlerts, relevantAlerts, severityLabel, sourceLabel,
  streetReportToAlert, ALERT_PROXIMITY_RADIUS_M, TRAFFIC_SOURCES,
} from './trafficAlerts'
import { createStreetReport } from './streetReports'
import { isFreshTrafficInstant, trafficInstant, TRAFFIC_ALERT_TTL_MS as HOUR } from './trafficFreshness'
import { isoAt, trafficAlert, TRAFFIC_TEST_NOW as NOW } from '../test/trafficFixtures'

const gps = { lat: 14.7051, lng: -17.4602 }
const verified = { availability: 'current' as const, checkedAt: isoAt(NOW) }
const roadSource = TRAFFIC_SOURCES.find((source) => source.id === 'road')!

describe('preuve de fraîcheur trafic', () => {
  test('exige une date ISO avec fuseau, valide, non future et strictement sous une heure', () => {
    expect(trafficInstant('2026-10-11T12:00:00+00:00')).toBe(NOW)
    for (const invalid of ['2026-10-11', '2026-10-11T12:00:00', '2026-02-30T12:00:00Z', '2026-10-11T24:00:00Z', 'pas une date']) {
      expect(trafficInstant(invalid)).toBeNull()
    }
    expect(isFreshTrafficInstant(isoAt(NOW - HOUR + 1), NOW)).toBe(true)
    expect(isFreshTrafficInstant(isoAt(NOW - HOUR), NOW)).toBe(false)
    expect(isFreshTrafficInstant(isoAt(NOW + 1), NOW)).toBe(false)
  })

  test('purge les alertes de la veille, non confirmées, résolues, futures et expirées', () => {
    const values = [
      trafficAlert({ id: 'veille', updatedAt: isoAt(NOW - 24 * HOUR) }),
      trafficAlert({ id: 'non-confirmé', confirmedAt: null }),
      trafficAlert({ id: 'résolu', status: 'RESOLVED' }),
      trafficAlert({ id: 'futur', updatedAt: isoAt(NOW + 1) }),
      trafficAlert({ id: 'fin', expiresAt: isoAt(NOW) }),
      trafficAlert({ id: 'preuve-ancienne', confirmedAt: isoAt(NOW - HOUR) }),
      trafficAlert({ id: 'date-invalide', updatedAt: 'hier' }),
      trafficAlert({ id: 'source-inconnue', source: { kind: 'OFFICIAL', label: 'Source sans preuve' } }),
    ]
    expect(aggregateAlerts(values, NOW)).toEqual([])
  })

  test('ne contient aucun exemple et n’utilise pas Direct rue comme confirmation', () => {
    const report = createStreetReport({ kind: 'INCIDENT', place: 'Autoroute', lat: gps.lat, lng: gps.lng }, NOW)!
    const alert = streetReportToAlert(report)
    expect(alert.status).toBe('UNCONFIRMED')
    expect(alert.confirmedAt).toBeNull()
    expect(alert.delayMinutes).toBeNull()
    expect(alert.headlineFr).toContain('Autoroute')
    expect(alert.severity).toBe('critical')
    expect(aggregateAlerts([alert, trafficAlert({ source: { kind: 'AI_SAMPLE', label: 'Exemple' } })], NOW)).toEqual([])
    expect(aggregateAlerts([], NOW)).toEqual([])
  })

  test('ne rajeunit jamais une observation au téléchargement ou au recalcul', () => {
    const alert = trafficAlert({}, NOW - 20 * 60_000)
    expect(aggregateAlerts([alert], NOW)[0].updatedAt).toBe(isoAt(NOW - 20 * 60_000))
    expect(aggregateAlerts([alert], NOW + 40 * 60_000)).toEqual([])
    expect(alertExpiresAt(alert)).toBe(NOW + 40 * 60_000)
    expect(isActiveTrafficAlert(alert, NOW + 40 * 60_000 - 1)).toBe(true)
  })

  test('l’expiration explicite plus courte est respectée', () => {
    const alert = trafficAlert({ expiresAt: isoAt(NOW + 10_000) })
    expect(alertExpiresAt(alert)).toBe(NOW + 10_000)
    expect(isActiveTrafficAlert(alert, NOW + 10_000)).toBe(false)
  })

  test('croise par identifiant et donne priorité à la dernière résolution / perte de confirmation', () => {
    const active = trafficAlert({}, NOW - 1000)
    const resolved = trafficAlert({ source: roadSource, status: 'RESOLVED', confirmedAt: null })
    expect(aggregateAlerts([active, resolved], NOW)).toEqual([])
    expect(aggregateAlerts([resolved, active], NOW)).toEqual([])
    expect(aggregateAlerts([active, trafficAlert({ status: 'UNCONFIRMED', confirmedAt: null })], NOW)).toEqual([])
    expect(aggregateAlerts([trafficAlert(), resolved], NOW)).toEqual([])
    expect(aggregateAlerts([active, trafficAlert()], NOW)).toHaveLength(1)
  })
})

describe('GPS et pertinence des alertes', () => {
  test('classe une alerte critique proche avant une information éloignée', () => {
    const alerts = [trafficAlert({ id: 'loin', severity: 'info', lat: 14.80, lon: -17.3 }), trafficAlert({ id: 'près', severity: 'critical' })]
    const ranked = rankAlerts(alerts, gps, ALERT_PROXIMITY_RADIUS_M, NOW)
    expect(ranked[0].alert.id).toBe('près')
    expect(ranked[0].nearby).toBe(true)
  })

  test('le point réel de l’accident reste proche même si un arrêt impacté est éloigné', () => {
    const ranked = rankAlerts([trafficAlert({ affectedStopIds: ['ter-diamniadio'] })], gps, 1500, NOW)
    expect(ranked[0].nearby).toBe(true)
    expect(ranked[0].distanceM).toBe(0)
  })

  test('géofiltre la route mais garde les perturbations officielles du réseau', () => {
    const ranked = rankAlerts([
      trafficAlert({ id: 'route-proche', source: roadSource }),
      trafficAlert({ id: 'route-loin', source: roadSource, lat: 14.80, lon: -17.3 }),
      trafficAlert({ id: 'réseau', lat: null, lon: null, affectedNetworks: ['ter'] }),
    ], gps, 1500, NOW)
    expect(relevantAlerts(ranked, gps).map((entry) => entry.alert.id).sort()).toEqual(['route-proche', 'réseau'])
    expect(relevantAlerts(ranked, null)).toHaveLength(3)
  })

  test('sans GPS aucune proximité n’est inventée et les incidents périmés ne sont jamais classés', () => {
    const ranked = rankAlerts([trafficAlert(), trafficAlert({ id: 'ancien' }, NOW - HOUR)], null, 1500, NOW)
    expect(ranked).toHaveLength(1)
    expect(ranked[0].nearby).toBe(false)
    expect(ranked[0].distanceM).toBeNull()
  })
})

describe('synthèse IA courante', () => {
  test('affiche le statut fluide uniquement pour une vérification complète récente et vide', () => {
    expect(aiTrafficSummaryFr([], gps, verified, NOW)).toContain('Trafic fluide / Aucune perturbation en cours')
    expect(aiTrafficSummaryFr([], null, verified, NOW)).toContain('sur les réseaux suivis de Dakar')
    for (const availability of ['loading', 'partial', 'unavailable'] as const) {
      expect(aiTrafficSummaryFr([], gps, { ...verified, availability }, NOW)).not.toContain('Trafic fluide /')
    }
    expect(aiTrafficSummaryFr([], gps, verified, NOW + HOUR)).not.toContain('Trafic fluide /')
    expect(aiTrafficSummaryWo([], gps, verified, NOW + HOUR)).not.toContain('Yoon wi leer na')
  })

  test('ne conclut pas au trafic fluide quand un incident touche le réseau hors du rayon', () => {
    const ranked = rankAlerts([trafficAlert({ lat: null, lon: null, affectedNetworks: ['ter'] })], gps, 1500, NOW)
    const summary = aiTrafficSummaryFr(ranked, gps, verified, NOW)
    expect(summary).toContain('1 perturbation(s) confirmée(s)')
    expect(summary).not.toContain('Trafic fluide /')
  })

  test('sans sources ni GPS donne les réserves et l’invitation GPS, dans les deux langues', () => {
    expect(aiTrafficSummaryFr([], null)).toMatch(/GPS/)
    expect(aiTrafficSummaryFr([], gps)).toMatch(/indisponibles/)
    expect(aiTrafficSummaryWo([], null)).toContain('GPS')
  })

  test('formatage et provenance restent compatibles avec les cartes existantes', () => {
    expect(formatDistanceMeters(280)).toBe('280 m')
    expect(formatDistanceMeters(1400)).toBe('1,4 km')
    expect(severityLabel('critical')).toBe('Critique')
    expect(sourceLabel({ kind: 'OFFICIAL', label: 'SETER' })).toMatch(/officielle.*SETER/i)
    expect(proximityLabel(null, null)).toBeNull()
  })
})
