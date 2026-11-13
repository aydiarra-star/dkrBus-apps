// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CurrentBusRouteAuditPanel } from './CurrentBusRouteAuditPanel'

describe('CurrentBusRouteAuditPanel', () => {
  it('shows the catalogue audit as read-only and exposes separate directions', () => {
    render(<CurrentBusRouteAuditPanel />)
    expect(screen.getByRole('region', { name: 'Audit des lignes DDD AFTU TATA' })).toBeTruthy()
    expect(screen.getByText(/Lecture seule du catalogue actuel/)).toBeTruthy()
    expect(screen.getByText(/Fiches TATA candidates/)).toBeTruthy()
    expect(screen.getByText(/L’IA recherche et recoupe les sources pour qualifier les lignes/)).toBeTruthy()
    expect(screen.getByText(/Lignes examinées/)).toBeTruthy()
    expect(screen.getByText(/Sens examinés/)).toBeTruthy()
    expect(screen.getAllByText(/Aller|Retour/).length).toBeGreaterThan(0)
  })

  it('exposes the historical DDD GIS layers without presenting them as stop sequences', () => {
    render(<CurrentBusRouteAuditPanel />)
    expect(screen.getByText(/Couches SIG DDD de banlieue · 12 références historiques/)).toBeTruthy()
    expect(screen.getByText(/ne contiennent pas de séquences d’arrêts validées ni d’horaires/)).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Ouvrir la couche SIG' })).toHaveLength(12)
  })

  it('filters findings without changing the underlying report', () => {
    render(<CurrentBusRouteAuditPanel />)
    const missingStopButtons = screen.getAllByRole('button', { name: 'Arrêts manquants' })
    fireEvent.click(missingStopButtons[0])
    expect(screen.getAllByRole('button', { name: 'Arrêts manquants' })[0].getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByText(/constat\(s\) dans cette vue/).length).toBeGreaterThan(0)
  })
})
