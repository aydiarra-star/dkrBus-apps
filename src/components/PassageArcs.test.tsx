// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { EstimatedLineScheduleBoard } from './EstimatedLineScheduleBoard'
import { PassageArcs } from './PassageArcs'

vi.mock('./TransitMap', () => ({
  TransitMap: () => <div aria-label="Carte de test" />,
}))

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../App.css'), 'utf8')

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('PassageArcs', () => {
  it('trace un grand arc externe et un petit arc interne imbriqué à droite', () => {
    const { container } = render(<PassageArcs />)
    const svg = container.querySelector('svg.station-board-double-apostrophe')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 15 24')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('focusable')).toBe('false')

    const paths = Array.from(svg?.querySelectorAll('path') ?? [])
    expect(paths).toHaveLength(2)
    expect(paths[0].getAttribute('d')).toBe('M6.3 2.6 A13.6 13.6 0 0 0 6.3 21.4')
    expect(paths[1].getAttribute('d')).toBe('M11.9 8.6 A5.4 5.4 0 0 0 11.9 15.4')
  })

  it('applique les proportions et styles CSS exacts sur tous les écrans', () => {
    const match = /\.station-board-double-apostrophe\s*\{([^}]+)\}/.exec(css)
    expect(match).not.toBeNull()
    const rule = match![1]
    expect(rule).toContain('width: 0.5625em')
    expect(rule).toContain('height: 0.9em')
    expect(rule).toContain('fill: none')
    expect(rule).toContain('stroke: var(--passage-green)')
    expect(rule).toContain('stroke-width: 4.6')
    expect(rule).toContain('stroke-linecap: round')
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.station-board-double-apostrophe\s*\{\s*animation:\s*none;/)
  })

  it('garde les mêmes arcs TER/BRT et bus sur les minutes sourcées, jamais sur le résumé bus ni sur un modèle TATA', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T12:00:00.000Z'))
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 404, json: async () => ({ error: 'NOT_FOUND' }) })))

    const expectedSvgHtml = render(<PassageArcs />).container.querySelector('svg')!.outerHTML
    cleanup()

    const { container } = render(<App />)

    for (const network of ['ter', 'brt', 'ddd', 'aftu_tata'] as const) {
      const item = container.querySelector(`.network-item-${network}`)!
      const header = item.querySelector('.network-summary-header')!
      const summaryPassage = header.querySelector('.network-summary-passage strong')!
      const summaryIcon = summaryPassage.querySelector('svg.station-board-double-apostrophe')
      if (network === 'ter' || network === 'brt') {
        expect(summaryPassage.textContent).toMatch(/[1-9]\d* min/)
        expect(summaryIcon?.outerHTML).toBe(expectedSvgHtml)
      } else {
        expect(summaryPassage.textContent).toBe('Par arrêt')
        expect(header.querySelector('time, [role="timer"]')).toBeNull()
        expect(summaryIcon).toBeNull()
      }

      fireEvent.click(header)
      const board = item.querySelector('.station-board') as HTMLElement
      expect(board).toBeTruthy()
      const countdowns = Array.from(board.querySelectorAll('.station-board-passage strong'))
        .filter((strong) => /\d+ min/.test(strong.textContent ?? ''))
      expect(countdowns.length).toBeGreaterThan(0)
      for (const strong of countdowns) {
        expect(strong.querySelector('svg.station-board-double-apostrophe')?.outerHTML).toBe(expectedSvgHtml)
      }
      if (network === 'aftu_tata') {
        fireEvent.click(within(board).getByRole('button', {name:'TATA'}))
        expect(board.querySelectorAll('.station-board-double-apostrophe')).toHaveLength(0)
        fireEvent.click(within(board).getByRole('checkbox', {name:'Inclure les passages estimés'}))
        const estimates = Array.from(board.querySelectorAll('.bus-estimate strong'))
        expect(estimates.length).toBeGreaterThan(0)
        expect(estimates.every((strong) => strong.textContent === 'Projection non confirmée')).toBe(true)
        expect(board.querySelector('svg.station-board-double-apostrophe, time, [role="timer"]')).toBeNull()
      }
      fireEvent.click(header)
    }
  })

  it('affiche les arcs uniquement sur les créneaux actifs DDD et AFTU / TATA, jamais hors service', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T03:00:00.000Z'))
    const aftuClosed = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    expect(aftuClosed.container.querySelectorAll('.station-board-double-apostrophe')).toHaveLength(0)
    cleanup()

    vi.setSystemTime(new Date('2026-11-09T05:34:00.000Z'))
    const aftuUpcoming = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    for (const upcoming of aftuUpcoming.container.querySelectorAll('.station-board-passage.is-upcoming')) {
      expect(upcoming.querySelector('.station-board-double-apostrophe')).toBeNull()
    }
    cleanup()

    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))
    const expectedSvgHtml = render(<PassageArcs />).container.querySelector('svg')!.outerHTML
    cleanup()

    for (const network of ['ddd', 'aftu_tata'] as const) {
      const { container } = render(<EstimatedLineScheduleBoard network={network} />)
      const activeCountdowns = Array.from(container.querySelectorAll('.station-board-passage strong'))
        .filter((strong) => /\d+ min/.test(strong.textContent ?? ''))
      expect(activeCountdowns.length).toBeGreaterThan(0)
      for (const strong of activeCountdowns) {
        expect(strong.querySelector('svg.station-board-double-apostrophe')?.outerHTML).toBe(expectedSvgHtml)
      }
      const nonCountdowns = Array.from(container.querySelectorAll('.station-board-passage strong'))
        .filter((strong) => !/\d+ min/.test(strong.textContent ?? ''))
      for (const strong of nonCountdowns) {
        expect(strong.querySelector('svg.station-board-double-apostrophe')).toBeNull()
      }
      cleanup()
    }
  })
})
