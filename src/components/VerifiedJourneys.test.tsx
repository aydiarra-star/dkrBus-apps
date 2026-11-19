// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DEFAULT_PREFERENCES } from '../domain/preferences'
import { search } from '../routing/search'
import { fixtureNetwork, fixtureQuery as query } from '../test/passengerTransferFixture'
import { VerifiedJourneys } from './VerifiedJourneys'

// This edition is synthetic and never imported in production.
const result = search(fixtureNetwork, { ...query, modes: ['ter', 'brt'] })
if (!result.ok) throw Error(result.message)
const selectedId = result.options[0].id
const props = { result, selectedId, preferences: DEFAULT_PREFERENCES, onChooseSection: vi.fn(), onSelect: vi.fn() }
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(query.departAt * 1000) })
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
function jump(seconds: number) {
  vi.setSystemTime((query.departAt + seconds) * 1000)
  act(() => document.dispatchEvent(new Event('visibilitychange')))
}

it('follows the selected runs, the directed walk and the second boarding without rolling over a missed vehicle', () => {
  const { container, unmount } = render(<VerifiedJourneys {...props} />)
  const steps = Array.from(container.querySelectorAll('.is-selected ol > li'))
  expect(steps).toHaveLength(3)
  const clocks = () => steps.map(s => s.querySelector('time')?.textContent ?? null)
  expect(clocks()).toEqual(['0:10', '2:00', '10:00'])
  expect(steps[0].textContent).toContain('Montée prévue dans 1 min')
  expect(steps[1].textContent).toMatch(/Correspondance à pied.*B → C.*qa-way-0 → qa-way-1 → qa-way-2/)
  expect(steps[2].textContent).toContain('Marge incluse dans l’attente : 180 s')
  act(() => vi.advanceTimersByTime(1000)); expect(clocks()).toEqual(['0:09', '1:59', '9:59'])
  jump(10); expect(steps[0].textContent).toContain('Si vous êtes à bord'); expect(clocks()[0]).toBe('1:50')
  jump(120); expect(steps[1].textContent).toContain('Fin de marche prévue dans'); expect(clocks()[0]).toBeNull()
  jump(599); expect(clocks()).toEqual([null, null, '0:01']); expect(steps[2].textContent).toContain('Montée prévue dans 1 min')
  jump(600); expect(clocks()).toEqual([null, null, '2:01']); expect(steps[2].textContent).not.toContain('Montée prévue dans')
  jump(721); expect(clocks()).toEqual([null, null, null]); expect(props.onSelect).not.toHaveBeenCalled()
  unmount(); expect(vi.getTimerCount()).toBe(0)
})

it('has no countdown for an unselected option, an itinerary on another day or a routing refusal', () => {
  const { container, rerender } = render(<VerifiedJourneys {...props} selectedId={undefined} />)
  expect(container.querySelector('time')).toBeNull(); expect(vi.getTimerCount()).toBe(0)
  jump(-86_400); rerender(<VerifiedJourneys {...props} />); expect(container.querySelector('time')).toBeNull()
  rerender(<VerifiedJourneys {...props} result={{ ok: false, code: 'NO_PATH', message: 'Aucun chemin vérifié' }} />)
  expect(container.querySelector('time')).toBeNull(); expect(vi.getTimerCount()).toBe(0)
})
