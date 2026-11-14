import { describe, expect, it } from 'vitest'
import { createConversationMemory, rememberJourney } from './conversation'
import {
  clearConversationMemory,
  CONVERSATION_MEMORY_STORAGE_KEY,
  loadConversationMemory,
  saveConversationMemory,
} from './conversationStorage'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
}

describe('mémoire persistante locale des trajets', () => {
  it('restaure le dernier trajet explicite après rechargement', () => {
    const storage = memoryStorage()
    const memory = createConversationMemory()
    rememberJourney(memory, {
      origin: { label: 'Petersen', lat: 14.6766, lon: -17.4406, stopId: 'brt-petersen' },
      destination: { label: 'Rufisque', lat: 14.7159, lon: -17.2699, stopId: 'ter-rufisque' },
      steps: ['BRT B1', 'Correspondance TER'],
      totalMinutes: 50,
      boardedLines: ['B1', 'TER'],
      transfers: 1,
      alightStop: 'Rufisque',
    })
    memory.lastAnswer = 'Ancienne alerte trafic à ne pas restaurer'
    saveConversationMemory(memory, true, storage, 1_800_000_000_000)
    const restored = loadConversationMemory(true, storage, 1_800_000_000_001)
    expect(restored.lastJourney?.origin.label).toBe('Petersen')
    expect(restored.lastJourney?.destination.stopId).toBe('ter-rufisque')
    expect(restored.lastAnswer).toBeNull()
  })

  it('ne conserve rien lorsque l’historique des lieux est désactivé', () => {
    const storage = memoryStorage()
    saveConversationMemory(createConversationMemory(), false, storage)
    expect(storage.getItem(CONVERSATION_MEMORY_STORAGE_KEY)).toBeNull()
  })

  it('efface les données expirées ou mal formées', () => {
    const storage = memoryStorage()
    storage.setItem(CONVERSATION_MEMORY_STORAGE_KEY, JSON.stringify({ version: 1, savedAt: 1, memory: {} }))
    expect(loadConversationMemory(true, storage, 2_000_000_000_000).lastJourney).toBeNull()
    expect(storage.getItem(CONVERSATION_MEMORY_STORAGE_KEY)).toBeNull()
  })

  it('rejette les coordonnées invalides au lieu de les mémoriser', () => {
    const storage = memoryStorage()
    storage.setItem(CONVERSATION_MEMORY_STORAGE_KEY, JSON.stringify({
      version: 1,
      savedAt: 1_800_000_000_000,
      memory: { lastOrigin: { label: 'Lieu faux', lat: 999, lon: 999 } },
    }))
    expect(loadConversationMemory(true, storage, 1_800_000_000_001).lastOrigin).toBeNull()
  })

  it('efface explicitement la mémoire locale', () => {
    const storage = memoryStorage()
    saveConversationMemory(createConversationMemory(), true, storage)
    clearConversationMemory(storage)
    expect(storage.getItem(CONVERSATION_MEMORY_STORAGE_KEY)).toBeNull()
  })
})
