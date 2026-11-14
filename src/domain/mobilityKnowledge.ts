/** Mémoire documentaire embarquée, indépendante du GTFS et du calculateur.
 * Les points de passage textuels ne sont PAS des arrêts géolocalisés ni des
 * courses. Aucun horaire, sens retour ou transfert pédestre n'en est déduit.
 * Voir docs/mobility-research-2026-10-10.md pour les vérifications et lacunes.
 */
import catalog from '../data/mobility-lines.json'
import { searchCorridorStops } from './corridors'

export const KNOWLEDGE_CHECKED_AT = '2026-10-10'
export const BUS_LINES = catalog
export type BusLine = typeof BUS_LINES[number] | (Omit<typeof BUS_LINES[number], 'network'> & { network: 'tata' })
export interface KnowledgeReply { text: string; lineId?: string }

export interface RemoteTrafficIncident {
  id: string
  title: string
  description?: string | null
  incident_type?: string | null
  severity?: string | null
  status: string
  area_label?: string | null
  observed_at?: string | null
  expires_at?: string | null
  source_url?: string | null
  source_published_at?: string | null
  traffic_source_id?: string | null
}
export interface RemoteTrafficSource {
  id: string
  name: string
  source_type?: string | null
  url?: string | null
  status: string
  last_checked_at?: string | null
}
export interface RemoteTrafficSnapshot {
  generated_at: string
  realtime: false
  confirmed_traffic_incidents: RemoteTrafficIncident[]
  traffic_candidates: RemoteTrafficIncident[]
  traffic_sources: RemoteTrafficSource[]
}
export interface RemoteMobilityGraph {
  generated_at: string
  graph_only: true
  networks: Array<{ id: string; code: string; name?: string | null }>
  lines: Array<{ id: string; network_id: string; code: string; public_name?: string | null; status: string; source_id?: string | null }>
  directions: Array<{
    id: string
    line_id: string
    direction_code: string
    origin_label?: string | null
    destination_label?: string | null
    status: string
    direction_method?: string | null
    direction_notes?: string | null
  }>
  ordered_line_stops: Array<{
    id: string
    direction_id: string
    stop_id: string
    stop_sequence: number
    stop?: { id: string; canonical_name: string; aliases?: string[] | null } | null
  }>
  reference_stops: Array<{ id: string; canonical_name: string; aliases?: string[] | null }>
  stop_network_memberships: Array<{
    stop_id: string
    canonical_name?: string | null
    network_codes: string[]
    line_codes: string[]
    direction_codes: string[]
    has_geolocation: boolean
    interchange_status: string
    physical_interchange_verified: boolean
  }>
  service_patterns: Array<{
    id: string
    direction_id: string
    pattern_type: string
    period_label?: string | null
    service_start?: string | null
    service_end?: string | null
    headway_minutes?: number | null
    headway_min_minutes?: number | null
    headway_max_minutes?: number | null
    expected_wait_minutes?: number | null
    service_start_earliest?: string | null
    service_start_latest?: string | null
    service_end_earliest?: string | null
    service_end_latest?: string | null
    status: string
    notes?: string | null
  }>
  transfers: Array<{
    id: string
    from_stop_id: string
    to_stop_id: string
    walking_distance_m?: number | null
    walking_duration_seconds?: number | null
    accessibility_status?: string | null
    status: string
    label?: string | null
    notes?: string | null
    from_stop?: { id: string; canonical_name: string } | null
    to_stop?: { id: string; canonical_name: string } | null
  }>
  data_assertions: Array<Record<string, unknown>>
  mobility_sources: Array<{ id: string; name: string; url?: string | null; reliability_level?: string | null }>
}
let remoteMobilityGraph: RemoteMobilityGraph | null = null
export function setRemoteMobilityGraph(graph: RemoteMobilityGraph | null): void {
  remoteMobilityGraph = graph
}
let remoteTrafficSnapshot: RemoteTrafficSnapshot | null = null
export function setRemoteTrafficSnapshot(snapshot: RemoteTrafficSnapshot | null): void {
  remoteTrafficSnapshot = snapshot
}

/** Complément distant candidat : il ne remplace jamais les fiches locales validées. */
let remoteCandidateLines: BusLine[] = []
export function setRemoteCandidateLines(lines: readonly BusLine[]): void {
  remoteCandidateLines = [...lines]
}

