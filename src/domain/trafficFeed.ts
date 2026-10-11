/** Contrat du proxy multisource : pas de cache persistant, pas de repli périmé. */
import { NETWORK_SOURCES } from './network'
import { isValidLatLng, readJsonBody, timedRequest, type TimedRequestOptions } from './http'
import {
  ALERT_PROXIMITY_RADIUS_M, TRAFFIC_SOURCES, aggregateAlerts, alertExpiresAt, isActiveTrafficAlert,
  type AlertSource, type TrafficAlert, type TrafficAvailability, type TrafficSourceId, type TrafficSummaryContext,
} from './trafficAlerts'
import { isFreshTrafficInstant, trafficInstant, TRAFFIC_ALERT_TTL_MS } from './trafficFreshness'

export const TRAFFIC_ALERTS_API_PATH = '/api/traffic/alerts'
export type TrafficSourceStatus = 'LIVE' | 'PARTIAL' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'STALE'
export interface TrafficSourceState {
  id: TrafficSourceId
  status: TrafficSourceStatus
  /** Date de vérification fournie par la source, non réhorodatée par le proxy. */
  checkedAt: string | null
}
export interface TrafficSnapshot {
  generatedAt: string
  sources: TrafficSourceState[]
  alerts: TrafficAlert[]
}
export type TrafficRequestStatus = 'loading' | 'ready' | 'unavailable'
type ParseResult = { ok: true; value: TrafficSnapshot } | { ok: false; reason: string }

const MAX_ALERTS = 500
const SOURCE_STATUSES: readonly string[] = ['LIVE', 'PARTIAL', 'NOT_CONFIGURED', 'UNAVAILABLE', 'STALE']

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}
function text(value: unknown, maximum: number, allowEmpty = false): value is string {
  return typeof value === 'string' && value.length <= maximum && (allowEmpty || value.trim().length > 0)
}
function texts(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 120 && value.every((item) => text(item, 160))
}
function parseSource(value: unknown): AlertSource | null {
  const raw = record(value)
  const definition = TRAFFIC_SOURCES.find((source) => source.id === raw?.id)
  if (!definition || raw?.kind !== definition.kind) return null
  // Les liens et la provenance viennent du registre, jamais d'une URL arbitraire
  // contenue dans le texte d'un incident.
  return { ...definition }
}

