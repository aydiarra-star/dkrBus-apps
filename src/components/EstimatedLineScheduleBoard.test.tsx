// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BusSurveyNote } from './BusSurveyNote'
import { BUS_BOARD_LINES } from '../domain/busBoardCatalog'
import { fixtureNetwork } from '../test/passengerTransferFixture'
import { EstimatedLineScheduleBoard } from './EstimatedLineScheduleBoard'

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-19T07:40:00Z')) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })
const buttons = (c: HTMLElement, code: string) => [...c.querySelectorAll<HTMLButtonElement>(`[data-line-code="${code}"] .station-board-direction-toggle`)]
const opened = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('.bus-occurrences li')]
const value = (r: Element) => r.querySelector('.station-board-passage strong')!.textContent!
function withEstimates(node: React.ReactElement) {
  const r = render(node)
  fireEvent.click(within(r.container).getByRole('checkbox',{name:'Inclure les passages estimés'}))
  return r
}
const approximate = /^Vers \d{2}:\d{2}$/

describe('panneaux voyageurs des bus', () => {
  it('garde une heure indicative et le relevé non daté sans décompter les créneaux issus de la seule cadence', async () => {
    vi.setSystemTime(new Date('2026-11-19T05:50:00Z'))
    const { container } = withEstimates(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const [a,b] = buttons(container,'84'); fireEvent.click(b)
    const rows = opened(container); expect(rows).toHaveLength(73)
    expect(rows.map(r => r.querySelector('.bus-rank')!.textContent)).toEqual(Array.from({ length:73 },(_,i) => `${i+1}.`))
    for (const r of rows) { expect(value(r)).toMatch(approximate); expect(r.querySelector('time, [role=timer], .station-board-double-apostrophe')).toBeNull() }
    expect(rows[0].textContent).toContain('Delafosse Commerce'); expect(rows.at(-1)?.textContent).toContain('Arrivée au terminus')
    expect([2,3,72].map(i => value(rows[i]))).toEqual(['Vers 05:51','Vers 05:51','Vers 07:09'])
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect([2,3,72].map(i => value(rows[i]))).toEqual(['Vers 06:05','Vers 06:05','Vers 07:09'])
    fireEvent.click(a); expect(b.getAttribute('aria-expanded')).toBe('false'); expect(opened(container)[0].textContent).toContain('Jaxaay 2 Pénitence')
    expect(container.textContent).not.toMatch(/\b0 min|moins d.une minute|\bFCFA\b|temps réel/i)
  })
  it('conserve les deux listes CETUD (93/90), y compris les libellés répétés et le vrai terminus', () => {
    const { container } = withEstimates(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const [out,back] = buttons(container,'83'); fireEvent.click(out); expect(opened(container)).toHaveLength(93)
    const start = opened(container)[0].textContent; fireEvent.click(back); expect(opened(container)).toHaveLength(90)
    expect(opened(container)[0].textContent).not.toBe(start); expect(container.querySelectorAll('.bus-occurrences')).toHaveLength(1)
  })
  it('laisse Banoba sans minutes et maintient la grille de Fass Mbao sur sa propre variante, jamais sur Comico', () => {
    const { container } = withEstimates(<EstimatedLineScheduleBoard network="aftu_tata" />)
    for (const b of [...buttons(container,'85'), ...buttons(container,'58').slice(0,2)]) {
      expect(value(b)).toBe('—'); fireEvent.click(b); expect(opened(container)).toHaveLength(0)
      expect(container.querySelector('.bus-occurrences')!.textContent).not.toMatch(/Baye Ly Lac Rose|Terminus Fass Mbao/i)
    }
    const variants = buttons(container,'58').slice(2); expect(variants).toHaveLength(2)
    for (const [i,b] of variants.entries()) {
      expect(value(b)).toBe(i ? '15 min' : '2 min') // les prochaines origines imprimées à 07:40 sont 07:55 / 07:42
      fireEvent.click(b); expect(opened(container)).toHaveLength(i ? 43 : 39)
      expect(container.querySelectorAll('.bus-occurrences time')).toHaveLength(i ? 43 : 39)
      expect(opened(container)[i ? 42 : 0].textContent).toContain('Libellé local')
    }
  })
  it.each([['74',14,/Bargny.*Colobane.*Jaxaay.*Keur Massar.*COCEHAS/i],['80',17,/Diamalaye.*Keur Massar.*Darou Thioub/i]] as const)('modélise uniquement les repères publiés de la %s', (code,n,route) => {
    const { container } = withEstimates(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const [out,back] = buttons(container,code); expect(value(out)).toMatch(approximate); expect(value(back)).toBe('—')
    fireEvent.click(out); expect(opened(container)).toHaveLength(n); expect(container.querySelector('.bus-occurrences')?.textContent).toMatch(route)
    expect(container.querySelector('.bus-occurrences-head')!.textContent).toContain(`${n} repères`)
    fireEvent.click(back); expect(opened(container)).toHaveLength(0); expect(container.querySelector('.bus-occurrences')!.textContent).toContain('Retour non confirmé')
  })
  it('filtre par numéro exact ou par arrêt, sépare TATA et AFTU et ne réutilise pas une grille homonyme', () => {
    const { container } = withEstimates(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const find = within(container).getByRole('searchbox'); expect(container.querySelectorAll('[data-family=aftu]')).toHaveLength(73)
    fireEvent.change(find,{target:{value:'84'}}); expect(container.querySelectorAll('[data-line-code]')).toHaveLength(1)
    expect(value(buttons(container,'84')[0])).toMatch(approximate)
    fireEvent.click(within(container).getByRole('button',{name:'TATA'})); expect(value(buttons(container,'84')[0])).toBe('—')
    fireEvent.change(find,{target:{value:''}}); expect(container.querySelectorAll('[data-family=tata]')).toHaveLength(65)
    fireEvent.change(find,{target:{value:'mbeubeuss'}}); expect(buttons(container,'59')).toHaveLength(2)
    fireEvent.click(buttons(container,'59')[0]); expect(opened(container)).toHaveLength(14); expect(value(opened(container)[0])).toMatch(approximate)
    expect(opened(container)[0].textContent).toContain('Stade L.S.S'); expect(opened(container).at(-1)?.textContent).toContain('Mbarou Samba Dème')
  })
  it('ouvre TO1 pour son autre identifiant sans doubler les rangs ni emprunter le TAF TAF aéroport', () => {
    const { container } = withEstimates(<EstimatedLineScheduleBoard network="ddd" />)
    const box = within(container).getByRole('searchbox')
    for (const alias of ['TO1','DDD TAF_TAF_TO1','TAF TAF TO1']) {
      fireEvent.change(box,{ target:{ value:alias } }); expect(container.querySelectorAll('[data-line-code]')).toHaveLength(1)
      expect(buttons(container,'TO1')[0].textContent).toMatch(/Ouakam.*Palais 2/)
    }
    fireEvent.click(buttons(container,'TO1')[0]); expect(opened(container)).toHaveLength(10)
    fireEvent.change(box,{ target:{ value:'TAF TAF' } }); expect(buttons(container,'TAF_TAF')).toHaveLength(4)
    expect(container.textContent).toMatch(/AIBD/); expect(container.textContent).not.toMatch(/Palais 2/)
  })
  it('respecte la direction du texte quand le titre est dans l’autre sens et ne colle pas le texte sur une fiche en conflit', () => {
    const { container } = withEstimates(<EstimatedLineScheduleBoard network="aftu_tata" />)
    fireEvent.click(buttons(container,'24')[1]); expect(opened(container)[0].textContent).toContain('Notaire'); expect(opened(container).at(-1)?.textContent).toContain('Université Cheikh Anta Diop')
    const [index,,body] = buttons(container,'1'); fireEvent.click(index); expect(opened(container)).toHaveLength(0)
    fireEvent.click(body); expect(opened(container).at(-1)?.textContent).toMatch(/HLM Grand Médine/)
  })
  it('met une borne avant l’ouverture, sans arc vert ni attente réseau; après fermeture, ne projette pas demain', () => {
    vi.setSystemTime(new Date('2026-11-19T05:20:00Z'))
    const { container } = withEstimates(<EstimatedLineScheduleBoard network="ddd" />)
    const [a,b] = buttons(container,'1'); expect(value(a)).toBe('Vers 05:30'); expect(value(b)).toBe('Vers 06:30')
    expect(a.querySelector('svg')).toBeNull()
    vi.setSystemTime(new Date('2026-11-19T22:30Z')); act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(value(a)).toBe('Fin du modèle'); expect(value(b)).toBe('Fin du modèle'); expect(b.querySelector('svg')).toBeNull()
  })
  it('préfère la grille datée distincte en tête et ne montre plus l’édition de recherche d’hier', () => {
    const base = fixtureNetwork.patterns[0], origin = Date.parse('2026-11-19T07:42Z')/1000
    const times = { kind:'offsets' as const,source:'test',arrivals:[0,200],departures:[0,230] }
    const pattern = { ...base,mode:'ddd' as const,shape:{...base.shape,source:'REVIEWED_GTFS_SHAPE' as const},lineId:'gtfs:qa:w:0',name:'Bus de recette',times,arrivals:times.arrivals,departures:times.departures,service:{ kind:'timetable' as const,source:'qa',departures:[origin] } }
    const net = { ...fixtureNetwork,patterns:[pattern] }, published = { snapshot:'qa', day:'2026-11-19',network:net,rediscover:vi.fn() }
    const fetcher = vi.fn((_input: RequestInfo | URL) => Promise.resolve(new Response('{}',{status:404}))); vi.stubGlobal('fetch',fetcher)
    const { container } = render(<EstimatedLineScheduleBoard network="ddd" published={published} />)
    expect(container.querySelector('.bus-board-section-title')?.textContent).toBe('Horaires du jour'); expect(fetcher).not.toHaveBeenCalled()
    fireEvent.click(buttons(container,'Bus de recette')[0]); expect(opened(container).at(-1)?.textContent).toContain('Dès 07:45')
    vi.setSystemTime(new Date('2026-11-20T07:40Z')); act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(buttons(container,'Bus de recette')).toHaveLength(0); expect(fetcher.mock.calls[0]?.[0]).toContain('date=2026-11-20')
  })
})

it('counts the seconds of both directions and stop occurrences; sleeps when hidden and resyncs to the actual wall clock', () => {
  vi.setSystemTime(new Date('2026-11-19T19:00:01Z'))
  const { container, unmount } = render(<EstimatedLineScheduleBoard network="ddd" />)
  const [a, b] = buttons(container, '7').slice(2); fireEvent.click(a)
  const time = (el: Element) => Number(el.querySelector('time')!.dateTime.match(/^PT(\d+)S$/)![1])
  const rows = [a, b, ...opened(container)], before = rows.map(time)
  expect(before.every(s => s > 1)).toBe(true)
  expect(vi.getTimerCount()).toBe(1)
  act(() => vi.advanceTimersByTime(1000)); expect(rows.map(time)).toEqual(before.map(s => s - 1))
  fireEvent.click(b); expect(opened(container).length).toBeGreaterThan(0)
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  try {
    act(() => document.dispatchEvent(new Event('visibilitychange'))); expect(vi.getTimerCount()).toBe(0)
    vi.setSystemTime(new Date('2026-11-19T23:59:00Z')); hidden.mockReturnValue(false)
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect([value(a), value(b)]).toEqual(['Fin de service', 'Fin de service'])
    for (const el of [a, b, ...opened(container)]) expect(el.querySelector('time, svg.station-board-double-apostrophe')).toBeNull()
    unmount(); expect(vi.getTimerCount()).toBe(0)
  } finally { hidden.mockRestore() }
})


it('keeps the Patte d’Oie marker walk on the two nominated directions, without assigning either bus to a marker', () => {
  const { container, rerender } = render(<EstimatedLineScheduleBoard network="ddd" />)
  const note = () => Array.from(container.querySelectorAll('.bus-survey-note')).find(n => n.querySelector('summary')?.textContent === 'Changer à Patte d’Oie ?')
  const inspect = (code: string, side: number, qualifies: boolean) => {
    fireEvent.click(buttons(container, code)[side]); expect(Boolean(note())).toBe(qualifies)
    if (qualifies) {
      expect(note()?.querySelector('a')?.href).toBe('https://www.openstreetmap.org/way/639363334')
      expect(note()?.textContent).toContain('ne confirment pas cette correspondance')
      expect(note()?.querySelector('time')).toBeNull()
    }
  }
  inspect('218', 0, true); inspect('218', 1, false); inspect('218', 2, false)
  rerender(<EstimatedLineScheduleBoard network="aftu_tata" />)
  inspect('60', 0, false); inspect('60', 1, false)
  fireEvent.click(within(container).getByRole('button', {name:'TATA'}))
  inspect('60', 1, true); inspect('60', 0, false)
})

it('explains the departure and arrival at Thiaroye separately without a transfer countdown on either sheet', () => {
  const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
  const note = () => container.querySelector('.bus-occurrences .bus-survey-note')
  fireEvent.click(buttons(container,'73')[0]); expect(note()?.textContent).toContain('après Cem Thiaroye')
  expect(note()?.querySelector('a')?.href).toMatch(/18051511-1$/)
  expect(within(note() as HTMLElement).getByRole('link', {name:'Grille de la 73 vers Thiaroye'}).getAttribute('href')).toMatch(/4256342-0$/)
  expect(note()?.querySelector('time, [role="timer"]')).toBeNull()
  fireEvent.click(buttons(container,'73')[1]); expect(note()?.textContent).toContain('Le même quai n’est pas confirmé')
  expect(note()?.querySelector('a')?.href).toBe('https://aftu-senegal.org/map/dakar-urbain-ligne-73/')
  expect(within(note() as HTMLElement).getByRole('link', {name:'Grille de la 73 vers Lac Rose'}).getAttribute('href')).toMatch(/4256343-0$/)
  expect(note()?.querySelector('time, [role="timer"]')).toBeNull()
  fireEvent.click(within(container).getByRole('button',{name:'TATA'}))
  for (const b of buttons(container,'73')) { fireEvent.click(b); expect(note()).toBeNull() }
})

it('ne prête pas la note du dépôt à une autre source ni à une autre occurrence', () => {
  const [d] = BUS_BOARD_LINES.aftu.find(l => l.code === '73')!.directions
  for (const other of [{ ...d, source: 'autre variante' }, { ...d, clock: null },
    { ...d, points: [...d.points.slice(0,-2), 'Cem Thiaroye bis', d.points.at(-1)!] }]) {
    const { container, unmount } = render(<BusSurveyNote name="AFTU 73" d={other} />)
    expect(container.firstChild).toBeNull(); unmount()
  }
})


it('n’attribue à la 218 depuis Aéroport ni l’arrivée au dépôt ni un passage de la 73', () => {
  const { container } = render(<EstimatedLineScheduleBoard network="ddd" />)
  fireEvent.click(buttons(container,'218')[1]); const note = container.querySelector('.bus-survey-note')!
  expect(note.textContent).toContain('pas son arrivée au dépôt')
  expect(note.querySelector('time, [role="timer"]')).toBeNull()
  expect(opened(container)).toHaveLength(1)
  fireEvent.click(buttons(container,'218')[2]); expect(container.querySelector('.bus-survey-note')).toBeNull()
})

it('présente les heures source par défaut, avec les colonnes non datées sans faux compteur', () => {
  const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
  const toggle=within(container).getByRole('checkbox') as HTMLInputElement
  expect(toggle.checked).toBe(false)
  fireEvent.click(buttons(container,'84')[1]); expect(opened(container)).toHaveLength(73)
  expect(opened(container)[0].textContent).toMatch(/Relevé non daté : 05:49/);expect(opened(container).at(-1)?.textContent).toContain('07:09')
  expect(container.querySelector('.bus-occurrences time')).toBeNull()
  fireEvent.click(buttons(container,'42').at(-1)!);expect(opened(container)).toHaveLength(68);expect(container.querySelectorAll('.bus-occurrences time')).toHaveLength(68)
  fireEvent.click(buttons(container,'73')[0]);expect(container.querySelectorAll('.bus-occurrences time')).toHaveLength(75)
  fireEvent.click(toggle);expect(container.querySelectorAll('.bus-occurrences time')).toHaveLength(75)
  expect(container.querySelector('.bus-occurrences .bus-estimate')).toBeNull()
  expect(opened(container)[50].querySelector('strong')?.textContent).toBe('Arrêt De Bus')
  expect(opened(container)[51].querySelector('strong')?.textContent).toBe('École Boune')
  fireEvent.click(toggle);expect(container.querySelectorAll('.bus-occurrences time')).toHaveLength(75)
})

it('affiche les arrêts TATA cités par SETER en dehors des rangs et sans en déduire le sens ou une heure', () => {
  const {container} = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
  const view=within(container), query=view.getByRole('searchbox')
  fireEvent.change(query,{target:{value:'Librairie Clairafrique'}})
  expect(view.queryByText(/Arrêt cité par SETER/)).toBeNull()
  fireEvent.click(view.getByRole('button',{name:/^TATA$/}))
  const note=container.querySelector('[data-line-code="54"] details')!
  expect(note.textContent).toContain('Librairie Clairafrique'); expect(note.closest('.bus-occurrences')).toBeNull()
  expect(note.querySelectorAll('a')).toHaveLength(2); expect(note.querySelector('time,[role=timer]')).toBeNull()
  fireEvent.change(query,{target:{value:'Rond-point Petersen'}})
  for (const c of ['40','41','55']) expect(container.querySelector(`[data-line-code="${c}"] summary`)?.textContent).toContain('Petersen')
})

it('distingue une attente rapportée devant EMG d’un passage observé de la 67', () => {
  const {container}=render(<EstimatedLineScheduleBoard network="aftu_tata" />), view=within(container)
  fireEvent.click(view.getByRole('button',{name:/^TATA$/}))
  fireEvent.change(view.getByRole('searchbox'),{target:{value:'immeuble EMG'}})
  expect(container.querySelectorAll('[data-line-code]')).toHaveLength(1)
  const note=container.querySelector('[data-line-code="67"] details')!
  expect(note.querySelector('a')?.hostname).toBe('lesoleil.sn'); expect(note.textContent).toContain('pour Ouakam')
  expect(note.textContent).toContain('ni un passage observé'); expect(note.querySelector('time,[role=timer]')).toBeNull()
  expect(note.closest('.bus-occurrences')).toBeNull()
})
