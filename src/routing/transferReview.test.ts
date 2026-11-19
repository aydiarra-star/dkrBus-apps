import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { dakarTransferReport, reviewDakarPacket } from '../admin/dakarTransferDossiers'
import { candidate, fixtureData, fixtureNetwork, fixtureQuery, proof } from '../test/passengerTransferFixture'
import { dakarNetwork } from './dakar'
import { buildNetwork } from './network'
import { search } from './search'
import { assessTransfer, type ReviewCode, type TransferProof } from './transferReview'

describe('qualification hors graphe, direction par direction', () => {
  it('measures only a documented chain of admitted directed ways between the actual serviced platforms', () => {
    const r = assessTransfer(fixtureNetwork, candidate, proof)
    const expected = search(fixtureNetwork, fixtureQuery)
    if (!expected.ok) throw Error(expected.message)
    const walk = expected.options[0].legs.find(l => l.kind === 'walk')!
    expect(r).toEqual({ status: 'qualified-for-review', findings: [], meters: walk.meters, walkStepFree: 'yes' })
    // A review is not a timetable: a qualified path cannot catch a missed departure.
    expect(search(fixtureNetwork, { ...fixtureQuery, modes: ['ter', 'brt'], transferBufferSeconds: 600 })).toMatchObject({ code: 'NO_SERVICE' })
    expect(assessTransfer(fixtureNetwork, { ...candidate, from: candidate.to, to: candidate.from }, proof).status).toBe('blocked')
  })
  it.each<[string, TransferProof, ReviewCode]>([
    ['centroid / absent binding', { ...proof, board: undefined }, 'BOARD_PLATFORM'],
    ['other network', { ...proof, board: { ...proof.board, mode: 'ddd' } }, 'BOARD_PLATFORM'],
    ['other documentary stop', { ...proof, board: { ...proof.board, stopId: 'another-stop' } }, 'BOARD_PLATFORM'],
    ['other pattern direction', { ...proof, board: { ...proof.board, direction: 'return' } }, 'BOARD_DIRECTION'],
    ['alighting at first call', { ...proof, alight: { ...proof.alight, platformId: 'qa-A' } }, 'ALIGHT_DIRECTION'],
    ['boarding at last call', { ...proof, board: { ...proof.board, platformId: 'qa-D' } }, 'BOARD_DIRECTION'],
    ['unreviewed platform', { ...proof, alight: { ...proof.alight, evidence: { ...proof.alight.evidence, status: 'candidate' } } }, 'ALIGHT_PLATFORM'],
    ['no reviewed way list', { ...proof, path: { ...proof.path, wayIds: [] } }, 'PATH_EVIDENCE'],
    ['unreviewed whole path', { ...proof, path: { ...proof.path, evidence: { ...proof.path.evidence, date: '2026-02-30' } } }, 'PATH_EVIDENCE'],
    ['ways out of order', { ...proof, path: { ...proof.path, wayIds: [...proof.path.wayIds].reverse() } }, 'DIRECTED_CHAIN'],
    ['partial path', { ...proof, path: { ...proof.path, wayIds: proof.path.wayIds.slice(0, -1) } }, 'DIRECTED_CHAIN'],
    ['between sites relabelled internal', { ...proof, path: { ...proof.path, scope: 'internal' } }, 'PUBLIC_GATES'],
    ['unidentified gates', { ...proof, path: { ...proof.path, gates: undefined } }, 'PUBLIC_GATES'],
    ['gates in reverse order', { ...proof, path: { ...proof.path, gates: [proof.path.gates[1], proof.path.gates[0]] } }, 'PUBLIC_GATES'],
  ])('blocks %s without publishing a distance or time', (_name, evidence, code) => {
    const r = assessTransfer(fixtureNetwork, candidate, evidence)
    expect(r).toMatchObject({ status: 'blocked', meters: null, walkStepFree: null })
    expect(r.findings.map(f => f.code)).toContain(code)
  })
  it('does not reinstate a crossing rejected at graph admission', () => {
    const net = buildNetwork({ ...fixtureData, footways: fixtureData.footways.map(w => w.kind === 'crossing' ? { ...w, crossingsAndBarriersChecked: false } : w) })
    expect(assessTransfer(net, candidate, proof).findings.map(f => f.code)).toEqual(expect.arrayContaining(['GRAPH_ADMISSION', 'DIRECTED_CHAIN']))
  })
})

it('keeps the actual Dakar dossiers documentary, including co-located labels, without adding any edge', () => {
  const report = dakarTransferReport(dakarNetwork)
  expect(report).toHaveLength(16)
  expect(new Set(report.map(r => `${r.from.stopId}/${r.to.stopId}`)).size).toBe(report.length)
  for (const r of report) {
    expect(r.status).toBe('blocked'); expect(r.meters).toBeNull()
    expect(r.findings.map(f => f.code)).toEqual(expect.arrayContaining(['ALIGHT_PLATFORM', 'BOARD_PLATFORM', 'PATH_EVIDENCE']))
    expect(r.sources.filter(s => s.startsWith('docs/')).every(s => existsSync(s))).toBe(true)
    expect(search(dakarNetwork, { ...fixtureQuery, origin: r.from.stopId, destination: r.to.stopId }).ok).toBe(false)
  }
  const pair = report.find(r => r.from.stopId === 'ter-dakar' && r.to.stopId === 'brt-petersen')!
  expect(pair.findings.map(f => f.code)).toEqual(expect.arrayContaining(['ALIGHT_DIRECTION','PUBLIC_GATES']))
  expect(pair.findings.map(f => f.code)).not.toContain('BOARD_DIRECTION') // the partial 19961993 now boards at Petersen, not a walk from TER
  const opposite = report.find(r => r.to.stopId === 'ter-dakar' && r.from.stopId === 'brt-petersen')!
  expect(opposite.findings.map(f => f.code)).not.toContain('ALIGHT_DIRECTION')
  expect(opposite.findings.map(f => f.code)).not.toContain('BOARD_DIRECTION')
  expect(dakarNetwork.walking.size).toBe(0)
})


it('reviews one staging envelope in one direction only, without changing the Dakar inventory', () => {
  const packet = { dossier: 'petersen-brt-ddd', fromStopId: 'brt-petersen', toStopId: 'ddd-petersen',
    dataset: { places: [], patterns: [], footways: [] }, proof: {} }
  const original = dakarTransferReport(dakarNetwork)
  expect(reviewDakarPacket(packet)).toMatchObject({ dossier: packet.dossier, status: 'blocked', meters: null, rejected: [] })
  expect(reviewDakarPacket({ ...packet, fromStopId: packet.toStopId, toStopId: packet.fromStopId }).from.mode).toBe('ddd')
  expect(() => reviewDakarPacket({ ...packet, fromStopId: 'ter-colobane' })).toThrow(/couple ordonné/)
  expect(dakarTransferReport(dakarNetwork)).toEqual(original)
})
