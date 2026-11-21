import { describe, expect, it } from 'vitest'
import { POINT_HEIGHT, POINT_WIDTH, packMapPoints } from './mapPointLayout'
const size = { x: 393, y: 284 }
const pack = (coords: number[][]) => packMapPoints(coords.map(([x,y],point) => ({ point,x,y })), size)
describe('séparation des cibles en pixels', () => {
  it('keeps an on-screen anchor, retains a coincident and an off-screen member, no chain across the city', () => {
    const groups = pack([[-2,80],[3,80],[3,80],[60,80],[117,80],[121,119]])
    expect(groups.map(g => g.members)).toEqual([[1,2,3,0],[4],[5]])
    expect(groups.map(g => [g.x,g.y])).toEqual([[3,80],[117,80],[121,119]])
  })
  it('separates hit boxes even across grid boundaries and never drops IDs in dense clusters', () => {
    const coords = Array.from({ length: 1200 }, (_,i) => [(137*i)%569-90,(71*i)%391-18])
    const groups = pack(coords)
    expect(groups.flatMap(g => g.members).sort((a,b) => a-b)).toEqual(coords.map((_, i) => i))
    for (const [i,a] of groups.entries()) for (const b of groups.slice(i+1)) {
      expect(Math.abs(a.x-b.x) >= POINT_WIDTH || Math.abs(a.y-b.y) >= POINT_HEIGHT).toBe(true)
    }
  })
})
