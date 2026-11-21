import { reviewed } from './geometry'
import type { CallRef, Network, OnwardBoarding, Pattern, SamePlatformChange } from './model'

/** Compile exact directed permissions, not all combinations at a shared ID.
 * A logical call, a second platform at identical XY or a modelled headway
 * cannot certify a same-position change between two timed runs. */
export function compileSamePlatformChanges(patterns: readonly Pattern[], platforms: Network['platforms'],
  proofs: readonly SamePlatformChange[], rejected: string[]): Network['samePlatform'] {
  const result = new Map<Pattern, Map<number, OnwardBoarding[]>>()
  const identity = (mode: string, lineId: string, direction: string) => JSON.stringify([mode, lineId, direction])
  const byKey = new Map(patterns.map(p => [identity(p.mode, p.lineId, p.direction), p]))
  const resolve = (r: CallRef, role: 'alight' | 'board', platformId: string) => {
    const p = byKey.get(identity(r.mode, r.lineId, r.direction))
    if (!p || p.service.kind !== 'timetable' || p.times.kind !== 'offsets') return
    const i = p.stops.indexOf(r.stopId)
    if (i < 0 || (role === 'board' ? i === p.stops.length - 1 : i === 0)) return
    const place = platforms.get(p)?.[role].get(i)?.place
    if (place?.kind === 'platform' && place.id === platformId) return { pattern: p, index: i }
  }
  const endKey = (r: CallRef) => [r.mode,r.lineId,r.direction,r.stopId]
  const keys = proofs.map(p => JSON.stringify([endKey(p.alight),endKey(p.board)]))
  const seen = new Set<string>(), ambiguous = new Set<string>()
  for (const k of keys) { if (seen.has(k)) ambiguous.add(k); seen.add(k) }
  for (const [i, proof] of proofs.entries()) {
    const from = resolve(proof.alight, 'alight', proof.platformId), to = resolve(proof.board, 'board', proof.platformId)
    if (!from || !to || from.pattern === to.pattern || ambiguous.has(keys[i]) || !reviewed(proof.evidence) ||
        !Number.isSafeInteger(proof.minimumSeconds) || proof.minimumSeconds <= 0 || proof.minimumSeconds >= 86400 ||
        !['yes','no','unknown'].includes(proof.stepFree)) {
      rejected.push(`same-platform:${keys[i]}`); continue
    }
    const calls = result.get(from.pattern) ?? new Map<number, OnwardBoarding[]>()
    const onward = calls.get(from.index) ?? []; onward.push({ ...to, proof }); calls.set(from.index, onward)
    result.set(from.pattern, calls)
  }
  return result
}
