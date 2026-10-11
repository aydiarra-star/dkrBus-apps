/**
 * Alertes actives de Dakar : seules des observations sourcées, confirmées et
 * âgées de moins d'une heure peuvent alimenter les alertes officielles.
 * Les témoignages communautaires passent par une présentation distincte,
 * clairement non vérifiée ; aucun exemple n'est une alerte active.
 * Les adaptateurs serveur conservent les dates des sources, jamais la date
 * de téléchargement comme nouvelle confirmation d'un incident ancien.
 */
import { ALL_CORRIDOR_STOPS, CORRIDOR_LINES, haversineMeters, type CorridorStop } from './corridors'
import { reportKindLabel, type StreetReport } from './streetReports'
import type { NetworkId } from './network'
import { isValidLatLng } from './http'
import { isFreshTrafficInstant, trafficInstant, TRAFFIC_ALERT_TTL_MS } from './trafficFreshness'

export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertSourceKind = 'OFFICIAL' | 'TRAFFIC' | 'COMMUNITY' | 'AI_SAMPLE'
export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'UNCONFIRMED'
export type TrafficSourceId = 'cetud' | 'ter' | 'sunubrt' | 'ddd' | 'road'
export type TrafficAvailability = 'loading' | 'current' | 'partial' | 'unavailable'

export interface AlertSource {
  id?: TrafficSourceId
  kind: AlertSourceKind
  label: string
  url?: string
}

/** Canaux documentaires, PAS des URL d'API temps réel inventées. */
export const TRAFFIC_SOURCES: readonly (AlertSource & { id: TrafficSourceId })[] = [
  { id: 'ter', kind: 'OFFICIAL', label: 'SENTER / SETER (TER)', url: 'https://sentersa.sn' },
  { id: 'sunubrt', kind: 'OFFICIAL', label: 'SunuBRT', url: 'https://sunubrt.sn' },
  { id: 'cetud', kind: 'OFFICIAL', label: 'CETUD', url: 'https://cetud.sn' },
  { id: 'ddd', kind: 'OFFICIAL', label: 'Dakar Dem Dikk', url: 'https://demdikk.sn' },
  { id: 'road', kind: 'TRAFFIC', label: 'Trafic routier géolocalisé' },
]
export const OFFICIAL_ALERT_CHANNELS = TRAFFIC_SOURCES.filter((source) => source.kind === 'OFFICIAL')
export const ALERT_PROXIMITY_RADIUS_M = 1500

export interface TrafficAlert {
  /** Identifiant canonique commun aux sources décrivant le même incident. */
  id: string
  headlineFr: string
  headlineWo: string
  summaryFr: string
  summaryWo: string
  severity: AlertSeverity
  source: AlertSource
  corroboratingSources?: AlertSource[]
  affectedNetworks: NetworkId[]
  affectedLines: string[]
  affectedStopIds: string[]
  lat: number | null
  lon: number | null
  delayMinutes: number | null
  recommendationFr: string | null
  recommendationWo: string | null
  /** Date de l'observation, pas du téléchargement. */
  updatedAt: string
  status: AlertStatus
  /** Preuve récente que l'incident est toujours actif ; null = non confirmé. */
  confirmedAt: string | null
  expiresAt: string | null
}

/** Conversion conservée pour la provenance, sans confirmer un usager ni
 * inventer un retard. Ces objets restent exclus des alertes actives. */
export function streetReportToAlert(report: StreetReport): TrafficAlert {
  const stops = report.lat !== null && report.lng !== null
    ? ALL_CORRIDOR_STOPS
      .map((stop) => ({ stop, distance: haversineMeters({ lat: report.lat!, lon: report.lng! }, stop) }))
      .filter((entry) => entry.distance <= ALERT_PROXIMITY_RADIUS_M)
      .sort((a, b) => a.distance - b.distance).slice(0, 1).map((entry) => entry.stop.id)
    : []
  return {
    id: `community-${report.id}`,
    headlineFr: `${reportKindLabel(report.kind)} · ${report.place}`,
    headlineWo: `${reportKindLabel(report.kind)} · ${report.place}`,
    summaryFr: `${report.place}${report.comment ? ` — ${report.comment}` : ''}. Signalement d’usager, non vérifié.`,
    summaryWo: `${report.place}. Nit kenn la ko wax, du ko seet ba noppi.`,
    severity: report.kind === 'INCIDENT' || report.kind === 'BLOCKED' ? 'critical' : report.kind === 'OTHER' ? 'info' : 'warning',
    source: { kind: 'COMMUNITY', label: 'Direct rue' },
    affectedNetworks: report.networkId ? [report.networkId] : [],
    affectedLines: Array.from(new Set(CORRIDOR_LINES.filter((line) => line.stopIds.some((id) => stops.includes(id))).map((line) => line.shortName))),
    affectedStopIds: stops,
    lat: report.lat,
    lon: report.lng,
    delayMinutes: null,
    recommendationFr: 'Vérifiez auprès de votre opérateur avant de partir.',
    recommendationWo: 'Seetlu bala nga dem.',
    updatedAt: report.createdAt,
    status: 'UNCONFIRMED',
    confirmedAt: null,
    expiresAt: report.expiresAt,
  }
}

