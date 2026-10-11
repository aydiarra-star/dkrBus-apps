/** Fresh community observations: useful signals, never AI-certified facts. */
import { haversineMeters } from './corridors'
import { NETWORK_SOURCES } from './network'
import { isValidLatLng } from './http'
import { isFreshTrafficInstant } from './trafficFreshness'
import {
  MAX_COMMENT_LENGTH, MAX_PLACE_LENGTH, parseStreetReports, reportKindLabel, streetReportExpiresAt,
  STREET_REPORT_KINDS, type StreetReport, type StreetReportDraft,
} from './streetReports'
import {
  ALERT_PROXIMITY_RADIUS_M, aiTrafficSummaryFr, aiTrafficSummaryWo, isActiveTrafficAlert, relevantAlerts,
  type RankedAlert, type TrafficAlert, type TrafficSummaryContext,
} from './trafficAlerts'

export type DraftAssessment = { ok: true; value: StreetReportDraft } | { ok: false; reason: string }

/** Local Assistant rules: validate form/coherence, NOT the reality of an event. */
export function assessStreetReport(draft: StreetReportDraft): DraftAssessment {
  if (!STREET_REPORT_KINDS.some((item) => item.id === draft.kind)) return { ok: false, reason: 'Choisissez une catégorie connue.' }
  const place = typeof draft.place === 'string' ? draft.place.replace(/\s+/g, ' ').trim() : ''
  if (draft.comment !== undefined && draft.comment !== null && typeof draft.comment !== 'string') return { ok: false, reason: 'La précision doit être du texte.' }
  const comment = draft.comment?.replace(/\s+/g, ' ').trim() || null
  if (place.length < 3 || place.length > MAX_PLACE_LENGTH) return { ok: false, reason: 'Indiquez une portion de route de 3 à 80 caractères.' }
  if (comment && comment.length > MAX_COMMENT_LENGTH) return { ok: false, reason: 'La précision ne peut pas dépasser 140 caractères.' }
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]|<\s*\/?\s*[a-z!]/i.test(`${place} ${comment ?? ''}`)) {
    return { ok: false, reason: 'Utilisez du texte simple, sans balises ni caractères de contrôle.' }
  }
  if (draft.networkId && !NETWORK_SOURCES.some((network) => network.id === draft.networkId)) return { ok: false, reason: 'Réseau inconnu.' }
  const lat = draft.lat ?? null, lng = draft.lng ?? null
  if ((lat !== null || lng !== null) && (!isValidLatLng(lat, lng) || !(
    lat! >= 14.5 && lat! <= 15.05 && lng! >= -17.7 && lng! <= -16.8
  ))) return { ok: false, reason: 'La position jointe doit être dans la région de Dakar. Retirez-la si vous signalez sans être sur place.' }
  return { ok: true, value: { kind: draft.kind, place, comment, networkId: draft.networkId ?? null, lat, lng } }
}

export interface RankedStreetReport {
  report: StreetReport
  distanceM: number | null
  nearby: boolean
  priority: number
}

/** Every call rechecks the clock; no name-based geocoding or expiry extension. */
export function rankStreetReports(reports: readonly StreetReport[], location: { lat: number; lng: number } | null,
  now = Date.now(), radiusM = ALERT_PROXIMITY_RADIUS_M): RankedStreetReport[] {
  return parseStreetReports(reports, now).map((report) => {
    const distanceM = location && isValidLatLng(location.lat, location.lng) && isValidLatLng(report.lat, report.lng)
      ? haversineMeters({ lat: location.lat, lon: location.lng }, { lat: report.lat!, lon: report.lng! }) : null
    const nearby = distanceM !== null && distanceM <= radiusM
    return { report, distanceM, nearby, priority: nearby ? 0 : distanceM === null ? 200 : 100 }
  }).sort((a, b) => a.priority - b.priority || (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity)
    || Date.parse(b.report.createdAt) - Date.parse(a.report.createdAt))
}

export function relevantStreetReports(ranked: readonly RankedStreetReport[], location: { lat: number; lng: number } | null): RankedStreetReport[] {
  // An unknown location is NOT evidence of presence in the user's radius.
  return location ? ranked.filter((entry) => entry.nearby) : [...ranked]
}

export function assistantStreetReportSummary(report: StreetReport): string {
  return `${reportKindLabel(report.kind)} signalé par un usager à ${report.place}.${report.comment ? ` Précision de l’usager : « ${report.comment} ».` : ''} Témoignage non vérifié, pas une alerte officielle.`
}

