import { describe, expect, it } from 'vitest'
import { BUS_BOARD_LINES } from './busBoardCatalog'
import { compileSign } from './busSignReading'
import { existingSheetHours } from './busSheetCatalog'

const date = (day:string, hhmm:string) => Date.parse(`${day}T${hhmm}Z`)
const thursday = '2026-11-19', saturday = '2026-11-21'
describe('horaires imprimés de la 319 : Liberté 6 ↔ Ouakam', () => {
  const [go,back] = BUS_BOARD_LINES.ddd.find(l => l.code === '319')!.directions
  it.each([[go,27,48,31],[back,26,54,34]] as const)('raccorde les rangs, pas seulement la cadence du sens (rangs %i)', (d,n,wk,we) => {
    expect(d.sourceHours!.weekday!.ranks.length).toBe(n)
    for(const [g,total] of [[d.sourceHours!.weekday!,wk],[d.sourceHours!.saturday!,we],[d.sourceHours!.sunday!,we]] as const)
      expect(g.profiles.flatMap(p=>p.origins)).toHaveLength(total)
    expect(d.sourceHours!.samples?.[0].ranks.length).toBe(n)
    expect(existingSheetHours('ddd','319',{...d,points:[...d.points].reverse(),clock:null})).toBeUndefined()
  })
  it.each([[go,27,thursday,'22:06:59','22:07'],[back,26,thursday,'22:08:59','22:09'],
    [go,27,saturday,'21:53:59','21:54'],[back,26,saturday,'22:08:59','22:09']] as const)('s’arrête exactement à la dernière cellule', (d,rank,day,now,end) => {
    for (const option of [false,true]) {
      const sign=compileSign(d,date(day,'00:00'),option)
      expect(sign.at(rank,date(day,now))).toEqual({kind:'weekly',passage:{state:'active',minutes:1,at:date(day,end)}})
      expect(sign.at(rank,date(day,end)).passage.state).toBe('finished')
    }
  })
  it('conserve deux appels Rue Okm 282, 222 distincts au retour de pointe',()=>{
    expect(go.points.slice(19,21)).toEqual(['Rue Okm 282, 222','Rue Okm 282, 222'])
    const sign=compileSign(go,date(thursday,'00:00'))
    expect([20,21].map(rank=>sign.at(rank,date(thursday,'19:17:59')).passage)).toEqual([
      {state:'active',minutes:1,at:date(thursday,'19:18')},{state:'active',minutes:2,at:date(thursday,'19:19')},
    ])
  })
})
