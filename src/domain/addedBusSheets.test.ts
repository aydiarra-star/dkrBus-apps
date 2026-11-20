import { describe, expect, it } from 'vitest'
import { BUS_BOARD_LINES } from './busBoardCatalog'
import { compileSign } from './busSignReading'
import { existingSheetHours } from './busSheetCatalog'

const day = Date.parse('2026-11-19T00:00:00Z')
const at = (time: string) => Date.parse(`2026-11-19T${time}Z`)
describe('16A, grilles partielles du matin dans les deux sens', () => {
  const line = BUS_BOARD_LINES.ddd.find(l => l.code === '16A')!
  const [operator, origin, go, back] = line.directions
  it('ne relie ni le Palais 1, ni la 16B, ni une liste de même taille mais déplacée', () => {
    expect([operator.sourceHours, origin.sourceHours]).toEqual([undefined, undefined])
    expect(existingSheetHours('ddd','16B',go)).toBeUndefined()
    expect(existingSheetHours('ddd','16A',{...back, points:[...back.points].reverse()})).toBeUndefined()
    expect(go.sourceHours!.weekday!.ranks.length).toBe(65)
    expect(back.sourceHours!.weekday!.ranks.length).toBe(64)
  })
  it.each([[go,65,'06:01','06:16'], [back,64,'06:16','06:33']] as const)('saute le passage atteint, y compris au terminus', (d,r,first,next) => {
    for(const estimates of [true,false]) {
      const sign = compileSign(d,day,estimates)
      expect(sign.at(r,at(first)-1000)).toEqual({kind:'weekly',passage:{state:'active',minutes:1,at:at(first)}})
      expect(sign.at(r,at(first)).passage.at).toBe(at(next))
      const limit = d.sourceHours!.weekday!.nextUntranscribedOrigin
      if(limit) expect(sign.at(r,at(limit))).toEqual({kind:'weekly',passage:{state:'unknown'}})
    }
  })
})
