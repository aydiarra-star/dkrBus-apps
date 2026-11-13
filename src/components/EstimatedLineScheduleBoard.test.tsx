// @vitest-environment jsdom
import { cleanup, render, screen, within, act, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EstimatedLineScheduleBoard } from './EstimatedLineScheduleBoard'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('affiches de comptes à rebours DDD, AFTU et TATA', () => {
  it('réserve le compte à rebours aux fréquences officielles documentées par ligne', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    const { container } = render(<EstimatedLineScheduleBoard network="aftu" />)
    const aftuFive = screen.getAllByText('AFTU 5')[0].closest('li')!
    expect(within(aftuFive).getAllByText('En service')).toHaveLength(2)
    expect(within(aftuFive).queryByText('10 min')).toBeNull()

    const aftuNinetyOne = screen.getAllByText('AFTU 91')[0].closest('li')!
    expect(within(aftuNinetyOne).getAllByText('En service')).toHaveLength(2)
    expect(within(aftuNinetyOne).queryByText('5 min')).toBeNull()

    const aftuEightyFour = screen.getAllByText('AFTU 84')[0].closest('li')!
    expect(within(aftuEightyFour).getAllByText('12 min')).toHaveLength(2)
    const apostropheIcons = aftuEightyFour.querySelectorAll('.station-board-double-apostrophe')
    expect(apostropheIcons.length).toBe(2)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(within(aftuEightyFour).getAllByText('11 min')).toHaveLength(2)
    expect(container.querySelector('.station-board')).toBeTruthy()
    expect(container.querySelector('table')).toBeNull()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)
  })

  it('ne réutilise pas une fréquence secondaire de ligne pour fabriquer le retour', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(new Date('2026-11-09T20:47:00.000Z'))

    render(<EstimatedLineScheduleBoard network="aftu" />)
    const aftuSixtySix = screen.getAllByText('AFTU 66')[0].closest('li')!
    await waitFor(() => {
      expect(within(aftuSixtySix).getAllByText('En service')).toHaveLength(2)
    })
    expect(within(aftuSixtySix).queryByText('Fin de service')).toBeNull()
  })

  it('ne présente pas les fréquences secondaires DDD comme des comptes à rebours officiels', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T07:40:00.000Z'))

    render(<EstimatedLineScheduleBoard network="ddd" />)
    const dddOne = screen.getAllByText('DDD 1')[0].closest('li')!
    expect(within(dddOne).getAllByText('En service')).toHaveLength(2)
    expect(within(dddOne).queryByText('10 min')).toBeNull()

    const dddSix = screen.getAllByText('DDD 6')[0].closest('li')!
    expect(within(dddSix).getAllByText('En service')).toHaveLength(2)
    expect(within(dddSix).queryByText('6 min')).toBeNull()
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

  it('annonce le début du service DDD sans inventer un intervalle de passage', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T05:34:00.000Z'))

    render(<EstimatedLineScheduleBoard network="ddd" />)
    const dddOne = screen.getAllByText('DDD 1')[0].closest('li')!
    expect(within(dddOne).getAllByText('En service')).toHaveLength(2)
    expect(within(dddOne).queryByText('6 min')).toBeNull()
  })

  it('affiche le catalogue TATA séparément sans reprendre les fréquences AFTU', () => {
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
    expect(within(tataThirtySevenRow).getAllByText('En service')).toHaveLength(2)
    expect(within(tataThirtySevenRow).queryByText('5 min')).toBeNull()
    expect(within(tataThirtySevenRow).getByText(/Aller ·/)).toBeTruthy()
    expect(within(tataThirtySevenRow).getByText(/Retour ·/)).toBeTruthy()
    expect(container.textContent).not.toMatch(/Estimation|TransitByCity|Source|fréquence|horaire/i)
  })
})
