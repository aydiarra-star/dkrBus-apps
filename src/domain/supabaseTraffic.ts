import {
  setRemoteTrafficSnapshot,
  type RemoteTrafficSnapshot,
} from './mobilityKnowledge'
import { SUPABASE_KNOWLEDGE_ENDPOINT, SUPABASE_PUBLISHABLE_KEY } from './supabaseConfig'

const CACHE_KEY = 'dakar-bus:supabase-traffic:v1'
const CACHE_MAX_AGE_MS = 30 * 60 * 1000

type TrafficResponse = RemoteTrafficSnapshot & {
  traffic_only?: boolean
}

type CachedTraffic = {
  savedAt: number
  snapshot: RemoteTrafficSnapshot
}

/** Restaure la dernière copie connue pour que le copilote reste utile hors ligne. */
export function hydrateSupabaseTrafficFromCache(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return false
    const cached = JSON.parse(raw) as CachedTraffic
    if (!cached || typeof cached.savedAt !== 'number' || !cached.snapshot) return false
    if (Date.now() - cached.savedAt > CACHE_MAX_AGE_MS) return false
    setRemoteTrafficSnapshot(cached.snapshot)
    return true
  } catch {
    return false
  }
}

/** Récupère uniquement les alertes routières, sans télécharger tout le graphe mobilité. */
export async function refreshSupabaseTraffic(
  fetcher: typeof fetch = fetch,
): Promise<{ ok: boolean; confirmed: number; candidates: number }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)

  try {
    const response = await fetcher(`${SUPABASE_KNOWLEDGE_ENDPOINT}?traffic_only=1`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Accept: 'application/json',
      },
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    })
    if (!response.ok) return { ok: false, confirmed: 0, candidates: 0 }

    const payload = await response.json() as TrafficResponse
    if (
      payload.traffic_only !== true
      || !Array.isArray(payload.confirmed_traffic_incidents)
      || !Array.isArray(payload.traffic_candidates)
      || !Array.isArray(payload.traffic_sources)
    ) return { ok: false, confirmed: 0, candidates: 0 }

    const snapshot: RemoteTrafficSnapshot = {
      generated_at: payload.generated_at,
      realtime: false,
      confirmed_traffic_incidents: payload.confirmed_traffic_incidents,
      traffic_candidates: payload.traffic_candidates,
      traffic_sources: payload.traffic_sources,
    }
    setRemoteTrafficSnapshot(snapshot)

    if (typeof window !== 'undefined') {
      try {
        const cached: CachedTraffic = { savedAt: Date.now(), snapshot }
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
      } catch {
        // Le cache est facultatif ; la copie mémoire reste disponible.
      }
    }

    return {
      ok: true,
      confirmed: snapshot.confirmed_traffic_incidents.length,
      candidates: snapshot.traffic_candidates.length,
    }
  } catch {
    return { ok: false, confirmed: 0, candidates: 0 }
  } finally {
    clearTimeout(timeout)
  }
}
