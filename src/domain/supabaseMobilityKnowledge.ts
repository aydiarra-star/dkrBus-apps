/**
 * Lecture distante de la mémoire publique Dakar Bus.
 * La clé utilisée ici est une clé publishable (publique), jamais une service_role.
 * Si Supabase est indisponible, le copilote conserve son référentiel local.
 */

export interface SupabaseKnowledgeLine {
  id: string
  network_id: string
  code: string
  public_name?: string | null
  status: string
}

export interface SupabaseKnowledgeCatalogRecord {
  network_code: string
  line_code: string
  origin_label?: string | null
  destination_label?: string | null
  source_url?: string | null
  detail_source_url?: string | null
  source_consulted_at?: string | null
  source_published_at?: string | null
  raw_record?: Record<string, unknown> | null
  status?: string
}

export interface SupabaseKnowledgeDirection {
  id: string
  line_id: string
  direction_code: string
  origin_label?: string | null
  destination_label?: string | null
  status: string
  direction_method?: string | null
  direction_notes?: string | null
}

export interface SupabaseKnowledgeStop {
  id: string
  canonical_name: string
  aliases?: string[]
}

export interface SupabaseKnowledgeOrderedStop {
  direction_id: string
  stop_id: string
  stop_sequence: number
  stop?: SupabaseKnowledgeStop | null
}

export interface SupabaseKnowledgeServicePattern {
  direction_id: string
  pattern_type: string
  service_start?: string | null
  service_end?: string | null
  headway_minutes?: number | null
  days_of_week?: number[]
  status: string
  notes?: string | null
}

export interface SupabaseKnowledgeAssertion {
  subject_type: string
  subject_id?: string | null
  predicate: string
  value_json: Record<string, unknown>
  status: string
}

export interface SupabaseKnowledgeSharedStop {
  stop_id: string
  canonical_name: string
  network_codes: string[]
  line_codes: string[]
  geocoded: boolean
  status: string
}

export interface SupabaseKnowledgeTransfer {
  label?: string | null
  status: string
  transfer_type?: string | null
  walking_distance_m?: number | null
  notes?: string | null
  from_stop?: SupabaseKnowledgeStop | null
  to_stop?: SupabaseKnowledgeStop | null
}

export interface SupabaseKnowledgeTrafficSource {
  name: string
  status: string
  last_checked_at?: string | null
  metadata?: Record<string, unknown>
}

export interface SupabaseKnowledgeTrafficIncident {
  title: string
  description?: string | null
  incident_type?: string | null
  severity?: string | null
  status: string
  area_label?: string | null
  source_url?: string | null
  observed_at?: string | null
  expires_at?: string | null
}

export interface SupabaseMobilityKnowledgeSnapshot {
  generated_at?: string
  realtime?: boolean
  networks?: Array<{ id: string; code: string; name: string; status: string }>
  lines: SupabaseKnowledgeLine[]
  catalogue: SupabaseKnowledgeCatalogRecord[]
  directions: SupabaseKnowledgeDirection[]
  ordered_line_stops: SupabaseKnowledgeOrderedStop[]
  reference_stops?: SupabaseKnowledgeStop[]
  service_patterns?: SupabaseKnowledgeServicePattern[]
  transfers?: SupabaseKnowledgeTransfer[]
  shared_stops?: SupabaseKnowledgeSharedStop[]
  counts?: { unlocated_shared_stop_names?: number }
  data_assertions?: SupabaseKnowledgeAssertion[]
  confirmed_traffic_incidents?: SupabaseKnowledgeTrafficIncident[]
  unverified_traffic_candidates?: SupabaseKnowledgeTrafficIncident[]
  traffic_sources?: SupabaseKnowledgeTrafficSource[]
  counts?: Record<string, number>
}

export interface SupabaseKnowledgeReply {
  text: string
  lineId?: string
}

