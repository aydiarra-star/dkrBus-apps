import { describe, expect, it } from 'vitest'
import { maristesSheets, timetableStops } from '../data/maristesTimetables'
import { buildStopIndex } from '../domain/stops'
import { clockMinutes } from '../domain/stopPassageCountdown'
import { dakarNetwork } from './dakar'
import type { JourneySettings } from './placeConnections'
import { compareTimetables } from './timetableAdvice'

const gue = '37702749', pikine = '37702627', hub = '37702688', gare = '37702002', moulins = '37702678'
const at = (time: string) => Date.parse(`2026-11-19T${time}Z`) / 1000
const plan = (from: string, to: string, time: string, settings: Partial<JourneySettings> = {}) => compareTimetables(from, to, { departAt: at(time), ...settings })

describe('Maristes: compare the clocks, not a walking path or a ride on a map', () => {
  it('keeps only explicit, ordered calls from individual runs and no placemarks', () => {
    expect(maristesSheets.map(s => s.calls.map(c => c.rank))).toEqual([[1,37,47],[24,37,52]])
    for (const sheet of maristesSheets) for (const row of sheet.rows) {
      const t = row.map(v => clockMinutes(v))
      expect(t).not.toContain(null); expect(t[0]!).toBeLessThan(t[1]!); expect(t[1]!).toBeLessThan(t[2]!)
    }
    const ids = buildStopIndex([],dakarNetwork.places.values()).filter(o => o.selectable).map(o => o.value)
    for (const s of timetableStops) { expect(dakarNetwork.places.has(s.id)).toBe(false); expect(ids).not.toContain(s.id) }
    expect(dakarNetwork.samePlatform.size).toBe(0)
  })
  it('rejects the 05:27 connection (one minute) and boards the 05:34 run through to 05:46', () => {
    const r = plan(gue,gare,'05:00', { transferBufferSeconds: 0 })
    expect(r).toMatchObject({ kind:'hours-only', marginSeconds:180, gapSeconds:480, legs:[
      {line:'DDD 12',from:gue,to:hub,start:at('05:00'),end:at('05:26')},
      {line:'AFTU 75',from:hub,to:gare,start:at('05:34'),end:at('05:46')}] })
    expect(plan(pikine,gare,'05:15')).toMatchObject({gapSeconds:null,legs:[{start:at('05:15'),end:at('05:39')}]})
    expect(plan(gue,gare,'05:00',{transferBufferSeconds:480})).toEqual({...r,marginSeconds:480})
    expect(plan(gue,gare,'05:00',{transferBufferSeconds:481})).toMatchObject({gapSeconds:900,legs:[{}, {start:at('05:41'),end:at('05:53')}]})
    expect(plan(gue,gare,'05:00:01')).toMatchObject({legs:[{start:at('05:15')}, {start:at('05:48')}]})
  })
  it('can change in the other line order, with independently read downstream calls and evening times', () => {
    expect(plan(pikine,moulins,'05:07')).toMatchObject({ gapSeconds:420, legs:[{start:at('05:07'),end:at('05:19')}, {start:at('05:26'),end:at('05:36')}] })
    expect(plan(gue,gare,'19:00')).toMatchObject({gapSeconds:300,legs:[{end:at('19:33')},{start:at('19:38'),end:at('19:54')}]})
    expect(plan(pikine,moulins,'19:00')).toMatchObject({gapSeconds:540,legs:[{start:at('19:08'),end:at('19:24')}, {start:at('19:33'),end:at('19:47')}]})
  })
  it('does not reverse the trips, equate two stop sheets, extrapolate later service or ignore the traveller’s filters', () => {
    for (const [from,to] of [[gare,gue],[moulins,pikine],[hub,hub],['37702687',gare],['14.73,-17.43',gare],['ref:ddd-guediawaye',gare]]) {
      expect(plan(from,to,'05:00').kind).toBe('unavailable')
    }
    for (const settings of [{ stepFreeOnly:true },{ maxChanges:0 },{ modes:['ddd'] as const },{ modes:['tata','ddd'] as const },{ modes:[] },
      { departAt: Date.parse('2026-11-21T05:00Z')/1000 },{ departAt:Date.parse('2026-11-26T05:00Z')/1000 },{ departAt:NaN },{ transferBufferSeconds:-1 }]) {
      expect(plan(gue,gare,'05:00',settings).kind).toBe('unavailable')
    }
    for (const time of ['12:00','20:00','23:59']) expect(plan(gue,gare,time).kind).toBe('unavailable')
    expect(plan(pikine,gare,'05:22',{maxChanges:0,modes:['aftu_tata']})).toMatchObject({gapSeconds:null,legs:[{line:'AFTU 75'}]})
  })
})
