import { REVIEWED_PASSENGER_LINKS } from '../data/reviewedPassengerLinks'
import brtSource from '../../data/brt/brt-b1-osm.geojson?raw'
import { hasSenegalPublicHolidayCalendar } from '../domain/senegalPublicHolidays'
import { BRT_STOPS, TER_STOPS } from '../domain/corridors'
import { BRT_B1_TRACKS } from '../domain/brtTrackGeometry'
import { TER_TRACK } from '../domain/terTrackGeometry'
import { auditBrtB1DirectionalGeometry, auditTerPhaseOneGeometry } from '../domain/referenceRouteGeometry'
import { TER_CUMULATIVE_TRAVEL_TIMES, terTravelTimeMidpointMinutes } from '../domain/terTravelTimes'
import { dwellMinutes, REFERENCE_COMMERCIAL_SPEED_KPH } from '../domain/assumptions'
import { brtService, phaseOneService } from './dakarService'
import { buildNetwork } from './network'
import { planPlaceJourney, type PlaceJourneyOutcome, type DakarEndpoint, type JourneySettings } from './placeConnections'
import { documentedDirections, type DirectionNote } from './documentedDirections'
import type { Evidence, PatternInput, Place } from './model'

const auditDoc = 'docs/etat-calculateur-geometries-reelles-2026-11-17.md'
const scopeReview: Evidence = { status: 'reviewed', reference: auditDoc, date: '2026-11-17' }
function referenceDataset() {
  const ter = auditTerPhaseOneGeometry()
  const brt = auditBrtB1DirectionalGeometry().find(a => a.sourceId === '19961937')
  // The review is for these particular extracts, not permission to activate
  // any future relation that happens to pass the station-distance threshold.
  const members = (JSON.parse(brtSource) as { features: { properties: { osm_relation: number; max_member_join_gap_m: number } }[] }).features
  const continuousB1 = members.find(f => f.properties.osm_relation === 19961937)?.properties.max_member_join_gap_m === 0
  const track = BRT_B1_TRACKS.find(t => t.osmRelationId === 19961937)
  const places: Place[] = [...TER_STOPS.filter(s => s.id !== 'ter-aibd'), ...BRT_STOPS].map(({ id, name, lat, lon }) => ({
    id, name, lat, lon, kind: 'call', evidence: scopeReview,
  }))
  const patterns: PatternInput[] = []
  // A reviewed *call* is sufficient for a station-to-station ride. It is
  // deliberately insufficient for a street access or a change of platform.
  if (ter.extractedOn === '2026-11-15' && ter.passed && ter.stopCount === 13 && ter.sourceId === '13645077' && ter.stops[0]?.stopId === 'ter-dakar' && ter.stops.at(-1)?.stopId === 'ter-diamniadio' && ter.stops.every(s => s.stopId in TER_CUMULATIVE_TRAVEL_TIMES)) {
    const direction = 'Dakar → Diamniadio'
    const stops = ter.stops.map(s => s.stopId), offsets = stops.map(id => terTravelTimeMidpointMinutes(id) * 60)
    patterns.push({ lineId: 'ter-dakar-diamniadio', name: 'TER', direction, network: 'ter', stops, stepFree: 'unknown',
      shape: { network: 'ter', lineId: 'ter-dakar-diamniadio', directionId: direction, source: 'OSM_ROUTE_RELATION', sourceId: ter.sourceId, verified: true,
        positions: TER_TRACK.positions.slice(0, TER_TRACK.phase2StartIndex + 1).map(([lat, lon]) => ({ lat, lon })) },
      evidence: { ...scopeReview, reference: `© OpenStreetMap · relation ${ter.sourceId} · phase 1 · ${ter.extractedOn}` },
      service: phaseOneService, times: { kind: 'offsets', arrivals: offsets, departures: offsets, source: 'Milieux des durées cumulées TER INFOS du dépôt (15/11/2026)' } })
  }
  if (continuousB1 && brt?.extractedOn === '2026-11-14' && brt.passed && track && brt.stopCount === 23 && brt.stops[0]?.stopId === 'brt-prefecture-guediawaye' && brt.stops.at(-1)?.stopId === 'brt-petersen') {
    patterns.push({ lineId: 'brt-b1', name: 'B1', direction: brt.direction, network: 'brt', stops: brt.stops.map(s => s.stopId), stepFree: 'unknown',
      shape: { network: 'brt', lineId: 'brt-b1', directionId: brt.direction, source: 'OSM_ROUTE_RELATION', sourceId: brt.sourceId, verified: true,
        positions: track.positions.map(([lat, lon]) => ({ lat, lon })) },
      evidence: { ...scopeReview, reference: `© OpenStreetMap · relation ${brt.sourceId} · ${brt.extractedOn}` }, service: brtService('B1'),
      times: { kind: 'model', speedKph: REFERENCE_COMMERCIAL_SPEED_KPH.brt, dwellSeconds: dwellMinutes('brt') * 60, source: 'Distance sur la voie B1 / vitesse du modèle + arrêts intermédiaires' } })
  }
  // Baseline calls keep their identities. A reviewed directional binding can
  // attach a physical platform without moving the station or editing its times.
  const links = REVIEWED_PASSENGER_LINKS
  return buildNetwork({ ...links, places: [...places, ...links.places], patterns: [...patterns, ...links.patterns] })
}
export const dakarNetwork = referenceDataset()

export type { DakarEndpoint } from './placeConnections'
export type DakarOutcome = Extract<PlaceJourneyOutcome, { ok: true }> | (Extract<PlaceJourneyOutcome, { ok: false }> & { documentation?: DirectionNote[] })
/** Explicit selection only. Published GTFS IDs are a separate namespace. A GPS
 * fix (even with identical coordinates) cannot silently become a platform. */
export function planDakarJourney(from: DakarEndpoint, to: DakarEndpoint, options: JourneySettings): DakarOutcome {
  if ([from, to].some(p => p.stopId === 'ter-aibd' && p.kind === undefined)) return { ok: false, code: 'OUT_OF_SCOPE', message: 'AIBD relève de la phase 2. Le calcul TER s’arrête à Diamniadio.' }
  const result = planPlaceJourney(dakarNetwork, from, to, options)
  if (!result.ok && result.code === 'UNVERIFIED_ACCESS') return { ...result, documentation: documentedDirections(from, to, options) }
  if (!result.ok && result.code === 'NO_SERVICE' && !hasSenegalPublicHolidayCalendar(options.departAt * 1000)) {
    return { ...result, message: 'Le calendrier des jours fériés du Sénégal n’est pas confirmé pour cette année. Aucun créneau n’est supposé.' }
  }
  if (!result.ok && result.code === 'NO_PATH' && !dakarNetwork.walking.size && from.stopId && to.stopId) {
    const origin = from.stopId, destination = to.stopId
    const networksOf = (id: string) => dakarNetwork.patterns.filter(p => p.stops.includes(id))
    const here = networksOf(origin), there = networksOf(destination)
    if (!here.length || !there.length) return { ...result, message: 'Aucun parcours directionnel validé pour cette desserte.' }
    if (!here.some(p => there.includes(p))) return { ...result, message: 'Le trajet nécessite une correspondance. Aucun cheminement piéton vérifié ne relie les quais de ces réseaux.' }
    if (!here.some(p => p.stops.indexOf(destination) > p.stops.indexOf(origin))) return { ...result, message: 'Le sens retour demandé n’a pas de tracé validé. Le tracé aller n’est pas inversé.' }
    if (options.stepFreeOnly) return { ...result, message: 'L’accessibilité sans marches n’est pas vérifiée pour ce parcours.' }
  }
  return result
}
