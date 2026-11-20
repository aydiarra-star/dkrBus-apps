import { expect, it } from 'vitest'
import { directionCoverage, linesCoverage, rankCoverage } from './busReadingCoverage'
import type { SourceGrid, SourceHours } from './busSourceHours'
import type { BusBoardDirection } from './busPassageBoard'
const g: SourceGrid = { ranks:[1,3], profiles:[{origins:['06:00','07:00'],elapsed:[0,5]}], nextUntranscribedOrigin:null }
const h: SourceHours = {source:'publication',file:'copie',weekday:g,saturday:g,sunday:{...g,profiles:[]}}
it('counts only the documented ranks, including a Friday override and an explicitly closed Sunday',()=>{
  expect(rankCoverage(h,3)).toBe('couvert'); expect(rankCoverage(h,2)).toBe('non documenté')
  expect(rankCoverage({...h,friday:{...g,nextUntranscribedOrigin:'09:00'}},1)).toBe('partiel')
  expect(rankCoverage({...h,sunday:undefined},1)).toBe('partiel')
  expect(rankCoverage({...h,weekday:undefined},1)).toBe('partiel')
  expect(rankCoverage({...h,weekday:{...g,nextUntranscribedOrigin:'08:00'}},3)).toBe('partiel')
})
it('distinguishes a sample, an empty schedule and a supplied cell not safe to count down to',()=>{
  expect(rankCoverage({file:'f',source:'s',samples:[{label:'Non daté',ranks:[2],times:['07:00']}]},2)).toBe('partiel')
  expect(rankCoverage({file:'f',source:'s',sunday:h.sunday},1)).toBe('non documenté')
  expect(rankCoverage({...h,weekday:{...g,nextUntranscribedOrigin:'06:05',profiles:[{origins:['06:00'],elapsed:[0,30]}]}},3)).toBe('partiel')
})
it('excludes non-stop occurrences and aliases, keeps duplicate names, fails closed on invalid cells',()=>{
  const d: BusBoardDirection={from:'A',to:'B',points:['A','X','X'],label:'Aller',source:'page',clock:null,sourceHours:h,pointKind:'arrêts'}
  expect(directionCoverage({...d,sourceHours:{...h,source:''}})).toEqual({couvert:0,partiel:0,'non documenté':3})
  const line={key:'test',family:'ddd' as const,code:'1',directions:[d,{...d,pointKind:'repères' as const}]}
  expect(linesCoverage([line,{...line,aliasOf:'1'}])).toEqual({couvert:2,partiel:0,'non documenté':1})
})