const SUPABASE_URL = 'https://mdmuxzaewqzqutkqdylo.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YsnzMxuSKWCLhtyMWhHncA_bDeWUt3J'
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/dakar-bus-knowledge`
const CACHE_MS = 5 * 60 * 1000

export interface SupabaseKnowledgeFetchOptions {
  network?: string
  lineCode?: string
  trafficOnly?: boolean
  transferOnly?: boolean
}

const cachedSnapshots = new Map<string, { snapshot: SupabaseMobilityKnowledgeSnapshot; at: number }>()
const inFlightRequests = new Map<string, Promise<SupabaseMobilityKnowledgeSnapshot | null>>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSnapshot(value: unknown): value is SupabaseMobilityKnowledgeSnapshot {
  if (!isRecord(value)) return false
  return Array.isArray(value.lines)
    && Array.isArray(value.catalogue)
    && Array.isArray(value.directions)
    && Array.isArray(value.ordered_line_stops)
}

export async function fetchSupabaseMobilityKnowledge(
  options: SupabaseKnowledgeFetchOptions = {},
  signal?: AbortSignal,
): Promise<SupabaseMobilityKnowledgeSnapshot | null> {
  const cacheKey = options.trafficOnly
    ? 'traffic'
    : options.transferOnly ? 'transfers' : `${options.network ?? 'all'}:${options.lineCode ?? ''}`
  const cached = cachedSnapshots.get(cacheKey)
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.snapshot
  const existing = inFlightRequests.get(cacheKey)
  if (existing) return existing

  const url = new URL(FUNCTION_URL)
  if (options.network) url.searchParams.set('network', options.network)
  if (options.lineCode) url.searchParams.set('line', options.lineCode.toLowerCase())
  if (options.trafficOnly) url.searchParams.set('traffic_only', '1')
  if (options.transferOnly) url.searchParams.set('transfer_only', '1')

  const controller = new AbortController()
  const abortFromCaller = () => controller.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })
  const timeout = window.setTimeout(() => controller.abort(), 9_000)

  const request = fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      Accept: 'application/json',
    },
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Supabase knowledge HTTP ${response.status}`)
      const payload: unknown = await response.json()
      let snapshot: SupabaseMobilityKnowledgeSnapshot | null = null
      if (isSnapshot(payload)) {
        snapshot = payload
      } else if (isRecord(payload) && payload.traffic_only === true) {
        snapshot = {
          lines: [],
          catalogue: [],
          directions: [],
          ordered_line_stops: [],
          confirmed_traffic_incidents: Array.isArray(payload.confirmed_traffic_incidents)
            ? payload.confirmed_traffic_incidents as SupabaseKnowledgeTrafficIncident[]
            : [],
          unverified_traffic_candidates: Array.isArray(payload.traffic_candidates)
            ? payload.traffic_candidates as SupabaseKnowledgeTrafficIncident[]
            : [],
          traffic_sources: Array.isArray(payload.traffic_sources)
            ? payload.traffic_sources as SupabaseKnowledgeTrafficSource[]
            : [],
          realtime: false,
        }
      } else if (isRecord(payload) && payload.transfer_only === true) {
        snapshot = {
          lines: [],
          catalogue: [],
          directions: [],
          ordered_line_stops: [],
          transfers: Array.isArray(payload.transfers) ? payload.transfers as SupabaseKnowledgeTransfer[] : [],
          shared_stops: Array.isArray(payload.shared_stops) ? payload.shared_stops as SupabaseKnowledgeSharedStop[] : [],
          counts: isRecord(payload.counts) ? payload.counts as { unlocated_shared_stop_names?: number } : undefined,
          realtime: false,
        }
      }
      if (!snapshot) throw new Error('Supabase knowledge payload invalid')
      cachedSnapshots.set(cacheKey, { snapshot, at: Date.now() })
      return snapshot
    })
    .catch(() => null)
    .finally(() => {
      window.clearTimeout(timeout)
      signal?.removeEventListener('abort', abortFromCaller)
      inFlightRequests.delete(cacheKey)
    })

  inFlightRequests.set(cacheKey, request)
  return request
}