/** Presentation only. This object must NEVER enter aggregateAlerts/feed proofs. */
export function communityDisplayAlert(report: StreetReport): TrafficAlert {
  return {
    id: `community-${report.id}`, headlineFr: `${reportKindLabel(report.kind)} · ${report.place}`, headlineWo: '',
    summaryFr: assistantStreetReportSummary(report), summaryWo: '',
    severity: report.kind === 'OTHER' ? 'info' : 'warning', source: { kind: 'COMMUNITY', label: 'Direct rue' },
    affectedNetworks: report.networkId ? [report.networkId] : [], affectedLines: [], affectedStopIds: [],
    lat: report.lat, lon: report.lng, delayMinutes: null, recommendationFr: null, recommendationWo: null,
    updatedAt: report.createdAt, confirmedAt: null, expiresAt: report.expiresAt, status: 'UNCONFIRMED',
  }
}

export function trafficEmptyState(context: TrafficSummaryContext, location: { lat: number; lng: number } | null, now = Date.now()) {
  if (context.availability === 'current' && isFreshTrafficInstant(context.checkedAt, now)) return {
    title: 'Trafic fluide / Aucune perturbation en cours.', eyebrow: 'À JOUR',
    detail: 'Aucun incident actif confirmé dans votre rayon ou sur les réseaux suivis.',
  }
  if (context.availability === 'loading') return {
    title: 'Actualisation des alertes en cours.', eyebrow: 'ACTUALISATION',
    detail: 'Recherche de signalements de moins de 60 minutes. Aucune ancienne alerte n’est conservée.',
  }
  return {
    title: `Aucune perturbation récente signalée${location ? ' dans votre zone' : ' dans l’application'}.`,
    eyebrow: context.availability === 'partial' ? 'VEILLE PARTIELLE' : 'VEILLE EN COURS',
    detail: `${context.availability === 'partial' ? 'Vérification des sources incomplète.' : 'Les sources officielles ne sont pas actuellement vérifiables.'} Ce constat porte uniquement sur les données recueillies : il ne confirme pas un trafic fluide. Aucune ancienne alerte n’est conservée.`,
  }
}

/** Same current observations for panel, chat, search, and notifications. */
export function communityAwareTrafficSummary(official: readonly RankedAlert[], community: readonly RankedStreetReport[],
  location: { lat: number; lng: number } | null, context: TrafficSummaryContext, now = Date.now()) {
  const active = relevantAlerts(official.filter(({ alert }) => isActiveTrafficAlert(alert, now)), location)
  const reports = relevantStreetReports(rankStreetReports(community.map(({ report }) => report), location, now), location)
  if (reports.length) {
    const first = reports[0].report
    // A fresh community warning prevents a misleading green summary, even
    // when all official feeds happen to report no incident.
    const officialFr = active.length ? aiTrafficSummaryFr(active, location, context, now)
      : 'Aucune perturbation confirmée par les flux officiels à afficher.'
    return {
      fr: `${officialFr} Direct rue : ${reports.length} signalement(s) récent(s) d’usagers${location ? ' dans votre rayon' : ' recueilli(s)'}. ${assistantStreetReportSummary(first)} L’Assistant contrôle la forme et la fraîcheur, pas la véracité du constat.`,
      wo: `${active.length ? aiTrafficSummaryWo(active, location, context, now) : ''} Direct rue : ${reports.length} xibaar yu bees yu nit ñi wax. Ñu seetul dëgg gi.`,
    }
  }
  if (active.length || context.availability === 'current' || context.availability === 'loading') return {
    fr: aiTrafficSummaryFr(active, location, context, now), wo: aiTrafficSummaryWo(active, location, context, now),
  }
  const fallback = trafficEmptyState(context, location, now)
  return { fr: `${fallback.title} ${fallback.detail}${location ? '' : ' Activez le GPS pour filtrer les incidents à proximité.'}`,
    wo: 'Amul xibaar bu bees bu ñu jot léegi. Loolu du dëggal ne yoon wi leer na. Seetlu ci sa opérateur.' }
}

export function nextCommunityExpiry(reports: readonly StreetReport[], now = Date.now()): number | null {
  const values = reports.map(streetReportExpiresAt).filter((at): at is number => at !== null && at > now)
  return values.length ? Math.min(...values) : null
}
