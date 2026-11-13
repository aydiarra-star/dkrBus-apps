import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CurrentBusRouteAuditPanel } from './CurrentBusRouteAuditPanel'

describe('CurrentBusRouteAuditPanel', () => {
  it('shows the catalogue audit as read-only and exposes separate directions', () => {
    render(<CurrentBusRouteAuditPanel />)
    expect(screen.getByRole('region', { name: 'Audit des lignes DDD AFTU TATA' })).toBeTruthy()
    expect(screen.getByText(/Lecture seule du catalogue actuel/)).toBeTruthy()
    expect(screen.getByText(/Lignes examinées/)).toBeTruthy()
    expect(screen.getByText(/Sens examinés/)).toBeTruthy()
    expect(screen.getAllByText(/Aller|Retour/).length).toBeGreaterThan(0)
  })

  it('filters findings without changing the underlying report', () => {
    render(<CurrentBusRouteAuditPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Arrêts manquants' }))
    expect(screen.getByRole('button', { name: 'Arrêts manquants' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText(/constat\(s\) dans cette vue/)).toBeTruthy()
  })
})
