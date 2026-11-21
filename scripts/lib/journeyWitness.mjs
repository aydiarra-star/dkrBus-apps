// Index results of the real whole-journey search, not mentions in replacement
// sections or maps. One ordered OD per pattern even if several options use it.
const keyOf = p => JSON.stringify([p.mode, p.lineId, p.direction])
export function journeyWitnesses() {
  const byPattern = new Map()
  function record(from, to, options) {
    const seen = new Set(), changed = new Set()
    for (const t of options) {
      const rides = t.legs.filter(l => l.kind === 'ride')
      for (const l of rides) {
        const key = keyOf(l)
        const r = byPattern.get(key) ?? { mode: l.mode, lineId: l.lineId, direction: l.direction, odPairs: 0, withChange: 0 }
        if (!seen.has(key)) { r.odPairs++; seen.add(key) }
        if (rides.length > 1 && !changed.has(key)) { r.withChange++; changed.add(key) }
        const slot = rides.length > 1 ? 'changeExample' : 'directExample'
        r[slot] ??= { from, to, start: t.start, end: t.end, legs: t.legs.map(v => ({ from: v.from.id, to: v.to.id, start: v.start, end: v.end,
          ...(v.kind === 'ride' ? { mode: v.mode, lineId: v.lineId, direction: v.direction, waitSeconds: v.waitSeconds,
            ...(v.samePlatformChange && { samePosition: v.samePlatformChange.platformId }) } : { walk: v.role, ways: v.ways.map(w => w.id) }) })) }
        byPattern.set(key, r)
      }
    }
  }
  return { record, rows: () => Array.from(byPattern.values()) }
}

/** The timetable at the ORIGIN on the query day, not a count of labels, hours
 * on a line sheet, or vehicles inferred by dividing a window by a headway. */
export function admittedServices(net, day, at) {
  return net.patterns.map(p => {
    const physical = p.calls.flatMap((c, i) => {
      const roles = ['board','alight'].filter(role => role === 'board' ? i < p.calls.length-1 : i > 0)
      return roles.every(role => c.kind === 'platform' || net.platforms.get(p)?.[role].has(i)) ? [i+1] : []
    })
    const times = p.service.kind === 'timetable' ? p.service.departures.filter(t => t >= day && t < day+86400) : null
    return { mode: p.mode, lineId: p.lineId, direction: p.direction, calls: p.calls.length, physicalCallRanks: physical,
      shapeSource: p.shape.source, shapeId: p.shape.sourceId, source: p.evidence, firstStop: p.stops[0], lastStop: p.stops.at(-1),
      service: p.service.kind, originDepartures: times?.length ?? null, nextOrigin: times?.find(t => t >= at) ?? null }
  })
}