const SOURCES = {
  ddd: 'https://cetud.sn/reseaux-de-transport/ddd/',
  aftu: 'https://cetud.sn/reseaux-de-transport/aftu/',
  aftuLines: 'https://aftu-senegal.org/infos-pratiques/',
  dddLines: 'https://demdikk.sn/reseau-urbain-dakar/',
  brtGuide: 'https://cetud.sn/wp-content/uploads/2024/11/sunubrt-guide-du-voyageur-vf.pdf',
  brtContact: 'https://sunubrt.sn/',
  terStations: 'https://sentersa.sn/gares-et-haltes/',
  terServices: 'https://sentersa.sn/service-en-gare/',
  terHours: 'https://www.terdakar.sn/les_horaires_des_trains/',
  terFares: 'https://www.terdakar.sn/ticket-voyage-aller-simple-de-quoi-s-agit-il/',
  terSubscriptions: 'https://www.terdakar.sn/quel-titre-choisir/',
  terOffers: 'https://www.terdakar.sn/les-offres-ter-de-dakar/',
  traffic: 'https://cetud.sn/observatoire/indicateurs-de-trafic/',
} as const

function source(url: string, publishedAt?: string | null, consultedAt = KNOWLEDGE_CHECKED_AT): string {
  const consultation = consultedAt ? `Consultée le ${consultedAt}` : 'Date de consultation non précisée'
  return `\nSource : ${url}\n${consultation}${publishedAt ? ` · publication du ${publishedAt}` : ' · date de publication non précisée'}. Référence documentaire, pas un suivi en direct.`
}
export function normalizeMobility(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()
}
function key(line: BusLine): string { return `${line.network}:${line.code}` }
function isRemoteCandidate(line: BusLine): boolean {
  return remoteCandidateLines.some((candidate) => key(candidate) === key(line))
}
function graphLineFor(line: BusLine) {
  if (!remoteMobilityGraph) return undefined
  const network = remoteMobilityGraph.networks.find((item) => item.code === line.network)
  if (!network) return undefined
  return remoteMobilityGraph.lines.find((item) => item.network_id === network.id && item.code === line.code)
}
function graphDirectionsFor(line: BusLine) {
  const graphLine = graphLineFor(line)
  if (!remoteMobilityGraph || !graphLine) return []
  const stopById = new Map(remoteMobilityGraph.reference_stops.map((stop) => [stop.id, stop]))
  const directions = remoteMobilityGraph.directions.filter((direction) => direction.line_id === graphLine.id)
  const outbound = directions.find((direction) => direction.direction_method === 'source_documented')
  const outboundStopIds = outbound
    ? remoteMobilityGraph.ordered_line_stops
      .filter((row) => row.direction_id === outbound.id)
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
      .map((row) => row.stop_id)
    : []
  return directions.map((direction) => {
    const orderedRows = remoteMobilityGraph!.ordered_line_stops
      .filter((row) => row.direction_id === direction.id)
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
    const stopIds = orderedRows.map((row) => row.stop_id)
    const stops = orderedRows
      .map((row) => row.stop?.canonical_name ?? stopById.get(row.stop_id)?.canonical_name ?? '')
      .filter(Boolean)
    const isDerivedReturn = direction.direction_method === 'reverse_derived'
    const valid = !isDerivedReturn || (
      outboundStopIds.length > 0
      && stopIds.length === outboundStopIds.length
      && stopIds.every((stopId, index) => stopId === outboundStopIds[outboundStopIds.length - index - 1])
    )
    return { direction, stops, stopIds, valid }
  })
}
function isReturnDirection(directionCode: string, method?: string | null): boolean {
  return /return|inbound|retour/i.test(directionCode) || /return|reverse/i.test(method ?? '')
}
function formatPattern(pattern: RemoteMobilityGraph['service_patterns'][number]): string {
  const period = pattern.period_label === 'peak' ? 'pointe'
    : pattern.period_label === 'off_peak' ? 'hors pointe'
      : pattern.period_label === 'network_average' ? 'moyenne réseau'
        : 'service'
  const interval = pattern.headway_min_minutes != null && pattern.headway_max_minutes != null
    ? `${pattern.headway_min_minutes}–${pattern.headway_max_minutes} min`
    : pattern.headway_minutes != null ? `${pattern.headway_minutes} min` : ''
  const start = pattern.service_start_earliest && pattern.service_start_latest
    ? `${pattern.service_start_earliest.slice(0, 5)}–${pattern.service_start_latest.slice(0, 5)}`
    : ''
  const end = pattern.service_end_earliest && pattern.service_end_latest
    ? `${pattern.service_end_earliest.slice(0, 5)}–${pattern.service_end_latest.slice(0, 5)}`
    : ''
  const window = start || end ? ` ; fenêtre ${start || '—'} à ${end || '—'}` : ''
  const wait = pattern.expected_wait_minutes != null ? ` ; attente de référence ${pattern.expected_wait_minutes} min` : ''
  const status = pattern.status === 'verified' ? 'validé' : 'à confirmer'
  return `${period} : ${interval || 'fréquence non précisée'}${window}${wait} (${status})`
}
function graphSupplement(line: BusLine, text: string): string {
  if (!remoteMobilityGraph) return ''
  const details = graphDirectionsFor(line)
  if (!details.length) return ''
  const sections: string[] = []
  const asksStops = /\b(arret|arrets|itineraire|parcours|aller|retour|sens)\b/.test(text)
  const asksFrequency = /\b(prochain|attente|passage|frequence|horaire|horaires|heure|depart)\b/.test(text)
  const asksTransfer = /\b(correspondance|correspondances|changer|transfert)\b/.test(text)

  if (asksStops) {
    const returnOnly = /\bretour\b/.test(text) && !/\baller\b|deux sens|aller retour/.test(text)
    const stopLines = details.flatMap(({ direction, stops, valid }) => {
      const isReturn = isReturnDirection(direction.direction_code, direction.direction_method)
      if (returnOnly && !isReturn) return []
      if (isReturn && !valid) return []
      // La fiche locale validée reste prioritaire pour son sens aller.
      if (line.waypoints.length && !isReturn) return []
      if (!stops.length) return []
      const label = isReturn ? 'Retour' : /outbound|aller/i.test(direction.direction_code) ? 'Aller' : direction.direction_code
      const status = direction.status === 'verified' ? 'validé' : 'à confirmer'
      const method = /reverse/i.test(direction.direction_method ?? '') ? ' — ordre inverse de référence' : ''
      return [`${label} (${status}${method}) : ${stops.join(' → ')}`]
    })
    if (stopLines.length) sections.push(`Séquences d’arrêts du graphe central :\n${stopLines.join('\n')}`)
    if (details.some((item) => isReturnDirection(item.direction.direction_code, item.direction.direction_method) && !item.valid)) {
      sections.push('Sens retour masqué : sa séquence ne correspond pas exactement à l’inverse du sens source. Elle ne sera pas présentée comme un itinéraire.')
    }
  }

  if (asksFrequency) {
    const patternLines = details.flatMap(({ direction }) => {
      const patterns = remoteMobilityGraph!.service_patterns.filter((pattern) => pattern.direction_id === direction.id)
      const label = isReturnDirection(direction.direction_code, direction.direction_method) ? 'Retour' : 'Aller'
      return patterns.map((pattern) => `${label} — ${formatPattern(pattern)}`)
    })
    if (patternLines.length) sections.push(`Repères de fréquence centralisés (ils ne donnent pas le prochain passage en direct) :\n${patternLines.join('\n')}`)
  }

  if (asksTransfer) {
    const stopIds = new Set(details.filter((item) => item.valid).flatMap(({ stopIds }) => stopIds))
    const shared = remoteMobilityGraph.stop_network_memberships.filter((item) =>
      stopIds.has(item.stop_id) && item.network_codes.length > 1
    )
    const transfers = remoteMobilityGraph.transfers.filter((item) =>
      stopIds.has(item.from_stop_id) || stopIds.has(item.to_stop_id)
    )
    const sharedText = shared.slice(0, 8).map((item) =>
      `${item.canonical_name ?? item.stop_id} (${item.network_codes.join('/')})`
    )
    const transferText = transfers.slice(0, 5).map((item) =>
      `${item.label ?? `${item.from_stop?.canonical_name ?? 'arrêt'} ↔ ${item.to_stop?.canonical_name ?? 'arrêt'}`} — ${item.walking_distance_m != null ? `${item.walking_distance_m} m` : 'distance non précisée'} (${item.status})`
    )
    if (sharedText.length || transferText.length) {
      sections.push(`Correspondances potentielles, non confirmées sur le terrain :\n${[...sharedText, ...transferText].join('\n')}\nUn nom partagé ou une distance indicative ne garantit pas un chemin piéton praticable.`)
    } else {
      sections.push('Aucune correspondance piétonne vérifiée dans le graphe central pour cette ligne.')
    }
  }

  return sections.join('\n\n')
}
function label(line: BusLine): string { return `${line.network.toUpperCase()} ${line.code} : ${line.origin} ↔ ${line.destination}` }
function explicitNetworks(text: string): string[] {
  return [(/\b(ddd|dem dikk)\b/.test(text) ? 'ddd' : ''), (/\baftu\b/.test(text) ? 'aftu' : ''), (/\btata\b/.test(text) ? 'tata' : '')].filter(Boolean)
}
function lineReply(line: BusLine, question: string): KnowledgeReply {
  const text = normalizeMobility(question)
  let detail: string
  if (/\b(correspondance|correspondances|changer|transfert)\b/.test(text)) {
    detail = line.waypoints.some((point) => /gare (ter|de dakar)/i.test(point))
      ? 'La fiche mentionne la gare TER / gare de Dakar comme point de passage. Cela fournit un repère pour rejoindre le TER, mais l’arrêt bus précis, le chemin piéton, les horaires coordonnés et le billet combiné ne sont pas validés ici.'
      : 'Aucune correspondance garantie documentée. Un quartier commun ne confirme ni le même arrêt, ni un chemin piéton sûr, ni des horaires coordonnés.'
  } else if (/\b(prochain|prochaine|attente|passage|frequence|horaire|horaires|heure|depart)\b/.test(text) && !/\b(ou|arrets|itineraire|parcours)\b/.test(text)) {
    detail = 'Aucun prochain départ fiable ni fréquence par ligne dans cette fiche. Je ne peux pas calculer un compte à rebours.'
  } else if (/\b(prix|tarif|ticket|cout|coute|payer)\b/.test(text)) {
    detail = 'Tarif de cette ligne non documenté dans la base consultée : à confirmer auprès du receveur ou de l’opérateur.'
  } else if (line.waypoints.length) {
    const returnOnly = /\bretour\b/.test(text) && !/\baller\b|deux sens|aller retour/.test(text)
    const graphDetails = graphDirectionsFor(line)
    const hasGraphReturn = graphDetails.some((item) =>
      isReturnDirection(item.direction.direction_code, item.direction.direction_method) && item.valid
    )
    const hasInvalidGraphReturn = graphDetails.some((item) =>
      isReturnDirection(item.direction.direction_code, item.direction.direction_method) && !item.valid
    )
    detail = returnOnly && hasGraphReturn
      ? 'Séquence retour disponible dans le graphe central.'
      : returnOnly && hasInvalidGraphReturn
        ? 'Aucune séquence retour cohérente n’est disponible dans le graphe central pour cette ligne.'
        : `Points de passage dans le sens publié :\n${line.waypoints.join(' → ')}\nCe sont des repères d’itinéraire, pas une liste d’arrêts géolocalisés. Le détail du sens retour n’est pas confirmé.`

  } else {
    detail = 'Terminaux documentés ; arrêts intermédiaires pas encore transcrits. Consultez l’opérateur pour le parcours complet.'
  }
  const supplement = graphSupplement(line, text)
  if (supplement) detail += `\n\n${supplement}`
  const candidateNote = isRemoteCandidate(line)
    ? 'Fiche candidate de la mémoire centrale : elle complète le catalogue hors ligne, sans remplacer les fiches déjà validées.\n'
    : ''
  return { text: `${candidateNote}${label(line)}\n${detail}${line.note ? `\nAttention : ${line.note}` : ''}${source(line.detailSourceUrl ?? line.sourceUrl, line.publishedAt, line.consultedAt)}`, lineId: key(line) }
}

