import { projectStopToLine } from '../domain/roadNetworkRouting'
import type { Dataset, Evidence, FootwayInput, Place, PlatformBinding } from '../routing/model'

// © OpenStreetMap contributors, ODbL 1.0. These are two site-specific
// reviews, NOT a resolver for arbitrary stop areas, centroids or nearby ways.
// See data/bus-sections/acces-scat-urbam.md for the identities and limits.
const reviewed = (reference: string): Evidence => ({ status: 'reviewed', date: '2026-11-18', reference: `© OpenStreetMap · ${reference}` })
const towardsPetersen = 'Préfecture de Guédiawaye → Petersen'
const towardsGuediawaye = 'Vers Guédiawaye · portion Petersen → Gueule Tapée'

// [version, latitude, longitude]. Vehicle stops, platform markers and access
// vertices stay distinct; only the four places below enter the passenger form.
const nodes: Readonly<Record<number, readonly [number, number, number]>> = {
  11738664176: [3,14.7369859,-17.4552396], 11739915374: [2,14.7369474,-17.4551404],
  11739915373: [2,14.7369650,-17.4551893],
  13376900325: [1,14.7374660,-17.4549499], 13376900326: [1,14.7373054,-17.4550269],
  13376900327: [1,14.7366283,-17.4553478], 13376900328: [1,14.7363768,-17.4554546],
  13376764678: [1,14.6766438,-17.4406354], 13376764679: [1,14.6773724,-17.4411235],
  13376766987: [2,14.6766543,-17.4406168], 13377966011: [1,14.6773569,-17.4411392],
}
const position = (id: number) => ({ lat: nodes[id][1], lon: nodes[id][2] })
/** Offline QA only. A route pairs a stop with a platform in traversal order;
 * a stop_area is an UNORDERED set and must not be read that way. */
export function stationOsmPins() {
  const stop = (id: number) => ['n', id, 'stop'], quay = (id: number) => ['n', id, 'platform']
  return {
    markers: Object.entries(nodes).map(([id, tuple]) => [Number(id), ...tuple]),
    ways: [[1458592674,1,13376900325,13376900326], [1458592675,3,13376900326,13376900327],
      [1458592676,1,13376900327,13376900328], [1458592673,1,13376900325], [1458592677,1,13376900328]].map(([id,v,...refs]) =>
        [id,v,refs.map(n => [n,nodes[n][1],nodes[n][2]])]), // last two only check the islet membership, not a crossing
    relations: [
      { id: 19961937, version: 4, sequences: [[stop(11738664176),quay(11739915373)], [stop(13376764678),quay(13376766987)]] },
      { id: 19961993, version: 3, sequences: [[stop(11739915374),quay(11739915373)], [stop(13376764679),quay(13377966011)]] },
      { id: 17357331, version: 4, members: [stop(11739915374),stop(11738664176),quay(11739915373),['w',1458592675,'platform']] },
      { id: 19961714, version: 2, members: [stop(13376764679),quay(13376766987),['w',1458575518,'platform'],['w',1458575520,'platform'],stop(13376764678),quay(13377966011)] },
    ],
  }
}

// In 19961937 only the alighting role at the *last* model call is admitted.
// The opposite route names a DIFFERENT platform, >80 m from that call.
const petersen: Place = { id: 'brt-petersen-quai-arrivee', name: 'Petersen · quai de descente B1', kind: 'platform',
  ...position(13376766987), evidence: reviewed('Papa Gueye Fall · quai 13376766987 v2') }
const arrival: PlatformBinding = { mode: 'brt', lineId: 'brt-b1', direction: towardsPetersen, stopId: 'brt-petersen',
  role: 'alight', platformId: petersen.id, stepFree: 'unknown', evidence: reviewed('B1 19961937 v4 · stop 13376764678 / platform 13376766987') }

function scatUrbam(): Dataset {
  const northEnd = position(13376900326)
  const southEnd = position(13376900327)
  // The two B1 route relations designate precisely this same platform node.
  // In 17357331 v4 it represents the single mapped central platform way.
  // Linear reference ON that way; the route node itself isn't a way vertex.
  // Never draw a chord from it, move the reference call or cross the busway.
  const observed = position(11739915373)
  const projection = projectStopToLine(observed, [northEnd, southEnd])
  if (!projection || projection.offsetM > 0.2 || projection.fraction <= 0 || projection.fraction >= 1) {
    return { places: [], patterns: [], footways: [] } // the pinned review no longer agrees
  }
  const platform: Place = { id: 'brt-scat-quai-central', name: 'Scat Urbam · quai central B1', kind: 'platform',
    lat: northEnd.lat + projection.fraction * (southEnd.lat - northEnd.lat), lon: northEnd.lon + projection.fraction * (southEnd.lon - northEnd.lon),
    evidence: reviewed('Scat Urbam · stop_area 17357331 v4 · quai 11739915373 v2 repéré sur 1458592675 v3') }
  const north: Place = { id: 'landmark:scat-ilot-nord', name: 'Scat Urbam · îlot du passage piéton nord', kind: 'path',
    ...position(13376900325), evidence: reviewed('nœud 13376900325 v1 · jonction 1458592673/1458592674') }
  const south: Place = { id: 'landmark:scat-ilot-sud', name: 'Scat Urbam · îlot du passage piéton sud', kind: 'path',
    ...position(13376900328), evidence: reviewed('nœud 13376900328 v1 · jonction 1458592676/1458592677') }
  const platformBindings: PlatformBinding[] = []
  for (const [direction, pair] of [[towardsPetersen, '19961937 v4 · stop 11738664176'], [towardsGuediawaye, '19961993 v3 · stop 11739915374']]) {
    for (const role of ['board', 'alight'] as const) platformBindings.push({ mode: 'brt', lineId: 'brt-b1', direction, role,
      stopId: 'brt-scat-urbam', platformId: platform.id, stepFree: 'unknown', evidence: reviewed(`B1 ${pair} / platform 11739915373 v2 · ${platform.evidence.reference}`) })
  }
  const footways: FootwayInput[] = []
  for (const [island, end, way] of [[north, northEnd, 1458592674], [south, southEnd, 1458592676]] as const) {
    // Both directions reviewed on these specific passenger paths. No claim
    // about crossing the street, a free passage, kerbs, gradients or gates.
    const common = { kind: 'station-path', access: 'public', stepFree: 'unknown', crossingsAndBarriersChecked: true,
      evidence: reviewed(`way ${way} v1 + portion du quai 1458592675 v3 · accès voyageurs, hors traversée des chaussées`) } as const
    footways.push({ ...common, id: `scat:${way}:entree`, from: island.id, to: platform.id, onlyFor: 'access',
      name: 'Depuis l’îlot, suivre l’accès puis le quai central', positions: [island, end, platform] },
    { ...common, id: `scat:${way}:sortie`, from: platform.id, to: island.id, onlyFor: 'egress',
      name: 'Suivre le quai puis l’accès jusqu’à l’îlot', positions: [platform, end, island] })
  }
  return { places: [north, south, platform], patterns: [], platformBindings, footways }
}
const scat = scatUrbam()
export const REVIEWED_PASSENGER_LINKS: Dataset = { ...scat, places: [...scat.places, petersen], platformBindings: [...(scat.platformBindings ?? []), arrival] }
