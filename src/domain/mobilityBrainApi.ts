/**
 * Charge le référentiel public Dakar Bus depuis Supabase.
 *
 * Seules les données de mobilité sont téléchargées. La question de l'usager,
 * l'historique du chat et sa position ne sont jamais envoyés à Supabase.
 * La clé sb_publishable_ est publique et ne donne aucun accès direct aux tables
 * privées : l'API Edge Function applique la lecture seule.
 */

export interface MobilityBrainNetwork {
  id: string
  code: string
  name: string
  operator_name?: string | null
  mode?: string | null
  status?: string
}

export interface MobilityBrainLine {
  id: string
  network_id: string
  code: string
  public_name?: string | null
  status: string
  dataset_version_id?: string | null
  source_id?: string | null
}

export interface MobilityBrainCatalogRecord {
  id: string
  network_code: string
  line_code: string
  origin_label?: string | null
  destination_label?: string | null
  source_url?: string | null
  detail_source_url?: string | null
  source_consulted_at?: string | null
  source_published_at?: string | null
  status?: string
  raw_record?: {
    waypoints?: string[]
    note?: string
    [key: string]: unknown
  } | null
}

export interface MobilityBrainStop {
  id: string
  canonical_name: string
  aliases?: string[] | null
  status?: string
}

export interface MobilityBrainDirection {
  id: string
  line_id: string
  direction_code: string
  origin_label?: string | null
  destination_label?: string | null
  status: string
  direction_method?: string | null
  direction_notes?: string | null
}

export interface MobilityBrainOrderedStop {
  id?: string
  direction_id: string
  stop_id: string
  stop_sequence: number
  stop?: MobilityBrainStop | null
}

export interface MobilityBrainServicePattern {
  id: string
  direction_id: string
  pattern_type: string
  period_label?: string | null
  service_start?: string | null
  service_end?: string | null
  service_start_earliest?: string | null
  service_start_latest?: string | null
  service_end_earliest?: string | null
  service_end_latest?: string | null
  headway_minutes?: number | string | null
  headway_min_minutes?: number | string | null
  headway_max_minutes?: number | string | null
  expected_wait_minutes?: number | string | null
  days_of_week?: number[] | null
  status: string
  notes?: string | null
}

export interface MobilityBrainTransfer {
  id: string
  from_stop_id: string
  to_stop_id: string
  walking_distance_m?: number | null
  walking_duration_seconds?: number | null
  accessibility_status?: string | null
  status: string
  transfer_type?: string | null
  label?: string | null
  notes?: string | null
}

export interface MobilityBrainSnapshot {
  generated_at: string
  source_of_truth: string
  realtime: false
  policy?: string
  networks: MobilityBrainNetwork[]
  lines: MobilityBrainLine[]
  catalogue: MobilityBrainCatalogRecord[]
  reference_stops: MobilityBrainStop[]
  directions: MobilityBrainDirection[]
  ordered_line_stops: MobilityBrainOrderedStop[]
  service_patterns: MobilityBrainServicePattern[]
  transfers: MobilityBrainTransfer[]
}

const SUPABASE_URL = 'https://mdmuxzaewqzqutkqdylo.supabase.co'
// Publishable key: intended for browser use. Never replace with a service_role key.
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YsnzMxuSKWCLhtyMWhHncA_bDeWUt3J'

let cachedSnapshot: MobilityBrainSnapshot | null = null
let pendingLoad: Promise<MobilityBrainSnapshot | null> | null = null

function isSnapshot(value: unknown): value is MobilityBrainSnapshot {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return Array.isArray(data.networks)
    && Array.isArray(data.lines)
    && Array.isArray(data.catalogue)
    && Array.isArray(data.reference_stops)
    && Array.isArray(data.directions)
    && Array.isArray(data.ordered_line_stops)
    && Array.isArray(data.service_patterns)
    && Array.isArray(data.transfers)
    && data.realtime === false
}

/**
 * Télécharge une seule fois le référentiel complet pendant la vie de la page.
 * En cas d'absence de réseau, l'assistant conserve son moteur local habituel.
 */
export function loadMobilityBrainKnowledge(): Promise<MobilityBrainSnapshot | null> {
  if (cachedSnapshot) return Promise.resolve(cachedSnapshot)
  if (pendingLoad) return pendingLoad

  pendingLoad = fetch(`${SUPABASE_URL}/functions/v1/dakar-bus-knowledge`, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Supabase knowledge API: HTTP ${response.status}`)
      const payload: unknown = await response.json()
      if (!isSnapshot(payload)) throw new Error('Supabase knowledge API: invalid snapshot')
      cachedSnapshot = payload
      return payload
    })
    .catch((error: unknown) => {
      console.warn('Dakar Bus: référentiel Supabase indisponible, repli local conservé.', error)
      return null
    })
    .finally(() => {
      pendingLoad = null
    })

  return pendingLoad
}
