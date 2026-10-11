// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCommunityReports } from './useCommunityReports'
import { COMMUNITY_OWNERSHIP_KEY } from '../domain/communityFeed'
import { communityPayload, communityReport, COMMUNITY_TEST_KEY as KEY, COMMUNITY_TEST_ID as ID } from '../test/communityFixtures'
import { TRAFFIC_TEST_NOW as NOW, isoAt } from '../test/trafficFixtures'

const HOUR = 60 * 60_000
const response = (reports = [communityReport()], at = Date.now()) => new Response(JSON.stringify(communityPayload(reports, at)))
const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0) })
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); localStorage.clear() })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('pool Direct rue frais et résilient', () => {
  it('lit au démarrage et chaque heure, expire entre lectures et ne transforme pas les pairs en auteurs', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response([communityReport({}, NOW - 20 * 60_000)]))
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(useCommunityReports)
    await flush()
    expect(result.current.sharingAvailable).toBe(true)
    expect(result.current.reports[0].canRemove).toBe(false)
    await act(async () => { await vi.advanceTimersByTimeAsync(40 * 60_000) })
    expect(result.current.reports).toEqual([])
    expect(fetcher).toHaveBeenCalledTimes(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(20 * 60_000) })
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.current.reports).toEqual([])
  })

  it('sur panne retire le pool précédent, sur veille purge avant une réponse tardive', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response())
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(useCommunityReports)
    await flush()
    fetcher.mockRejectedValue(new Error('unavailable'))
    await act(async () => { await result.current.refresh() })
    expect(result.current.reports).toEqual([])
    expect(result.current.sharingAvailable).toBe(false)
    fetcher.mockImplementation(async () => response())
    await act(async () => { await result.current.refresh() })
    vi.setSystemTime(NOW + 2 * HOUR)
    fetcher.mockImplementation(() => new Promise(() => {}))
    act(() => window.dispatchEvent(new Event('focus')))
    expect(result.current.reports).toEqual([])
    expect(result.current.sharingAvailable).toBe(false)
  })

  it('offline/reconnexion revalide, sans stockage des signalements des pairs', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response())
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(useCommunityReports)
    await flush()
    expect(localStorage.getItem('dakar-bus:street-reports')).toBeNull()
    act(() => window.dispatchEvent(new Event('offline')))
    expect(result.current.reports).toEqual([])
    act(() => window.dispatchEvent(new Event('online')))
    await flush()
    expect(result.current.reports).toHaveLength(1)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('poste, conserve le reçu auteur puis retire immédiatement sans nouvelle permission', async () => {
    let reports: ReturnType<typeof communityReport>[] = []
    const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
      if (init?.method === 'POST') { reports = [communityReport()]; return new Response(JSON.stringify({ report: reports[0], deleteKey: KEY }), { status: 201 }) }
      if (init?.method === 'DELETE') { reports = []; return new Response(JSON.stringify({ removed: true })) }
      return response(reports)
    })
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(useCommunityReports)
    await flush()
    await act(async () => { await result.current.publish({ kind: 'OTHER', place: 'Hann' }) })
    await flush()
    expect(result.current.reports[0].canRemove).toBe(true)
    expect(JSON.parse(localStorage.getItem(COMMUNITY_OWNERSHIP_KEY)!)[ID].deleteKey).toBe(KEY)
    await act(async () => { await result.current.remove(ID) })
    expect(result.current.reports).toEqual([])
    expect(JSON.parse(localStorage.getItem(COMMUNITY_OWNERSHIP_KEY)!)).toEqual({})
  })

  it('un GET lancé avant le retrait ne peut réinstaller le signalement supprimé', async () => {
    localStorage.setItem(COMMUNITY_OWNERSHIP_KEY, JSON.stringify({ [ID]: { deleteKey: KEY, expiresAt: isoAt(NOW + HOUR) } }))
    let deliver: (response: Response) => void = () => {}
    let slow = false
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (_url, init) => {
      if (init?.method === 'DELETE') return new Response(JSON.stringify({ removed: true }))
      return slow ? new Promise((resolve) => { deliver = resolve }) : response()
    }))
    const { result } = renderHook(useCommunityReports)
    await flush()
    slow = true
    let pending: Promise<void>
    act(() => { pending = result.current.refresh() })
    await act(async () => { await result.current.remove(ID) })
    await act(async () => { deliver(response()); await pending! })
    expect(result.current.reports).toEqual([])
  })

  it('un retrait demandé pendant POST ne ressuscite pas avec son accusé tardif', async () => {
    let deliver: (value: Response) => void = () => {}
    const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
      if (init?.method === 'POST') return new Promise((resolve) => { deliver = resolve })
      if (init?.method === 'DELETE') return new Response(JSON.stringify({ removed: true }))
      return response([])
    })
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(useCommunityReports)
    await flush()
    let wanted = true
    let pending: ReturnType<typeof result.current.publish>
    act(() => { pending = result.current.publish({ kind: 'OTHER', place: 'Hann' }, () => wanted) })
    wanted = false
    await act(async () => {
      deliver(new Response(JSON.stringify({ report: communityReport(), deleteKey: KEY }), { status: 201 }))
      expect(await pending!).toBeNull()
    })
    await flush()
    expect(result.current.reports).toEqual([])
    expect(fetcher.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true)
    expect(JSON.parse(localStorage.getItem(COMMUNITY_OWNERSHIP_KEY)!)).toEqual({})
  })

  it('refuse le retrait des pairs et purge les reçus à la limite exacte', async () => {
    localStorage.setItem(COMMUNITY_OWNERSHIP_KEY, JSON.stringify({ [ID]: { deleteKey: KEY, expiresAt: isoAt(NOW + 1000) } }))
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => response()))
    const { result } = renderHook(useCommunityReports)
    await flush()
    expect(result.current.reports[0].canRemove).toBe(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(result.current.reports[0].canRemove).toBe(false)
    expect(JSON.parse(localStorage.getItem(COMMUNITY_OWNERSHIP_KEY)!)).toEqual({})
    await expect(result.current.remove(ID)).rejects.toThrow(/auteur/)
  })

  it('démontage annule le GET et toutes les temporisations', async () => {
    const fetcher = vi.fn<typeof fetch>((_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))))
    vi.stubGlobal('fetch', fetcher)
    const { unmount } = renderHook(useCommunityReports)
    unmount()
    await flush()
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
})
