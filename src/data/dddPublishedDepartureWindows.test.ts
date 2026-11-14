import { describe, expect, it } from 'vitest'
import { DDD_PUBLISHED_DEPARTURE_WINDOWS } from './dddPublishedDepartureWindows'

describe('official DDD terminal departure windows', () => {
  it('records the two line 1 terminal directions published by DDD', () => {
    expect(DDD_PUBLISHED_DEPARTURE_WINDOWS.filter((item) => item.service === 'Ligne 1')).toEqual([
      expect.objectContaining({
        origin: 'Parcelles Assainies',
        destination: 'Place Leclerc',
        firstDeparture: '05:30',
        lastDeparture: '20:30',
        sourceUrl: 'https://demdikk.sn/',
        intervalMinutes: null,
      }),
      expect.objectContaining({
        origin: 'Place Leclerc',
        destination: 'Parcelles Assainies',
        firstDeparture: '06:30',
        lastDeparture: '21:00',
        sourceUrl: 'https://demdikk.sn/',
        intervalMinutes: null,
      }),
    ])
  })

  it('keeps all four TAF TAF terminal directions and never invents a headway', () => {
    const tafTaf = DDD_PUBLISHED_DEPARTURE_WINDOWS.filter((item) => item.service === 'TAF TAF')
    expect(tafTaf).toHaveLength(4)
    expect(tafTaf.map((item) => [item.origin, item.destination, item.firstDeparture, item.lastDeparture])).toEqual([
      ['Ouakam', 'AIBD', '06:00', '21:00'],
      ['Ouakam', 'Sphère ministérielle', '05:45', '21:00'],
      ['AIBD', 'Ouakam', '06:00', '21:00'],
      ['Sphère ministérielle', 'Ouakam', '06:00', '20:30'],
    ])
    expect(tafTaf.every((item) => item.intervalMinutes === null)).toBe(true)
    expect(tafTaf.every((item) => item.sourceUrl === 'https://demdikk.sn/info-voyageurs/')).toBe(true)
  })
})
