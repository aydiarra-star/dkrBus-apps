import { describe, expect, it } from 'vitest'
import { estimatedWaitMinutes } from './estimatedWaits'

describe('estimations de temps d’attente', () => {
  it('calcule une attente DDD plus courte aux heures de pointe', () => {
    expect(estimatedWaitMinutes('ddd', Date.parse('2026-11-07T07:30:00Z'))).toBe(4)
    expect(estimatedWaitMinutes('ddd', Date.parse('2026-11-07T12:00:00Z'))).toBe(6)
    expect(estimatedWaitMinutes('ddd', Date.parse('2026-11-07T17:30:00Z'))).toBe(4)
  })

  it('utilise l’attente moyenne AFTU calculée à partir des observations 2023-2024', () => {
    expect(estimatedWaitMinutes('aftu', Date.parse('2026-11-07T12:00:00Z'))).toBe(8)
    expect(estimatedWaitMinutes('tata', Date.parse('2026-11-07T12:00:00Z'))).toBe(8)
  })

  it('ne donne pas d’attente en dehors de l’amplitude de service', () => {
    expect(estimatedWaitMinutes('ddd', Date.parse('2026-11-07T05:59:00Z'))).toBeNull()
    expect(estimatedWaitMinutes('aftu', Date.parse('2026-11-07T21:00:00Z'))).toBeNull()
    expect(estimatedWaitMinutes('ter', Date.parse('2026-11-07T12:00:00Z'))).toBeNull()
  })

  it('refuse une horloge invalide', () => {
    expect(estimatedWaitMinutes('ddd', Number.NaN)).toBeNull()
  })
})
