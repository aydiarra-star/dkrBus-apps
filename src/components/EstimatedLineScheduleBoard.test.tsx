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
    const row = screen.getByText('AFTU 5').closest('li')!
    expect(row).toBeTruthy()
    expect(within(row).getByText('10 min')).toBeTruthy()
    expect(screen.getByText('AFTU 91')).toBeTruthy()
    expect(within(screen.getByText('AFTU 91').closest('li')!).getByText('—')).toBeTruthy()
    expect(container.querySelector('.station-board')).toBeTruthy()
    expect(container.querySelector('table')).toBeNull()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(within(row).getByText('9 min')).toBeTruthy()
  })

  it('affiche les lignes DDD, sans fabriquer de créneau pour une ligne sans horaire concordant', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    render(<EstimatedLineScheduleBoard network="ddd" />)
    expect(screen.getByText('DDD 1')).toBeTruthy()
    expect(within(screen.getByText('DDD 1').closest('li')!).getByText('—')).toBeTruthy()
    expect(screen.getByText('DDD 6')).toBeTruthy()
    expect(within(screen.getByText('DDD 6').closest('li')!).getByText('6 min')).toBeTruthy()
  })

  it('affiche le catalogue TATA séparément et ne lui attribue aucune fréquence AFTU', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    const { container } = render(<EstimatedLineScheduleBoard network="tata" />)
    expect(screen.getByText('TATA 37')).toBeTruthy()
    expect(screen.queryByText('TATA 2B')).toBeNull()
    expect(screen.queryByText(/AFTU 2B/)).toBeNull()
    expect(container.querySelectorAll('.station-board-row')).toHaveLength(60)
    expect(container.querySelectorAll('.station-board-passage strong')).toHaveLength(60)
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)
  })
})
