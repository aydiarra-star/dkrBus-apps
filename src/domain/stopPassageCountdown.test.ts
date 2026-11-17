import { describe, expect, it } from 'vitest'
import { nextStopPassageCountdown, nextTimetableStopPassageCountdown } from './stopPassageCountdown'

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

  it('supports the empirical AFTU/TATA headway of 11.6 minutes', () => {
    const fractionalPlan = { ...plan, headwayMinutes: 11.6 }
    expect(nextStopPassageCountdown(fractionalPlan, 1, at(6, 8, 30))).toBe(11)
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
    expect(nextStopPassageCountdown({ ...plan, headwayMinutes: Number.POSITIVE_INFINITY }, 0, at(6, 0))).toBeNull()
    expect(nextStopPassageCountdown({ ...plan, cumulativeMinutesByStop: [0, -2] }, 1, at(6, 0))).toBeNull()
    expect(nextStopPassageCountdown({ ...plan, cumulativeMinutesByStop: [0, 19, 7] }, 1, at(6, 0))).toBeNull()
    expect(nextStopPassageCountdown({ ...plan, cumulativeMinutesByStop: [0, Number.NaN, 19] }, 1, at(6, 0))).toBeNull()
    expect(nextStopPassageCountdown(plan, 1, new Date(Number.NaN))).toBeNull()
  })
})


describe('nextTimetableStopPassageCountdown', () => {
  const grid = [
    ['06:00', '06:02', '06:05'],
    ['06:15', '06:17', '06:20'],
    ['06:42', '06:44', '06:47'],
  ]

  it('uses the actual next time for the selected stop, including irregular gaps', () => {
    expect(nextTimetableStopPassageCountdown(grid, 1, at(6, 18))).toBe(26)
    expect(nextTimetableStopPassageCountdown(grid, 2, at(6, 20))).toBe(27)
  })

  it('returns zero for a passage due now and null after the final passage', () => {
    expect(nextTimetableStopPassageCountdown(grid, 1, at(6, 17))).toBe(0)
    expect(nextTimetableStopPassageCountdown(grid, 1, at(6, 45))).toBeNull()
  })

  it('rejects incomplete, malformed, or non-chronological grids', () => {
    expect(nextTimetableStopPassageCountdown([], 0, at(6, 0))).toBeNull()
    expect(nextTimetableStopPassageCountdown([['06:00'], ['06:10', '06:12']], 0, at(6, 0))).toBeNull()
    expect(nextTimetableStopPassageCountdown([['06:00', 'bad']], 1, at(6, 0))).toBeNull()
    expect(nextTimetableStopPassageCountdown([['06:10'], ['06:00']], 0, at(6, 0))).toBeNull()
    expect(nextTimetableStopPassageCountdown(grid, 4, at(6, 0))).toBeNull()
  })
})
