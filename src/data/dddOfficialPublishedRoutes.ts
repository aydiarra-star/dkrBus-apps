import { DDD_URBAN_PUBLISHED_ROUTE_SEQUENCES } from './dddOfficialUrbanPublishedRoutes'
import { DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_A } from './dddSuburbanPublishedRoutesA'
import { DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_B } from './dddSuburbanPublishedRoutesB'

export const DDD_OFFICIAL_ROUTE_SOURCE = {
  url: 'https://demdikk.sn/reseau-urbain-dakar/',
  infoUrl: 'https://demdikk.sn/info-voyageurs/',
  mobileAppInfoUrl: 'https://demdikk.sn/v2appmobile/',
  mobileAppAnnouncedOn: '2025-09-03',
  appStoreVersion: '2025.4.1',
  appStoreVersionPublishedOn: '2025-10-02',
  infoPageCheckedOn: '2026-11-17',
  label: 'Dakar Dem Dikk · Réseau urbain Dakar',
  retrievedOn: '2026-11-17',
  status: 'NEEDS_HUMAN_REVIEW',
  directionCoverage: 'ONE_PUBLISHED_ORDER_ONLY',
  reverseSequenceVerified: false,
  stopIdsMatched: false,
  frequencyMinutes: null,
} as const

/**
 * Séquences transcrites dans l'ordre publié sur le site officiel DDD.
 * Les flèches de terminus ne suffisent pas à établir une séquence de retour.
 * Aucun arrêt n'est encore relié automatiquement à un identifiant/GPS.
 */
export const DDD_OFFICIAL_PUBLISHED_ROUTE_SEQUENCES = [
  ...DDD_URBAN_PUBLISHED_ROUTE_SEQUENCES,
  ...DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_A,
  ...DDD_SUBURBAN_PUBLISHED_ROUTE_SEQUENCES_B,
] as const

export const getDddOfficialPublishedRoute = (line: string) =>
  DDD_OFFICIAL_PUBLISHED_ROUTE_SEQUENCES.find((route) => route.line === line) ?? null
