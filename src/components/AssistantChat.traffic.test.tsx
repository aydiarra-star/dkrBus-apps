// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AssistantChat } from './AssistantChat'
import type { AssistantContext } from '../domain/assistant'
import { isoAt, TRAFFIC_TEST_NOW as NOW } from '../test/trafficFixtures'

const active: AssistantContext = {
  publishedAvailable: false, adminOnline: false,
  trafficSummaryFr: 'Accident actif de test confirmé à Dakar.',
  trafficSummaryWo: null, trafficSummaryValidUntil: isoAt(NOW + 60_000),
}
const clear: AssistantContext = {
  ...active, trafficSummaryFr: 'Trafic fluide / Aucune perturbation en cours.',
  trafficSummaryValidUntil: isoAt(NOW + 60 * 60_000),
}

async function ask(question: string) {
  const input = screen.getByRole('textbox', { name: /votre question à l’assistant/i })
  fireEvent.change(input, { target: { value: question } })
  fireEvent.submit(input.closest('form')!)
  await act(async () => { await vi.advanceTimersByTimeAsync(0) })
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); window.localStorage.clear() })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('la discussion ne conserve pas des alertes obsolètes', () => {
  test('une ancienne réponse et « répète » suivent la résolution du snapshot courant', async () => {
    const { rerender } = render(<AssistantChat context={active} />)
    fireEvent.click(screen.getByRole('button', { name: 'Assistant IA' }))
    await ask('Y a-t-il des bouchons ?')
    expect(screen.getByRole('log').textContent).toContain('Accident actif de test')
    rerender(<AssistantChat context={clear} />)
    expect(screen.getByRole('log').textContent).not.toContain('Accident actif de test')
    expect(screen.getByRole('log').textContent).toContain('Aucune perturbation en cours')
    await ask('Répète')
    expect(screen.getByRole('log').textContent).not.toContain('Accident actif de test')
    expect(screen.getByRole('log').textContent).toContain('Aucune perturbation en cours')
    expect(screen.getByRole('textbox', { name: /votre question/i })).toBeTruthy()
  })

  test('un contexte figé arrivé à sa limite ne réaffiche pas un accident dans la discussion', async () => {
    const { rerender } = render(<AssistantChat context={active} />)
    fireEvent.click(screen.getByRole('button', { name: 'Assistant IA' }))
    await ask('Y a-t-il des bouchons ?')
    vi.setSystemTime(NOW + 60_000)
    rerender(<AssistantChat context={{ ...active }} />)
    expect(screen.getByRole('log').textContent).not.toContain('Accident actif de test')
    expect(screen.getByRole('log').textContent).toContain('aucune alerte vérifiable')
  })

  test('les autres réponses et la structure de conversation restent inchangées', async () => {
    const { rerender } = render(<AssistantChat context={active} />)
    fireEvent.click(screen.getByRole('button', { name: 'Assistant IA' }))
    await ask('Liste des gares TER')
    const previous = screen.getByRole('log').textContent
    expect(previous).toContain('Diamniadio')
    rerender(<AssistantChat context={clear} />)
    expect(screen.getByRole('log').textContent).toBe(previous)
    expect(document.querySelector('.assistant-form')).not.toBeNull()
  })
})
