import { describe, expect, it } from 'vitest'
import { estimatedFrequencyReference, estimatedWaitMinutes } from './estimatedWaits'

describe('estimations de temps d’attente', () => {
  it('calcule une attente DDD indicative plus courte aux heures de pointe', () => {
    expect(estimatedWaitMinutes('ddd', Date.parse('2026-11-07T07:30:00Z'))).toBe(4)
    expect(estimatedWaitMinutes('ddd', Date.parse('2026-11-07T12:00:00Z'))).toBe(6)
    expect(estimatedWaitMinutes('ddd', Date.parse('2026-11-07T17:30:00Z'))).toBe(4)
  })

  it('applique la référence empirique partagée aux minibus AFTU et TATA', () => {
    expect(estimatedWaitMinutes('aftu', Date.parse('2026-11-07T12:00:00Z'))).toBe(8)
    expect(estimatedWaitMinutes('tata', Date.parse('2026-11-07T12:00:00Z'))).toBe(8)
  })

  it('expose les références distinctes DDD, AFTU et TATA', () => {
    expect(estimatedFrequencyReference('ddd')).toContain('7–10 min en pointe')
    expect(estimatedFrequencyReference('ddd')).toContain('10–15 min en heures creuses')
    expect(estimatedFrequencyReference('aftu')).toContain('11,58 min')
    expect(estimatedFrequencyReference('tata')).toContain('partagée AFTU/TATA')
    expect(estimatedFrequencyReference('ter')).toBeNull()
  })

  it('ne donne pas d’attente en dehors de l’amplitude de service', () => {
    expect(estimatedWaitMinutes('ddd', Date.parse('2026-11-07T05:29:00Z'))).toBeNull()
    expect(estimatedWaitMinutes('ddd', Date.parse('2026-11-07T05:30:00Z'))).toBe(6)
    expect(estimatedWaitMinutes('aftu', Date.parse('2026-11-07T21:00:00Z'))).toBeNull()
    expect(estimatedWaitMinutes('tata', Date.parse('2026-11-07T21:00:00Z'))).toBeNull()
    expect(estimatedWaitMinutes('ter', Date.parse('2026-11-07T12:00:00Z'))).toBeNull()
  })

  it('refuse une horloge invalide', () => {
    expect(estimatedWaitMinutes('ddd', Number.NaN)).toBeNull()
  })
})
