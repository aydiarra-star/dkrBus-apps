import { expect, it, vi } from 'vitest'
import { copilotAnswer } from '../domain/copilot'
import { createConversationMemory } from '../domain/conversation'
import * as dakar from './dakar'
import { fixtureNetwork, fixtureQuery } from '../test/passengerTransferFixture'
import { search } from './search'
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


it('retains the run and way identity in criterion and stop-list follow-ups', () => {
  const adapter = vi.spyOn(dakar, 'planDakarJourney').mockImplementation((_from, _to, options) => search(fixtureNetwork, { ...fixtureQuery, ...options }))
  try {
    const ctx = { publishedAvailable: false, adminOnline: false, passengerRoute: passengerLookup(fixtureQuery) }
    const memory = createConversationMemory()
    const ask = (q: string) => copilotAnswer(q, ctx, memory, 'fr')
    const fast = ask('Trajet de Dakar à Pikine').journey?.tripId
    const direct = ask('Et avec moins de marche ?').journey?.tripId
    expect(fast).toContain('qa-Inbound'); expect(direct).toContain('qa-Direct')
    const stops = ask('Quels arrêts entre mon départ et ma destination ?')
    expect(stops.journey?.tripId).toBe(direct)
    expect(stops.text).toContain('Desserte Direct : A → D')
    ctx.passengerRoute = passengerLookup({ ...fixtureQuery, modes: ['ter', 'brt'] })
    const unavailable = ask('Quels arrêts entre mon départ et ma destination ?')
    expect(unavailable.text).toContain('variante précédente n’est plus disponible')
    expect(unavailable.journey?.tripId).toBe(direct) // opening the refusal cannot substitute the fast option
    expect(memory.lastJourney).toBeNull()
  } finally { adapter.mockRestore() }
})
