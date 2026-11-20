import { describe, expect, it } from 'vitest'
import { BUS_BOARD_LINES } from './busBoardCatalog'
import { compileSign } from './busSignReading'
import { existingSheetHours, withNewSheetDirections } from './busSheetCatalog'

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

describe('58 : rangs imprimés Mbao ↔ Gueule Tapée, pas la 58 de Comico',()=>{
  const [comico,sahm,go,back]=BUS_BOARD_LINES.aftu.find(l=>l.code==='58')!.directions
  it('n’attache ces cellules ni à Comico ni à un autre sens du même numéro',()=>{
    expect([comico,sahm].map(d=>[d.points.length,d.sourceHours])).toEqual([[0,undefined],[0,undefined]])
    expect(existingSheetHours('aftu','58',{...go,source:back.source})).toBeUndefined()
    expect(existingSheetHours('tata','58',go)).toBeUndefined()
    expect(go.sourceHours!.printedLabels).toMatchObject({1:'Arrêt De Bus',2:'Arrêt De Bus',39:'Bvar. Tapée / Rue 18'})
    expect(back.sourceHours!.printedLabels).toMatchObject({1:'Bvar. Tapée / Av. Diop',43:'Arrêt De Bus'})
  })
  it.each([[go,39,'05:10:59','05:11'],[back,43,'05:22:59','05:23']] as const)('lit le terminus puis ne franchit pas une lacune', (d,r,now,end)=>{
    for(const estimates of [false,true]){
      const sign=compileSign(d,date(thursday,'00:00'),estimates)
      expect(sign.at(r,date(thursday,now))).toMatchObject({kind:'weekly',passage:{minutes:1,at:date(thursday,end)}})
      expect(sign.at(r,date(thursday,'19:00'))).toEqual({kind:'weekly',passage:{state:'unknown'}})
    }
  })
})

describe('60 : grille AFTU Bargny ↔ Colobane',()=>{
  const dirs=BUS_BOARD_LINES.aftu.find(l=>l.code==='60')!.directions
  it('garde les 11 repères de l’aller et complète exactement la fiche retour vide',()=>{
    expect(dirs.map(d=>[d.pointKind,d.points.length])).toEqual([['repères',11],['arrêts',48],['arrêts',50]])
    expect(dirs[1].indexSource).toBe('https://aftu-senegal.org/infos-pratiques/')
    expect(dirs[2].points.slice(1,3)).toEqual(['Rue Gib 71, 18','Rue Gib 71, 18'])
    expect(BUS_BOARD_LINES.tata.find(l=>l.code==='60')!.directions.some(d=>d.sourceHours)).toBe(false)
    const blank={...dirs[0],label:'Retour',from:'Bargny',to:'Autre terminus',source:dirs[1].indexSource!,points:[],clock:null}
    expect(withNewSheetDirections('aftu','60',[blank])[0]).toBe(blank)
  })
  it.each([[1,48,'05:16:59','05:17','07:10'],[2,50,'05:40:59','05:41','08:40']] as const)('couvre le terminus de la fiche %i sans combler la fin de matinée',(i,n,now,first,limit)=>{
    const d=dirs[i],sign=compileSign(d,date(thursday,'00:00'),true)
    expect(sign.at(n,date(thursday,now))).toMatchObject({kind:'weekly',passage:{at:date(thursday,first),minutes:1}})
    expect(sign.at(n,date(thursday,limit)).passage.state).toBe('unknown')
  })
})
