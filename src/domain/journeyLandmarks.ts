import { GREATER_DAKAR_BUS_COVERAGE_POINTS } from '../data/greaterDakarBusCoverage'

/** A selectable map reference is not a platform. Keep IDs separate from both
 * the transport catalogue and published GTFS, even at identical coordinates. */
export interface JourneyLandmark {
  id: string
  name: string
  lat: number
  lon: number
  source: string
}
export const JOURNEY_LANDMARKS: readonly JourneyLandmark[] = [
  ...GREATER_DAKAR_BUS_COVERAGE_POINTS.map(p => ({ id: `landmark:${p.id}`, name: p.name, lat: p.lat, lon: p.lon, source: `© OpenStreetMap · ${p.osmRef}` })),
  // Three different objects; the first is the approximate reference selected
  // on the journey map, not the bus station, Terminus 52, or Keur Mbaye Fall.
  // docs/audit-geographique-rufisque-bargny-keur-massar-sangalkam-2026-11-16.md
  { id: 'landmark:keur-massar', name: 'Keur Massar', lat: 14.79, lon: -17.31, source: 'Repère local approximatif' },
  { id: 'landmark:gare-routiere-keur-massar', name: 'Gare routière de Keur Massar', lat: 14.76984, lon: -17.31840, source: '© OpenStreetMap · way/335756472' },
  { id: 'landmark:terminus-52', name: 'Terminus 52', lat: 14.77419, lon: -17.31767, source: '© OpenStreetMap · node/5286379847' },
]
