/** Passenger routing model. Coordinates are WGS84; clocks are integer UTC epoch
 * seconds (Africa/Dakar). No edge is implied by a station name or position. */
import type { RoadGraphEdge, RoadPoint, VerifiedLineGeometry } from '../domain/roadNetworkRouting'
import type { MobilityId } from '../domain/mobilityColors'

export type VehicleMode = Exclude<MobilityId, 'aftu_tata'> | 'aftu' | 'tata'
export type StepFree = 'yes' | 'no' | 'unknown'
export interface Evidence {
  status: 'reviewed' | 'candidate'
  reference: string
  date: string
}
export interface Place extends RoadPoint {
  id: string
  name: string
  /** A call is a service stop, NOT evidence of a platform, entrance or sidewalk. */
  kind: 'call' | 'platform' | 'entrance' | 'path'
  evidence: Evidence
}
export interface FrequencyWindow {
  start: number // seconds after Dakar midnight at the origin of this pattern
  end: number // exclusive
  every: number
  weekdays: readonly number[] // Sunday = 0
  holidays: 'include' | 'exclude' | 'as-weekday'
}
export type Service =
  | { kind: 'frequency'; windows: readonly FrequencyWindow[]; source: string }
  | { kind: 'timetable'; departures: readonly number[]; source: string } // dated origin departures

export interface PatternInput {
  lineId: string
  name: string
  direction: string
  network: MobilityId
  /** AFTU and TATA share the historical UI palette/filter, not a line identity. */
  busFamily?: 'aftu' | 'tata'
  /** One explicitly reviewed geometry and one ordered sequence per direction. */
  shape: VerifiedLineGeometry
  evidence: Evidence
  stops: readonly string[]
  service: Service
  times: { kind: 'offsets'; arrivals: readonly number[]; departures: readonly number[]; source: string }
    | { kind: 'model'; speedKph: number; dwellSeconds: number; source: string }
  stepFree: StepFree
}
export interface FootwayInput {
  id: string
  from: string
  to: string
  name: string
  kind: 'footway' | 'sidewalk' | 'crossing' | 'steps' | 'ramp' | 'station-path'
  access: 'public' | 'restricted' | 'unknown'
  crossingsAndBarriersChecked: boolean
  /** A station passage may be reviewed only for catching/leaving a service,
   * not as a public shortcut through the paid area. Absent = general use. */
  onlyFor?: 'access' | 'egress'
  stepFree: StepFree
  evidence: Evidence
  positions: readonly RoadPoint[]
}
/** Alternative to a reviewed LineString: the source identifies the directed
 * vehicle ways between consecutive named calls and their exact network nodes. */
export interface GraphPatternInput extends Omit<PatternInput, 'shape'> {
  geometry: Omit<VerifiedLineGeometry, 'positions'>
  sections: readonly {
    fromStop: string; toStop: string; fromNode: string; toNode: string; evidence: Evidence
    ways: readonly (Omit<RoadGraphEdge, 'meters'> & { evidence: Evidence })[]
  }[]
}
/** Observation of the physical boarding OR alighting position of ONE service
 * call. These are not walk edges: a traveller cannot cross a station by ID. */
export interface PlatformBinding {
  mode: VehicleMode; lineId: string; direction: string; stopId: string
  role: 'board' | 'alight'; platformId: string; stepFree: StepFree; evidence: Evidence
}
/** Standing at the same marked boarding position, without walking or passing a
 * gate. This directed permission is extra evidence, never inferred from two bindings. */
export type CallRef = Pick<PlatformBinding, 'mode' | 'lineId' | 'direction' | 'stopId'>
export interface SamePlatformChange {
  platformId: string; alight: CallRef; board: CallRef
  minimumSeconds: number; stepFree: StepFree; evidence: Evidence
}
export interface ObservedPlatform { place: Place; stepFree: StepFree; evidence: Evidence }
export interface Dataset {
  places: readonly Place[]
  patterns: readonly PatternInput[]
  graphPatterns?: readonly GraphPatternInput[]
  platformBindings?: readonly PlatformBinding[]
  samePlatformChanges?: readonly SamePlatformChange[]
  footways: readonly FootwayInput[]
}
export interface Section { positions: readonly RoadPoint[]; meters: number }
export type Footway = FootwayInput & Section
export interface Pattern extends PatternInput {
  mode: VehicleMode
  calls: readonly Place[]
  sections: readonly Section[]
  arrivals: readonly number[]
  departures: readonly number[]
}
export interface OnwardBoarding { pattern: Pattern; index: number; proof: SamePlatformChange }
export interface Network {
  places: ReadonlyMap<string, Place>
  patterns: readonly Pattern[]
  platforms: ReadonlyMap<Pattern, Readonly<Record<'board' | 'alight', ReadonlyMap<number, ObservedPlatform>>>>
  boarding: ReadonlyMap<string, readonly { pattern: Pattern; index: number }[]>
  samePlatform: ReadonlyMap<Pattern, ReadonlyMap<number, readonly OnwardBoarding[]>>
  walking: ReadonlyMap<string, readonly Footway[]>
  rejected: readonly string[]
}
interface Movement extends Section {
  from: Place
  to: Place
  start: number
  end: number
  stepFree: StepFree
}
export interface Ride extends Movement {
  mode: VehicleMode
  kind: 'ride'
  lineId: string
  lineName: string
  network: MobilityId
  direction: string
  stops: readonly Place[]
  source: string
  serviceSource: string
  timingSource: string
  timing: Service['kind']
  timeProfile: PatternInput['times']['kind'] // scheduled offsets or estimated running times
  /** At this boarding point, starting at the chosen run, same service day. */
  passages: readonly number[]
  headwaySeconds: number | null
  samePlatformChange?: SamePlatformChange // only on the ride boarded after this reviewed change
  changeBufferSeconds?: number // already included in the wait after a transfer
  waitSeconds: number // from previous arrival, includes any transfer buffer
}
export interface Walk extends Movement {
  kind: 'walk'
  role: 'access' | 'transfer' | 'egress' | 'direct'
  ways: readonly Footway[]
}
export type Leg = Ride | Walk
export type Criterion = 'fastest' | 'changes' | 'walking' | 'simple' | 'cadence'
export interface Itinerary {
  id: string
  best: Criterion[]
  legs: Leg[]
  start: number
  end: number
  totalSeconds: number
  rideSeconds: number
  waitSeconds: number
  walkSeconds: number
  walkMeters: number
  meters: number
  changes: number
}
export interface Query {
  origin: string
  destination: string
  departAt: number
  /** Group filter aftu_tata accepts either family; callers may also request just one. */
  modes?: readonly (VehicleMode | 'aftu_tata')[]
  maxChanges?: number
  walkSpeedMpm?: number
  maxWalkPerLegM?: number
  transferBufferSeconds?: number
  stepFreeOnly?: boolean
}
export type FailureCode = 'INVALID_QUERY' | 'SAME_PLACE' | 'UNVERIFIED_ACCESS' | 'OUT_OF_SCOPE' | 'NO_PATH' | 'NO_SERVICE'
export type Outcome = { ok: true; options: Itinerary[] } | { ok: false; code: FailureCode; message: string }
