import type {
  RemoteTrafficIncident,
  RemoteTrafficSnapshot,
  RemoteTrafficSource,
} from './trafficBrainApi'

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatDate(value?: string | null): string {
  if (!value) return 'date non précisée'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'date non précisée'
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

function sourceName(snapshot: RemoteTrafficSnapshot, id?: string | null): string {
  return snapshot.traffic_sources.find((source) => source.id === id)?.name ?? 'source non identifiée'
}

function incidentTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    accident: 'accident',
    road_closure: 'fermeture de route',
    roadworks: 'travaux',
    congestion: 'ralentissement ou congestion',
    weather_disruption: 'perturbation météo',
    traffic_news: 'information circulation',
  }
  return labels[value] ?? value.replace(/_/g, ' ')
}

function severityLabel(value: string): string {
  const labels: Record<string, string> = {
    low: 'faible',
    moderate: 'modérée',
    high: 'élevée',
    critical: 'critique',
    unknown: 'non évaluée',
  }
  return labels[value] ?? 'non évaluée'
}

function numberFromMetadata(source: RemoteTrafficSource, key: string): number | null {
  const value = source.metadata?.[key]
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function sourceStatusLabel(source: RemoteTrafficSource): string {
  if (source.status === 'partial') {
    const items = numberFromMetadata(source, 'last_feed_item_count')
    const candidates = numberFromMetadata(source, 'last_traffic_candidate_count')
    if (items !== null) {
      return `lecture partielle : ${items} articles parcourus, ${candidates ?? 0} signalement(s) trafic extrait(s)`
    }
    return 'collecte partielle'
  }
  if (source.status === 'unavailable') {
    const error = String(source.metadata?.last_error ?? '')
    if (error.includes('403')) return 'indisponible : accès refusé'
    if (error.includes('503')) return 'indisponible : service source non disponible'
    return 'indisponible'
  }
  if (source.status === 'stale') return 'données anciennes'
  if (source.status === 'active') return 'active'
  if (source.requires_credentials) return 'non configurée : accès partenaire ou identifiants requis'
  return 'non configurée'
}

function incidentLine(snapshot: RemoteTrafficSnapshot, incident: RemoteTrafficIncident, confirmed: boolean): string {
  const area = incident.area_label ? ` — ${incident.area_label}` : ' — zone non précisée'
  const source = sourceName(snapshot, incident.traffic_source_id)
  const date = formatDate(incident.source_published_at ?? incident.observed_at)
  const label = confirmed ? 'Alerte confirmée' : 'Signalement à vérifier'
  const severity = confirmed ? ` · gravité ${severityLabel(incident.severity)}` : ''
  return `• ${label} : ${incident.title}${area} · ${incidentTypeLabel(incident.incident_type)}${severity} · ${date} · ${source}`
}

/**
 * Présente les incidents confirmés comme alertes et les articles/signalements
 * non vérifiés comme simples pistes. Ne déduit jamais que les routes sont libres.
 */
export function answerRemoteTrafficQuestion(
  question: string,
  snapshot: RemoteTrafficSnapshot | null | undefined,
): string | null {
  if (!snapshot) return null
  const text = normalize(question)
  const asksNearby = /\b(autour de moi|pres de moi|mon trajet|sur mon trajet)\b/.test(text)
  const confirmed = snapshot.confirmed_traffic_incidents.filter((incident) => incident.status === 'confirmed')
  const candidates = snapshot.traffic_candidates.filter((incident) =>
    incident.status === 'unverified' || incident.status === 'reported'
  )
  const prefix = asksNearby
    ? 'Je ne dispose pas de votre position dans cette vérification. '
    : ''

  if (confirmed.length) {
    const lines = confirmed.slice(0, 8).map((incident) => incidentLine(snapshot, incident, true))
    const sourceUrls = [...new Set(confirmed.map((incident) => incident.source_url).filter((url): url is string => Boolean(url)))]
    const sourceLine = sourceUrls.length ? `\nSource : ${sourceUrls.join(' ; ')}` : ''
    const candidateText = candidates.length
      ? `\n\nEn complément, ${candidates.length} signalement(s) restent non confirmés et ne sont pas des alertes.`
      : ''
    return `${prefix}Alertes confirmées enregistrées dans le référentiel :\n${lines.join('\n')}${candidateText}\n\nDernière lecture du référentiel : ${formatDate(snapshot.generated_at)}. Ce flux n'est pas un capteur de circulation en temps réel.${sourceLine}`
  }

  if (candidates.length) {
    const lines = candidates.slice(0, 8).map((incident) => incidentLine(snapshot, incident, false))
    const sourceUrls = [...new Set(candidates.map((incident) => incident.source_url).filter((url): url is string => Boolean(url)))]
    const sourceLine = sourceUrls.length ? `\nSource : ${sourceUrls.join(' ; ')}` : ''
    return `${prefix}Aucune alerte confirmée n'est enregistrée. En revanche, voici les signalements non vérifiés à contrôler :\n${lines.join('\n')}\n\nIls ne doivent pas être présentés comme des incidents confirmés. Dernière lecture : ${formatDate(snapshot.generated_at)}.${sourceLine}`
  }

  const usefulSources = snapshot.traffic_sources
    .filter((source) => ['partial', 'unavailable', 'stale'].includes(source.status) || source.requires_credentials)
    .sort((a, b) => {
      const rank = (source: RemoteTrafficSource) => source.status === 'partial' ? 0 : source.status === 'unavailable' ? 1 : 2
      return rank(a) - rank(b) || a.name.localeCompare(b.name, 'fr')
    })
    .slice(0, 6)
  const sourceLines = usefulSources.map((source) => {
    const checked = source.status === 'partial' && source.last_checked_at
      ? ` · dernière lecture ${formatDate(source.last_checked_at)}`
      : ''
    return `• ${source.name} : ${sourceStatusLabel(source)}${checked}`
  })
  const sourceSummary = sourceLines.length
    ? `\nÉtat des sources :\n${sourceLines.join('\n')}`
    : ''
  return `${prefix}Aucune alerte confirmée ni aucun signalement actif n'est enregistré dans Supabase à la dernière lecture (${formatDate(snapshot.generated_at)}). Cela ne signifie pas que la circulation est fluide. Les sources de presse sont des signaux secondaires, pas des capteurs routiers ; aucune alerte n'est confirmée automatiquement.${sourceSummary}\n\nAucun flux public de circulation en direct n'est actuellement validé.`
}
