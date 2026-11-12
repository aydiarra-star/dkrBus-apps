import {
  BUS_LINES,
  setRemoteCandidateLines,
  type BusLine,
} from './mobilityKnowledge'

const KNOWLEDGE_ENDPOINT = 'https://mdmuxzaewqzqutkqdylo.supabase.co/functions/v1/dakar-bus-knowledge'
// Clé publishable publique : elle peut être utilisée dans le navigateur.
// Ne jamais remplacer par une clé secret/service_role.
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YsnzMxuSKWCLhtyMWhHncA_bDeWUt3J'
const CACHE_KEY = 'dakar-bus:supabase-candidate-lines:v1'
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

type CatalogueRecord = {
  network_code?: unknown
  line_code?: unknown
  origin_label?: unknown
  destination_label?: unknown
  source_url?: unknown
  detail_source_url?: unknown
  source_consulted_at?: unknown
  source_published_at?: unknown
  raw_record?: unknown
  status?: unknown
}

type CatalogueResponse = {
  catalogue?: CatalogueRecord[]
  catalogue_only?: boolean
}

type CachedKnowledge = {
  savedAt: number
  lines: BusLine[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mapCandidateLines(records: CatalogueRecord[]): BusLine[] {
  const localKeys = new Set(BUS_LINES.map((line) => `${line.network}:${line.code}`))
  const seen = new Set<string>()

  return records.flatMap((record) => {
    const network = record.network_code
    if (network !== 'ddd' && network !== 'aftu') return []
    if (record.status && record.status !== 'candidate') return []

    const code = typeof record.line_code === 'string' ? record.line_code.trim() : ''
    const origin = typeof record.origin_label === 'string' ? record.origin_label.trim() : ''
    const destination = typeof record.destination_label === 'string' ? record.destination_label.trim() : ''
    const sourceUrl = typeof record.source_url === 'string' ? record.source_url : ''
    const consultedAt = typeof record.source_consulted_at === 'string'
      ? record.source_consulted_at.slice(0, 10)
      : ''
    if (!code || !origin || !destination || !sourceUrl || !/^\d{4}-\d{2}-\d{2}$/.test(consultedAt)) return []

    const key = `${network}:${code}`
    if (localKeys.has(key) || seen.has(key)) return []
    seen.add(key)

    const raw = isRecord(record.raw_record) ? record.raw_record : {}
    const waypoints = Array.isArray(raw.waypoints)
      ? raw.waypoints.filter((point): point is string => typeof point === 'string' && point.trim().length > 0)
      : []
    const detailSourceUrl = typeof record.detail_source_url === 'string' && record.detail_source_url
      ? record.detail_source_url
      : sourceUrl
    const publishedAt = typeof record.source_published_at === 'string'
      ? record.source_published_at.slice(0, 10)
      : null
    const note = typeof raw.note === 'string' && raw.note.trim()
      ? raw.note
      : 'Fiche candidate issue du catalogue central ; parcours à confirmer auprès de l’opérateur.'

    return [{
      network,
      code,
      origin,
      destination,
      waypoints,
      sourceUrl,
      detailSourceUrl,
      consultedAt,
      publishedAt,
      note,
    } as BusLine]
  })
}

/** Charge immédiatement la dernière copie locale, sans attendre le réseau. */
export function hydrateSupabaseKnowledgeFromCache(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return false
    const cached = JSON.parse(raw) as CachedKnowledge
    if (!cached || !Array.isArray(cached.lines) || typeof cached.savedAt !== 'number') return false
    if (Date.now() - cached.savedAt > CACHE_MAX_AGE_MS) return false
    setRemoteCandidateLines(cached.lines)
    return true
  } catch {
    return false
  }
}

/**
 * Synchronisation non bloquante avec Supabase.
 * Les fiches locales validées gardent toujours la priorité ; seules les nouvelles
 * fiches DDD/AFTU absentes du catalogue embarqué deviennent un complément candidat.
 */
export async function refreshSupabaseKnowledge(
  fetcher: typeof fetch = fetch,
): Promise<{ ok: boolean; count: number }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetcher(`${KNOWLEDGE_ENDPOINT}?catalogue_only=1`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Accept: 'application/json',
      },
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    })
    if (!response.ok) return { ok: false, count: 0 }

    const payload = await response.json() as CatalogueResponse
    if (payload.catalogue_only !== true || !Array.isArray(payload.catalogue)) {
      return { ok: false, count: 0 }
    }

    const lines = mapCandidateLines(payload.catalogue)
    setRemoteCandidateLines(lines)

    if (typeof window !== 'undefined') {
      try {
        const cached: CachedKnowledge = { savedAt: Date.now(), lines }
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
      } catch {
        // Le cache est facultatif : la copie en mémoire reste utilisable.
      }
    }

    return { ok: true, count: lines.length }
  } catch {
    return { ok: false, count: 0 }
  } finally {
    clearTimeout(timeout)
  }
}
