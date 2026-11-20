// @vitest-environment jsdom
import { cleanup, render, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { BUS_BOARD_LINES } from '../domain/busBoardCatalog'
import type { BusFamily } from '../domain/busPassageBoard'
import { compileSign } from '../domain/busSignReading'
import { midnight } from '../domain/stopPassageCountdown'
import { BusDirectionPanel } from './EstimatedLineScheduleBoard'

afterEach(cleanup)
function panel(family: BusFamily, code: string, i: number, iso = '2026-11-19T19:00Z', estimates = false) {
  const d = BUS_BOARD_LINES[family].find(l => l.code === code)!.directions[i]
  const now = Date.parse(iso), sign = compileSign(d, midnight(now), estimates)
  const { container } = render(<BusDirectionPanel {...{d, sign, estimates, now}} name={`${family.toUpperCase()} ${code}`} open toggle={()=>{}} id="reading" />)
  return { container, rows: container.querySelectorAll('.bus-occurrences li') }
}
it.each([
  ['ddd','6',2,'4256164-0'], ['ddd','6',3,'4256165-0'], ['ddd','23',2,'4256218-0'], ['ddd','23',3,'4256219-0'],
  ['aftu','30',0,'4256206-0'], ['aftu','66',0,'4256319-0'], ['aftu','66',1,'4256318-0'],
] as const)('opens only the matched timetable after an incomplete morning: %s %s/%d', (f,code,i,suffix) => {
  const { rows } = panel(f,code,i,undefined,true)
  for (const r of [rows[0], rows[rows.length-1]]) {
    const link = within(r as HTMLElement).getByRole('link',{name:/Consulter la fiche externe/})
    expect(link.getAttribute('href')?.endsWith(suffix)).toBe(true)
    expect(link.getAttribute('target')).toBe('_blank'); expect(link.getAttribute('rel')).toContain('noreferrer')
    expect(r.querySelector('.station-board-passage strong')?.textContent).toBe('—'); expect(r.querySelector('time')).toBeNull()
  }
})
it('offers the correct direction on a missing Saturday, not a weekday countdown', () => {
  const { rows } = panel('ddd','6',3,'2026-11-21T09:00Z')
  expect(rows[10].querySelector('a')?.href).toMatch(/4256165-0$/); expect(rows[10].textContent).toContain('Non confirmé')
})
it.each([['aftu','62',0,'18051432-1'],['aftu','62',1,'18051432-0'],['ddd','218',2,'/routes/218/']] as const)(
  'uses the existing directional route page when no grid was provided: %s %s/%d', (f,code,i,tail) => {
    const { rows } = panel(f,code,i,undefined,true)
    expect(rows[0].querySelector('a')?.href.endsWith(tail)).toBe(true); expect(rows[0].querySelector('time')).toBeNull()
  })
it.each([['tata','60',1],['aftu','87',0],['ddd','218',0],['aftu','58',0]] as const)(
  'does not offer an unrelated or generic page as a timetable: %s %s/%d', (f,code,i) => {
    const { container } = panel(f,code,i); expect(container.textContent).toContain('Pas de fiche horaire externe vérifiée')
    expect(within(container).queryByRole('link',{name:/Consulter la fiche externe/})).toBeNull()
  })
it.each([['aftu','57',0,'2026-11-19T19:00Z','min'], ['ddd','311',1,'2026-11-22T19:00Z','Pas de créneau'],
  ['aftu','30',1,'2026-11-21T23:00Z','Fin de service']] as const)('distinguishes a known state from a missing cell: %s %s/%d', (f,code,i,date,state) => {
  const { rows } = panel(f,code,i,date); expect(rows[0].textContent).toContain(state); expect(rows[0].querySelector('a')).toBeNull()
})
