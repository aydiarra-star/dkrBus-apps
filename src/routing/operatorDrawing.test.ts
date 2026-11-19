import { expect, it } from 'vitest'
import { PASSENGER_LINE_SHEETS } from '../domain/passengerLineSheets'
import { documentedDirections } from './documentedDirections'
import { ALL_CORRIDOR_STOPS } from '../domain/corridors'
import { planDakarJourney } from './dakar'
const at = Date.parse('2026-11-19T19:00:00Z')/1000
const point = (id: string) => { const p = ALL_CORRIDOR_STOPS.find(s => s.id === id)!; return { stopId: id, lat: p.lat, lng: p.lon } }

it('attaches the source map only to its identified direction, not the 83 stop transcriptions or a TATA sheet', () => {
  expect(PASSENGER_LINE_SHEETS.filter(s => s.drawing)).toHaveLength(15)
  for (const s of PASSENGER_LINE_SHEETS.filter(s => s.drawing)) {
    expect(s.network).toBe('aftu'); expect(s.drawing).toMatchObject({ from: s.labels[0], to: s.labels.at(-1) })
    expect(s.url).toBe(`https://aftu-senegal.org/map/dakar-urbain-ligne-${s.line}/`); expect(s.schedule).toBeUndefined()
  }
  expect(PASSENGER_LINE_SHEETS.filter(s => s.line === '83' && s.labels.length >= 90).every(s => !s.drawing)).toBe(true)
  expect(PASSENGER_LINE_SHEETS.some(s => s.line === '63' && s.drawing)).toBe(false)
})

it('offers the 80 drawing for Diamalaye → Keur Massar, not a return bus, a boarding time or a calculated trip', () => {
  const a = point('aftu-diamalaye'), b = point('aftu-keur-massar'), q = { departAt: at, modes: ['aftu'] as const }
  const source = documentedDirections(a,b,q).find(d => d.line === 'AFTU 80')!
  expect(source.drawing?.meters).toBe(32885); expect(source.window).toBeNull()
  expect(documentedDirections(b,a,q).some(d => d.line === 'AFTU 80')).toBe(false)
  expect(planDakarJourney(a,b,q).ok).toBe(false)
})
