import { DDD_PUBLISHED_DEPARTURE_WINDOWS } from '../data/dddPublishedDepartureWindows'
import { BUS_SECTION_MARKERS } from '../data/busSectionReview'
import { BUS_SECTION_WAYS, type BusWay } from '../data/busSectionWays'
import { dwellMinutes, REFERENCE_COMMERCIAL_SPEED_KPH } from '../domain/assumptions'
import { boundedDddWindows } from '../domain/dddOriginWindows'
import { sliceVerifiedRouteSegment } from '../domain/routeGeometrySlice'
import { clockMinutes } from '../domain/stopPassageCountdown'
import { busScopes, orderedWayVertices } from './busGeography'
import type { Dataset, Evidence, FrequencyWindow, PatternInput, Place } from './model'

const evidence = (reference: string): Evidence => ({ status: 'reviewed', date: '2026-11-19', reference })
const source = 'Dakar Dem Dikk · demdikk.sn/chatbot-arrets/'
const platforms: readonly [node: number, version: number, name: string][] = [
  [4666430960, 2, 'École Manguiers'], [4666430958, 7, 'Police Médina'],
  [4666430955, 2, 'Rue 31 × Blaise Diagne'], [4666430953, 5, 'Marché Tilène'],
  [4666430951, 6, 'Rue 11 × Blaise Diagne'], [4666430950, 2, 'Stade Iba Mar Diop'],
  [4666430947, 7, 'Crédit Foncier'], [4666430945, 6, 'El Malick Sandaga'],
]
/** Offline check of the outbound platform roles/order, not of the two independent roundabout arcs. */
export const medinaRoutePin = { id: 6951328, version: 28, sequences: [platforms.map(([node]) => ['n',node,'platform'])] }
const empty: Dataset = { places: [], patterns: [], footways: [] }
// The first six platforms on the old service are not lost if an extension fails its checks.
type Ways = Readonly<Record<number, BusWay>>
function outbound(count: 6 | 8, roads: Ways): Dataset {
  const scope = busScopes.find(s => s.review.id === 'ddd-1-sahm' && s.review.relation === 6951328 && s.review.version === 28)
  if (!scope || !platforms.slice(0,6).every(([n], i) => scope.review.markers[i+3] === n)) return empty
  const places: Place[] = []
  for (const [i, [node, version, label]] of platforms.slice(0,count).entries()) {
    const pin = BUS_SECTION_MARKERS[node]
    if (!pin || pin[0] !== version) return empty
    places.push({ id: `ddd-1-medina-${node}`, name: `${label} · DDD 1 vers Leclerc`, kind: 'platform', lat: pin[1], lon: pin[2],
      evidence: evidence(`${source} n° ${34+i} · © OpenStreetMap, quai ${node} v${version}, relation 6951328 v28, membre ${25+i}`) })
  }
  // The relation is broken at the Poste roundabout. The independently traced
  // Parcelles → Leclerc shape (ArcGIS layer 1, OID 25) takes its south-west
  // arc, NOT a straight connection. The two partial ways are NOT bus members.
  const extra = count === 8 ? [430805832,411081532,108821823,108821791,362032755,430617858] : []
  return section(places, roads, {
    ways: [...scope.review.ways, ...extra], direction: count === 8 ? 'Médina → Sandaga · vers Leclerc' : 'Leclerc · portion Manguiers → Stade',
    sourceId: count === 8 ? '6951328/v28:25-32+Poste/OID25' : '6951328/v28:25-30', shapeSource: count === 8 ? 'REVIEWED_OSM_WAYS' : 'OSM_ROUTE_RELATION',
    origin: 'Parcelles Assainies', destination: 'Place Leclerc', phase: 3518,
    phaseNote: 'environ 59 min jusqu’à Manguiers (durées de l’archive : 35 à 77 min)',
    reference: count === 8 ? 'Quais OSM 25–32 ; giratoire recoupé avec ArcGIS OID 25 · voir docs/validation-physique.md' : 'Quais 25–30 de la relation DDD 1 vers Leclerc',
  })
}
function inbound(roads: Ways): Dataset {
  // Independent of the forward and the 4/7 route memberships. Only these two
  // consecutive DDD 1 calls after Leclerc agree with the geolocated DDD list,
  // the line-1 archive occurrences D_441 / D_421 and the mapped roadside poles.
  // In particular, calls 55 and 56 nearer the opposing carriageway stay OUT.
  const reviewed = [[4666430956,3,'PMI Médina'], [4666430957,7,'Rue 37 × Blaise Diagne']] as const
  const places: Place[] = []
  for (const [i,[node, version, label]] of reviewed.entries()) {
    const m = BUS_SECTION_MARKERS[node]
    if (!m || m[0] !== version) return empty
    places.push({ id: `ddd-1-medina-retour-${node}`, name: `${label} · DDD 1 vers Parcelles`, lat: m[1], lon: m[2], kind: 'platform',
      evidence: evidence(`${source} n° ${57+i} après Leclerc ; PassBi DDD_01_LECLERC n° ${11+i} ; © OpenStreetMap quai ${node} v${version}`) })
  }
  return section(places, roads, {
    ways: [25860686,430812008,162751433,430810297,108697076], direction: 'Vers Parcelles · PMI Médina → Rue 37',
    sourceId: 'DDD1/retour:57-58/Sahm', shapeSource: 'REVIEWED_OSM_WAYS',
    origin: 'Place Leclerc', destination: 'Parcelles Assainies', phase: 1066,
    phaseNote: 'environ 18 min jusqu’à PMI Médina (durées de l’archive : 11 à 23 min)',
    reference: 'Deux appels après Leclerc sur les chaussées montantes au giratoire de Sahm. Aucune permission de changer de bus.',
  })
}
interface SectionSpec {
  ways: number[]; direction: string; sourceId: string; shapeSource: 'OSM_ROUTE_RELATION' | 'REVIEWED_OSM_WAYS'
  origin: string; destination: string; phase: number; phaseNote: string; reference: string
}
function section(places: Place[], roads: Ways, spec: SectionSpec): Dataset {
  const { ways, direction, sourceId, shapeSource, origin, destination, phase, phaseNote, reference } = spec
  const bound = DDD_PUBLISHED_DEPARTURE_WINDOWS.find(w => w.service === 'Ligne 1' && w.origin === origin && w.destination === destination)
  const vertices = orderedWayVertices(ways, roads)
  if (!vertices || !bound) return empty
  const network = 'ddd', lineId = 'ddd-1-medina'
  const shape: PatternInput['shape'] = { lineId, network, directionId: direction, verified: true, sourceId,
    source: shapeSource, positions: vertices.map(([,lat,lon]) => ({lat,lon})) }
  const sliced = sliceVerifiedRouteSegment(shape, places[0], places.at(-1)!, 20)
  if (!sliced || !places.slice(1).every((p,i) => sliceVerifiedRouteSegment(shape, places[i], p, 20))) return empty
  // Independent terminal windows and *relative* model phases for the two
  // directions. No archived calendar or archived trip is activated.
  const windows: FrequencyWindow[] = []
  for (const w of boundedDddWindows(bound.firstDeparture, bound.lastDeparture)) {
    const a = clockMinutes(w.start)! * 60 + phase, b = clockMinutes(w.end)! * 60 + phase, every = w.every * 60
    const common = { every, weekdays: [1,2,3,4,5], holidays: 'exclude' } as const
    windows.push({ ...common, start: a, end: b+1 })
    if (w.includePublishedLast && (b-a) % every) windows.push({ ...common, start: b, end: b+1 })
  }
  return { places, footways: [], patterns: [{ network, lineId, direction, name: 'DDD 1', stops: places.map(p => p.id), stepFree: 'unknown',
    shape: { ...shape, positions: sliced }, evidence: evidence(`${source} · © OpenStreetMap (ODbL) · ${reference}`),
    service: { kind: 'frequency', windows, source: `DDD publie ${bound.firstDeparture}–${bound.lastDeparture} au départ de ${origin}, pas à cet arrêt. Le modèle suppose une cadence de 8 ou 13 min et ${phaseNote}. Aucun suivi du véhicule.` },
    times: { kind: 'model', speedKph: REFERENCE_COMMERCIAL_SPEED_KPH.ddd, dwellSeconds: dwellMinutes('ddd')*60, source: 'Distance sur la chaussée du sens / vitesse modèle et arrêts intermédiaires. Pas un horaire observé.' },
  }] }
}
export function medinaService(roads: Ways = BUS_SECTION_WAYS): Dataset {
  const eight = outbound(8, roads), a = eight.patterns.length ? eight : outbound(6, roads), b = inbound(roads)
  return { places: [...a.places, ...b.places], patterns: [...a.patterns, ...b.patterns], footways: [] }
}