export function parseTrafficAlert(value: unknown): TrafficAlert | null {
  const raw = record(value)
  if (!raw || !text(raw.id, 160) || !['ACTIVE', 'RESOLVED', 'UNCONFIRMED'].includes(String(raw.status))) return null
  if (!text(raw.headlineFr, 160, raw.status !== 'ACTIVE') || !text(raw.summaryFr, 1500, raw.status !== 'ACTIVE')) return null
  const source = parseSource(raw.source)
  if (!source || !['info', 'warning', 'critical'].includes(String(raw.severity)) || !['ACTIVE', 'RESOLVED', 'UNCONFIRMED'].includes(String(raw.status))) return null
  if (trafficInstant(raw.updatedAt) === null) return null
  if (raw.confirmedAt !== null && trafficInstant(raw.confirmedAt) === null) return null
  const expiresAt = raw.expiresAt ?? null
  if (expiresAt !== null && trafficInstant(expiresAt) === null) return null
  if (!texts(raw.affectedNetworks) || !raw.affectedNetworks.every((id) => NETWORK_SOURCES.some((network) => network.id === id))) return null
  if (!texts(raw.affectedLines) || !texts(raw.affectedStopIds)) return null
  if (!((raw.lat === null && raw.lon === null) || isValidLatLng(raw.lat, raw.lon))) return null
  if (raw.status === 'ACTIVE' && raw.lat === null && (source.kind === 'TRAFFIC' || raw.affectedNetworks.length === 0)) return null
  if (raw.delayMinutes !== null && !(typeof raw.delayMinutes === 'number' && Number.isFinite(raw.delayMinutes) && raw.delayMinutes >= 0 && raw.delayMinutes <= 1440)) return null
  for (const field of ['headlineWo', 'summaryWo', 'recommendationFr', 'recommendationWo']) {
    if (raw[field] !== undefined && raw[field] !== null && !text(raw[field], field === 'headlineWo' ? 160 : 1500, true)) return null
  }
  const corroboratingSources: AlertSource[] = []
  if (raw.corroboratingSources !== undefined) {
    if (!Array.isArray(raw.corroboratingSources) || raw.corroboratingSources.length > TRAFFIC_SOURCES.length) return null
    for (const entry of raw.corroboratingSources) {
      const parsed = parseSource(entry)
      if (!parsed) return null
      if (!corroboratingSources.some((other) => other.id === parsed.id)) corroboratingSources.push(parsed)
    }
  }
  return {
    id: raw.id, headlineFr: raw.headlineFr, summaryFr: raw.summaryFr,
    headlineWo: typeof raw.headlineWo === 'string' ? raw.headlineWo : '',
    summaryWo: typeof raw.summaryWo === 'string' ? raw.summaryWo : '',
    severity: raw.severity as TrafficAlert['severity'], status: raw.status as TrafficAlert['status'],
    source, corroboratingSources,
    affectedNetworks: Array.from(new Set(raw.affectedNetworks)) as TrafficAlert['affectedNetworks'],
    affectedLines: Array.from(new Set(raw.affectedLines)), affectedStopIds: Array.from(new Set(raw.affectedStopIds)),
    lat: raw.lat as number | null, lon: raw.lon as number | null, delayMinutes: raw.delayMinutes as number | null,
    recommendationFr: typeof raw.recommendationFr === 'string' ? raw.recommendationFr : null,
    recommendationWo: typeof raw.recommendationWo === 'string' ? raw.recommendationWo : null,
    updatedAt: raw.updatedAt as string, confirmedAt: raw.confirmedAt as string | null, expiresAt: expiresAt as string | null,
  }
}

export function parseTrafficSnapshot(value: unknown, now = Date.now()): ParseResult {
  const raw = record(value)
  if (!raw || raw.region !== 'Dakar' || !isFreshTrafficInstant(raw.generatedAt, now) || !Array.isArray(raw.sources) || !Array.isArray(raw.alerts) || raw.alerts.length > MAX_ALERTS) {
    return { ok: false, reason: 'Réponse trafic invalide ou périmée.' }
  }
  const sources: TrafficSourceState[] = []
  for (const entry of raw.sources) {
    const source = record(entry)
    const definition = TRAFFIC_SOURCES.find((item) => item.id === source?.id)
    if (!source || !definition || !SOURCE_STATUSES.includes(String(source.status)) || sources.some((item) => item.id === source.id)) return { ok: false, reason: 'Provenance trafic invalide.' }
    if (source.checkedAt !== null && trafficInstant(source.checkedAt) === null) return { ok: false, reason: 'Date de vérification invalide.' }
    const status = source.status as TrafficSourceStatus
    sources.push({ id: definition.id, checkedAt: source.checkedAt as string | null,
      status: (status === 'LIVE' || status === 'PARTIAL') && !isFreshTrafficInstant(source.checkedAt, now) ? 'STALE' : status })
  }
  if (sources.length !== TRAFFIC_SOURCES.length) return { ok: false, reason: 'Couverture des sources trafic incomplète.' }
  const alerts: TrafficAlert[] = []
  for (const entry of raw.alerts) {
    const alert = parseTrafficAlert(entry)
    if (!alert) return { ok: false, reason: 'Incident trafic invalide.' }
    const source = sources.find((item) => item.id === alert.source.id)!
    if (source.status !== 'LIVE' && source.status !== 'PARTIAL') continue
    // Une preuve postérieure au relevé du flux n'est pas une preuve de ce flux.
    const observed = trafficInstant(source.checkedAt)!
    if (trafficInstant(alert.updatedAt)! > observed || (alert.confirmedAt !== null && trafficInstant(alert.confirmedAt)! > observed)) {
      source.status = 'PARTIAL'
      continue
    }
    if (alert.status === 'UNCONFIRMED' || (alert.status === 'ACTIVE' && !isActiveTrafficAlert(alert, now))) source.status = 'PARTIAL'
    alerts.push(alert)
  }
  return { ok: true, value: { generatedAt: raw.generatedAt as string, sources, alerts: aggregateAlerts(alerts, now) } }
}

