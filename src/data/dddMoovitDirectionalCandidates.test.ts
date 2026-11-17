import { describe, expect, it } from 'vitest'
import {
  DDD_MOOVIT_DIRECTIONAL_CANDIDATES,
  DDD_MOOVIT_DIRECTIONAL_CANDIDATE_RETRIEVED_ON,
} from './dddMoovitDirectionalCandidates'

describe('recent Moovit DDD directional candidates', () => {
  it('records two independently sourced directions for lines 7 and 13', () => {
    expect(DDD_MOOVIT_DIRECTIONAL_CANDIDATES).toHaveLength(4)
    for (const line of ['7', '13']) {
      const directions = DDD_MOOVIT_DIRECTIONAL_CANDIDATES.filter((item) => item.line === line)
      expect(directions).toHaveLength(2)
      expect(new Set(directions.map((item) => item.direction)).size).toBe(2)
    }
  })

  it('preserves source dates, endpoint labels and occurrence counts without activating candidates', () => {
    expect(DDD_MOOVIT_DIRECTIONAL_CANDIDATE_RETRIEVED_ON).toBe('2026-11-17')
    expect(DDD_MOOVIT_DIRECTIONAL_CANDIDATES.map((item) => item.occurrenceCount)).toEqual([29, 27, 30, 30])
    expect(DDD_MOOVIT_DIRECTIONAL_CANDIDATES.map((item) => item.publishedJourneyDurationMinutes)).toEqual([35, 34, 30, 30])
    expect(DDD_MOOVIT_DIRECTIONAL_CANDIDATES.every(
      (item) => item.status === 'SECONDARY_SOURCE_NEEDS_RECONCILIATION' && item.sourceUrl.startsWith('https://'),
    )).toBe(true)
    expect(DDD_MOOVIT_DIRECTIONAL_CANDIDATES[0].sourceUpdatedOn).toBe('2026-11-07')
    expect(DDD_MOOVIT_DIRECTIONAL_CANDIDATES[1].sourceUpdatedOn).toBe('2026-11-14')
  })

  it('preserves each sourced stop occurrence in its published direction order', () => {
    for (const candidate of DDD_MOOVIT_DIRECTIONAL_CANDIDATES) {
      expect(candidate.stops).toHaveLength(candidate.occurrenceCount)
      expect(candidate.stops[0]).toBe(candidate.from)
      expect(candidate.stops.at(-1)).toBe(candidate.to)
    }
    const line7Out = DDD_MOOVIT_DIRECTIONAL_CANDIDATES.find(
      (item) => item.line === '7' && item.direction === 'to_ouakam',
    )
    const line7Back = DDD_MOOVIT_DIRECTIONAL_CANDIDATES.find(
      (item) => item.line === '7' && item.direction === 'to_palais',
    )
    expect(line7Out?.stops).not.toEqual(line7Back?.stops)
  })

  it('links both DDD 13 directions to stop-by-stop timetable sources', () => {
    const line13 = DDD_MOOVIT_DIRECTIONAL_CANDIDATES.filter((item) => item.line === '13')
    expect(line13).toHaveLength(2)
    expect(line13.every((item) =>
      'timetableUrl' in item &&
      item.timetableUrl.startsWith('https://moovitapp.com/') &&
      item.timetableCoverage === 'STOP_BY_STOP_WEEKDAY_AND_SATURDAY',
    )).toBe(true)
  })
})
