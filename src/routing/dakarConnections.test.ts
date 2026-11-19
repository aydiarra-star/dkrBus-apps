import { expect, it } from 'vitest'
import { extractJourneyRequest } from '../domain/assistant'
import { getCorridorStop } from '../domain/corridors'
import { copilotAnswer } from '../domain/copilot'
import { createConversationMemory } from '../domain/conversation'
import { JOURNEY_LANDMARKS } from '../domain/journeyLandmarks'
import { buildStopIndex, searchStopIndex } from '../domain/stops'
import { passengerLookup } from './answers'
import { dakarNetwork, planDakarJourney } from './dakar'
import { documentedDirections } from './documentedDirections'

const at = (hhmm: string, day = '2026-11-18') => Date.parse(`${day}T${hhmm}:00Z`) / 1000
const settings = { departAt: at('19:00'), stepFreeOnly: false }
const landmark = (key: string) => {
  const p = JOURNEY_LANDMARKS.find(l => l.id === `landmark:${key}`)!
  return { label: p.name, kind: 'map' as const, landmarkId: p.id, lat: p.lat, lng: p.lon }
}
const stop = (id: string) => { const s = getCorridorStop(id)!; return { label: s.name, stopId: id, lat: s.lat, lng: s.lon } }
const yoff = landmark('yoff'), massar = landmark('keur-massar')

it('makes every geolocated map reference selectable without assigning a transit stop ID', () => {
  const index = buildStopIndex([], dakarNetwork.places.values())
  for (const p of JOURNEY_LANDMARKS) {
    expect(extractJourneyRequest(`De la gare TER de Dakar à ${p.name}`, 'passenger')?.destination.landmarkId, p.name).toBe(p.id)
    expect(searchStopIndex(index, p.name).find(o => o.value === p.id)).toMatchObject({ kind: 'landmark', stopId: null, lat: p.lat, lon: p.lon })
  }
  expect(extractJourneyRequest('De Yoff à Keur Massar', 'passenger')).toMatchObject({ origin: { landmarkId: yoff.landmarkId }, destination: { landmarkId: massar.landmarkId, lat: 14.79, lon: -17.31 } })
  expect(extractJourneyRequest('De Yoff à la gare TER de Keur Mbaye Fall', 'passenger')?.destination.stopId).toBe('ter-mbao')
  expect(extractJourneyRequest('De Yoff à TATA Keur Massar', 'passenger')?.destination.stopId).toBe('tata-keur-massar')
  expect(searchStopIndex(index, 'keur massar').map(o => o.stopId)).not.toContain('ter-mbao')
})

it('Yoff → Keur Massar at 19:00 Dakar: two missing walks and an ordered documentary lead, never a ride or transfer', () => {
  // The locality in the form, either catalogue pole and the screenshot pin all
  // refer to the same destination coordinates, not a 66 stop or a TER station.
  for (const from of [yoff, stop('aftu-yoff')]) for (const to of [massar, stop('ddd-keur-massar'), stop('aftu-keur-massar'), { kind: 'map' as const, lat: 14.7900, lng: -17.3100 }]) {
    const r = planDakarJourney(from, to, settings)
    if (r.ok) throw Error('Fictitious door-to-door journey')
    expect(r.message).toContain('Accès à pied'); expect(r.message).toContain('Marche finale')
    expect(r.connections).toEqual({ radiusM: 1200, boardingCount: 0, alightingCount: 0, sections: [] })
    expect(r.documentation?.map(d => d.line)).toEqual(['AFTU 66'])
    expect(r.documentation?.[0]).toMatchObject({ fromLabel: 'Marche De Yoff', toLabel: 'Carrefour Keur Massar', url: expect.stringMatching(/18051499-0$/), window: expect.stringContaining('04:50–20:50') })
    expect(r).not.toHaveProperty('options')
  }
})

it('uses independently sourced orders, the date in Dakar and selected modes; never guesses the place of an arbitrary pin', () => {
  const notes = (s: typeof settings) => documentedDirections(yoff, massar, s)
  expect(documentedDirections(massar, yoff, settings)[0]).toMatchObject({ fromLabel: 'Carrefour Keur Massar', toLabel: 'Marche De Yoff', url: expect.stringMatching(/18051499-1$/), window: expect.stringContaining('04:45–20:45') })
  expect(notes({ ...settings, departAt: at('19:00', '2026-11-21') })[0].window).toContain('05:00–21:00')
  expect(notes({ ...settings, departAt: at('21:10') })[0].window).toContain('hors de la plage')
  for (const day of ['2026-12-25', '2027-11-18']) expect(notes({ ...settings, departAt: at('19:00', day) })[0].window).toMatch(/aucune plage/i)
  for (const modes of [['ddd'], ['tata'], []] as const) expect(documentedDirections(yoff, massar, { ...settings, modes })).toEqual([])
  expect(notes({ ...settings, stepFreeOnly: true })).toEqual([])
  expect(documentedDirections(stop('ddd-grand-yoff'), massar, settings)).toEqual([])
  expect(documentedDirections({ ...yoff, lat: 14.702 }, massar, settings)).toEqual([])
  expect(documentedDirections({ ...yoff, landmarkId: undefined, lat: 14.762 }, massar, settings)).toEqual([])
  expect(documentedDirections(landmark('noflaye'), landmark('sangalkam'), settings).map(x => x.line)).toContain('DDD 208')
  expect(documentedDirections(landmark('sangalkam'), landmark('noflaye'), settings).map(x => x.line)).not.toContain('DDD 208')
})

