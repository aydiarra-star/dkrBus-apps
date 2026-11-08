import { describe, expect, it } from 'vitest'
import { nextStopPassageCountdown } from './stopPassageCountdown'

const plan = {
  firstDeparture: '06:00',
  lastDeparture: '07:00',
  headwayMinutes: 10,
  cumulativeMinutesByStop: [0, 7, 19],
}

const at = (hours: number, minutes: number, seconds = 0) =>
  new Date(Date.UTC(2026, 10, 8, hours, minutes, seconds))

describe('nextStopPassageCountdown', () => {
  it('adds the stop-specific travel offset to each origin departure', () => {
    expect(nextStopPassageCountdown(plan, 1, at(6, 0))).toBe(7)
    expect(nextStopPassageCountdown(plan, 2, at(6, 0))).toBe(19)
  })

  it('returns the next headway slot, not a static timetable label', () => {
    expect(nextStopPassageCountdown(plan, 1, at(6, 8))).toBe(9)
    expect(nextStopPassageCountdown(plan, 1, at(6, 17, 30))).toBe(10)
  })

  it('returns zero when the estimated passage is due now', () => {
    expect(nextStopPassageCountdown(plan, 1, at(6, 7))).toBe(0)
  })

  it('returns null when no further passage exists today', () => {
    expect(nextStopPassageCountdown(plan, 0, at(7, 1))).toBeNull()
  })

  it('returns null for missing or invalid direction-specific data', () => {
    expect(nextStopPassageCountdown(null, 0, at(6, 0))).toBeNull()
    expect(nextStopPassageCountdown(plan, 9, at(6, 0))).toBeNull()
    expect(nextStopPassageCountdown({ ...plan, headwayMinutes: 0 }, 0, at(6, 0))).toBeNull()
    expect(nextStopPassageCountdown({ ...plan, cumulativeMinutesByStop: [0, -2] }, 1, at(6, 0))).toBeNull()
  })
})
