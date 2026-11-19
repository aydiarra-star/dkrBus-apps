// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { dakarNetwork } from '../routing/dakar'
import { usePassengerNetwork } from './usePassengerNetwork'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('never uses the previous day while fetching; revalidates the active review and drops a withdrawn edition', async () => {
  const snapshot = 'snap-qa', rev = 'a'.repeat(64)
  const pack = (date: string) => ({ version: 1, snapshot_id: snapshot, date, revision: rev, attribution: 'Essai', dataset: { places: [], footways: [], patterns: [], platformBindings: [] } })
  const reply = (v: object) => ({ ok: true, json: async () => v })
  let finish!: (v: ReturnType<typeof reply>) => void
  const fetcher = vi.fn().mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    .mockResolvedValueOnce(reply(pack('2026-11-19')))
    .mockResolvedValueOnce(reply({ ...pack('2026-11-19'), dataset: undefined, unchanged: true }))
    .mockResolvedValueOnce({ ok: false })
  vi.stubGlobal('fetch', fetcher)
  const { result, rerender } = renderHook(({ snap, day }) => usePassengerNetwork(snap, day), { initialProps: { snap: '', day: '2026-11-18' } })
  expect(fetcher).not.toHaveBeenCalled()
  rerender({ snap: snapshot, day: '2026-11-18' }); rerender({ snap: snapshot, day: '2026-11-19' })
  expect(result.current.network).toBe(dakarNetwork)
  await waitFor(() => expect(result.current.notice).toContain('intégré'))
  const current = result.current.network
  await act(async () => finish(reply(pack('2026-11-18')))); expect(result.current.network).toBe(current)
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
  expect(fetcher.mock.calls.at(-1)?.[0]).toContain(`known_revision=${rev}`); expect(result.current.network).toBe(current)
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
  expect(result.current.notice).toContain('indisponible'); expect(result.current.network).toBe(dakarNetwork)
})
it('refreshes the publication pointer on a rotation and does not revive the old snapshot', async () => {
  const day = '2026-11-18', rev = 'b'.repeat(64), rediscover = vi.fn()
  const full = (snapshot_id: string) => ({ ok: true, json: async () => ({ version: 1, snapshot_id, date: day, revision: rev, attribution: 'Essai', dataset: { patterns: [], places: [], footways: [], platformBindings: [] } }) })
  let late!: (v: ReturnType<typeof full>) => void
  const fetcher = vi.fn().mockResolvedValueOnce(full('first'))
    .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'SNAPSHOT_CHANGED' }) })
    .mockImplementationOnce(() => new Promise(resolve => { late = resolve })).mockResolvedValueOnce(full('next'))
  vi.stubGlobal('fetch', fetcher)
  const { result, rerender } = renderHook(({ id }) => usePassengerNetwork(id, day, rediscover), { initialProps: { id: 'first' } })
  await waitFor(() => expect(result.current.notice).toContain('intégré'))
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
  expect(rediscover).toHaveBeenCalledOnce(); expect(result.current.network).toBe(dakarNetwork)
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
  rerender({ id: 'next' }); await waitFor(() => expect(result.current.notice).toContain('intégré'))
  const next = result.current.network
  await act(async () => late(full('first'))); expect(result.current.network).toBe(next)
})
