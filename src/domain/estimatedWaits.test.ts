import { describe, expect, it } from 'vitest'
import { estimatedFrequencyReference, estimatedLineFrequencyReference, estimatedLineWaitMinutes, estimatedNextPassage, estimatedWaitMinutes } from './estimatedWaits'

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

  it('applique les fréquences estimatives propres aux lignes AFTU 42 et 53', () => {
    expect(estimatedLineFrequencyReference('DDD 1')).toContain('Parcelles Assainies 05:30–20:30')
    expect(estimatedLineFrequencyReference('AFTU 42')).toContain('15 min du lundi au vendredi')
    expect(estimatedLineFrequencyReference('AFTU 53')).toBeNull()
    expect(estimatedLineFrequencyReference('AFTU 1')).toBeNull()
    expect(estimatedLineWaitMinutes('AFTU 42', 'aftu', Date.parse('2026-11-09T12:00:00Z'))).toBe(8)
    expect(estimatedLineWaitMinutes('AFTU 42', 'aftu', Date.parse('2026-11-08T12:00:00Z'))).toBe(13)
  })

  it('expose les références distinctes DDD, AFTU et TATA', () => {
    expect(estimatedFrequencyReference('ddd')).toContain('7–10 min aux heures de pointe')
    expect(estimatedFrequencyReference('ddd')).toContain('10–15 min en heures creuses')
    expect(estimatedFrequencyReference('aftu')).toContain('11,58 min')
    expect(estimatedFrequencyReference('tata')).toContain('partagée AFTU/TATA')
    expect(estimatedFrequencyReference('ter')).toBeNull()
  })

  it('projette un prochain passage décompté à partir des fréquences DDD et AFTU/TATA', () => {
    expect(estimatedNextPassage('ddd', Date.parse('2026-11-07T07:40:00Z'))).toMatchObject({
      nextDepartureAt: '2026-11-07T07:44:00.000Z',
      minutes: 4,
      headwayMinutes: 8,
    })
    expect(estimatedNextPassage('ddd', Date.parse('2026-11-07T12:00:00Z'))).toMatchObject({
      nextDepartureAt: '2026-11-07T12:02:00.000Z',
      minutes: 2,
      headwayMinutes: 13,
    })
    expect(estimatedNextPassage('aftu', Date.parse('2026-11-07T12:00:00Z'))).toMatchObject({
      nextDepartureAt: '2026-11-07T12:12:00.000Z',
      minutes: 12,
      headwayMinutes: 12,
    })
    expect(estimatedNextPassage('tata', Date.parse('2026-11-07T12:00:00Z'))).toEqual(
      estimatedNextPassage('aftu', Date.parse('2026-11-07T12:00:00Z')),
    )
    expect(estimatedNextPassage('ter', Date.parse('2026-11-07T12:00:00Z'))).toBeNull()
    expect(estimatedNextPassage('aftu', Date.parse('2026-11-07T20:50:00Z'))).toMatchObject({
      nextDepartureAt: '2026-11-07T21:00:00.000Z',
      minutes: 10,
      headwayMinutes: 12,
    })
    expect(estimatedNextPassage('tata', Date.parse('2026-11-07T20:50:00Z'))).toMatchObject({
      nextDepartureAt: '2026-11-07T21:00:00.000Z',
      minutes: 10,
      headwayMinutes: 12,
    })
    expect(estimatedNextPassage('aftu', Date.parse('2026-11-07T21:00:00Z'))).toBeNull()
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
