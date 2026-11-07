import { describe, expect, it } from 'vitest'
import {
  OBSERVED_WAIT_POLICY,
  estimateObservedWait,
  isUsablePassageObservation,
  type ObservedPassage,
} from './observedWaits'

const NOW = Date.parse('2026-10-08T12:01:00.000Z')
const QUERY = {
  networkId: 'aftu' as const,
  lineId: 'aftu-1',
  directionId: 'outbound',
  stopId: 'stop-lat-dior',
  now: NOW,
}

function samples(overrides: Partial<ObservedPassage> = {}): ObservedPassage[] {
  return Array.from({ length: 13 }, (_, index) => ({
    networkId: 'aftu',
    lineId: 'aftu-1',
    directionId: 'outbound',
    stopId: 'stop-lat-dior',
    observedAt: new Date(Date.parse('2026-10-08T10:00:00.000Z') + index * 10 * 60_000).toISOString(),
    collectedBy: 'explicit-user-action',
    ...overrides,
  }))
}

describe('estimation empirique de l’attente DDD/AFTU', () => {
  it('calcule une attente moyenne et une fourchette depuis 12 intervalles observés', () => {
    const result = estimateObservedWait(samples(), QUERY)
    expect(result).toMatchObject({
      kind: 'OBSERVED_WAIT_ESTIMATE',
      status: 'USABLE',
      networkId: 'aftu',
      lineId: 'aftu-1',
      directionId: 'outbound',
      stopId: 'stop-lat-dior',
      serviceDay: 'WEEKDAY',
      servicePeriod: 'DAYTIME',
      meanWaitMinutes: 5,
      waitRangeMinutes: { min: 5, max: 5 },
      observedIntervals: 12,
      lastObservedAt: '2026-10-08T12:00:00.000Z',
    })
    if (result.kind === 'OBSERVED_WAIT_ESTIMATE') {
      expect(result.note).toMatch(/pas un horaire garanti ni du temps réel/i)
    }
  })

  it('ne mélange jamais deux lignes, deux sens, deux arrêts ou deux réseaux', () => {
    const data = [
      ...samples(),
      ...samples({ lineId: 'aftu-2' }),
      ...samples({ directionId: 'inbound' }),
      ...samples({ stopId: 'stop-petersen' }),
      ...samples({ networkId: 'ddd' }),
    ]
    expect(estimateObservedWait(data, QUERY).kind).toBe('OBSERVED_WAIT_ESTIMATE')
    expect(estimateObservedWait(data, { ...QUERY, lineId: 'aftu-2' }).kind).toBe('OBSERVED_WAIT_ESTIMATE')
    expect(estimateObservedWait(data, { ...QUERY, directionId: 'inbound' }).kind).toBe('OBSERVED_WAIT_ESTIMATE')
    expect(estimateObservedWait(data, { ...QUERY, stopId: 'stop-petersen' }).kind).toBe('OBSERVED_WAIT_ESTIMATE')
    expect(estimateObservedWait(data, { ...QUERY, networkId: 'ddd' }).kind).toBe('OBSERVED_WAIT_ESTIMATE')
  })

  it('refuse un échantillon trop petit, périmé ou situé hors de la période courante', () => {
    expect(estimateObservedWait(samples().slice(0, 12), QUERY)).toEqual({
      kind: 'NONE',
      reason: 'INSUFFICIENT_OBSERVATIONS',
    })
    const stale = samples().map((item) => ({
      ...item,
      observedAt: new Date(Date.parse(item.observedAt) - 90 * 86_400_000).toISOString(),
    }))
    expect(estimateObservedWait(stale, QUERY).kind).toBe('NONE')
    expect(estimateObservedWait(samples(), { ...QUERY, now: Date.parse('2026-10-08T22:00:00Z') })).toEqual({
      kind: 'NONE',
      reason: 'OUTSIDE_SERVICE_PERIOD',
    })
  })

  it('ne prend pas en compte les signalements passifs, futurs ou d’une autre ligne', () => {
    const passive = samples().map((item) => ({ ...item, collectedBy: 'background-gps' as unknown as 'explicit-user-action' }))
    expect(estimateObservedWait(passive, QUERY).kind).toBe('NONE')
    const future = samples().map((item) => ({ ...item, observedAt: '2026-10-09T10:00:00Z' }))
    expect(estimateObservedWait(future, QUERY).kind).toBe('NONE')
    const otherLine = samples({ lineId: 'unknown-line' })
    expect(estimateObservedWait(otherLine, QUERY).kind).toBe('NONE')
  })

  it('valide les observations avant leur stockage', () => {
    const sample = samples()[0]
    expect(isUsablePassageObservation(sample, NOW)).toBe(true)
    expect(isUsablePassageObservation({ ...sample, observedAt: '2026-10-08T13:00:00Z' }, NOW)).toBe(false)
    expect(isUsablePassageObservation({ ...sample, collectedBy: 'background-gps' } as unknown as ObservedPassage, NOW)).toBe(false)
    expect(isUsablePassageObservation({ ...sample, networkId: 'tata' } as unknown as ObservedPassage, NOW)).toBe(false)
    expect(OBSERVED_WAIT_POLICY.minIntervals).toBe(12)
  })

  it('tient compte de l’irrégularité des intervalles dans l’attente moyenne', () => {
    const data = samples().map((item, index) => ({
      ...item,
      observedAt: new Date(Date.parse('2026-10-08T10:00:00.000Z') + (index === 12 ? 160 : index * 10) * 60_000).toISOString(),
    }))
    const result = estimateObservedWait(data, { ...QUERY, now: Date.parse('2026-10-08T13:01:00.000Z') })
    expect(result.kind).toBe('OBSERVED_WAIT_ESTIMATE')
    if (result.kind === 'OBSERVED_WAIT_ESTIMATE') {
      expect(result.meanWaitMinutes).toBeGreaterThan(5)
      expect(result.waitRangeMinutes.max).toBeGreaterThanOrEqual(result.waitRangeMinutes.min)
    }
  })
})
