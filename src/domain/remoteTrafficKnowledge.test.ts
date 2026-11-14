import { describe, expect, it } from 'vitest'
import { answerRemoteTrafficQuestion } from './remoteTrafficKnowledge'
import type { RemoteTrafficSnapshot } from './trafficBrainApi'

const baseSnapshot: RemoteTrafficSnapshot = {
  generated_at: '2026-11-12T07:00:00.000Z',
  source_of_truth: 'Supabase PostgreSQL',
  realtime: false,
  traffic_only: true,
  alert_policy: 'Only confirmed incidents are alerts.',
  traffic_data_status: {
    status: 'unavailable',
    reason_code: 'NO_CONFIGURED_REALTIME_SOURCE',
    configured_realtime_sources: 0,
    message: "Aucune source de circulation en temps réel n'est actuellement connectée. L'absence d'alerte ne signifie pas que la circulation est fluide.",
  },
  confirmed_traffic_incidents: [],
  traffic_candidates: [],
  traffic_sources: [
    {
      id: 'source-dakaractu',
      name: 'Dakaractu · flux RSS',
      source_type: 'news_rss',
      status: 'partial',
      last_checked_at: '2026-11-12T07:00:00.000Z',
      metadata: { last_feed_item_count: 20, last_traffic_candidate_count: 0 },
    },
    {
      id: 'source-aps',
      name: 'APS · actualités routières',
      source_type: 'official_news_rss',
      status: 'unavailable',
      metadata: { last_error: 'RSS_HTTP_403' },
    },
  ],
  counts: { confirmed_active_incidents: 0, unverified_traffic_candidates: 0, configured_sources: 2 },
}

describe('answerRemoteTrafficQuestion', () => {
  it('never says that roads are clear when there are no alerts', () => {
    const answer = answerRemoteTrafficQuestion('Y a-t-il des embouteillages ?', baseSnapshot)
    expect(answer).toContain('Aucune alerte confirmée')
    expect(answer).toContain('Cela ne signifie pas que la circulation est fluide')
    expect(answer).toContain('20 articles parcourus')
    expect(answer).toContain('accès refusé')
  })

  it('explains that no live traffic source is connected when the feed is unavailable', () => {
    const answer = answerRemoteTrafficQuestion('Y a-t-il des embouteillages ?', baseSnapshot)
    expect(answer).toContain("Aucune source de circulation en temps réel n'est actuellement connectée")
    expect(answer).toContain("L'absence d'alerte ne signifie pas que la circulation est fluide")
  })

  it('labels press reports as unverified rather than confirmed alerts', () => {
    const snapshot: RemoteTrafficSnapshot = {
      ...baseSnapshot,
      traffic_candidates: [{
        id: 'candidate-1',
        title: 'Accident signalé à Colobane',
        incident_type: 'accident',
        severity: 'unknown',
        status: 'unverified',
        area_label: 'Colobane',
        observed_at: '2026-11-12T06:45:00.000Z',
        source_url: 'https://example.test/traffic-story',
        traffic_source_id: 'source-dakaractu',
      }],
      counts: { confirmed_active_incidents: 0, unverified_traffic_candidates: 1, configured_sources: 2 },
    }
    const answer = answerRemoteTrafficQuestion('Accident et circulation à Dakar ?', snapshot)
    expect(answer).toContain('Aucune alerte confirmée')
    expect(answer).toContain('Signalement à vérifier')
    expect(answer).not.toContain('Alerte confirmée : Accident')
    expect(answer).toContain('https://example.test/traffic-story')
  })

  it('shows confirmed incidents as alerts with source and timestamp', () => {
    const snapshot: RemoteTrafficSnapshot = {
      ...baseSnapshot,
      confirmed_traffic_incidents: [{
        id: 'confirmed-1',
        title: 'Route fermée après un accident',
        incident_type: 'road_closure',
        severity: 'high',
        status: 'confirmed',
        area_label: 'Rufisque',
        observed_at: '2026-11-12T06:50:00.000Z',
        confirmed_at: '2026-11-12T06:55:00.000Z',
        source_url: 'https://example.test/official-alert',
        traffic_source_id: 'source-dakaractu',
      }],
      counts: { confirmed_active_incidents: 1, unverified_traffic_candidates: 0, configured_sources: 2 },
    }
    const answer = answerRemoteTrafficQuestion('Quelles alertes trafic ?', snapshot)
    expect(answer).toContain('Alerte confirmée')
    expect(answer).toContain('Rufisque')
    expect(answer).toContain('gravité élevée')
    expect(answer).toContain('https://example.test/official-alert')
  })

  it('does not claim to know the user location', () => {
    const answer = answerRemoteTrafficQuestion('Y a-t-il un bouchon près de moi ?', baseSnapshot)
    expect(answer).toContain('Je ne dispose pas de votre position')
  })

  it('returns null when no traffic snapshot is available', () => {
    expect(answerRemoteTrafficQuestion('Y a-t-il des accidents ?', null)).toBeNull()
  })
})
