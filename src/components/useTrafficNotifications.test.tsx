// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { trafficNotices, useTrafficNotifications } from './useTrafficNotifications'
import { rankAlerts } from '../domain/trafficAlerts'
import { rankStreetReports } from '../domain/communityTraffic'
import { communityReport } from '../test/communityFixtures'
import { TRAFFIC_TEST_NOW as NOW, trafficAlert, isoAt } from '../test/trafficFixtures'

const gps = { lat: 14.7051, lng: -17.4602 }
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
const official = () => rankAlerts([trafficAlert({ expiresAt: isoAt(NOW + 1000) })], gps, 1500, Date.now())

describe('notifications : même fenêtre et même GPS que les alertes', () => {
  it('ne notifie ni veille, futur, non confirmé, résolu ni exemple', () => {
    const alerts = [trafficAlert({}, NOW - 60 * 60_000), trafficAlert({}, NOW + 1),
      trafficAlert({ status: 'UNCONFIRMED' }), trafficAlert({ status: 'RESOLVED' }), trafficAlert({ source: { kind: 'AI_SAMPLE', label: 'example' } })]
    expect(trafficNotices(rankAlerts(alerts, gps, 1500, NOW), [], gps, NOW)).toEqual([])
  })

  it('les témoignages sont explicitement non vérifiés, sans proximité inventée', () => {
    const reports = rankStreetReports([communityReport(), communityReport({ id: 'far', lat: 14.81, lng: -17.3 }),
      communityReport({ id: 'unknown', lat: null, lng: null })], gps, NOW)
    const notices = trafficNotices([], reports, gps, NOW)
    expect(notices).toHaveLength(1)
    expect(notices[0].message).toContain('témoignage non vérifié')
  })

  it('réutilise le toast, ne demande jamais de permission, ne duplique pas la même preuve', async () => {
    const requestPermission = vi.fn()
    const constructor = vi.fn()
    Object.assign(constructor, { permission: 'default', requestPermission })
    vi.stubGlobal('Notification', constructor)
    const { result, rerender } = renderHook(() => useTrafficNotifications(official(), [], gps, Date.now()))
    expect(result.current.notice?.message).toContain('Alerte confirmée')
    rerender()
    expect(constructor).not.toHaveBeenCalled()
    expect(requestPermission).not.toHaveBeenCalled()
    act(() => result.current.dismiss())
    rerender()
    expect(result.current.notice).toBeNull()
  })

  it('ferme une notification native dès résolution, perte de source ou sortie de zone', () => {
    const close = vi.fn()
    const constructor = vi.fn(function () { return { close } })
    Object.assign(constructor, { permission: 'granted' })
    vi.stubGlobal('Notification', constructor)
    const { result, rerender } = renderHook(({ alerts }) => useTrafficNotifications(alerts, [], gps, Date.now()), { initialProps: { alerts: official() } })
    expect(constructor).toHaveBeenCalledTimes(1)
    rerender({ alerts: [] })
    expect(close).toHaveBeenCalledTimes(1)
    expect(result.current.notice).toBeNull()
  })

  it('à expiration exacte retire toast et notification même avant le prochain appel horaire', async () => {
    const close = vi.fn()
    const constructor = vi.fn(function () { return { close } })
    Object.assign(constructor, { permission: 'granted' })
    vi.stubGlobal('Notification', constructor)
    const { result } = renderHook(() => useTrafficNotifications(official(), [], gps, Date.now()))
    expect(result.current.notice).not.toBeNull()
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(close).toHaveBeenCalledTimes(1)
    expect(result.current.notice).toBeNull()
  })

  it('borne les notifications natives à trois et garde le toast à sa durée habituelle', async () => {
    const close = vi.fn()
    const constructor = vi.fn(function () { return { close } })
    Object.assign(constructor, { permission: 'granted' })
    vi.stubGlobal('Notification', constructor)
    const alerts = rankAlerts(Array.from({ length: 5 }, (_, index) => trafficAlert({ id: `test-${index}` })), gps, 1500, NOW)
    const { result, unmount } = renderHook(() => useTrafficNotifications(alerts, [], gps, Date.now()))
    expect(constructor).toHaveBeenCalledTimes(3)
    await act(async () => { await vi.advanceTimersByTimeAsync(3600) })
    expect(result.current.notice).toBeNull()
    unmount()
    expect(close).toHaveBeenCalledTimes(3)
    expect(vi.getTimerCount()).toBe(0)
  })
})
