import { describe, expect, it } from 'vitest'
import { answerMobilityKnowledge, BUS_LINES, busKnowledgeSummary, setRemoteCandidateLines, setRemoteTrafficSnapshot, setRemoteMobilityGraph, type BusLine, type RemoteMobilityGraph } from './mobilityKnowledge'
import { copilotAnswer } from './copilot'
import { createConversationMemory } from './conversation'
import { answerAssistant } from './assistant'

const context = { publishedAvailable: false, adminOnline: false }
function ask(question: string) { return answerMobilityKnowledge(question)?.text ?? '' }

describe('mémoire documentaire actualisée le 10 novembre 2026', () => {
  it('embarque 72 fiches AFTU et 37 DDD, pas un graphe ni des positions inventées', () => {
    expect(BUS_LINES.filter((line) => line.network === 'aftu')).toHaveLength(72)
    expect(BUS_LINES.filter((line) => line.network === 'ddd')).toHaveLength(37)
    expect(BUS_LINES.filter((line) => line.waypoints.length)).toHaveLength(80)
    expect(BUS_LINES.find((line) => line.network === 'aftu' && line.code === '62')?.waypoints.length).toBeGreaterThan(0)
    expect(BUS_LINES.find((line) => line.network === 'aftu' && line.code === '62')?.origin).toBe('Arrêt Chérif (Rufisque)')
    expect(BUS_LINES.find((line) => line.network === 'aftu' && line.code === '63')?.destination).toBe('Stade LSS')
    expect(BUS_LINES.find((line) => line.network === 'aftu' && line.code === '64')?.origin).toBe('Guédiawaye')
    expect(BUS_LINES.find((line) => line.network === 'aftu' && line.code === '65')?.destination).toBe('Jaxaay')
    expect(new Set(BUS_LINES.map((line) => `${line.network}:${line.code}`)).size).toBe(109)
    expect(busKnowledgeSummary()).toContain('n’est pas exhaustif')
    for (const line of BUS_LINES) {
      expect(line.consultedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(new URL(line.sourceUrl).protocol).toBe('https:')
      expect(line.origin.length).toBeGreaterThan(1)
      expect(line.destination.length).toBeGreaterThan(1)
      if (line.waypoints.length) expect(line.detailSourceUrl).toBeTruthy()
      expect(line).not.toHaveProperty('lat')
      expect(line).not.toHaveProperty('nextDepartureAt')
    }
  })

  it('ne confond pas le même numéro sur DDD et AFTU', () => {
    expect(ask('ligne 1')).toContain('Précisez DDD ou AFTU')
    expect(ask('DDD 01')).toContain('Place Leclerc')
    expect(ask('AFTU ligne 1')).toContain('Lat Dior')
    expect(ask('AFTU ligne 1')).toContain('Grand Médine')
    expect(ask('AFTU ligne 1')).toContain('terminus à confirmer')
  })

  it('donne le parcours AFTU récent plutôt que le parcours historique CETUD', () => {
    const result = ask('itinéraire AFTU 53')
    expect(result).toContain('Terminus Keur Massar (Marché)')
    expect(result).toContain('Sococim → Bargny → Diamniadio')
    expect(result).toContain('publication du 2026-07-06')
    expect(result).toContain('Les sources AFTU consultées ne concordent pas')
    expect(result).toContain('pas une liste d’arrêts géolocalisés')
  })

  it('ne confond pas TATA et AFTU lorsqu’aucune fiche TATA n’est chargée', () => {
    const reply = ask('TATA 42')
    expect(reply).toContain('La ligne 42 tata n’est pas documentée')
    expect(reply).not.toContain('AFTU 42')
    expect(reply).not.toContain('Boutikou Diallo')
  })

  it('charge une fiche TATA candidate sous son propre réseau', () => {
    const candidate = {
      network: 'tata',
      code: '42',
      origin: 'Petersen',
      destination: 'Keur Massar',
      waypoints: ['Petersen', 'Colobane', 'Keur Massar'],
      sourceUrl: 'https://example.com/tata-42',
      detailSourceUrl: 'https://example.com/tata-42/details',
      consultedAt: '2026-11-12',
      publishedAt: null,
      note: 'Fiche TATA candidate.',
    } as BusLine
    setRemoteCandidateLines([candidate])
    const reply = ask('TATA 42')
    expect(reply).toContain('TATA 42')
    expect(reply).toContain('Petersen ↔ Keur Massar')
    expect(reply).not.toContain('AFTU 42')
    setRemoteCandidateLines([])
  })

  it('signale les divergences, y compris celles présentes chez un opérateur', () => {
    for (const code of ['23', '217', '233']) expect(ask(`DDD ${code}`)).toContain('Divergence dans la source')
  })

  it('ne fabrique pas les points de passage non transcrits', () => {
    expect(ask('ligne AFTU 91')).toContain('APIX ↔ Dougar')
    expect(ask('ligne AFTU 91')).toContain('pas encore transcrit')
    expect(ask('bus DDD 999')).toContain('n’est pas documentée')
  })

  it('ne donne ni fréquence ni tarif pour une ligne bus non documentée sur ce point', () => {
    expect(ask('prochain bus AFTU 53')).toContain('Aucun prochain départ fiable')
    expect(ask('horaires DDD 1')).not.toMatch(/dans \d+ min/)
    expect(ask('prix DDD 1')).toContain('Tarif de cette ligne non documenté')
  })

  it('trouve une piste de trajet dans le sens textuel publié sans la géocoder', () => {
    const result = ask('trajet DDD de Ouakam à UCAD')
    expect(result).toContain('DDD 7')
    expect(result).toContain('ni durée, ni prochain départ garanti')
    expect(ask('trajet AFTU de Keur Massar à Sébikotane')).toContain('AFTU 53')
  })

  it('n’inverse pas un parcours ou ne garantit pas une correspondance bus', () => {
    expect(ask('trajet AFTU de Sébikotane à Keur Massar')).toContain('AFTU 68')
  })

  it('préserve le calculateur TER/BRT existant pour ses parcours', () => {
    expect(answerMobilityKnowledge('trajet de Petersen à Rufisque')).toBeNull()
    expect(copilotAnswer('trajet de Petersen à Rufisque', context, createConversationMemory(), 'fr').journey).toBeTruthy()
  })

  it('garde la fiche bus pour un suivi sans réutiliser un ancien trajet TER', () => {
    const memory = createConversationMemory()
    copilotAnswer('trajet de Petersen à Rufisque', context, memory, 'fr')
    const line = copilotAnswer('DDD 1', context, memory, 'fr')
    expect(line.journey).toBeUndefined()
    expect(memory.lastJourney).toBeNull()
    expect(memory.lastKnowledgeLineId).toBe('ddd:1')
    const next = copilotAnswer('Et ses horaires ?', context, memory, 'fr')
    expect(next.text).toContain('DDD 1')
    expect(next.text).toContain('Aucun prochain départ fiable')
  })

  it('répond hors ligne aux tarifs BRT et TER sans réclamer un GTFS', () => {
    expect(ask('tarif BRT')).toContain('400 F CFA')
    expect(ask('prix TER')).toContain('1 500 F CFA')
    const combined = answerAssistant('Quels sont les tarifs TER et BRT ?', context)
    expect(combined).toContain('400 F CFA')
    expect(combined).toContain('2 500 F CFA')
    expect(combined).not.toContain('aucun tarif fiable')
  })

  it('différencie gratuité TER et BRT, et validation des titres', () => {
    expect(ask('enfant gratuit TER')).toContain('moins de 5 ans')
    expect(ask('enfant gratuit BRT')).toContain('accompagnés de moins de 4 ans')
    expect(ask('Comment valider BRT ?')).toContain('entrée ET à la sortie')
    expect(ask('acheter carte BRT')).toContain('site était en maintenance')
  })

  it('distingue service client et amplitude de transport', () => {
    const result = ask('contact SunuBRT')
    expect(result).toContain('76 215 15 15')
    expect(result).toContain('pas celles des bus')
  })

  it('ne déduit pas une correspondance validée d’un simple point de passage', () => {
    expect(ask('correspondance DDD 1 TER')).toContain('le chemin piéton')
    expect(ask('correspondance AFTU 53 TER')).toContain('Aucune correspondance garantie')
  })

  it('ne confirme pas le service semi-express depuis une page en maintenance', () => {
    expect(ask('BRT B3')).toContain('ne confirme pas leur service actuel')
  })

  it('précise les directions et les jours pour les horaires TER', () => {
    expect(ask('horaires TER')).toContain('05h35 de Diamniadio, 05h45 de Dakar')
    expect(ask('horaires TER')).toContain('Dimanches et jours fériés')
    expect(ask('horaires TER')).toContain('ne sont pas celles de chaque gare intermédiaire')
  })


  it('complète le catalogue hors ligne avec une nouvelle fiche candidate Supabase sans remplacer les fiches validées', () => {
    const candidate = {
      network: 'ddd',
      code: '999',
      origin: 'Dakar',
      destination: 'Diamniadio',
      waypoints: ['Colobane', 'Bargny', 'Diamniadio'],
      sourceUrl: 'https://example.com/ddd-38',
      detailSourceUrl: 'https://example.com/ddd-38/details',
      consultedAt: '2026-11-12',
      publishedAt: null,
      note: 'Fiche candidate de test.',
    } as BusLine

    expect(BUS_LINES.filter((line) => line.network === 'ddd')).toHaveLength(37)
    setRemoteCandidateLines([candidate])
    expect(ask('DDD 999')).toContain('Fiche candidate de la mémoire centrale')
    expect(ask('DDD 999')).toContain('Colobane → Bargny → Diamniadio')
    expect(BUS_LINES.filter((line) => line.network === 'ddd')).toHaveLength(37)
    setRemoteCandidateLines([])
  })



  it('utilise le graphe Supabase pour les deux sens, les fréquences et les correspondances candidates', () => {
    const candidate = {
      network: 'ddd',
      code: '999',
      origin: 'Dakar',
      destination: 'Rufisque',
      waypoints: [],
      sourceUrl: 'https://example.com/ddd-999',
      detailSourceUrl: 'https://example.com/ddd-999/details',
      consultedAt: '2026-11-12',
      publishedAt: null,
      note: 'Fiche candidate de test.',
    } as BusLine
    const graph = {
      generated_at: '2026-11-12T07:00:00.000Z',
      graph_only: true,
      networks: [{ id: 'network-ddd', code: 'ddd', name: 'DDD' }, { id: 'network-aftu', code: 'aftu', name: 'AFTU' }],
      lines: [{ id: 'line-ddd-999', network_id: 'network-ddd', code: '999', status: 'candidate' }],
      directions: [
        { id: 'direction-out', line_id: 'line-ddd-999', direction_code: 'outbound_candidate', origin_label: 'Dakar', destination_label: 'Rufisque', status: 'candidate' },
        { id: 'direction-return', line_id: 'line-ddd-999', direction_code: 'return_reverse_candidate', origin_label: 'Rufisque', destination_label: 'Dakar', status: 'candidate', direction_method: 'reverse_order_candidate' },
      ],
      ordered_line_stops: [
        { id: 'seq-1', direction_id: 'direction-out', stop_id: 'stop-dakar', stop_sequence: 1, stop: { id: 'stop-dakar', canonical_name: 'Dakar' } },
        { id: 'seq-2', direction_id: 'direction-out', stop_id: 'stop-colobane', stop_sequence: 2, stop: { id: 'stop-colobane', canonical_name: 'Colobane' } },
        { id: 'seq-3', direction_id: 'direction-out', stop_id: 'stop-rufisque', stop_sequence: 3, stop: { id: 'stop-rufisque', canonical_name: 'Rufisque' } },
        { id: 'seq-4', direction_id: 'direction-return', stop_id: 'stop-rufisque', stop_sequence: 1, stop: { id: 'stop-rufisque', canonical_name: 'Rufisque' } },
        { id: 'seq-5', direction_id: 'direction-return', stop_id: 'stop-colobane', stop_sequence: 2, stop: { id: 'stop-colobane', canonical_name: 'Colobane' } },
        { id: 'seq-6', direction_id: 'direction-return', stop_id: 'stop-dakar', stop_sequence: 3, stop: { id: 'stop-dakar', canonical_name: 'Dakar' } },
      ],
      reference_stops: [
        { id: 'stop-dakar', canonical_name: 'Dakar' },
        { id: 'stop-colobane', canonical_name: 'Colobane' },
        { id: 'stop-rufisque', canonical_name: 'Rufisque' },
      ],
      stop_network_memberships: [{
        stop_id: 'stop-colobane',
        canonical_name: 'Colobane',
        network_codes: ['aftu', 'ddd'],
        line_codes: ['AFTU 5', 'DDD 999'],
        direction_codes: ['outbound_candidate'],
        has_geolocation: false,
        interchange_status: 'shared_name_reference_only',
        physical_interchange_verified: false,
      }],
      service_patterns: [{
        id: 'pattern-peak',
        direction_id: 'direction-out',
        pattern_type: 'estimated_frequency',
        period_label: 'peak',
        headway_min_minutes: 7,
        headway_max_minutes: 10,
        status: 'candidate',
      }],
      transfers: [{
        id: 'transfer-1',
        from_stop_id: 'stop-colobane',
        to_stop_id: 'stop-rufisque',
        walking_distance_m: 120,
        status: 'candidate',
        label: 'Colobane ↔ Rufisque',
      }],
      data_assertions: [],
      mobility_sources: [],
    } as RemoteMobilityGraph

    setRemoteCandidateLines([candidate])
    setRemoteMobilityGraph(graph)
    const stopsReply = ask('arrêts aller retour DDD 999')
    expect(stopsReply).toContain('Dakar → Colobane → Rufisque')
    expect(stopsReply).toContain('Rufisque → Colobane → Dakar')
    const frequencyReply = ask('fréquence DDD 999')
    expect(frequencyReply).toContain('pointe : 7–10 min')
    const transferReply = ask('correspondance DDD 999')
    expect(transferReply).toContain('Correspondances potentielles')
    expect(transferReply).toContain('Colobane (aftu/ddd)')
    expect(transferReply).toContain('120 m')
    setRemoteMobilityGraph(null)
    setRemoteCandidateLines([])
  })


  it('masque un sens retour candidat dont la séquence ne correspond pas à l’inverse de l’aller', () => {
    const candidate = {
      network: 'ddd',
      code: '999',
      origin: 'Dakar',
      destination: 'Rufisque',
      waypoints: [],
      sourceUrl: 'https://example.com/ddd-999',
      detailSourceUrl: 'https://example.com/ddd-999/details',
      consultedAt: '',
      publishedAt: null,
      note: 'Fiche candidate de test.',
    } as BusLine
    const graph = {
      generated_at: '2026-11-12T07:00:00.000Z',
      graph_only: true,
      networks: [{ id: 'network-ddd', code: 'ddd' }],
      lines: [{ id: 'line-ddd-999', network_id: 'network-ddd', code: '999', status: 'candidate' }],
      directions: [
        { id: 'direction-out', line_id: 'line-ddd-999', direction_code: 'outbound_candidate', origin_label: 'Dakar', destination_label: 'Rufisque', status: 'candidate', direction_method: 'source_documented' },
        { id: 'direction-return', line_id: 'line-ddd-999', direction_code: 'return_reverse_candidate', origin_label: 'Rufisque', destination_label: 'Dakar', status: 'candidate', direction_method: 'reverse_derived' },
      ],
      ordered_line_stops: [
        { id: 'out-1', direction_id: 'direction-out', stop_id: 'stop-dakar', stop_sequence: 1, stop: { id: 'stop-dakar', canonical_name: 'Dakar' } },
        { id: 'out-2', direction_id: 'direction-out', stop_id: 'stop-colobane', stop_sequence: 2, stop: { id: 'stop-colobane', canonical_name: 'Colobane' } },
        { id: 'out-3', direction_id: 'direction-out', stop_id: 'stop-rufisque', stop_sequence: 3, stop: { id: 'stop-rufisque', canonical_name: 'Rufisque' } },
        { id: 'return-1', direction_id: 'direction-return', stop_id: 'stop-colobane', stop_sequence: 1, stop: { id: 'stop-colobane', canonical_name: 'Colobane' } },
        { id: 'return-2', direction_id: 'direction-return', stop_id: 'stop-dakar', stop_sequence: 2, stop: { id: 'stop-dakar', canonical_name: 'Dakar' } },
        { id: 'return-3', direction_id: 'direction-return', stop_id: 'stop-rufisque', stop_sequence: 3, stop: { id: 'stop-rufisque', canonical_name: 'Rufisque' } },
      ],
      reference_stops: [
        { id: 'stop-dakar', canonical_name: 'Dakar' },
        { id: 'stop-colobane', canonical_name: 'Colobane' },
        { id: 'stop-rufisque', canonical_name: 'Rufisque' },
      ],
      stop_network_memberships: [],
      service_patterns: [],
      transfers: [],
      data_assertions: [],
      mobility_sources: [],
    } as RemoteMobilityGraph

    setRemoteCandidateLines([candidate])
    setRemoteMobilityGraph(graph)
    const reply = ask('arrêts aller retour DDD 999')
    expect(reply).toContain('Dakar → Colobane → Rufisque')
    expect(reply).not.toContain('Colobane → Dakar → Rufisque')
    expect(reply).toContain('Sens retour masqué')
    setRemoteMobilityGraph(null)
    setRemoteCandidateLines([])
  })

  it('distingue une piste de presse non confirmée d’une alerte routière confirmée', () => {
    setRemoteTrafficSnapshot({
      generated_at: '2026-11-12T06:45:00.000Z',
      realtime: false,
      confirmed_traffic_incidents: [],
      traffic_candidates: [{
        id: 'news-1',
        title: 'Travaux annoncés sur la VDN',
        incident_type: 'roadworks',
        severity: 'unknown',
        status: 'unverified',
        area_label: 'VDN',
        observed_at: '2026-11-12T06:30:00.000Z',
        source_published_at: '2026-11-12T06:30:00.000Z',
        source_url: 'https://example.com/traffic-news',
      }],
      traffic_sources: [{
        id: 'source-1',
        name: 'Dakaractu · flux RSS',
        source_type: 'local_news_rss',
        status: 'partial',
        last_checked_at: '2026-11-12T06:45:00.000Z',
      }],
    })
    const candidateReply = ask('circulation à Dakar')
    expect(candidateReply).toContain('Informations routières à vérifier')
    expect(candidateReply).toContain('PAS des alertes confirmées')
    expect(candidateReply).toContain('https://example.com/traffic-news')

    setRemoteTrafficSnapshot({
      generated_at: '2026-11-12T06:46:00.000Z',
      realtime: false,
      confirmed_traffic_incidents: [{
        id: 'incident-1',
        title: 'Accident confirmé',
        incident_type: 'accident',
        severity: 'high',
        status: 'confirmed',
        area_label: 'VDN',
        observed_at: '2026-11-12T06:40:00.000Z',
        source_url: 'https://example.com/confirmed-incident',
      }],
      traffic_candidates: [],
      traffic_sources: [],
    })
    const confirmedReply = ask('circulation à Dakar')
    expect(confirmedReply).toContain('Alertes routières confirmées')
    expect(confirmedReply).toContain('Accident confirmé')
    expect(confirmedReply).toContain('VDN')
    expect(confirmedReply).toContain('https://example.com/confirmed-incident')
    setRemoteTrafficSnapshot(null)
  })

  it('ne transforme pas une statistique CETUD ou une page institutionnelle en temps réel', () => {
    expect(ask('circulation à Dakar')).toContain('statistiques historiques')
    expect(ask('TER vers AIBD')).toContain('ne suffisent pas à confirmer')
    const weather = copilotAnswer('température maintenant à Dakar', context, createConversationMemory(), 'fr')
    expect(weather.text).toContain('aucune source météo connectée')
    expect(weather.text).not.toMatch(/\d+\s*°/)
  })
})
