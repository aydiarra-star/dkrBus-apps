// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(() => cleanup())
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

  it('shows the return-route variants published by AFTU for lines 2 and 5', () => {
    render(<CurrentBusRouteAuditPanel />)
    fireEvent.click(screen.getByText(/Fiches AFTU récupérées/))
    expect(screen.getAllByText('Retour : Rue 17 à la place de Rue 39')).toHaveLength(2)
    expect(screen.getAllByText('Retour : Rue 37 à la place de Rue 25')).toHaveLength(2)
  })

  it('exposes the historical DDD GIS layers without presenting them as stop sequences', () => {
    render(<CurrentBusRouteAuditPanel />)
    const gisSources = screen.getByText(/Couches SIG DDD de banlieue · 12 références historiques/)
    expect(gisSources).toBeTruthy()
    fireEvent.click(gisSources)
    expect(screen.getByText(/ne contiennent pas de séquences d’arrêts validées ni d’horaires/)).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Ouvrir la couche SIG' })).toHaveLength(12)
  })

  it('exposes CETUD frequency observations by site and direction without assigning them to individual lines', async () => {
    render(<CurrentBusRouteAuditPanel />)
    const frequencySources = await screen.findByText(/Fréquences observées par site · CETUD · 59 relevés/)
    fireEvent.click(frequencySources)
    expect(screen.getByText(/ne sont pas des fréquences propres à chaque numéro de ligne/)).toBeTruthy()
    expect(screen.getByText(/Vers ville : 9 min · Vers banlieue : 7 min/)).toBeTruthy()
    await waitFor(() => expect(screen.getAllByRole('link', { name: /Rapport CETUD · tableau/ }).length).toBe(59))
  })

  it('filters findings without changing the underlying report', () => {
    render(<CurrentBusRouteAuditPanel />)
    const missingStopButtons = screen.getAllByRole('button', { name: 'Arrêts manquants' })
    fireEvent.click(missingStopButtons[0])
    expect(screen.getAllByRole('button', { name: 'Arrêts manquants' })[0].getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByText(/constat\(s\) dans cette vue/).length).toBeGreaterThan(0)
  })
})
