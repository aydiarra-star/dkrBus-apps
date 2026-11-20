import { describe, expect, it } from 'vitest'
import { AFTU73_SHEETS } from '../data/aftu73Checkpoints'
import { hhmm } from './busSourceHours'
import { clockMinutes } from './stopPassageCountdown'
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
  it.each([[go,39,'05:10:59','05:11','19:03','22:35'],[back,43,'05:22:59','05:23','19:08','22:36']] as const)('lit le terminus en semaine, de la première à la dernière course', (d,r,now,end,pm,last)=>{
    for(const estimates of [false,true]){
      const sign=compileSign(d,date(thursday,'00:00'),estimates)
      expect(sign.at(r,date(thursday,now))).toMatchObject({kind:'weekly',passage:{minutes:1,at:date(thursday,end)}})
      expect(sign.at(r,date(thursday,'19:00'))).toMatchObject({kind:'weekly',passage:{at:date(thursday,pm)}})
      expect(sign.at(r,date(thursday,last)-1000).passage).toMatchObject({minutes:1,at:date(thursday,last)})
      expect(sign.at(r,date(thursday,last)).passage).toEqual({state:'finished'})
    }
  })
  it.each([[go,39,88,57,'22:29','09:54','10:42','19:24','20:16'],[back,43,70,51,'22:32','14:25','15:15','19:30','20:21']] as const)(
    'garde les colonnes de transition et le dernier passage du week-end',(d,n,wk,we,last,origin,terminal,originWE,terminalWE)=>{
      for(const [day,count,o,v] of [[thursday,wk,origin,terminal],[saturday,we,originWE,terminalWE],['2026-11-22',we,originWE,terminalWE]] as const){
        const sign=compileSign(d,date(day,'00:00')), rows=sign.reading!.today.calls
        expect(rows.size).toBe(n); for (const row of rows.values())expect(row).toHaveLength(count)
        const column=rows.get(1)!.indexOf(date(day,o));expect(column).toBeGreaterThanOrEqual(0)
        expect(rows.get(n)![column]).toBe(date(day,v))
        if(day!==thursday) expect(rows.get(n)?.at(-1)).toBe(date(day,last))
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

describe('42, retour Ouakam → Guédiawaye : toutes les lignes du tableau',()=>{
  const d=BUS_BOARD_LINES.aftu.find(l=>l.code==='42')!.directions.at(-1)!
  it.each([[thursday,65,'06:40','19:10'],[saturday,39,'06:50','19:10'],['2026-11-22',39,'06:50','19:10']] as const)('ne confond pas le calendrier du %s',(day,n,first,lastPM)=>{
    const sign=compileSign(d,date(day,'00:00'))
    for(const calls of sign.reading!.today.calls.values())expect(calls).toHaveLength(n)
    expect(sign.reading!.today.calls.get(68)?.[0]).toBe(date(day,first))
    expect(sign.at(68,date(day,'19:00')).passage).toMatchObject({at:date(day,lastPM)})
    expect(sign.at(68,date(day,'22:36:59')).passage).toMatchObject({minutes:1,at:date(day,'22:37')})
    expect(sign.at(68,date(day,'22:37')).passage).toEqual({state:'finished'})
  })
})

describe('16B : les colonnes de minuit appartiennent à la veille',()=>{
  const [,,palais,malika]=BUS_BOARD_LINES.ddd.find(l=>l.code==='16B')!.directions
  const friday='2026-11-20', sunday='2026-11-22', monday='2026-11-23'
  it.each([[palais,83,thursday,79,24,'05:41','25:08'],[palais,83,friday,78,24,'05:41','24:53'],
    [palais,83,saturday,44,24,'06:43','24:33'],[palais,83,sunday,38,24,'06:43','25:08'],
    [malika,82,thursday,75,15,'06:13','24:38'],[malika,82,friday,75,15,'06:13','24:38'],
    [malika,82,saturday,41,15,'07:17','23:48'],[malika,82,sunday,35,15,'07:17','24:08']] as const)(
    'vérifie les colonnes terminales et le nombre de rangs transcrits', (d,r,day,n,ranks,first,last)=>{
      const dayMs=date(day,'00:00'), sign=compileSign(d,dayMs,true), calls=sign.reading!.today.calls
      expect(calls.size).toBe(ranks);for (const row of calls.values())expect(row).toHaveLength(n)
      expect(calls.get(r)?.[0]).toBe(date(day,first));const [h,m]=last.split(':').map(Number)
      expect(calls.get(r)?.at(-1)).toBe(dayMs+(h*60+m)*60000)
      expect(compileSign(d,dayMs,false).at(30,date(day,'12:00'))).toEqual({kind:'none',passage:{state:'unknown'}})
    })
  it.each([[friday,'01:08','05:41'],[saturday,'00:53','06:43'],[sunday,'00:33','06:43'],[monday,'01:08','05:41']])(
    'termine les courses de la veille avant le premier passage du %s',(day,last,first)=>{
      const sign=compileSign(palais,date(day,'00:00'),true), end=date(day,last)
      expect(sign.at(83,end-1000)).toEqual({kind:'weekly',passage:{state:'active',minutes:1,at:end}})
      expect(sign.at(83,end)).toEqual({kind:'weekly',passage:{state:'upcoming',at:date(day,first)}})
    })
  it('distingue la première course du modèle de celle imprimée et garde les deux colonnes isolées',()=>{
    const sign=compileSign(palais,date(thursday,'00:00')), calls=sign.reading!.today.calls
    expect(calls.get(1)?.at(-1)).toBe(date(friday,'00:00'))
    expect(compileSign(palais,date(friday,'00:00')).reading?.today.calls.get(1)?.at(-1)).toBe(date(friday,'23:45'))
    expect(calls.get(83)?.slice(6,11)).toEqual('07:17 07:37 07:56 08:16 08:36'.split(' ').map(t=>date(thursday,t)))
    expect(palais.sourceHours?.samples).toHaveLength(2); expect(calls.has(24)).toBe(false)
  })
})

// Literal cells, not the intermediate offsets interpolated by the old model.
// Lock *every* original departure, CEM and terminal in both calendars.
describe('73 : les lieux nommés de la fiche Lac Rose ne sont pas le relevé de Niague', () => {
  const dirs = BUS_BOARD_LINES.aftu.find(l=>l.code==='73')!.directions
  it.each([0,1])('préserve les colonnes précédentes au rang et au départ, sens %i', i => {
    const d=dirs[i], old=AFTU73_SHEETS[i], h=d.sourceHours!
    expect(h.source).toBe(old.grid);expect(d.points).toHaveLength(75)
    for (const day of ['weekday','saturday','sunday'] as const) {
      const g=h[day]!, ref=day==='weekday'?old.weekday:old.weekend
      const materialized = new Map(g.profiles.flatMap(p=>p.origins.map(o=>[o,p.elapsed] as const)))
      expect(materialized.size).toBe(ref.arrival.length);expect(g.ranks).toEqual(Array.from({length:75},(_,j)=>j+1))
      for(const [j,end] of ref.arrival.entries()) {
        const cells=materialized.get(hhmm(clockMinutes(ref.start)!+j*ref.every))!
        expect([1,old.cemRank,75].map(rank=>cells[g.ranks.indexOf(rank)])).toEqual([0,typeof ref.cem==='number'?ref.cem:ref.cem[j],end])
      }
    }
    expect(existingSheetHours('aftu','73',{...d,clock:null})?.weekday).toBe(h.weekday)
    expect(existingSheetHours('aftu','73',{...d,pointKind:'repères'})).toBeUndefined()
    expect(existingSheetHours('aftu','73',{...d,from:'Station Ciel Oil/Thiaroye'})).toBeUndefined()
    expect(existingSheetHours('tata','73',d)).toBeUndefined()
  })
  it('ne reporte pas les heures du marché au terminus ni entre deux occurrences anonymes', () => {
    const [go,back] = dirs.map(d=>compileSign(d,date(thursday,'00:00')))
    const at=(s: string)=>date(thursday,s)
    expect(go.at(7,at('06:00:59')).passage).toMatchObject({at:at('06:01'),minutes:1})
    expect(back.at(69,at('06:42:59')).passage).toMatchObject({at:at('06:43'),minutes:1})
    expect([5,6].map(r=>go.at(r,at('07:24:59')).passage)).toEqual([{state:'active',at:at('07:25'),minutes:1},{state:'active',at:at('07:26'),minutes:2}])
    expect(dirs[0].points[50]).toBe('École Boune'); expect(dirs[0].sourceHours?.printedLabels).toMatchObject({51:'Arrêt De Bus',52:'École Boune'})
    expect(go.at(51,at('06:35:59')).passage).toMatchObject({at:at('06:36')});expect(go.at(52,at('06:35:59')).passage).toMatchObject({at:at('06:37')})
    expect(back.at(74,at('23:48:59')).passage).toMatchObject({at:at('23:49')})
    expect(back.at(74,at('23:49')).passage.state).toBe('finished')
  })
})
