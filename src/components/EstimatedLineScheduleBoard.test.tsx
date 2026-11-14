// @vitest-environment jsdom
import { cleanup, fireEvent, render, within, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EstimatedLineScheduleBoard } from './EstimatedLineScheduleBoard'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function getLineButtons(container: HTMLElement, line: string): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('.station-board-line-toggle'))
    .filter((button) => button.querySelector('.station-board-stop strong')?.textContent?.trim() === `Ligne ${line}`)
}

describe('affiches de comptes à rebours DDD et AFTU / TATA', () => {
  it('présente une seule entrée par itinéraire AFTU / TATA et ouvre son affiche horaire', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)

    const lineButtons = getLineButtons(container, '5')
    expect(lineButtons.length).toBeGreaterThan(0)
    expect(lineButtons[0].textContent).toContain('Affiche horaire')
    expect(container.querySelector('.station-board')).toBeTruthy()
    expect(container.querySelector('table')).toBeNull()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence/i)

    fireEvent.click(lineButtons[0])
    const row = lineButtons[0].closest('li')!
    expect(within(row).getByText('Aller')).toBeTruthy()
    expect(within(row).getByText('Retour')).toBeTruthy()
    expect(within(row).getAllByText('10 min')).toHaveLength(2)
    expect(lineButtons[0].getAttribute('aria-expanded')).toBe('true')
  })

  it('applique la même référence horaire aux itinéraires AFTU / TATA portant le même numéro', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)

    const lineButtons = getLineButtons(container, '65')
    expect(lineButtons.length).toBeGreaterThan(0)
    const values = lineButtons.map((button) => {
      fireEvent.click(button)
      const row = button.closest('li')!
      return Array.from(row.querySelectorAll('.station-board-passage strong')).map((node) => node.textContent)
    })
    expect(values.every((pair) => pair.length === 2 && pair[0] === pair[1])).toBe(true)
  })

  it('fait diminuer ensemble les deux comptes à rebours AFTU / TATA', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const button = getLineButtons(container, '5')[0]
    expect(button).toBeTruthy()
    fireEvent.click(button)
    const row = button.closest('li')!
    const before = Array.from(row.querySelectorAll('.station-board-passage strong')).map((node) => node.textContent)
    act(() => vi.advanceTimersByTime(60_000))
    const after = Array.from(row.querySelectorAll('.station-board-passage strong')).map((node) => node.textContent)
    expect(after).toHaveLength(2)
    expect(after[0]).toBe(after[1])
    expect(after).not.toEqual(before)
  })

  it('affiche les lignes DDD dans leur présentation habituelle', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))
    const { container } = render(<EstimatedLineScheduleBoard network="ddd" />)
    const dddOneLabels = Array.from(container.querySelectorAll('.station-board-direction-toggle strong')).filter((node) => node.textContent === 'DDD 1')
    expect(dddOneLabels).toHaveLength(2)
    expect(within(dddOneLabels[0].closest('li')!).getAllByText('10 min')).toHaveLength(1)
    const dddSixLabels = Array.from(container.querySelectorAll('.station-board-direction-toggle strong')).filter((node) => node.textContent === 'DDD 6')
    expect(dddSixLabels).toHaveLength(2)
    expect(within(dddSixLabels[0].closest('li')!).getAllByText('6 min')).toHaveLength(1)
  })

  it('annonce la reprise AFTU / TATA avant le premier départ', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T05:34:00.000Z'))
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const button = getLineButtons(container, '5')[0]
    expect(button).toBeTruthy()
    fireEvent.click(button)
    const row = button.closest('li')!
    expect(within(row).getAllByText('Reprise dans 26 min')).toHaveLength(2)
    expect(within(row).getAllByText('Reprise à 06:00')).toHaveLength(2)
  })

  it('conserve le nombre réel d’itinéraires du catalogue unifié', () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    expect(container.querySelectorAll('.station-board-line-group')).toHaveLength(126)
    expect(container.querySelectorAll('.station-board-line-toggle')).toHaveLength(126)
    expect(container.querySelectorAll('.station-board-line-toggle strong').length).toBe(126)
    expect(container.textContent).not.toContain('AFTU / TATA 2B')
  })
})
