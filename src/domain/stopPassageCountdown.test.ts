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
    expect(nextTimetableStopPassageCountdown(grid, 2, at(6, 21))).toBe(26)
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


describe('ligne 13 DDD — contrôle des grilles Moovit à 30 arrêts', () => {
  // Extraits fidèles des premières lignes visibles sur les pages horaires,
  // conservés ici comme tests de parsing, pas comme grille exhaustive.
  const liberte5ToPalais = [
    '06:30','06:30','06:32','06:33','06:33','06:34','06:35','06:35','06:37','06:37',
    '06:38','06:39','06:40','06:41','06:42','06:43','06:44','06:45','06:46','06:47',
    '06:48','06:48','06:49','06:49','06:50','06:51','06:52','06:53','06:54','06:55',
  ]
  const liberte5ToPalaisWeekday = [
    '06:00','06:00','06:02','06:03','06:03','06:04','06:05','06:05','06:07','06:07',
    '06:08','06:09','06:10','06:11','06:12','06:13','06:14','06:15','06:16','06:17',
    '06:18','06:18','06:19','06:19','06:20','06:21','06:22','06:23','06:24','06:25',
  ]
  const palaisToLiberte5 = [
    '07:00','07:00','07:02','07:04','07:04','07:06','07:06','07:07','07:08','07:09',
    '07:10','07:11','07:12','07:14','07:16','07:18','07:19','07:20','07:21','07:22',
    '07:23','07:24','07:25','07:26','07:27','07:28','07:29','07:30','07:31','07:32',
  ]

  it('lit les heures aux deux terminus et aux arrêts intermédiaires sur 30 colonnes', () => {
    expect(liberte5ToPalais).toHaveLength(30)
    expect(palaisToLiberte5).toHaveLength(30)
    expect(nextTimetableStopPassageCountdown([liberte5ToPalais], 0, at(6, 29))).toBe(1)
    expect(nextTimetableStopPassageCountdown([liberte5ToPalais], 29, at(6, 29))).toBe(26)
    expect(nextTimetableStopPassageCountdown([palaisToLiberte5], 0, at(6, 59))).toBe(1)
    expect(nextTimetableStopPassageCountdown([palaisToLiberte5], 29, at(6, 59))).toBe(33)
  })

  const palaisToLiberte5Weekday = [
    '06:45','06:45','06:46','06:48','06:48','06:49','06:50','06:50','06:51','06:52',
    '06:53','06:53','06:54','06:56','06:57','06:59','06:59','07:00','07:01','07:02',
    '07:03','07:04','07:05','07:07','07:07','07:08','07:09','07:11','07:11','07:13',
  ]

  it('contrôle aussi la première ligne semaine publiée dans le sens Liberté 5 → Palais', () => {
    expect(liberte5ToPalaisWeekday).toHaveLength(30)
    expect(nextTimetableStopPassageCountdown([liberte5ToPalaisWeekday], 0, at(5, 59))).toBe(1)
    expect(nextTimetableStopPassageCountdown([liberte5ToPalaisWeekday], 29, at(5, 59))).toBe(26)
  })

  it('contrôle la première ligne semaine publiée dans le sens Palais → Liberté 5', () => {
    expect(palaisToLiberte5Weekday).toHaveLength(30)
    expect(nextTimetableStopPassageCountdown([palaisToLiberte5Weekday], 0, at(6, 44))).toBe(1)
    expect(nextTimetableStopPassageCountdown([palaisToLiberte5Weekday], 29, at(6, 44))).toBe(29)
  })

  it('ne mélange pas les deux sens et refuse un arrêt hors grille', () => {
    expect(nextTimetableStopPassageCountdown([liberte5ToPalais], 29, at(6, 29))).not.toBe(
      nextTimetableStopPassageCountdown([palaisToLiberte5], 29, at(6, 59)),
    )
    expect(nextTimetableStopPassageCountdown([liberte5ToPalais], 30, at(6, 29))).toBeNull()
  })
describe('ligne 7 DDD — contrôle des premières grilles Moovit à chaque arrêt', () => {
  const garePalaisToOuakam = [
    '05:00','05:00','05:01','05:03','05:04','05:05','05:07','05:09','05:10','05:11',
    '05:11','05:13','05:15','05:16','05:17','05:18','05:18','05:19','05:21','05:22',
    '05:23','05:25','05:26','05:26','05:27','05:28','05:29','05:29','05:30',
  ]
  const ouakamToGarePalais = [
    '04:00','04:00','04:00','04:01','04:02','04:02','04:03','04:04','04:06','04:07',
    '04:08','04:09','04:10','04:11','04:12','04:13','04:15','04:17','04:17','04:19',
    '04:21','04:22','04:23','04:24','04:25','04:26','04:27',
  ]

  it('vérifie les 29 colonnes du sens Gare Palais → Ouakam', () => {
    expect(garePalaisToOuakam).toHaveLength(29)
    expect(nextTimetableStopPassageCountdown([garePalaisToOuakam], 0, at(4, 59))).toBe(1)
    expect(nextTimetableStopPassageCountdown([garePalaisToOuakam], 28, at(4, 59))).toBe(31)
  })

  it('vérifie les 27 colonnes du sens Ouakam → Gare Palais', () => {
    expect(ouakamToGarePalais).toHaveLength(27)
    expect(nextTimetableStopPassageCountdown([ouakamToGarePalais], 0, at(3, 59))).toBe(1)
    expect(nextTimetableStopPassageCountdown([ouakamToGarePalais], 26, at(3, 59))).toBe(28)
  })
})

})