export function busKnowledgeSummary(): string {
  const ddd = BUS_LINES.filter((line) => line.network === 'ddd').length
  const aftu = BUS_LINES.filter((line) => line.network === 'aftu').length
  return `Mémoire documentaire DDD/AFTU : ${ddd} fiches DDD et ${aftu} fiches AFTU, dont ${BUS_LINES.filter((line) => line.waypoints.length).length} parcours avec points de passage transcrits. Consultation du ${KNOWLEDGE_CHECKED_AT}. Ce catalogue n’est pas exhaustif ; les tarifs par bus, arrêts géolocalisés et correspondances garanties restent à compléter. Les fiches TATA du référentiel central sont chargées séparément lorsqu’elles sont disponibles.`
}

export function generalFareReply(): string {
  return `Tarifs de référence :\n• TER : 500 / 1 000 / 1 500 F CFA pour 1 / 2 / 3 zones en 2e classe ; 2 500 F CFA en 1re classe.\n• BRT : 400 F CFA dans une même zone ; 500 F CFA en franchissant une ou deux limites de zones.\n• DDD/AFTU : tarifs par ligne non documentés ici.\nCes tarifs ne permettent pas de calculer le coût complet d’une correspondance ni de garantir une promotion.${source(SOURCES.terFares)}${source(SOURCES.brtGuide)}`
}