/** Purge en mémoire aussi entre deux téléchargements, y compris hors ligne. */
export function expireTrafficSnapshot(snapshot: TrafficSnapshot | null, now = Date.now()): TrafficSnapshot | null {
  if (!snapshot || !isFreshTrafficInstant(snapshot.generatedAt, now)) return null
  const sources = snapshot.sources.map((source) => ({ ...source,
    status: (source.status === 'LIVE' || source.status === 'PARTIAL') && !isFreshTrafficInstant(source.checkedAt, now) ? 'STALE' as const : source.status,
  }))
  const alerts = snapshot.alerts.filter((alert) => {
    const source = sources.find((item) => item.id === alert.source.id)
    if (!source || (source.status !== 'LIVE' && source.status !== 'PARTIAL')) return false
    if (!isActiveTrafficAlert(alert, now)) {
      source.status = 'PARTIAL'
      return false
    }
    return true
  })
  return { ...snapshot, sources, alerts }
}

export function trafficSummaryContext(snapshot: TrafficSnapshot | null, requestStatus: TrafficRequestStatus, now = Date.now()): TrafficSummaryContext {
  const current = expireTrafficSnapshot(snapshot, now)
  let availability: TrafficAvailability = requestStatus === 'loading' ? 'loading' : 'unavailable'
  if (requestStatus === 'ready' && current) {
    availability = current.sources.every((source) => source.status === 'LIVE') ? 'current'
      : current.sources.some((source) => source.status === 'LIVE' || source.status === 'PARTIAL') ? 'partial' : 'unavailable'
  }
  const instants = current?.sources.filter((source) => source.status === 'LIVE' || source.status === 'PARTIAL')
    .map((source) => trafficInstant(source.checkedAt)).filter((at): at is number => at !== null) ?? []
  return { availability, checkedAt: instants.length ? new Date(Math.min(...instants)).toISOString() : null }
}

export function nextTrafficExpiry(snapshot: TrafficSnapshot | null, now = Date.now()): number | null {
  if (!snapshot) return null
  const deadlines = [trafficInstant(snapshot.generatedAt)! + TRAFFIC_ALERT_TTL_MS,
    ...snapshot.sources.flatMap((source) => {
      const at = trafficInstant(source.checkedAt)
      return (source.status === 'LIVE' || source.status === 'PARTIAL') && at !== null ? [at + TRAFFIC_ALERT_TTL_MS] : []
    }),
    ...snapshot.alerts.map(alertExpiresAt).filter((at): at is number => at !== null),
  ].filter((at) => at > now)
  return deadlines.length ? Math.min(...deadlines) : null
}

export async function fetchTrafficSnapshot(location: { lat: number; lng: number } | null, options: TimedRequestOptions = {}): Promise<TrafficSnapshot> {
  const parameters = new URLSearchParams()
  if (location && isValidLatLng(location.lat, location.lng)) {
    parameters.set('lat', String(location.lat))
    parameters.set('lon', String(location.lng))
    parameters.set('radius', String(ALERT_PROXIMITY_RADIUS_M))
  }
  const url = `${TRAFFIC_ALERTS_API_PATH}${parameters.size ? `?${parameters}` : ''}`
  return timedRequest(url, options, async (response) => {
    if (!response.ok) throw new Error('Source trafic indisponible.')
    const parsed = parseTrafficSnapshot(await readJsonBody(response))
    if (!parsed.ok) throw new Error(parsed.reason)
    return parsed.value
  })
}
