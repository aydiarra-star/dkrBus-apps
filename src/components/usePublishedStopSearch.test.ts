// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { usePublishedStopSearch } from './usePublishedStopSearch'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const reply = (snapshot_id: string, name: string) => ({ ok: true, json: async () => ({ snapshot_id, results: [
  { stop_id: 's', stop_name: name, stop_lat: 14.7, stop_lon: -17.4 },
  { stop_id: 'bad', stop_name: name, stop_lat: 140, stop_lon: -17.4 },
] }) })

it('drops superseded replies even when fetch ignores abort, and never mixes snapshots', async () => {
  let finish!: (r: ReturnType<typeof reply>) => void
  const fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    .mockResolvedValueOnce(reply('current', 'Deuxième')).mockResolvedValueOnce(reply('old', 'Troisième'))
  vi.stubGlobal('fetch', fetch)
  const { result, rerender } = renderHook(({ q, id }) => usePublishedStopSearch(q, id), { initialProps: { q: 'Un', id: 'current' } })
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  rerender({ q: 'Deux', id: 'current' }); expect(fetch.mock.calls[0][1].signal.aborted).toBe(true)
  await waitFor(() => expect(result.current.options.map(o => o.label)).toEqual(['Deuxième']))
  await act(async () => finish(reply('current', 'Première')))
  expect(result.current.options.map(o => o.label)).toEqual(['Deuxième'])
  rerender({ q: 'Trois', id: 'current' }); expect(result.current.options).toEqual([])
  await waitFor(() => expect(result.current.unavailable).toBe(true)); expect(result.current.options).toEqual([])
  rerender({ q: 'Trois', id: '' }); expect(result.current).toEqual({ options: [], loading: false, unavailable: false })
})
