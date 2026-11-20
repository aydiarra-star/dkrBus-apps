import type { Footway, Network, Walk } from './model'

interface Entry { id: string; meters: number }
/** Binary min-heap; stale entries are discarded when popped (no decrease-key). */
class Queue {
  private items: Entry[] = []
  push(entry: Entry) {
    let i = this.items.length
    this.items.push(entry)
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.items[parent].meters <= entry.meters) break
      this.items[i] = this.items[parent]; i = parent
    }
    this.items[i] = entry
  }
  pop(): Entry | undefined {
    const top = this.items[0], end = this.items.pop()
    if (!end || !this.items.length) return top
    let i = 0
    while (i * 2 + 1 < this.items.length) {
      let k = i * 2 + 1
      if (k + 1 < this.items.length && this.items[k + 1].meters < this.items[k].meters) k++
      if (this.items[k].meters >= end.meters) break
      this.items[i] = this.items[k]; i = k
    }
    this.items[i] = end
    return top
  }
}

/** Bounded directed Dijkstra on reviewed pedestrian ways only. No reverse
 * edges, coordinate lookup, station-parent links or zero-cost transfers. */
export function walkingTree(net: Network, origin: string, budgetM: number, stepFreeOnly: boolean, role: Walk['role']) {
  const distances = new Map<string, number>([[origin, 0]])
  const previous = new Map<string, Footway>()
  const queue = new Queue()
  queue.push({ id: origin, meters: 0 })
  for (let item = queue.pop(); item; item = queue.pop()) {
    if (item.meters !== distances.get(item.id)) continue
    for (const edge of net.walking.get(item.id) ?? []) {
      if ((edge.onlyFor && edge.onlyFor !== role) || (stepFreeOnly && edge.stepFree !== 'yes')) continue
      const meters = item.meters + edge.meters
      if (meters > budgetM || meters >= (distances.get(edge.to) ?? Infinity)) continue
      distances.set(edge.to, meters); previous.set(edge.to, edge); queue.push({ id: edge.to, meters })
    }
  }
  function pathTo(target: string): Footway[] {
    const path: Footway[] = []
    for (let edge = previous.get(target); edge; edge = previous.get(edge.from)) path.push(edge)
    return path.reverse()
  }
  return { distances, pathTo }
}

/** Transfer only. A shorter crossing may take longer at a signal. Retain
 * nondominated (metres, measured seconds) paths within the walking budget;
 * do not let an unmeasured shortcut hide a measured route. Both costs are
 * positive, so a cycle back to the same point is always dominated. */
export function timedWalks(net: Network, start: string, budgetM: number, stepFree: boolean, speedMpm: number) {
  interface Label { to: string; meters: number; seconds: number; via?: Footway; previous?: Label }
  const seed: Label = { to: start, meters: 0, seconds: 0 }
  const queue = [seed], frontier = new Map<string, Label[]>([[start, [seed]]])
  // Multi-criterion walks can have exponentially many alternatives. Refuse
  // this transfer search rather than freeze a phone or return a partial tree.
  let budget = 150_000
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]
    if (!frontier.get(p.to)?.includes(p)) continue
    for (const w of net.walking.get(p.to) ?? []) {
      if (w.onlyFor || !w.transferTiming || (stepFree && w.stepFree !== 'yes')) continue
      const prev = frontier.get(w.to) ?? []
      budget -= 1 + prev.length
      if (budget < 0) return []
      const meters = p.meters + w.meters
      const seconds = p.seconds + Math.max(w.transferTiming.seconds, Math.ceil(w.meters * 60 / speedMpm))
      if (meters > budgetM || prev.some(q => q.meters <= meters && q.seconds <= seconds)) continue
      const q = { to: w.to, meters, seconds, previous: p, via: w }
      frontier.set(w.to, [...prev.filter(x => x.meters < meters || x.seconds < seconds), q]); queue.push(q)
    }
  }
  frontier.delete(start)
  return [...frontier.values()].flat().filter(q => net.boarding.has(q.to)).map(q => {
    const ways: Footway[] = []
    for (let p = q; p.via && p.previous; p = p.previous) ways.push(p.via)
    return { to: q.to, seconds: q.seconds, meters: q.meters, ways: ways.reverse() }
  })
}
