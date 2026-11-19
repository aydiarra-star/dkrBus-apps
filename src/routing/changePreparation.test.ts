import { expect, it } from 'vitest'
import { getCorridorStop } from '../domain/corridors'
import { JOURNEY_LANDMARKS } from '../domain/journeyLandmarks'
import { planDakarJourney } from './dakar'
import { dakarNetwork } from './dakar'
import { prepareChanges } from './changePreparation'

const at = (s: string) => Date.parse(`2026-11-18T${s}:00Z`) / 1000
const q = { departAt: at('19:00') }
const stop = (id: string) => { const s = getCorridorStop(id)!; return { stopId: id, lat: s.lat, lng: s.lon } }
const landmark = (key: string) => { const p = JOURNEY_LANDMARKS.find(p => p.id === `landmark:${key}`)!; return { kind: 'map' as const, landmarkId: p.id, lat: p.lat, lng: p.lon } }

it('Dakar → Keur Massar: separates the dated TER section and exact AFTU 74 labels at Bargny; no reachable bus or map', () => {
  const a = stop('ter-dakar'), b = landmark('keur-massar')
  const r = planDakarJourney(a, b, q)
  if (r.ok) throw Error('Unknown transfer')
  expect(r.changesToCheck).toContainEqual(expect.objectContaining({ hub: 'Bargny · gare ferroviaire', before: expect.objectContaining({ kind: 'section', line: 'TER', from: 'Dakar', to: 'Bargny' }),
    after: expect.objectContaining({ kind: 'sheet', line: 'AFTU 74', from: 'Terminus Bargny (Gare ferroviaire)', to: 'Terminus Keur Massar', url: 'https://aftu-senegal.org/map/dakar-urbain-ligne-74/' }) }))
  expect(r).not.toHaveProperty('options'); expect(r.changesToCheck?.[0]).not.toHaveProperty('arriveAt')
  for (const settings of [{ stepFreeOnly: true }, { modes: ['ter'] as const }, { maxChanges: 0 }, { departAt: at('22:10') }]) expect(prepareChanges(dakarNetwork, a, b, { ...q, ...settings })).toEqual([])
  expect(prepareChanges(dakarNetwork, b, a, q)).toEqual([])
  expect(prepareChanges(dakarNetwork, a, { ...b, lat: b.lat + .0001 }, q)).toEqual([])
})

it('offers bus-to-bus research in order (including an independent TATA sheet), never a reverse, a loop or a shared platform', () => {
  const c = prepareChanges(dakarNetwork, stop('ddd-grand-yoff'), stop('ddd-khar-yalla'), { ...q, modes: ['ddd', 'tata'] }).find(c => c.hub === 'UCAD')
  expect(c).toMatchObject({ before: { kind: 'sheet', line: 'TATA 38', to: 'UCAD', url: expect.stringContaining('covoiturage.sn/') }, after: { kind: 'sheet', line: 'DDD 20', from: 'UCAD', to: 'Khar Yalla' } })
  expect(prepareChanges(dakarNetwork, stop('ddd-grand-yoff'), stop('aftu-grand-yoff'), q)).toEqual([])
  const poles = planDakarJourney(stop('ter-dakar'), stop('brt-petersen'), q)
  expect(poles).toMatchObject({ ok: false, message: expect.stringContaining('Deux sites distincts') }); expect(poles).not.toHaveProperty('changesToCheck')
})

it('checks the second service cannot already be over; a working northbound B1 section is not evidence for Préfecture', () => {
  const a = stop('brt-prefecture-guediawaye'), b = stop('ter-rufisque')
  expect(prepareChanges(dakarNetwork, a, b, q).map(x => x.hub)).toContain('Gare de Dakar / Petersen')
  expect(prepareChanges(dakarNetwork, a, b, { ...q, departAt: at('20:54'), transferBufferSeconds: 1200 }).some(x => x.hub === 'Gare de Dakar / Petersen')).toBe(false)
  const x = stop('brt-petersen'), y = stop('brt-gueule-tapee')
  const last = planDakarJourney(x, y, { departAt: at('20:54') })
  expect(last.ok && last.options[0].legs[0]).toMatchObject({ start: at('20:54'), source: expect.stringContaining('19961993'), passages: [at('20:54')] })
  expect(planDakarJourney(x, y, { departAt: at('20:55') })).toMatchObject({ ok: false, code: 'NO_SERVICE' })
  expect(planDakarJourney(x, a, q).ok).toBe(false)
})

it('names the 121 terminus as a separate enquiry, not a B1 connection from the central platform', () => {
  const r = prepareChanges(dakarNetwork, stop('brt-prefecture-guediawaye'), stop('ddd-petersen'), q)
  expect(r.find(x => x.hub === 'Scat Urbam')).toMatchObject({ before: { kind: 'section', line: 'B1' }, after: { kind: 'sheet', line: 'DDD 121', from: 'Terminus Scat Urbam', to: 'Petersen' } })
  expect(planDakarJourney(stop('brt-prefecture-guediawaye'), stop('ddd-petersen'), q).ok).toBe(false)
})
