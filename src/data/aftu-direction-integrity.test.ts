import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function loadRoute(file: string) {
  return JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8')) as Record<string, any>
}

describe('AFTU direction integrity', () => {
  it('keeps outbound and inbound sequences independent for line 30', () => {
    const route = loadRoute('./aftu-30-directions.json')
    expect(route.waypoints).toHaveLength(77)
    expect(route.inboundWaypoints).toHaveLength(74)
    expect(route.waypoints).not.toEqual(route.inboundWaypoints)
    expect(route.outboundSchedule).toBeDefined()
    expect(route.inboundSchedule).toBeDefined()
    expect(route.waypoints.filter((stop: string) => stop === 'Arrêt De Bus').length).toBeGreaterThan(1)
    expect(route.inboundWaypoints.filter((stop: string) => stop === 'Arrêt De Bus').length).toBeGreaterThan(1)
  })

  it('keeps the two line 66 sequences as separately sourced lists', () => {
    const route = loadRoute('./aftu-66-return.json')
    expect(route.waypoints).toHaveLength(77)
    expect(route.inboundWaypoints).toHaveLength(77)
    expect(route.waypoints).not.toEqual(route.inboundWaypoints)
    expect(route.detailSourceUrl).toContain('-0')
    expect(route.inboundDetailSourceUrl).toContain('-1')
  })

  it('preserves both validated CETUD directions for line 83 without manufacturing stop times', () => {
    const route = loadRoute('./aftu-83-directions.json')
    expect(route.directions.outbound.waypoints).toHaveLength(93)
    expect(route.directions.inbound.waypoints).toHaveLength(90)
    expect(route.directions.outbound.waypoints).not.toEqual(route.directions.inbound.waypoints)
    expect(route.stopCount).toEqual({ outbound: 93, inbound: 90 })
    expect(route.frequency.intervalMinutes).toBe(11)
    expect(route.directions.outbound.times).toBeUndefined()
    expect(route.directions.inbound.times).toBeUndefined()
    expect(route.sourceStatus).toBe('user-validated-cetud-sequences')
  })

  it('preserves both supplied directions and their independent counts for line 84', () => {
    const route = loadRoute('./aftu-84-directions.json')
    expect(route.directions.outbound.waypoints).toHaveLength(73)
    expect(route.directions.inbound.waypoints).toHaveLength(73)
    expect(route.directions.outbound.waypoints).not.toEqual(route.directions.inbound.waypoints)
    expect(route.stopCount).toEqual({ outbound: 73, inbound: 73 })
    expect(route.directions.outbound.times).toBeUndefined()
    expect(route.directions.inbound.times).toHaveLength(73)
  })

  it('preserves line 85 return variants and the 89/95 stop-count difference', () => {
    const route = loadRoute('./aftu-85-directions.json')
    expect(route.waypoints).toHaveLength(89)
    expect(route.inboundWaypoints).toHaveLength(95)
    expect(route.waypoints).not.toEqual(route.inboundWaypoints)
    expect(route.inboundWaypoints.filter((stop: string) => stop === 'Terminus De La Ligne 73')).toHaveLength(2)
  })
})
