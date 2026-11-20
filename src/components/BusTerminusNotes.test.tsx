// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { BUS_BOARD_LINES } from '../domain/busBoardCatalog'
import { compileSign } from '../domain/busSignReading'
import { AftuReferenceNote } from './BusTerminusNotes'
import { BusLineScheduleBoard } from './EstimatedLineScheduleBoard'
const now = Date.parse('2026-11-19T19:00Z'), day = Date.parse('2026-11-19T00:00Z')
afterEach(cleanup)
it.each([
  ['8','05:45','20:30','06:15','21:00','22/07/2026'], ['218','05:30','19:30','07:00','20:30','25/06/2025'],
  ['227','06:00','20:30','06:00','20:30','16/05/2025'],
])('keeps each DDD %s notice on its named origin, with no implied service day', (code,a,b,c,e,date) => {
  for (const [i,d] of BUS_BOARD_LINES.ddd.find(l=>l.code === code)!.directions.entries()) {
    if (i > 1) { expect(d.sourceHours).toBeUndefined(); continue }
    const samples = d.sourceHours?.samples
    expect(samples?.map(s=>[s.ranks,s.times])).toEqual((i ? [c,e] : [a,b]).map(t=>[[1],[t]]))
    expect(samples?.every(s=>s.label.includes(date))).toBe(true)
    if (code==='227') expect(samples?.[1].label).toContain('soir')
    expect(compileSign(d,day).at(1,now)).toEqual({kind:'none',passage:{state:'unknown'}})
  }
})
it.each([[0,'Bambilor','06:30','06:35'],[1,'Maristes','06:35','06:30']] as const)('separates the 87 field reference from the index and from rank one: %d', (side,terminus,time,otherTime) => {
  const d = BUS_BOARD_LINES.aftu.find(l=>l.code==='87')!.directions[side]
  const {container,rerender} = render(<AftuReferenceNote name="AFTU 87" d={d} />)
  expect(container.querySelector('summary')?.textContent).toContain(`${terminus} : ${time}`)
  expect(container.textContent).toContain('Mosquée Massalikou Djinane'); expect(container.textContent).not.toContain(otherTime)
  expect(container.querySelector('time,[role=timer]')).toBeNull(); expect(d.sourceHours).toBeUndefined(); expect(d.clock).toBeNull()
  rerender(<AftuReferenceNote name="AFTU 87" d={{...d,points:[...d.points].reverse()}} />); expect(container.firstChild).toBeNull()
})
it('leaves both 86 origin times unknown', () => {
  for(const d of BUS_BOARD_LINES.aftu.find(l=>l.code==='86')!.directions) {
    const {container,unmount}=render(<AftuReferenceNote name="AFTU 86" d={d} />)
    expect(container.textContent).toContain('Toubab Dialaw'); expect(container.textContent).not.toMatch(/\d:\d/)
    expect(d.sourceHours).toBeUndefined(); expect(d.clock).toBeNull(); unmount()
  }
})
it.each([['6','Palais 1','07:15'],['Espace BRT','AIBD','02:30 le lendemain']])('finds the separate DDD notice by %s without adding ranks or clock', (query,to,time) => {
  const {container} = render(<BusLineScheduleBoard network="ddd" now={now} />)
  fireEvent.change(within(container).getByRole('searchbox'),{target:{value:query}})
  const note = container.querySelector('[data-line-code] details')!
  expect(note.querySelector('summary')?.textContent).toContain(to); expect(note.textContent).toContain(time)
  expect(note.querySelector('li,time,[role=timer]')).toBeNull(); expect(note.closest('.bus-occurrences')).toBeNull()
  expect(container.querySelector('.station-board-direction-toggle')?.textContent).not.toContain(time)
})
