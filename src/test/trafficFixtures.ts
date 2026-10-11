import { TRAFFIC_SOURCES, type TrafficAlert } from '../domain/trafficAlerts'
import type { TrafficSnapshot } from '../domain/trafficFeed'

export const TRAFFIC_TEST_NOW = Date.parse('2026-10-11T12:00:00.000Z')
export const isoAt = (at: number) => new Date(at).toISOString()

/** Données de tests uniquement : aucun incident de démonstration dans l'app. */
export function trafficAlert(overrides: Partial<TrafficAlert> = {}, at = TRAFFIC_TEST_NOW): TrafficAlert {
  return {
    id: 'incident-1', headlineFr: 'Incident confirmé à Dakar', headlineWo: '',
    summaryFr: 'Une perturbation est confirmée par la source.', summaryWo: '',
    severity: 'warning', source: { ...TRAFFIC_SOURCES.find((source) => source.id === 'cetud')! },
    affectedNetworks: ['ddd'], affectedLines: ['10'], affectedStopIds: [],
    lat: 14.7051, lon: -17.4602, delayMinutes: null,
    recommendationFr: null, recommendationWo: null,
    updatedAt: isoAt(at), confirmedAt: isoAt(at), expiresAt: null, status: 'ACTIVE',
    ...overrides,
  }
}

export function trafficPayload(alerts: TrafficAlert[] = [], at = TRAFFIC_TEST_NOW): TrafficSnapshot & { region: 'Dakar' } {
  return {
    region: 'Dakar', generatedAt: isoAt(at), alerts,
    sources: TRAFFIC_SOURCES.map((source) => ({ id: source.id, status: 'LIVE', checkedAt: isoAt(at) })),
  }
}
