// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JourneyOptions } from './JourneyOptions'
import { PlannerLegList } from './PlannerLegList'
import { getCorridorStop } from '../domain/corridors'
import { planJourneyOptions } from '../domain/journeyOptions'

describe('résumé du trajet recommandé', () => {
  it('affiche le trajet DDD 227 + AFTU 60 et une fenêtre d’arrivée en heure de Dakar', () => {
    const originStop = getCorridorStop('ddd-parcelles-227')
    const destinationStop = getCorridorStop('aftu-almadies-60')
    if (!originStop || !destinationStop) throw new Error('arrêts de référence manquants')

    const origin = { label: originStop.name, lat: originStop.lat, lng: originStop.lon, stopId: originStop.id }
    const destination = { label: destinationStop.name, lat: destinationStop.lat, lng: destinationStop.lon, stopId: destinationStop.id }
    const plan = planJourneyOptions(
      { label: origin.label, lat: origin.lat, lon: origin.lng, stopId: origin.stopId },
      { label: destination.label, lat: destination.lat, lon: destination.lng, stopId: destination.stopId },
      { allowedNetworks: ['ddd', 'aftu_tata'] },
    )
    if (!plan.ok) throw new Error(plan.message)

    render(<JourneyOptions origin={origin} destination={destination} plan={plan} />)

    expect(screen.getByText(/TRAJET RECOMMANDÉ · RÉSEAU DE RÉFÉRENCE/i)).toBeTruthy()
    expect(screen.getAllByText(/Arrivée estimée si départ maintenant/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/DDD 227|AFTU 60/).length).toBeGreaterThan(0)
  })
})

describe('correspondance dans un même pôle', () => {
  it('ne présente pas une liaison de terminal comme une marche mesurée de zéro minute', () => {
    render(
      <PlannerLegList
        legs={[{
          kind: 'walk_transfer',
          from: 'Terminus DDD Keur Massar',
          to: 'Terminus AFTU Keur Massar',
          distanceM: 0,
          minutes: 0,
        }]}
      />,
    )
    expect(screen.getByText(/distance de marche interne non mesurée/i)).toBeTruthy()
    expect(screen.getByText('Même pôle')).toBeTruthy()
    expect(screen.queryByText(/0 min/)).toBeNull()
  })
})