it('keeps manual confirmation tied to the documented direction, the requested time in Dakar and the right operator', () => {
  const [reverse] = documentedDirections(massar, yoff, { ...settings, departAt: at('00:15', '2026-11-19') })
  expect(reverse.question).toMatch(/19 novembre 2026 vers 00:15.*ligne 66.*« Carrefour Keur Massar » puis « Marche De Yoff »/)
  expect(reverse.url).toMatch(/18051499-1$/)
  expect(reverse.officialLineUrl).toBe('https://aftu-senegal.org/map/dakar-urbain-ligne-66/')
  const ddd = documentedDirections(landmark('noflaye'), landmark('sangalkam'), settings).find(d => d.line === 'DDD 208')!
  expect(ddd.operator).toMatchObject({ name: 'Dakar Dem Dikk', phone: '+221 33 824 10 10' })
  expect(ddd.officialLineUrl).toBeUndefined() // No AFTU link for a DDD service
  expect(ddd.window).toBeNull()
})

it('finds real B1 sections for a locality with no certified walk, but only between stops and at a feasible service time', () => {
  const from = landmark('guediawaye-ddd-220'), to = stop('brt-petersen')
  const r = planDakarJourney(from, to, settings)
  if (r.ok) throw Error('Missing first mile')
  expect(r.message).not.toContain('Marche finale')
  expect(r.connections?.sections.map(s => [s.from.id, s.to.id])).toEqual([['brt-prefecture-guediawaye', to.stopId], ['brt-gueule-tapee', to.stopId]])
  const first = r.connections!.sections[0]
  expect(first).toMatchObject({ lines: ['B1'], toGapM: null, changes: 0, boardAt: at('19:00'), arriveAt: at('19:52') + 43 })
  expect(first.fromGapM).toBeCloseTo(115.3, 0)
  const late = planDakarJourney(from, to, { departAt: at('23:00') })
  expect(!late.ok && late.connections?.sections).toEqual([])
  const reversed = planDakarJourney(to, from, settings)
  expect(!reversed.ok && reversed.connections?.sections.map(s => [s.from.id, s.to.id])).toEqual([['brt-petersen', 'brt-gueule-tapee']])
  // Actually choosing the newly proposed endpoint starts a distinct question.
  expect(planDakarJourney(stop(first.from.id), to, settings)).toMatchObject({ ok: true, options: [{ walkMeters: 0, rideSeconds: 3163 }] })
})

it('keeps the passenger assistant on the same named points and never remembers the 66 as a journey', () => {
  const ctx = { passengerRoute: passengerLookup(settings), adminOnline: false, publishedAvailable: false }
  const m = createConversationMemory()
  const ask = (q: string) => copilotAnswer(q, ctx, m, 'fr')
  const reply = ask('Trajet de Yoff à Keur Massar')
  expect(reply.text).toContain('AFTU 66'); expect(reply.text).toContain('pas un trajet'); expect(reply.text).toContain('+221 33 859 02 88')
  expect(m.lastJourney).toBeNull(); expect(reply.journey?.destination.landmarkId).toBe(massar.landmarkId)
  expect(ask('Et en sens inverse ?').text).toContain('04:45–20:45')
  expect(m.lastJourney).toBeNull()
})

it('keeps the requested landmark role and namespace through a short reply and Wolof journey parsing', () => {
  const ctx = { passengerRoute: passengerLookup(settings), adminOnline: false, publishedAvailable: false }
  for (const [lang, qs] of [
    ['fr', ['Je veux aller à Keur Massar', 'Yoff']], ['fr', ['Je suis à Yoff', 'Je vais à Keur Massar']],
    ['wo', ['jóge Yoff dem Keur Massar']], ['wo', ['naka laay def ngir dem Keur Massar, sama jóge Yoff']],
    ['wo', ['jóge Yoff', 'dem Keur Massar']],
  ] as const) {
    const m = createConversationMemory()
    const replies = qs.map(q => copilotAnswer(q, ctx, m, lang))
    expect(replies.at(-1)?.journey, qs.join(' / ')).toMatchObject({ origin: { landmarkId: yoff.landmarkId }, destination: { landmarkId: massar.landmarkId } })
    expect(replies.at(-1)?.text).toContain('Carrefour Keur Massar'); expect(m.lastJourney).toBeNull()
  }
})

it('never shortens an unlocated market, junction or road label to the neighbourhood inside its name', () => {
  const index = buildStopIndex([], dakarNetwork.places.values())
  for (const name of ['Marché de Yoff', 'Carrefour Keur Massar', 'Route De Bambilor / Route De Keur Massar']) {
    expect(searchStopIndex(index, name)[0]).toMatchObject({ kind: 'sheet', selectable: false, lat: null, stopId: null })
  }
  const ctx = { passengerRoute: passengerLookup(settings), adminOnline: false, publishedAvailable: false }
  for (const [lang, q] of [['fr', 'Trajet du Marché de Yoff au Carrefour Keur Massar'], ['wo', 'jóge Marché de Yoff dem Carrefour Keur Massar']] as const) {
    const m = createConversationMemory(); copilotAnswer('Trajet de Dakar à Pikine', ctx, m, 'fr')
    expect(m.lastJourney).not.toBeNull()
    const r = copilotAnswer(q, ctx, m, lang)
    expect(r.journey).toBeUndefined(); expect(r.text).toContain('Carrefour Keur Massar'); expect(m.lastJourney).toBeNull()
  }
})
