// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TerDakarDiamniadioBoard } from './TerDakarDiamniadioBoard'

afterEach(cleanup)

describe('affichage TER Dakar ↔ Diamniadio', () => {
  it('affiche les 13 gares et les cartes de référence du tronc commun', () => {
    const { container, getByText } = render(
      <TerDakarDiamniadioBoard now={Date.parse('2026-10-08T12:00:00.000Z')} />,
    )
    expect(container.querySelectorAll('.ter-dd-stop')).toHaveLength(13)
    expect(getByText('FRÉQUENCE')).toBeTruthy()
    expect(getByText('36 km')).toBeTruthy()
    expect(getByText('13')).toBeTruthy()
    expect(getByText('Dakar → Diamniadio')).toBeTruthy()
    expect(getByText(/Prochains passages par gare/)).toBeTruthy()
  })

  it('bascule le libellé, l’origine, la destination et l’ordre des gares au retour', () => {
    const { container, getByRole, getByText } = render(
      <TerDakarDiamniadioBoard now={Date.parse('2026-10-08T12:00:00.000Z')} />,
    )
    fireEvent.click(getByRole('button', { name: 'Basculer vers le sens Retour' }))
    expect(getByText('Diamniadio → Dakar')).toBeTruthy()
    expect(getByRole('button', { name: 'Basculer vers le sens Aller' }).textContent).toContain('Retour')
    expect(container.querySelector('.ter-dd-stop strong')?.textContent).toBe('Diamniadio')
    expect(container.querySelector('.ter-dd-stop:last-child strong')?.textContent).toBe('Dakar - Gare ferroviaire')
  })

  it('affiche uniquement des comptes à rebours et un décompte jamais négatif', () => {
    const { container } = render(
      <TerDakarDiamniadioBoard now={Date.parse('2026-10-08T12:00:00.000Z')} />,
    )
    const passages = Array.from(container.querySelectorAll('.ter-dd-passage'))
    expect(passages).toHaveLength(13)
    const labels = passages.map((passage) => {
      const clone = passage.cloneNode(true) as HTMLElement
      clone.querySelector('.passage-remaining')?.remove()
      return clone.textContent?.trim() ?? ''
    })
    expect(labels.every((label) => /^Dans (?:\d+ min|\d+ h(?: \d{2})?)$/.test(label))).toBe(true)
    expect(labels.every((label) => !/\b\d{2}:\d{2}\b/.test(label))).toBe(true)
    expect(passages.every((passage) => !/dans -/.test(passage.textContent ?? ''))).toBe(true)
  })
})
