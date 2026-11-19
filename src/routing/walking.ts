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
