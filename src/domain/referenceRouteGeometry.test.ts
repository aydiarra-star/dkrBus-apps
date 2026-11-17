import { describe, expect, it } from 'vitest'
import { auditBrtB1DirectionalGeometry, auditTerPhaseOneGeometry } from './referenceRouteGeometry'

describe('audit des géométries ferroviaires et BRT', () => {
  it('raccorde les 13 gares TER phase 1 à la voie réelle sans inclure AIBD', () => {
    const audit = auditTerPhaseOneGeometry()
    expect(audit.scope).toBe('Dakar ↔ Diamniadio (phase 1 only)')
    expect(audit.stopCount).toBe(13)
    expect(audit.projectedCount).toBe(13)
    expect(audit.maxOffsetM).toBeLessThan(12)
    expect(audit.monotonic).toBe(true)
    expect(audit.passed).toBe(true)
    expect(audit.stops.some((stop) => stop.stopId === 'ter-aibd')).toBe(false)
  })

  it('contrôle séparément les deux directions OSM du BRT B1 et refuse la direction mal raccordée', () => {
    const audits = auditBrtB1DirectionalGeometry()
    expect(audits).toHaveLength(2)
    const outbound = audits.find((audit) => audit.direction.startsWith('Petersen'))!
    const inbound = audits.find((audit) => audit.direction.startsWith('Préfecture'))!
    expect(outbound.stopCount).toBe(23)
    expect(outbound.monotonic).toBe(true)
    expect(outbound.maxOffsetM).toBeGreaterThan(80)
    expect(outbound.passed).toBe(false)
    expect(inbound.stopCount).toBe(23)
    expect(inbound.monotonic).toBe(true)
    expect(inbound.maxOffsetM).toBeLessThan(1)
    expect(inbound.passed).toBe(true)
  })
})
