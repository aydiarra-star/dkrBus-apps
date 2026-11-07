/**
 * Estimation empirique de l'attente DDD/AFTU à partir de passages observés.
 *
 * Module isolé : non branché à l'interface ni au moteur TER/BRT.
 * Il estime une attente statistique par ligne, sens, arrêt, type de jour et
 * période de la journée. Il ne fabrique jamais une heure exacte de passage.
 */

export type ObservedNetworkId = 'ddd' | 'aftu'
export type ServiceDayKind = 'WEEKDAY' | 'SATURDAY' | 'SUNDAY'
export type ServicePeriod = 'MORNING_PEAK' | 'DAYTIME' | 'EVENING_PEAK' | 'EVENING'

export interface ObservedPassage {
  networkId: ObservedNetworkId
  lineId: string
  directionId: string
  stopId: string
  observedAt: string
  collectedBy: 'explicit-user-action'
}

export interface WaitEstimateQuery {
  networkId: ObservedNetworkId
  lineId: string
  directionId: string
  stopId: string
  now: number
}

export interface WaitEstimate {
  kind: 'OBSERVED_WAIT_ESTIMATE'
  status: 'USABLE'
  networkId: ObservedNetworkId
  lineId: string
  directionId: string
  stopId: string
  serviceDay: ServiceDayKind
  servicePeriod: ServicePeriod
  meanWaitMinutes: number
  waitRangeMinutes: { min: number; max: number }
  observedIntervals: number
  lastObservedAt: string
  maxObservationAgeDays: number
  note: string
}

export type WaitEstimateResult =
  | WaitEstimate
  | { kind: 'NONE'; reason: 'UNREADABLE' | 'OUTSIDE_SERVICE_PERIOD' | 'INSUFFICIENT_OBSERVATIONS' }

export const OBSERVED_WAIT_POLICY = {
  minIntervals: 12,
  maxAgeDays: 60,
  minIntervalSeconds: 45,
  maxIntervalMinutes: 180,
  serviceStartHour: 6,
  serviceEndHour: 21,
} as const

const DAY_MS = 86_400_000
const MINUTE_MS = 60_000

function serviceDayKind(date: Date): ServiceDayKind {
  const day = date.getUTCDay()
  return day === 6 ? 'SATURDAY' : day === 0 ? 'SUNDAY' : 'WEEKDAY'
}

function servicePeriod(hour: number): ServicePeriod | null {
  if (hour >= 6 && hour < 9) return 'MORNING_PEAK'
  if (hour >= 9 && hour < 16) return 'DAYTIME'
  if (hour >= 16 && hour < 19) return 'EVENING_PEAK'
  if (hour >= 19 && hour < OBSERVED_WAIT_POLICY.serviceEndHour) return 'EVENING'
  return null
}

function quantile(sorted: readonly number[], proportion: number): number {
  if (sorted.length === 0) return 0
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(proportion * sorted.length) - 1))
  return sorted[index]
}

/**
 * Estime le temps d'attente moyen statistique à l'arrêt.
 *
 * Pour une arrivée aléatoire dans un intervalle H, l'attente moyenne vaut
 * E(H²)/(2E(H)); cette formule tient compte de l'irrégularité des passages.
 * La fourchette est construite à partir des quartiles observés, divisés par 2.
 * Les passages sont strictement séparés par ligne, sens, arrêt, jour et période.
 */
export function estimateObservedWait(
  observations: readonly ObservedPassage[],
  query: WaitEstimateQuery,
): WaitEstimateResult {
  if (!Number.isFinite(query.now) || !query.lineId.trim() || !query.directionId.trim() || !query.stopId.trim()) {
    return { kind: 'NONE', reason: 'UNREADABLE' }
  }

  const nowDate = new Date(query.now)
  const dayKind = serviceDayKind(nowDate)
  const period = servicePeriod(nowDate.getUTCHours())
  if (period === null) return { kind: 'NONE', reason: 'OUTSIDE_SERVICE_PERIOD' }

  const cutoff = query.now - OBSERVED_WAIT_POLICY.maxAgeDays * DAY_MS
  const timestamps = observations
    .filter((item) =>
      item.networkId === query.networkId
      && item.lineId === query.lineId
      && item.directionId === query.directionId
      && item.stopId === query.stopId
      && item.collectedBy === 'explicit-user-action',
    )
    .map((item) => Date.parse(item.observedAt))
    .filter((timestamp) => {
      if (!Number.isFinite(timestamp) || timestamp > query.now || timestamp < cutoff) return false
      const date = new Date(timestamp)
      return serviceDayKind(date) === dayKind && servicePeriod(date.getUTCHours()) === period
    })
    .sort((a, b) => a - b)

  const unique = timestamps.filter((value, index) => index === 0 || value !== timestamps[index - 1])
  const intervals: number[] = []
  for (let index = 1; index < unique.length; index += 1) {
    const seconds = (unique[index] - unique[index - 1]) / 1000
    if (seconds < OBSERVED_WAIT_POLICY.minIntervalSeconds) continue
    const minutes = seconds / 60
    if (minutes > OBSERVED_WAIT_POLICY.maxIntervalMinutes) continue
    intervals.push(minutes)
  }

  if (intervals.length < OBSERVED_WAIT_POLICY.minIntervals) {
    return { kind: 'NONE', reason: 'INSUFFICIENT_OBSERVATIONS' }
  }

  const sorted = [...intervals].sort((a, b) => a - b)
  const meanInterval = intervals.reduce((sum, value) => sum + value, 0) / intervals.length
  const meanSquaredInterval = intervals.reduce((sum, value) => sum + value * value, 0) / intervals.length
  const meanWaitMinutes = meanSquaredInterval / (2 * meanInterval)
  const lowWait = quantile(sorted, 0.25) / 2
  const highWait = quantile(sorted, 0.75) / 2
  const lastObservedAt = new Date(unique[unique.length - 1]).toISOString()
  const ageDays = Math.max(0, (query.now - unique[unique.length - 1]) / DAY_MS)

  return {
    kind: 'OBSERVED_WAIT_ESTIMATE',
    status: 'USABLE',
    networkId: query.networkId,
    lineId: query.lineId,
    directionId: query.directionId,
    stopId: query.stopId,
    serviceDay: dayKind,
    servicePeriod: period,
    meanWaitMinutes: Math.round(meanWaitMinutes * 10) / 10,
    waitRangeMinutes: {
      min: Math.max(1, Math.floor(lowWait)),
      max: Math.max(1, Math.ceil(highWait)),
    },
    observedIntervals: intervals.length,
    lastObservedAt,
    maxObservationAgeDays: Math.round(ageDays * 10) / 10,
    note: 'Attente moyenne estimée à partir de passages signalés à cet arrêt, sur cette ligne et dans ce sens. Ce n’est pas un horaire garanti ni du temps réel.',
  }
}

/** Valide une observation avant stockage ou agrégation. */
export function isUsablePassageObservation(
  observation: ObservedPassage,
  now: number,
): boolean {
  if (!Number.isFinite(now) || observation.collectedBy !== 'explicit-user-action') return false
  if (!observation.lineId.trim() || !observation.directionId.trim() || !observation.stopId.trim()) return false
  const observedAt = Date.parse(observation.observedAt)
  if (!Number.isFinite(observedAt) || observedAt > now) return false
  if (now - observedAt > OBSERVED_WAIT_POLICY.maxAgeDays * DAY_MS) return false
  return observation.networkId === 'ddd' || observation.networkId === 'aftu'
}
