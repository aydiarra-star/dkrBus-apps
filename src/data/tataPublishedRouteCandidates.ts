/**
 * Fiches secondaires publiées sous l'appellation « TATA ».
 * Le CETUD indique que les minibus AFTU sont couramment appelés Tata à Dakar.
 * Ces fiches restent séparées par provenance pour comparaison, mais ne
 * constituent pas un réseau opérateur distinct ni une preuve officielle.
 * Aucun usage direct dans le catalogue voyageur.
 */
export interface TataPublishedRouteCandidate {
  line: string
  sourceUrl: string
  sourceLabel: 'Covoiturage.sn · source secondaire'
  retrievedOn: '2026-11-13'
  description: string
  status: 'NEEDS_HUMAN_REVIEW'
  directionCoverage: 'SINGLE_DESCRIPTION_WITH_RETURN_VARIANTS'
}

const tataSource = 'Covoiturage.sn · source secondaire'

export const TATA_PUBLISHED_ROUTE_CANDIDATES: readonly TataPublishedRouteCandidate[] = [
  {
    line: '1',
    sourceUrl: 'https://www.covoiturage.sn/bus-tata-itineraire/ligne/1/lat-dior/hlm-grand-yoff/',
    sourceLabel: tataSource,
    retrievedOn: '2026-11-13',
    description: 'Lat-Dior, rue Sandiniéry, rue de la Somme, rue de Reims prolongée, rue des Dardanelles, avenue Blaise Diagne, boulevard de la Gueule Tapée, rue 34, rue 9bis, rue 11, rue 9, rue Abébé Bikila, Cheikh Sidaty Aidara, avenue Bourguiba, rond-point Jet d’eau, giratoire Liberté VI, deux voies de Liberté VI, VDN, route Corniche de HLM Grand Médine, terminus HLM Grand Yoff.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_WITH_RETURN_VARIANTS',
  },
  {
    line: '2',
    sourceUrl: 'https://www.covoiturage.sn/bus-tata-itineraire/ligne/2/route-principale-des-parcelles-assainies/gare-petersen/',
    sourceLabel: tataSource,
    retrievedOn: '2026-11-13',
    description: 'Route Principale des Parcelles Assainies, croisement Dior, route HLM Grand Médine, route du Marché des Parcelles Assainies, route des Niayes, pont de l’Émergence, avenue Cardinal Hyacinthe Thiandoum, giratoire Liberté VI, route du Front de Terre, rue P, avenue Cheikh Amadou Bamba (rue 13 des HLM), boulevard du Général de Gaulle, rue 39 (retour par rue 17), rue 22, rue 25 (retour par rue 37), avenue Blaise Diagne, avenue Émile Badiane, terminus Gare Petersen.',
    status: 'NEEDS_HUMAN_REVIEW',
    directionCoverage: 'SINGLE_DESCRIPTION_WITH_RETURN_VARIANTS',
  },
]
