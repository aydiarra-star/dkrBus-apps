/** Collision is measured on the screen, never in metres or against a route.
 * The representative is an actual member, not a new stop or a routing edge. */
export const POINT_WIDTH = 60
export const POINT_HEIGHT = 30
const dx = POINT_WIDTH + 4, dy = POINT_HEIGHT + 4
export interface ProjectedPoint<T> { point: T; x: number; y: number }
export interface PointGroup<T> extends ProjectedPoint<T> { members: T[] }

export function packMapPoints<T>(points: ProjectedPoint<T>[], view: { x: number; y: number }): PointGroup<T>[] {
  // Never let an off-screen representative swallow a point inside the map.
  const inside = ({ x, y }: ProjectedPoint<T>) => x >= 0 && y >= 0 && x < view.x && y < view.y
  const cells = new Map<string, PointGroup<T>[]>()
  const groups: PointGroup<T>[] = []
  for (const p of [...points.filter(inside), ...points.filter(p => !inside(p))]) {
    const col = Math.floor(p.x / dx), row = Math.floor(p.y / dy)
    let match: PointGroup<T> | undefined, best = Infinity
    for (let i = col - 1; i <= col + 1; i++) for (let j = row - 1; j <= row + 1; j++) {
      for (const candidate of cells.get(`${i}:${j}`) ?? []) {
        const x = Math.abs(candidate.x - p.x), y = Math.abs(candidate.y - p.y)
        const d = x * x + y * y
        if (x < dx && y < dy && d < best) { match = candidate; best = d }
      }
    }
    if (match) match.members.push(p.point)
    else {
      const group = { ...p, members: [p.point] }, key = `${col}:${row}`
      const cell = cells.get(key) ?? []
      cell.push(group); cells.set(key, cell); groups.push(group)
    }
  }
  return groups
}
