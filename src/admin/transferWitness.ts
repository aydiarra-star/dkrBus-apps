/** A qualified physical dossier is not yet a journey. Ask the real search to
 * ride in from the preceding call and out to the following call on this date.
 * A competing, faster path is not a witness for the path under review. */
import type { Network, Pattern, Place, Ride } from '../routing/model'
import { searchReviewedPair } from '../routing/search'
import type { PlatformObservation, TransferAssessment, TransferProof } from '../routing/transferReview'

/** Epoch seconds at the first call of each exact directional running profile. */
export type RunOrigins = readonly [incoming: number, onward: number]
export function validRunOrigins(input: unknown): input is RunOrigins {
  return Array.isArray(input) && input.length === 2 && [input[0], input[1]].every(t => Number.isSafeInteger(t) && t >= 0)
}
export function transferWitness(net: Network, assessment: TransferAssessment, proof: TransferProof, departAt: number, runOrigins?: RunOrigins) {
  if (!Number.isSafeInteger(departAt)) throw Error('Heure de départ invalide.')
  if (runOrigins !== undefined && !validRunOrigins(runOrigins)) throw Error('Deux départs datés aux origines des courses sont requis.')
  if (assessment.status !== 'qualified-for-review' || !proof.alight || !proof.board) return { status: 'BLOCKED_BEFORE_TIMETABLE' } as const
  const incoming = proof.alight, outgoing = proof.board
  const sameService = (p: Pattern | Ride, e: PlatformObservation) => p.mode === e.mode && p.lineId === e.lineId && p.direction === e.direction
  const isCall = (call: Place | undefined, end: PlatformObservation) => call?.id === end.stopId || (call?.kind === 'platform' && call.id === end.platformId)
  const section = (end: PlatformObservation, inbound: boolean) => {
    const pattern = net.patterns.find(p => sameService(p,end))
    if (!pattern) return
    const index = pattern.calls.findIndex(c => isCall(c,end))
    if (index < 0) return
    const fromIndex = inbound ? index - 1 : index, toIndex = inbound ? index : index + 1
    if (pattern.calls[fromIndex] && pattern.calls[toIndex]) return { pattern, fromIndex, toIndex }
  }
  const a = section(incoming,true), b = section(outgoing,false)
  if (!a || !b) return { status: 'NO_ADJACENT_CALL' } as const
  const query = { origin: a.pattern.stops[a.fromIndex], destination: b.pattern.stops[b.toIndex], departAt, modes: [incoming.mode,outgoing.mode], maxChanges: 1 }
  if (a.pattern === b.pattern) return { status: 'NO_DATED_WITNESS', query, reason: 'SAME_SERVICE_DIRECTION' } as const
  const r = searchReviewedPair(net,query,{ rides:[{ ...a, requiredOrigin: runOrigins?.[0] }, { ...b, requiredOrigin: runOrigins?.[1] }], alightPlatform:incoming.platformId, samePosition:proof.samePosition === true },proof.path?.wayIds ?? [])
  if (!r.ok) return { status: 'NO_DATED_WITNESS', query, reason: r.code } as const
  for (const t of r.options) {
    const rides = t.legs.filter(v => v.kind === 'ride'), walks = t.legs.filter(v => v.kind === 'walk')
    if (rides.length !== 2 || !sameService(rides[0],incoming) || !sameService(rides[1],outgoing) || rides[0].to.id !== incoming.platformId || rides[1].from.id !== outgoing.platformId) continue
    if (!isCall(rides[0].stops.at(-1),incoming) || !isCall(rides[1].stops[0],outgoing)) continue
    if (proof.samePosition ? walks.length !== 0 || rides[1].samePlatformChange?.platformId !== incoming.platformId :
      walks.length !== 1 || walks[0].role !== 'transfer' || JSON.stringify(walks[0].ways.map(w => w.id)) !== JSON.stringify(proof.path?.wayIds)) continue
    const margin = rides[1].changeBufferSeconds
    if (margin === undefined || rides[1].waitSeconds < margin) continue
    // A query on a date is not evidence of a scheduled run. A frequency or
    // a speed/dwell model can demonstrate topology, never a dated witness.
    const scheduled = rides.every(ride => ride.timing === 'timetable' && ride.timeProfile === 'offsets')
    const atOnwardPlatform = rides[0].end + t.walkSeconds
    return { status: scheduled ? 'DATED_WITNESS' : 'MODELLED_ONLY', query,
      runOrigins: [rides[0].start - a.pattern.departures[a.fromIndex], rides[1].start - b.pattern.departures[b.fromIndex]],
      measuredWalkSeconds: assessment.measuredWalkSeconds ?? null,
      initialWaitSeconds: rides[0].waitSeconds, walkMeters: t.walkMeters,
      atOnwardPlatform, minimumBufferSeconds: margin, readyAfterBuffer: atOnwardPlatform + margin,
      slackSeconds: rides[1].waitSeconds - margin, firstDeparture: rides[0].start, alightAt: rides[0].end, onwardDeparture: rides[1].start,
      arriveAt: t.end, walkSeconds: t.walkSeconds, onwardWaitSeconds: rides[1].waitSeconds, incoming: incoming.lineId, outgoing: outgoing.lineId } as const
  }
  return { status: 'NO_DATED_WITNESS', query, reason: 'REQUESTED_CHANGE_NOT_IN_RETURNED_OPTIONS' } as const
}
