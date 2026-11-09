// @vitest-environment jsdom
import { cleanup, render, screen, within, act } from '@testing-library/react'
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
    expect(within(row).getAllByText('10 min')).toHaveLength(2)
    expect(within(row).getByText(/Aller ·/)).toBeTruthy()
    expect(within(row).getByText(/Retour ·/)).toBeTruthy()
    const aftuNinetyOneLabels = screen.getAllByText('AFTU 91')
    expect(aftuNinetyOneLabels).toHaveLength(2)
    expect(within(aftuNinetyOneLabels[0].closest('li')!).getAllByText('5 min')).toHaveLength(2)
    expect(container.querySelector('.station-board')).toBeTruthy()
    expect(container.querySelector('table')).toBeNull()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(within(row).getAllByText('9 min')).toHaveLength(2)
  })

  it('affiche les lignes DDD, sans fabriquer de créneau pour une ligne sans horaire concordant', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    render(<EstimatedLineScheduleBoard network="ddd" />)
    const dddOneLabels = screen.getAllByText('DDD 1')
    expect(dddOneLabels).toHaveLength(2)
    expect(within(dddOneLabels[0].closest('li')!).getAllByText('—')).toHaveLength(2)
    const dddSixLabels = screen.getAllByText('DDD 6')
    expect(dddSixLabels).toHaveLength(2)
    expect(within(dddSixLabels[0].closest('li')!).getAllByText('6 min')).toHaveLength(2)
  })

  it('affiche le catalogue TATA séparément avec la référence commune des minibus AFTU', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    const { container } = render(<EstimatedLineScheduleBoard network="tata" />)
    const tataThirtySevenLabels = screen.getAllByText('TATA 37')
    expect(tataThirtySevenLabels).toHaveLength(2)
    expect(screen.queryByText('TATA 2B')).toBeNull()
    expect(screen.queryByText(/AFTU 2B/)).toBeNull()
    expect(container.querySelectorAll('.station-board-row')).toHaveLength(60)
    expect(container.querySelectorAll('.station-board-passage strong')).toHaveLength(60)
    const tataThirtySevenRow = tataThirtySevenLabels[0].closest('li')!
    expect(within(tataThirtySevenRow).getAllByText('5 min')).toHaveLength(2)
    expect(within(tataThirtySevenRow).getByText(/Aller ·/)).toBeTruthy()
    expect(within(tataThirtySevenRow).getByText(/Retour ·/)).toBeTruthy()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)
  })
})
