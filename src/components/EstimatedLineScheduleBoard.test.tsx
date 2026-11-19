// @vitest-environment jsdom
import { cleanup, fireEvent, render, within, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EstimatedLineScheduleBoard } from './EstimatedLineScheduleBoard'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function getDirectionButtons(container: HTMLElement, line: string): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('.station-board-direction-toggle'))
    .filter((button) => button.querySelector('.station-board-stop strong')?.textContent?.trim() === `AFTU / TATA ${line}`)
}

describe('affiches de comptes à rebours DDD et AFTU / TATA', () => {
  it('reprend exactement la présentation directionnelle DDD avec le compte à rebours et le +', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const buttons = getDirectionButtons(container, '5')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].querySelector('.station-board-stop small')?.textContent).toContain('Aller ·')
    expect(buttons[1].querySelector('.station-board-stop small')?.textContent).toContain('Retour ·')
    expect(buttons.every((button) => button.textContent?.includes('+'))).toBe(true)
    expect(buttons.every((button) => button.textContent?.includes('10 min'))).toBe(true)
    expect(container.querySelectorAll('.station-board-line-toggle')).toHaveLength(0)
    expect(container.textContent).not.toMatch(/Affiche horaire|Estimation|TransitByCity|Source|fréquence/i)
  })

  it('ouvre indépendamment les arrêts de l’aller et du retour sans mélanger les séquences', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const buttons = getDirectionButtons(container, '83')
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[0])
    const row = buttons[0].closest('li')!
    await waitFor(() => expect(row.querySelectorAll('.station-board-itinerary-list li').length).toBe(93))
    const outbound = row.querySelector('.station-board-itinerary-list')!.textContent
    fireEvent.click(buttons[1])
    await waitFor(() => expect(row.querySelectorAll('.station-board-itinerary-list li').length).toBe(90))
    const inbound = row.querySelector('.station-board-itinerary-list')!.textContent
    expect(outbound).not.toBe(inbound)
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false')
    expect(buttons[1].getAttribute('aria-expanded')).toBe('true')
  })

  it('ne réattribue pas le fichier 85-unverified par numéro lors du chargement différé', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const ready = getDirectionButtons(container, '83')[0]
    fireEvent.click(ready)
    await waitFor(() => expect(ready.closest('li')!.querySelectorAll('.station-board-itinerary-list li')).toHaveLength(93))
    const quarantine = getDirectionButtons(container, '85')
    expect(quarantine).toHaveLength(2)
    for (const button of quarantine) {
      fireEvent.click(button)
      expect(button.closest('li')!.textContent).not.toMatch(/Terminus De La Ligne 73|Baye Ly Lac Rose/i)
      expect(button.closest('li')!.querySelector('.station-board-itinerary-list')).toBeNull()
      expect(button.textContent).toContain('Repère réseau')
    }
  })

  it('ne prête pas les horaires de Fass Mbao à la fiche Sahm–Comico du même numéro 58', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const ready = getDirectionButtons(container, '83')[0]
    fireEvent.click(ready)
    await waitFor(() => expect(ready.closest('li')!.querySelectorAll('.station-board-itinerary-list li')).toHaveLength(93))
    const variants = getDirectionButtons(container, '58')
    expect(variants).toHaveLength(2)
    for (const button of variants) {
      expect(button.textContent).toMatch(/Comico/i)
      expect(button.textContent).toContain('Repère réseau')
      fireEvent.click(button)
      expect(button.closest('li')!.textContent).not.toMatch(/Terminus Fass Mbao/)
    }
  })

  it('isole le parcours AFTU 74 des horaires Rufisque–Tivaouane Peul et du retour retourné à la main', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const buttons = getDirectionButtons(container, '74')
    for (const button of buttons) expect(button.querySelector('.station-board-passage strong')?.textContent).toBe('Non confirmé')
    fireEvent.click(buttons[0]); const row = buttons[0].closest('li')!
    await waitFor(() => expect(row.querySelectorAll('.station-board-itinerary-list li')).toHaveLength(14))
    expect(row.querySelector('.station-board-itinerary-list')?.textContent).toMatch(/Bargny.*Colobane.*Jaxaay.*Keur Massar.*COCEHAS/i)
    fireEvent.click(buttons[1]); expect(row.querySelector('.station-board-itinerary-list')).toBeNull()
    expect(row.textContent).toContain('Retour non confirmé')
  })

  it('montre les 17 repères publiés de la 80 sans annoncer le retour inversé ni un passage réseau', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const buttons = getDirectionButtons(container, '80')
    for (const b of buttons) expect(b.querySelector('[role="status"] strong')?.textContent).toBe('Non confirmé')
    fireEvent.click(buttons[0]); const row = buttons[0].closest('li')!
    await waitFor(() => expect(row.querySelectorAll('.station-board-itinerary-list li')).toHaveLength(17))
    expect(row.querySelector('.station-board-itinerary-list')?.textContent).toMatch(/Diamalaye.*Keur Massar.*Darou Thioub/)
    fireEvent.click(buttons[1]); expect(row.querySelector('.station-board-itinerary-list')).toBeNull()
    expect(row.textContent).toContain('Retour non confirmé')
  })

  it('n’affiche qu’une seule représentation par sens pour chaque numéro de ligne unifié', () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const groups = Array.from(container.querySelectorAll('.station-board-line-group'))
    const codes = groups.map((group) => group.getAttribute('data-line-code'))
    expect(new Set(codes).size).toBe(codes.length)
    expect(container.querySelectorAll('.station-board-direction-toggle')).toHaveLength(146)
    expect(container.textContent).not.toContain('AFTU ·')
    expect(container.textContent).not.toContain('TATA ·')
  })

  it('classe une séquence dont les terminus sont inversés dans le sens Retour uniquement', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const buttons = getDirectionButtons(container, '24')
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[1])
    const row = buttons[1].closest('li')!
    await waitFor(() => expect(row.querySelector('.station-board-itinerary-list')).toBeTruthy())
    const stops = row.querySelector('.station-board-itinerary-list')!
    expect(stops.firstElementChild?.textContent).toContain('Notaire')
    expect(stops.lastElementChild?.textContent).toContain('Université Cheikh Anta Diop')
    expect(row.querySelectorAll('.station-board-itinerary-list')).toHaveLength(1)
  })

  it('ne publie pas une séquence isolée dont les terminus contredisent la fiche', async () => {
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const buttons = getDirectionButtons(container, '1')
    fireEvent.click(buttons[0])
    const row = buttons[0].closest('li')!
    await waitFor(() => expect(row.querySelector('.station-board-itinerary-pending')).toBeTruthy())
    expect(row.querySelector('.station-board-itinerary-list')).toBeNull()
  })

  it('annonce la reprise avant le premier départ sans compte à rebours vert', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T05:34:00.000Z'))
    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const buttons = getDirectionButtons(container, '5')
    expect(buttons).toHaveLength(2)
    expect(buttons.every((button) => button.textContent?.includes('Reprise dans 26 min'))).toBe(true)
    expect(buttons.every((button) => button.textContent?.includes('Reprise à 06:00'))).toBe(true)
    expect(container.querySelectorAll('.station-board-passage.is-upcoming')).toHaveLength(106)
  })

  it('conserve la présentation habituelle des lignes DDD', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))
    const { container } = render(<EstimatedLineScheduleBoard network="ddd" />)
    const dddOne = Array.from(container.querySelectorAll('.station-board-direction-toggle')).filter((button) => button.querySelector('.station-board-stop strong')?.textContent === 'DDD 1')
    expect(dddOne).toHaveLength(2)
    expect(within(dddOne[0].closest('li')!).getAllByText('10 min')).toHaveLength(1)
  })
})
