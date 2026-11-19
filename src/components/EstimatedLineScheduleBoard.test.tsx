// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fixtureNetwork } from '../test/passengerTransferFixture'
import { EstimatedLineScheduleBoard } from './EstimatedLineScheduleBoard'

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-19T07:40:00Z')) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })
const buttons = (c: HTMLElement, code: string) => [...c.querySelectorAll<HTMLButtonElement>(`[data-line-code="${code}"] .station-board-direction-toggle`)]
const opened = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('.bus-occurrences li')]
const value = (r: Element) => r.querySelector('[role=timer] strong')!.textContent!
const strictlyPositive = /^[1-9]\d* min$/

describe('panneaux voyageurs des bus', () => {
  it('affiche une minute verte à chaque occurrence, se réveille sans clic, et distingue arrivée et départ', async () => {
    vi.setSystemTime(new Date('2026-11-19T05:50:00Z'))
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const [a,b] = buttons(container,'84'); fireEvent.click(b)
    const rows = opened(container); expect(rows).toHaveLength(73)
    expect(rows.map(r => r.querySelector('.bus-rank')!.textContent)).toEqual(Array.from({ length:73 },(_,i) => `${i+1}.`))
    for (const r of rows) { expect(value(r)).toMatch(strictlyPositive); expect(r.querySelector('.station-board-double-apostrophe')).not.toBeNull() }
    expect(rows[0].textContent).toContain('Delafosse Commerce'); expect(rows.at(-1)?.textContent).toContain('Arrivée au terminus')
    expect([2,3,72].map(i => value(rows[i]))).toEqual(['1 min','1 min','79 min'])
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect([2,3,72].map(i => value(rows[i]))).toEqual(['14 min','14 min','78 min'])
    fireEvent.click(a); expect(b.getAttribute('aria-expanded')).toBe('false'); expect(opened(container)[0].textContent).toContain('Jaxaay 2 Pénitence')
    expect(container.textContent).not.toMatch(/\b0 min|moins d.une minute|\bFCFA\b|temps réel/i)
  })
  it('conserve les deux listes CETUD (93/90), y compris les libellés répétés et le vrai terminus', () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const [out,back] = buttons(container,'83'); fireEvent.click(out); expect(opened(container)).toHaveLength(93)
    const start = opened(container)[0].textContent; fireEvent.click(back); expect(opened(container)).toHaveLength(90)
    expect(opened(container)[0].textContent).not.toBe(start); expect(container.querySelectorAll('.bus-occurrences')).toHaveLength(1)
  })
  it('laisse Banoba sans minutes et maintient la grille de Fass Mbao sur sa propre variante, jamais sur Comico', () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    for (const b of [...buttons(container,'85'), ...buttons(container,'58').slice(0,2)]) {
      expect(value(b)).toBe('—'); fireEvent.click(b); expect(opened(container)).toHaveLength(0)
      expect(container.querySelector('.bus-occurrences')!.textContent).not.toMatch(/Baye Ly Lac Rose|Terminus Fass Mbao/i)
    }
    const variants = buttons(container,'58').slice(2); expect(variants).toHaveLength(2)
    for (const [i,b] of variants.entries()) { expect(value(b)).toMatch(strictlyPositive); fireEvent.click(b); expect(opened(container)).toHaveLength(i ? 43 : 39) }
  })
  it.each([['74',14,/Bargny.*Colobane.*Jaxaay.*Keur Massar.*COCEHAS/i],['80',17,/Diamalaye.*Keur Massar.*Darou Thioub/i]] as const)('modélise uniquement les repères publiés de la %s', (code,n,route) => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const [out,back] = buttons(container,code); expect(value(out)).toMatch(strictlyPositive); expect(value(back)).toBe('—')
    fireEvent.click(out); expect(opened(container)).toHaveLength(n); expect(container.querySelector('.bus-occurrences')?.textContent).toMatch(route)
    expect(container.querySelector('.bus-occurrences-head')!.textContent).toContain(`${n} repères`)
    fireEvent.click(back); expect(opened(container)).toHaveLength(0); expect(container.querySelector('.bus-occurrences')!.textContent).toContain('Retour non confirmé')
  })
  it('filtre par numéro exact ou par arrêt, sépare TATA et AFTU et ne réutilise pas une grille homonyme', () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const find = within(container).getByRole('searchbox'); expect(container.querySelectorAll('[data-family=aftu]')).toHaveLength(73)
    fireEvent.change(find,{target:{value:'84'}}); expect(container.querySelectorAll('[data-line-code]')).toHaveLength(1)
    expect(value(buttons(container,'84')[0])).toMatch(strictlyPositive)
    fireEvent.click(within(container).getByRole('button',{name:'TATA'})); expect(value(buttons(container,'84')[0])).toBe('—')
    fireEvent.change(find,{target:{value:''}}); expect(container.querySelectorAll('[data-family=tata]')).toHaveLength(65)
    fireEvent.change(find,{target:{value:'mbeubeuss'}}); expect(buttons(container,'59')).toHaveLength(2)
    fireEvent.click(buttons(container,'59')[0]); expect(opened(container)).toHaveLength(14); expect(value(opened(container)[0])).toMatch(strictlyPositive)
    expect(opened(container)[0].textContent).toContain('Stade L.S.S'); expect(opened(container).at(-1)?.textContent).toContain('Mbarou Samba Dème')
  })
  it('ouvre TO1 pour son autre identifiant sans doubler les rangs ni emprunter le TAF TAF aéroport', () => {
    const { container } = render(<EstimatedLineScheduleBoard network="ddd" />)
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
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    fireEvent.click(buttons(container,'24')[1]); expect(opened(container)[0].textContent).toContain('Notaire'); expect(opened(container).at(-1)?.textContent).toContain('Université Cheikh Anta Diop')
    const [index,,body] = buttons(container,'1'); fireEvent.click(index); expect(opened(container)).toHaveLength(0)
    fireEvent.click(body); expect(opened(container).at(-1)?.textContent).toMatch(/HLM Grand Médine/)
  })
  it('met une borne avant l’ouverture, sans arc vert ni attente réseau; après fermeture, ne projette pas demain', () => {
    vi.setSystemTime(new Date('2026-11-19T05:20:00Z'))
    const { container } = render(<EstimatedLineScheduleBoard network="ddd" />)
    const [a,b] = buttons(container,'1'); expect(value(a)).toBe('Dès 05:30'); expect(value(b)).toBe('Dès 06:30')
    expect(a.querySelector('svg')).toBeNull()
    vi.setSystemTime(new Date('2026-11-19T22:30Z')); act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(value(a)).toBe('Fin de service'); expect(value(b)).toBe('Fin de service'); expect(b.querySelector('svg')).toBeNull()
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
