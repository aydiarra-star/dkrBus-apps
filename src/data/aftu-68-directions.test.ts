import { describe, expect, it } from 'vitest'
import route from './aftu-68-directions.json'

describe('parcours AFTU 68 dans les deux sens', () => {
  it('conserve les 50 arrêts du sens Yeumbeul dans l’ordre publié', () => {
    expect(route.network).toBe('aftu')
    expect(route.code).toBe('68')
    expect(route.waypoints).toHaveLength(50)
    expect(route.waypoints[0]).toBe('Terminus 68')
    expect(route.waypoints.at(-1)).toBe('Complexe Islamique')
    expect(route.detailSourceUrl).toContain('18051494-1')
  })

  it('conserve séparément les 50 arrêts du sens Bargny', () => {
    expect(route.inboundWaypoints).toHaveLength(50)
    expect(route.inboundWaypoints[0]).toBe('Complexe Islamique')
    expect(route.inboundWaypoints.at(-1)).toBe('Terminus 68')
    expect(route.inboundDetailSourceUrl).toContain('18051494-0')
  })

  it('conserve les fréquences et amplitudes distinctes des deux sens', () => {
    expect(route.outboundSchedule.weekday).toEqual({ start: '05:00', end: '20:45', interval: '27 min' })
    expect(route.outboundSchedule.saturday).toEqual({ start: '05:30', end: '20:33', interval: '43 min' })
    expect(route.inboundSchedule.weekday).toEqual({ start: '05:30', end: '21:00', interval: '30 min' })
    expect(route.inboundSchedule.saturday).toEqual({ start: '06:00', end: '21:00', interval: '45 min' })
  })
})
