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
    const row = screen.getByRole('row', { name: /AFTU 2B/ })
    expect(within(row).getByText('11 min')).toBeTruthy()
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'Ligne',
      'Compte à rebours',
    ])
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
    const row = screen.getAllByRole('row').find((candidate) => within(candidate).queryByText('DDD 1'))
    expect(row).toBeTruthy()
    expect(within(row).getByText('—')).toBeTruthy()
  })

  it('reprend les références AFTU pour TATA sans créer une fréquence séparée', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    render(<EstimatedLineScheduleBoard network="tata" />)
    expect(screen.getByRole('row', { name: /TATA 2B/ })).toBeTruthy()
    const row = screen.getByRole('row', { name: /TATA 2B/ })
    expect(within(row).getByText('11 min')).toBeTruthy()
    expect(screen.queryByText(/AFTU 2B/)).toBeNull()
  })
})
