// @vitest-environment jsdom
import { cleanup, fireEvent, render, within, act, waitFor } from '@testing-library/react'
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
    const variants = Array.from(row.querySelectorAll('.station-board-line-direction'))
    expect(variants.length).toBeGreaterThan(0)
    expect(variants.every((variant) => variant.querySelectorAll('.station-board-line-direction-detail').length === 2)).toBe(true)
    expect(within(row).getAllByText('10 min')).toHaveLength(variants.length * 2)
    expect(lineButtons[0].getAttribute('aria-expanded')).toBe('true')
  })

  it('n’affiche qu’une seule fiche pour une ligne appelée AFTU ou Tata', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)

    const lineButtons = getLineButtons(container, '65')
    expect(lineButtons).toHaveLength(1)
    fireEvent.click(lineButtons[0])
    const row = lineButtons[0].closest('li')!
    const routeCards = Array.from(row.querySelectorAll('.station-board-line-direction'))
    expect(routeCards).toHaveLength(1)
    expect(routeCards[0].querySelectorAll('.station-board-line-direction-detail')).toHaveLength(2)
    expect(routeCards[0].textContent).not.toContain('AFTU ·')
    expect(routeCards[0].textContent).not.toContain('TATA ·')
    await waitFor(() => expect(routeCards[0].querySelector('.station-board-line-direction-inbound .station-board-itinerary-list')).toBeTruthy())
  })
  it('ne crée jamais une deuxième fiche à partir des anciens enregistrements TATA', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    for (const line of ['1', '2', '24', '35', '60', '61', '73', '79', '82', '84']) {
      const buttons = getLineButtons(container, line)
      expect(buttons).toHaveLength(1)
      fireEvent.click(buttons[0])
      const row = buttons[0].closest('li')!
      await waitFor(() => {
        expect(row.querySelectorAll('.station-board-line-direction')).toHaveLength(1)
        expect(row.querySelectorAll('.station-board-line-direction-detail')).toHaveLength(2)
      })
      expect(row.textContent).not.toContain('TATA ·')
      fireEvent.click(buttons[0])
    }
  })

  it('place une séquence dans le sens prouvé par ses terminus, sans la renverser', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const button = getLineButtons(container, '24')[0]
    expect(button).toBeTruthy()
    fireEvent.click(button)
    const row = button.closest('li')!
    await waitFor(() => {
      expect(row.querySelector('.station-board-line-direction-inbound .station-board-itinerary-list')).toBeTruthy()
    })
    const outbound = row.querySelector('.station-board-line-direction-outbound .station-board-itinerary-list')
    const inbound = row.querySelector('.station-board-line-direction-inbound .station-board-itinerary-list')
    expect(outbound).toBeNull()
    expect(inbound?.firstElementChild?.textContent).toContain('Notaire')
    expect(inbound?.lastElementChild?.textContent).toContain('Université Cheikh Anta Diop')
  })

  it('ne publie pas une séquence isolée dont les terminus contredisent la fiche', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const button = getLineButtons(container, '1')[0]
    fireEvent.click(button)
    const row = button.closest('li')!
    expect(row.querySelector('.station-board-line-direction-outbound .station-board-itinerary-list')).toBeNull()
    expect(row.querySelector('.station-board-line-direction-inbound .station-board-itinerary-list')).toBeNull()
  })

  it('classe la séquence de la ligne 82 en Retour quand ses terminus sont inversés', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const button = getLineButtons(container, '82')[0]
    fireEvent.click(button)
    const row = button.closest('li')!
    await waitFor(() => {
      expect(row.querySelector('.station-board-line-direction-inbound .station-board-itinerary-list')).toBeTruthy()
    })
    expect(row.querySelector('.station-board-line-direction-outbound .station-board-itinerary-list')).toBeNull()
    const inbound = row.querySelector('.station-board-line-direction-inbound .station-board-itinerary-list')
    expect(inbound?.firstElementChild?.textContent).toContain('Comico')
    expect(inbound?.lastElementChild?.textContent).toContain('Lat Dior')
  })

  it('affiche les séquences AFTU validées séparément à l’aller et au retour', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const expected = [
      { line: '83', outbound: 93, inbound: 90 },
      { line: '84', outbound: 73, inbound: 73 },
      { line: '86', outbound: 68, inbound: 64 },
      { line: '87', outbound: 68, inbound: 71 },
      { line: '88', outbound: 78, inbound: 81 },
      { line: '89', outbound: 55, inbound: 53 },
      { line: '90', outbound: 82, inbound: 82 },
      { line: '91', outbound: 70, inbound: 70 },
    ]

    for (const item of expected) {
      const button = getLineButtons(container, item.line)[0]
      expect(button).toBeTruthy()
      fireEvent.click(button)
      const row = button.closest('li')!
      await waitFor(() => {
        const variants = Array.from(row.querySelectorAll('.station-board-line-direction'))
        const aftuVariant = variants.find((variant) => variant.textContent?.includes('AFTU ·')) ?? variants[0]
        expect(aftuVariant?.querySelectorAll('.station-board-line-direction-outbound .station-board-itinerary-list li')).toHaveLength(item.outbound)
        expect(aftuVariant?.querySelectorAll('.station-board-line-direction-inbound .station-board-itinerary-list li')).toHaveLength(item.inbound)
      })
      const variants = Array.from(row.querySelectorAll('.station-board-line-direction'))
      const aftuVariant = variants.find((variant) => variant.textContent?.includes('AFTU ·')) ?? variants[0]
      const outbound = aftuVariant.querySelector('.station-board-line-direction-outbound .station-board-itinerary-list')!.textContent
      const inbound = aftuVariant.querySelector('.station-board-line-direction-inbound .station-board-itinerary-list')!.textContent
      expect(outbound).not.toBe(inbound)
      fireEvent.click(button)
    }
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
    expect(after.length).toBeGreaterThanOrEqual(2)
    for (let index = 0; index < after.length; index += 2) expect(after[index]).toBe(after[index + 1])
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
    const variants = row.querySelectorAll('.station-board-line-direction').length
    expect(within(row).getAllByText('Reprise dans 26 min')).toHaveLength(variants * 2)
    expect(within(row).getAllByText('Reprise à 06:00')).toHaveLength(variants * 2)
  })

  it('affiche une seule ligne par numéro sans séparer les appellations AFTU et Tata', () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const groups = Array.from(container.querySelectorAll('.station-board-line-group'))
    const codes = groups.map((group) => group.getAttribute('data-line-code'))
    expect(groups).toHaveLength(73)
    expect(new Set(codes).size).toBe(73)
    expect(container.querySelectorAll('.station-board-line-toggle')).toHaveLength(73)
    expect(container.querySelectorAll('.station-board-line-toggle strong').length).toBe(73)
    expect(container.textContent).not.toContain('AFTU / TATA 2B')
  })
})
