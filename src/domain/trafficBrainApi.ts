import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './mobilityBrainApi'

export interface RemoteTrafficSource {
  id: string
  name: string
  source_type: string
  url?: string | null
  status: string
  polling_interval_seconds?: number | null
  metadata?: Record<string, unknown> | null
  last_checked_at?: string | null
  integration_method?: string | null
  requires_credentials?: boolean | null
}

export interface RemoteTrafficIncident {
  id: string
  title: string
  description?: string | null
  incident_type: string
  severity: string
  status: string
  area_label?: string | null
  observed_at: string
  confirmed_at?: string | null
  expires_at?: string | null
  source_url?: string | null
  source_published_at?: string | null
  metadata?: Record<string, unknown> | null
  traffic_source_id?: string | null
}

export interface RemoteTrafficSnapshot {
  generated_at: string
  source_of_truth: string
  realtime: false
  traffic_only: true
  alert_policy: string
  traffic_data_status?: {
    status: string
    reason_code?: string
    configured_realtime_sources?: number
    message?: string
  }
  confirmed_traffic_incidents: RemoteTrafficIncident[]
  traffic_candidates: RemoteTrafficIncident[]
  traffic_sources: RemoteTrafficSource[]
  counts?: {
    confirmed_active_incidents?: number
    unverified_traffic_candidates?: number
    configured_sources?: number
  }
}

const CACHE_TTL_MS = 5 * 60 * 1000
let cachedSnapshot: RemoteTrafficSnapshot | null = null
let cachedAt = 0
let pendingLoad: Promise<RemoteTrafficSnapshot | null> | null = null

function isTrafficSnapshot(value: unknown): value is RemoteTrafficSnapshot {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return data.realtime === false
    && data.traffic_only === true
    && Array.isArray(data.confirmed_traffic_incidents)
    && Array.isArray(data.traffic_candidates)
    && Array.isArray(data.traffic_sources)
}

/**
 * Télécharge uniquement l'état des alertes et des sources. Aucune question,
 * position GPS ou conversation n'est transmise à l'API.
 */
export function loadTrafficBrainKnowledge(): Promise<RemoteTrafficSnapshot | null> {
  if (import.meta.env.MODE === 'test') return Promise.resolve(null)
  if (cachedSnapshot && Date.now() - cachedAt < CACHE_TTL_MS) return Promise.resolve(cachedSnapshot)
  if (pendingLoad) return pendingLoad

  pendingLoad = fetch(`${SUPABASE_URL}/functions/v1/dakar-bus-knowledge?traffic_only=1`, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Supabase traffic API: HTTP ${response.status}`)
      const payload: unknown = await response.json()
      if (!isTrafficSnapshot(payload)) throw new Error('Supabase traffic API: invalid snapshot')
      cachedSnapshot = payload
      cachedAt = Date.now()
      return payload
    })
    .catch((error: unknown) => {
      console.warn('Dakar Bus: état trafic Supabase indisponible.', error)
      return null
    })
    .finally(() => {
      pendingLoad = null
    })

  return pendingLoad
}
