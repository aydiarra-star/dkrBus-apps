import { describe, expect, it } from 'vitest'
import route from './aftu-83-directions.json'

describe('parcours officiel AFTU 83', () => {
  it('conserve les 14 points de passage publiés de Rufisque Arafat vers Zone de Captage', () => {
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('83')
    expect(route.waypoints).toHaveLength(14)
    expect(route.waypoints[0]).toBe('Terminus Rufisque Arafat')
    expect(route.waypoints.at(-1)).toBe('Terminus Zone de Captage')
    expect(new Set(route.waypoints).size).toBe(route.waypoints.length)
    expect(route.detailSourceUrl).toBe('https://aftu-senegal.org/map/dakar-urbain-ligne-83/')
  })

  it('ne fabrique pas un parcours retour absent de la fiche officielle', () => {
    expect('inboundWaypoints' in route).toBe(false)
  })
})
