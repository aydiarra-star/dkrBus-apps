import { expect, it } from 'vitest'
import { copilotAnswer } from '../domain/copilot'
import { createConversationMemory } from '../domain/conversation'
import { passengerLookup } from './answers'

it('uses the selected service time for chat, evaluates the return independently and clears stale alighting advice', () => {
  const ctx = { publishedAvailable: false, adminOnline: false, passengerRoute: passengerLookup({ departAt: Date.parse('2026-11-18T08:01Z') / 1000 }) }
  const memory = createConversationMemory()
  const ask = (q: string) => copilotAnswer(q, ctx, memory, 'fr')
  expect(ask('Trajet de Dakar à Pikine').text).toContain('08:23')
  expect(memory.lastJourney?.alightStop).toBe('Pikine')
  expect(ask('Et en sens inverse ?').text).toContain('sens retour')
  expect(memory.lastJourney).toBeNull()
  expect(ask('Où dois-je descendre ?').text).not.toContain('Descendez à Pikine')
  expect(ask('Compare les trajets de Préfecture de Guédiawaye à Rufisque').text).toContain('Aucun cheminement piéton vérifié')
  expect(ask('Et avec moins de marche ?').text).not.toMatch(/Option 1|1 400 m|environ \d+ min/)
})
