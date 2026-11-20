import { describe, expect, it } from 'vitest'
import { existingSheetHours } from './busSheetCatalog'
import { BUS_BOARD_LINES } from './busBoardCatalog'
import { gridAt, sourceDay, sourceIssue, sourcePassage, type SourceHours } from './busSourceHours'
const day = Date.parse('2026-11-19T00:00Z'), at = (t:string) => Date.parse(`2026-11-19T${t}Z`)
const sheet=(family:'ddd'|'aftu', code:string) => BUS_BOARD_LINES[family].find(l=>l.code===code)!.directions.filter(d=>d.sourceHours?.weekday)
const dirs=(family:'ddd'|'aftu',code:string) => sheet(family,code).map(d=>sourceDay(d.sourceHours,d.points.length,day))
const data: SourceHours = { file:'sample',source:'sample',weekday:{ranks:[1,3],profiles:[{origins:['23:54'],elapsed:[0,10]}],nextUntranscribedOrigin:null} }
describe('cellules de fiches, distinctes des modèles',()=>{
  it('valide toutes les colonnes, sans imposer l’unicité des noms',()=>{
    for(const l of Object.values(BUS_BOARD_LINES).flat()) for(const d of l.directions) if(d.sourceHours) expect(sourceIssue(d.sourceHours,d.points.length),`${l.key}/${d.label}`).toBeUndefined()
    expect(BUS_BOARD_LINES.aftu.find(l=>l.code==='84')!.directions[1].sourceHours?.samples?.[0].times).toHaveLength(73)
  })
  it('sépare les deux tableaux complets de semaine de la 7 de la fiche Palais 2',()=>{
    const [go,back]=dirs('ddd','7')
    expect([go,back].map(d=>[d?.today.calls.size,d?.today.calls.get(1)?.length])).toEqual([[27,55],[29,47]])
    expect(sourcePassage(go,27,at('06:49'))).toMatchObject({at:at('07:12')})
    expect(sourcePassage(back,29,at('23:04:59'))).toMatchObject({at:at('23:05'),minutes:1})
    expect(sourcePassage(back,29,at('23:05'))).toEqual({state:'finished'})
    expect(gridAt(sheet('ddd','7')[0].sourceHours!,day+2*86400000)).toBeUndefined()
  })
  it('42 : borne la transcription partielle, ne décale ni les anonymes ni les 58 rangs sans heure du retour',()=>{
    const [go,back]=dirs('aftu','42'); expect(go?.today.calls.size).toBe(70); expect(back?.today.calls.size).toBe(10)
    expect(sourcePassage(go,68,at('06:19:59'))).toMatchObject({at:at('06:20')});expect(sourcePassage(go,70,at('06:21:59'))).toMatchObject({at:at('06:22'),minutes:1});expect(sourcePassage(go,70,at('06:22'))).toEqual({state:'unknown'})
    expect(sourcePassage(back,5,at('10:07'))).toMatchObject({at:at('10:22')});expect(sourcePassage(back,6,at('10:07'))).toMatchObject({at:at('10:08')});expect(sourcePassage(back,6,at('10:22'))).toMatchObject({at:at('10:23')});expect(sourcePassage(back,68,at('19:00'))).toEqual({state:'unknown'})
  })
  it('ne prolonge pas les transcriptions du matin de la 12 et de la 75 jusqu’aux échantillons du soir',()=>{
    const [go,back]=dirs('ddd','12'), [toColobane]=dirs('aftu','75')
    expect(sourcePassage(go,63,at('07:06:59'))).toMatchObject({at:at('07:08')})
    expect(sourcePassage(go,37,at('19:00')).state).toBe('unknown')
    expect(sourcePassage(back,10,at('20:00:59'))).toMatchObject({at:at('20:01')})
    expect(sourcePassage(back,14,at('07:08')).state).toBe('unknown')
    expect(sourcePassage(toColobane,52,at('04:32:59'))).toMatchObject({at:at('04:33')})
    expect(sourcePassage(toColobane,52,at('05:09:00'))).toMatchObject({at:at('05:16')})
    expect(sourcePassage(toColobane,52,at('05:35')).state).toBe('unknown')
    expect(sourcePassage(dirs('aftu','75')[1],15,at('19:00')).state).toBe('unknown')
  })
  it('les colonnes de la 65 sont indépendantes du modèle et protégées contre un décalage de rang',()=>{
    const [d] = sheet('aftu','65')
    expect(existingSheetHours('aftu','65',{...d,clock:null})?.weekday).toEqual(d.sourceHours?.weekday)
    expect(existingSheetHours('aftu','65',{...d,points:[...d.points].reverse()})).toBeUndefined()
  })
  it('Colobane : deux lectures indépendantes du matin, pas un transfert calculé',()=>{
    const [toJaxaay,toColobane]=dirs('aftu','65'),fromColobane=dirs('aftu','75')[1]
    expect(sourcePassage(toJaxaay,1,at('04:33'))).toMatchObject({at:at('04:42')})
    expect(sourcePassage(toJaxaay,2,at('04:42'))).toMatchObject({at:at('04:43')})
    expect(sourcePassage(toColobane,56,at('05:10:59'))).toMatchObject({at:at('05:11')})
    expect(sourcePassage(fromColobane,1,at('05:11'))).toMatchObject({at:at('05:16')})
    for(const [d,n,last] of [[toJaxaay,57,'06:12'],[toColobane,56,'06:08'],[fromColobane,51,'06:10']] as const)
      expect(sourcePassage(d,n,at(last))).toEqual({state:'unknown'})
  })
  it('311 : uniquement les colonnes imprimées, dont les changements de profil à cheval sur deux périodes',()=>{
    const [rn,lac]=sheet('ddd','311'), saturday=day+2*86400000
    for(const [d,count,ends] of [[rn,28,['07:10','10:16','15:13','20:15','20:38']],[lac,27,['07:49','10:16','15:13','20:15','20:38']]] as const){
      const calls=sourceDay(d.sourceHours,42,day)!.today.calls
      expect(calls.get(1)).toHaveLength(count);expect(calls.get(42)).toEqual(expect.arrayContaining(ends.map(at)))
    }
    const saturdayRow=(d:typeof rn,rank:number)=>sourceDay(d.sourceHours,42,saturday)!.today.calls.get(rank)!.map(t=>new Date(t).toISOString().slice(11,16))
    expect(saturdayRow(rn,42)).toEqual('07:49 08:34 09:19 10:03 10:41 11:26 12:11 12:56 13:41 14:26 15:13 16:04 16:49 17:34 18:19 19:04 19:49 20:26'.split(' '))
    expect(saturdayRow(lac,42)).toEqual('08:19 09:04 09:49 10:28 11:11 11:56 12:41 13:26 14:11 14:56 15:49 16:34 17:19 18:04 18:49 19:34 20:15'.split(' '))
    expect(saturdayRow(rn,33).at(-1)).toBe('20:19');expect(saturdayRow(lac,17)[3]).toBe('10:03')
  })
  it('ne transporte que les passages imprimés après minuit, sans répliquer de calendrier',()=>{
    const fri=day+86400000, sat=fri+86400000, d=sourceDay(data,3,sat)
    expect(sourcePassage(d,3,sat+239000)).toMatchObject({minutes:1,at:sat+240000});expect(sourcePassage(d,3,sat+240000)).toEqual({state:'calendar'})
    expect(gridAt(data,Date.parse('2026-12-25T00:00Z'))).toBeUndefined()
  })
  it('refuse rangs inversés, heures décroissantes, origine dupliquée ou au-delà de la borne',()=>{
    const g=data.weekday!,p=g.profiles[0]; for(const bad of [{...g,ranks:[3,1]},{...g,profiles:[p,p]},{...g,profiles:[{...p,elapsed:[0,-1]}]},{...g,nextUntranscribedOrigin:'23:50'}]) {
      expect(sourceIssue({...data,weekday:bad},3)).toBeTruthy(); expect(sourceDay({...data,weekday:bad},3,day)).toBeNull()
    }
  })
})