export function clearSupabaseMobilityKnowledgeCache(): void {
  cachedSnapshots.clear()
  inFlightRequests.clear()
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()
}

function networkFromQuestion(text: string): string | null {
  if (/\bbrt\b/.test(text)) return 'brt'
  if (/\btata\b/.test(text)) return 'tata'
  if (/\baftu\b/.test(text)) return 'aftu'
  if (/\bddd\b|dem dikk/.test(text)) return 'ddd'
  return null
}

export function supabaseFetchOptionsForQuestion(
  question: string,
  lastLineId?: string | null,
): SupabaseKnowledgeFetchOptions | null {
  const text = normalize(question)
  if (/\b(trafic|circulation|bouchons?|embouteillages?|accidents?|perturbations?|routes? bloquees?)\b/.test(text)) {
    return { trafficOnly: true }
  }
  let network = networkFromQuestion(text)
  let lineCode = /\b(?:ligne|bus|brt|ddd|aftu|tata)\s*(?:n(?:umero|°)?\s*)?([0-9]{1,3}[a-z]?|b[12]|to1)\b/i.exec(text)?.[1]?.toUpperCase()
  if (!network && lastLineId && /^(et |ses |les arrets|les horaires|son |elle passe)/.test(text)) {
    const [lastNetwork, lastCode] = lastLineId.split(':')
    if (['ddd', 'aftu', 'tata', 'brt'].includes(lastNetwork)) {
      network = lastNetwork
      lineCode = lastCode?.toUpperCase()
    }
  }
  return network
    ? { network, ...(lineCode ? { lineCode } : {}) }
    : lineCode ? { lineCode } : null
}

