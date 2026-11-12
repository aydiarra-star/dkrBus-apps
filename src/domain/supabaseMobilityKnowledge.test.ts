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
    { id: 'ter-id', code: 'ter', name: 'TER', status: 'candidate' },
  ],
  lines: [
    { id: 'ddd-228', network_id: 'ddd-id', code: '228', status: 'candidate' },
    { id: 'aftu-5', network_id: 'aftu-id', code: '5', status: 'candidate' },
    { id: 'tata-42', network_id: 'tata-id', code: '42', status: 'candidate' },
    { id: 'brt-b2', network_id: 'brt-id', code: 'B2', status: 'candidate' },
    { id: 'ter-line', network_id: 'ter-id', code: 'TER', status: 'candidate' },
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
    {
      network_code: 'ter', line_code: 'TER', origin_label: 'Dakar', destination_label: 'Diamniadio',
      raw_record: {},
    },
  ],
  directions: [
    { id: 'ddd-228-out', line_id: 'ddd-228', direction_code: 'published_order_candidate', status: 'candidate', direction_method: 'source_documented' },
    { id: 'ddd-228-return', line_id: 'ddd-228', direction_code: 'return_reverse_candidate', status: 'candidate', direction_method: 'reverse_derived' },
    { id: 'aftu-5-out', line_id: 'aftu-5', direction_code: 'outbound_candidate', status: 'candidate', direction_method: 'source_documented' },
    { id: 'tata-42-out', line_id: 'tata-42', direction_code: 'outbound_candidate', status: 'candidate', direction_method: 'source_documented' },
    { id: 'brt-b2-schedule', line_id: 'brt-b2', direction_code: 'schedule_reference_only', status: 'candidate', direction_method: 'unknown', direction_notes: 'Horaires uniquement ; itinéraire non renseigné.' },
    { id: 'ter-out', line_id: 'ter-line', direction_code: 'Dakar → Diamniadio', status: 'candidate', direction_method: 'source_documented' },
    { id: 'ter-return', line_id: 'ter-line', direction_code: 'Diamniadio → Dakar', status: 'candidate', direction_method: 'reverse_derived' },
  ],
  reference_stops: [
    { id: 's1', canonical_name: 'Rufisque' },
    { id: 's2', canonical_name: 'Bargny' },
  ],
  ordered_line_stops: [
    { direction_id: 'ddd-228-out', stop_id: 's1', stop_sequence: 1, stop: { id: 's1', canonical_name: 'Rufisque' } },
    { direction_id: 'ddd-228-out', stop_id: 's2', stop_sequence: 2, stop: { id: 's2', canonical_name: 'Bargny' } },
    { direction_id: 'ddd-228-out', stop_id: 's3', stop_sequence: 3, stop: { id: 's3', canonical_name: 'Diamniadio' } },
    { direction_id: 'ddd-228-out', stop_id: 's4', stop_sequence: 4, stop: { id: 's4', canonical_name: 'Yenne' } },
    { direction_id: 'ter-out', stop_id: 'ter-s1', stop_sequence: 1, stop: { id: 'ter-s1', canonical_name: 'Dakar' } },
    { direction_id: 'ter-out', stop_id: 'ter-s2', stop_sequence: 2, stop: { id: 'ter-s2', canonical_name: 'Colobane' } },
    { direction_id: 'ter-out', stop_id: 'ter-s3', stop_sequence: 3, stop: { id: 'ter-s3', canonical_name: 'Diamniadio' } },
    { direction_id: 'ter-return', stop_id: 'ter-s3', stop_sequence: 1, stop: { id: 'ter-s3', canonical_name: 'Diamniadio' } },
    { direction_id: 'ter-return', stop_id: 'ter-s2', stop_sequence: 2, stop: { id: 'ter-s2', canonical_name: 'Colobane' } },
    { direction_id: 'ter-return', stop_id: 'ter-s1', stop_sequence: 3, stop: { id: 'ter-s1', canonical_name: 'Dakar' } },
  ],
  service_patterns: [
    { direction_id: 'brt-b2-schedule', pattern_type: 'published_frequency', service_start: '06:00:00', service_end: '21:00:00', headway_minutes: 6, days_of_week: [1, 2, 3, 4, 5, 6], status: 'verified' },
    { direction_id: 'ddd-228-out', pattern_type: 'estimated_frequency', headway_minutes: null, status: 'candidate' },
    { direction_id: 'aftu-5-out', pattern_type: 'estimated_frequency', service_start: '06:00:00', service_end: '23:00:00', headway_minutes: 10, status: 'candidate' },
    { direction_id: 'tata-42-out', pattern_type: 'estimated_frequency', headway_minutes: 11.58, status: 'candidate' },
    { direction_id: 'ter-out', pattern_type: 'published_frequency', service_start: '05:30:00', service_end: '21:00:00', headway_minutes: 10, status: 'verified' },
    { direction_id: 'ter-out', pattern_type: 'published_frequency', service_start: '06:25:00', service_end: '22:05:00', headway_minutes: 20, status: 'verified' },
    { direction_id: 'ter-out', pattern_type: 'published_frequency', service_start: '21:00:00', service_end: '22:00:00', headway_minutes: 20, status: 'verified' },
  ],
  transfers: [
    { label: 'Dakar TER ↔ BRT Petersen', status: 'candidate', walking_distance_m: 1000 },
  ],
  shared_stops: [
    { stop_id: 'shared-22', canonical_name: 'Croisement 22', network_codes: ['brt', 'ddd'], line_codes: ['BRT B1', 'DDD 227'], geocoded: true, status: 'candidate' },
  ],
  counts: { unlocated_shared_stop_names: 329 },
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
    expect(supabaseFetchOptionsForQuestion('TER')).toEqual({ network: 'ter' })
    expect(supabaseFetchOptionsForQuestion('Et ses arrêts', 'ddd:228')).toEqual({ network: 'ddd', lineCode: '228' })
    expect(supabaseFetchOptionsForQuestion('Y a-t-il des embouteillages ?')).toEqual({ trafficOnly: true })
    expect(supabaseFetchOptionsForQuestion('Correspondance entre DDD et BRT')).toEqual({ transferOnly: true })
    expect(supabaseFetchOptionsForQuestion('Où changer de bus entre DDD et BRT ?')).toEqual({ transferOnly: true })
    expect(supabaseFetchOptionsForQuestion('Bonjour')).toBeNull()
  })
  it('répond avec la séquence DDD importée et signale le retour dérivé', () => {
    const reply = answerSupabaseMobilityKnowledge('DDD 228', snapshot)
    expect(reply?.text).toContain('DDD 228')
    expect(reply?.text).toContain('Rufisque → Bargny → Diamniadio → Yenne')
    expect(reply?.text).toContain('les horaires validés du réseau sont conservés')
    expect(reply?.text).toContain('demdikk.sn')
    expect(reply?.lineId).toBe('ddd:228')
  })

  it('consulte la référence TER sans modifier les horaires validés', () => {
    const reply = answerSupabaseMobilityKnowledge('TER', snapshot)
    expect(reply?.text).toContain('TER TER')
    expect(reply?.text).toContain('Dakar → Colobane → Diamniadio')
    expect(reply?.text).toContain('Diamniadio → Colobane → Dakar')
    expect(reply?.text).toContain('Repères dans le sens retour')
    expect(reply?.text).toContain('05:30–21:00 : 10 min')
    expect(reply?.text).toContain('Sens retour calculé par inversion')
  })

  it('expose les repères de fréquence enregistrés sans les présenter comme des départs en direct', () => {
    const ddd = answerSupabaseMobilityKnowledge('DDD 228', snapshot)
    expect(ddd?.text).toContain('7–10 min en pointe')
    expect(ddd?.text).toContain('10–15 min hors pointe')

    const aftu = answerSupabaseMobilityKnowledge('AFTU 5', snapshot)
    expect(aftu?.text).toContain('06:00–23:00')
    expect(aftu?.text).toContain('10 min')
    expect(aftu?.text).toContain('Attente moyenne de référence AFTU')

    const tata = answerSupabaseMobilityKnowledge('TATA 42', snapshot)
    expect(tata?.text).toContain('Repère commun AFTU/TATA')
    expect(tata?.text).toContain('11,6 min')
    expect(tata?.text).toContain('pas une mesure indépendante')
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

  it('propose des correspondances à partir des arrêts partagés géolocalisés', () => {
    const reply = answerSupabaseMobilityKnowledge('Liste des correspondances entre DDD et BRT', snapshot)
    expect(reply?.text).toContain('Croisement 22')
    expect(reply?.text).toContain('BRT / DDD')
    expect(reply?.text).toContain('restent à vérifier sur le terrain')
    expect(reply?.text).not.toContain('TER Petersen')
  })

  it('retrouve un arrêt et les lignes qui lui sont associées', () => {
    const reply = answerSupabaseMobilityKnowledge('Arrêt Bargny DDD', snapshot)
    expect(reply?.text).toContain('Bargny')
    expect(reply?.text).toContain('DDD 228')
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
    expect(reply?.text).toContain('06:00–21:00 : 6 min')
    expect(reply?.text).toContain('terminus et séquence d’arrêts non renseignés')
  })

  it('ne transforme pas une correspondance candidate en correspondance confirmée', () => {
    const reply = answerSupabaseMobilityKnowledge('quelles correspondances ?', snapshot)
    expect(reply?.text).toContain('Correspondances candidates à vérifier')
    expect(reply?.text).toContain('chemin piéton')
  })

  it('indique la fraîcheur des flux RSS quand aucune alerte n’est active', () => {
    const withSources = {
      ...snapshot,
      traffic_sources: [{
        name: 'Dakaractu · flux RSS',
        status: 'partial',
        last_checked_at: '2026-11-12T06:45:02Z',
        metadata: { last_feed_item_count: 20, last_traffic_candidate_count: 0 },
      }],
    }
    const reply = answerSupabaseMobilityKnowledge('Quel est le trafic ?', withSources)
    expect(reply?.text).toContain('Aucune alerte routière confirmée')
    expect(reply?.text).toContain('Dakaractu')
    expect(reply?.text).toContain('ne garantit pas que les routes soient fluides')
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
