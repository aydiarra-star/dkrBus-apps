// @vitest-environment jsdom
import { cleanup, render, screen, within, act, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EstimatedLineScheduleBoard } from './EstimatedLineScheduleBoard'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('affiches de comptes à rebours DDD et AFTU / TATA', () => {
  it('affiche le catalogue AFTU et fait diminuer automatiquement les seuls créneaux concordants', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const aftuFiveLabels = screen.getAllByText('AFTU / TATA 5')
    const row = aftuFiveLabels.map((label) => label.closest('li')!).find((candidate) => candidate.textContent?.includes('Petersen'))!
    expect(row).toBeTruthy()
    await waitFor(() => expect(within(row).getAllByText('10 min')).toHaveLength(2))
    const apostropheIcons = row.querySelectorAll('.station-board-double-apostrophe')
    expect(apostropheIcons.length).toBeGreaterThan(0)
    apostropheIcons.forEach((icon) => {
      const marks = icon.querySelectorAll('path')
      expect(marks).toHaveLength(2)
      expect(marks[0].getAttribute('d')).toMatch(/^M4 8 C/)
      expect(marks[1].getAttribute('d')).toMatch(/^M9 8 C/)
    })
    expect(within(row).getByText(/Aller ·/)).toBeTruthy()
    expect(within(row).getByText(/Retour ·/)).toBeTruthy()
    const aftuNinetyOneLabels = screen.getAllByText('AFTU / TATA 91')
    expect(aftuNinetyOneLabels[0].closest('li')).toBeTruthy()
    expect(container.querySelector('.station-board')).toBeTruthy()
    expect(container.querySelector('table')).toBeNull()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)

    const beforeTick = Array.from(row.querySelectorAll('.station-board-passage strong')).map((node) => node.textContent)
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    const afterTick = Array.from(row.querySelectorAll('.station-board-passage strong')).map((node) => node.textContent)
    expect(afterTick).toHaveLength(2)
    expect(afterTick[0]).toBe(afterTick[1])
    expect(afterTick).not.toEqual(beforeTick)
  })

  it('applique le même horaire AFTU / TATA aux itinéraires de même numéro, même si leurs terminus diffèrent', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const lineSixtyFive = screen.getAllByText('AFTU / TATA 65')
    const tataRow = lineSixtyFive.map((label) => label.closest('li')!)
      .find((candidate) => candidate.textContent?.includes('Gare routière de Colobane') && candidate.textContent?.includes('Jaxaay 2'))!
    const aftuRow = lineSixtyFive.map((label) => label.closest('li')!)
      .find((candidate) => candidate.textContent?.includes('Colobane') && candidate.textContent?.includes('Jaxaay'))!
    expect(tataRow).toBeTruthy()
    expect(aftuRow).toBeTruthy()
    const passageValues = (row: HTMLElement) => Array.from(row.querySelectorAll('.station-board-passage strong')).map((node) => node.textContent)
    expect(passageValues(tataRow)).toEqual(passageValues(aftuRow))
  })

  it('calcule le statut du retour selon sa propre plage de service', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-11-09T20:47:00.000Z'))

    render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const aftuSixtySix = screen.getAllByText('AFTU / TATA 66')[0].closest('li')!
    await waitFor(() => {
      expect(within(aftuSixtySix).getByText("Service terminé pour aujourd'hui")).toBeTruthy()
    })
    expect(within(aftuSixtySix).getByText('3 min')).toBeTruthy()
  })

  it('affiche les lignes DDD, sans fabriquer de créneau pour une ligne sans horaire concordant', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    render(<EstimatedLineScheduleBoard network="ddd" />)
    const dddOneLabels = screen.getAllByText('DDD 1')
    expect(dddOneLabels).toHaveLength(2)
    expect(within(dddOneLabels[0].closest('li')!).getAllByText('10 min')).toHaveLength(1)
    const dddSixLabels = screen.getAllByText('DDD 6')
    expect(dddSixLabels).toHaveLength(2)
    expect(within(dddSixLabels[0].closest('li')!).getAllByText('6 min')).toHaveLength(1)
  })

  it('annonce la reprise AFTU et TATA avant le premier départ, avec l’heure exacte', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T05:34:00.000Z'))

    const aftu = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const aftuFive = screen.getAllByText('AFTU / TATA 5')[0].closest('li')!
    expect(within(aftuFive).getAllByText('Reprise dans 26 min')).toHaveLength(2)
    expect(within(aftuFive).getAllByText('Reprise à 06:00')).toHaveLength(2)
    aftu.unmount()

    render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const tataThirtySeven = screen.getAllByText('AFTU / TATA 37')[0].closest('li')!
    expect(within(tataThirtySeven).getAllByText('Reprise dans 26 min')).toHaveLength(2)
    expect(within(tataThirtySeven).getAllByText('Reprise à 06:00')).toHaveLength(2)
  })

  it('annonce le début du service DDD comme actif à 05:34', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T05:34:00.000Z'))

    render(<EstimatedLineScheduleBoard network="ddd" />)
    const dddOne = screen.getAllByText('DDD 1')[0].closest('li')!
    expect(within(dddOne).getAllByText('6 min')).toHaveLength(1)
  })

  it('arrête chaque ligne AFTU à sa fin connue et plafonne les autres à 22:50', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-11-09T21:51:00.000Z'))

    const aftu = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const aftuFortyTwo = screen.getAllByText('AFTU / TATA 42')[0].closest('li')!
    await waitFor(() => expect(within(aftuFortyTwo).getAllByText("Service terminé pour aujourd'hui")).toHaveLength(2))
    expect(within(aftuFortyTwo).queryByText('En service')).toBeNull()
    aftu.unmount()

    vi.setSystemTime(new Date('2026-11-09T22:49:00.000Z'))
    const aftuFive = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const aftuFiveRow = screen.getAllByText('AFTU / TATA 5').map((label) => label.closest('li')!).find((candidate) => candidate.textContent?.includes('Petersen'))!
    expect(within(aftuFiveRow).getAllByText('1 min')).toHaveLength(2)
    expect(within(aftuFiveRow).getByText(/Aller ·/)).toBeTruthy()
    expect(within(aftuFiveRow).getByText(/Retour ·/)).toBeTruthy()
    aftuFive.unmount()

    vi.setSystemTime(new Date('2026-11-09T22:50:00.000Z'))
    render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const tataThirtySeven = screen.getAllByText('AFTU / TATA 37')[0].closest('li')!
    expect(within(tataThirtySeven).getAllByText("Service terminé pour aujourd'hui")).toHaveLength(2)
    expect(within(tataThirtySeven).queryByText('En service')).toBeNull()
  })

  it('affiche un seul catalogue AFTU / TATA et conserve la cadence partagée', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    const { container } = render(<EstimatedLineScheduleBoard network="aftu_tata" />)
    const tataThirtySevenLabels = screen.getAllByText('AFTU / TATA 37')
    expect(tataThirtySevenLabels).toHaveLength(4)
    expect(screen.queryByText('AFTU / TATA 2B')).toBeNull()
    expect(container.querySelectorAll('.station-board-line-group')).toHaveLength(126)
    expect(container.querySelectorAll('.station-board-row').length).toBeGreaterThan(124)
    expect(container.querySelectorAll('.station-board-passage strong').length).toBe(container.querySelectorAll('.station-board-row').length)
    const tataThirtySevenRow = tataThirtySevenLabels.map((label) => label.closest('li')!)
      .find((candidate) => candidate.textContent?.includes('Diamalaye') && candidate.textContent?.includes('Claudel'))!
    expect(within(tataThirtySevenRow).getAllByText('5 min')).toHaveLength(2)

    // AFTU 39 et TATA 39 gardent deux fiches : leurs séquences détaillées diffèrent.
    expect(screen.getAllByText('AFTU / TATA 39')).toHaveLength(4)
    expect(within(tataThirtySevenRow).getByText(/Aller ·/)).toBeTruthy()
    expect(within(tataThirtySevenRow).getByText(/Retour ·/)).toBeTruthy()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)
  })
})
