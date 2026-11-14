/**
 * Mémoire minimale de trajet conservée sur l'appareil.
 *
 * Les conversations complètes et les anciennes réponses (notamment trafic)
 * ne sont jamais persistées. Seuls les lieux explicitement connus et le dernier
 * trajet sont restaurés, si l'usager a activé « conserver l'historique des lieux ».
 * La mémoire est locale à cet appareil ; elle n'est pas synchronisée au compte.
 */
import { createConversationMemory, type ConversationMemory, type JourneyMemory, type PendingPlace } from './conversation'
import type { PlannerEndpoint } from './planner'

export const CONVERSATION_MEMORY_STORAGE_KEY = 'dakar-bus:journey-memory:v1'
export const CONVERSATION_MEMORY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, max = 180): string | null {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max ? value.trim() : null
}

function endpoint(value: unknown): PlannerEndpoint | null {
  if (!record(value)) return null
  const label = text(value.label)
  const lat = value.lat
  const lon = value.lon
  if (!label || typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) return null
  if (typeof lon !== 'number' || !Number.isFinite(lon) || lon < -180 || lon > 180) return null
  const stopId = value.stopId === undefined ? undefined : text(value.stopId, 120) ?? undefined
  return { label, lat, lon, ...(stopId ? { stopId } : {}) }
}

function stringList(value: unknown, maxItems: number, maxLength = 180): string[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, maxItems).map((item) => text(item, maxLength)).filter((item): item is string => Boolean(item))
}

function journey(value: unknown): JourneyMemory | null {
  if (!record(value)) return null
  const origin = endpoint(value.origin)
  const destination = endpoint(value.destination)
  if (!origin || !destination) return null
  const totalMinutes = typeof value.totalMinutes === 'number' && Number.isFinite(value.totalMinutes) && value.totalMinutes >= 0
    ? Math.min(24 * 60, Math.round(value.totalMinutes))
    : null
  const transfers = typeof value.transfers === 'number' && Number.isFinite(value.transfers)
    ? Math.max(0, Math.min(20, Math.round(value.transfers)))
    : 0
  const alightStop = value.alightStop === null ? null : text(value.alightStop)
  return {
    origin,
    destination,
    steps: stringList(value.steps, 24),
    totalMinutes,
    boardedLines: stringList(value.boardedLines, 12, 80),
    transfers,
    alightStop,
  }
}

function sanitize(value: unknown): ConversationMemory {
  const memory = createConversationMemory()
  if (!record(value)) return memory
  memory.lastKnowledgeLineId = text(value.lastKnowledgeLineId, 120)
  memory.lastOrigin = endpoint(value.lastOrigin)
  memory.lastDestination = endpoint(value.lastDestination)
  memory.lastJourney = journey(value.lastJourney)
  memory.lastStopId = value.lastStopId === null ? null : text(value.lastStopId, 120)
  const networks = ['ter', 'brt', 'ddd', 'aftu', 'tata']
  memory.lastNetwork = typeof value.lastNetwork === 'string' && networks.includes(value.lastNetwork)
    ? value.lastNetwork as ConversationMemory['lastNetwork']
    : null
  if (record(value.pendingPlace) && (value.pendingPlace.role === 'origin' || value.pendingPlace.role === 'destination')) {
    const place = endpoint(value.pendingPlace.place)
    if (place) memory.pendingPlace = { role: value.pendingPlace.role, place } as PendingPlace
  }
  // lastAnswer is intentionally not restored: traffic and service information can expire.
  memory.lastAnswer = null
  return memory
}

export function loadConversationMemory(
  enabled: boolean,
  storage: StorageLike | null = getStorage(),
  now = Date.now(),
): ConversationMemory {
  const empty = createConversationMemory()
  if (!enabled || !storage) return empty
  try {
    const raw = storage.getItem(CONVERSATION_MEMORY_STORAGE_KEY)
    if (!raw) return empty
    const saved = JSON.parse(raw) as unknown
    if (!record(saved) || saved.version !== 1 || typeof saved.savedAt !== 'number') {
      storage.removeItem(CONVERSATION_MEMORY_STORAGE_KEY)
      return empty
    }
    const age = now - saved.savedAt
    if (!Number.isFinite(age) || age < -5 * 60 * 1000 || age > CONVERSATION_MEMORY_MAX_AGE_MS) {
      storage.removeItem(CONVERSATION_MEMORY_STORAGE_KEY)
      return empty
    }
    return sanitize(saved.memory)
  } catch {
    try { storage.removeItem(CONVERSATION_MEMORY_STORAGE_KEY) } catch { /* storage unavailable */ }
    return empty
  }
}

export function saveConversationMemory(
  memory: ConversationMemory,
  enabled: boolean,
  storage: StorageLike | null = getStorage(),
  now = Date.now(),
): void {
  if (!storage) return
  if (!enabled) {
    clearConversationMemory(storage)
    return
  }
  try {
    const snapshot = { ...memory, lastAnswer: null }
    storage.setItem(CONVERSATION_MEMORY_STORAGE_KEY, JSON.stringify({
      version: 1,
      savedAt: now,
      memory: snapshot,
    }))
  } catch {
    // Quota/permission failures must never block the assistant.
  }
}

export function clearConversationMemory(storage: StorageLike | null = getStorage()): void {
  try { storage?.removeItem(CONVERSATION_MEMORY_STORAGE_KEY) } catch { /* storage unavailable */ }
}
