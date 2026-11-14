import { describe, expect, it } from 'vitest'
import route from './aftu-87-directions.json'

describe('parcours AFTU 87 issus des captures CETUD', () => {
  it('conserve les 68 arrêts aller dans l’ordre transmis', () => {
    const outbound = route.directions.outbound
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('87')
    expect(outbound.origin).toBe('Terminus 79 87')
    expect(outbound.destination).toBe('Maristes Terminus 87')
    expect(outbound.waypoints).toHaveLength(68)
    expect(outbound.waypoints[0]).toBe('Terminus 79 87')
    expect(outbound.waypoints.at(-1)).toBe('Maristes Terminus 87')
    expect(outbound.waypoints[30]).toBe('Arrêt Keur Massar')
    expect(outbound.waypoints[36]).toBe('Arrêt Keur Massar')
  })

  it('conserve les 71 arrêts retour indépendamment', () => {
    const inbound = route.directions.inbound
    expect(inbound.origin).toBe('Maristes Terminus 87')
    expect(inbound.destination).toBe('Terminus 79 87')
    expect(inbound.waypoints).toHaveLength(71)
    expect(inbound.waypoints[0]).toBe('Maristes Terminus 87')
    expect(inbound.waypoints.at(-1)).toBe('Terminus 79 87')
    expect(inbound.waypoints[33]).toBe('Keur Massar')
    expect(inbound.waypoints[39]).toBe('Keur Massar')
  })

  it('ne crée aucun horaire ni fréquence absents de la source', () => {
    expect(route.timeStatus).toBe('not-provided')
    expect('times' in route.directions.outbound).toBe(false)
    expect('times' in route.directions.inbound).toBe(false)
    expect('frequencyMinutes' in route).toBe(false)
    expect(route.sourceStatus).toBe('user-provided-cetud-reference')
    expect(route.note).toContain('Aucun horaire ni fréquence')
  })

  it('enregistre les deux départs théoriques et la fréquence de pointe sans créer de passages', () => {
    expect(route.operatingProfile.lineSpecificFirstDeparture.outbound.timeLocal).toBe('06:30')
    expect(route.operatingProfile.lineSpecificFirstDeparture.inbound.timeLocal).toBe('06:35')
    expect(route.operatingProfile.peakHeadwayMinutes).toEqual({ min: 5, max: 15, scope: 'peak departures from peripheral termini; variable with passenger loading and traffic' })
    expect(route.timeStatus).toBe('theoretical-departure-reference-only')
    expect('times' in route.directions.outbound).toBe(false)
    expect('times' in route.directions.inbound).toBe(false)
  })
})