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

const dddCircuitSnapshot: MobilityBrainSnapshot = {
  ...snapshot,
  networks: [...snapshot.networks, { id: 'network-ddd', code: 'ddd', name: 'Dakar Dem Dikk', status: 'active' }],
  lines: [...snapshot.lines, { id: 'line-ddd-18', network_id: 'network-ddd', code: '18', public_name: 'Dieuppeul ↔ Centre-ville', status: 'candidate' }],
  catalogue: [...snapshot.catalogue, {
    id: 'catalog-ddd-18',
    network_code: 'ddd',
    line_code: '18',
    origin_label: 'Dieuppeul',
    destination_label: 'Centre-ville',
    source_url: 'https://example.test/ddd-18',
  }],
  reference_stops: [...snapshot.reference_stops,
    { id: 'stop-dieuppeul', canonical_name: 'Dieuppeul', aliases: [], status: 'candidate' },
    { id: 'stop-centre-ville', canonical_name: 'Centre-ville', aliases: [], status: 'candidate' },
  ],
  directions: [...snapshot.directions,
    {
      id: 'direction-ddd-18-circuit',
      line_id: 'line-ddd-18',
      direction_code: 'published_circuit_candidate',
      origin_label: 'Dieuppeul',
      destination_label: 'Centre-ville',
      status: 'candidate',
      direction_method: 'source_documented',
    },
    {
      id: 'direction-ddd-18-return',
      line_id: 'line-ddd-18',
      direction_code: 'return_reverse_candidate',
      origin_label: 'Centre-ville',
      destination_label: 'Dieuppeul',
      status: 'candidate',
      direction_method: 'unknown',
    },
  ],
  ordered_line_stops: [...snapshot.ordered_line_stops,
    { direction_id: 'direction-ddd-18-circuit', stop_id: 'stop-dieuppeul', stop_sequence: 1, stop: { id: 'stop-dieuppeul', canonical_name: 'Dieuppeul' } },
    { direction_id: 'direction-ddd-18-circuit', stop_id: 'stop-centre-ville', stop_sequence: 2, stop: { id: 'stop-centre-ville', canonical_name: 'Centre-ville' } },
  ],
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

  it('does not expose rejected lines as available network lines', () => {
    const rejectedSnapshot: MobilityBrainSnapshot = {
      ...snapshot,
      networks: [...snapshot.networks, { id: 'network-ddd', code: 'ddd', name: 'Dakar Dem Dikk', status: 'active' }],
      lines: [...snapshot.lines, {
        id: 'line-ddd-99', network_id: 'network-ddd', code: '99',
        public_name: 'Ligne retirée', status: 'rejected',
      }],
    }
    const answer = answerRemoteMobilityQuestion('DDD 99', rejectedSnapshot)
    expect(answer).toContain('Je ne trouve pas la ligne 99')
    expect(answer).not.toContain('Ligne retirée')
  })

  it('does not display a rejected direction in a line answer', () => {
    const rejectedDirectionSnapshot: MobilityBrainSnapshot = {
      ...snapshot,
      directions: [...snapshot.directions, {
        id: 'direction-aftu-5-rejected', line_id: 'line-aftu-5',
        direction_code: 'rejected_return', origin_label: 'Rufisque',
        destination_label: 'Petersen', status: 'rejected', direction_method: 'unknown',
      }],
      ordered_line_stops: [...snapshot.ordered_line_stops, {
        direction_id: 'direction-aftu-5-rejected', stop_id: 'stop-rufisque',
        stop_sequence: 1, stop: { id: 'stop-rufisque', canonical_name: 'Rufisque' },
      }],
    }
    const answer = answerRemoteMobilityQuestion('AFTU 5', rejectedDirectionSnapshot)
    expect(answer).toContain('Aller : Petersen')
    expect(answer).not.toContain('rejected_return')
    expect(answer).not.toContain('Sens retour non documenté')
  })

  it('does not expose archived lines or directions', () => {
    const archivedSnapshot: MobilityBrainSnapshot = {
      ...snapshot,
      lines: [...snapshot.lines, {
        id: 'line-aftu-archived', network_id: 'network-aftu', code: '88',
        public_name: 'Ancienne ligne', status: 'archived',
      }],
      directions: [...snapshot.directions, {
        id: 'direction-aftu-archived', line_id: 'line-aftu-5',
        direction_code: 'old_return', origin_label: 'Rufisque',
        destination_label: 'Petersen', status: 'archived', direction_method: 'unknown',
      }],
    }
    const missingLine = answerRemoteMobilityQuestion('AFTU 88', archivedSnapshot)
    const currentLine = answerRemoteMobilityQuestion('AFTU 5', archivedSnapshot)
    expect(missingLine).toContain('Je ne trouve pas la ligne 88')
    expect(missingLine).not.toContain('Ancienne ligne')
    expect(currentLine).not.toContain('old_return')
  })

  it('labels candidate transfers as unverified candidates', () => {
    const transferSnapshot: MobilityBrainSnapshot = {
      ...snapshot,
      transfers: [{
        id: 'transfer-colobane-petersen',
        from_stop_id: 'stop-colobane',
        to_stop_id: 'stop-petersen',
        walking_distance_m: 250,
        status: 'candidate',
        transfer_type: 'walking',
      }],
    }
    const answer = answerRemoteMobilityQuestion('Quelles correspondances depuis Colobane ?', transferSnapshot)
    expect(answer).toContain('candidate à vérifier')
    expect(answer).toContain('250 m à pied')
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


  it('does not invent a return sequence for a DDD circuit', () => {
    const answer = answerRemoteMobilityQuestion('DDD 18', dddCircuitSnapshot)
    expect(answer).toContain('Circuit candidat : Dieuppeul → Centre-ville')
    expect(answer).toContain('Sens retour non documenté')
    expect(answer).not.toContain('Sens retour reconstitué')
  })

  it('returns null when the remote snapshot is unavailable', () => {
    expect(answerRemoteMobilityQuestion('AFTU 5', null)).toBeNull()
  })
})
