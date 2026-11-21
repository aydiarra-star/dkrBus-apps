import { describe, expect, it } from 'vitest'
import { TER_STOPS } from './corridors'
import {
  TER_AIBD_EXTENSION_STOPS,
  TER_AIBD_EXTENSION_STOP_IDS,
  TER_PHASE_ONE_STOPS,
  TER_PHASE_ONE_STOP_IDS,
} from './terServiceScopes'

describe('périmètres géographiques des phases TER', () => {
  it('sépare le tronc Dakar–Diamniadio en 13 gares et l’extension AIBD en 2 gares', () => {
    expect(TER_PHASE_ONE_STOPS).toHaveLength(13)
    expect(TER_AIBD_EXTENSION_STOPS).toHaveLength(2)
    expect(TER_PHASE_ONE_STOP_IDS).toEqual(TER_STOPS.slice(0, 13).map((stop) => stop.id))
    expect(TER_AIBD_EXTENSION_STOP_IDS).toEqual(['ter-diamniadio', 'ter-aibd'])
  })

  it('partage Diamniadio comme unique gare de raccord entre les deux phases', () => {
    expect(TER_PHASE_ONE_STOPS.at(-1)?.id).toBe('ter-diamniadio')
    expect(TER_AIBD_EXTENSION_STOPS[0]?.id).toBe('ter-diamniadio')
    expect(TER_PHASE_ONE_STOPS.some((stop) => stop.id === 'ter-aibd')).toBe(false)
    expect(TER_AIBD_EXTENSION_STOPS.some((stop) => stop.id === 'ter-dakar')).toBe(false)
  })

  it('conserve intégralement la séquence historique des 14 gares et leurs identifiants', () => {
    expect([...TER_PHASE_ONE_STOP_IDS.slice(0, -1), ...TER_AIBD_EXTENSION_STOP_IDS])
      .toEqual(TER_STOPS.map((stop) => stop.id))
    expect(TER_STOPS).toHaveLength(14)
  })
})