function sourceLine(record: SupabaseKnowledgeCatalogRecord): string {
  const url = record.detail_source_url || record.source_url
  if (!url) return ''
  const date = record.source_published_at || record.source_consulted_at
  return `\nSource : ${url}\nConsultée le ${date || 'date non précisée'}. Référence documentaire, pas un suivi en direct.`
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function extractStopQuery(question: string): string | null {
  const text = normalize(question)
  if (!/\b(arret|station|gare)\b/.test(text)) return null
  const name = text.replace(/\b(ou|est|se|trouve|l|le|la|les|un|une|arret|station|gare|du|de|des|dans|sur|reseau|ddd|aftu|tata|brt|ter|bus)\b/g, ' ')
    .replace(/\s+/g, ' ').trim()
  return name.length >= 2 ? name : null
}

function stopReply(question: string, snapshot: SupabaseMobilityKnowledgeSnapshot): SupabaseKnowledgeReply | null {
  const query = extractStopQuery(question)
  if (!query) return null
  const candidates = new Map<string, SupabaseKnowledgeStop>()
  for (const stop of snapshot.reference_stops ?? []) {
    const names = [stop.canonical_name, ...(stop.aliases ?? [])].map(normalize)
    if (names.some((name) => name.includes(query) || query.includes(name))) candidates.set(stop.id, stop)
  }
  for (const row of snapshot.ordered_line_stops) {
    const stop = row.stop
    if (!stop) continue
    const names = [stop.canonical_name, ...(stop.aliases ?? [])].map(normalize)
    if (names.some((name) => name.includes(query) || query.includes(name))) candidates.set(stop.id, stop)
  }
  if (!candidates.size) return null

  const directionById = new Map(snapshot.directions.map((direction) => [direction.id, direction]))
  const lineById = new Map(snapshot.lines.map((line) => [line.id, line]))
  const networkById = new Map((snapshot.networks ?? []).map((network) => [network.id, network.code]))
  const serving = new Set<string>()
  for (const row of snapshot.ordered_line_stops) {
    if (!row.stop_id || !candidates.has(row.stop_id)) continue
    const direction = directionById.get(row.direction_id)
    const line = direction ? lineById.get(direction.line_id) : undefined
    if (!line) continue
    const network = networkById.get(line.network_id) ?? 'bus'
    serving.add(`${network.toUpperCase()} ${line.code}`)
  }
  const names = [...candidates.values()].slice(0, 5).map((stop) => stop.canonical_name)
  return {
    text: `Arrêt(s) trouvé(s) dans la mémoire : ${names.join(', ')}.\n${serving.size
      ? `Lignes associées aux séquences enregistrées : ${[...serving].sort().join(', ')}.`
      : 'Aucune ligne n’est encore reliée à cet arrêt dans la mémoire.'}\nLes associations non publiées restent à confirmer avant de garantir un passage.`,
  }
}

function lineReply(
  line: SupabaseKnowledgeLine,
  snapshot: SupabaseMobilityKnowledgeSnapshot,
): SupabaseKnowledgeReply {
  const network = snapshot.networks?.find((item) => item.id === line.network_id)?.code
    ?? snapshot.catalogue.find((item) => item.line_code === line.code)?.network_code
    ?? 'bus'
  const record = snapshot.catalogue.find((item) => item.network_code === network && item.line_code === line.code)
  const directions = snapshot.directions.filter((direction) => direction.line_id === line.id)
  const outbound = directions.find((direction) =>
    direction.direction_method !== 'reverse_derived'
    && !direction.direction_code.includes('return'),
  )
  const ordered = outbound
    ? snapshot.ordered_line_stops
      .filter((stop) => stop.direction_id === outbound.id)
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
      .map((stop) => stop.stop?.canonical_name)
      .filter((name): name is string => Boolean(name))
    : []
  const raw = record?.raw_record ?? {}
  const rawStops = textArray(raw.published_stops).length
    ? textArray(raw.published_stops)
    : textArray(raw.waypoints)
  const waypoints = ordered.length ? ordered : rawStops
  const origin = record?.origin_label || outbound?.origin_label || null
  const destination = record?.destination_label || outbound?.destination_label || null
  const label = origin && destination
    ? `${network.toUpperCase()} ${line.code} : ${origin} ↔ ${destination}`
    : `${network.toUpperCase()} ${line.code} : itinéraire non renseigné`
  const details = waypoints.length
    ? `Repères dans le sens publié :\n${waypoints.join(' → ')}\nCe sont des repères documentaires, pas nécessairement des arrêts géolocalisés.`
    : outbound?.direction_code === 'schedule_reference_only'
      ? 'Horaires de service enregistrés ; terminus et séquence d’arrêts non renseignés.'
      : 'Terminaux documentés ; séquence intermédiaire d’arrêts non disponible dans la mémoire actuelle.'
  const returnDirection = directions.find((direction) => direction.direction_code.includes('return'))
  const returnNote = returnDirection?.direction_method === 'reverse_derived'
    ? 'Sens retour calculé par inversion de l’aller ; il n’est pas confirmé par une fiche retour opérateur.'
    : returnDirection?.direction_method === 'unknown'
      ? 'Le parcours est un circuit ou son sens retour distinct n’est pas établi.'
      : 'Aucun sens retour distinct confirmé dans cette fiche.'
  const patternRows = snapshot.service_patterns?.filter((pattern) => pattern.direction_id === outbound?.id) ?? []
  const verifiedPatterns = patternRows.filter((pattern) => pattern.status === 'verified' || pattern.status === 'published')
  const frequency = verifiedPatterns.length
    ? `\nFréquences de référence : ${verifiedPatterns.map((pattern) =>
        `${pattern.service_start?.slice(0, 5) || 'début non précisé'}–${pattern.service_end?.slice(0, 5) || 'fin non précisée'} : ${pattern.headway_minutes ?? '?'} min`,
      ).join('; ')}.`
    : ''
  const status = line.status === 'published'
    ? 'Fiche publiée'
    : verifiedPatterns.length && waypoints.length
      ? 'Horaires de référence vérifiés ; repères de parcours disponibles'
      : verifiedPatterns.length
        ? 'Horaires de référence vérifiés ; itinéraire et arrêts incomplets'
        : 'Fiche candidate, à confirmer avant utilisation comme itinéraire garanti'
  const note = typeof raw.published_route_note === 'string'
    ? raw.published_route_note
    : typeof raw.note === 'string' ? raw.note : outbound?.direction_notes
  const source = record ? sourceLine(record) : ''
  return {
    text: `${label}\n${status}.\n${details}\n${returnNote}${frequency}${note ? `\nRéserve : ${note}` : ''}${source}`,
    lineId: `${network}:${line.code}`,
  }
}

function trafficReply(question: string, snapshot: SupabaseMobilityKnowledgeSnapshot, now: number): SupabaseKnowledgeReply | null {
  if (!/\b(trafic|circulation|bouchon|embouteillage|accident|perturbation|route bloquee)\b/.test(normalize(question))) return null
  const active = (snapshot.confirmed_traffic_incidents ?? []).filter((incident) =>
    !incident.expires_at || new Date(incident.expires_at).getTime() > now,
  )
  if (active.length) {
    return {
      text: `Alertes routières confirmées dans la mémoire Dakar Bus :\n${active.slice(0, 5).map((incident) =>
        `• ${incident.area_label ? incident.area_label + ' — ' : ''}${incident.title}. ${incident.description || ''}`,
      ).join('\n')}\nCes alertes sont horodatées dans la base ; vérifiez leur fraîcheur avant de partir.`,
    }
  }
  const candidates = (snapshot.unverified_traffic_candidates ?? []).filter((incident) =>
    !incident.expires_at || new Date(incident.expires_at).getTime() > now,
  )
  if (candidates.length) {
    return {
      text: `Articles de circulation repérés, mais non confirmés :\n${candidates.slice(0, 5).map((incident) =>
        `• ${incident.area_label ? incident.area_label + ' — ' : ''}${incident.title} (${incident.source_url || 'source non disponible'})`,
      ).join('\n')}\nCe sont des pistes à vérifier, pas des alertes confirmées. La collecte RSS n’est pas un flux de trafic en temps réel.`,
    }
  }
  const checkedRss = (snapshot.traffic_sources ?? []).filter((source) =>
    source.status === 'partial' && Boolean(source.last_checked_at),
  )
  if (checkedRss.length) {
    return {
      text: `Aucune alerte routière confirmée ni aucun nouvel article candidat repéré dans les flux RSS accessibles.\nDerniers contrôles :\n${checkedRss.map((source) => {
        const count = source.metadata?.last_feed_item_count
        return `• ${source.name} : ${source.last_checked_at}${typeof count === 'number' ? ` (${count} articles lus)` : ''}`
      }).join('\n')}\nCes flux de presse ne sont pas des capteurs de circulation en direct ; cela ne garantit pas que les routes soient fluides.`,
    }
  }
  return null
}

export function answerSupabaseMobilityKnowledge(
  question: string,
  snapshot: SupabaseMobilityKnowledgeSnapshot | null | undefined,
  lastLineId?: string | null,
  now = Date.now(),
): SupabaseKnowledgeReply | null {
  if (!snapshot) return null
  const text = normalize(question)
  const traffic = trafficReply(question, snapshot, now)
  if (traffic) return traffic

  const explicitNetwork = networkFromQuestion(text)
  const codeMatch = /\b(?:ligne|bus|brt|ddd|aftu|tata)\s*(?:n(?:umero|°)?\s*)?([0-9]{1,3}[a-z]?|b[12]|to1)\b/i.exec(text)
  const code = codeMatch?.[1]?.toUpperCase()
  let matches = snapshot.lines.filter((line) => {
    const network = snapshot.networks?.find((item) => item.id === line.network_id)?.code
      ?? snapshot.catalogue.find((item) => item.line_code === line.code)?.network_code
    return (!explicitNetwork || network === explicitNetwork) && (!code || line.code.toUpperCase() === code)
  })

  if (!code && lastLineId && /^(et |ses |les arrets|les horaires|son |elle passe)/.test(text)) {
    const [network, lineCode] = lastLineId.split(':')
    matches = snapshot.lines.filter((line) => line.code.toUpperCase() === lineCode.toUpperCase()
      && (snapshot.networks?.find((item) => item.id === line.network_id)?.code
        ?? snapshot.catalogue.find((item) => item.line_code === line.code)?.network_code) === network)
  }

  if (code && matches.length === 0) {
    const variant = (snapshot.data_assertions ?? []).find((assertion) =>
      assertion.predicate === 'variant_service'
      && (assertion.status === 'verified' || assertion.status === 'published')
      && normalize(String(assertion.value_json.code ?? '')) === normalize(code)
      && (!explicitNetwork || explicitNetwork === 'ddd'),
    )
    if (variant) {
      const origin = String(variant.value_json.origin ?? 'Origine non précisée')
      const destination = String(variant.value_json.destination ?? 'Destination non précisée')
      const note = String(variant.value_json.note ?? 'Arrêts intermédiaires non renseignés.')
      const source = String(variant.value_json.source_url ?? 'https://demdikk.sn/info-voyageurs/')
      return {
        text: `DDD ${code} : ${origin} ↔ ${destination}\nVariante listée sur la page officielle Info voyageurs.\n${note}\nSource : ${source}. Les arrêts propres à cette variante ne sont pas encore détaillés dans la mémoire.`,
      }
    }
  }

  if (code && matches.length > 1) {
    return { text: `Le numéro ${code} existe sur plusieurs réseaux :\n${matches.map((line) => {
      const network = snapshot.networks?.find((item) => item.id === line.network_id)?.code
        ?? snapshot.catalogue.find((item) => item.line_code === line.code)?.network_code ?? 'bus'
      const record = snapshot.catalogue.find((item) => item.network_code === network && item.line_code === line.code)
      return `• ${network.toUpperCase()} ${line.code} : ${record?.origin_label || '?'} ↔ ${record?.destination_label || '?'}`
    }).join('\n')}\nPrécisez le réseau pour éviter une confusion.` }
  }
  if (code && matches.length === 1) return lineReply(matches[0], snapshot)

  if (!code) {
    const stop = stopReply(question, snapshot)
    if (stop) return stop
  }

  if (!code && explicitNetwork && /\b(liste|lignes|numeros|reseau|toutes)\b/.test(text)) {
    const codes = matches.map((line) => line.code).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))
    return {
      text: `${explicitNetwork.toUpperCase()} : ${codes.length} fiches dans la mémoire centrale.\n${codes.join(', ')}\nLes fiches candidates sont conservées séparément des données confirmées ; un numéro présent n’est pas une garantie de passage en temps réel.`,
    }
  }

  if (/\b(correspondance|correspondances|transfert|transferts)\b/.test(text)) {
    const confirmed = (snapshot.transfers ?? []).filter((transfer) => transfer.status === 'verified' || transfer.status === 'published')
    if (confirmed.length) {
      return { text: `Correspondances confirmées :\n${confirmed.slice(0, 8).map((transfer) =>
        `• ${transfer.label || `${transfer.from_stop?.canonical_name || '?'} ↔ ${transfer.to_stop?.canonical_name || '?'}`}`,
      ).join('\n')}` }
    }
    const candidates = snapshot.transfers ?? []
    if (candidates.length) {
      return { text: `Correspondances candidates à vérifier :\n${candidates.slice(0, 8).map((transfer) =>
        `• ${transfer.label || `${transfer.from_stop?.canonical_name || '?'} ↔ ${transfer.to_stop?.canonical_name || '?'}`}${transfer.walking_distance_m ? ` (environ ${transfer.walking_distance_m} m)` : ''}`,
      ).join('\n')}\nLe chemin piéton et l’accessibilité ne sont pas confirmés.` }
    }
  }
  return null
}
