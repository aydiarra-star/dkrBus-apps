import { REVIEWED_PASSENGER_LINKS } from '../data/reviewedPassengerLinks'
import { sliceVerifiedRouteSegment } from '../domain/routeGeometrySlice'
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
import { interchangeQuestion, prepareChanges, type ChangeLead } from './changePreparation'
import { findBusMapSections, type BusMapSection } from './busGeography'
import { documentedDirections, type DirectionNote } from './documentedDirections'
import type { Dataset, Evidence, Network, PatternInput, Place } from './model'

const auditDoc = 'docs/etat-calculateur-geometries-reelles-2026-11-17.md'
const scopeReview: Evidence = { status: 'reviewed', reference: auditDoc, date: '2026-11-17' }
function referenceDataset(): Dataset {
  const ter = auditTerPhaseOneGeometry()
  const audits = auditBrtB1DirectionalGeometry()
  // The review is for these particular extracts, not permission to activate
  // any future relation that happens to pass the station-distance threshold.
  const members = (JSON.parse(brtSource) as { features: { properties: { osm_relation: number; max_member_join_gap_m: number } }[] }).features
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
  for (const track of BRT_B1_TRACKS) {
    const id = track.osmRelationId, audit = audits.find(a => a.sourceId === String(id))
    if (!audit || audit.extractedOn !== '2026-11-14' || audit.stopCount !== 23 || !audit.monotonic ||
        members.find(f => f.properties.osm_relation === id)?.properties.max_member_join_gap_m !== 0) continue
    // Review of two specific scopes, NOT “drop any stop that misses the shape”.
    // For 19961993 the *origin* is known, so origin-frequency offsets can be
    // computed on its reviewed prefix. The far terminus is not an alighting call.
    const partial = id === 19961993
    const calls = partial ? audit.stops.slice(0, 22) : audit.stops
    if (partial ? calls[0].stopId !== 'brt-petersen' || calls.at(-1)?.stopId !== 'brt-gueule-tapee' || audit.stops[22].stopId !== 'brt-prefecture-guediawaye'
      : id !== 19961937 || !audit.passed || calls[0].stopId !== 'brt-prefecture-guediawaye' || calls.at(-1)?.stopId !== 'brt-petersen') continue
    const direction = partial ? 'Vers Guédiawaye · portion Petersen → Gueule Tapée' : audit.direction
    const shape = { network: 'brt', lineId: 'brt-b1', directionId: direction, source: 'OSM_ROUTE_RELATION', sourceId: audit.sourceId, verified: true,
      positions: track.positions.map(([lat, lon]) => ({ lat, lon })) } as const
    const positions = partial ? sliceVerifiedRouteSegment(shape, BRT_STOPS[0], BRT_STOPS[21]) : shape.positions
    if (!positions) continue
    patterns.push({ lineId: 'brt-b1', name: 'B1', direction, network: 'brt', stops: calls.map(s => s.stopId), stepFree: 'unknown', shape: { ...shape, positions },
      evidence: { ...scopeReview, date: partial ? '2026-11-18' : scopeReview.date, reference: `© OpenStreetMap · relation ${id} · ${audit.extractedOn}${partial ? ' · portion jusqu’à Gueule Tapée uniquement' : ''}` }, service: brtService('B1'),
      times: { kind: 'model', speedKph: REFERENCE_COMMERCIAL_SPEED_KPH.brt, dwellSeconds: dwellMinutes('brt') * 60, source: 'Distance sur la voie B1 / vitesse du modèle + arrêts intermédiaires' } })
  }
  // Baseline calls keep their identities. A reviewed directional binding can
  // attach a physical platform without moving the station or editing its times.
  const links = REVIEWED_PASSENGER_LINKS
  return { ...links, places: [...places, ...links.places], patterns: [...patterns, ...links.patterns] }
}
export const localPassengerData = referenceDataset()
export const dakarNetwork = buildNetwork(localPassengerData)

export type { DakarEndpoint } from './placeConnections'
type JourneyRefusal = Extract<PlaceJourneyOutcome, { ok: false }>
export type DakarOutcome = Extract<PlaceJourneyOutcome, { ok: true }> | (Omit<JourneyRefusal, 'code'> & {
  code: JourneyRefusal['code'] | 'DOCUMENTED_SECTION_ONLY'
  mapSections?: BusMapSection[]; documentation?: DirectionNote[]; changesToCheck?: ChangeLead[]
})
/** Explicit selection only. Published GTFS IDs are a separate namespace. A GPS
 * fix (even with identical coordinates) cannot silently become a platform. */
export function planDakarJourney(from: DakarEndpoint, to: DakarEndpoint, options: JourneySettings, network: Network = dakarNetwork): DakarOutcome {
  if ([from, to].some(p => p.stopId === 'ter-aibd' && p.kind === undefined)) return { ok: false, code: 'OUT_OF_SCOPE', message: 'AIBD relève de la phase 2. Le calcul TER s’arrête à Diamniadio.' }
  const result = planPlaceJourney(network, from, to, options)
  if (!result.ok && (result.code === 'UNVERIFIED_ACCESS' || result.code === 'NO_PATH')) {
    const onSite = interchangeQuestion(from, to)
    if (onSite) return { ...result, message: onSite }
    const mapSections = findBusMapSections(from, to, options)
    const notes = result.code === 'UNVERIFIED_ACCESS' ? documentedDirections(from, to, options) : []
    const changes = prepareChanges(network, from, to, options)
    if (result.code === 'UNVERIFIED_ACCESS' || changes.length || mapSections.length) {
      const exact = mapSections.some(s => s.fromGapM === null && s.toGapM === null)
      return { ...result, documentation: notes, changesToCheck: changes, ...(mapSections.length ? { mapSections } : {}),
        code: exact ? 'DOCUMENTED_SECTION_ONLY' : result.code,
        message: exact ? 'Une portion de la ligne relie ces repères. Aucun départ de bus n’est confirmé pour la date et l’heure demandées.'
          : result.code === 'NO_PATH' && changes.length ? 'Aucun cheminement piéton vérifié pour relier les deux dessertes proposées ci-dessous.' : result.message }
    }
  }
  if (!result.ok && result.code === 'NO_SERVICE' && network === dakarNetwork && !hasSenegalPublicHolidayCalendar(options.departAt * 1000)) {
    return { ...result, message: 'Le calendrier des jours fériés du Sénégal n’est pas confirmé pour cette année. Aucun créneau n’est supposé.' }
  }
  if (!result.ok && result.code === 'NO_PATH' && from.stopId && to.stopId &&
      ![...network.walking.values()].some(edges => edges.some(e => !e.onlyFor)) &&
      network.places.get(from.stopId)?.kind === 'call' && network.places.get(to.stopId)?.kind === 'call') {
    const origin = from.stopId, destination = to.stopId
    const networksOf = (id: string) => network.patterns.filter(p => p.stops.includes(id))
    const here = networksOf(origin), there = networksOf(destination)
    if (!here.length || !there.length) return { ...result, message: 'Aucun parcours directionnel validé pour cette desserte.' }
    if (!here.some(p => there.includes(p))) return { ...result, message: 'Le trajet nécessite une correspondance. Aucun cheminement piéton vérifié ne relie les quais de ces réseaux.' }
    if (!here.some(p => p.stops.indexOf(destination) > p.stops.indexOf(origin))) return { ...result, message: 'Le sens retour demandé n’a pas de tracé validé. Le tracé aller n’est pas inversé.' }
    if (options.stepFreeOnly) return { ...result, message: 'L’accessibilité sans marches n’est pas vérifiée pour ce parcours.' }
  }
  return result
}
