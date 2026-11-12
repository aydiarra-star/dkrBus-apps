import {
  setRemoteMobilityGraph,
  type RemoteMobilityGraph,
} from './mobilityKnowledge'
import { SUPABASE_KNOWLEDGE_ENDPOINT, SUPABASE_PUBLISHABLE_KEY } from './supabaseKnowledge'

const DATABASE_NAME = 'dakar-bus-supabase-memory'
const STORE_NAME = 'snapshots'
const CACHE_KEY = 'mobility-graph-v1'
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000
const NETWORKS_TO_SYNC = ['ddd', 'aftu'] as const

type CachedGraph = {
  savedAt: number
  graph: RemoteMobilityGraph
}

function openCache(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open local mobility cache'))
  })
}

async function readCache(): Promise<CachedGraph | null> {
  const db = await openCache()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(CACHE_KEY)
      request.onsuccess = () => resolve((request.result as CachedGraph | undefined) ?? null)
      request.onerror = () => reject(request.error ?? new Error('Unable to read local mobility cache'))
    })
  } finally {
    db.close()
  }
}

async function writeCache(graph: RemoteMobilityGraph): Promise<void> {
  const db = await openCache()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put({ savedAt: Date.now(), graph } satisfies CachedGraph, CACHE_KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save local mobility cache'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Local mobility cache write aborted'))
    })
  } finally {
    db.close()
  }
}

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  const byId = new Map<string, T>()
  for (const row of rows) byId.set(row.id, row)
  return [...byId.values()]
}

function mergeGraphs(graphs: RemoteMobilityGraph[]): RemoteMobilityGraph {
  const membershipByStop = new Map<string, RemoteMobilityGraph['stop_network_memberships'][number]>()
  for (const graph of graphs) {
    for (const item of graph.stop_network_memberships) {
      const existing = membershipByStop.get(item.stop_id)
      if (!existing) {
        membershipByStop.set(item.stop_id, {
          ...item,
          network_codes: [...new Set(item.network_codes)],
          line_codes: [...new Set(item.line_codes)],
          direction_codes: [...new Set(item.direction_codes)],
          physical_interchange_verified: false,
        })
        continue
      }
      existing.network_codes = [...new Set([...existing.network_codes, ...item.network_codes])].sort()
      existing.line_codes = [...new Set([...existing.line_codes, ...item.line_codes])].sort()
      existing.direction_codes = [...new Set([...existing.direction_codes, ...item.direction_codes])].sort()
      existing.has_geolocation = existing.has_geolocation || item.has_geolocation
      existing.interchange_status = existing.network_codes.length > 1
        ? (existing.has_geolocation ? 'shared_reference_geolocated_candidate' : 'shared_name_reference_only')
        : 'single_network_reference'
    }
  }

  return {
    generated_at: graphs.map((graph) => graph.generated_at).sort().slice(-1)[0] ?? new Date().toISOString(),
    graph_only: true,
    networks: uniqueById(graphs.flatMap((graph) => graph.networks)),
    lines: uniqueById(graphs.flatMap((graph) => graph.lines)),
    directions: uniqueById(graphs.flatMap((graph) => graph.directions)),
    ordered_line_stops: uniqueById(graphs.flatMap((graph) => graph.ordered_line_stops)),
    reference_stops: uniqueById(graphs.flatMap((graph) => graph.reference_stops)),
    stop_network_memberships: [...membershipByStop.values()],
    service_patterns: uniqueById(graphs.flatMap((graph) => graph.service_patterns)),
    transfers: uniqueById(graphs.flatMap((graph) => graph.transfers)),
    data_assertions: graphs.flatMap((graph) => graph.data_assertions),
    mobility_sources: uniqueById(graphs.flatMap((graph) => graph.mobility_sources)),
  }
}

async function fetchNetworkGraph(
  network: typeof NETWORKS_TO_SYNC[number],
  fetcher: typeof fetch,
): Promise<RemoteMobilityGraph> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetcher(
      `${SUPABASE_KNOWLEDGE_ENDPOINT}?graph_only=1&network=${network}`,
      {
        method: 'GET',
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal,
      },
    )
    if (!response.ok) throw new Error(`Supabase graph request failed: ${response.status}`)
    const graph = await response.json() as RemoteMobilityGraph
    if (
      graph.graph_only !== true
      || !Array.isArray(graph.lines)
      || !Array.isArray(graph.directions)
      || !Array.isArray(graph.ordered_line_stops)
      || !Array.isArray(graph.service_patterns)
    ) throw new Error('Invalid Supabase mobility graph response')
    return graph
  } finally {
    clearTimeout(timeout)
  }
}

/** Recharge le graphe sauvegardé dans IndexedDB avant de tenter le réseau. */
export async function hydrateSupabaseGraphFromCache(): Promise<boolean> {
  try {
    const cached = await readCache()
    if (!cached || Date.now() - cached.savedAt > CACHE_MAX_AGE_MS) return false
    setRemoteMobilityGraph(cached.graph)
    return true
  } catch {
    return false
  }
}

/** Synchronise les séquences DDD/AFTU, les retours, fréquences et correspondances candidates. */
export async function refreshSupabaseGraph(
  fetcher: typeof fetch = fetch,
): Promise<{ ok: boolean; networks: number; lines: number; directions: number; stops: number }> {
  const results = await Promise.allSettled(
    NETWORKS_TO_SYNC.map((network) => fetchNetworkGraph(network, fetcher)),
  )
  const graphs = results
    .filter((result): result is PromiseFulfilledResult<RemoteMobilityGraph> => result.status === 'fulfilled')
    .map((result) => result.value)

  if (!graphs.length) return { ok: false, networks: 0, lines: 0, directions: 0, stops: 0 }

  const merged = mergeGraphs(graphs)
  setRemoteMobilityGraph(merged)
  try {
    await writeCache(merged)
  } catch {
    // IndexedDB reste facultatif ; le graphe en mémoire est déjà utilisable.
  }

  return {
    ok: true,
    networks: merged.networks.length,
    lines: merged.lines.length,
    directions: merged.directions.length,
    stops: merged.ordered_line_stops.length,
  }
}
