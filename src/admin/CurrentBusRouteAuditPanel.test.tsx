// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(() => cleanup())
import { CurrentBusRouteAuditPanel } from './CurrentBusRouteAuditPanel'

describe('CurrentBusRouteAuditPanel', () => {
  it('shows the catalogue audit as read-only and exposes separate directions', async () => {
    render(<CurrentBusRouteAuditPanel />)
    expect(screen.getByRole('region', { name: 'Audit des lignes DDD AFTU TATA' })).toBeTruthy()
    expect(screen.getByText(/Lecture seule du catalogue actuel/)).toBeTruthy()
    expect(await screen.findByText(/Fiches TATA candidates · 2 lignes/)).toBeTruthy()
    expect(screen.getByText(/L’IA recherche et recoupe les sources pour qualifier les lignes/)).toBeTruthy()
    expect(screen.getByText(/Lignes examinées/)).toBeTruthy()
    expect(screen.getByText(/Sens examinés/)).toBeTruthy()
    expect(screen.getAllByText(/Aller|Retour/).length).toBeGreaterThan(0)
  })

  it('shows the return-route variants published by AFTU for lines 2 and 5', async () => {
    render(<CurrentBusRouteAuditPanel />)
    fireEvent.click(await screen.findByText(/Fiches AFTU récupérées · 65 lignes/))
    expect(screen.getAllByText('Retour : Rue 17 à la place de Rue 39')).toHaveLength(2)
    expect(screen.getAllByText('Retour : Rue 37 à la place de Rue 25')).toHaveLength(2)
  })

  it('exposes the historical DDD GIS layers without presenting them as stop sequences', async () => {
    render(<CurrentBusRouteAuditPanel />)
    const gisSources = await screen.findByText(/Couches SIG DDD de banlieue · 12 références historiques/)
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
  it('exposes extracted urban DDD stop-point layers and their coverage', async () => {
    render(<CurrentBusRouteAuditPanel />)
    const urbanSources = await screen.findByText(/Arrêts SIG DDD urbains · 455 points · 454 géolocalisés/)
    fireEvent.click(urbanSources)
    expect(screen.getByText(/384 points ont un nom/)).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Ouvrir la couche d’arrêts SIG' })).toHaveLength(12)
  })

  it('shows the coverage of the full official AFTU page extraction', () => {
    render(<CurrentBusRouteAuditPanel />)
    const pages = screen.getByText(/Fiches officielles AFTU parcourues · 65 pages · 65 itinéraires/)
    fireEvent.click(pages)
    expect(screen.getByText(/65 textes d’itinéraire sont disponibles/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ouvrir la liste officielle des lignes AFTU' })).toBeTruthy()
  })

  it('shows official DDD terminal departure windows without inventing a frequency', async () => {
    render(<CurrentBusRouteAuditPanel />)
    const departures = await screen.findByText(/Départs officiels DDD · 6 directions documentées/)
    fireEvent.click(departures)
    expect(screen.getByText(/Ligne 1 · Parcelles Assainies → Place Leclerc/)).toBeTruthy()
    expect(screen.getByText(/Premier départ : 05:30 · Dernier départ : 20:30/)).toBeTruthy()
    expect(screen.getByText(/TAF TAF · Sphère ministérielle → Ouakam/)).toBeTruthy()
    expect(screen.getByText(/ne donnent pas d’intervalle entre bus/)).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Source officielle DDD' })).toHaveLength(6)
  })

  it('exposes the 39 official DDD route sequences in their published order', async () => {
    render(<CurrentBusRouteAuditPanel />)
    const routes = await screen.findByText(/Parcours DDD publiés par l’opérateur · 39 séquences/)
    fireEvent.click(routes)
    const lineOne = await screen.findByText(/DDD 1 · 22 repères publiés/)
    fireEvent.click(lineOne)
    expect(screen.getByText('Terminus Parcelles Assainies')).toBeTruthy()
    expect(screen.getByText('Terminus Leclerc')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ouvrir les parcours DDD' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ouvrir Info voyageurs DDD' })).toBeTruthy()
    expect(screen.getByText(/Les retours ne sont pas inversés automatiquement/)).toBeTruthy()
  })

  it('flags official DDD route header conflicts for lines 217 and 233', async () => {
    render(<CurrentBusRouteAuditPanel />)
    fireEvent.click(await screen.findByText(/Parcours DDD publiés par l’opérateur · 39 séquences/))
    fireEvent.click(await screen.findByText(/DDD 217 · 15 repères publiés/))
    expect(screen.getByText(/l’en-tête annonce Ouakam comme terminus/)).toBeTruthy()
    fireEvent.click(await screen.findByText(/DDD 233 · 15 repères publiés/))
    expect(screen.getByText(/l’en-tête annonce Palais 1/)).toBeTruthy()
  })

})
