import { describe, expect, it } from 'vitest'
import { AFTU_ROUTE_EVIDENCE, getAftuRouteEvidence } from './aftuRouteEvidence'

describe('adaptateur de preuves AFTU', () => {
  it('charge les 27 fiches de parcours sans les injecter dans le catalogue public', () => {
    expect(AFTU_ROUTE_EVIDENCE).toHaveLength(27)
    expect(new Set(AFTU_ROUTE_EVIDENCE.map((route) => route.line)).size).toBe(27)
    expect(getAftuRouteEvidence('86')?.outbound.waypoints).toHaveLength(68)
    expect(getAftuRouteEvidence('86')?.inbound.waypoints).toHaveLength(64)
    expect(getAftuRouteEvidence('87')?.outbound.waypoints).toHaveLength(68)
    expect(getAftuRouteEvidence('87')?.inbound.waypoints).toHaveLength(71)
    expect(AFTU_ROUTE_EVIDENCE.every((route) => route.network === 'aftu')).toBe(true)
    expect(AFTU_ROUTE_EVIDENCE.every((route) => route.serviceWindow.start === '05:30' && route.serviceWindow.end === '22:00')).toBe(true)
  })

  it('maintient les heures invalidées de la ligne 86 hors des horaires exploitables', () => {
    const route = getAftuRouteEvidence('86')
    expect(route?.outbound.waypoints).toHaveLength(68)
    expect(route?.inbound.waypoints).toHaveLength(64)
    expect(route?.outbound.timetableEntries).toBe(0)
    expect(route?.inbound.timetableEntries).toBe(0)
    expect(route?.outbound.hasPerStopTimes).toBe(false)
    expect(route?.inbound.hasPerStopTimes).toBe(false)
    expect(route?.sourceStatus).toBe('user-provided-cetud-reference')
    expect(route?.outbound.waypoints.filter((name) => name === 'En Face Camp Lgi Mbao Près De La Station Total')).toHaveLength(1)
    expect(route?.outbound.waypoints.some((name) => name.includes('(doublon présent dans la source)'))).toBe(true)
  })

  it('conserve les deux sens de la ligne 87 sans transformer les départs théoriques en horaires par arrêt', () => {
    const route = getAftuRouteEvidence('87')
    expect(route?.outbound.waypoints).toHaveLength(68)
    expect(route?.inbound.waypoints).toHaveLength(71)
    expect(route?.outbound.timetableEntries).toBe(0)
    expect(route?.inbound.timetableEntries).toBe(0)
    expect(route?.outbound.hasPerStopTimes).toBe(false)
    expect(route?.inbound.hasPerStopTimes).toBe(false)
    expect(route?.sourceStatus).toBe('user-provided-cetud-reference')
  })

  it('charge les quatre séquences directionnelles AFTU 88 à 91 sans les fusionner', () => {
    const expected = [
      { line: '88', outbound: 78, inbound: 81, origin: 'Terminus 88', returnOrigin: 'Terminus Liberté 5' },
      { line: '89', outbound: 55, inbound: 53, origin: 'Terminus 89', returnOrigin: 'Poste Courant Bargny Près De La Gare Ter' },
      { line: '90', outbound: 82, inbound: 82, origin: 'Terminus 90 (Départ)', returnOrigin: 'Deni Birame Ndao Nord (Départ)' },
      { line: '91', outbound: 70, inbound: 70, origin: 'Losso (Départ)', returnOrigin: 'Chez Lo électricien (Départ)' },
    ]

    for (const item of expected) {
      const route = getAftuRouteEvidence(item.line)
      expect(route?.outbound.waypoints).toHaveLength(item.outbound)
      expect(route?.inbound.waypoints).toHaveLength(item.inbound)
      expect(route?.outbound.waypoints[0]).toBe(item.origin)
      expect(route?.inbound.waypoints[0]).toBe(item.returnOrigin)
      expect(route?.outbound.direction).toBe('outbound')
      expect(route?.inbound.direction).toBe('inbound')
      expect(route?.outbound.timetableEntries).toBe(0)
      expect(route?.inbound.timetableEntries).toBe(0)
    }
  })

  it('préserve les statuts de validation des séquences 90 et 91', () => {
    expect(getAftuRouteEvidence('90')?.sourceStatus).toBe('user-validated-directional-sequences')
    expect(getAftuRouteEvidence('91')?.sourceStatus).toBe('user-validated-cetud-sequences')
  })

  it('identifie toutes les séquences retour manquantes dans les 27 fiches détaillées chargées', () => {
    const missing = AFTU_ROUTE_EVIDENCE
      .filter((route) => route.inbound.sequenceStatus === 'missing')
      .map((route) => route.line)
    expect(missing).toEqual(['83'])
    expect(AFTU_ROUTE_EVIDENCE.every((route) =>
      route.outbound.sequenceStatus === 'documented' && route.serviceWindow.start === '05:30' && route.serviceWindow.end === '22:00',
    )).toBe(true)
  })

  it('conserve le retour absent de la fiche 83', () => {
    const route = getAftuRouteEvidence('83')
    expect(route?.outbound.waypoints).toHaveLength(14)
    expect(route?.inbound.waypoints).toHaveLength(0)
    expect(route?.inboundCorridorStatus).toBe('confirmed-sequence-unavailable')
    expect(route?.inbound.hasPerStopTimes).toBe(false)
    expect(route?.inbound.sequenceStatus).toBe('missing')
    expect(route?.inbound.waypoints).toHaveLength(0)
    expect(route?.outbound.sequenceStatus).toBe('documented')
    expect(route?.serviceWindow).toEqual({ start: '05:30', end: '22:00', source: 'CETUD-network-default' })
  })

  it('conserve les deux séquences et les seuls horaires retour de la fiche 84', () => {
    const route = getAftuRouteEvidence('84')
    expect(route?.outbound.waypoints).toHaveLength(73)
    expect(route?.inbound.waypoints).toHaveLength(73)
    expect(route?.outbound.timetableEntries).toBe(0)
    expect(route?.inbound.timetableEntries).toBe(73)
    expect(route?.outbound.hasPerStopTimes).toBe(false)
    expect(route?.inbound.hasPerStopTimes).toBe(true)
    expect(route?.outbound.scheduleInterval).toBe('14 min')
    expect(route?.outbound.sequenceStatus).toBe('documented')
    expect(route?.inbound.sequenceStatus).toBe('documented')
    expect(route?.serviceWindow).toMatchObject({ start: '05:30', end: '22:00' })
  })

  it('conserve les séquences distinctes de la fiche 85 sans créer des horaires par arrêt', () => {
    const route = getAftuRouteEvidence('85')
    expect(route?.outbound.waypoints).toHaveLength(89)
    expect(route?.inbound.waypoints).toHaveLength(95)
    expect(route?.outbound.timetableEntries).toBe(0)
    expect(route?.inbound.timetableEntries).toBe(0)
    expect(route?.outbound.scheduleInterval).toContain('10–15 min')
  })

  it('verrouille les volumes directionnels des lignes AFTU 30 et 66', () => {
    expect(getAftuRouteEvidence('30')?.outbound.waypoints).toHaveLength(77)
    expect(getAftuRouteEvidence('30')?.inbound.waypoints).toHaveLength(74)
    expect(getAftuRouteEvidence('66')?.outbound.waypoints).toHaveLength(77)
    expect(getAftuRouteEvidence('66')?.inbound.waypoints).toHaveLength(77)
  })

  it('signale les repères génériques et les libellés répétés sans les supprimer', () => {
    const route = getAftuRouteEvidence('30')
    expect(route?.outbound.genericStopLabels).toBeGreaterThan(0)
    expect(route?.outbound.waypoints.filter((name) => name === 'Arrêt De Bus').length)
      .toBe(route?.outbound.genericStopLabels)
    expect(route?.outbound.repeatedLabels.length).toBeGreaterThan(0)
  })
})
