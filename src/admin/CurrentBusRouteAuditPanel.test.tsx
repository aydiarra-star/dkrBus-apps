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
    const gisSources = screen.getByText(/Couches SIG DDD de banlieue · 12 références historiques/)
    expect(gisSources).toBeTruthy()
    fireEvent.click(gisSources)
    expect(screen.getByText(/ne contiennent pas de séquences d’arrêts validées ni d’horaires/)).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Ouvrir la couche SIG' })).toHaveLength(12)
  })

  it('exposes CETUD frequency observations by site and direction without assigning them to individual lines', () => {
    render(<CurrentBusRouteAuditPanel />)
    const frequencySources = screen.getByText(/Fréquences observées par site · CETUD · 59 relevés/)
    fireEvent.click(frequencySources)
    expect(screen.getByText(/ne sont pas des fréquences propres à chaque numéro de ligne/)).toBeTruthy()
    expect(screen.getByText(/Vers ville : 9 min · Vers banlieue : 7 min/)).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /Rapport CETUD · tableau/ }).length).toBe(59)
  })

  it('filters findings without changing the underlying report', () => {
    render(<CurrentBusRouteAuditPanel />)
    const missingStopButtons = screen.getAllByRole('button', { name: 'Arrêts manquants' })
    fireEvent.click(missingStopButtons[0])
    expect(screen.getAllByRole('button', { name: 'Arrêts manquants' })[0].getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByText(/constat\(s\) dans cette vue/).length).toBeGreaterThan(0)
  })
})
