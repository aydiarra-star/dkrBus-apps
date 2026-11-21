import { expect, it } from 'vitest'
import { inspectReportedRun, type ReportedRun } from './reportedRunReview'
import packet from '../../data/bus-review/reported-218-73.json'
import { BUS_BOARD_LINES } from '../domain/busBoardCatalog'

it('retains four references and the unresolved text, not four stop tables or a service calendar', () => {
  expect(packet).toMatchObject({ scope: 'REPORTED_REFERENCES_ONLY', primaryDocument: null, serviceDate: null,
    dayType: null, validityPeriod: null, officialStatus: null })
  expect(packet.lines.map(l => [l.family, l.code, l.announcedHeadwayMinutes, l.otherStartMention])).toEqual([
    ['ddd','218',16,null], ['aftu','73',10,'05:30'],
  ])
  const endpoints = [['Poste Thiaroye', 'terminus 7218/219'], ['Station Ciel Oil/Thiaroye', 'terminus de la ligne 73 à Niague']]
  for (const [i, l] of packet.lines.entries()) {
    const [a, b] = endpoints[i]
    expect(l.directions.map(d => [d.from, d.to])).toEqual([[a,b], [b,a]])
    for (const d of l.directions) {
      expect(d.referenceDeparture).toBe(i ? '05:31' : '05:28'); expect(d.calls).toBeNull()
      expect(inspectReportedRun(d)).toMatchObject({ durationMinutes: null, issues: ['Tableau des arrêts non reçu.'] })
    }
  }
  expect(Object.values(BUS_BOARD_LINES).flat().flatMap(l => l.directions).some(d => d.source === packet.summaryUrl)).toBe(false)
})
const example: ReportedRun = { from: 'A', to: 'Z', referenceDeparture: '23:59', calls: [
  { rank:1, stop:'A', time:'23:59' }, { rank:2, stop:'A', time:'23:59' },
  { rank:3, stop:'A bis', time:'00:01', dayOffset:1 }, { rank:4, stop:'Z', time:'00:12', dayOffset:1 },
] } // fictitious transcription, not the missing tables
it('preserves simultaneous and similarly named occurrences; accepts only an explicit next day', () => {
  expect(inspectReportedRun(example)).toEqual({ durationMinutes:13, issues:[], repeatedLabels:[['A',[1,2]]] })
  expect(inspectReportedRun({ ...example, calls: example.calls!.map(c => ({ ...c, dayOffset:0 })) }).durationMinutes).toBeNull()
})
it.each(['rank','time','direction','missing','phase'] as const)('reports %s without sorting, reversing or repairing the source', problem => {
  const run = { ...example, calls: example.calls!.map(c => ({ ...c })) }
  if (problem === 'rank') run.calls[1].rank = 1
  if (problem === 'time') run.calls[3].time = '00:60'
  if (problem === 'direction') run.calls.reverse()
  if (problem === 'missing') run.calls.pop()
  if (problem === 'phase') run.referenceDeparture = '23:58'
  const copy = structuredClone(run), r = inspectReportedRun(run)
  expect(r.issues.length).toBeGreaterThan(0); expect(r.durationMinutes).toBeNull(); expect(run).toEqual(copy)
})
