import { describe, expect, it } from 'vitest'
import route from './aftu-83-directions.json'

describe('parcours CETUD AFTU 83', () => {
  it('conserve les 93 occurrences aller et les 90 occurrences retour', () => {
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('83')
    expect(route.directions.outbound.waypoints).toHaveLength(93)
    expect(route.directions.inbound.waypoints).toHaveLength(90)
    expect(route.directions.outbound.waypoints[0]).toBe('Sonadis près du Jardin En Face Hôtel De Ville (Départ)')
    expect(route.directions.outbound.waypoints.at(-1)).toBe('Zone De Captage (Terminus)')
    expect(route.directions.inbound.waypoints[0]).toBe('Zone De Captage (Départ)')
    expect(route.directions.inbound.waypoints.at(-1)).toBe('Rufisque Ville Devant La Boutique Orange À Coté De La Mairie (Terminus)')
  })

  it('conserve les doublons transmis et la fréquence CETUD', () => {
    expect(route.directions.outbound.waypoints.filter((stop) => stop === 'Malika Plage Vdn')).toHaveLength(2)
    expect(route.directions.inbound.waypoints.filter((stop) => stop === 'Terrain De Football Zone De Captage')).toHaveLength(2)
    expect(route.directions.inbound.waypoints.filter((stop) => stop === 'Terminus Malika')).toHaveLength(2)
    expect(route.frequency.intervalMinutes).toBe(11)
    expect(route.frequency.display).toBe('11 min')
    expect(route.sourceStatus).toBe('user-validated-cetud-sequences')
  })
})
