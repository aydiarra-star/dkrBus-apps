import test from 'node:test'
import assert from 'node:assert/strict'
import { parseMoovitTimetableHtml } from './extract_moovit_ddd_line_13_timetables.mjs'

const stopsA = Array.from({ length: 30 }, (_, index) => `Stop ${index + 1}`)
const stopsB = Array.from({ length: 30 }, (_, index) => `Return stop ${index + 1}`)

function row(values) {
  return `<tr>${values.map((value) => `<td>${value}</td>`).join('')}</tr>`
}

function fixture() {
  const times = (start) => Array.from({ length: 30 }, (_, index) => {
    const minutes = start + index
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  })
  return `<html><table>
    ${row(stopsA)}
    ${row(times(360))}
    ${row(times(380))}
  </table><table>
    ${row(stopsB)}
    ${row(times(400))}
    ${row(times(420))}
  </table></html>`
}

const source = { direction: 'fixture', url: 'https://example.invalid' }

test('extracts two 30-stop timetable sections and validates each trip', () => {
  const result = parseMoovitTimetableHtml(fixture(), source)
  assert.equal(result.schedules.length, 2)
  assert.equal(result.schedules[0].stops.length, 30)
  assert.equal(result.schedules[0].trips.length, 2)
  assert.equal(result.schedules[1].stops[0], 'Return stop 1')
  assert.equal(result.schedules.every((schedule) => schedule.validation.chronologicalAlongStops), true)
})

test('rejects a timetable row with a missing stop column', () => {
  const html = fixture().replace(row(Array.from({ length: 30 }, (_, index) => {
    const minutes = 360 + index
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  })), row(Array.from({ length: 29 }, () => '06:00')))
  assert.throws(() => parseMoovitTimetableHtml(html, source), /Expected 2 timetable sections/)
})

test('rejects non-chronological departure rows', () => {
  const html = fixture().replace('06:20', '05:59')
  assert.throws(() => parseMoovitTimetableHtml(html, source), /Invalid timetable matrix/)
})
