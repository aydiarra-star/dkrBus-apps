import { describe, expect, it } from 'vitest'
import routes from './tata-lines.json'

describe('TATA source route candidates', () => {
  it('preserves the 62 sourced route descriptions and 762 waypoint occurrences', () => {
    expect(routes).toHaveLength(62)
    expect(routes.reduce((total, route) => total + route.waypoints.length, 0)).toBe(762)
    expect(routes.every((route) => route.waypoints.length > 0 && route.sourceUrl && route.consultedAt)).toBe(true)
  })

  it('keeps the two secondary sources and does not fabricate return directions', () => {
    expect(routes.filter((route) => route.sourceUrl.includes('covoiturage.sn'))).toHaveLength(42)
    expect(routes.filter((route) => route.sourceUrl.includes('xibaaru.sn'))).toHaveLength(20)
    expect(routes.every((route) => !('returnWaypoints' in route) && !('directions' in route))).toBe(true)
  })
})
