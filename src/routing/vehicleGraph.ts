import { shortestRoadGraphPath, type RoadGraphEdge, type RoadPoint } from '../domain/roadNetworkRouting'
import { concatenate, reviewed, samePoint, shapeLength } from './geometry'
import type { GraphPatternInput, PatternInput, Section } from './model'

/** Normalize a service supplied as reviewed directed road/rail ways rather
 * than a LineString. Only members evidenced for THIS consecutive call pair
 * enter Dijkstra. No nearest road/node, city-wide shortcut, bridging or
 * geometric reversal. If a branch is ambiguous, the pattern is not admitted. */
export function patternFromWays(input: GraphPatternInput): { pattern: PatternInput; sections: Section[] } | null {
  const { geometry, sections, ...pattern } = input
  if (!reviewed(pattern.evidence) || sections.length === 0 || sections.length !== pattern.stops.length - 1) return null
  const mode = pattern.network === 'ter' ? 'rail' : 'bus'
  const anchors = new Map<string, RoadPoint>()
  const parts: Section[] = []
  function matches(id: string, position: RoadPoint) {
    if (!id) return false
    const other = anchors.get(id)
    if (other) return samePoint(other, position)
    anchors.set(id, position)
    return true
  }
  for (const [i, s] of sections.entries()) {
    if (!reviewed(s.evidence) || s.fromStop !== pattern.stops[i] || s.toStop !== pattern.stops[i + 1] ||
        (i > 0 && sections[i - 1].toNode !== s.fromNode) || !s.ways.length || s.fromNode === s.toNode) return null
    const edges: RoadGraphEdge[] = []
    for (const w of s.ways) {
      const meters = shapeLength(w.positions, mode === 'rail' ? 2000 : 1000)
      if (!meters || !reviewed(w.evidence) || w.mode !== mode || w.from === w.to ||
          !matches(w.from, w.positions[0]) || !matches(w.to, w.positions.at(-1)!)) return null
      edges.push({ from: w.from, to: w.to, mode, positions: w.positions, meters })
    }
    const path = shortestRoadGraphPath(edges, s.fromNode, s.toNode, mode)
    // A branch, duplicate, cycle, isolated way or missing link cannot prove
    // the specified route; never pick a plausible subset of those members.
    if (!path || path.edges.length !== edges.length) return null
    parts.push({ positions: concatenate(path.edges), meters: path.distanceM })
  }
  return { pattern: { ...pattern, shape: { ...geometry, positions: concatenate(parts) } }, sections: parts }
}