export function alertExpiresAt(alert: TrafficAlert): number | null {
  const updated = trafficInstant(alert.updatedAt)
  const confirmed = trafficInstant(alert.confirmedAt)
  if (updated === null || confirmed === null) return null
  const expires = alert.expiresAt === null ? Number.POSITIVE_INFINITY : trafficInstant(alert.expiresAt)
  if (expires === null) return null
  return Math.min(updated + TRAFFIC_ALERT_TTL_MS, confirmed + TRAFFIC_ALERT_TTL_MS, expires)
}

function recognizedTrafficSource(source: AlertSource): boolean {
  return TRAFFIC_SOURCES.some((definition) => definition.id === source.id && definition.kind === source.kind)
}

export function isActiveTrafficAlert(alert: TrafficAlert, now = Date.now()): boolean {
  if (!recognizedTrafficSource(alert.source)) return false
  if (alert.status !== 'ACTIVE' || !isFreshTrafficInstant(alert.updatedAt, now) || !isFreshTrafficInstant(alert.confirmedAt, now)) return false
  const expiry = alertExpiresAt(alert)
  return expiry !== null && expiry > now
}

/**
 * Remplace le jeu précédent, dédoublonne par incident et applique le dernier
 * état connu. Une résolution (ou une perte de confirmation) plus récente
 * l'emporte sur une ancienne alerte, même publiée par une autre source.
 */
export function aggregateAlerts(alerts: readonly TrafficAlert[], now = Date.now()): TrafficAlert[] {
  const byIncident = new Map<string, TrafficAlert>()
  const statePriority = { ACTIVE: 0, UNCONFIRMED: 1, RESOLVED: 2 }
  for (const alert of alerts) {
    if (!recognizedTrafficSource(alert.source)) continue
    const updated = trafficInstant(alert.updatedAt)
    if (updated === null || updated > now) continue
    const previous = byIncident.get(alert.id)
    const previousUpdated = previous ? trafficInstant(previous.updatedAt)! : -Infinity
    if (!previous || updated > previousUpdated || (updated === previousUpdated && statePriority[alert.status] > statePriority[previous.status])) {
      byIncident.set(alert.id, alert)
    }
  }
  return [...byIncident.values()].filter((alert) => isActiveTrafficAlert(alert, now))
}

export interface RankedAlert {
  alert: TrafficAlert
  nearestStop: CorridorStop | null
  distanceM: number | null
  nearby: boolean
  priority: number
}

function nearestStopForAlert(alert: TrafficAlert, point: { lat: number; lon: number }) {
  const candidates = alert.affectedStopIds.map((id) => ALL_CORRIDOR_STOPS.find((stop) => stop.id === id))
    .filter((stop): stop is CorridorStop => Boolean(stop))
  const stop = candidates.map((candidate) => ({ stop: candidate, distanceM: haversineMeters(point, candidate) }))
    .sort((a, b) => a.distanceM - b.distanceM)[0]
  const incidentDistance = isValidLatLng(alert.lat, alert.lon)
    ? haversineMeters(point, { lat: alert.lat!, lon: alert.lon! }) : Infinity
  // Le point de l'incident compte aussi : un arrêt éloigné ne doit pas masquer
  // un accident situé juste à côté de l'usager.
  return { nearestStop: stop?.stop ?? null, distanceM: Math.min(stop?.distanceM ?? Infinity, incidentDistance) }
}

export function rankAlerts(
  alerts: readonly TrafficAlert[],
  location: { lat: number; lng: number } | null,
  radiusM = ALERT_PROXIMITY_RADIUS_M,
  now = Date.now(),
): RankedAlert[] {
  return aggregateAlerts(alerts, now).map((alert): RankedAlert => {
    const nearest = location ? nearestStopForAlert(alert, { lat: location.lat, lon: location.lng }) : null
    const distanceM = nearest && Number.isFinite(nearest.distanceM) ? nearest.distanceM : null
    const nearby = distanceM !== null && distanceM <= radiusM
    const severityScore = alert.severity === 'critical' ? 0 : alert.severity === 'warning' ? 10 : 20
    return { alert, nearestStop: nearest?.nearestStop ?? null, distanceM, nearby,
      priority: severityScore + (nearby ? 0 : distanceM === null ? 200 : 100) }
  }).sort((a, b) => a.priority - b.priority || (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity))
}

/** Les incidents routiers sont géofiltrés ; les perturbations officielles
 * du réseau de Dakar restent pertinentes même sans point GPS. */
