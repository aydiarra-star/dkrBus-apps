import { describe, expect, it } from 'vitest'
import { answerRemoteMobilityQuestion } from './remoteMobilityKnowledge'
import type { MobilityBrainSnapshot } from './mobilityBrainApi'

const snapshot: MobilityBrainSnapshot = {
  generated_at: '2026-11-12T00:00:00.000Z',
  source_of_truth: 'Supabase PostgreSQL / PostGIS',
  realtime: false,
  networks: [
    { id: 'network-aftu', code: 'aftu', name: 'AFTU', status: 'active' },
    { id: 'network-tata', code: 'tata', name: 'TATA', status: 'active' },
    { id: 'network-ter', code: 'ter', name: 'TER', status: 'active' },
  ],
  lines: [
    { id: 'line-aftu-5', network_id: 'network-aftu', code: '5', public_name: 'Petersen ↔ Rufisque', status: 'candidate' },
    { id: 'line-tata-5', network_id: 'network-tata', code: '5', public_name: 'TATA 5', status: 'candidate' },
  ],
  catalogue: [
    {
      id: 'catalog-aftu-5',
      network_code: 'aftu',
      line_code: '5',
      origin_label: 'Petersen',
      destination_label: 'Rufisque',
      source_url: 'https://example.test/aftu-5',
      raw_record: { waypoints: ['Petersen', 'Colobane', 'Rufisque'] },
    },
  ],
  reference_stops: [
    { id: 'stop-petersen', canonical_name: 'Petersen', aliases: [], status: 'candidate' },
    { id: 'stop-colobane', canonical_name: 'Colobane', aliases: ['Colobane BRT'], status: 'candidate' },
    { id: 'stop-rufisque', canonical_name: 'Rufisque', aliases: [], status: 'candidate' },
  ],
  directions: [
    {
      id: 'direction-aftu-5-out',
      line_id: 'line-aftu-5',
      direction_code: 'source_forward',
      origin_label: 'Petersen',
      destination_label: 'Rufisque',
      status: 'candidate',
      direction_method: 'source_forward',
    },
    {
      id: 'direction-aftu-5-return',
      line_id: 'line-aftu-5',
      direction_code: 'reverse_derived',
      origin_label: 'Rufisque',
      destination_label: 'Petersen',
      status: 'candidate',
      direction_method: 'reverse_derived',
    },
  ],
  ordered_line_stops: [
    { direction_id: 'direction-aftu-5-out', stop_id: 'stop-petersen', stop_sequence: 1, stop: { id: 'stop-petersen', canonical_name: 'Petersen' } },
    { direction_id: 'direction-aftu-5-out', stop_id: 'stop-colobane', stop_sequence: 2, stop: { id: 'stop-colobane', canonical_name: 'Colobane' } },
    { direction_id: 'direction-aftu-5-out', stop_id: 'stop-rufisque', stop_sequence: 3, stop: { id: 'stop-rufisque', canonical_name: 'Rufisque' } },
    { direction_id: 'direction-aftu-5-return', stop_id: 'stop-rufisque', stop_sequence: 1, stop: { id: 'stop-rufisque', canonical_name: 'Rufisque' } },
    { direction_id: 'direction-aftu-5-return', stop_id: 'stop-colobane', stop_sequence: 2, stop: { id: 'stop-colobane', canonical_name: 'Colobane' } },
    { direction_id: 'direction-aftu-5-return', stop_id: 'stop-petersen', stop_sequence: 3, stop: { id: 'stop-petersen', canonical_name: 'Petersen' } },
  ],
  service_patterns: [
    {
      id: 'pattern-aftu-5',
      direction_id: 'direction-aftu-5-out',
      pattern_type: 'estimated_frequency',
      period_label: 'référence ligne',
      service_start: '06:00',
      service_end: '23:00',
      headway_minutes: 10,
      expected_wait_minutes: 8,
      status: 'candidate',
    },
  ],
  transfers: [],
}

describe('answerRemoteMobilityQuestion', () => {
  it('returns both directions and the stored frequency for an AFTU line', () => {
    const answer = answerRemoteMobilityQuestion('AFTU 5, quels sont les arrêts et la fréquence ?', snapshot)
    expect(answer).toContain('AFTU 5')
    expect(answer).toContain('Aller : Petersen → Rufisque')
    expect(answer).toContain('Retour : Rufisque → Petersen')
    expect(answer).toContain('Colobane')
    expect(answer).toContain('intervalle 10 min')
    expect(answer).toContain('06:00–23:00')
  })

  it('keeps TATA separate from AFTU when line codes overlap', () => {
    const answer = answerRemoteMobilityQuestion('TATA 5', snapshot)
    expect(answer).toContain('TATA 5')
    expect(answer).not.toContain('AFTU 5')
  })

  it('finds bus lines serving a stop without sending the question to the server', () => {
    const answer = answerRemoteMobilityQuestion('Quelles lignes desservent Colobane ?', snapshot)
    expect(answer).toContain('Colobane')
    expect(answer).toContain('AFTU 5')
  })

  it('does not replace the existing TER assistant', () => {
    expect(answerRemoteMobilityQuestion('Quel est le prochain TER ?', snapshot)).toBeNull()
  })

  it('returns null when the remote snapshot is unavailable', () => {
    expect(answerRemoteMobilityQuestion('AFTU 5', null)).toBeNull()
  })
})
