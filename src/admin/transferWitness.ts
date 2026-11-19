/** A qualified physical dossier is not yet a journey. Ask the real search to
 * ride in from the preceding call and out to the following call on this date.
 * A competing, faster path is not a witness for the path under review. */
import type { Network, Pattern, Ride } from '../routing/model'
import { search } from '../routing/search'
import type { PlatformObservation, TransferAssessment, TransferProof } from '../routing/transferReview'

export function transferWitness(net: Network, assessment: TransferAssessment, proof: TransferProof, departAt: number) {
  if (!Number.isSafeInteger(departAt)) throw Error('Heure de départ invalide.')
  if (assessment.status !== 'qualified-for-review' || !proof.alight || !proof.board) return { status: 'BLOCKED_BEFORE_TIMETABLE' } as const
  const incoming = proof.alight, outgoing = proof.board
  const sameService = (p: Pattern | Ride, e: PlatformObservation) => p.mode === e.mode && p.lineId === e.lineId && p.direction === e.direction
  const adjacent = (end: PlatformObservation, step: number) => {
    const p = net.patterns.find(p => sameService(p,end))
    if (!p) return
    const index = p.calls.findIndex(c => c.id === end.stopId || (c.kind === 'platform' && c.id === end.platformId))
    return index >= 0 ? p.calls[index+step] : undefined
  }
  const a = adjacent(incoming,-1), b = adjacent(outgoing,1)
  if (!a || !b) return { status: 'NO_ADJACENT_CALL' } as const
  const query = { origin: a.id, destination: b.id, departAt, modes: [incoming.mode,outgoing.mode], maxChanges: 1 }
  const r = search(net,query)
  if (!r.ok) return { status: 'NO_DATED_WITNESS', query, reason: r.code } as const
  for (const t of r.options) {
    const rides = t.legs.filter(v => v.kind === 'ride'), walks = t.legs.filter(v => v.kind === 'walk')
    if (rides.length !== 2 || !sameService(rides[0],incoming) || !sameService(rides[1],outgoing) || rides[0].to.id !== incoming.platformId || rides[1].from.id !== outgoing.platformId) continue
    if (proof.samePosition ? walks.length !== 0 || rides[1].samePlatformChange?.platformId !== incoming.platformId :
      walks.length !== 1 || walks[0].role !== 'transfer' || JSON.stringify(walks[0].ways.map(w => w.id)) !== JSON.stringify(proof.path?.wayIds)) continue
    return { status: 'DATED_WITNESS', query, firstDeparture: rides[0].start, alightAt: rides[0].end, onwardDeparture: rides[1].start,
      arriveAt: t.end, walkSeconds: t.walkSeconds, onwardWaitSeconds: rides[1].waitSeconds, incoming: incoming.lineId, outgoing: outgoing.lineId } as const
  }
  return { status: 'NO_DATED_WITNESS', query, reason: 'REQUESTED_CHANGE_NOT_IN_RETURNED_OPTIONS' } as const
}
