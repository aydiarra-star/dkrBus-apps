import { DDD_PUBLISHED_DEPARTURE_WINDOWS } from '../data/dddPublishedDepartureWindows'
import { boundedDddWindows } from '../domain/dddOriginWindows'
import { clockMinutes } from '../domain/stopPassageCountdown'
import { BUS_SECTION_MARKERS } from '../data/busSectionReview'
import { dwellMinutes, REFERENCE_COMMERCIAL_SPEED_KPH } from '../domain/assumptions'
import { busScopes } from './busGeography'
import { concatenate } from './geometry'
import type { Dataset, Evidence, FrequencyWindow, Place } from './model'

/** A single admission, not a rule for promoting OSM markers to platforms.
 * Six consecutive operator pins (chatbot-arrets, ranks 34–39) checked against
 * six consecutive platform members (25–30) of 6951328 v28 towards Leclerc. */
// Freeze the matched OSM object and version, not a second copy of the
// operator’s coordinates. Rank-by-rank residuals are in the review document.
const platforms: readonly [node: number, version: number, name: string][] = [
  [4666430960, 2, 'École Manguiers'],
  [4666430958, 7, 'Police Médina'],
  [4666430955, 2, 'Rue 31 × Blaise Diagne'],
  [4666430953, 5, 'Marché Tilène'],
  [4666430951, 6, 'Rue 11 × Blaise Diagne'],
  [4666430950, 2, 'Stade Iba Mar Diop'],
]
const phase = 3518 // sec, modelled approach to Manguiers; reproduce: scripts/medina_phase.py
const days = [1, 2, 3, 4, 5] // no verified weekend or holiday exception for this section
const evidence = (reference: string): Evidence => ({ status: 'reviewed', date: '2026-11-19', reference })
export function medinaService(): Dataset {
  const empty = { places: [], patterns: [], footways: [] }
  const scope = busScopes.find(s => s.review.id === 'ddd-1-sahm' && s.review.relation === 6951328 && s.review.version === 28)
  const bound = DDD_PUBLISHED_DEPARTURE_WINDOWS.find(w => w.service === 'Ligne 1' && w.origin === 'Parcelles Assainies' && w.destination === 'Place Leclerc')
  if (!scope || !bound) return empty
  const positions = scope.markers.slice(3), parts = scope.parts.slice(3)
  if (positions.length !== platforms.length || parts.length !== platforms.length - 1 || !platforms.every(([node, version], i) =>
    positions[i].id === `landmark:bus-osm-${node}` && BUS_SECTION_MARKERS[node]?.[0] === version)) return empty
  const places: Place[] = platforms.map(([node, version, name], i) => ({ id: `ddd-1-medina-${node}`, name: `${name} · DDD 1 vers Leclerc`,
    lat: positions[i].lat, lon: positions[i].lon, kind: 'platform', evidence: evidence(`Arrêt DDD n° ${34+i} (demdikk.sn/chatbot-arrets/) · © OpenStreetMap, quai ${node} v${version}, relation 6951328 v28, membre ${25+i}`) }))
  const windows: FrequencyWindow[] = []
  for (const w of boundedDddWindows(bound.firstDeparture, bound.lastDeparture)) {
    const a = clockMinutes(w.start)! * 60 + phase, b = clockMinutes(w.end)! * 60 + phase, every = w.every * 60
    windows.push({ start: a, end: b + 1, every, weekdays: days, holidays: 'exclude' })
    if (w.includePublishedLast && (b-a) % every) windows.push({ start: b, end: b+1, every, weekdays: days, holidays: 'exclude' })
  }
  const lineId = 'ddd-1-medina', direction = 'Leclerc · portion Manguiers → Stade', network = 'ddd'
  return { places, footways: [], patterns: [{ network, lineId, direction, name: 'DDD 1', stops: places.map(p => p.id), stepFree: 'unknown',
    evidence: evidence('Six quais vers Leclerc · Dakar Dem Dikk / chatbot-arrêts et © OpenStreetMap relation 6951328 v28 (ODbL)'),
    shape: { network, lineId, directionId: direction, source: 'OSM_ROUTE_RELATION', sourceId: '6951328/v28:25-30', verified: true, positions: concatenate(parts) },
    service: { kind: 'frequency', windows, source: `DDD publie ${bound.firstDeparture}–${bound.lastDeparture} au départ des Parcelles, pas à ce quai. Le modèle suppose une cadence de 8 ou 13 min et environ 59 min jusqu’à Manguiers (durées de l’archive : 35 à 77 min). Aucun suivi du véhicule.` },
    times: { kind: 'model', speedKph: REFERENCE_COMMERCIAL_SPEED_KPH.ddd, dwellSeconds: dwellMinutes('ddd')*60, source: 'Voirie du sens vers Leclerc / vitesse modèle et temps d’arrêt. Pas un horaire affiché au quai.' },
  }] }
}
