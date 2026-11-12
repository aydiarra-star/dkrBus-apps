import { describe, expect, it } from 'vitest'
import {
  answerSupabaseMobilityKnowledge,
  type SupabaseMobilityKnowledgeSnapshot,
} from './supabaseMobilityKnowledge'

const snapshot: SupabaseMobilityKnowledgeSnapshot = {
  realtime: false,
  networks: [
    { id: 'ddd-id', code: 'ddd', name: 'DDD', status: 'candidate' },
    { id: 'aftu-id', code: 'aftu', name: 'AFTU', status: 'candidate' },
    { id: 'tata-id', code: 'tata', name: 'TATA', status: 'candidate' },
  ],
  lines: [
    { id: 'ddd-228', network_id: 'ddd-id', code: '228', status: 'candidate' },
    { id: 'aftu-5', network_id: 'aftu-id', code: '5', status: 'candidate' },
    { id: 'tata-42', network_id: 'tata-id', code: '42', status: 'candidate' },
  ],
  catalogue: [
    {
      network_code: 'ddd', line_code: '228', origin_label: 'Rufisque', destination_label: 'Yenne',
      source_url: 'https://demdikk.sn/reseau-urbain-dakar/',
      source_consulted_at: '2026-11-09',
      raw_record: { published_stops: ['Rufisque', 'Bargny', 'Diamniadio', 'Yenne'] },
    },
    {
      network_code: 'aftu', line_code: '5', origin_label: 'Lat Dior', destination_label: 'Grand Médine',
      source_url: 'https://aftu-senegal.org/infos-pratiques/',
      raw_record: { waypoints: ['Lat Dior', 'Grand Médine'] },
    },
    {
      network_code: 'tata', line_code: '42', origin_label: 'Boutikou Diallo', destination_label: 'Petersen',
      source_url: 'https://www.covoiturage.sn/bus-tata-itineraire/',
      raw_record: { waypoints: ['Boutikou Diallo', 'Petersen'] },
    },
  ],
  directions: [
    { id: 'ddd-228-out', line_id: 'ddd-228', direction_code: 'published_order_candidate', status: 'candidate', direction_method: 'source_documented' },
    { id: 'ddd-228-return', line_id: 'ddd-228', direction_code: 'return_reverse_candidate', status: 'candidate', direction_method: 'reverse_derived' },
    { id: 'aftu-5-out', line_id: 'aftu-5', direction_code: 'outbound_candidate', status: 'candidate', direction_method: 'source_documented' },
    { id: 'tata-42-out', line_id: 'tata-42', direction_code: 'outbound_candidate', status: 'candidate', direction_method: 'source_documented' },
  ],
  ordered_line_stops: [
    { direction_id: 'ddd-228-out', stop_id: 's1', stop_sequence: 1, stop: { id: 's1', canonical_name: 'Rufisque' } },
    { direction_id: 'ddd-228-out', stop_id: 's2', stop_sequence: 2, stop: { id: 's2', canonical_name: 'Bargny' } },
    { direction_id: 'ddd-228-out', stop_id: 's3', stop_sequence: 3, stop: { id: 's3', canonical_name: 'Diamniadio' } },
    { direction_id: 'ddd-228-out', stop_id: 's4', stop_sequence: 4, stop: { id: 's4', canonical_name: 'Yenne' } },
  ],
  transfers: [
    { label: 'Dakar TER ↔ BRT Petersen', status: 'candidate', walking_distance_m: 1000 },
  ],
  confirmed_traffic_incidents: [],
  unverified_traffic_candidates: [],
}

describe('mémoire Supabase distante Dakar Bus', () => {
  it('répond avec la séquence DDD importée et signale le retour dérivé', () => {
    const reply = answerSupabaseMobilityKnowledge('DDD 228', snapshot)
    expect(reply?.text).toContain('DDD 228')
    expect(reply?.text).toContain('Rufisque → Bargny → Diamniadio → Yenne')
    expect(reply?.text).toContain('Sens retour calculé par inversion')
    expect(reply?.text).toContain('demdikk.sn')
    expect(reply?.lineId).toBe('ddd:228')
  })

  it('garde TATA distinct d’AFTU', () => {
    const reply = answerSupabaseMobilityKnowledge('TATA 42', snapshot)
    expect(reply?.text).toContain('TATA 42')
    expect(reply?.text).toContain('Boutikou Diallo')
    expect(reply?.lineId).toBe('tata:42')
  })

  it('retrouve une fiche AFTU par numéro', () => {
    expect(answerSupabaseMobilityKnowledge('AFTU ligne 5', snapshot)?.text).toContain('Lat Dior')
  })

  it('liste les lignes du réseau explicitement demandé', () => {
    expect(answerSupabaseMobilityKnowledge('liste des lignes DDD', snapshot)?.text).toContain('228')
  })

  it('ne transforme pas une correspondance candidate en correspondance confirmée', () => {
    const reply = answerSupabaseMobilityKnowledge('quelles correspondances ?', snapshot)
    expect(reply?.text).toContain('Correspondances candidates à vérifier')
    expect(reply?.text).toContain('chemin piéton')
  })

  it('ne transforme pas un article non confirmé en alerte confirmée', () => {
    const withCandidate = {
      ...snapshot,
      unverified_traffic_candidates: [{
        title: 'Accident signalé sur la VDN à Dakar',
        status: 'unverified',
        area_label: 'VDN, Dakar',
        source_url: 'https://example.org/article',
      }],
    }
    const reply = answerSupabaseMobilityKnowledge('Y a-t-il un accident sur la route ?', withCandidate)
    expect(reply?.text).toContain('non confirmés')
    expect(reply?.text).toContain('pas des alertes confirmées')
  })

  it('retourne null quand aucune donnée distante ne peut répondre', () => {
    expect(answerSupabaseMobilityKnowledge('bonjour', snapshot)).toBeNull()
    expect(answerSupabaseMobilityKnowledge('DDD 228', null)).toBeNull()
  })
})
