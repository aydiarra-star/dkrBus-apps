import { describe, expect, it } from 'vitest'
import {
  answerSupabaseMobilityKnowledge,
  supabaseFetchOptionsForQuestion,
  type SupabaseMobilityKnowledgeSnapshot,
} from './supabaseMobilityKnowledge'
import { copilotAnswer } from './copilot'
import { createConversationMemory } from './conversation'

const snapshot: SupabaseMobilityKnowledgeSnapshot = {
  realtime: false,
  networks: [
    { id: 'ddd-id', code: 'ddd', name: 'DDD', status: 'candidate' },
    { id: 'aftu-id', code: 'aftu', name: 'AFTU', status: 'candidate' },
    { id: 'tata-id', code: 'tata', name: 'TATA', status: 'candidate' },
    { id: 'brt-id', code: 'brt', name: 'BRT', status: 'candidate' },
  ],
  lines: [
    { id: 'ddd-228', network_id: 'ddd-id', code: '228', status: 'candidate' },
    { id: 'aftu-5', network_id: 'aftu-id', code: '5', status: 'candidate' },
    { id: 'tata-42', network_id: 'tata-id', code: '42', status: 'candidate' },
    { id: 'brt-b2', network_id: 'brt-id', code: 'B2', status: 'candidate' },
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
    { id: 'brt-b2-schedule', line_id: 'brt-b2', direction_code: 'schedule_reference_only', status: 'candidate', direction_method: 'unknown', direction_notes: 'Horaires uniquement ; itinéraire non renseigné.' },
  ],
  ordered_line_stops: [
    { direction_id: 'ddd-228-out', stop_id: 's1', stop_sequence: 1, stop: { id: 's1', canonical_name: 'Rufisque' } },
    { direction_id: 'ddd-228-out', stop_id: 's2', stop_sequence: 2, stop: { id: 's2', canonical_name: 'Bargny' } },
    { direction_id: 'ddd-228-out', stop_id: 's3', stop_sequence: 3, stop: { id: 's3', canonical_name: 'Diamniadio' } },
    { direction_id: 'ddd-228-out', stop_id: 's4', stop_sequence: 4, stop: { id: 's4', canonical_name: 'Yenne' } },
  ],
  service_patterns: [
    { direction_id: 'brt-b2-schedule', pattern_type: 'published_frequency', service_start: '06:00:00', service_end: '21:00:00', headway_minutes: 6, days_of_week: [1, 2, 3, 4, 5, 6], status: 'verified' },
  ],
  transfers: [
    { label: 'Dakar TER ↔ BRT Petersen', status: 'candidate', walking_distance_m: 1000 },
  ],
  data_assertions: [
    { subject_type: 'line_variant', subject_id: 'ddd-502', predicate: 'variant_service', status: 'verified', value_json: { code: '502A', origin: 'Colobane', destination: 'UCAD', note: 'Séquence propre à la variante non publiée.', source_url: 'https://demdikk.sn/info-voyageurs/' } },
    { subject_type: 'network', subject_id: 'ddd-id', predicate: 'variant_service', status: 'verified', value_json: { code: '504B', origin: 'Sébikotane', destination: 'Gare Diamniadio', note: 'Arrêts intermédiaires non renseignés.', source_url: 'https://demdikk.sn/info-voyageurs/' } },
  ],
  confirmed_traffic_incidents: [],
  unverified_traffic_candidates: [],
}

describe('mémoire Supabase distante Dakar Bus', () => {
  it('ne charge que le réseau et la ligne demandés', () => {
    expect(supabaseFetchOptionsForQuestion('DDD 228')).toEqual({ network: 'ddd', lineCode: '228' })
    expect(supabaseFetchOptionsForQuestion('ligne 228')).toEqual({ lineCode: '228' })
    expect(supabaseFetchOptionsForQuestion('TATA 42')).toEqual({ network: 'tata', lineCode: '42' })
    expect(supabaseFetchOptionsForQuestion('BRT B2')).toEqual({ network: 'brt', lineCode: 'B2' })
    expect(supabaseFetchOptionsForQuestion('Et ses arrêts', 'ddd:228')).toEqual({ network: 'ddd', lineCode: '228' })
    expect(supabaseFetchOptionsForQuestion('Y a-t-il des embouteillages ?')).toEqual({ trafficOnly: true })
    expect(supabaseFetchOptionsForQuestion('Bonjour')).toBeNull()
  })
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

  it('reconnaît les variantes DDD officielles sans inventer leurs arrêts', () => {
    const line502a = answerSupabaseMobilityKnowledge('DDD 502A', snapshot)
    expect(line502a?.text).toContain('Colobane ↔ UCAD')
    expect(line502a?.text).toContain('Séquence propre à la variante non publiée')

    const line504b = answerSupabaseMobilityKnowledge('DDD 504B', snapshot)
    expect(line504b?.text).toContain('Sébikotane ↔ Gare Diamniadio')
  })

  it('expose la fréquence BRT B2 sans inventer son itinéraire ni ses arrêts', () => {
    const reply = answerSupabaseMobilityKnowledge('BRT B2', snapshot)
    expect(reply?.text).toContain('BRT B2 : itinéraire non renseigné')
    expect(reply?.text).toContain('06:00:00–21:00:00 : 6 min')
    expect(reply?.text).toContain('terminus et séquence d’arrêts non renseignés')
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

  it('branche la mémoire Supabase dans le copilote sans remplacer son moteur local', () => {
    const reply = copilotAnswer(
      'DDD 228',
      { publishedAvailable: false, adminOnline: false, remoteMobilityKnowledge: snapshot },
      createConversationMemory(),
      'fr',
    )
    expect(reply.text).toContain('Rufisque → Bargny → Diamniadio → Yenne')
  })

  it('retourne null quand aucune donnée distante ne peut répondre', () => {
    expect(answerSupabaseMobilityKnowledge('bonjour', snapshot)).toBeNull()
    expect(answerSupabaseMobilityKnowledge('DDD 228', null)).toBeNull()
  })
})
