import { describe, expect, it } from 'vitest'
import { TER_STOPS } from './corridors'
import { TER_CUMULATIVE_TRAVEL_TIMES, terTravelTimeMidpointMinutes } from './terTravelTimes'

describe('référentiel des durées cumulées TER', () => {
  it('couvre chaque gare TER une seule fois, de Dakar à AIBD', () => {
    const stopIds = TER_STOPS.map((stop) => stop.id)
    expect(Object.keys(TER_CUMULATIVE_TRAVEL_TIMES)).toEqual(stopIds)
    expect(new Set(Object.keys(TER_CUMULATIVE_TRAVEL_TIMES)).size).toBe(14)
  })

  it('conserve exactement les plages relevées dans TER INFOS', () => {
    expect(TER_CUMULATIVE_TRAVEL_TIMES).toEqual({
      'ter-dakar': { minMinutes: 0, maxMinutes: 0 },
      'ter-colobane': { minMinutes: 3, maxMinutes: 3 },
      'ter-hann': { minMinutes: 7, maxMinutes: 8 },
      'ter-dalifort': { minMinutes: 10, maxMinutes: 11 },
      'ter-baux-maraichers': { minMinutes: 13, maxMinutes: 14 },
      'ter-pikine': { minMinutes: 15, maxMinutes: 17 },
      'ter-thiaroye': { minMinutes: 19, maxMinutes: 20 },
      'ter-yeumbeul': { minMinutes: 22, maxMinutes: 24 },
      'ter-mbao': { minMinutes: 27, maxMinutes: 28 },
      'ter-pnr': { minMinutes: 31, maxMinutes: 33 },
      'ter-rufisque': { minMinutes: 34, maxMinutes: 35 },
      'ter-bargny': { minMinutes: 39, maxMinutes: 41 },
      'ter-diamniadio': { minMinutes: 44, maxMinutes: 45 },
      'ter-aibd': { minMinutes: 56, maxMinutes: 57 },
    })
  })

  it('utilise le milieu des plages sans modifier les valeurs sources', () => {
    expect(terTravelTimeMidpointMinutes('ter-hann')).toBe(7.5)
    expect(terTravelTimeMidpointMinutes('ter-bargny')).toBe(40)
    expect(terTravelTimeMidpointMinutes('ter-aibd')).toBe(56.5)
    expect(terTravelTimeMidpointMinutes('unknown')).toBe(0)
  })
})
