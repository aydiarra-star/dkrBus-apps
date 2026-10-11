// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useTrafficAlerts } from './useTrafficAlerts'
import { API_TIMEOUT_MS } from '../domain/http'
import { TRAFFIC_REFRESH_INTERVAL_MS as HOUR } from '../domain/trafficFreshness'
import { trafficAlert, trafficPayload, TRAFFIC_TEST_NOW as NOW } from '../test/trafficFixtures'

type Point = { lat: number; lng: number } | null
const gps: Point = { lat: 14.7051, lng: -17.4602 }
const response = (alerts = [trafficAlert({}, Date.now())]) => new Response(JSON.stringify(trafficPayload(alerts, Date.now())))
const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0) })
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('cycle de vie horaire des alertes', () => {
  test('interroge au démarrage puis toutes les heures, même sans GPS et hors onglet Alertes', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response())
    const refreshGps = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(() => useTrafficAlerts(null, refreshGps))
    await flush()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.summaryContext.availability).toBe('current')
    await advance(HOUR - 1)
    expect(fetcher).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(refreshGps).toHaveBeenCalledTimes(1)
    await advance(HOUR)
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(refreshGps).toHaveBeenCalledTimes(2)
  })

  test('purge avant la prochaine collecte à exactement une heure d’âge', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response([trafficAlert({}, NOW - 20 * 60_000)]))
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(() => useTrafficAlerts(gps))
    await flush()
    expect(result.current.snapshot?.alerts).toHaveLength(1)
    await advance(40 * 60_000 - 1)
    expect(result.current.snapshot?.alerts).toHaveLength(1)
    await advance(1)
    expect(result.current.snapshot?.alerts).toEqual([])
    expect(result.current.summaryContext.availability).toBe('partial')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('un flux figé ne rajeunit pas à chaque téléchargement', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => new Response(JSON.stringify(trafficPayload([trafficAlert()], NOW)))))
    const { result } = renderHook(() => useTrafficAlerts(null))
    await flush()
    expect(result.current.snapshot?.alerts).toHaveLength(1)
    await advance(HOUR)
    expect(result.current.snapshot).toBeNull()
    expect(result.current.summaryContext.availability).toBe('unavailable')
  })

  test('remplace le snapshot : un incident disparu / résolu est immédiatement retiré', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response())
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(() => useTrafficAlerts(gps))
    await flush()
    expect(result.current.snapshot?.alerts).toHaveLength(1)
    fetcher.mockImplementation(async () => response([]))
    await act(async () => { await result.current.refresh() })
    expect(result.current.snapshot?.alerts).toEqual([])
    expect(result.current.summaryContext.availability).toBe('current')
  })

  test('une panne de refresh supprime le cache et ne conclut pas au trafic fluide', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response())
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(() => useTrafficAlerts(gps))
    await flush()
    fetcher.mockRejectedValue(new Error('opérateur indisponible'))
    await act(async () => { await result.current.refresh() })
    expect(result.current.snapshot).toBeNull()
    expect(result.current.summaryContext.availability).toBe('unavailable')
  })

  test('ignore une réponse ancienne même si son fetch ne respecte pas l’annulation', async () => {
    let deliverOld: (value: Response) => void = () => { throw new Error('requête non lancée') }
    const fetcher = vi.fn<(...args: Parameters<typeof fetch>) => Promise<Response>>()
      .mockImplementationOnce(() => new Promise((resolve) => { deliverOld = resolve }))
      .mockImplementation(async () => response([]))
    vi.stubGlobal('fetch', fetcher)
    const { result, rerender } = renderHook(({ point }: { point: Point }) => useTrafficAlerts(point), { initialProps: { point: null as Point } })
    rerender({ point: gps })
    await flush()
    expect(result.current.snapshot?.alerts).toEqual([])
    await act(async () => { deliverOld(response()); await Promise.resolve() })
    expect(result.current.snapshot?.alerts).toEqual([])
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true)
  })

  test('sort du chargement au délai maximal de réponse', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) => new Promise<Response>((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('délai dépassé', 'AbortError')), { once: true })
    })))
    const { result } = renderHook(() => useTrafficAlerts(null))
    await advance(API_TIMEOUT_MS)
    expect(result.current.snapshot).toBeNull()
    expect(result.current.summaryContext.availability).toBe('unavailable')
  })

  test('au retour de veille purge immédiatement et regroupe les événements de reprise', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response())
    const refreshGps = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(() => useTrafficAlerts(gps, refreshGps))
    await flush()
    vi.setSystemTime(NOW + 4 * HOUR) // suspension : aucune temporisation exécutée
    let deliver: (value: Response) => void = () => {}
    fetcher.mockImplementation(() => new Promise((resolve) => { deliver = resolve }))
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
      window.dispatchEvent(new Event('pageshow'))
      window.dispatchEvent(new Event('focus'))
    })
    expect(result.current.snapshot).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(refreshGps).toHaveBeenCalledTimes(1)
    await act(async () => { deliver(response([])); await Promise.resolve() })
    expect(result.current.summaryContext.availability).toBe('current')
  })

  test('hors ligne retire les observations et la reconnexion relance la collecte', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response())
    vi.stubGlobal('fetch', fetcher)
    const { result } = renderHook(() => useTrafficAlerts(gps))
    await flush()
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(result.current.snapshot).toBeNull()
    expect(result.current.summaryContext.availability).toBe('unavailable')
    act(() => { window.dispatchEvent(new Event('online')) })
    await flush()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.current.summaryContext.availability).toBe('current')
  })

  test('GPS acquis / déplacé relance la collecte sans requête à chaque petite fluctuation', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response([]))
    vi.stubGlobal('fetch', fetcher)
    const { rerender } = renderHook(({ point }: { point: Point }) => useTrafficAlerts(point), { initialProps: { point: null as Point } })
    await flush()
    rerender({ point: gps }); await flush()
    expect(fetcher).toHaveBeenCalledTimes(2)
    rerender({ point: { lat: gps!.lat + 0.00001, lng: gps!.lng } }); await flush()
    expect(fetcher).toHaveBeenCalledTimes(2)
    rerender({ point: { lat: 14.73, lng: -17.45 } })
    await advance(29_999)
    expect(fetcher).toHaveBeenCalledTimes(2)
    await advance(1)
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(String(fetcher.mock.calls.at(-1)?.[0])).toContain('lat=14.73')
    // L'horloge horaire n'est pas réinitialisée par ce déplacement.
    await advance(HOUR - 30_000)
    expect(fetcher).toHaveBeenCalledTimes(4)
  })

  test('démontage annule requêtes, temporisations et écouteurs', async () => {
    const fetcher = vi.fn((_url: string, options: RequestInit) => new Promise<Response>((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('annulé', 'AbortError')), { once: true })
    }))
    vi.stubGlobal('fetch', fetcher)
    const { unmount } = renderHook(() => useTrafficAlerts(null))
    unmount()
    await flush()
    expect(fetcher.mock.calls[0][1].signal?.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    window.dispatchEvent(new Event('online'))
    await advance(2 * HOUR)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
