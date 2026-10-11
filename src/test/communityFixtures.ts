import type { StreetReport } from '../domain/streetReports'
import { TRAFFIC_TEST_NOW, isoAt } from './trafficFixtures'

export const COMMUNITY_TEST_ID = `cr_${'a'.repeat(32)}`
export const COMMUNITY_TEST_KEY = 'b'.repeat(64)

/** Tests only: no synthetic community incident in the running product. */
export function communityReport(overrides: Partial<StreetReport> = {}, at = TRAFFIC_TEST_NOW): StreetReport {
  return { id: COMMUNITY_TEST_ID, kind: 'CONGESTION', place: 'Portion de route de test', comment: 'Observation de test',
    networkId: 'ddd', lat: 14.7051, lng: -17.4602, source: 'COMMUNITY', status: 'ACTIVE', shared: true,
    createdAt: isoAt(at), expiresAt: isoAt(at + 60 * 60_000), ...overrides }
}

export function communityPayload(reports: StreetReport[] = [], at = TRAFFIC_TEST_NOW) {
  return { region: 'Dakar', generatedAt: isoAt(at), sharingAvailable: true, verification: 'SELF_REPORTED_NOT_OFFICIAL', reports }
}
