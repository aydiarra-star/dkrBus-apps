import { expect, it } from 'vitest'
import { transferWitness } from './transferWitness'
import { assessTransfer } from '../routing/transferReview'
import { fixtureNetwork as net, fixtureQuery, proof, candidate } from '../test/passengerTransferFixture'
it('only credits two actual rides joined by the reviewed chain on the requested day and hour', () => {
  const at = fixtureQuery.departAt, qualified = assessTransfer(net,candidate,proof)
  expect(transferWitness(net,qualified,proof,at)).toMatchObject({ status: 'DATED_WITNESS', firstDeparture: at+10, alightAt: at+120, onwardDeparture: at+600, arriveAt: at+721 })
  expect(transferWitness(net,qualified,proof,at+11)).toMatchObject({ status: 'NO_DATED_WITNESS' })
  expect(transferWitness(net,qualified,proof,at+86400)).toMatchObject({ status: 'NO_DATED_WITNESS' })
  const reversed = { ...proof, path: { ...proof.path, wayIds: [...proof.path.wayIds].reverse() } }
  expect(transferWitness(net,assessTransfer(net,candidate,reversed),reversed,at)).toEqual({ status: 'BLOCKED_BEFORE_TIMETABLE' })
})
