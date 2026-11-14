import { describe, expect, it } from 'vitest'
import { AFTU_ROUTE_EVIDENCE, getAftuRouteEvidence } from './aftuRouteEvidence'

describe('adaptateur de preuves AFTU', () => {
  it('charge les 23 fiches de parcours sans les injecter dans le catalogue public', () => {
    expect(AFTU_ROUTE_EVIDENCE).toHaveLength(23)
    expect(new Set(AFTU_ROUTE_EVIDENCE.map((route) => route.line)).size).toBe(23)
    expect(getAftuRouteEvidence('86')?.outbound.waypoints).toHaveLength(68)
    expect(getAftuRouteEvidence('86')?.inbound.waypoints).toHaveLength(64)
    expect(getAftuRouteEvidence('87')?.outbound.waypoints).toHaveLength(68)
    expect(getAftuRouteEvidence('87')?.inbound.waypoints).toHaveLength(71)
    expect(AFTU_ROUTE_EVIDENCE.every((route) => route.network === 'aftu')).toBe(true)
  })

  it('conserve le retour absent de la fiche 83', () => {
    const route = getAftuRouteEvidence('83')
    expect(route?.outbound.waypoints).toHaveLength(14)
    expect(route?.inbound.waypoints).toHaveLength(0)
    expect(route?.inbound.hasPerStopTimes).toBe(false)
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
  })

  it('conserve les séquences distinctes de la fiche 85 sans créer des horaires par arrêt', () => {
    const route = getAftuRouteEvidence('85')
    expect(route?.outbound.waypoints).toHaveLength(89)
    expect(route?.inbound.waypoints).toHaveLength(95)
    expect(route?.outbound.timetableEntries).toBe(0)
    expect(route?.inbound.timetableEntries).toBe(0)
    expect(route?.outbound.scheduleInterval).toContain('10–15 min')
  })

  it('signale les repères génériques et les libellés répétés sans les supprimer', () => {
    const route = getAftuRouteEvidence('30')
    expect(route?.outbound.genericStopLabels).toBeGreaterThan(0)
    expect(route?.outbound.waypoints.filter((name) => name === 'Arrêt De Bus').length)
      .toBe(route?.outbound.genericStopLabels)
    expect(route?.outbound.repeatedLabels.length).toBeGreaterThan(0)
  })
})
