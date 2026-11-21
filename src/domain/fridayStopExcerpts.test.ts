import { expect, it } from 'vitest'
import excerpts from '../../data/bus-review/friday-stop-excerpts.json'
import { BUS_BOARD_LINES } from './busBoardCatalog'
import { gridAt, hhmm } from './busSourceHours'
import { clockMinutes } from './stopPassageCountdown'

// Compare the printed grids, *not* walking times or vehicle observations.
// The same publisher groups two movements on one stop page and puts their
// returns on another. A matching minute is not a dated transfer permission.
for (const page of excerpts.sheets) for (const row of page.rows) {
  it(`${row.panel} r${row.rank} : premiers passages du vendredi vers ${row.direction} (${page.url.match(/stop_(\d+)/)?.[1]})`, () => {
    const [key,variant] = row.panel.split('/')
    const line = Object.values(BUS_BOARD_LINES).flat().find(l => l.key === key)!
    const d = line.directions[Number(variant)-1], h = d.sourceHours!
    expect(h.source).toBe(row.timetable)
    expect(h.printedLabels?.[row.rank] ?? d.points[row.rank-1]).toBe(page.label)
    const g = gridAt(h,Date.parse('2026-11-20T00:00:00Z'))!, i = g.ranks.indexOf(row.rank)
    expect(i).toBeGreaterThanOrEqual(0)
    const times = g.profiles.flatMap(p => p.origins.map(t => clockMinutes(t)! + p.elapsed[i]))
    expect(times.sort((a,b) => a-b).slice(0,row.firstTimes.length).map(hhmm)).toEqual(row.firstTimes)
  })
}
