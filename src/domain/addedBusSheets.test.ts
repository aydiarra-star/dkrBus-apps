import { describe, expect, it } from 'vitest'
import { BUS_BOARD_LINES } from './busBoardCatalog'
import { compileSign } from './busSignReading'
import { existingSheetHours } from './busSheetCatalog'

const day = Date.parse('2026-11-19T00:00:00Z')
const at = (time: string) => Date.parse(`2026-11-19T${time}Z`)
describe('16A, tableaux par rang vers Palais et vers Malika', () => {
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
      expect(sign.at(r,at(first)).passage).toMatchObject({state:'active',at:at(next)})
      const limit = d.sourceHours!.weekday!.nextUntranscribedOrigin
      if(limit) expect(sign.at(r,at(limit))).toEqual({kind:'weekly',passage:{state:'unknown'}})
    }
  })
})

it.each([
  ['6',69,71,'04:47','05:18'],
  ['23',57,56,'04:33','04:38'],
] as const)('%s : arrivée du premier départ dans les deux sens détaillés, pas du créneau modèle', (code,n,m,out,ret) => {
  const ds = BUS_BOARD_LINES.ddd.find(l => l.code === code)!.directions
  expect(ds.slice(0,2).map(d => d.sourceHours)).toEqual([undefined,undefined])
  for(const [d,count,end] of [[ds[2],n,out],[ds[3],m,ret]] as const){
    expect(d.sourceHours!.weekday!.ranks).toHaveLength(count)
    const sign=compileSign(d,day,true)
    expect(sign.at(count,at(end)-1000)).toEqual({kind:'weekly',passage:{state:'active',minutes:1,at:at(end)}})
    if(d.sourceHours!.weekday!.nextUntranscribedOrigin) expect(sign.at(count,at('19:00'))).toEqual({kind:'weekly',passage:{state:'unknown'}})
  }
})

it('57 : la grille AFTU ne passe pas à la ligne TATA de même numéro ni à un rang inversé', () => {
  const [go,back] = BUS_BOARD_LINES.aftu.find(l => l.code === '57')!.directions
  expect([go,back].map(d => d.sourceHours?.weekday?.ranks.length)).toEqual([56,57])
  for(const [d,n,t] of [[go,56,'05:36'],[back,57,'05:48']] as const){
    expect(existingSheetHours('tata','57',d)).toBeUndefined()
    expect(existingSheetHours('aftu','57',{...d,points:[...d.points].reverse()})).toBeUndefined()
    expect(compileSign(d,day).at(n,at(t)-1000)).toEqual({kind:'weekly',passage:{state:'active',minutes:1,at:at(t)}})
  }
})

// Last arrivals are independent readings of the terminal rows, not start + frequency.
it.each([
  ['ddd','16A',2,65,'19:04','22:57','19:09','22:47'],
  ['ddd','16A',3,64,'19:03','22:55','19:20','22:57'],
  ['aftu','57',0,56,'19:06','21:58','19:11','21:53'],
  ['aftu','57',1,57,'19:07','21:51','19:05','21:59'],
  ['aftu','30',1,74,'19:02','22:32','19:25','22:19'],
] as const)('%s %s variante %i : 19 h, dernière seconde et fin sans redémarrage', (family,code,side,rank,next,last,nextWE,lastWE) => {
  const d = BUS_BOARD_LINES[family].find(l => l.code === code)!.directions[side]
  for (const [date, hh, end] of [[day,next,last],[day + 2*86400000,nextWE,lastWE],[day + 3*86400000,nextWE,lastWE]] as const) {
    const instant = (t: string) => date + at(t) - day
    const board = compileSign(d,date,true)
    expect(board.at(rank,instant('19:00')).passage).toMatchObject({state:'active',at:instant(hh)})
    expect(board.at(rank,instant(end)-1000)).toEqual({kind:'weekly',passage:{state:'active',minutes:1,at:instant(end)}})
    expect(board.at(rank,instant(end))).toEqual({kind:'weekly',passage:{state:'finished'}})
    expect(board.at(rank,instant('23:59')).passage.state).toBe('finished')
  }
})

it.each([
  ['30',77,74,'06:01','06:04'],
  ['66',77,77,'06:20','06:14'],
] as const)('AFTU %s : chaque terminus reçoit sa propre colonne, jamais celle du retour', (code,n,m,a,b) => {
  const [go,back] = BUS_BOARD_LINES.aftu.find(l => l.code === code)!.directions
  for (const [d,rank,h] of [[go,n,a],[back,m,b]] as const) {
    const grid = d.sourceHours!.weekday!
    expect(grid.ranks).toHaveLength(rank)
    const sign = compileSign(d,day,true)
    expect(sign.at(rank,at(h)-1000).passage).toMatchObject({state:'active',at:at(h)})
    if (grid.nextUntranscribedOrigin) expect(sign.at(rank,at('19:00')).passage.state).toBe('unknown')
  }
})

it('30 depuis Colobane : deux rangs de même libellé ne sont pas la même minute', () => {
  const back = BUS_BOARD_LINES.aftu.find(l => l.code === '30')!.directions[1]
  expect(back.points.slice(10,12)).toEqual(['Allees Khalifa Ababacar Sy, 2750','Allees Khalifa Ababacar Sy, 2750'])
  const board = compileSign(back,day)
  expect([11,12].map(r => board.at(r,at('07:13')).passage)).toMatchObject(['07:14','07:15'].map(t => ({state:'active',at:at(t)})))
  expect(board.at(74,at('22:32')).passage.state).toBe('finished')
})

it('30 le samedi : Colobane → Guédiawaye garde 37 colonnes et ne prête rien à l’autre sens', () => {
  const [go, back] = BUS_BOARD_LINES.aftu.find(l => l.code === '30')!.directions
  const saturday = day + 2*86400000, when = saturday + at('07:22') - day
  const g = back.sourceHours!.saturday!
  expect(g.profiles.flatMap(p => p.origins)).toHaveLength(37); expect(g.ranks).toHaveLength(74)
  expect(go.sourceHours?.saturday).toBeUndefined()
  expect(compileSign(go,saturday,true).at(77,when).passage.state).toBe('calendar')
  const sign = compileSign(back,saturday)
  expect(sign.at(11,when-1000).passage).toMatchObject({state:'active',at:when})
  expect(sign.at(12,when).passage).toMatchObject({state:'active',at:when+60000})
})
