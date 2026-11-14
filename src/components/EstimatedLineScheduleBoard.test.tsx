// @vitest-environment jsdom
import { cleanup, render, screen, within, act, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EstimatedLineScheduleBoard } from './EstimatedLineScheduleBoard'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('affiches de comptes à rebours DDD, AFTU et TATA', () => {
  it('affiche le catalogue AFTU et fait diminuer automatiquement les seuls créneaux concordants', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    const { container } = render(<EstimatedLineScheduleBoard network="aftu" />)
    const aftuFiveLabels = screen.getAllByText('AFTU 5')
    expect(aftuFiveLabels).toHaveLength(2)
    const row = aftuFiveLabels[0].closest('li')!
    expect(row).toBeTruthy()
    expect(within(row).getAllByText('10 min')).toHaveLength(1)
    const apostropheIcons = row.querySelectorAll('.station-board-double-apostrophe')
    expect(apostropheIcons.length).toBeGreaterThan(0)
    apostropheIcons.forEach((icon) => {
      const marks = icon.querySelectorAll('path')
      expect(marks).toHaveLength(2)
      expect(marks[0].getAttribute('d')).toMatch(/^M4 8 C/)
      expect(marks[1].getAttribute('d')).toMatch(/^M9 8 C/)
    })
    expect(within(row).getByText('En service')).toBeTruthy()
    expect(within(row).getByText(/Aller ·/)).toBeTruthy()
    expect(within(row).getByText(/Retour ·/)).toBeTruthy()
    const aftuNinetyOneLabels = screen.getAllByText('AFTU 91')
    expect(aftuNinetyOneLabels).toHaveLength(2)
    expect(within(aftuNinetyOneLabels[0].closest('li')!).getAllByText('5 min')).toHaveLength(1)
    expect(container.querySelector('.station-board')).toBeTruthy()
    expect(container.querySelector('table')).toBeNull()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(within(row).getAllByText('9 min')).toHaveLength(1)
  })

  it('calcule le statut du retour selon sa propre plage de service', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-11-09T20:47:00.000Z'))

    render(<EstimatedLineScheduleBoard network="aftu" />)
    const aftuSixtySix = screen.getAllByText('AFTU 66')[0].closest('li')!
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

    const aftu = render(<EstimatedLineScheduleBoard network="aftu" />)
    const aftuFive = screen.getAllByText('AFTU 5')[0].closest('li')!
    expect(within(aftuFive).getAllByText('Reprise dans 26 min')).toHaveLength(2)
    expect(within(aftuFive).getAllByText('Reprise à 06:00')).toHaveLength(2)
    aftu.unmount()

    render(<EstimatedLineScheduleBoard network="tata" />)
    const tataThirtySeven = screen.getAllByText('TATA 37')[0].closest('li')!
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

  it('arrête chaque ligne AFTU à sa fin connue et plafonne les autres à 22:50', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T21:51:00.000Z'))

    const aftu = render(<EstimatedLineScheduleBoard network="aftu" />)
    const aftuFortyTwo = screen.getAllByText('AFTU 42')[0].closest('li')!
    expect(within(aftuFortyTwo).getAllByText("Service terminé pour aujourd'hui")).toHaveLength(2)
    expect(within(aftuFortyTwo).queryByText('En service')).toBeNull()
    aftu.unmount()

    vi.setSystemTime(new Date('2026-11-09T22:49:00.000Z'))
    const aftuFive = render(<EstimatedLineScheduleBoard network="aftu" />)
    const aftuFiveRow = screen.getAllByText('AFTU 5')[0].closest('li')!
    expect(within(aftuFiveRow).getAllByText('1 min')).toHaveLength(1)
    aftuFive.unmount()

    vi.setSystemTime(new Date('2026-11-09T22:50:00.000Z'))
    render(<EstimatedLineScheduleBoard network="tata" />)
    const tataThirtySeven = screen.getAllByText('TATA 37')[0].closest('li')!
    expect(within(tataThirtySeven).getAllByText("Service terminé pour aujourd'hui")).toHaveLength(2)
    expect(within(tataThirtySeven).queryByText('En service')).toBeNull()
  })

  it('affiche le catalogue TATA séparément sans inventer de fréquence AFTU', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    const { container } = render(<EstimatedLineScheduleBoard network="tata" />)
    const tataThirtySevenLabels = screen.getAllByText('TATA 37')
    expect(tataThirtySevenLabels).toHaveLength(2)
    expect(screen.queryByText('TATA 2B')).toBeNull()
    expect(screen.queryByText(/AFTU 2B/)).toBeNull()
    expect(container.querySelectorAll('.station-board-row')).toHaveLength(124)
    expect(container.querySelectorAll('.station-board-passage strong')).toHaveLength(124)
    const tataThirtySevenRow = tataThirtySevenLabels[0].closest('li')!
    expect(within(tataThirtySevenRow).getAllByText('—')).toHaveLength(2)
    expect(within(tataThirtySevenRow).getByText(/Aller ·/)).toBeTruthy()
    expect(within(tataThirtySevenRow).getByText(/Retour ·/)).toBeTruthy()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)
  })
})
