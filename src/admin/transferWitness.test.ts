import { expect, it } from 'vitest'
import { transferWitness } from './transferWitness'
import { buildNetwork } from '../routing/network'
import { assessTransfer } from '../routing/transferReview'
import { fixtureNetwork as net, fixtureData, fixtureQuery, proof, candidate } from '../test/passengerTransferFixture'
it('only credits two actual rides joined by the reviewed chain on the requested day and hour', () => {
  const at = fixtureQuery.departAt, qualified = assessTransfer(net,candidate,proof)
  expect(transferWitness(net,qualified,proof,at)).toMatchObject({ status: 'DATED_WITNESS', firstDeparture: at+10, alightAt: at+120, onwardDeparture: at+600, arriveAt: at+721 })
  expect(transferWitness(net,qualified,proof,at+11)).toMatchObject({ status: 'NO_DATED_WITNESS' })
  expect(transferWitness(net,qualified,proof,at+86400)).toMatchObject({ status: 'NO_DATED_WITNESS' })
  const reversed = { ...proof, path: { ...proof.path, wayIds: [...proof.path.wayIds].reverse() } }
  expect(transferWitness(net,assessTransfer(net,candidate,reversed),reversed,at)).toEqual({ status: 'BLOCKED_BEFORE_TIMETABLE' })
})

it('rejects a departure one second short of the walking time plus the margin; equality is enough', () => {
  const at = fixtureQuery.departAt, path = assessTransfer(net, candidate, proof)
  const walkSeconds = Math.ceil(path.meters! * 60 / 80), ready = at + 120 + walkSeconds + 180
  const data = { ...fixtureData, patterns: fixtureData.patterns.map((p, i) => i !== 1 ? p : {
    ...p, service: { kind: 'timetable' as const, source: 'fixture', departures: [ready - 1, ready, ready + 61] },
  }) }
  const aligned = buildNetwork(data)
  expect(transferWitness(aligned, assessTransfer(aligned, candidate, proof), proof, at)).toMatchObject({
    status: 'DATED_WITNESS', initialWaitSeconds: 10, firstDeparture: at + 10, alightAt: at + 120,
    walkMeters: path.meters, walkSeconds, atOnwardPlatform: ready - 180, minimumBufferSeconds: 180,
    readyAfterBuffer: ready, onwardDeparture: ready, onwardWaitSeconds: 180, slackSeconds: 0, arriveAt: ready + 121,
  })
})

it.each(['frequency', 'running time'] as const)('does not certify a dated connection from a model of %s', model => {
  const staged = buildNetwork({ ...fixtureData, patterns: fixtureData.patterns.map((p, i) => i ? p : model === 'frequency'
    ? { ...p, service: { kind: 'frequency', source: 'fixture', windows: [{ start: 28810, end: 28900, every: 60, weekdays: [3], holidays: 'include' }] } }
    : { ...p, times: { kind: 'model', speedKph: 18, dwellSeconds: 30, source: 'fixture' } }) })
  expect(staged.rejected).toEqual([])
  expect(transferWitness(staged, assessTransfer(staged, candidate, proof), proof, fixtureQuery.departAt)).toMatchObject({
    status: 'MODELLED_ONLY', minimumBufferSeconds: 180,
  })
})
