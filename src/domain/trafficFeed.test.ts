import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  expireTrafficSnapshot, fetchTrafficSnapshot, nextTrafficExpiry, parseTrafficAlert,
  parseTrafficSnapshot, trafficSummaryContext, TRAFFIC_ALERTS_API_PATH,
} from './trafficFeed'
import { TRAFFIC_ALERT_TTL_MS as HOUR } from './trafficFreshness'
import { TRAFFIC_SOURCES } from './trafficAlerts'
import { isoAt, trafficAlert, trafficPayload, TRAFFIC_TEST_NOW as NOW } from '../test/trafficFixtures'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('contrat des flux trafic', () => {
  test('accepte uniquement un snapshot daté de Dakar, avec les cinq provenances', () => {
    const parsed = parseTrafficSnapshot(trafficPayload([trafficAlert()]), NOW)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.alerts[0].updatedAt).toBe(isoAt(NOW))
    expect(trafficSummaryContext(parsed.value, 'ready', NOW).availability).toBe('current')
    expect(nextTrafficExpiry(parsed.value, NOW)).toBe(NOW + HOUR)
    for (const bad of [
      null, {}, { ...trafficPayload(), region: 'autre' },
      trafficPayload([], NOW - HOUR), trafficPayload([], NOW + 1),
      { ...trafficPayload(), sources: [] },
      { ...trafficPayload(), sources: [trafficPayload().sources[0], ...trafficPayload().sources.slice(0, -1)] },
    ]) expect(parseTrafficSnapshot(bad, NOW).ok).toBe(false)
  })

  test('rejette un incident mal formé sans transformer une réponse invalide en trafic fluide', () => {
    for (const override of [
      { lat: 91 }, { lon: null }, { affectedNetworks: ['inventé'] }, { severity: 'urgent' },
      { confirmedAt: 'hier' }, { updatedAt: '2026-10-11T12:00:00' }, { delayMinutes: -4 },
      { source: { kind: 'AI_SAMPLE', label: 'Exemple' } }, { source: { id: 'cetud', kind: 'TRAFFIC' } }, { lat: null, lon: null, affectedNetworks: [] },
    ]) {
      expect(parseTrafficSnapshot({ ...trafficPayload(), alerts: [{ ...trafficAlert(), ...override }] }, NOW).ok).toBe(false)
    }
    expect(parseTrafficAlert({ ...trafficAlert(), source: { id: 'road', kind: 'TRAFFIC' }, lat: null, lon: null })).toBeNull()
  })

  test('les liens de provenance ne peuvent être remplacés par une URL arbitraire', () => {
    const parsed = parseTrafficAlert({ ...trafficAlert(), source: { ...trafficAlert().source, url: 'javascript:alert(1)', label: 'Faux opérateur' } })!
    expect(parsed.source.url).toBe('https://cetud.sn')
    expect(parsed.source.label).toBe('CETUD')
  })

  test('purge les incidents non confirmés ou trop anciens et dégrade la couverture', () => {
    const parsed = parseTrafficSnapshot(trafficPayload([
      trafficAlert({ id: 'non-confirmé', confirmedAt: null }),
      trafficAlert({ id: 'veille' }, NOW - 24 * HOUR),
    ]), NOW)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.alerts).toEqual([])
    expect(trafficSummaryContext(parsed.value, 'ready', NOW).availability).toBe('partial')
  })

  test('un état résolu plus récent supprime l’incident dans le nouveau snapshot', () => {
    const parsed = parseTrafficSnapshot(trafficPayload([
      trafficAlert({}, NOW - 1000),
      trafficAlert({ status: 'RESOLVED', confirmedAt: null, source: TRAFFIC_SOURCES.find((source) => source.id === 'road')! }),
    ]), NOW)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.alerts).toEqual([])
    expect(trafficSummaryContext(parsed.value, 'ready', NOW).availability).toBe('current')
  })

  test('un opérateur absent ou périmé empêche le statut fluide, sans bloquer les autres', () => {
    const payload = trafficPayload([trafficAlert({ source: TRAFFIC_SOURCES.find((source) => source.id === 'ter')! })])
    payload.sources.find((source) => source.id === 'cetud')!.checkedAt = isoAt(NOW - HOUR)
    const parsed = parseTrafficSnapshot(payload, NOW)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.alerts).toHaveLength(1)
    expect(parsed.value.sources.find((source) => source.id === 'cetud')!.status).toBe('STALE')
    expect(trafficSummaryContext(parsed.value, 'ready', NOW).availability).toBe('partial')
    const disconnected = trafficPayload()
    disconnected.sources = disconnected.sources.map((source) => ({ ...source, status: 'NOT_CONFIGURED', checkedAt: null }))
    expect(trafficSummaryContext(disconnected, 'ready', NOW).availability).toBe('unavailable')
  })

  test('n’admet pas de preuve postérieure à la vérification de la source', () => {
    const payload = trafficPayload([trafficAlert()])
    payload.sources.find((source) => source.id === 'cetud')!.checkedAt = isoAt(NOW - 1000)
    const parsed = parseTrafficSnapshot(payload, NOW)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.alerts).toEqual([])
    expect(trafficSummaryContext(parsed.value, 'ready', NOW).availability).toBe('partial')
  })

  test('expire en mémoire à l’instant exact, sans conserver un cache de la veille', () => {
    const snapshot = trafficPayload([trafficAlert({}, NOW - 20 * 60_000)])
    const expiry = NOW + 40 * 60_000
    expect(nextTrafficExpiry(snapshot, NOW)).toBe(expiry)
    expect(expireTrafficSnapshot(snapshot, expiry - 1)?.alerts).toHaveLength(1)
    const expired = expireTrafficSnapshot(snapshot, expiry)!
    expect(expired.alerts).toEqual([])
    expect(trafficSummaryContext(expired, 'ready', expiry).availability).toBe('partial')
    expect(expireTrafficSnapshot(snapshot, NOW + HOUR)).toBeNull()
    expect(trafficSummaryContext(snapshot, 'ready', NOW + 24 * HOUR).availability).toBe('unavailable')
  })
})

describe('requêtes fraîches au proxy', () => {
  test('envoie le GPS à une URL relative sans cache HTTP', async () => {
    vi.useFakeTimers(); vi.setSystemTime(NOW)
    const fetcher = vi.fn(async () => new Response(JSON.stringify(trafficPayload())))
    const snapshot = await fetchTrafficSnapshot({ lat: 14.7051, lng: -17.4602 }, { fetcher })
    expect(snapshot.alerts).toEqual([])
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url.startsWith(`${TRAFFIC_ALERTS_API_PATH}?`)).toBe(true)
    expect(url).not.toContain('localhost')
    const params = new URL(url, 'https://dakar.example').searchParams
    expect(params.get('lat')).toBe('14.7051')
    expect(params.get('lon')).toBe('-17.4602')
    expect(params.get('radius')).toBe('1500')
    expect(options.cache).toBe('no-store')
  })

  test('une panne, une 404 Pages ou un corps HTML ne deviennent pas une liste vide vérifiée', async () => {
    vi.useFakeTimers(); vi.setSystemTime(NOW)
    await expect(fetchTrafficSnapshot(null, { fetcher: vi.fn(async () => new Response('', { status: 404 })) })).rejects.toThrow()
    await expect(fetchTrafficSnapshot(null, { fetcher: vi.fn(async () => new Response('<html>Pages</html>')) })).rejects.toThrow()
    await expect(fetchTrafficSnapshot(null, { fetcher: vi.fn(async () => { throw new Error('hors ligne') }) })).rejects.toThrow()
  })
})
