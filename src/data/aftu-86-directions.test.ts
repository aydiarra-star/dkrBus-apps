import { describe, expect, it } from 'vitest'
import route from './aftu-86-directions.json'

describe('parcours AFTU 86', () => {
  it('conserve les 68 arrêts aller et leurs horaires dans l’ordre fourni', () => {
    const outbound = route.directions.outbound
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('86')
    expect(outbound.origin).toBe('Yeumbeul')
    expect(outbound.destination).toBe('Terminus 86 / Touba Ngayame')
    expect(outbound.waypoints).toHaveLength(68)
    expect(outbound.times).toHaveLength(68)
    expect(outbound.times[0]).toBe('05:47')
    expect(outbound.times[8]).toBe('05:38')
    expect(outbound.times.at(-1)).toBe('06:50')
    expect(outbound.waypoints[18]).toBe('En Face Camp Lgi Mbao Près De La Station Total')
    expect(outbound.waypoints[19]).toBe('En Face Camp Lgi Mbao Près De La Station Total (doublon présent dans la source)')
    expect(route.waypoints).toEqual(outbound.waypoints)
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

  it('identifie la provenance CETUD transmise et signale l’anomalie horaire sans la corriger', () => {
    expect(route.sourceStatus).toBe('user-provided-cetud-reference')
    expect(route.sourceLabel).toContain('CETUD')
    expect(route.directions.outbound.times[7]).toBe('05:50')
    expect(route.directions.outbound.times[8]).toBe('05:38')
    expect(route.note).toContain('rupture chronologique')
  })
})