function formatTrafficDate(value?: string | null): string {
  if (!value) return 'date non précisée'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function trafficKnowledgeReply(): string {
  const snapshot = remoteTrafficSnapshot
  if (!snapshot) {
    return `Aucun flux de circulation en temps réel n’est connecté. Les indicateurs CETUD consultés sont des statistiques historiques (2020–2024), pas l’état actuel d’une rue. Je ne peux pas annoncer qu’une route est fluide ni chiffrer un retard actuel. Les signalements de l’onglet Alertes restent des témoignages non vérifiés.${source(SOURCES.traffic)}`
  }

  const now = Date.now()
  const active = (rows: RemoteTrafficIncident[]) => rows.filter((row) =>
    !row.expires_at || new Date(row.expires_at).getTime() > now
  )
  const confirmed = active(snapshot.confirmed_traffic_incidents)
  const candidates = active(snapshot.traffic_candidates)

  if (confirmed.length) {
    return `Alertes routières confirmées dans Dakar Bus :\n${confirmed.slice(0, 5).map((incident) =>
      `• ${incident.title} — ${incident.area_label || 'secteur non précisé'} — ${formatTrafficDate(incident.observed_at)}${incident.source_url ? `\nSource : ${incident.source_url}` : ''}`
    ).join('\n')}\nCes alertes sont limitées aux incidents confirmés et non expirés dans la base.`
  }

  if (candidates.length) {
    return `Informations routières à vérifier — elles ne sont PAS des alertes confirmées :\n${candidates.slice(0, 5).map((incident) =>
      `• ${incident.title} — ${incident.area_label || 'secteur non précisé'} — ${formatTrafficDate(incident.source_published_at ?? incident.observed_at)}${incident.source_url ? `\nSource : ${incident.source_url}` : ''}`
    ).join('\n')}\nAucune alerte confirmée n’est actuellement enregistrée. Vérifiez la situation avant de partir.`
  }

  const monitoredNews = snapshot.traffic_sources.filter((item) =>
    item.status === 'partial' && /rss|news/i.test(item.source_type ?? '')
  )
  const checkedTimes = monitoredNews
    .map((item) => item.last_checked_at)
    .filter((value): value is string => Boolean(value))
    .sort()
  const latestCheck = checkedTimes.length ? checkedTimes[checkedTimes.length - 1] : undefined

  return `Aucune alerte routière confirmée ni piste de presse pertinente n’est actuellement enregistrée.${monitoredNews.length ? ` Les flux d’actualités de ${monitoredNews.map((item) => item.name).join(' et ')} sont surveillés ; dernière vérification : ${formatTrafficDate(latestCheck)}.` : ''} Cela ne garantit pas que les routes soient libres : aucun capteur de circulation en temps réel n’est encore connecté. Les indicateurs CETUD disponibles sont historiques, pas l’état actuel d’une rue.${source(SOURCES.traffic)}`
}

/** Réponses courtes par thème, avec provenance au lieu de remplir le chat d'un guide entier. */
function practicalReply(text: string): string | null {
  const brt = /\b(brt|sunubrt|b1|b2|b3)\b/.test(text)
  const ter = /\b(ter|train|senter|seter)\b/.test(text)
  const fares = /\b(tarif|tarifs|prix|coute|cout|payer|ticket|tickets|billet|billets)\b/.test(text)
  if (brt && ter) return fares ? generalFareReply() : null // pas de comparaison avec un seul réseau
  if (brt) {
    if (/\b(contact|telephone|joindre|appeler|whatsapp|reclamation)\b/.test(text)) return `SunuBRT : 818 55 55 55 (50 F l’appel), WhatsApp 76 215 15 15, serviceclient@sunubrt.sn. Service client annoncé 7j/7, 06h–23h : ce sont les heures du service client, pas celles des bus.${source(SOURCES.brtContact)}`
    if (/\b(zone|zones)\b/.test(text) && !fares) return `Le guide SunuBRT distingue trois zones :\n• Zone 1 : Papa Gueye Fall – Liberté 6.\n• Zone 2 : Khar Yalla – Croisement 22.\n• Zone 3 : Parcelles – Préfecture de Guédiawaye.${source(SOURCES.brtGuide)}`
    if (/\b(valider|validation|sortir|portique|refuse)\b/.test(text)) return `Validez votre titre à l’entrée ET à la sortie de la station BRT (check-in/check-out). Gardez-le jusqu’à la sortie. Si le titre est refusé, adressez-vous à un agent en station.${source(SOURCES.brtGuide)}`
    if (/\b(handicap|pmr|accessible|accessibilite|fauteuil)\b/.test(text)) return `Le guide SunuBRT indique que les stations et véhicules sont accessibles aux personnes à mobilité réduite. Je ne dispose pas de l’état actuel des équipements ; demandez assistance à un agent.${source(SOURCES.brtGuide)}`
    if (/\b(acheter|recharger|recharge|abonnement|carte)\b/.test(text)) return `Titres SunuBRT : guichets en station, agences de Guédiawaye, Grand Médine et Petersen, dépositaires agréés. Le guide prévoit aussi l’application et la e-boutique ; leur disponibilité actuelle n’est pas garantie, le site était en maintenance à la consultation. L’abonnement 30 jours utilise une carte nominative ; le billet sans contact ne porte pas d’abonnement.${source(SOURCES.brtGuide)}`
    if (fares || /\b(enfant|enfants|gratuit)\b/.test(text)) return `Tarifs de référence SunuBRT : 400 F CFA dans une même zone ; 500 F CFA en franchissant une ou deux limites de zones. Voyage gratuit pour les enfants accompagnés de moins de 4 ans, selon le guide. Tarifs à reconfirmer au guichet ; aucune promotion ancienne n’est appliquée.${source(SOURCES.brtGuide)}`
    if (/\bb1\b/.test(text)) return `Le guide SunuBRT décrit B1 entre Guédiawaye et Petersen, 7j/7, avec une fréquence de référence de 6 minutes et un renfort entre Grand Médine et Petersen. Ce guide ne garantit ni un départ imminent ni les modalités actuelles du renfort ; le site opérateur était en maintenance.${source(SOURCES.brtGuide)}`
    if (/\bb[23]\b/.test(text)) return 'Les pages B2/B3 de SunuBRT étaient en maintenance à la consultation. Des extraits indexés décrivent des services semi-express, mais je ne confirme pas leur service actuel à partir de ces seuls extraits. Contactez SunuBRT au 818 55 55 55.' + source(SOURCES.brtContact)
  }
  if (ter) {
    if (/\b(horaire|horaires|frequence|frequences|premier|dernier|ouvre|ferme)\b/.test(text) && !/\b(prochain|prochaine|dans combien)\b/.test(text)) return `Horaires de référence publiés par TER Dakar :\n• Lundi–samedi : premier départ 05h35 de Diamniadio, 05h45 de Dakar ; toutes les 10 min jusqu’à 20h55.\n• Puis toutes les 20 min de 21h05 à 22h05 (dernier départ).\n• Dimanches et jours fériés : toutes les 20 min de 06h25 à 22h05.\nCes heures ne sont pas celles de chaque gare intermédiaire et ne garantissent pas le prochain passage.${source(SOURCES.terHours)}`
    if (/\b(abonnement|abonnements|mensuel|hebdo|hebdomadaire)\b/.test(text)) return `Abonnements adultes TER de référence, 2e classe :\n• Mensuel : 15 000 / 30 000 / 45 000 F CFA pour 1 / 2 / 3 zones, du 1er à la fin du mois.\n• Hebdomadaire : 6 000 / 12 000 / 18 000 F CFA, du lundi au dimanche.\nCarte Sama TER nominative. Des offres jeunes et enfants existent : consultez les conditions d’âge et de zones sur la page de l’opérateur ; ce résumé ne leur applique pas automatiquement un tarif adulte.${source(SOURCES.terSubscriptions)}`
    if (/\b(enfant|enfants|gratuit)\b/.test(text)) return `Le site TER Dakar annonce la gratuité pour les enfants de moins de 5 ans. Les autres offres enfants et jeunes dépendent de l’âge et du titre choisi.${source(SOURCES.terOffers)}`
    if (fares || /\b(sama|paiement)\b/.test(text)) return `Ticket TER, aller simple de référence :\n• 2e classe : 500 F CFA (1 zone), 1 000 F CFA (2 zones), 1 500 F CFA (3 zones).\n• 1re classe : 2 500 F CFA, quelle que soit la zone.\nTicket papier QR code valable 5 jours, acheté aux guichets ou distributeurs ; espèces et monnaie mobile. Cela ne signifie pas des voyages illimités pendant 5 jours.${source(SOURCES.terFares)}`
    if (/\b(commerce|commerces|service|services|kiosque|senter)\b/.test(text)) return `SENTER indique 83 espaces commerciaux répartis sur 13 gares et haltes entre Dakar et Diamniadio, dont 58 kiosques sur les parvis. Contact : contact@senter.sn. Le site institutionnel présente aussi des chiffres de projet plus larges : je ne les transforme pas en desserte aujourd’hui confirmée vers l’AIBD.${source(SOURCES.terServices)}`
    if (/\b(aibd|aeroport|14 gares)\b/.test(text)) return `Le référentiel de trajet embarqué reste limité à Dakar–Diamniadio. Les présentations SENTER mentionnent 14 gares et l’AIBD, tandis que sa page Services en gare décrit 13 gares et haltes Dakar–Diamniadio. Ces pages seules ne suffisent pas à confirmer l’ouverture et les horaires d’une extension vers l’aéroport.${source(SOURCES.terStations)}`
  }
  if (/\b(circulation|embouteillage|embouteillages|trafic routier|trafic|accident|travaux routiers|route fermée)\b/.test(text)) return trafficKnowledgeReply()
  return null
}

function mentions(place: string, question: string): boolean {
  const name = normalizeMobility(place).replace(/^terminus /, '').replace(/\s*\(.*/, '')
  return name.length >= 4 && ` ${question} `.includes(` ${name} `)
}
function busRouteReply(question: string, networks: string[]): KnowledgeReply | null {
  const route = /\b(?:de|depuis) (.+?) (?:a|vers|jusqu a) (.+?)(?: en bus| en ddd| en aftu| en tata| avec .*)?$/.exec(question)
  if (!route) return null
  const [, from, to] = route
  // Préserver les parcours TER/BRT déjà calculables, sauf choix bus explicite.
  if (!networks.length && searchCorridorStops(from).length && searchCorridorStops(to).length) return null
  type RouteMatch = { line: BusLine; directionLabel: string; candidate: boolean }
  const findMatches = (pool: readonly BusLine[]): RouteMatch[] => pool.flatMap((line) => {
    const graphDetails = graphDirectionsFor(line)
    const sequences: Array<{ label: string; stops: string[]; candidate: boolean }> = []
    if (line.waypoints.length) {
      sequences.push({ label: 'sens publié', stops: line.waypoints, candidate: isRemoteCandidate(line) })
    }
    for (const item of graphDetails) {
      const isReturn = isReturnDirection(item.direction.direction_code, item.direction.direction_method)
      // La fiche locale reste prioritaire pour le sens aller ; le graphe complète le retour.
      if (line.waypoints.length && !isReturn) continue
      if (isReturn && !item.valid) continue
      if (!item.stops.length) continue
      sequences.push({
        label: isReturn ? 'retour' : 'sens de référence',
        stops: item.stops,
        candidate: item.direction.status !== 'verified',
      })
    }
    if (!sequences.length) sequences.push({ label: 'terminus uniquement', stops: [line.origin, line.destination], candidate: true })
    return sequences.flatMap((sequence) => {
      const startIndex = sequence.stops.findIndex((point) => mentions(from, normalizeMobility(point)))
      const endIndex = sequence.stops.findIndex((point) => mentions(to, normalizeMobility(point)))
      return startIndex >= 0 && endIndex > startIndex
        ? [{ line, directionLabel: sequence.label, candidate: sequence.candidate }]
        : []
    })
  })
  const candidates = BUS_LINES.filter((line) => (!networks.length || networks.includes(line.network)) && !line.note?.startsWith('Divergence'))
  const localMatches = findMatches(candidates)
  const matched = localMatches.length
    ? localMatches
    : findMatches(remoteCandidateLines.filter((line) => !networks.length || networks.includes(line.network)))
  if (!matched.length) return networks.length ? { text: 'Aucun parcours direct documenté dans ce sens. Une ligne peut néanmoins exister ; précisez numéro, quartier et sens. Correspondances et retour non validés.' } : null
  const candidatePrefix = localMatches.length ? '' : 'Pistes candidates de la mémoire centrale (à confirmer auprès de l’opérateur).\n'
  const rows = matched.slice(0, 4).map((match) =>
    `• ${label(match.line)} — ${match.directionLabel}${match.candidate ? ' (à confirmer)' : ''}`
  )
  const sourceLinks = [...new Set(matched.slice(0, 4).map((match) => match.line.detailSourceUrl ?? match.line.sourceUrl))]
  return {
    text: `${candidatePrefix}Pistes documentaires pour ${from} → ${to} :\n${rows.join('\n')}\nÀ confirmer avant le départ : l’arrêt d’embarquement précis n’est pas garanti ; ni durée, ni prochain départ garanti ne sont fournis.${sourceLinks.map((url) => source(url)).join('')}`,
    ...(matched.length === 1 ? { lineId: key(matched[0].line) } : {}),
  }
}

export function answerMobilityKnowledge(question: string, lastLineId?: string | null): KnowledgeReply | null {
  const text = normalizeMobility(question)
  const networks = explicitNetworks(text)
  const code = /\b(?:ligne|bus|ddd|aftu|tata)\s*(?:numero\s*|n\s*)?0*(\d+[ab]?|to1)\b/.exec(text)?.[1]?.toUpperCase()
  if (code) {
    const localMatches = BUS_LINES.filter((line) => line.code === code && (!networks.length || networks.includes(line.network)))
    const matches = localMatches.length ? localMatches : remoteCandidateLines.filter((line) => line.code === code && (!networks.length || networks.includes(line.network)))
    if (matches.length > 1) return { text: `Ce numéro existe sur plusieurs réseaux :\n${matches.map((line) => `• ${label(line)}`).join('\n')}\nPrécisez DDD ou AFTU pour éviter de vous orienter vers le mauvais bus.` }
    if (matches.length === 1) {
      const reply = lineReply(matches[0], question)
      /* TATA reste un réseau distinct ; aucune réécriture en AFTU. */
      return reply
    }
    return { text: `La ligne ${code}${networks.length ? ` ${networks.join('/')}` : ''} n’est pas documentée dans ma mémoire actuelle. Cela ne prouve pas son absence du réseau. Précisez l’opérateur ou consultez son plan officiel ; je n’invente ni numéro ni parcours.` }
  }
  if (lastLineId && /^(et |ses |les horaires|les arrets|son |elle passe|le prix)/.test(text) && !networks.length && !/\b(ter|brt|train|meteo|temperature)\b/.test(text)) {
    const line = BUS_LINES.find((entry) => key(entry) === lastLineId)
      ?? remoteCandidateLines.find((entry) => key(entry) === lastLineId)
    if (line) return lineReply(line, question)
  }
  const practical = practicalReply(text)
  if (practical) return { text: practical }
  if (!/\b(ter|brt|train)\b/.test(text)) {
    const route = busRouteReply(text, networks)
    if (route) return route
  }
  if (networks.length) {
    const lines = [...BUS_LINES, ...remoteCandidateLines].filter((line, index, all) => networks.includes(line.network) && all.findIndex((item) => key(item) === key(line)) === index)
    if (/\b(liste|lignes|numeros)\b/.test(text)) return { text: `${networks.map((network) => network.toUpperCase()).join(' / ')} : numéros documentés dans la mémoire (pas une garantie d’exhaustivité) :\n${networks.map((network) => `${network.toUpperCase()} : ${lines.filter((line) => line.network === network).map((line) => line.code).join(', ')}`).join('\n')}\nDemandez « itinéraire AFTU 53 » ou « ligne DDD 1 » pour le détail.${networks[0] === 'tata' ? '' : source(networks[0] === 'ddd' ? SOURCES.dddLines : SOURCES.aftuLines)}` }
    if (/\b(telephone|contact|joindre|appeler)\b/.test(text)) return { text: networks.includes('ddd') ? `DDD : 33 824 10 10 ; info@demdikk.sn.${source(SOURCES.ddd)}` : networks.includes('aftu') ? `AFTU : +221 33 859 02 88 ; siège Zone de captage, 440–441 Dakar.${source(SOURCES.aftuLines)}` : 'Je ne dispose pas encore d’un contact opérateur TATA vérifié dans le référentiel.' }
    if (/\b(arret|arrets|passe|dessert|ligne|aller)\b/.test(text)) {
      const serving = lines.filter((line) => [line.origin, line.destination, ...line.waypoints].some((point) => mentions(point, text)))
      if (serving.length) return { text: `Fiches mentionnant ce lieu :\n${serving.slice(0, 6).map((line) => `• ${label(line)}`).join('\n')}\nRepères textuels seulement, pas des arrêts géolocalisés. Précisez le numéro pour le parcours et ses réserves.${networks[0] === 'tata' ? '' : source(networks[0] === 'ddd' ? SOURCES.dddLines : SOURCES.aftuLines)}` }
    }
    if (/\btata\b/.test(text)) return { text: `Le réseau TATA est consulté séparément d’AFTU. Les fiches candidates TATA disponibles dans le référentiel central sont affichées sous leur propre réseau ; si aucune fiche n’est trouvée, je ne remplace pas TATA par AFTU. ${busKnowledgeSummary()}` }
    if (/\b(presente|presentation|reseau|connaitre|connais|c est quoi)\b/.test(text)) return { text: networks.includes('ddd') ? `CETUD décrit DDD avec 38 lignes, 400 autobus et une amplitude générale 06h–21h. Ce n’est pas l’horaire de chaque ligne. ${busKnowledgeSummary()}${source(SOURCES.ddd)}` : networks.includes('aftu') ? `CETUD décrit AFTU avec 72 lignes, 2 300 bus, 14 GIE et une amplitude générale 06h–21h. Ce n’est pas l’horaire de chaque ligne. ${busKnowledgeSummary()}${source(SOURCES.aftu)}` : `Le réseau TATA est interrogé séparément d’AFTU. Les fiches et parcours TATA ne sont affichés que lorsqu’ils existent dans le référentiel central et restent candidats tant qu’ils ne sont pas validés. ${busKnowledgeSummary()}` }
  }
  return null
}
