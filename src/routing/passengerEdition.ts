import type { Dataset, Network } from './model'
import { buildNetwork } from './network'
import { DAY } from './serviceTime'

const text = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0
/** Treat an HTTP reply as untrusted. Admission is atomic: an invalid path must
 * not leave half a published interchange in the passenger graph. Local data is
 * compiled separately and never mutated. A matching snapshot/date is mandatory. */
export function admitPassengerEdition(raw: unknown, snapshot: string, day: string, base: Dataset): Network | null {
  try {
    if (!raw || typeof raw !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
    const v = raw as Record<string, unknown>, data = v.dataset as Dataset, prefix = `gtfs:${snapshot}:`
    const midnight = Date.parse(`${day}T00:00:00Z`) / 1000
    const physical = (s: string) => text(s) && (s.startsWith(`access:${snapshot}:`) || s.startsWith('landmark:'))
    if (!text(snapshot) || !Number.isFinite(midnight) || new Date(midnight * 1000).toISOString().slice(0, 10) !== day || v.version !== 1 || v.snapshot_id !== snapshot || v.date !== day || !text(v.attribution) || !data || data.graphPatterns ||
      !Array.isArray(data.places) || !Array.isArray(data.patterns) || !Array.isArray(data.footways) || !Array.isArray(data.platformBindings) ||
      data.places.length > 20000 || data.patterns.length > 2000 || data.footways.length > 20000 || data.platformBindings.length > 50000) return null
    const changes = data.samePlatformChanges === undefined ? [] : data.samePlatformChanges
    // Public editions can qualify this exception only between calls in THIS
    // snapshot. No alteration of permissions on local TER/B1 patterns.
    if (!Array.isArray(changes) || changes.length > 5000 || !changes.every(c =>
      Object.keys(c).every(k => ['platformId','alight','board','minimumSeconds','stepFree','evidence'].includes(k)) && text(c.platformId) && c.platformId.startsWith(`access:${snapshot}:`) &&
      [c.alight,c.board].every(e => Object.keys(e).every(k => ['mode','lineId','direction','stopId'].includes(k)) && text(e.lineId) && e.lineId.startsWith(prefix) && text(e.stopId) && e.stopId.startsWith(`${prefix}stop:`)))) return null
    const work = data.patterns.reduce((n, p) => n + p.shape.positions.length * p.stops.length, 0)
    if (!Number.isSafeInteger(work) || work > 2_000_000) return null
    if (!data.places.every(p => text(p.id) && text(p.name) && (p.kind === 'call' ? p.id.startsWith(`${prefix}stop:`) : physical(p.id))) ||
      !data.footways.every(w => physical(w.id) && physical(w.from) && physical(w.to) && text(w.name)) || !data.platformBindings.every(b => physical(b.platformId)) || !data.patterns.every(p =>
        text(p.name) && text(p.direction) && text(p.lineId) && p.lineId.startsWith(prefix) &&
        p.shape.source === 'REVIEWED_GTFS_SHAPE' && p.shape.sourceId.startsWith(prefix) && p.stops.every((s: string) => s.startsWith(`${prefix}stop:`)) &&
        p.service.kind === 'timetable' && p.service.departures.every((t: number) => t >= midnight && t < midnight + DAY) &&
        p.times.kind === 'offsets' && text(p.times.source) && p.service.departures.at(-1)! + p.times.departures.at(-1)! < midnight + DAY)) return null
    const net = buildNetwork({ places: [...base.places, ...data.places], patterns: [...base.patterns, ...data.patterns],
      samePlatformChanges: [...base.samePlatformChanges ?? [], ...changes], graphPatterns: base.graphPatterns, platformBindings: [...base.platformBindings ?? [], ...data.platformBindings], footways: [...base.footways, ...data.footways] })
    return net.rejected.length ? null : net
  } catch { return null }
}
