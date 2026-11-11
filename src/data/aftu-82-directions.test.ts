import { describe, expect, it } from 'vitest'
import route from './aftu-82-directions.json'

describe('parcours AFTU 82 dans les deux sens', () => {
  it('conserve les 51 arrêts publiés dans le sens Lat Dior vers Comico/Yeumbeul', () => {
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('82')
    expect(route.waypoints).toHaveLength(51)
    expect(route.waypoints[0]).toBe('Avenue Pl 52, 122')
    expect(route.detailSourceUrl).toBe('https://aftu-senegal.org/map/dakar-urbain-ligne-82/')
  })

  it('conserve séparément les 49 arrêts publiés dans le sens retour', () => {
    expect(route.inboundWaypoints).toHaveLength(49)
    expect(route.inboundWaypoints[0]).toBe('Marché')
    expect(route.inboundWaypoints.at(-1)).toBe('Avenue Pl 52, 122')
    expect(route.inboundDetailSourceUrl).toContain('line-82-Dakar-5996-1618038-18051521-0')
  })

  it('utilise les horaires publiés séparément pour chaque sens', () => {
    expect(route.outboundSchedule.weekday).toEqual({ start: '05:25', end: '22:05', interval: '20 min' })
    expect(route.inboundSchedule.weekday).toEqual({ start: '05:20', end: '22:08', interval: '16 min' })
    expect(route.outboundSchedule.sourceUrl).toContain('-1')
    expect(route.inboundSchedule.sourceUrl).toContain('-0')
  })
})