export function relevantAlerts(ranked: readonly RankedAlert[], location: { lat: number; lng: number } | null): RankedAlert[] {
  if (!location) return [...ranked]
  return ranked.filter(({ alert, nearby }) => nearby || (
    (alert.source.kind === 'OFFICIAL' || alert.corroboratingSources?.some((source) => source.kind === 'OFFICIAL')) && alert.affectedNetworks.length > 0
  ))
}

export interface TrafficSummaryContext {
  availability: TrafficAvailability
  checkedAt: string | null
}

const UNKNOWN_TRAFFIC: TrafficSummaryContext = { availability: 'unavailable', checkedAt: null }

export function trafficCheckedAtLabel(checkedAt: string | null): string {
  const instant = trafficInstant(checkedAt)
  if (instant === null) return 'non disponible'
  return `${new Date(instant).toISOString().slice(11, 16)} (heure de Dakar)`
}

/** Synthèse locale : ne fait jamais passer une absence de flux pour du vert. */
export function aiTrafficSummaryFr(
  ranked: readonly RankedAlert[],
  location: { lat: number; lng: number } | null,
  context: TrafficSummaryContext = UNKNOWN_TRAFFIC,
  now = Date.now(),
): string {
  const active = relevantAlerts(ranked.filter(({ alert }) => isActiveTrafficAlert(alert, now)), location)
  const current = context.availability === 'current' && isFreshTrafficInstant(context.checkedAt, now)
  const checked = `Dernière vérification : ${trafficCheckedAtLabel(context.checkedAt)}.`
  if (active.length > 0) {
    const first = active.find((entry) => entry.nearby && entry.alert.severity === 'critical') ?? active[0]
    const reserve = !current ? ' Certaines sources ne sont pas actuellement vérifiables.' : ''
    return `${active.length} perturbation(s) confirmée(s) ${location && first.nearby ? 'près de vous' : 'sur le réseau de Dakar'}. ${first.alert.headlineFr}. ${first.alert.summaryFr} ${first.alert.recommendationFr ?? ''} ${checked}${reserve}`.trim()
  }
  if (current) {
    return `Trafic fluide / Aucune perturbation en cours${location ? ' dans votre rayon ni sur les réseaux suivis' : ' sur les réseaux suivis de Dakar'}. ${checked}`
  }
  const message = context.availability === 'loading'
    ? 'Actualisation des alertes en cours.'
    : context.availability === 'partial'
      ? 'Aucune perturbation confirmée à afficher. Vérification partielle : certaines sources sont indisponibles ou non confirmées.'
      : 'Informations trafic indisponibles : aucune vérification complète et récente des sources.'
  return `${message} Le trafic fluide ne peut pas être confirmé. Vérifiez auprès de votre opérateur.${location ? '' : ' Activez la localisation GPS pour les incidents à proximité.'}`
}

/** Wolof de base, mêmes preuves et mêmes réserves que la version française. */
export function aiTrafficSummaryWo(
  ranked: readonly RankedAlert[],
  location: { lat: number; lng: number } | null,
  context: TrafficSummaryContext = UNKNOWN_TRAFFIC,
  now = Date.now(),
): string {
  const active = relevantAlerts(ranked.filter(({ alert }) => isActiveTrafficAlert(alert, now)), location)
  const current = context.availability === 'current' && isFreshTrafficInstant(context.checkedAt, now)
  if (active.length > 0) {
    const first = active[0].alert
    return `${active.length} xibaar yu wóor am na ci rézo bi${location ? ' walla ci sa wet' : ''}. ${first.headlineWo || first.headlineFr}. ${first.summaryWo || first.summaryFr}${current ? '' : ' Bokk na ci source yi ñu mënul a seetlu léegi.'}`
  }
  if (current) return 'Yoon wi leer na / Amul benn jafe-jafe bu ñu dëggal léegi ci rézo yi ñu seetlu.'
  return `Xibaar yi mënul a wóor léegi. Seetlu ci sa opérateur.${location ? '' : ' Duggil GPS bi ngir gis li am ci sa wet.'}`
}

export function severityLabel(severity: AlertSeverity): string {
  return severity === 'critical' ? 'Critique' : severity === 'warning' ? 'Attention' : 'Info'
}

export function sourceLabel(source: AlertSource): string {
  switch (source.kind) {
    case 'OFFICIAL': return `Source officielle · ${source.label}`
    case 'TRAFFIC': return `Trafic routier · ${source.label}`
    case 'COMMUNITY': return 'Direct rue · non vérifié'
    case 'AI_SAMPLE': return 'Synthèse IA · exemple non actif'
  }
}

export function formatDistanceMeters(distanceM: number): string {
  return distanceM < 1000 ? `${Math.round(distanceM)} m` : `${(distanceM / 1000).toFixed(1).replace('.', ',')} km`
}

export function proximityLabel(nearestStop: CorridorStop | null, distanceM: number | null): string | null {
  if (!nearestStop || distanceM === null) return null
  return `près de ${nearestStop.name} (${formatDistanceMeters(distanceM)})`
}
