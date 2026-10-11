import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COMMUNITY_API_PATH, COMMUNITY_OWNERSHIP_KEY, fetchCommunitySnapshot, parseCommunitySnapshot,
  publishCommunityReport, removeCommunityReport, pruneCommunityOwnership, readCommunityOwnership } from './communityFeed'
import { communityPayload, communityReport, COMMUNITY_TEST_ID as ID, COMMUNITY_TEST_KEY as KEY } from '../test/communityFixtures'
import { TRAFFIC_TEST_NOW as NOW, isoAt } from '../test/trafficFixtures'

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })

describe('transport partagé Direct rue sans cache', () => {
  it('valide provenance, dates et capacité, puis écarte les signalements périmés', () => {
    const report = communityReport()
    expect(parseCommunitySnapshot(communityPayload([report]), NOW)?.reports).toHaveLength(1)
    expect(parseCommunitySnapshot(communityPayload([report], NOW + 60 * 60_000), NOW + 60 * 60_000)?.reports).toEqual([])
    for (const value of [communityPayload([], NOW - 60 * 60_000), { ...communityPayload(), region: 'other' },
      { ...communityPayload(), verification: 'AI_CONFIRMED' }, { ...communityPayload(), sharingAvailable: false },
      communityPayload([{ ...report, source: 'OFFICIAL' as never }]), communityPayload([{ ...report, shared: false }]),
      communityPayload([report, report])]) expect(parseCommunitySnapshot(value, NOW)).toBeNull()
  })

  it('lit uniquement une URL relative, sans envoyer le GPS de consultation ni auth', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response(communityPayload()))
    await fetchCommunitySnapshot({ fetcher })
    expect(fetcher.mock.calls[0][0]).toBe(COMMUNITY_API_PATH)
    expect(fetcher.mock.calls[0][1]?.cache).toBe('no-store')
    expect(fetcher.mock.calls[0][1]?.body).toBeUndefined()
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('Authorization')).toBeNull()
  })

  it('publie seulement les champs explicites, garde les dates serveur et jamais une validation de faits', async () => {
    const created = communityReport({}, NOW - 1000)
    const fetcher = vi.fn<typeof fetch>(async () => response({ report: created, deleteKey: KEY }, 201))
    const result = await publishCommunityReport({ kind: 'CONGESTION', place: 'Hann', comment: 'File arrêtée' }, { fetcher })
    expect(result.report.createdAt).toBe(isoAt(NOW - 1000))
    const request = fetcher.mock.calls[0][1]!
    expect(request.method).toBe('POST')
    expect(request.cache).toBe('no-store')
    expect(JSON.parse(request.body as string)).toEqual({ kind: 'CONGESTION', place: 'Hann', comment: 'File arrêtée', networkId: null, lat: null, lng: null })
    expect(new Headers(request.headers).get('X-Dakar-Community')).toBe('1')
  })

  it('retrait uniquement avec une capacité auteur, jamais dans URL ou corps public', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response({ removed: true }))
    await removeCommunityReport(ID, KEY, { fetcher })
    expect(fetcher.mock.calls[0][0]).toBe(`${COMMUNITY_API_PATH}/${ID}`)
    const request = fetcher.mock.calls[0][1]!
    expect(new Headers(request.headers).get('X-Dakar-Report-Key')).toBe(KEY)
    expect(request.body).toBeUndefined()
    await expect(removeCommunityReport(ID, 'wrong', { fetcher })).rejects.toThrow(/auteur/)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('ne réutilise pas HTML, panne, refus, réponse POST périmée ou messages serveur arbitraires', async () => {
    await expect(fetchCommunitySnapshot({ fetcher: async () => new Response('<html>404</html>', { status: 404 }) })).rejects.toThrow()
    await expect(publishCommunityReport({ kind: 'OTHER', place: 'Hann' }, { fetcher: async () => response({ message: 'secret provider content' }, 429) })).rejects.toThrow(/une minute/)
    await expect(publishCommunityReport({ kind: 'OTHER', place: 'Hann' }, { fetcher: async () => response({ report: communityReport({}, NOW - 60 * 60_000), deleteKey: KEY }) })).rejects.toThrow(/non confirmée/)
  })
})

describe('reçus auteur locaux, bornés et périssables', () => {
  it('ne garde que les capacités valides et non expirées', () => {
    const own = { [ID]: { deleteKey: KEY, expiresAt: isoAt(NOW + 60 * 60_000) } }
    expect(pruneCommunityOwnership(own, NOW)).toEqual(own)
    expect(pruneCommunityOwnership(own, NOW + 60 * 60_000)).toEqual({})
    expect(pruneCommunityOwnership({ [ID]: { deleteKey: KEY, expiresAt: isoAt(NOW + 90 * 60_000) } }, NOW)).toEqual({})
    expect(pruneCommunityOwnership({ [ID]: { deleteKey: 'wrong', expiresAt: isoAt(NOW + 1000) } }, NOW)).toEqual({})
  })

  it('purge physiquement un reçu expiré et supporte un stockage refusé', () => {
    const state = { value: JSON.stringify({ [ID]: { deleteKey: KEY, expiresAt: isoAt(NOW) } }) }
    const storage = { getItem: () => state.value, setItem: (key: string, value: string) => { expect(key).toBe(COMMUNITY_OWNERSHIP_KEY); state.value = value }, removeItem: () => { state.value = '' } } as unknown as Storage
    expect(readCommunityOwnership(storage, NOW)).toEqual({})
    expect(state.value).toBe('{}')
    expect(readCommunityOwnership(null, NOW)).toEqual({})
    expect(readCommunityOwnership({ getItem: () => { throw new Error('denied') }, removeItem: () => {} } as unknown as Storage)).toEqual({})
  })
})
