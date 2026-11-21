import { expect, it } from 'vitest'
import { search } from '../routing/search'
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
  const walkSeconds = 41, ready = at + 120 + walkSeconds + 180
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

it.each([['ddd','ddd'], ['aftu','aftu'], ['ddd','aftu'], ['aftu','ddd']] as const)(
  'checks this %s → %s pair and this crossing even if neither wins the passenger ranking', (incoming, outgoing) => {
    const modes = [incoming, outgoing, incoming], at = fixtureQuery.departAt
    const patterns = fixtureData.patterns.map((p, i) => {
      const network = modes[i] === 'aftu' ? 'aftu_tata' as const : 'ddd' as const
      return { ...p, network, busFamily: network === 'aftu_tata' ? 'aftu' as const : undefined, shape:{ ...p.shape, network },
        service: i === 2 ? { kind: 'timetable' as const, source:'QA direct', departures:[at+1] } : p.service }
    })
    const platforms = fixtureData.places, from = platforms.find(p => p.id === proof.alight.platformId)!, to = platforms.find(p => p.id === proof.board.platformId)!
    const shortcut = { ...fixtureData.footways[0], id:'qa-shortcut', transferTiming:{from:from.id,to:to.id,seconds:10,evidence:from.evidence}, from: from.id, to: to.id, positions:[from,to] }
    const staged = buildNetwork({ ...fixtureData, patterns, footways: [...fixtureData.footways, shortcut] })
    const pair = { ...candidate, from: { ...candidate.from, mode: incoming }, to: { ...candidate.to, mode: outgoing } }
    const observed = { ...proof, alight: { ...proof.alight, mode: incoming }, board: { ...proof.board, mode: outgoing } }
    expect(staged.rejected).toEqual([])
    const passenger = search(staged, fixtureQuery)
    expect(passenger.ok && passenger.options.map(t => t.changes)).toEqual([0])
    const review = assessTransfer(staged, pair, observed)
    expect(transferWitness(staged, review, observed, at)).toMatchObject({ status:'DATED_WITNESS', walkMeters:review.meters,
      firstDeparture:at+10, alightAt:at+120, onwardDeparture:at+600, arriveAt:at+721 })
    expect(transferWitness(staged, review, observed, at+11).status).toBe('NO_DATED_WITNESS')
    expect(transferWitness(staged, assessTransfer(staged, { ...pair, from:pair.to, to:pair.from }, observed), observed, at).status).toBe('BLOCKED_BEFORE_TIMETABLE')
  })

it('checks the requested pair of run origins, not the first or next compatible run of the same line', () => {
  const at = fixtureQuery.departAt
  const departures = [[at+10, at+50], [at+300, at+600, at+900], [at+1]]
  const staged = buildNetwork({ ...fixtureData, patterns: fixtureData.patterns.map((p,i) => ({ ...p,
    service: { kind: 'timetable', source: 'Synthetic multi-run timetable', departures: departures[i] },
  })) })
  const qualified = assessTransfer(staged, candidate, proof)
  const check = (first: number, second: number, start = at) => transferWitness(staged, qualified, proof, start, [first, second])
  expect(check(at+50,at+900)).toMatchObject({ status:'DATED_WITNESS', firstDeparture:at+50, onwardDeparture:at+900 })
  expect(check(at+50,at+300).status).toBe('NO_DATED_WITNESS') // cannot substitute +600
  expect(check(at+10,at+900,at+11).status).toBe('NO_DATED_WITNESS') // cannot substitute +50
  expect(check(at+49,at+900).status).toBe('NO_DATED_WITNESS')
  expect(check(at+50,at+900+86400).status).toBe('NO_DATED_WITNESS')
})
