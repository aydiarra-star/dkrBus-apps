/**
 * Fenêtres de premiers et derniers départs explicitement publiées par DDD.
 * Elles sont propres à chaque terminus et ne décrivent aucun intervalle
 * entre deux bus. Elles ne peuvent donc pas alimenter un compte à rebours.
 */
export interface DddPublishedDepartureWindow {
  service: 'Ligne 1' | 'TAF TAF'
  origin: string
  destination: string
  firstDeparture: string
  lastDeparture: string
  sourceUrl: string
  sourceLabel: 'Dakar Dem Dikk · site officiel'
  retrievedOn: '2026-11-13'
  intervalMinutes: null
}

const homepage = 'https://demdikk.sn/'
const infoVoyageurs = 'https://demdikk.sn/info-voyageurs/'
const sourceLabel = 'Dakar Dem Dikk · site officiel' as const

export const DDD_PUBLISHED_DEPARTURE_WINDOWS: readonly DddPublishedDepartureWindow[] = [
  {
    service: 'Ligne 1',
    origin: 'Parcelles Assainies',
    destination: 'Place Leclerc',
    firstDeparture: '05:30',
    lastDeparture: '20:30',
    sourceUrl: homepage,
    sourceLabel,
    retrievedOn: '2026-11-13',
    intervalMinutes: null,
  },
  {
    service: 'Ligne 1',
    origin: 'Place Leclerc',
    destination: 'Parcelles Assainies',
    firstDeparture: '06:30',
    lastDeparture: '21:00',
    sourceUrl: homepage,
    sourceLabel,
    retrievedOn: '2026-11-13',
    intervalMinutes: null,
  },
  {
    service: 'TAF TAF',
    origin: 'Ouakam',
    destination: 'AIBD',
    firstDeparture: '06:00',
    lastDeparture: '21:00',
    sourceUrl: infoVoyageurs,
    sourceLabel,
    retrievedOn: '2026-11-13',
    intervalMinutes: null,
  },
  {
    service: 'TAF TAF',
    origin: 'Ouakam',
    destination: 'Sphère ministérielle',
    firstDeparture: '05:45',
    lastDeparture: '21:00',
    sourceUrl: infoVoyageurs,
    sourceLabel,
    retrievedOn: '2026-11-13',
    intervalMinutes: null,
  },
  {
    service: 'TAF TAF',
    origin: 'AIBD',
    destination: 'Ouakam',
    firstDeparture: '06:00',
    lastDeparture: '21:00',
    sourceUrl: infoVoyageurs,
    sourceLabel,
    retrievedOn: '2026-11-13',
    intervalMinutes: null,
  },
  {
    service: 'TAF TAF',
    origin: 'Sphère ministérielle',
    destination: 'Ouakam',
    firstDeparture: '06:00',
    lastDeparture: '20:30',
    sourceUrl: infoVoyageurs,
    sourceLabel,
    retrievedOn: '2026-11-13',
    intervalMinutes: null,
  },
]
