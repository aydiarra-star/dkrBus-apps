// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JourneyOptions } from './JourneyOptions'
import { PlannerLegList } from './PlannerLegList'
import { getCorridorStop } from '../domain/corridors'
import { planJourneyOptions } from '../domain/journeyOptions'

describe('résumé du trajet recommandé', () => {
  it('affiche une fenêtre d’arrivée estimée en heure de Dakar pour un parcours calculé', () => {
    const originStop = getCorridorStop('brt-petersen')
    const destinationStop = getCorridorStop('ter-rufisque')
    if (!originStop || !destinationStop) throw new Error('arrêts de référence manquants')

    const origin = { label: originStop.name, lat: originStop.lat, lng: originStop.lon, stopId: originStop.id }
    const destination = { label: destinationStop.name, lat: destinationStop.lat, lng: destinationStop.lon, stopId: destinationStop.id }
    const plan = planJourneyOptions(
      { label: origin.label, lat: origin.lat, lon: origin.lng, stopId: origin.stopId },
      { label: destination.label, lat: destination.lat, lon: destination.lng, stopId: destination.stopId },
    )
    if (!plan.ok) throw new Error(plan.message)

    render(<JourneyOptions origin={origin} destination={destination} plan={plan} />)

    expect(screen.getByText(/TRAJET RECOMMANDÉ · RÉSEAU DE RÉFÉRENCE/i)).toBeTruthy()
    expect(screen.getAllByText(/Arrivée estimée si départ maintenant/i).length).toBeGreaterThan(0)
  })
})


describe('correspondance dans un même pôle', () => {
  it('ne présente pas une liaison de terminal comme une marche mesurée de zéro minute', () => {
    render(
      <PlannerLegList
        legs={[{
          kind: 'walk_transfer',
          from: 'Petersen BRT',
          to: 'Petersen DDD',
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
