import { describe, expect, it } from 'vitest'
import route from './aftu-86-directions.json'

describe('parcours AFTU 86', () => {
  it('conserve les 68 arrêts aller sans publier les heures non fiables', () => {
    const outbound = route.directions.outbound
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('86')
    expect(outbound.origin).toBe('Yeumbeul')
    expect(outbound.destination).toBe('Terminus 86 / Touba Ngayame')
    expect(outbound.waypoints).toHaveLength(68)
    expect('times' in outbound).toBe(false)
    expect(outbound.transcribedTimesUnvalidated).toHaveLength(68)
    expect(outbound.transcribedTimesUnvalidated[0]).toBe('05:47')
    expect(outbound.transcribedTimesUnvalidated[8]).toBe('05:38')
    expect(outbound.transcribedTimesUnvalidated.at(-1)).toBe('06:50')
    expect(outbound.waypoints[18]).toBe('En Face Camp Lgi Mbao Près De La Station Total')
    expect(outbound.waypoints[19]).toBe('En Face Camp Lgi Mbao Près De La Station Total (doublon présent dans la source)')
    expect(route.waypoints).toEqual(outbound.waypoints)
    expect(route.timeStatus).toBe('invalid-unverified')
  })

  it('conserve les 64 arrêts retour séparément, sans inventer d’horaires', () => {
    const inbound = route.directions.inbound
    expect(inbound.origin).toBe('Terminus 86')
    expect(inbound.destination).toBe('Yeumbeul')
    expect(inbound.waypoints).toHaveLength(64)
    expect(inbound.waypoints[0]).toBe('Terminus 86 (Départ)')
    expect(inbound.waypoints.at(-1)).toBe('Route De Malika En Face Mairie Yeumbel Sud Et Sgbs (Terminus)')
    expect('times' in inbound).toBe(false)
    expect(route.inboundWaypoints).toEqual(inbound.waypoints)
    expect(route.stopCount).toEqual({ outbound: 68, inbound: 64 })
  })

  it('signale que les heures transcrites sont invalides et non publiables', () => {
    expect(route.timeStatus).toBe('invalid-unverified')
    expect(route.note).toContain('heure réelle de départ n’est pas connue')
    expect(route.note).toContain('ne doivent jamais être utilisées')
  })

  it('conserve l’amplitude générale AFTU sans inventer un départ fixe pour la ligne 86', () => {
    expect(route.operatingProfile.generalNetworkOperatingWindow.firstDepartureLocal).toBe('05:30-06:30')
    expect(route.operatingProfile.generalNetworkOperatingWindow.lastDepartureApproxLocal).toBe('21:00')
    expect(route.operatingProfile.lineSpecificFirstDeparture).toBeNull()
    expect(route.timeStatus).toBe('invalid-unverified')
  })
})