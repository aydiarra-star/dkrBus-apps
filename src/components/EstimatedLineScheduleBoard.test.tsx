// @vitest-environment jsdom
import { cleanup, render, screen, within, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EstimatedLineScheduleBoard } from './EstimatedLineScheduleBoard'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('affiches de comptes à rebours DDD, AFTU et TATA', () => {
  it('affiche seulement la ligne et le décompte, qui diminue automatiquement', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    const { container } = render(<EstimatedLineScheduleBoard network="aftu" />)
    const row = screen.getByText('AFTU 2B').closest('li')!
    expect(row).toBeTruthy()
    expect(within(row).getByText('11 min')).toBeTruthy()
    expect(container.querySelector('.station-board')).toBeTruthy()
    expect(container.querySelector('table')).toBeNull()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(within(row).getByText('10 min')).toBeTruthy()
  })

  it('ne fabrique aucun compte à rebours pour une ligne sans fréquence exploitable', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    render(<EstimatedLineScheduleBoard network="ddd" />)
    const row = screen.getByText('DDD 1').closest('li')!
    expect(row).toBeTruthy()
    expect(within(row).getByText('—')).toBeTruthy()
  })

  it('ne réutilise ni les lignes ni les fréquences AFTU pour TATA sans source indépendante', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    render(<EstimatedLineScheduleBoard network="tata" />)
    expect(screen.queryByText('TATA 2B')).toBeNull()
    expect(screen.queryByText(/AFTU 2B/)).toBeNull()
    expect(document.querySelectorAll('.station-board-row')).toHaveLength(0)
  })
})
